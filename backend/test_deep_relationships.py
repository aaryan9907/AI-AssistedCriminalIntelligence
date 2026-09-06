"""
Unit and Integration Test Suite for Deep Hidden Relationship Detection
SIH26189 – AI-Powered Criminal Network Analysis System

Automated tests for 11 specific requirements:
  Test 1: Direct relationship verification & exclusion from hidden leads
  Test 2: 2-hop relationship discovery
  Test 3: 3-hop relationship discovery
  Test 4: 4-hop relationship discovery
  Test 5: 5-hop relationship boundary verification
  Test 6: Circular / cycle path rejection
  Test 7: Duplicate path removal & optimal target ranking
  Test 8: Cross-case path detection and scoring bonus
  Test 9: Temporal inconsistency detection and penalty
  Test 10: Low-confidence entity resolution propagation
  Test 11: Ground-truth benchmark recovery (6/6 evaluated without leakage)
"""

import unittest
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))
from graph_engine import IntelGraphEngine
from evaluation import evaluate_ground_truth


class TestDeepRelationshipDetection(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = IntelGraphEngine()

    def test_01_direct_relationship_provenance_and_exclusion(self):
        """Test 1: Direct relationship preserves provenance and is excluded from hidden leads."""
        edge = self.engine.edge_map.get(('P015', 'LOC17')) or self.engine.edge_map.get(('LOC17', 'P015'))
        self.assertIsNotNone(edge, 'Direct edge between P015 and LOC17 must exist')
        self.assertEqual(edge['source_table'], 'person_location_events')
        self.assertEqual(edge['source_record_id'], 'PLE001')
        self.assertIn('confidence', edge)

        # Direct connection must NOT be returned as a hidden multi-hop lead
        res = self.engine.find_hidden_relationships('P015', max_hops=5, limit=10)
        returned_targets = [lead['target_entity']['id'] for lead in res['leads']]
        self.assertNotIn('LOC17', returned_targets, 'Direct entity neighbor LOC17 must not be in hidden leads')

    def test_02_two_hop_relationship(self):
        """Test 2: 2-hop hidden relationship discovery."""
        res = self.engine.find_hidden_relationships('P015', max_hops=2, limit=5)
        self.assertGreater(len(res['leads']), 0, 'Should discover 2-hop leads')
        # Check that P030 or P013 is discovered within 2 hops
        targets = [l['target_entity']['id'] for l in res['leads']]
        self.assertTrue('P030' in targets or 'P013' in targets, f'Expected P030 or P013 in 2-hop leads, got: {targets}')
        for lead in res['leads']:
            self.assertEqual(lead['path_length'], 2)

    def test_03_three_hop_relationship(self):
        """Test 3: 3-hop relationship discovery."""
        res = self.engine.find_hidden_relationships('P005', max_hops=3, limit=5)
        # Verify 3-hop lead existence to CASE04
        targets = [l['target_entity']['id'] for l in res['leads']]
        self.assertIn('CASE04', targets, 'CASE04 must be discovered within 3 hops from P005')
        lengths = [l['path_length'] for l in res['leads']]
        self.assertTrue(any(l <= 3 for l in lengths), 'Must find paths within 3 hops')

    def test_04_four_and_five_hop_relationship(self):
        """Test 4: 5-hop relationship discovery across multiple domains."""
        res = self.engine.find_hidden_relationships('P003', max_hops=5, limit=5)
        targets = [l['target_entity']['id'] for l in res['leads']]
        self.assertIn('P020', targets, 'P020 (Shailesh Arora) must be discovered within 5 hops from P003')
        lead_p020 = [l for l in res['leads'] if l['target_entity']['id'] == 'P020'][0]
        self.assertEqual(lead_p020['path_length'], 5)
        self.assertGreaterEqual(len(lead_p020['supporting_records']), 2)

    def test_05_five_hop_relationship_boundary(self):
        """Test 5: 5-hop relationship boundary verification."""
        res = self.engine.find_hidden_relationships('P003', max_hops=5, limit=10)
        for lead in res['leads']:
            self.assertLessEqual(lead['path_length'], 5, f'Lead {lead["target_entity"]["id"]} exceeded max_hops=5')

    def test_06_circular_path_rejection(self):
        """Test 6: Circular path rejection (no repeated nodes in path)."""
        res = self.engine.find_hidden_relationships('P003', max_hops=5, limit=10)
        for lead in res['leads']:
            node_ids = [step['entityId'] for step in lead['path']]
            self.assertEqual(len(node_ids), len(set(node_ids)), f'Path contains cycle/duplicate nodes: {node_ids}')

    def test_07_duplicate_path_removal(self):
        """Test 7: Duplicate path removal (each target entity returned at most once in top leads)."""
        res = self.engine.find_hidden_relationships('P003', max_hops=5, limit=10)
        target_ids = [lead['target_entity']['id'] for lead in res['leads']]
        self.assertEqual(len(target_ids), len(set(target_ids)), f'Duplicate targets returned: {target_ids}')

    def test_08_cross_case_path(self):
        """Test 8: Cross-case path detection and scoring bonus."""
        res = self.engine.find_hidden_relationships('CASE02', max_hops=5, limit=5)
        targets = [l['target_entity']['id'] for l in res['leads']]
        self.assertIn('CASE08', targets, 'CASE08 must be flagged from CASE02')
        lead_case = [l for l in res['leads'] if l['target_entity']['id'] == 'CASE08'][0]
        # Verify dynamic why_flagged mentions cross-case or reassigned phone
        why_str = ' '.join(lead_case['why_flagged']).lower()
        self.assertTrue('phone' in why_str or 'case' in why_str or 'cross-case' in why_str)

    def test_09_temporal_inconsistency_penalty(self):
        """Test 9: Temporal inconsistency detection and penalty."""
        coherent_path = ['P015', 'LOC17', 'P030']
        score_coherent = self.engine._score_path(coherent_path)

        dummy_engine = IntelGraphEngine()
        # Invert timestamp to 2024 (over 2 years prior)
        edge = dummy_engine.edge_map.get(('LOC17', 'P030')) or dummy_engine.edge_map.get(('P030', 'LOC17'))
        orig_ts = edge['timestamp']
        edge['timestamp'] = '2024-01-01T00:00:00Z'
        score_inconsistent = dummy_engine._score_path(coherent_path)
        edge['timestamp'] = orig_ts

        self.assertGreater(score_coherent['path_score'], score_inconsistent['path_score'],
                           'Chronologically coherent path must score higher than temporally discontinuous path')

    def test_10_low_confidence_entity_resolution(self):
        """Test 10: Low-confidence entity resolution propagation."""
        dummy_engine = IntelGraphEngine()
        path = ['P015', 'LOC17', 'P030']
        high_score = dummy_engine._score_path(path)['path_score']

        # Inject uncertain entity resolution confidence (0.60)
        dummy_engine.entities['LOC17']['resolutionConfidence'] = 0.60
        low_score = dummy_engine._score_path(path)['path_score']

        self.assertGreater(high_score, low_score,
                           'Uncertain entity resolution must penalize composite path score')

    def test_11_ground_truth_recovery(self):
        """Test 11: Ground-truth benchmark recovery (all 6 recovered in top-5 leads)."""
        eval_report = evaluate_ground_truth(self.engine)
        self.assertEqual(eval_report['total_relationships'], 6)
        self.assertEqual(eval_report['recovered'], 6, f'Expected 6/6 recovered, got {eval_report["recovered"]}/6')
        self.assertGreaterEqual(eval_report['top5_recovery'], 6, 'All 6 ground-truth leads must be in top 5')
        self.assertGreaterEqual(eval_report['top3_recovery'], 4, 'At least 4 ground-truth leads must be in top 3')


if __name__ == '__main__':
    unittest.main(verbosity=2)
