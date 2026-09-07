# AI-Assisted Criminal Intelligence & Link Discovery Platform
**Prototype for SIH26189 – AI-Powered Criminal Network Analysis System**

> **SYNTHETIC DATA — PROTOTYPE ONLY**  
> **Mandate**: This platform is an investigative relationship-discovery system designed to uncover hidden paths and anomalous patterns across fragmented records for human investigators.  
> **Ethics**: The system does **not** predict crime, prove guilt, or make autonomous decisions. The human investigator remains the final decision-maker.

---

## 1. System Pipeline

```
Synthetic Investigation Records (CSV / JSON / TXT)
            ↓
Data Upload / Ingestion Interface
            ↓
Entity Extraction (Person, Phone, Vehicle, Location, Org, Account, Case, Event)
            ↓
Entity Resolution (Alias matching, IMEI/Registration normalization)
            ↓
Knowledge Graph Construction (Cytoscape.js + NetworkX)
            ↓
Graph Analysis (Bridge detection, Degree centrality)
            ↓
Hidden Relationship Detection (Multi-hop path tracing)
            ↓
Evidence-Backed Investigative Lead (Confidence scores + Source records)
            ↓
Investigator Dashboard & Network Hero Workspace
```

---

## 2. Key Features

- **"JARVIS meets Intelligence Station" Aesthetic**: Deep obsidian palette (`#050813`), glass panels, HUD coordinates, cyber-cyan (`#00f0ff`) glow accents, and live telemetry clock.
- **Sequential Multi-Hop Path Reveal**:
  - `Rahul Sharma (P-014)` ➔ `Phone X (+91 98110-XXXXX)` ➔ `Vikram Singh (P-089)` ➔ `Vehicle V (DL-01-AB-4491)` ➔ `Amit Kumar (P-102)`
  - 5-stage analysis HUD stepper (`ANALYZING NETWORK` ➔ `RESOLVING ENTITY CONNECTIONS` ➔ `TRACING MULTI-HOP RELATIONSHIPS` ➔ `CROSS-REFERENCING EVIDENCE` ➔ `POTENTIAL RELATIONSHIP DETECTED`).
  - Sequentially illuminates nodes and edge threads on the Cytoscape.js graph.
- **Evidence Traceability**: Every link and lead references verifiable synthetic records (`#CDR-0087`, `#VEH-0231`, `#CASE-0142`, `#TXN-9912`, `#TOWER-772`). Clicking any edge displays the raw source docket.
- **Human Verification Required**: Dedicated compliance controls and alerts on all anomalous leads.
- **JARVIS Command Bar**: Quick-query prompt for structured investigation commands.
- **Dual Architecture**:
  - **Frontend**: Vite + React + TypeScript + Tailwind CSS + Cytoscape.js (with zero-dependency fallback mock adapter).
  - **Backend**: FastAPI + NetworkX graph engine with fallback HTTP server.

---

## 3. Quick Start

### Frontend (User Interface)
```bash
cd frontend
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Backend (FastAPI Intelligence Engine)
```bash
pip install -r requirements.txt
python3 backend/main.py
```
Runs at [http://localhost:8000](http://localhost:8000). The frontend automatically connects to the backend or seamlessly uses the internal synthetic engine if the backend is offline.

---

## 4. Evaluation Demo Flow (8 Steps)

1. **Step 1 - Command Center**: Inspect the HUD header (`SYSTEM ONLINE`, `SYNTHETIC DATA — PROTOTYPE`, live IST clock) and high-level metric cards (`Records: 428`, `Entities: 173`, `Relationships: 812`, `Active Cases: 14`, `Potential Leads: 23`, `Anomalies: 7`).
2. **Step 2 - Data Ingestion**: Navigate to **DATA INGESTION**, choose the preloaded *"Operation Aegis Pack"*, and observe the 7-step pipeline animation (`Records received` ➔ `Analysis complete`).
3. **Step 3 - Network Investigation**: Open **NETWORK** (Hero screen), search *"Rahul Sharma"*, and observe the graph center and dim unrelated entities.
4. **Step 4 - Find Hidden Relationships**: Click the primary cyan button **"FIND HIDDEN RELATIONSHIPS"** to trigger the 5-stage HUD analysis transition.
5. **Step 5 - Multi-Hop Path Animation**: Watch the sequential illumination across the 4-hop chain:
   `Rahul Sharma` ➔ `Phone X` ➔ `Vikram Singh` ➔ `Vehicle V` ➔ `Amit Kumar`.
6. **Step 6 - Investigative Lead Dossier**: Inspect the right-hand panel showing confidence (87%), path length (4 hops), why flagged, and the mandatory `⚠ HUMAN VERIFICATION REQUIRED` alert.
7. **Step 7 - Raw Evidence Inspection**: Click `#CDR-0087` or `#VEH-0231` to view raw cell tower timestamps, ANPR camera logs, and investigator notes.
8. **Step 8 - Evidence Timeline**: Navigate to **EVIDENCE** to inspect the chronological timeline proving the link across fragmented records.
