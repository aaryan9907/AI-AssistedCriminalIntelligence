"""
FastAPI Backend Application
SIH26189 – AI-Powered Criminal Network Analysis System
"""

import json
import sys
from typing import Optional, List, Dict, Any

from synthetic_dataset import (
    SYNTHETIC_ENTITIES,
    SYNTHETIC_RELATIONSHIPS,
    SYNTHETIC_EVIDENCE,
    SYNTHETIC_LEADS,
    SYNTHETIC_TIMELINE
)
from graph_engine import IntelGraphEngine
from ingestion_pipeline import IngestionPipeline

graph_engine = IntelGraphEngine(SYNTHETIC_ENTITIES, SYNTHETIC_RELATIONSHIPS)
ingestion_pipeline = IngestionPipeline()

SYSTEM_STATS = {
    "totalRecords": 428,
    "totalEntities": len(SYNTHETIC_ENTITIES),
    "totalRelationships": len(SYNTHETIC_RELATIONSHIPS),
    "activeCases": 14,
    "potentialLeads": len(SYNTHETIC_LEADS),
    "anomalousPatterns": 7,
    "systemStatus": "ONLINE",
    "datasetName": "SYNTHETIC INTEL DB v2.4 (OP AEGIS)",
    "lastUpdated": "05 Sep 2026 23:40 IST"
}

try:
    from fastapi import FastAPI, HTTPException, Query
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel

    app = FastAPI(
        title="AI-Assisted Criminal Intelligence & Link Discovery API",
        version="1.0.0",
        description="API for SIH26189 prototype"
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    class BatchFileItem(BaseModel):
        name: str
        type: Optional[str] = "CSV"
        recordsCount: Optional[int] = 50

    class IngestRequest(BaseModel):
        fileName: Optional[str] = None
        fileType: Optional[str] = None
        recordsCount: Optional[int] = 54
        files: Optional[List[BatchFileItem]] = None

    @app.get("/api/stats")
    def get_stats():
        return SYSTEM_STATS

    @app.get("/api/entities")
    def get_entities():
        return SYNTHETIC_ENTITIES

    @app.get("/api/entities/{entity_id}")
    def get_entity(entity_id: str):
        for e in SYNTHETIC_ENTITIES:
            if e["id"].lower() == entity_id.lower() or e["name"].lower() == entity_id.lower():
                return e
        raise HTTPException(status_code=404, detail="Entity not found")

    @app.get("/api/graph")
    def get_graph():
        return {
            "entities": SYNTHETIC_ENTITIES,
            "relationships": SYNTHETIC_RELATIONSHIPS
        }

    @app.get("/api/graph/path")
    def get_path(source: str = Query(...), target: str = Query(...)):
        path = graph_engine.find_shortest_path(source, target)
        if path:
            return {
                "source": source,
                "target": target,
                "path": path,
                "confidenceScore": 0.87,
                "pathLength": len(path) - 1
            }
        # Fallback to primary lead
        return SYNTHETIC_LEADS[0]

    @app.get("/api/leads")
    def get_leads():
        return SYNTHETIC_LEADS

    @app.get("/api/leads/{lead_id}")
    def get_lead(lead_id: str):
        for l in SYNTHETIC_LEADS:
            if l["id"] == lead_id:
                return l
        raise HTTPException(status_code=404, detail="Lead not found")

    @app.get("/api/evidence/{evidence_id}")
    def get_evidence(evidence_id: str):
        if evidence_id in SYNTHETIC_EVIDENCE:
            return SYNTHETIC_EVIDENCE[evidence_id]
        raise HTTPException(status_code=404, detail="Evidence record not found")

    @app.get("/api/timeline")
    def get_timeline():
        return SYNTHETIC_TIMELINE

    @app.post("/api/ingest")
    def ingest_records(payload: IngestRequest):
        files_to_process = payload.files or [{"name": payload.fileName or "batch.csv"}]
        res = ingestion_pipeline.process_records(files_to_process)
        total_to_add = 0
        if payload.files:
            total_to_add = sum(f.recordsCount or 50 for f in payload.files)
        else:
            total_to_add = payload.recordsCount or 54
        SYSTEM_STATS["totalRecords"] += total_to_add
        return {"success": True, "stats": SYSTEM_STATS, "pipeline": res}

    if __name__ == "__main__":
        import uvicorn
        print("Starting FastAPI intelligence server on port 8000...")
        uvicorn.run(app, host="0.0.0.0", port=8000)

except ImportError:
    # Standard Python HTTP server fallback
    from http.server import HTTPServer, BaseHTTPRequestHandler
    from urllib.parse import urlparse, parse_qs

    class FallbackHandler(BaseHTTPRequestHandler):
        def _send_json(self, data, status=200):
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "*")
            self.send_header("Access-Control-Allow-Headers", "*")
            self.end_headers()
            self.wfile.write(json.dumps(data).encode("utf-8"))

        def do_OPTIONS(self):
            self.send_response(200)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "*")
            self.send_header("Access-Control-Allow-Headers", "*")
            self.end_headers()

        def do_GET(self):
            parsed = urlparse(self.path)
            path = parsed.path
            if path == "/api/stats":
                self._send_json(SYSTEM_STATS)
            elif path == "/api/entities":
                self._send_json(SYNTHETIC_ENTITIES)
            elif path.startswith("/api/entities/"):
                ent_id = path.split("/")[-1]
                for e in SYNTHETIC_ENTITIES:
                    if e["id"].lower() == ent_id.lower() or e["name"].lower() == ent_id.lower():
                        self._send_json(e)
                        return
                self._send_json({"error": "Not found"}, 404)
            elif path == "/api/graph":
                self._send_json({"entities": SYNTHETIC_ENTITIES, "relationships": SYNTHETIC_RELATIONSHIPS})
            elif path == "/api/leads":
                self._send_json(SYNTHETIC_LEADS)
            elif path == "/api/timeline":
                self._send_json(SYNTHETIC_TIMELINE)
            elif path.startswith("/api/evidence/"):
                ev_id = path.split("/")[-1]
                if ev_id in SYNTHETIC_EVIDENCE:
                    self._send_json(SYNTHETIC_EVIDENCE[ev_id])
                else:
                    self._send_json({"error": "Not found"}, 404)
            else:
                self._send_json(SYSTEM_STATS)

        def do_POST(self):
            if self.path == "/api/ingest":
                SYSTEM_STATS["totalRecords"] += 54
                self._send_json({"success": True, "stats": SYSTEM_STATS})
            else:
                self._send_json({"error": "Not found"}, 404)

    if __name__ == "__main__":
        server = HTTPServer(("0.0.0.0", 8000), FallbackHandler)
        print("Starting fallback HTTP intelligence server on port 8000...")
        server.serve_forever()
