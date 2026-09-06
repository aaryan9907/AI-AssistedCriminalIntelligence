"""
Automated Test Suite for API Layer, NLP Entity Resolution, and Provenance Invariants
SIH26189 – AI-Assisted Criminal Intelligence & Link Discovery Platform
"""

import unittest
from graph_engine import IntelGraphEngine
from nlp_service import FirNlpEngine
from evaluation import evaluate_ground_truth
import main


class TestApiAndNlpSuite(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = main.graph_engine
        cls.nlp = main.nlp_engine

    def test_01_health_and_stats(self):
        stats = main.get_current_system_stats()
        self.assertEqual(stats["systemStatus"], "ONLINE")
        self.assertEqual(stats["totalEntities"], 171)
        self.assertEqual(stats["totalRelationships"], 514)
        self.assertGreaterEqual(stats["totalRecords"], 600)
        self.assertIn("activeCases", stats)

    def test_02_entities_retrieval(self):
        p003 = self.engine.entities.get("P003")
        self.assertIsNotNone(p003)
        self.assertEqual(p003["type"], "PERSON")
        self.assertIn("name", p003)

        # Entity lookup by id and name
        found = False
        for e in self.engine.entities.values():
            if e["id"] == "P003":
                found = True
                break
        self.assertTrue(found)

    def test_03_graph_structure(self):
        self.assertEqual(len(self.engine.entities), 171)
        self.assertEqual(len(self.engine.relationships), 514)
        self.assertEqual(sum(len(n) for n in self.engine.adj.values()), 1028)
        # Check edge map consistency
        first_edge = self.engine.relationships[0]
        s, t = first_edge["source"], first_edge["target"]
        self.assertIn((s, t), self.engine.edge_map)
        self.assertIn((t, s), self.engine.edge_map)

    def test_04_shortest_path_with_provenance(self):
        # Known multi-hop path: P003 -> ... -> P020
        path = self.engine.find_shortest_path("P003", "P020")
        self.assertIsNotNone(path)
        self.assertGreater(len(path), 2)
        self.assertEqual(path[0]["entityId"], "P003")
        self.assertEqual(path[-1]["entityId"], "P020")
        # Ensure every intermediate step has stepEdge with evidence provenance
        for step in path[:-1]:
            self.assertIn("stepEdge", step)
            self.assertIn("relationshipType", step["stepEdge"])
            self.assertIn("evidenceId", step["stepEdge"])
            self.assertIn("confidence", step["stepEdge"])

    def test_05_no_path_handling(self):
        # Invalid / disconnected entity
        path = self.engine.find_shortest_path("P003", "NON_EXISTENT_XYZ")
        self.assertIsNone(path)

    def test_06_hidden_relationship_discovery(self):
        res = self.engine.find_hidden_relationships("P003", max_hops=5, limit=5)
        self.assertEqual(res["source_entity"]["id"], "P003")
        self.assertGreater(len(res["leads"]), 0)
        for lead in res["leads"]:
            self.assertGreaterEqual(lead["path_length"], 2)
            self.assertLessEqual(lead["path_length"], 5)
            self.assertTrue(lead["human_verification_required"])
            self.assertGreater(len(lead["why_flagged"]), 0)
            self.assertGreater(len(lead["supporting_records"]), 0)

    def test_07_direct_relationship_exclusion(self):
        # 1-hop direct neighbors of P003 must NEVER appear as hidden leads
        direct_neighbors = {neighbor for neighbor, _ in self.engine.adj["P003"]}
        res = self.engine.find_hidden_relationships("P003", max_hops=5, limit=10)
        for lead in res["leads"]:
            tgt_id = lead["target_entity"]["id"]
            self.assertNotIn(tgt_id, direct_neighbors, f"Direct neighbor {tgt_id} leaked into hidden leads")

    def test_08_ground_truth_isolation(self):
        # Verify that ground_truth table is NEVER imported or referenced inside IntelGraphEngine
        with open("graph_engine.py", "r", encoding="utf-8") as f:
            code = f.read()
        self.assertNotIn("ground_truth_hidden_relationships.csv", code)

    def test_09_evidence_record_indexing(self):
        self.assertGreater(len(self.engine.evidence_records), 600)
        # Check specific records from different domains
        comm_rec = self.engine.evidence_records.get("COMM0001")
        self.assertIsNotNone(comm_rec)
        self.assertEqual(comm_rec["type"], "COMMUNICATION")

        pve_rec = self.engine.evidence_records.get("PVE001")
        self.assertIsNotNone(pve_rec)
        self.assertEqual(pve_rec["type"], "SURVEILLANCE_VEHICLE")

    def test_10_timeline_chronology(self):
        timeline = self.engine.get_timeline_events()
        self.assertGreater(len(timeline), 500)
        # Ensure timestamp exists and items are non-empty
        for event in timeline[:20]:
            self.assertIn("timestamp", event)
            self.assertIn("type", event)
            self.assertIn("title", event)

    def test_11_top_investigative_leads(self):
        leads = self.engine.get_top_investigative_leads()
        self.assertGreater(len(leads), 0)
        for lead in leads:
            self.assertTrue(lead["requires_human_verification"])
            self.assertIn("confidence", lead)
            self.assertIn("supporting_record_ids", lead)
            self.assertIn("path", lead)

    def test_12_fir_nlp_entity_resolution(self):
        sample_narrative = (
            "During surveillance near Crescent Mall on 2026-02-02, officers contacted O. Rajagopalan "
            "at telephone number 7875270817 regarding sedan bearing registration DL01UX5951."
        )
        res = self.nlp.extract_from_narrative(sample_narrative, case_id="CASE04")
        self.assertGreaterEqual(res["resolved_count"], 3)

        resolved_ids = {e["canonical_id"] for e in res["extracted_entities"] if e["canonical_id"]}
        # P004 is Omkar Rajagopalan
        self.assertIn("P004", resolved_ids)
        # PH029 has number 7875270817
        self.assertIn("PH029", resolved_ids)
        # VH04 has plate DL01UX5951
        self.assertIn("VH04", resolved_ids)

    def test_13_name_abbreviation_and_plate_formatting(self):
        # Abbreviated names resolution
        cid, conf, sigs = self.nlp.resolve_person("O. Rajagopalan")
        self.assertEqual(cid, "P004")
        self.assertGreaterEqual(conf, 0.90)

        # Formatted license plate normalization
        norm_plate = self.nlp._normalize_plate("UP-16-AA-1646")
        self.assertEqual(norm_plate, "UP16AA1646")
        self.assertIn(norm_plate, self.nlp.vehicles_by_plate)

        norm_plate_spaces = self.nlp._normalize_plate("UP 16 AA 1646")
        self.assertEqual(norm_plate_spaces, "UP16AA1646")


if __name__ == "__main__":
    unittest.main()
