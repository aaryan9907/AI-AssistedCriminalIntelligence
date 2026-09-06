import { 
  Entity, 
  Relationship, 
  EvidenceRecord, 
  InvestigativeLead, 
  TimelineEvent, 
  SystemStats 
} from '../types/intel';
import { 
  INITIAL_STATS, 
  MOCK_ENTITIES, 
  MOCK_RELATIONSHIPS, 
  MOCK_EVIDENCE_RECORDS, 
  MOCK_LEADS, 
  MOCK_TIMELINE_EVENTS 
} from './mockDataService';

// Dynamic API Base URL supporting VITE_API_URL for production deployments
const API_BASE = ((import.meta as any).env?.VITE_API_URL || '').replace(/\/$/, '');

class IntelApiService {
  private useMockFallback = true;
  private backendChecked = false;

  private async checkBackend(): Promise<boolean> {
    if (this.backendChecked) return !this.useMockFallback;
    try {
      const res = await fetch(`${API_BASE}/api/health`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) {
        this.useMockFallback = false;
        console.log(`[IntelApiService] Connected to live FastAPI Backend at ${API_BASE || 'origin'}/api`);
      } else {
        this.useMockFallback = true;
      }
    } catch {
      try {
        const resStats = await fetch(`${API_BASE}/api/stats`, { signal: AbortSignal.timeout(1500) });
        if (resStats.ok) {
          this.useMockFallback = false;
          console.log(`[IntelApiService] Connected to live Backend via /api/stats`);
        } else {
          this.useMockFallback = true;
        }
      } catch {
        this.useMockFallback = true;
        console.log('[IntelApiService] Standalone mode fallback');
      }
    }
    this.backendChecked = true;
    return !this.useMockFallback;
  }

  async getHealth(): Promise<any> {
    const live = await this.checkBackend();
    if (live) {
      try {
        const res = await fetch(`${API_BASE}/api/health`);
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('API error in getHealth', e);
      }
    }
    return { status: 'offline', version: '2.0.0' };
  }

  async getStats(): Promise<SystemStats> {
    const live = await this.checkBackend();
    if (live) {
      try {
        const res = await fetch(`${API_BASE}/api/stats`);
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('API error, falling back to mock stats', e);
      }
    }
    return INITIAL_STATS;
  }

  async getEntities(): Promise<Entity[]> {
    const live = await this.checkBackend();
    if (live) {
      try {
        const res = await fetch(`${API_BASE}/api/entities`);
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('API error, falling back to mock entities', e);
      }
    }
    return MOCK_ENTITIES;
  }

  async getEntityById(id: string): Promise<Entity | null> {
    const live = await this.checkBackend();
    if (live) {
      try {
        const res = await fetch(`${API_BASE}/api/entities/${encodeURIComponent(id)}`);
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('API error, falling back to mock entity', e);
      }
    }
    return MOCK_ENTITIES.find(e => e.id.toLowerCase() === id.toLowerCase() || e.name.toLowerCase() === id.toLowerCase()) || null;
  }

  async getGraph(): Promise<{ entities: Entity[]; relationships: Relationship[] }> {
    const live = await this.checkBackend();
    if (live) {
      try {
        const res = await fetch(`${API_BASE}/api/graph`);
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('API error, falling back to mock graph', e);
      }
    }
    return {
      entities: MOCK_ENTITIES,
      relationships: MOCK_RELATIONSHIPS
    };
  }

  async getPath(sourceId: string, targetId: string): Promise<any> {
    const live = await this.checkBackend();
    if (live) {
      try {
        const res = await fetch(`${API_BASE}/api/graph/path?source=${encodeURIComponent(sourceId)}&target=${encodeURIComponent(targetId)}`);
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('API error, falling back to mock path', e);
      }
    }
    const found = MOCK_LEADS.find(l => 
      (l.sourceEntityId === sourceId && l.targetEntityId === targetId) ||
      (l.sourceEntityId === targetId && l.targetEntityId === sourceId)
    );
    return found || null;
  }

  async getLeads(): Promise<InvestigativeLead[]> {
    const live = await this.checkBackend();
    if (live) {
      try {
        const res = await fetch(`${API_BASE}/api/leads`);
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('API error, falling back to mock leads', e);
      }
    }
    return MOCK_LEADS;
  }

  async getLeadById(id: string): Promise<InvestigativeLead | null> {
    const live = await this.checkBackend();
    if (live) {
      try {
        const res = await fetch(`${API_BASE}/api/leads/${encodeURIComponent(id)}`);
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('API error, falling back to mock lead', e);
      }
    }
    return MOCK_LEADS.find(l => l.id === id) || null;
  }

  async getEvidenceById(id: string): Promise<EvidenceRecord | null> {
    const live = await this.checkBackend();
    if (live) {
      try {
        const res = await fetch(`${API_BASE}/api/evidence/${encodeURIComponent(id)}`);
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('API error, falling back to mock evidence', e);
      }
    }
    return MOCK_EVIDENCE_RECORDS[id] || null;
  }

  async getTimeline(): Promise<TimelineEvent[]> {
    const live = await this.checkBackend();
    if (live) {
      try {
        const res = await fetch(`${API_BASE}/api/timeline`);
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('API error, falling back to mock timeline', e);
      }
    }
    return MOCK_TIMELINE_EVENTS;
  }

  async analyzeFIR(narrative: string, caseId: string = ''): Promise<any> {
    const live = await this.checkBackend();
    if (live) {
      try {
        const res = await fetch(`${API_BASE}/api/fir/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ narrative, case_id: caseId })
        });
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('API error in analyzeFIR', e);
      }
    }
    return { extracted_entities: [], resolved_count: 0, candidate_edges: [] };
  }

  async ingestData(payload: { 
    files?: Array<{ name: string; type: string; recordsCount: number }>;
    fileName?: string; 
    fileType?: string; 
    recordsCount?: number;
    records?: Array<any>;
  }): Promise<{ success: boolean; stats: SystemStats; pipeline?: any; ingest_result?: any }> {
    const live = await this.checkBackend();
    if (live) {
      try {
        const res = await fetch(`${API_BASE}/api/ingest`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('API error, falling back to mock ingest', e);
      }
    }
    const addedRecords = payload.recordsCount || (payload.files ? payload.files.reduce((acc, f) => acc + f.recordsCount, 0) : 54);
    return {
      success: true,
      stats: {
        ...INITIAL_STATS,
        totalRecords: INITIAL_STATS.totalRecords + addedRecords,
        totalRelationships: INITIAL_STATS.totalRelationships + Math.round(addedRecords * 0.45),
        lastUpdated: 'Just now'
      }
    };
  }

  async findHiddenRelationships(entityId: string, maxHops: number = 5, limit: number = 5): Promise<any> {
    const live = await this.checkBackend();
    if (live) {
      try {
        const res = await fetch(`${API_BASE}/api/investigation/hidden-relationships`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entity_id: entityId, max_hops: maxHops, limit: limit })
        });
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('API error in findHiddenRelationships', e);
      }
    }
    return { source_entity: null, leads: [] };
  }

  async getGroundTruthEvaluation(): Promise<any> {
    const live = await this.checkBackend();
    if (live) {
      try {
        const res = await fetch(`${API_BASE}/api/evaluation/ground-truth`);
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('API error in getGroundTruthEvaluation', e);
      }
    }
    return null;
  }
}

export const apiService = new IntelApiService();
