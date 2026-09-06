"""
FIR / NLP Narrative Extraction & Entity Resolution Engine
SIH26189 – AI-Assisted Criminal Intelligence & Link Discovery Platform

Extracts structured investigative entities (PERSON, PHONE, VEHICLE, LOCATION,
ORGANIZATION, DATE) from free-form FIR narratives and resolves them against
the canonical intelligence graph without creating disconnected subgraphs.
"""

import re
import difflib
from typing import Dict, List, Any, Optional, Tuple


class FirNlpEngine:
    """
    Deterministic NLP & Entity Resolution pipeline designed for police FIR narratives.
    Extracts named entities, normalizes values, resolves against canonical graph entities,
    and constructs candidate graph edges with provenance metadata.
    """

    # Regex patterns tailored to Indian law enforcement documentation
    PHONE_REGEX = re.compile(r'(?:\+91[-\s]?|0)?([6-9]\d{9})\b')
    PHONE_FORMATTED_REGEX = re.compile(r'\b(?:\+91[-\s]?)?([6-9]\d{4}[-\s]?\d{5})\b')
    
    # Indian motor vehicle registration formats (e.g., DL01UX5951, UP-16-AA-1646, HR26 KX 1002)
    VEHICLE_REGEX = re.compile(r'\b([A-Z]{2}[-\s]?\d{1,2}[-\s]?[A-Z]{1,3}[-\s]?\d{4})\b', re.IGNORECASE)
    
    # Date formats (ISO and formal narrative: "January 5, 2026", "2026-01-05", "05-01-2026")
    DATE_REGEX = re.compile(
        r'\b(?:\d{4}-\d{2}-\d{2}|\d{1,2}[/-]\d{1,2}[/-]\d{4}|(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4})\b',
        re.IGNORECASE
    )
    
    # Time expressions: "1430 hours", "15:30 hours", "11:30 HRS"
    TIME_REGEX = re.compile(r'\b(\d{1,2}[:.]\d{2}\s*(?:hours|hrs|am|pm)?|\d{4}\s*(?:hours|hrs))\b', re.IGNORECASE)

    # Narrative context triggers for Person mentions (strictly capitalized name components)
    PERSON_TRIGGER_1 = re.compile(
        r'\b(?:[Ii]nterviewed|[Qq]uestioned|[Cc]ontacted|[Oo]bserved|[Aa]rrested|[Ss]tatement of|[Ww]itness|[Cc]omplainant|[Ss]uspect|[Ss]ubject|[Mm]r\.|[Mm]s\.|[Mm]rs\.|[Ii]nsp\.|[Ss][Ii]|[Cc]onstable)\s+((?:[A-Z]\.\s*)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)'
    )
    PERSON_TRIGGER_2 = re.compile(
        r'\b((?:[A-Z]\.\s*)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:stated|reported|denied|confirmed|exited|arrived|testified|fled)\b'
    )

    def __init__(self, canonical_entities: Optional[Dict[str, Dict[str, Any]]] = None):
        self.canonical_entities: Dict[str, Dict[str, Any]] = canonical_entities or {}
        self._build_lookup_indices()

    def update_canonical_entities(self, canonical_entities: Dict[str, Dict[str, Any]]):
        """Refreshes canonical entities index."""
        self.canonical_entities = canonical_entities
        self._build_lookup_indices()

    def _build_lookup_indices(self):
        """Builds normalized search dictionaries for fast canonical resolution."""
        self.persons_by_name: Dict[str, str] = {}
        self.persons_by_alias: Dict[str, str] = {}
        self.phones_by_num: Dict[str, str] = {}
        self.vehicles_by_plate: Dict[str, str] = {}
        self.locations_by_name: Dict[str, str] = {}
        self.orgs_by_name: Dict[str, str] = {}

        for ent_id, ent in self.canonical_entities.items():
            ent_type = ent.get("type", "").upper()
            raw_name = ent.get("name", "")
            norm_name = self._normalize_text(raw_name)

            if ent_type == "PERSON":
                self.persons_by_name[norm_name] = ent_id
                for alias in ent.get("aliases", []):
                    self.persons_by_alias[self._normalize_text(alias)] = ent_id

            elif ent_type == "PHONE":
                # Extract digits
                details = ent.get("details", {})
                phone_num = self._normalize_phone(details.get("phoneNumber", raw_name))
                if phone_num:
                    self.phones_by_num[phone_num] = ent_id

            elif ent_type == "VEHICLE":
                details = ent.get("details", {})
                plate = self._normalize_plate(details.get("registrationNumber", raw_name))
                if plate:
                    self.vehicles_by_plate[plate] = ent_id
                for alias in ent.get("aliases", []):
                    norm_alias = self._normalize_plate(alias)
                    if norm_alias:
                        self.vehicles_by_plate[norm_alias] = ent_id

            elif ent_type == "LOCATION":
                self.locations_by_name[norm_name] = ent_id

            elif ent_type == "ORGANIZATION":
                self.orgs_by_name[norm_name] = ent_id

    @staticmethod
    def _normalize_text(text: str) -> str:
        """Normalizes free-text by lowering, stripping punctuation, and extra whitespace."""
        return re.sub(r'[^a-z0-9\s]', '', text.lower()).strip()

    @staticmethod
    def _normalize_phone(phone_str: str) -> str:
        """Strips country codes, dashes, and extra prefixes down to 10 canonical digits."""
        digits = re.sub(r'\D', '', phone_str)
        if len(digits) >= 10:
            return digits[-10:]
        return digits

    @staticmethod
    def _normalize_plate(plate_str: str) -> str:
        """Normalizes Indian registration plates to uppercase alphanumeric without spaces or hyphens."""
        return re.sub(r'[^A-Za-z0-9]', '', plate_str).upper()

    def extract_from_narrative(self, narrative: str, case_id: str = "") -> Dict[str, Any]:
        """
        Parses an FIR narrative and returns:
        - raw mentions
        - normalized values
        - resolved canonical entity IDs
        - extraction confidence
        - candidate edges to register in IntelGraphEngine
        """
        extracted_entities: List[Dict[str, Any]] = []
        candidate_edges: List[Dict[str, Any]] = []
        seen_resolved_ids = set()

        # 1. Extract and Resolve PHONES
        found_phones = set()
        for match in self.PHONE_REGEX.finditer(narrative):
            raw_phone = match.group(0)
            norm_phone = match.group(1)
            found_phones.add((raw_phone, norm_phone))

        for raw_ph, norm_ph in found_phones:
            canon_id = self.phones_by_num.get(norm_ph)
            conf = 0.98 if canon_id else 0.85
            signals = ["regex_10digit_pattern"]
            if canon_id:
                signals.append("canonical_phone_inventory_match")
                seen_resolved_ids.add(canon_id)

            extracted_entities.append({
                "raw_mention": raw_ph,
                "normalized_value": norm_ph,
                "canonical_id": canon_id,
                "canonical_name": self.canonical_entities.get(canon_id, {}).get("name") if canon_id else None,
                "entity_type": "PHONE",
                "confidence": conf,
                "matching_signals": signals
            })

        # 2. Extract and Resolve VEHICLES
        found_vehicles = set()
        for match in self.VEHICLE_REGEX.finditer(narrative):
            raw_veh = match.group(0)
            norm_plate = self._normalize_plate(raw_veh)
            # Filter out non-plate strings (e.g. "CASE01", "UP14")
            if len(norm_plate) >= 8 and any(char.isdigit() for char in norm_plate):
                found_vehicles.add((raw_veh, norm_plate))

        for raw_veh, norm_plate in found_vehicles:
            canon_id = self.vehicles_by_plate.get(norm_plate)
            conf = 0.96 if canon_id else 0.82
            signals = ["regex_in_plate_format"]
            if canon_id:
                signals.append("canonical_vehicle_registry_match")
                seen_resolved_ids.add(canon_id)

            extracted_entities.append({
                "raw_mention": raw_veh,
                "normalized_value": norm_plate,
                "canonical_id": canon_id,
                "canonical_name": self.canonical_entities.get(canon_id, {}).get("name") if canon_id else None,
                "entity_type": "VEHICLE",
                "confidence": conf,
                "matching_signals": signals
            })

        # 3. Extract and Resolve LOCATIONS (Dictionary + Context)
        for norm_loc_name, loc_id in self.locations_by_name.items():
            loc_ent = self.canonical_entities[loc_id]
            raw_loc = loc_ent.get("name", "")
            # Word boundary check
            if re.search(r'\b' + re.escape(raw_loc) + r'\b', narrative, re.IGNORECASE):
                seen_resolved_ids.add(loc_id)
                extracted_entities.append({
                    "raw_mention": raw_loc,
                    "normalized_value": norm_loc_name,
                    "canonical_id": loc_id,
                    "canonical_name": raw_loc,
                    "entity_type": "LOCATION",
                    "confidence": 0.98,
                    "matching_signals": ["exact_dictionary_match", "geographical_context"]
                })

        # 4. Extract and Resolve ORGANIZATIONS (Dictionary + Keywords)
        for norm_org_name, org_id in self.orgs_by_name.items():
            org_ent = self.canonical_entities[org_id]
            raw_org = org_ent.get("name", "")
            if re.search(r'\b' + re.escape(raw_org) + r'\b', narrative, re.IGNORECASE):
                seen_resolved_ids.add(org_id)
                extracted_entities.append({
                    "raw_mention": raw_org,
                    "normalized_value": norm_org_name,
                    "canonical_id": org_id,
                    "canonical_name": raw_org,
                    "entity_type": "ORGANIZATION",
                    "confidence": 0.98,
                    "matching_signals": ["exact_corporate_name_match"]
                })

        # 5. Extract and Resolve PERSONS
        # Context-based and dictionary-based extraction
        found_person_mentions = set()
        for match in self.PERSON_TRIGGER_1.finditer(narrative):
            mention = match.group(1).strip()
            if len(mention) > 2 and not any(mention.lower() == w.lower() for w in ["police", "court", "station", "hotel", "mall", "market"]):
                found_person_mentions.add(mention)
        for match in self.PERSON_TRIGGER_2.finditer(narrative):
            mention = match.group(1).strip()
            if len(mention) > 2 and not any(mention.lower() == w.lower() for w in ["police", "court", "station", "hotel", "mall", "market"]):
                found_person_mentions.add(mention)

        # Also search for all canonical person names directly
        for norm_name, p_id in self.persons_by_name.items():
            p_ent = self.canonical_entities[p_id]
            full_name = p_ent.get("name", "")
            if re.search(r'\b' + re.escape(full_name) + r'\b', narrative, re.IGNORECASE):
                found_person_mentions.add(full_name)

        # Resolve each person mention
        for mention in found_person_mentions:
            canon_id, conf, signals = self.resolve_person(mention)
            if canon_id:
                seen_resolved_ids.add(canon_id)

            extracted_entities.append({
                "raw_mention": mention,
                "normalized_value": self._normalize_text(mention),
                "canonical_id": canon_id,
                "canonical_name": self.canonical_entities.get(canon_id, {}).get("name") if canon_id else None,
                "entity_type": "PERSON",
                "confidence": conf,
                "matching_signals": signals
            })

        # 6. Extract DATES & TIMESTAMPS
        extracted_dates = []
        for match in self.DATE_REGEX.finditer(narrative):
            extracted_dates.append(match.group(0))

        # 7. Synthesize Candidate Graph Connections
        # Co-occurrence in narrative creates tentative evidence edges
        resolved_persons = [e["canonical_id"] for e in extracted_entities if e["entity_type"] == "PERSON" and e["canonical_id"]]
        resolved_vehicles = [e["canonical_id"] for e in extracted_entities if e["entity_type"] == "VEHICLE" and e["canonical_id"]]
        resolved_locations = [e["canonical_id"] for e in extracted_entities if e["entity_type"] == "LOCATION" and e["canonical_id"]]
        resolved_orgs = [e["canonical_id"] for e in extracted_entities if e["entity_type"] == "ORGANIZATION" and e["canonical_id"]]

        for p_id in resolved_persons:
            if case_id:
                candidate_edges.append({
                    "source": p_id,
                    "target": case_id,
                    "type": "MENTIONED_IN_FIR",
                    "confidence": 0.90,
                    "source_table": "fir_narrative_nlp"
                })
            for v_id in resolved_vehicles:
                candidate_edges.append({
                    "source": p_id,
                    "target": v_id,
                    "type": "CO_OCCURRED_WITH_VEHICLE",
                    "confidence": 0.85,
                    "source_table": "fir_narrative_nlp"
                })
            for loc_id in resolved_locations:
                candidate_edges.append({
                    "source": p_id,
                    "target": loc_id,
                    "type": "CO_OCCURRED_AT_LOCATION",
                    "confidence": 0.85,
                    "source_table": "fir_narrative_nlp"
                })
            for org_id in resolved_orgs:
                candidate_edges.append({
                    "source": p_id,
                    "target": org_id,
                    "type": "AFFILIATED_IN_FIR",
                    "confidence": 0.85,
                    "source_table": "fir_narrative_nlp"
                })

        return {
            "narrative_length": len(narrative),
            "extracted_entities": extracted_entities,
            "resolved_count": len(seen_resolved_ids),
            "extracted_dates": list(set(extracted_dates)),
            "candidate_edges": candidate_edges,
            "human_verification_required": True
        }

    def resolve_person(self, mention: str) -> Tuple[Optional[str], float, List[str]]:
        """
        Resolves a person mention against canonical person entities.
        Handles exact matches, abbreviated initials (e.g. 'O. Rajagopalan' -> 'Omkar Rajagopalan'),
        and high-confidence fuzzy matching without auto-merging ambiguous candidates.
        """
        norm_mention = self._normalize_text(mention)
        signals = []

        # 1. Exact Name Match
        if norm_mention in self.persons_by_name:
            signals.append("exact_name_match")
            return self.persons_by_name[norm_mention], 1.0, signals

        # 2. Alias Match
        if norm_mention in self.persons_by_alias:
            signals.append("alias_match")
            return self.persons_by_alias[norm_mention], 0.95, signals

        # 3. Abbreviated / Initial Match (e.g., "O. Rajagopalan" or "O Rajagopalan" -> "Omkar Rajagopalan")
        # Pattern: single letter followed by last name
        init_match = re.match(r'^([a-z])\s+([a-z]+)$', norm_mention)
        if init_match:
            init_char, last_name = init_match.group(1), init_match.group(2)
            candidates = []
            for norm_full, p_id in self.persons_by_name.items():
                parts = norm_full.split()
                if len(parts) >= 2:
                    if parts[0].startswith(init_char) and parts[-1] == last_name:
                        candidates.append(p_id)
            if len(candidates) == 1:
                signals.append("initial_and_surname_unique_match")
                return candidates[0], 0.92, signals
            elif len(candidates) > 1:
                signals.append("ambiguous_initial_match_unmerged")
                return None, 0.50, signals

        # 4. First name + Last initial (e.g., "Rahul S." -> "Rahul Sharma")
        first_init_match = re.match(r'^([a-z]+)\s+([a-z])$', norm_mention)
        if first_init_match:
            first_name, last_init = first_init_match.group(1), first_init_match.group(2)
            candidates = []
            for norm_full, p_id in self.persons_by_name.items():
                parts = norm_full.split()
                if len(parts) >= 2:
                    if parts[0] == first_name and parts[-1].startswith(last_init):
                        candidates.append(p_id)
            if len(candidates) == 1:
                signals.append("firstname_and_last_initial_unique_match")
                return candidates[0], 0.90, signals

        # 5. Fuzzy Match (Levenshtein similarity >= 0.88)
        close_matches = difflib.get_close_matches(norm_mention, self.persons_by_name.keys(), n=2, cutoff=0.88)
        if len(close_matches) == 1:
            matched_name = close_matches[0]
            similarity = round(difflib.SequenceMatcher(None, norm_mention, matched_name).ratio(), 2)
            signals.append(f"high_confidence_fuzzy_match (ratio: {similarity})")
            return self.persons_by_name[matched_name], similarity * 0.90, signals

        return None, 0.0, ["unresolved_entity"]
