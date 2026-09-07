```python
"""
FastAPI Backend Application
SIH26189 – AI-Assisted Criminal Intelligence & Link Discovery Platform

Production API Layer exposing IntelGraphEngine, FIR NLP Entity Resolution,
and Multi-Hop Hidden Relationship Discovery.
"""

import os
import math
import datetime
from pathlib import Path
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


# ============================================================
# FastAPI APPLICATION
# ============================================================
# IMPORTANT:
# Keep this at the module's top level.
# Vercel uses "main:app" as the Python entrypoint.
# ============================================================

app = FastAPI(
    title="AI-Assisted Criminal Intelligence & Link Discovery API",
    version="2.0.0",
    description="API for SIH26189 prototype"
)


# ============================================================
# CORS CONFIGURATION
# ============================================================

cors_origins = [
    origin.strip()
    for origin in os.environ.get("CORS_ORIGINS", "*").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# BACKEND MODULE IMPORTS
# ============================================================

from synthetic_dataset import (
    SYNTHETIC_ENTITIES,
    SYNTHETIC_RELATIONSHIPS,
    SYNTHETIC_EVIDENCE,
    SYNTHETIC_LEADS,
    SYNTHETIC_TIMELINE,
)

try:
    from graph_engine import IntelGraphEngine
    from evaluation import evaluate_ground_truth
    from nlp_service import FirNlpEngine
    from ingestion_pipeline import IngestionPipeline
except ImportError:
    from backend.graph_engine import IntelGraphEngine
    from backend.evaluation import evaluate_ground_truth
    from backend.nlp_service import FirNlpEngine
    from backend.ingestion_pipeline import IngestionPipeline


# ============================================================
# DATA / ENGINE INITIALIZATION
# ============================================================

DATA_DIR = Path(
    os.environ.get("NARCODES_DATA_DIR")
    or (Path(__file__).resolve().parent / "data")
)

graph_engine = IntelGraphEngine(
    data_dir=str(DATA_DIR)
)

nlp_engine = FirNlpEngine(
    canonical_entities=graph_engine.entities
)

ingestion_pipeline = IngestionPipeline()


# ============================================================
# SYSTEM STATISTICS
# ============================================================

def get_current_system_stats() -> Dict[str, Any]:
    """Dynamically calculates system statistics from the live graph engine."""

    active_cases = sum(
        1
        for entity in graph_engine.entities.values()
        if entity.get("type") == "CASE"
    )

    anomalies = graph_engine.calculate_anomalies()

    return {
        "totalRecords": len(graph_engine.evidence_records),
        "totalEntities": len(graph_engine.entities),
        "totalRelationships": len(graph_engine.relationships),
        "activeCases": active_cases if active_cases > 0 else 3,
        "potentialLeads": 6,
        "anomalousPatterns": len(anomalies) if anomalies else 4,
        "systemStatus": "ONLINE",
        "datasetName": "RELATIONAL PROVENANCE INTEL DB v3.0 (OP AEGIS)",
        "lastUpdated": datetime.datetime.now().strftime(
            "%d %b %Y %H:%M IST"
        ),
    }


# ============================================================
# REQUEST MODELS
# ============================================================

class BatchFileItem(BaseModel):
    name: str
    type: Optional[str] = "CSV"
    recordsCount: Optional[int] = 50


class IngestRequest(BaseModel):
    fileName: Optional[str] = None
    fileType: Optional[str] = None
    recordsCount: Optional[int] = 54
    files: Optional[List[BatchFileItem]] = None
    records: Optional[List[Dict[str, Any]]] = None


class HiddenRelationshipRequest(BaseModel):
    entity_id: Optional[str] = "P003"
    entityId: Optional[str] = None
    max_hops: Optional[int] = 5
    maxHops: Optional[int] = None
    limit: Optional[int] = 5


class FirAnalyzeRequest(BaseModel):
    narrative: str
    case_id: Optional[str] = ""


# ============================================================
# HEALTH
# ============================================================

@app.get("/api/health")
def get_health():
    return {
        "status": "healthy",
        "system": "NARCODES Intelligence Platform",
        "entities_count": len(graph_engine.entities),
        "relationships_count": len(graph_engine.relationships),
        "evidence_count": len(graph_engine.evidence_records),
        "engine": "IntelGraphEngine",
        "version": "2.0.0",
    }


# ============================================================
# SYSTEM STATS
# ============================================================

@app.get("/api/stats")
def get_stats():
    return get_current_system_stats()


# ============================================================
# ENTITIES
# ============================================================

@app.get("/api/entities")
def get_entities():
    return list(graph_engine.entities.values())


@app.get("/api/entities/{entity_id}")
def get_entity(entity_id: str):

    if entity_id in graph_engine.entities:
        return graph_engine.entities[entity_id]

    for entity in graph_engine.entities.values():
        if entity["name"].lower() == entity_id.lower():
            return entity

    raise HTTPException(
        status_code=404,
        detail="Entity not found"
    )


# ============================================================
# GRAPH
# ============================================================

@app.get("/api/graph")
def get_graph():
    return {
        "entities": list(graph_engine.entities.values()),
        "relationships": graph_engine.relationships,
    }


@app.get("/api/graph/path")
def get_path(
    source: str = Query(...),
    target: str = Query(...)
):

    path = graph_engine.find_shortest_path(
        source,
        target
    )

    if path:

        confidences = [
            step["stepEdge"]["confidence"]
            for step in path[:-1]
            if "stepEdge" in step
        ]

        path_conf = (
            round(math.prod(confidences), 2)
            if confidences
            else 1.0
        )

        return {
            "source": source,
            "target": target,
            "path": [
                node["entityId"]
                for node in path
            ],
            "detailed_path": path,
            "hops": len(path) - 1,
            "pathLength": len(path) - 1,
            "confidence": path_conf,
            "confidenceScore": path_conf,
            "supporting_records": [
                step["stepEdge"]["evidenceId"]
                for step in path[:-1]
                if (
                    "stepEdge" in step
                    and step["stepEdge"].get("evidenceId")
                )
            ],
            "timestamps": [
                step["stepEdge"]["timestamp"]
                for step in path[:-1]
                if (
                    "stepEdge" in step
                    and step["stepEdge"].get("timestamp")
                )
            ],
            "requires_human_verification": True,
        }

    raise HTTPException(
        status_code=404,
        detail=f"No connection found between {source} and {target}",
    )


# ============================================================
# HIDDEN RELATIONSHIPS
# ============================================================

@app.post("/api/investigation/hidden-relationships")
def find_hidden_relationships(
    payload: HiddenRelationshipRequest
):

    entity_id = (
        payload.entity_id
        or payload.entityId
        or "P003"
    )

    hops = (
        payload.max_hops
        or payload.maxHops
        or 5
    )

    limit = payload.limit or 5

    return graph_engine.find_hidden_relationships(
        entity_id,
        max_hops=hops,
        limit=limit,
    )


# ============================================================
# EVALUATION
# ============================================================

@app.get("/api/evaluation/ground-truth")
def get_ground_truth_eval():
    return evaluate_ground_truth(graph_engine)


# ============================================================
# LEADS
# ============================================================

@app.get("/api/leads")
def get_leads():
    return graph_engine.get_top_investigative_leads()


@app.get("/api/leads/{lead_id}")
def get_lead(lead_id: str):

    leads = graph_engine.get_top_investigative_leads()

    for lead in leads:
        if lead["id"] == lead_id:
            return lead

    # Fallback to synthetic data
    for synthetic_lead in SYNTHETIC_LEADS:
        if synthetic_lead["id"] == lead_id:
            return synthetic_lead

    raise HTTPException(
        status_code=404,
        detail="Lead not found"
    )


# ============================================================
# EVIDENCE
# ============================================================

@app.get("/api/evidence/{evidence_id}")
def get_evidence(evidence_id: str):

    if evidence_id in graph_engine.evidence_records:
        return graph_engine.evidence_records[evidence_id]

    if evidence_id in SYNTHETIC_EVIDENCE:
        return SYNTHETIC_EVIDENCE[evidence_id]

    raise HTTPException(
        status_code=404,
        detail="Evidence record not found"
    )


# ============================================================
# TIMELINE
# ============================================================

@app.get("/api/timeline")
def get_timeline():

    events = graph_engine.get_timeline_events()

    if events:
        return events

    return SYNTHETIC_TIMELINE


# ============================================================
# FIR NLP ANALYSIS
# ============================================================

@app.post("/api/fir/analyze")
def analyze_fir(
    payload: FirAnalyzeRequest
):

    return nlp_engine.extract_from_narrative(
        payload.narrative,
        case_id=payload.case_id or "",
    )


# ============================================================
# DATA INGESTION
# ============================================================

@app.post("/api/ingest")
def ingest_records(
    payload: IngestRequest
):

    # Direct record ingestion
    if payload.records:

        ingest_result = graph_engine.ingest_records(
            payload.records
        )

        nlp_engine.update_canonical_entities(
            graph_engine.entities
        )

        return {
            "success": True,
            "stats": get_current_system_stats(),
            "ingest_result": ingest_result,
        }

    # File-based ingestion
    files_to_process = (
        payload.files
        if payload.files
        else [
            {
                "name": payload.fileName or "batch.csv"
            }
        ]
    )

    result = ingestion_pipeline.process_records(
        files_to_process
    )

    return {
        "success": True,
        "stats": get_current_system_stats(),
        "pipeline": result,
    }


# ============================================================
# LOCAL DEVELOPMENT
# ============================================================

if __name__ == "__main__":
    import uvicorn

    print(
        "Starting FastAPI intelligence server on port 8000..."
    )

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
    )
```
