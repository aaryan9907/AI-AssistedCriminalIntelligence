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

class IntelApiService {
  private useMockFallback = true;
  private backendChecked = false;

  private async checkBackend(): Promise<boolean> {
    if (this.backendChecked) return !this.useMockFallback;
    try {
      const res = await fetch('/api/stats', { signal: AbortSignal.timeout(1200) });
      if (res.ok) {
        this.useMockFallback = false;
        console.log('[IntelApiService] Connected to live FastAPI Backend at /api');
      } else {
        this.useMockFallback = true;
      }
    } catch {
      this.useMockFallback = true;
      console.log('[IntelApiService] Running in standalone mode with synthetic intelligence engine');
    }
    this.backendChecked = true;
    return !this.useMockFallback;
  }

  async getStats(): Promise<SystemStats> {
    const live = await this.checkBackend();
    if (live) {
      try {
        const res = await fetch('/api/stats');
        return await res.json();
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
        const res = await fetch('/api/entities');
        return await res.json();
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
        const res = await fetch(`/api/entities/${id}`);
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
        const res = await fetch('/api/graph');
        return await res.json();
      } catch (e) {
        console.warn('API error, falling back to mock graph', e);
      }
    }
    return {
      entities: MOCK_ENTITIES,
      relationships: MOCK_RELATIONSHIPS
    };
  }

  async getPath(sourceId: string, targetId: string): Promise<InvestigativeLead | null> {
    const live = await this.checkBackend();
    if (live) {
      try {
        const res = await fetch(`/api/graph/path?source=${encodeURIComponent(sourceId)}&target=${encodeURIComponent(targetId)}`);
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('API error, falling back to mock path', e);
      }
    }
    // Return matching lead or the primary 4-hop lead
    const found = MOCK_LEADS.find(l => 
      (l.sourceEntityId === sourceId && l.targetEntityId === targetId) ||
      (l.sourceEntityId === targetId && l.targetEntityId === sourceId)
    );
    return found || MOCK_LEADS[0];
  }

  async getLeads(): Promise<InvestigativeLead[]> {
    const live = await this.checkBackend();
    if (live) {
      try {
        const res = await fetch('/api/leads');
        return await res.json();
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
        const res = await fetch(`/api/leads/${id}`);
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
        const res = await fetch(`/api/evidence/${id}`);
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
        const res = await fetch('/api/timeline');
        return await res.json();
      } catch (e) {
        console.warn('API error, falling back to mock timeline', e);
      }
    }
    return MOCK_TIMELINE_EVENTS;
  }

  async ingestData(payload: { 
    files?: Array<{ name: string; type: string; recordsCount: number }>;
    fileName?: string; 
    fileType?: string; 
    recordsCount?: number;
  }): Promise<{ success: boolean; stats: SystemStats }> {
    const live = await this.checkBackend();
    if (live) {
      try {
        const res = await fetch('/api/ingest', {
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
}

export const apiService = new IntelApiService();
