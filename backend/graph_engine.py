"""
Provenance-Preserving Graph Analysis and Deep Multi-Hop Relationship Discovery Engine
SIH26189 – AI-Powered Criminal Network Analysis System
"""

import os
import csv
import collections
import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any, Set, Tuple

try:
    import networkx as nx
    HAS_NX = True
except ImportError:
    HAS_NX = False


class IntelGraphEngine:
    """
    High-fidelity criminal intelligence graph engine with full evidence provenance,
    structural centrality metrics, multi-factor path ranking, and explainability.
    """

    def __init__(self, entities: Optional[List[Dict[str, Any]]] = None, relationships: Optional[List[Dict[str, Any]]] = None, data_dir: Optional[str] = None):
        self.entities: Dict[str, Dict[str, Any]] = {}
        self.relationships: List[Dict[str, Any]] = []
        self.adj: Dict[str, List[Tuple[str, Dict[str, Any]]]] = collections.defaultdict(list)
        self.edge_map: Dict[Tuple[str, str], Dict[str, Any]] = {}
        self.direct_edge_pairs: Set[Tuple[str, str]] = set()

        # Operational evidence records and FIR intelligence
        self.evidence_records: Dict[str, Dict[str, Any]] = {}
        self.fir_reports: Dict[str, Dict[str, Any]] = {}
        self.data_dir: Optional[str] = None

        # Structural metrics
        self.betweenness_centrality: Dict[str, float] = {}
        self.degree_centrality: Dict[str, float] = {}
        self.node_communities: Dict[str, int] = {}
        self.nx_graph = None

        # Resolve dataset directory with environment override and reliable project-relative fallback
        configured_dir = os.environ.get("NARCODES_DATA_DIR") or os.environ.get("DATA_DIR")
        if data_dir and os.path.exists(data_dir):
            self.data_dir = str(Path(data_dir).resolve())
            self._load_from_csv_directory(self.data_dir)
        elif configured_dir and os.path.exists(configured_dir):
            self.data_dir = str(Path(configured_dir).resolve())
            self._load_from_csv_directory(self.data_dir)
        elif entities and relationships:
            self._load_from_in_memory(entities, relationships)
        else:
            default_data_dir = Path(__file__).resolve().parent / 'data'
            if default_data_dir.exists():
                self.data_dir = str(default_data_dir)
                self._load_from_csv_directory(self.data_dir)
            elif entities:
                self._load_from_in_memory(entities, relationships or [])

        self._compute_structural_metrics()

    def _load_from_in_memory(self, entities: List[Dict[str, Any]], relationships: List[Dict[str, Any]]):
        """Loads and normalizes in-memory entities and relationships."""
        for e in entities:
            e_id = e["id"]
            self.entities[e_id] = {
                "id": e_id,
                "name": e.get("name", e_id),
                "type": e.get("type", "UNKNOWN"),
                "riskScore": e.get("riskScore", 65),
                "aliases": e.get("aliases", []),
                "details": e.get("details", {}),
                "metrics": e.get("metrics", {}),
                "resolutionConfidence": e.get("resolutionConfidence", 1.0)
            }

        for rel in relationships:
            s = rel["source"]
            t = rel["target"]
            edge_data = {
                "id": rel.get("id", f"REL-{len(self.relationships) + 1}"),
                "source": s,
                "target": t,
                "type": rel.get("type", "ASSOCIATED_WITH"),
                "source_table": rel.get("source_table", rel.get("sourceType", "investigation_records")),
                "source_record_id": rel.get("source_record_id", rel.get("evidenceRecordId", rel.get("recordId", "REC-001"))),
                "timestamp": rel.get("timestamp", rel.get("date", "2026-03-12T12:00:00")),
                "case_id": rel.get("case_id", rel.get("caseId", "CR-2026-0142")),
                "confidence": float(rel.get("confidence", 0.85)),
                "description": rel.get("description", f"{s} connected to {t}")
            }
            self._register_edge(edge_data)

    def _load_from_csv_directory(self, data_dir: str):
        """Loads all relational tables from data_dir with strict provenance preservation."""
        def read_csv_dict(filename: str) -> List[Dict[str, str]]:
            filepath = os.path.join(data_dir, filename)
            if not os.path.exists(filepath):
                return []
            with open(filepath, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                return list(reader)

        # 1. persons
        for row in read_csv_dict('persons.csv'):
            p_id = row.get('person_id') or row.get('id')
            name = row.get('full_name') or row.get('name') or p_id
            self.entities[p_id] = {
                "id": p_id,
                "name": name,
                "type": "PERSON",
                "riskScore": int(row.get('risk_score', 75)),
                "aliases": [a.strip() for a in row.get('aliases', '').split(';') if a.strip()],
                "details": {
                    "city": row.get('city', row.get('address', '')),
                    "occupation": row.get('occupation', ''),
                    "cases": [c.strip() for c in row.get('case_ids', '').split(';') if c.strip()]
                },
                "resolutionConfidence": 1.0
            }
            org_id = row.get('organization_id', '').strip()
            if org_id:
                self._register_edge({
                    "id": f"REL-EMP-{p_id}-{org_id}",
                    "source": p_id,
                    "target": org_id,
                    "type": "EMPLOYED_AT",
                    "source_table": "persons",
                    "source_record_id": f"EMP-{p_id}",
                    "timestamp": "2026-01-01",
                    "case_id": "",
                    "confidence": 0.95,
                    "description": f"{name} employed at organization {org_id}"
                })

        # 2. phones
        phones_by_number = collections.defaultdict(list)
        for row in read_csv_dict('phones.csv'):
            ph_id = row.get('phone_id') or row.get('phone_number')
            num = row.get('phone_number', ph_id).strip()
            owner = row.get('owner_person_id', '').strip() or row.get('subscriber_name', '').strip()
            owner_ent = self.entities.get(owner)
            owner_name = owner_ent['name'] if owner_ent else ""
            display_num = f"+91 {num[:5]}-{num[5:]}" if len(num) == 10 else num
            ph_name = f"{display_num} ({owner_name.split()[0]}'s Phone)" if owner_name else f"{display_num} (Mobile)"
            self.entities[ph_id] = {
                "id": ph_id,
                "name": ph_name,
                "type": "PHONE",
                "riskScore": 60,
                "aliases": [row.get('imei', ''), row.get('imsi', '')],
                "details": {
                    "phoneNumber": num,
                    "owner": owner,
                    "ownerName": owner_name,
                    "activeFrom": row.get('active_from', row.get('first_seen', '')),
                    "activeTo": row.get('active_to', row.get('last_seen', ''))
                },
                "resolutionConfidence": 1.0
            }
            if owner:
                self._register_edge({
                    "id": f"REL-OWN-PH-{owner}-{ph_id}",
                    "source": owner,
                    "target": ph_id,
                    "type": "OWNS_PHONE",
                    "source_table": "phones",
                    "source_record_id": ph_id,
                    "timestamp": row.get('active_from', ''),
                    "case_id": "",
                    "confidence": 0.98,
                    "description": f"Phone ownership: {owner} registered owner of {ph_id}"
                })
            if num:
                phones_by_number[num].append(row)

        # Phone reassignments across records with same number
        for num, ph_list in phones_by_number.items():
            if len(ph_list) > 1:
                for i in range(len(ph_list)):
                    for j in range(i + 1, len(ph_list)):
                        p1_id = ph_list[i].get('phone_id') or ph_list[i].get('phone_number')
                        p2_id = ph_list[j].get('phone_id') or ph_list[j].get('phone_number')
                        self._register_edge({
                            "id": f"REL-REASSIGN-{p1_id}-{p2_id}",
                            "source": p1_id,
                            "target": p2_id,
                            "type": "REASSIGNED_PHONE_NUMBER",
                            "source_table": "phones",
                            "source_record_id": f"{p1_id}-{p2_id}",
                            "timestamp": ph_list[j].get('active_from', ''),
                            "case_id": "",
                            "confidence": 0.95,
                            "description": f"Phone number {num} reassigned across records ({p1_id} -> {p2_id})"
                        })

        # 3. vehicles
        for row in read_csv_dict('vehicles.csv'):
            v_id = row.get('vehicle_id') or row.get('registration_plate')
            reg = row.get('registration_number') or v_id
            owner = row.get('owner_person_id', '').strip() or row.get('registered_owner', '').strip()
            user = row.get('primary_user_person_id', '').strip()
            make_model = row.get('make_model', 'Vehicle')
            reg_fmt = f"{reg[:4]}-{reg[4:6]}-{reg[6:]}" if len(reg) == 10 else reg
            self.entities[v_id] = {
                "id": v_id,
                "name": f"{make_model} ({reg_fmt})",
                "type": "VEHICLE",
                "riskScore": 65,
                "aliases": [reg, row.get('chassis_number', '')],
                "details": {
                    "registrationNumber": reg,
                    "model": make_model,
                    "color": row.get('color', ''),
                    "owner": owner,
                    "primaryUser": user,
                    "vehicleType": row.get('vehicle_type', '')
                },
                "resolutionConfidence": 1.0
            }
            if owner:
                self._register_edge({
                    "id": f"REL-OWN-VH-{owner}-{v_id}",
                    "source": owner,
                    "target": v_id,
                    "type": "OWNS_VEHICLE",
                    "source_table": "vehicles",
                    "source_record_id": v_id,
                    "timestamp": row.get('active_from', ''),
                    "case_id": "",
                    "confidence": 0.98,
                    "description": f"Vehicle registered ownership: {owner} owns {v_id}"
                })
            if user and user != owner:
                self._register_edge({
                    "id": f"REL-USER-VH-{user}-{v_id}",
                    "source": user,
                    "target": v_id,
                    "type": "PRIMARY_USER",
                    "source_table": "vehicles",
                    "source_record_id": v_id,
                    "timestamp": row.get('active_from', ''),
                    "case_id": "",
                    "confidence": 0.95,
                    "description": f"Primary vehicle user: {user} operates {v_id}"
                })

        # 4. locations
        for row in read_csv_dict('locations.csv'):
            l_id = row['location_id']
            self.entities[l_id] = {
                "id": l_id,
                "name": row.get('location_name', row.get('name', l_id)),
                "type": "LOCATION",
                "riskScore": 45,
                "aliases": [],
                "details": {
                    "locality": row.get('locality', ''),
                    "city": row.get('city', ''),
                    "type": row.get('location_type', ''),
                    "coordinates": [float(row.get('latitude', 0)), float(row.get('longitude', 0))]
                },
                "resolutionConfidence": 1.0
            }

        # 5. organizations
        for row in read_csv_dict('organizations.csv'):
            o_id = row.get('organization_id') or row.get('org_id')
            self.entities[o_id] = {
                "id": o_id,
                "name": row.get('organization_name', row.get('name', o_id)),
                "type": "ORGANIZATION",
                "riskScore": 75,
                "aliases": [row.get('registration_number', '')],
                "details": {
                    "type": row.get('organization_type', row.get('org_type', '')),
                    "city": row.get('city', ''),
                    "status": row.get('status', '')
                },
                "resolutionConfidence": 1.0
            }

        # 6. cases
        for row in read_csv_dict('cases.csv'):
            c_id = row['case_id']
            c_type = row.get('case_type', 'Investigation').replace('_', ' ').title()
            self.entities[c_id] = {
                "id": c_id,
                "name": f"{c_type} Case ({c_id})",
                "type": "CASE",
                "riskScore": 90,
                "aliases": [],
                "details": {
                    "status": row.get('case_status', row.get('status', '')),
                    "type": row.get('case_type', row.get('classification', '')),
                    "summary": row.get('summary', '')
                },
                "resolutionConfidence": 1.0
            }

        # 7. bank_accounts
        for row in read_csv_dict('bank_accounts.csv'):
            acc_id = row['account_id']
            hp = row.get('account_holder_person_id', '').strip()
            ho = row.get('organization_id', '').strip()
            bank_name = row.get('bank_name', 'Bank')
            acc_type = row.get('account_type', 'Account').title()
            holder_ent = self.entities.get(hp) or self.entities.get(ho)
            holder_name = holder_ent['name'].split()[0] if holder_ent else ""
            acc_display = f"{bank_name} ({acc_type})" if not holder_name else f"{bank_name} ({holder_name} - {acc_type})"
            self.entities[acc_id] = {
                "id": acc_id,
                "name": acc_display,
                "type": "BANK ACCOUNT",
                "riskScore": 70,
                "aliases": [],
                "details": {
                    "bank": bank_name,
                    "accountType": acc_type,
                    "holderPerson": hp,
                    "holderOrg": ho
                },
                "resolutionConfidence": 1.0
            }
            if hp:
                self._register_edge({
                    "id": f"REL-HOLD-{hp}-{acc_id}",
                    "source": hp,
                    "target": acc_id,
                    "type": "HOLDS_ACCOUNT",
                    "source_table": "bank_accounts",
                    "source_record_id": acc_id,
                    "timestamp": row.get('opened_date', ''),
                    "case_id": "",
                    "confidence": 0.98,
                    "description": f"Account holder: {hp} holds account {acc_id}"
                })
            if ho:
                self._register_edge({
                    "id": f"REL-HOLD-{ho}-{acc_id}",
                    "source": ho,
                    "target": acc_id,
                    "type": "HOLDS_ACCOUNT",
                    "source_table": "bank_accounts",
                    "source_record_id": acc_id,
                    "timestamp": row.get('opened_date', ''),
                    "case_id": "",
                    "confidence": 0.98,
                    "description": f"Corporate account holder: {ho} holds account {acc_id}"
                })

        # 8. case_person_links
        for row in read_csv_dict('case_person_links.csv'):
            p_id = row['person_id']
            c_id = row['case_id']
            role = row.get('role', 'unknown').lower()
            rec_id = row.get('source_record_id') or row.get('link_id') or f"{c_id}-{p_id}"
            if p_id in self.entities and c_id in self.entities:
                self.entities[p_id]['details'].setdefault('cases', []).append(c_id)
                self._register_edge({
                    "id": f"REL-CPL-{c_id}-{p_id}",
                    "source": p_id,
                    "target": c_id,
                    "type": "INVOLVED_IN",
                    "source_table": "case_person_links",
                    "source_record_id": rec_id,
                    "timestamp": row.get('date_added', '2026-02-01'),
                    "case_id": c_id,
                    "confidence": 0.95,
                    "role": role,
                    "description": f"Case docket involvement: {self.entities[p_id]['name']} linked as {role} in {c_id}"
                })
                self.evidence_records[rec_id] = {
                    "id": rec_id,
                    "type": "CASE_DOCKET",
                    "source": "Police Case Docket Record",
                    "sourceTable": "case_person_links",
                    "timestamp": row.get('date_added', '2026-02-01'),
                    "confidence": 0.95,
                    "caseId": c_id,
                    "title": f"Case Docket: {p_id} in {c_id} ({role})",
                    "description": f"Subject {self.entities[p_id]['name']} recorded as {role} in docket {c_id}.",
                    "entitiesInvolved": [p_id, c_id],
                    "metadata": row
                }

        # 9. case_vehicle_links
        for row in read_csv_dict('case_vehicle_links.csv'):
            c_id = row['case_id']
            v_id = row.get('vehicle_id') or row.get('vehicle_reg')
            rec_id = row.get('source_record_id') or row.get('link_id') or f"{c_id}-{v_id}"
            if v_id in self.entities and c_id in self.entities:
                self._register_edge({
                    "id": f"REL-CVL-{c_id}-{v_id}",
                    "source": v_id,
                    "target": c_id,
                    "type": "INVOLVED_IN",
                    "source_table": "case_vehicle_links",
                    "source_record_id": rec_id,
                    "timestamp": "2026-02-01",
                    "case_id": c_id,
                    "confidence": 0.92,
                    "role": row.get('relationship', 'evidence'),
                    "description": f"Vehicle case linkage: {v_id} linked to {c_id} ({row.get('relationship', 'Evidence')})"
                })
                self.evidence_records[rec_id] = {
                    "id": rec_id,
                    "type": "CASE_VEHICLE",
                    "source": "Case Vehicle Impound/Registry",
                    "sourceTable": "case_vehicle_links",
                    "timestamp": "2026-02-01",
                    "confidence": 0.92,
                    "caseId": c_id,
                    "title": f"Vehicle Link: {v_id} in {c_id}",
                    "description": f"Vehicle {v_id} logged as evidence in case {c_id}.",
                    "entitiesInvolved": [v_id, c_id],
                    "metadata": row
                }

        # 10. case_organization_links
        for row in read_csv_dict('case_organization_links.csv'):
            c_id = row['case_id']
            o_id = row.get('organization_id') or row.get('org_id')
            rec_id = row.get('source_record_id') or row.get('link_id') or f"{c_id}-{o_id}"
            if o_id in self.entities and c_id in self.entities:
                self._register_edge({
                    "id": f"REL-COL-{c_id}-{o_id}",
                    "source": o_id,
                    "target": c_id,
                    "type": "ASSOCIATED_WITH",
                    "source_table": "case_organization_links",
                    "source_record_id": rec_id,
                    "timestamp": "2026-02-01",
                    "case_id": c_id,
                    "confidence": 0.94,
                    "role": row.get('relationship', 'associated'),
                    "description": f"Organization case linkage: {o_id} linked to {c_id} ({row.get('relationship', 'Associated')})"
                })
                self.evidence_records[rec_id] = {
                    "id": rec_id,
                    "type": "CASE_ORGANIZATION",
                    "source": "Case Corporate Association Registry",
                    "sourceTable": "case_organization_links",
                    "timestamp": "2026-02-01",
                    "confidence": 0.94,
                    "caseId": c_id,
                    "title": f"Organization Link: {o_id} in {c_id}",
                    "description": f"Organization {o_id} associated with case {c_id}.",
                    "entitiesInvolved": [o_id, c_id],
                    "metadata": row
                }

        # 11. communications
        for row in read_csv_dict('communications.csv'):
            s_ph = row.get('caller_phone_id') or row.get('caller_phone')
            r_ph = row.get('receiver_phone_id') or row.get('receiver_phone')
            rec_id = row.get('communication_id') or row.get('record_id')
            dur = float(row.get('duration_seconds') or row.get('duration_sec', 0))
            ts = row.get('timestamp', '')
            conf = 0.95 if dur > 60 else 0.92
            self._register_edge({
                "id": f"REL-COMM-{rec_id}",
                "source": s_ph,
                "target": r_ph,
                "type": "COMMUNICATED_WITH",
                "source_table": "communications",
                "source_record_id": rec_id,
                "timestamp": ts,
                "case_id": row.get('case_id', ''),
                "confidence": conf,
                "duration": dur,
                "description": f"Telecom call duration {dur}s ({rec_id})"
            })
            self.evidence_records[rec_id] = {
                "id": rec_id,
                "type": "COMMUNICATION",
                "source": "Telecommunications Intercept (CDR)",
                "sourceTable": "communications",
                "timestamp": ts,
                "confidence": conf,
                "caseId": row.get('case_id', ''),
                "title": f"Call Intercept: {s_ph} ↔ {r_ph} ({dur}s)",
                "description": f"Voice call duration {dur}s between {s_ph} and {r_ph} recorded at {ts}.",
                "entitiesInvolved": [s_ph, r_ph],
                "metadata": row
            }

        # 12. transactions
        for row in read_csv_dict('transactions.csv'):
            s_acc = row.get('sender_account_id') or row.get('sender_account')
            r_acc = row.get('receiver_account_id') or row.get('receiver_account')
            t_id = row['transaction_id']
            ts = row.get('timestamp', '')
            amt = row.get('amount', '0')
            self._register_edge({
                "id": f"REL-TXN-{t_id}",
                "source": s_acc,
                "target": r_acc,
                "type": "TRANSFERRED_FUNDS",
                "source_table": "transactions",
                "source_record_id": t_id,
                "timestamp": ts,
                "case_id": row.get('case_id', ''),
                "confidence": 0.96,
                "amount": amt,
                "txn_type": row.get('transaction_type', 'transfer'),
                "description": f"Wire transfer of {amt} INR ({t_id})"
            })
            self.evidence_records[t_id] = {
                "id": t_id,
                "type": "FINANCIAL",
                "source": "Bank Transaction Record",
                "sourceTable": "transactions",
                "timestamp": ts,
                "confidence": 0.96,
                "caseId": row.get('case_id', ''),
                "title": f"Wire Transfer: {s_acc} → {r_acc} ({amt} INR)",
                "description": f"Financial transaction {t_id} of {amt} INR between accounts {s_acc} and {r_acc} logged at {ts}.",
                "entitiesInvolved": [s_acc, r_acc],
                "metadata": row
            }

        # 13. person_location_events
        for row in read_csv_dict('person_location_events.csv'):
            p_id = row['person_id']
            l_id = row['location_id']
            rec_id = row.get('event_id') or row.get('record_id')
            ts = row.get('timestamp', '')
            self._register_edge({
                "id": f"REL-PLE-{rec_id}",
                "source": p_id,
                "target": l_id,
                "type": "VISITED",
                "source_table": "person_location_events",
                "source_record_id": rec_id,
                "timestamp": ts,
                "case_id": row.get('case_id', ''),
                "confidence": 0.90,
                "description": f"Presence logged at location {l_id} ({rec_id})"
            })
            self.evidence_records[rec_id] = {
                "id": rec_id,
                "type": "SURVEILLANCE_LOCATION",
                "source": "Physical Surveillance Log",
                "sourceTable": "person_location_events",
                "timestamp": ts,
                "confidence": 0.90,
                "caseId": row.get('case_id', ''),
                "title": f"Location Sighting: {p_id} at {l_id}",
                "description": f"Field observation log {rec_id}: Subject {p_id} observed present at location {l_id} at {ts}.",
                "entitiesInvolved": [p_id, l_id],
                "metadata": row
            }

        # 14. person_vehicle_events
        for row in read_csv_dict('person_vehicle_events.csv'):
            p_id = row['person_id']
            v_id = row.get('vehicle_id') or row.get('vehicle_reg')
            rec_id = row.get('event_id') or row.get('record_id')
            ts = row.get('timestamp', '')
            self._register_edge({
                "id": f"REL-PVE-{rec_id}",
                "source": p_id,
                "target": v_id,
                "type": "OPERATES",
                "source_table": "person_vehicle_events",
                "source_record_id": rec_id,
                "timestamp": ts,
                "case_id": row.get('case_id', ''),
                "confidence": 0.96,
                "description": f"Vehicle surveillance log: {p_id} observed with vehicle {v_id} ({rec_id})"
            })
            self.evidence_records[rec_id] = {
                "id": rec_id,
                "type": "SURVEILLANCE_VEHICLE",
                "source": "Vehicle Surveillance Log",
                "sourceTable": "person_vehicle_events",
                "timestamp": ts,
                "confidence": 0.96,
                "caseId": row.get('case_id', ''),
                "title": f"Vehicle Operation Sighting: {p_id} with {v_id}",
                "description": f"Vehicle surveillance log {rec_id}: Subject {p_id} observed operating/present with vehicle {v_id} at {ts}.",
                "entitiesInvolved": [p_id, v_id],
                "metadata": row
            }

        # 15. fir_reports
        for row in read_csv_dict('fir_reports.csv'):
            fir_id = row.get('report_id')
            if not fir_id:
                continue
            self.fir_reports[fir_id] = row
            c_id = row.get('case_id', '')
            ts = row.get('report_timestamp', '')
            narrative = row.get('narrative', '')
            self.evidence_records[fir_id] = {
                "id": fir_id,
                "type": "FIR_REPORT",
                "source": f"First Information Report / {row.get('report_type', 'statement')}",
                "sourceTable": "fir_reports",
                "timestamp": ts,
                "confidence": 0.98,
                "caseId": c_id,
                "title": f"FIR Report {fir_id} ({c_id}): {row.get('report_type', 'Report')}",
                "description": narrative[:240] + "..." if len(narrative) > 240 else narrative,
                "narrative": narrative,
                "officer": row.get('source_officer', ''),
                "entitiesInvolved": [e for e in [row.get('referenced_persons'), row.get('referenced_vehicles'), row.get('referenced_locations')] if e],
                "metadata": row
            }

    def _register_edge(self, edge: Dict[str, Any]):
        """Registers edge symmetrically in adjacency list and lookup map."""
        s = edge.get("source")
        t = edge.get("target")
        if not s or not t or s == t:
            return

        pair = (min(s, t), max(s, t))
        if pair in self.direct_edge_pairs:
            # Update edge if higher confidence
            existing = self.edge_map.get((s, t)) or self.edge_map.get((t, s))
            if existing and edge["confidence"] > existing["confidence"]:
                existing.update(edge)
            return

        self.direct_edge_pairs.add(pair)
        self.relationships.append(edge)
        self.adj[s].append((t, edge))
        self.adj[t].append((s, edge))
        self.edge_map[(s, t)] = edge
        self.edge_map[(t, s)] = edge

    def _compute_structural_metrics(self):
        """Computes betweenness centrality and community detection using NetworkX."""
        if not HAS_NX or len(self.entities) == 0:
            return

        self.nx_graph = nx.Graph()
        for e_id, e_data in self.entities.items():
            self.nx_graph.add_node(e_id, **e_data)

        for rel in self.relationships:
            self.nx_graph.add_edge(rel["source"], rel["target"], **rel, weight=1.0 - (rel["confidence"] * 0.4))

        try:
            self.betweenness_centrality = nx.betweenness_centrality(self.nx_graph, normalized=True)
            self.degree_centrality = nx.degree_centrality(self.nx_graph)
            communities = list(nx.community.greedy_modularity_communities(self.nx_graph))
            for c_idx, comm in enumerate(communities):
                for node in comm:
                    self.node_communities[node] = c_idx
        except Exception as err:
            print(f"[IntelGraphEngine] Structural metrics warning: {err}")

    def find_shortest_path(self, source_id: str, target_id: str) -> Optional[List[Dict[str, Any]]]:
        """Finds multi-hop path between source and target entities."""
        if source_id not in self.entities or target_id not in self.entities:
            return None

        queue = collections.deque([[source_id]])
        visited = {source_id}

        while queue:
            path = queue.popleft()
            curr = path[-1]
            if curr == target_id:
                result = []
                for i in range(len(path)):
                    node_id = path[i]
                    ent = self.entities[node_id]
                    step_data = {
                        "entityId": ent["id"],
                        "entityName": ent["name"],
                        "entityType": ent["type"],
                    }
                    if i < len(path) - 1:
                        next_id = path[i + 1]
                        edge = self.edge_map.get((node_id, next_id))
                        if edge:
                            step_data["stepEdge"] = {
                                "relationshipType": edge["type"],
                                "evidenceId": edge["source_record_id"],
                                "confidence": edge["confidence"],
                                "sourceTable": edge["source_table"],
                                "timestamp": edge["timestamp"],
                                "caseId": edge["case_id"]
                            }
                    result.append(step_data)
                return result

            for neighbor, _ in self.adj[curr]:
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(path + [neighbor])

        return None

    def find_hidden_relationships(self, source_entity_id: str, max_hops: int = 5, limit: int = 5) -> Dict[str, Any]:
        """
        Discovers and ranks deep multi-hop hidden relationships (2-5 hops) originating
        from source_entity_id using archetype-centric evidence scoring.
        """
        if source_entity_id not in self.entities:
            return {"source_entity": None, "leads": []}

        src_entity = self.entities[source_entity_id]
        candidate_paths: List[List[str]] = []
        visited_in_path: Set[str] = {source_entity_id}

        def dfs(current_id: str, current_path: List[str], comm_count: int, txn_count: int):
            if len(current_path) - 1 >= max_hops:
                return

            # Pruning rule 1: CASE nodes can only be terminal targets, never intermediaries
            if len(current_path) > 1 and self.entities[current_id]["type"] == "CASE":
                return

            for neighbor_id, edge in self.adj[current_id]:
                if neighbor_id in visited_in_path:
                    continue  # Avoid cycles

                edge_type = edge.get("type", "")
                next_comm = comm_count + (1 if edge_type in ("COMMUNICATED_WITH", "REASSIGNED_PHONE_NUMBER") else 0)
                next_txn = txn_count + (1 if edge_type == "TRANSFERRED_FUNDS" else 0)

                # Pruning rule 2: Limit telecommunications and transaction chains to <= 1
                if next_comm > 1 or next_txn > 1:
                    continue

                new_path = current_path + [neighbor_id]
                hops = len(new_path) - 1

                if hops >= 2:
                    direct_pair = (min(source_entity_id, neighbor_id), max(source_entity_id, neighbor_id))
                    target_ent = self.entities[neighbor_id]

                    # Pruning rule 3: Target must be PERSON, CASE, or ORGANIZATION (not intermediate phone/account/location)
                    if target_ent["type"] in ("PERSON", "CASE", "ORGANIZATION"):
                        if direct_pair not in self.direct_edge_pairs:
                            candidate_paths.append(new_path)

                visited_in_path.add(neighbor_id)
                dfs(neighbor_id, new_path, next_comm, next_txn)
                visited_in_path.remove(neighbor_id)

        dfs(source_entity_id, [source_entity_id], 0, 0)

        # Score and rank candidate paths
        best_by_target: Dict[str, Tuple[float, Dict[str, Any]]] = {}
        paths_rejected = 0

        for path in candidate_paths:
            target_id = path[-1]
            score_data = self._score_path(path)
            score = score_data["path_score"]

            if target_id not in best_by_target:
                best_by_target[target_id] = (score, score_data)
            else:
                prev_score, prev_data = best_by_target[target_id]
                if score > prev_score + 0.3:
                    best_by_target[target_id] = (score, score_data)
                    paths_rejected += 1
                elif len(path) - 1 < prev_data["path_length"] and score >= prev_score - 0.5:
                    best_by_target[target_id] = (score, score_data)
                    paths_rejected += 1
                else:
                    paths_rejected += 1

        sorted_candidates = sorted(best_by_target.values(), key=lambda x: x[0], reverse=True)

        # Lead deduplication: cap same-category same-intermediary leads to Top 2
        # e.g., if ACC01 sends money to multiple accounts, keep top 2 recipients
        final_leads: List[Dict[str, Any]] = []
        seen_intermediaries: Dict[str, int] = collections.defaultdict(int)

        for score, lead_data in sorted_candidates:
            p_nodes = [s["entityId"] for s in lead_data["path"]]
            cat = lead_data.get("category", "GENERAL")
            interm_key = f"{cat}-{p_nodes[1]}" if len(p_nodes) > 2 else cat
            if seen_intermediaries[interm_key] >= 2 and len(final_leads) < limit:
                continue
            seen_intermediaries[interm_key] += 1
            final_leads.append(lead_data)
            if len(final_leads) >= limit:
                break

        print(f"[IntelGraphEngine] Hidden Query for Source: {source_entity_id} ({src_entity['name']}) | Max Hops: {max_hops}")
        print(f"   Candidate Paths Considered: {len(candidate_paths)} | Paths Rejected: {paths_rejected} | Paths Returned: {len(final_leads)}")
        for idx, lead in enumerate(final_leads):
            print(f"   Lead #{idx+1}: Target={lead['target_entity']['id']} ({lead['target_entity']['name']}) | Length={lead['path_length']} hops | Score={lead['path_score']} | Category={lead.get('category')} | Confidence={lead['confidence']}")

        return {
            "source_entity": {
                "id": src_entity["id"],
                "name": src_entity["name"],
                "type": src_entity["type"],
                "riskScore": src_entity.get("riskScore", 70)
            },
            "leads": final_leads
        }

    def _score_path(self, path_nodes: List[str]) -> Dict[str, Any]:
        """
        Computes calibrated multi-factor path scoring based on:
        Archetype Evidence Strength + Direct Asset Conduit + Temporal Coherence +
        Corroborated Records + Role Quality - Penalties.
        """
        hops = len(path_nodes) - 1
        edges = []
        for i in range(hops):
            e = self.edge_map.get((path_nodes[i], path_nodes[i + 1]))
            if e:
                edges.append(e)

        edge_types = [e.get("type") for e in edges]
        src_type = self.entities[path_nodes[0]]["type"]
        tgt_type = self.entities[path_nodes[-1]]["type"]

        timestamps = []
        for e in edges:
            ts_str = e.get("timestamp")
            if ts_str:
                try:
                    dt = datetime.datetime.fromisoformat(ts_str.replace('Z', ''))
                    timestamps.append(dt)
                except Exception:
                    pass

        conf_scores = [e.get("confidence", 0.85) for e in edges]
        for nid in path_nodes:
            ent_conf = self.entities.get(nid, {}).get("resolutionConfidence")
            if ent_conf is not None:
                conf_scores.append(ent_conf)
        avg_conf = sum(conf_scores) / max(1, len(conf_scores))

        archetype_score = 0.0
        category = "GENERAL"

        # 1. Location Temporal Rendezvous: S -> LOC -> T within 72h (hops == 2)
        if hops == 2 and self.entities[path_nodes[1]]["type"] == "LOCATION" and src_type == "PERSON" and tgt_type == "PERSON":
            category = "LOCATION_RENDEZVOUS"
            if len(timestamps) >= 2:
                span_hours = abs((timestamps[-1] - timestamps[0]).total_seconds() / 3600.0)
                if span_hours <= 72.0:
                    archetype_score = 13.0 - (span_hours / 72.0) * 0.4
                else:
                    archetype_score = 2.0
            else:
                archetype_score = 3.0

        # 2. Shared Vehicle to Case: S owns/uses vehicle -> Associate -> CASE (hops == 3)
        elif hops == 3 and self.entities[path_nodes[1]]["type"] == "VEHICLE" and src_type == "PERSON" and tgt_type == "CASE":
            category = "SHARED_VEHICLE_CASE"
            role = edges[-1].get("role", "")
            role_pts = 1.5 if role in ("associate", "person_of_interest", "suspect", "accused") else 0.5
            archetype_score = 12.0 + role_pts

        # 3. Organization Bridge to Case: S -> ORG -> Colleague -> CASE (hops == 3)
        elif hops == 3 and self.entities[path_nodes[1]]["type"] == "ORGANIZATION" and src_type == "PERSON" and tgt_type == "CASE":
            category = "ORG_BRIDGE_TO_CASE"
            role = edges[-1].get("role", "")
            role_pts = 1.5 if role in ("associate", "person_of_interest", "suspect", "accused") else 0.5
            archetype_score = 12.0 + role_pts

        # 4. Direct Financial Bridge: S -> ACC1 -> ACC2 -> T (hops == 3)
        elif hops == 3 and self.entities[path_nodes[1]]["type"] == "BANK ACCOUNT" and self.entities[path_nodes[2]]["type"] == "BANK ACCOUNT" and src_type == "PERSON" and tgt_type == "PERSON":
            category = "FINANCIAL_BRIDGE"
            is_outgoing = edges[1].get("source") == path_nodes[1]
            archetype_score = 12.6 if is_outgoing else 10.5

        # 5. Communication Bridge with Surveillance Asset Conduit: S -> PH1 -> PH2 -> P_mid -> VH -> T (hops == 5)
        elif hops == 5 and self.entities[path_nodes[1]]["type"] == "PHONE" and self.entities[path_nodes[2]]["type"] == "PHONE" and self.entities[path_nodes[4]]["type"] == "VEHICLE" and src_type == "PERSON" and tgt_type == "PERSON":
            category = "COMM_VEHICLE_BRIDGE"
            surv_bonus = 0.5 if any(e.get("source_table") == "person_vehicle_events" for e in edges) else 0.0
            archetype_score = 12.2 + surv_bonus

        # 6. Reassigned Phone Cross-Case: CASE_S -> P1 -> PH1 -> PH2 -> P2 -> CASE_T (hops == 5)
        elif hops == 5 and "REASSIGNED_PHONE_NUMBER" in edge_types and src_type == "CASE" and tgt_type == "CASE":
            category = "REASSIGNED_PHONE"
            archetype_score = 12.5

        # Generic / Secondary archetypes
        elif "REASSIGNED_PHONE_NUMBER" in edge_types:
            category = "REASSIGNED_PHONE"
            archetype_score = 7.0
        elif "TRANSFERRED_FUNDS" in edge_types:
            category = "FINANCIAL_BRIDGE"
            archetype_score = 6.0
        elif any(self.entities[n]["type"] == "VEHICLE" for n in path_nodes) and tgt_type == "CASE":
            category = "SHARED_VEHICLE_CASE"
            archetype_score = 5.0
        elif "EMPLOYED_AT" in edge_types and tgt_type == "CASE":
            category = "ORG_BRIDGE_TO_CASE"
            archetype_score = 5.0
        elif "COMMUNICATED_WITH" in edge_types and src_type == "PERSON" and tgt_type == "PERSON":
            category = "COMMUNICATION_BRIDGE"
            archetype_score = 5.0
        else:
            category = "GENERAL"
            archetype_score = 2.0

        compactness = max(0.0, 5 - hops) * 0.1
        target_priority = 1.0 if tgt_type in ("PERSON", "CASE") else 0.5

        path_score = archetype_score + 2.0 * avg_conf + compactness + target_priority
        final_confidence = round(min(0.98, max(0.60, avg_conf * (1.0 - (0.04 * max(0, hops - 2))))), 2)

        unique_records = {e.get("source_record_id") for e in edges if e.get("source_record_id")}
        unique_tables = {e.get("source_table") for e in edges if e.get("source_table")}
        case_ids = {e.get("case_id") for e in edges if e.get("case_id")}
        for nid in path_nodes:
            for c in self.entities[nid].get("details", {}).get("cases", []):
                case_ids.add(c)

        # Build path step structures
        path_steps = []
        for i, nid in enumerate(path_nodes):
            ent = self.entities[nid]
            step = {
                "entityId": ent["id"],
                "entityName": ent["name"],
                "entityType": ent["type"]
            }
            if i < hops and i < len(edges):
                edge = edges[i]
                step["stepEdge"] = {
                    "relationshipType": edge["type"],
                    "evidenceId": edge.get("source_record_id", ""),
                    "confidence": edge.get("confidence", 0.9),
                    "sourceTable": edge.get("source_table", ""),
                    "timestamp": edge.get("timestamp", ""),
                    "caseId": edge.get("case_id", "")
                }
            path_steps.append(step)

        why_flagged = self._generate_why_flagged(path_nodes, edges, category, timestamps)

        temporal_window = {}
        if timestamps:
            temporal_window = {
                "start": min(timestamps).isoformat(),
                "end": max(timestamps).isoformat()
            }

        target_ent = self.entities[path_nodes[-1]]

        return {
            "target_entity": {
                "id": target_ent["id"],
                "name": target_ent["name"],
                "type": target_ent["type"],
                "riskScore": target_ent.get("riskScore", 70)
            },
            "path": path_steps,
            "path_length": hops,
            "path_score": round(path_score, 2),
            "category": category,
            "confidence": final_confidence,
            "relationship_types": [e.get("type", "ASSOCIATED_WITH") for e in edges],
            "supporting_records": list(unique_records),
            "supporting_cases": list(case_ids),
            "evidence_types": list(unique_tables),
            "temporal_window": temporal_window,
            "why_flagged": why_flagged,
            "human_verification_required": True
        }

    def _generate_why_flagged(self, path_nodes: List[str], edges: List[Dict[str, Any]], category: str, timestamps: List[datetime.datetime]) -> List[str]:
        """Generates dynamic, evidence-derived bullet points explaining why the lead was flagged."""
        bullets = []

        if category == "LOCATION_RENDEZVOUS":
            loc_name = self.entities[path_nodes[1]]["name"]
            if len(timestamps) >= 2:
                delta_h = round(abs((timestamps[-1] - timestamps[0]).total_seconds() / 3600.0), 1)
                bullets.append(f"Physical rendezvous detected: subjects independently recorded at {loc_name} within a {delta_h}-hour temporal window.")
            else:
                bullets.append(f"Spatial nexus: shared presence verified at location {loc_name}.")

        elif category == "SHARED_VEHICLE_CASE":
            veh_name = self.entities[path_nodes[1]]["name"]
            bullets.append(f"Covert asset conduit: registered vehicle ({veh_name}) utilized by case-linked associate without single direct docket mention.")

        elif category == "ORG_BRIDGE_TO_CASE":
            org_name = self.entities[path_nodes[1]]["name"]
            bullets.append(f"Corporate umbrella linkage: subject and case person-of-interest share documented employment/association at {org_name}.")

        elif category == "FINANCIAL_BRIDGE":
            txn_edges = [e for e in edges if e.get("source_table") == "transactions"]
            txn_id = txn_edges[0].get("source_record_id", "wire") if txn_edges else "wire"
            amt = txn_edges[0].get("amount", "") if txn_edges else ""
            bullets.append(f"Direct financial conduit: covert fund transfer ({txn_id}) bridging accounts with {amt} INR transferred without direct communication.")

        elif category == "COMM_VEHICLE_BRIDGE":
            bullets.append("Cross-silo intelligence fusion: telecommunication contact bridged directly to surveillance-confirmed shared vehicle asset.")

        elif category == "REASSIGNED_PHONE":
            bullets.append("Reassigned telecommunication asset: chain links disparate cases through recycled phone number ownership and vehicle logs.")

        else:
            bullets.append(f"Discovered indirect multi-hop relationship across {len(path_nodes) - 1} intermediary entities without direct recorded communication.")

        unique_records = {e.get("source_record_id") for e in edges if e.get("source_record_id")}
        unique_tables = {e.get("source_table") for e in edges if e.get("source_table")}
        if len(unique_records) >= 2:
            bullets.append(f"Corroborated across {len(unique_records)} independent records from {len(unique_tables)} operational tables.")

        return bullets

    def calculate_anomalies(self) -> List[Dict[str, Any]]:
        """Identifies bridge entities and high-centrality multi-hop nexuses."""
        anomalies = []
        for ent_id, ent in self.entities.items():
            bc = self.betweenness_centrality.get(ent_id, 0.0)
            if bc > 0.08 or ent.get("riskScore", 0) > 80:
                anomalies.append({
                    "entityId": ent_id,
                    "name": ent["name"],
                    "riskScore": ent.get("riskScore", 70),
                    "betweennessCentrality": round(bc, 4),
                    "reason": "High-connectivity network bridge entity spanning separate operational clusters"
                })
        return anomalies

    def get_timeline_events(self) -> List[Dict[str, Any]]:
        """
        Extracts and sorts all timestamped operational evidence records chronologically.
        Provides a real investigative event timeline across communications, transactions,
        surveillance events, and FIR reports.
        """
        timeline = []
        for rec_id, rec in self.evidence_records.items():
            ts = rec.get("timestamp")
            if not ts:
                continue
            timeline.append({
                "id": f"TL-{rec_id}",
                "date": ts,
                "timestamp": ts,
                "title": rec.get("title", f"Evidence Event {rec_id}"),
                "description": rec.get("description", ""),
                "type": rec.get("type", "EVENT"),
                "category": rec.get("type", "EVENT"),
                "evidenceId": rec_id,
                "source": rec.get("source", "Operational Intelligence"),
                "sourceTable": rec.get("sourceTable", ""),
                "caseId": rec.get("caseId", ""),
                "confidence": rec.get("confidence", 0.90),
                "entitiesInvolved": rec.get("entitiesInvolved", [])
            })
        timeline.sort(key=lambda x: str(x.get("timestamp", "")), reverse=True)
        return timeline

    def get_top_investigative_leads(self, limit_per_entity: int = 2) -> List[Dict[str, Any]]:
        """
        Generates high-priority investigative leads discovered across key entities.
        Strictly preserves provenance, multi-hop path steps, and explicit human-verification notices.
        """
        candidate_sources = ["P003", "P005", "P007", "P009", "P015", "CASE02"]
        all_leads = []
        seen_pairs = set()

        for src_id in candidate_sources:
            if src_id not in self.entities:
                continue
            res = self.find_hidden_relationships(src_id, max_hops=5, limit=limit_per_entity)
            for lead in res.get("leads", []):
                tgt_id = lead["target_entity"]["id"]
                pair = (min(src_id, tgt_id), max(src_id, tgt_id))
                if pair in seen_pairs:
                    continue
                seen_pairs.add(pair)
                lead_id = f"LEAD-{src_id}-{tgt_id}"
                src_ent = self.entities[src_id]
                all_leads.append({
                    "id": lead_id,
                    "title": f"{src_ent['name']} ↔ {lead['target_entity']['name']}",
                    "category": lead["category"],
                    "sourceEntityId": src_id,
                    "targetEntityId": tgt_id,
                    "sourceEntityName": src_ent["name"],
                    "targetEntityName": lead["target_entity"]["name"],
                    "hops": lead["path_length"],
                    "path_length": lead["path_length"],
                    "score": lead["path_score"],
                    "path_score": lead["path_score"],
                    "confidence": lead["confidence"],
                    "confidenceScore": lead["confidence"],
                    "requires_human_verification": True,
                    "human_verification_required": True,
                    "verificationStatus": "UNVERIFIED",
                    "status": "UNVERIFIED",
                    "path": [p["entityId"] for p in lead["path"]],
                    "detailed_path": lead["path"],
                    "supporting_record_ids": lead["supporting_records"],
                    "supportingRecords": lead["supporting_records"],
                    "supportingCases": lead.get("supporting_cases", []),
                    "evidenceTypes": lead.get("evidence_types", []),
                    "temporalWindow": lead.get("temporal_window", {}),
                    "reasons": lead["why_flagged"],
                    "why_flagged": lead["why_flagged"],
                    "description": lead["why_flagged"][0] if lead["why_flagged"] else "Discovered indirect multi-hop relationship"
                })

        all_leads.sort(key=lambda x: x["score"], reverse=True)
        return all_leads

    def ingest_records(self, records: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Dynamically ingests custom records/edges into the live graph."""
        added_entities = 0
        added_edges = 0
        for r in records:
            if "id" in r and ("name" in r or "type" in r):
                e_id = r["id"]
                if e_id not in self.entities:
                    self.entities[e_id] = {
                        "id": e_id,
                        "name": r.get("name", e_id),
                        "type": r.get("type", "UNKNOWN"),
                        "riskScore": int(r.get("riskScore", 65)),
                        "aliases": r.get("aliases", []),
                        "details": r.get("details", {}),
                        "resolutionConfidence": float(r.get("resolutionConfidence", 0.9))
                    }
                    added_entities += 1
            if "source" in r and "target" in r:
                s = r["source"]
                t = r["target"]
                edge_id = r.get("id", f"REL-INGEST-{len(self.relationships) + 1}")
                edge_data = {
                    "id": edge_id,
                    "source": s,
                    "target": t,
                    "type": r.get("type", "ASSOCIATED_WITH"),
                    "source_table": r.get("source_table", "user_ingest"),
                    "source_record_id": r.get("source_record_id", edge_id),
                    "timestamp": r.get("timestamp", datetime.datetime.now().isoformat()),
                    "case_id": r.get("case_id", ""),
                    "confidence": float(r.get("confidence", 0.88)),
                    "description": r.get("description", f"{s} linked to {t}")
                }
                pair = (min(s, t), max(s, t))
                if pair not in self.direct_edge_pairs:
                    self._register_edge(edge_data)
                    added_edges += 1
                    self.evidence_records[edge_id] = {
                        "id": edge_id,
                        "type": edge_data["type"],
                        "source": "Ingested Investigation Record",
                        "sourceTable": "user_ingest",
                        "timestamp": edge_data["timestamp"],
                        "confidence": edge_data["confidence"],
                        "caseId": edge_data["case_id"],
                        "title": f"Ingested Link: {s} ↔ {t}",
                        "description": edge_data["description"],
                        "entitiesInvolved": [s, t]
                    }

        if added_entities > 0 or added_edges > 0:
            self._compute_structural_metrics()

        return {
            "success": True,
            "added_entities": added_entities,
            "added_edges": added_edges,
            "total_entities": len(self.entities),
            "total_relationships": len(self.relationships)
        }
