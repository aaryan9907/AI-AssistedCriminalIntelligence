"""
Generates the 15 relational tables and ground_truth_hidden_relationships.csv
for the AI-Assisted Criminal Intelligence & Link Discovery Platform (SIH26189).
"""

import os
import csv

DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
os.makedirs(DATA_DIR, exist_ok=True)

def write_csv(filename, headers, rows):
    path = os.path.join(DATA_DIR, filename)
    with open(path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(rows)
    print(f"Generated {filename} ({len(rows)} records)")

# 1. persons.csv
persons_headers = ["id", "name", "aliases", "risk_score", "address", "occupation", "case_ids"]
persons_rows = [
    ["P-014", "Rahul Sharma", "RS;The Architect;Sharma-ji", "84", "A-42, Defence Colony, New Delhi", "Logistics Consultant", "CASE-0142;CASE-0891"],
    ["P-089", "Vikram Singh", "Vicky;Transport In-charge", "68", "Flat 304, Green Park Extension, New Delhi", "Fleet Operations Supervisor", "CASE-0142"],
    ["P-102", "Amit Kumar", "AK;The Auditor;Dr. Kumar", "89", "Villa 18, Nirvana Country, Gurugram", "Financial Auditor", "CASE-0142;CASE-0304"],
    ["P-044", "Priya Verma", "PV;The Signatory", "61", "Sector 15, Noida, UP", "Corporate Director", "CASE-0142;CASE-0304"],
    ["P-077", "Devang Patel", "DP;Dispatcher", "72", "Vashi Sector 9, Navi Mumbai", "Regional Logistics Agent", "CASE-0142;CASE-0304"],
    ["P-095", "Farooq Merchant", "FM;Broker Farooq", "77", "Kurla West, Mumbai", "Customs Clearing Agent", "CASE-0142"],
    ["P-058", "Tariq Sheikh", "TS;Cashier", "81", "Panvel Industrial Bay, Maharashtra", "Remittance Handler", "CASE-0304"]
]
write_csv("persons.csv", persons_headers, persons_rows)

# 2. phones.csv
phones_headers = ["phone_number", "imei", "subscriber_name", "imsi", "first_seen", "last_seen", "notes"]
phones_rows = [
    ["PH-092", "864902041189201", "Rahul Sharma", "404450192841001", "2026-01-10", "2026-03-12", "Encrypted Endpoint X"],
    ["PH-041", "358902019401294", "Vikram Singh", "404450192841002", "2026-01-15", "2026-03-12", "Fleet Operations Mobile"],
    ["PH-055", "862210049921001", "Amit Kumar", "404450192841003", "2026-02-01", "2026-03-13", "Private Channel Line"],
    ["PH-078", "351098442110944", "Devang Patel", "404450192841004", "2026-02-10", "2026-03-13", "Dispatch Mobile Terminal"],
    ["PH-088", "867741029410291", "Farooq Merchant", "404450192841005", "2026-02-12", "2026-03-13", "Intermediary Clearing Line"]
]
write_csv("phones.csv", phones_headers, phones_rows)

# 3. vehicles.csv
vehicles_headers = ["registration_plate", "make_model", "color", "chassis_number", "registered_owner", "vehicle_type"]
vehicles_rows = [
    ["VH-0231", "Mahindra Scorpio SUV", "Dark Blue", "MA1TA2SC992011", "Falcon Logistics Ltd", "SUV Transit Asset"],
    ["VH-0701", "Toyota Fortuner", "Black", "MB8TC4FO109482", "Apex Trade Solutions LLP", "Executive Transport"],
    ["VH-0802", "Honda City Sedan", "Silver", "HC9AK1CI774109", "Farooq Merchant", "Private Sedan"]
]
write_csv("vehicles.csv", vehicles_headers, vehicles_rows)

# 4. locations.csv
locations_headers = ["location_id", "name", "address", "latitude", "longitude", "location_type"]
locations_rows = [
    ["LOC-004", "Safehouse Sector 42", "Plot 104, Sector 42, Gurugram, Haryana", "28.4595", "77.0266", "Safehouse Rendezvous"],
    ["LOC-009", "Terminal 3 Cargo Hub", "Cargo Complex, Terminal 3, IGI Airport, New Delhi", "28.5562", "77.0999", "Air Cargo Terminal"],
    ["LOC-014", "Aerocity Hospitality District", "Hotel Grand, Aerocity, New Delhi", "28.5492", "77.1215", "Hospitality / Meeting Venue"],
    ["LOC-022", "Vashi Toll Plaza", "Sion-Panvel Expressway, Navi Mumbai", "19.0760", "72.9984", "Expressway Toll ANPR"],
    ["LOC-033", "Panvel Industrial Area", "MIDC Industrial Estate, Panvel, Maharashtra", "18.9894", "73.1175", "Industrial Warehouse Yard"]
]
write_csv("locations.csv", locations_headers, locations_rows)

# 5. organizations.csv
org_headers = ["org_id", "name", "registration_number", "address", "org_type", "status", "officers"]
org_rows = [
    ["ORG-008", "Shadow FinTech LLP", "U72900DL2024PTC112233", "Office 702, Barakhamba Road, Connaught Place, New Delhi", "Financial Shell Entity", "Active (Dormant Filing)", "P-102;P-044"],
    ["ORG-015", "Falcon Logistics Ltd", "U60200DL2020PLC881234", "Transport Nagar Yard 3, Delhi", "Commercial Fleet Carrier", "Active Commercial", "P-089"],
    ["ORG-022", "Apex Trade Solutions LLP", "U51909MH2023LLP992011", "Nariman Point Commercial Tower, Mumbai", "Import-Export Entity", "Active Operations", "P-077;P-058"]
]
write_csv("organizations.csv", org_headers, org_rows)

# 6. cases.csv
cases_headers = ["case_id", "title", "status", "classification", "jurisdiction", "start_date"]
cases_rows = [
    ["CASE-0142", "Operation Aegis (CR-2026-0142)", "Active Investigation", "Interstate Cargo Diversion & Hawala Settlement", "Special Cell Delhi", "2026-02-02"],
    ["CASE-0304", "Operation Black Swan (CR-2026-0304)", "Active Investigation", "Cross-Border Money Laundering & Shell Remittances", "ED Mumbai Zonal", "2026-01-15"],
    ["CASE-0891", "Operation Falcon Intercept (CR-2025-0891)", "Chargesheeted", "Commercial Carrier Smuggling", "Delhi Crime Branch", "2025-08-10"]
]
write_csv("cases.csv", cases_headers, cases_rows)

# 7. communications.csv
comms_headers = ["record_id", "caller_phone", "receiver_phone", "timestamp", "duration_sec", "tower_id", "case_id", "confidence", "call_type"]
comms_rows = [
    ["CDR-0087", "PH-092", "PH-041", "2026-03-12T14:32:00", "184", "TOWER-772", "CASE-0142", "0.94", "Voice - Encrypted App fallback"],
    ["CDR-0144", "PH-041", "PH-078", "2026-03-12T15:10:00", "112", "TOWER-772", "CASE-0142", "0.91", "Voice Call"],
    ["CDR-0201", "PH-078", "PH-088", "2026-03-12T15:25:00", "95", "TOWER-009", "CASE-0142", "0.88", "Voice Call"],
    ["CDR-0245", "PH-088", "PH-055", "2026-03-12T17:40:00", "210", "TOWER-014", "CASE-0304", "0.92", "Encrypted Voice"],
    ["CDR-0310", "PH-092", "PH-078", "2026-03-11T19:15:00", "60", "TOWER-004", "CASE-0142", "0.86", "SMS Dispatch"],
    ["CDR-0412", "PH-041", "PH-088", "2026-03-11T21:00:00", "145", "TOWER-004", "CASE-0142", "0.89", "Voice Call"]
]
write_csv("communications.csv", comms_headers, comms_rows)

# 8. transactions.csv
txns_headers = ["transaction_id", "sender_account", "receiver_account", "sender_name", "receiver_name", "amount", "currency", "timestamp", "bank_name", "case_id", "confidence"]
txns_rows = [
    ["TXN-5501", "ACC-014", "ACC-098", "Rahul Sharma", "Shadow FinTech LLP", "2500000", "INR", "2026-03-11T11:20:00", "HDFC Bank CP", "CASE-0142", "0.95"],
    ["TXN-9912", "ACC-098", "ACC-055", "Shadow FinTech LLP", "Amit Kumar", "4500000", "INR", "2026-03-13T09:42:00", "Axis Bank CP", "CASE-0142", "0.96"],
    ["TXN-8822", "ACC-055", "ACC-022", "Amit Kumar", "Apex Trade Solutions LLP", "3000000", "INR", "2026-03-14T14:15:00", "Kotak Fort Branch", "CASE-0304", "0.93"],
    ["TXN-4411", "ACC-022", "ACC-058", "Apex Trade Solutions LLP", "Tariq Sheikh", "2200000", "INR", "2026-03-15T16:00:00", "ICICI Panvel", "CASE-0304", "0.91"]
]
write_csv("transactions.csv", txns_headers, txns_rows)

# 9. events.csv
events_headers = ["event_id", "name", "location_id", "timestamp", "description", "case_id", "confidence"]
events_rows = [
    ["EVT-001", "Aerocity Hotel Conclave", "LOC-014", "2026-03-11T20:30:00", "Syndicate rendezvous in private dining suite", "CASE-0142", "0.89"],
    ["EVT-002", "Safehouse Sector 42 Briefing", "LOC-004", "2026-03-11T22:15:00", "Late night operational handoff and cell co-location", "CASE-0142", "0.92"],
    ["EVT-003", "Cargo Gate Handoff", "LOC-009", "2026-03-12T16:12:00", "Physical observation of Amit Kumar entering Scorpio SUV", "CASE-0142", "0.95"]
]
write_csv("events.csv", events_headers, events_rows)

# 10. person_location_events.csv
ple_headers = ["record_id", "person_id", "location_id", "timestamp", "observation_type", "case_id", "confidence"]
ple_rows = [
    ["TOWER-772", "P-014", "LOC-004", "2026-03-11T22:15:00", "Cell Tower Co-location Dump", "CASE-0142", "0.91"],
    ["TOWER-773", "P-089", "LOC-004", "2026-03-11T22:30:00", "Cell Tower Co-location Dump", "CASE-0142", "0.88"],
    ["SURV-041", "P-014", "LOC-014", "2026-03-11T20:30:00", "Physical Field Observation", "CASE-0142", "0.85"],
    ["SURV-042", "P-089", "LOC-014", "2026-03-11T20:45:00", "Physical Field Observation", "CASE-0142", "0.87"],
    ["SURV-089", "P-102", "LOC-009", "2026-03-12T16:10:00", "CCTV Gate Observation", "CASE-0142", "0.93"]
]
write_csv("person_location_events.csv", ple_headers, ple_rows)

# 11. person_vehicle_events.csv
pve_headers = ["record_id", "person_id", "vehicle_reg", "timestamp", "role", "case_id", "confidence"]
pve_rows = [
    ["VEH-0231", "P-089", "VH-0231", "2026-03-12T15:45:00", "Driver", "CASE-0142", "0.92"],
    ["VEH-0232", "P-102", "VH-0231", "2026-03-12T16:12:00", "Passenger", "CASE-0142", "0.87"],
    ["VEH-0701", "P-077", "VH-0701", "2026-03-13T10:00:00", "Driver", "CASE-0304", "0.94"],
    ["VEH-0702", "P-058", "VH-0701", "2026-03-13T10:30:00", "Passenger", "CASE-0304", "0.89"]
]
write_csv("person_vehicle_events.csv", pve_headers, pve_rows)

# 12. case_person_links.csv
cpl_headers = ["link_id", "case_id", "person_id", "role", "date_added", "confidence"]
cpl_rows = [
    ["CPL-01", "CASE-0142", "P-014", "Prime Investigation Target", "2026-02-02", "0.98"],
    ["CPL-02", "CASE-0142", "P-089", "Fleet Logistics Supervisor", "2026-02-15", "0.92"],
    ["CPL-03", "CASE-0142", "P-102", "Financial Layering Signatory", "2026-03-01", "0.89"],
    ["CPL-04", "CASE-0304", "P-102", "Beneficial Entity Owner", "2026-01-15", "0.95"],
    ["CPL-05", "CASE-0304", "P-044", "Corporate Signatory", "2026-01-20", "0.91"],
    ["CPL-06", "CASE-0304", "P-058", "Remittance Operator", "2026-02-10", "0.88"]
]
write_csv("case_person_links.csv", cpl_headers, cpl_rows)

# 13. case_vehicle_links.csv
cvl_headers = ["link_id", "case_id", "vehicle_reg", "notes", "confidence"]
cvl_rows = [
    ["CVL-01", "CASE-0142", "VH-0231", "Suspect vehicle Scorpio logged at Terminal 3 Cargo Gate", "0.95"],
    ["CVL-02", "CASE-0304", "VH-0701", "Executive vehicle associated with cross-border remittance transit", "0.91"]
]
write_csv("case_vehicle_links.csv", cvl_headers, cvl_rows)

# 14. case_organization_links.csv
col_headers = ["link_id", "case_id", "org_id", "association_type", "confidence"]
col_rows = [
    ["COL-01", "CASE-0142", "ORG-015", "Commercial Carrier Transit Diversion", "0.98"],
    ["COL-02", "CASE-0142", "ORG-008", "Layered Account Entity for Settlement", "0.94"],
    ["COL-03", "CASE-0304", "ORG-008", "Shell Entity Corporate Inquiry", "0.96"],
    ["COL-04", "CASE-0304", "ORG-022", "Import-Export Remittance Shell", "0.92"]
]
write_csv("case_organization_links.csv", col_headers, col_rows)

# 15. fir_reports.csv
fir_headers = ["fir_id", "case_id", "filing_date", "sections", "narrative"]
fir_rows = [
    ["FIR-142", "CASE-0142", "2026-02-02", "IPC 120B/420/Customs Act", "Filing against unmanifested cargo transit and syndicate logistics diversion across Delhi-NCR."],
    ["FIR-304", "CASE-0304", "2026-01-15", "PMLA Sec 3 & 4", "Enforcement directorate filing regarding offshore shell layered remittances and hawala settlements."]
]
write_csv("fir_reports.csv", fir_headers, fir_rows)

# 16. ground_truth_hidden_relationships.csv (6 Ground-Truth Hidden Relationships for validation)
gt_headers = ["id", "source_entity_id", "target_entity_id", "source_name", "target_name", "expected_hops", "expected_path", "expected_supporting_records", "relationship_category", "description"]
gt_rows = [
    [
        "GTR-001",
        "P-014",
        "P-102",
        "Rahul Sharma",
        "Amit Kumar",
        "4",
        "P-014 -> PH-092 -> P-089 -> VH-0231 -> P-102",
        "CDR-0087;VEH-0231",
        "MULTI_HOP_LOGISTICS",
        "Rahul Sharma coordinates with Amit Kumar through encrypted Phone X, driver Vikram Singh, and vehicle DL-01-AB-4491 without direct communication."
    ],
    [
        "GTR-002",
        "P-014",
        "P-102",
        "Rahul Sharma",
        "Amit Kumar",
        "4",
        "P-014 -> ACC-014 -> ACC-098 -> ORG-008 -> P-102",
        "TXN-5501;TXN-9912",
        "FINANCIAL_CONDUIT",
        "Covert financial flow from Rahul Sharma to Amit Kumar via corporate account ACC-098 and shell firm Shadow FinTech LLP."
    ],
    [
        "GTR-003",
        "P-014",
        "P-089",
        "Rahul Sharma",
        "Vikram Singh",
        "2",
        "P-014 -> LOC-004 -> P-089",
        "TOWER-772;TOWER-773",
        "CO_LOCATION",
        "Spatial-temporal co-location between Rahul Sharma and Vikram Singh at Safehouse Sector 42 confirmed by concurrent tower triangulation."
    ],
    [
        "GTR-004",
        "P-102",
        "P-044",
        "Amit Kumar",
        "Priya Verma",
        "2",
        "P-102 -> ORG-008 -> P-044",
        "TXN-9912;COL-02;COL-03",
        "CORPORATE_SHELL",
        "Amit Kumar and Priya Verma maintain joint beneficial control of Shadow FinTech LLP without direct communication on record."
    ],
    [
        "GTR-005",
        "P-014",
        "P-077",
        "Rahul Sharma",
        "Devang Patel",
        "3",
        "P-014 -> PH-092 -> P-089 -> P-077",
        "CDR-0087;CDR-0144",
        "SHARED_COMMUNICATIONS",
        "Cellular communication dispatch chain from Rahul Sharma through burner Phone X to regional dispatcher Devang Patel."
    ],
    [
        "GTR-006",
        "P-089",
        "CASE-0304",
        "Vikram Singh",
        "Operation Black Swan (CR-2026-0304)",
        "4",
        "P-089 -> VH-0231 -> P-102 -> ORG-008 -> CASE-0304",
        "VEH-0231;TXN-9912;COL-03",
        "CROSS_CASE_SYNDICATE",
        "Transit supervisor Vikram Singh in Case CR-2026-0142 is linked across 4 hops to financial laundering Case CR-2026-0304."
    ]
]
write_csv("ground_truth_hidden_relationships.csv", gt_headers, gt_rows)
print("All 16 relational CSV files successfully generated in backend/data!")
