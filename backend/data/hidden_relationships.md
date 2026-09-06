# Hidden Relationships — Ground Truth Reference

Dataset: **SIH26189 Investigation Dataset** (fictional/synthetic). This file documents the 6 hidden multi-hop relationships deliberately planted in the data. Each one is spread across multiple independent records and is never stated directly in any single report — it can only be recovered by traversing the graph.

| # | Difficulty | Type | Endpoints |
|---|---|---|---|
| GT004 | easy | hidden_location_temporal_bridge | P015 (Sonali Raghavan) ↔ P030 (Akash Swamy) |
| GT002 | medium | hidden_shared_vehicle_case_link | P005 (Rashi Unnikrishnan) ↔ CASE04 |
| GT006 | medium | hidden_organization_bridge | P009 (Mandira Raina) ↔ CASE03 |
| GT001 | hard | hidden_communication_bridge | P003 (Garima Bhattacharya) ↔ P020 (Shailesh Arora) |
| GT003 | hard | hidden_financial_bridge | P007 (Monika Vaidyanathan) ↔ P025 (Konkana Saini) |
| GT005 | hard | hidden_cross_case_multihop | CASE02 ↔ CASE08 |

---

## GT004 — hidden location temporal bridge (easy)

**Endpoints:** P015 (Sonali Raghavan) (person) ↔ P030 (Akash Swamy) (person)

**Path:**
```
P015 -> PLE001 (visited LOC17) -> LOC17 -> PLE002 (observed) -> P030
```

**Explanation:** P015 was recorded visiting bridge location LOC17 on Mar 10, 2026; P030 was independently observed at the same location on Mar 12, 2026 — a 2-day temporal window. Neither record mentions the other person.

**Supporting records:** PLE001,PLE002

**Supporting cases:** —

**Temporal window:** 2026-03-10 to 2026-03-12

---

## GT002 — hidden shared vehicle case link (medium)

**Endpoints:** P005 (Rashi Unnikrishnan) (person) ↔ CASE04 (case)

**Path:**
```
P005 -> VH02 (owner) -> PVE003/PVE004 -> P012 (primary_user) -> case_person_links -> CASE04
```

**Explanation:** P005 owns vehicle VH02. The same vehicle's primary user, P012, is linked to CASE04 as an associate. The vehicle observation records (P005 with VH02 in January, P012 with VH02 in February) independently establish the shared-vehicle link that connects P005 to CASE04.

**Supporting records:** PVE003,PVE004

**Supporting cases:** CASE04

**Temporal window:** 2026-01-10 to 2026-02-15

---

## GT006 — hidden organization bridge (medium)

**Endpoints:** P009 (Mandira Raina) (person) ↔ CASE03 (case)

**Path:**
```
P009 -> employed_at -> ORG02 <- employed_at -> P016 -> case_person_links -> CASE03
```

**Explanation:** P009 and P016 are both associated with organization ORG02 (organization_id on the persons table). P016 is separately linked to CASE03 as a witness. This shared-employer relationship connects P009 to CASE03 without any record stating it directly.

**Supporting records:** —

**Supporting cases:** CASE03

**Temporal window:** 2026-01-01 to 2026-01-22

---

## GT001 — hidden communication bridge (hard)

**Endpoints:** P003 (Garima Bhattacharya) (person) ↔ P020 (Shailesh Arora) (person)

**Path:**
```
P003 -> PH003 -> COMM0001 -> PH010 -> P011 -> PVE001/PVE002 -> VH05 -> P020
```

**Explanation:** P003 owns phone PH003 which communicated once with PH010 owned by P011. Vehicle VH05, independently observed with P011 (Jan 25) and later with P020 (Mar 20) as its primary user, bridges P011 to P020. No single record states P003 is connected to P020.

**Supporting records:** COMM0001,PVE001,PVE002

**Supporting cases:** —

**Temporal window:** 2026-01-25 to 2026-03-20

---

## GT003 — hidden financial bridge (hard)

**Endpoints:** P007 (Monika Vaidyanathan) (person) ↔ P025 (Konkana Saini) (person)

**Path:**
```
P007 -> ACC05 (holder) -> TXN0001 -> ACC13 -> P025 (holder)
```

**Explanation:** P007 holds bank account ACC05, which transferred funds directly to ACC13 held by P025, amid otherwise ordinary transaction activity on both accounts. No record states P007 and P025 know each other.

**Supporting records:** TXN0001

**Supporting cases:** —

**Temporal window:** 2026-03-08

---

## GT005 — hidden cross case multihop (hard)

**Endpoints:** CASE02 (case) ↔ CASE08 (case)

**Path:**
```
CASE02 -> case_person_links -> P004 -> PH004 (phone_number 7875270817, reassigned) -> PH029 -> P028 (owner) -> VH11 (primary_user) -> case_vehicle_links -> CASE08
```

**Explanation:** P004, a person of interest in CASE02, owned phone number 7875270817 (as PH004) until Feb 15, 2026. The same number was reassigned to P028 (as PH029) from Feb 16, 2026. P028 is the primary user of vehicle VH11, which was observed and logged in CASE08. This chains CASE02 to CASE08 purely through a reused phone number and a vehicle record — never stated directly in any single report.

**Supporting records:** PH004,PH029,VH11

**Supporting cases:** CASE02,CASE08

**Temporal window:** 2026-02-15 to 2026-03-10

---

## Summary

- Total hidden relationships: 6
- Difficulty mix: 1 easy, 2 medium, 3 hard
- None of these relationships are stated directly in any single `fir_reports.narrative` — each requires joining across at least 2 tables/records to reconstruct.
- Full machine-readable version: `hidden_relationships.json` / query the `ground_truth_hidden_relationships` table directly.
