import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  NexusNode, 
  NexusEdge, 
  NexusEvidence, 
  NexusSuggestion,
  NEXUS_NODES, 
  NEXUS_EDGES, 
  NEXUS_EVIDENCE, 
  NEXUS_SUGGESTIONS, 
  NEXUS_STATS, 
  NEXUS_HIDDEN_PATH,
  NETWORK_CENTRALITY_DATA,
  ENTITY_TYPE_DISTRIBUTION,
  TIMELINE_ACTIVITY_DATA
} from '../services/nexusData';
import { 
  AnalyzedDataset, 
  processUploadedInvestigationFiles, 
  PREBUILT_SAMPLE_FILES 
} from '../services/dataIngestionService';
import {
  DiscoveredHiddenRelationship,
  BASELINE_HIDDEN_RELATIONSHIPS,
  findDeepPathsBetween
} from '../services/deepAnalysisEngine';
import { apiService } from '../services/api';

interface IntelDataContextType {
  nodes: NexusNode[];
  edges: NexusEdge[];
  evidence: NexusEvidence[];
  suggestions: NexusSuggestion[];
  stats: any[];
  hiddenPath: string[];
  hiddenRelationships: DiscoveredHiddenRelationship[];
  activeHiddenRelationshipId: string | null;
  activeHiddenRelationship: DiscoveredHiddenRelationship | null;
  setActiveHiddenRelationshipId: (id: string | null) => void;
  findConnectionsBetween: (sourceId: string, targetId: string) => DiscoveredHiddenRelationship[];
  centralityData: any[];
  typeDistribution: any[];
  timelineData: any[];
  activeDatasetName: string;
  isCustomDataset: boolean;
  activeCaseId: string;
  extractedEntityList: any[];
  constructedLinkList: any[];
  applyAnalyzedDataset: (dataset: AnalyzedDataset) => void;
  resetToBaseline: () => void;
  loadPrebuiltSampleInvestigation: () => Promise<void>;
}

const BASELINE_DATASET: AnalyzedDataset = {
  datasetName: 'RELATIONAL PROVENANCE INTEL DB v3.0 (OP AEGIS)',
  sourceFilesCount: 18,
  totalRecordsCount: 661,
  nodes: NEXUS_NODES,
  edges: NEXUS_EDGES,
  evidence: NEXUS_EVIDENCE,
  suggestions: NEXUS_SUGGESTIONS,
  hiddenPath: NEXUS_HIDDEN_PATH,
  hiddenRelationships: BASELINE_HIDDEN_RELATIONSHIPS,
  stats: NEXUS_STATS,
  centralityData: NETWORK_CENTRALITY_DATA,
  typeDistribution: ENTITY_TYPE_DISTRIBUTION,
  timelineData: TIMELINE_ACTIVITY_DATA,
  extractedEntityList: NEXUS_NODES.map((n) => ({
    id: n.id,
    name: n.name,
    type: n.type,
    role: n.subtitle,
    linksCount: n.connections
  })),
  constructedLinkList: NEXUS_EDGES.map((e) => ({
    source: e.source,
    target: e.target,
    type: e.label,
    confidence: e.confidence,
    fileSource: e.sourceType
  }))
};

const STORAGE_KEY = 'sih_active_dataset_v2';

const IntelDataContext = createContext<IntelDataContextType | undefined>(undefined);

export const IntelDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dataset, setDataset] = useState<AnalyzedDataset>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.nodes) && parsed.nodes.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed reading dataset from sessionStorage', e);
    }
    return BASELINE_DATASET;
  });

  const [activeHiddenRelationshipId, setActiveHiddenRelationshipId] = useState<string | null>(null);

  const [isCustomDataset, setIsCustomDataset] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) !== null;
    } catch {
      return false;
    }
  });

  // Hydrate from live FastAPI Backend on initial mount
  useEffect(() => {
    let isMounted = true;
    async function hydrateFromBackend() {
      try {
        const [statsData, graphData, leadsData, timelineData] = await Promise.all([
          apiService.getStats(),
          apiService.getGraph(),
          apiService.getLeads(),
          apiService.getTimeline()
        ]);

        if (!isMounted) return;

        // If backend returned the full 171 entities graph
        if (graphData && graphData.entities && graphData.entities.length > 25) {
          console.log(`[IntelDataContext] Hydrated from live Backend: ${graphData.entities.length} entities, ${graphData.relationships.length} edges`);

          const nodes: NexusNode[] = graphData.entities.map((e: any, idx: number) => {
            const relCount = graphData.relationships.filter(
              (r: any) => r.source === e.id || r.target === e.id
            ).length;
            const subtitle = e.details?.city || e.details?.occupation || e.details?.bank || e.type;
            const angle = (idx / graphData.entities.length) * 2 * Math.PI;
            const radius = 250 + (idx % 3) * 120;
            return {
              id: e.id,
              name: e.name,
              type: e.type,
              subtitle: subtitle,
              x: Math.round(500 + radius * Math.cos(angle)),
              y: Math.round(400 + radius * Math.sin(angle)),
              connections: relCount,
              cases: Array.isArray(e.details?.cases) ? e.details.cases.length : 1,
              riskScore: e.riskScore || 65
            };
          });

          const getEdgeCategory = (tStr: string): 'COMMUNICATION' | 'VEHICLE' | 'LOCATION' | 'FINANCIAL' | 'CASE' | 'ORGANIZATION' => {
            const t = (tStr || '').toUpperCase();
            if (t.includes('COMM') || t.includes('CALL') || t.includes('PHONE')) return 'COMMUNICATION';
            if (t.includes('VEH') || t.includes('OPERAT') || t.includes('DRIVE')) return 'VEHICLE';
            if (t.includes('LOC') || t.includes('VISIT') || t.includes('SIGHT')) return 'LOCATION';
            if (t.includes('TRANS') || t.includes('WIRE') || t.includes('HOLD') || t.includes('FIN')) return 'FINANCIAL';
            if (t.includes('CASE') || t.includes('INVOLV') || t.includes('DOCKET')) return 'CASE';
            return 'ORGANIZATION';
          };

          const edges: NexusEdge[] = graphData.relationships.map((r: any, idx: number) => ({
            id: r.id || `EDGE-${idx + 1}`,
            source: r.source,
            target: r.target,
            label: r.type,
            confidence: r.confidence || 0.9,
            recordId: r.source_record_id || r.id || `REC-${idx + 1}`,
            category: getEdgeCategory(r.type),
            sourceType: r.source_table || 'operational_records',
            caseId: r.case_id || 'CR-2026-0142',
            date: r.timestamp || '2026-02-01'
          }));

          // Centrality calculation from degree
          const sortedByDegree = [...nodes].sort((a, b) => b.connections - a.connections);
          const centralityData = sortedByDegree.slice(0, 10).map((n) => ({
            id: n.id,
            name: n.name,
            type: n.type,
            degree: n.connections,
            risk: n.riskScore || 65
          }));

          // Type distribution
          const countsByType: Record<string, number> = {};
          nodes.forEach((n) => {
            countsByType[n.type] = (countsByType[n.type] || 0) + 1;
          });
          const typeColors: Record<string, string> = {
            'PERSON': '#00f0ff',
            'PHONE': '#3b82f6',
            'VEHICLE': '#f59e0b',
            'LOCATION': '#10b981',
            'ORGANIZATION': '#8b5cf6',
            'CASE': '#ef4444',
            'BANK ACCOUNT': '#06b6d4'
          };
          const typeDistribution = Object.entries(countsByType).map(([type, count]) => ({
            type,
            count,
            percent: Math.round((count / nodes.length) * 100),
            color: typeColors[type] || '#94a3b8'
          }));

          // Timeline mapping
          const mappedTimeline = (timelineData || []).map((t: any, idx: number) => ({
            date: (t.date || t.timestamp || '').split('T')[0] || `2026-0${(idx % 3) + 1}-0${(idx % 9) + 1}`,
            count: 1,
            type: t.category || t.type || 'EVENT',
            label: t.title || t.description || 'Intelligence Event'
          }));

          // Leads / Suggestions mapping
          const mappedSuggestions: NexusSuggestion[] = (leadsData || []).map((lead: any, idx: number) => ({
            id: lead.id || `SUG-${idx + 1}`,
            title: lead.title || `${lead.sourceEntityName || lead.sourceEntityId} ↔ ${lead.targetEntityName || lead.targetEntityId}`,
            category: 'LEAD',
            confidence: lead.confidence || 0.88,
            description: lead.description || lead.reasons?.[0] || 'Evidence-backed multi-hop connection',
            actionLabel: 'INSPECT LEAD',
            targetNodeId: lead.targetEntityId,
            stepAnimation: true
          }));

          // Evidence records mapped from leads and operational records
          const evidenceList: NexusEvidence[] = (leadsData || []).flatMap((lead: any) => 
            (lead.supporting_record_ids || []).map((recId: string) => ({
              id: recId,
              type: lead.category || 'COMMUNICATION',
              title: `Record ${recId}`,
              description: `Supporting record for discovered lead between ${lead.sourceEntityName || lead.sourceEntityId} and ${lead.targetEntityName || lead.targetEntityId}`,
              caseId: lead.supportingCases?.[0] || 'CASE01',
              source: lead.evidenceTypes?.[0] || 'Operational Records',
              date: '2026-02-15',
              time: '14:30',
              confidence: lead.confidence || 0.92
            }))
          );

          const liveDataset: AnalyzedDataset = {
            datasetName: statsData.datasetName || 'RELATIONAL PROVENANCE INTEL DB v3.0 (OP AEGIS)',
            sourceFilesCount: 18,
            totalRecordsCount: statsData.totalRecords || 661,
            nodes,
            edges,
            evidence: evidenceList.length > 0 ? evidenceList : NEXUS_EVIDENCE,
            suggestions: mappedSuggestions.length > 0 ? mappedSuggestions : NEXUS_SUGGESTIONS,
            hiddenPath: Array.isArray(leadsData?.[0]?.path)
              ? leadsData[0].path.map((p: any) => (typeof p === 'string' ? p : p.entityId || String(p)))
              : ['P003', 'PH003', 'PH010', 'P011', 'VH05', 'P020'],
            stats: [
              { label: 'Total Ingested Records', value: String(statsData.totalRecords || 661), hint: 'Across 18 operational tables', tone: 'signal' },
              { label: 'Resolved Entities', value: String(nodes.length), hint: 'People, phones, vehicles, cases', tone: 'azure' },
              { label: 'Verified Relationships', value: String(edges.length), hint: 'Documented multi-domain edges', tone: 'safe' },
              { label: 'Potential Leads', value: String(statsData.potentialLeads || mappedSuggestions.length), hint: 'AI-surfaced 2-5 hop paths', tone: 'warn' }
            ],
            centralityData,
            typeDistribution,
            timelineData: mappedTimeline.length > 0 ? mappedTimeline : TIMELINE_ACTIVITY_DATA,
            extractedEntityList: nodes.map((n) => ({
              id: n.id,
              name: n.name,
              type: n.type,
              role: n.subtitle,
              linksCount: n.connections
            })),
            constructedLinkList: edges.map((e) => ({
              source: e.source,
              target: e.target,
              type: e.label,
              confidence: e.confidence,
              fileSource: e.sourceType
            }))
          };

          setDataset(liveDataset);
        }
      } catch (err) {
        console.warn('[IntelDataContext] Live backend hydration deferred:', err);
      }
    }

    hydrateFromBackend();
    return () => { isMounted = false; };
  }, []);

  const applyAnalyzedDataset = (newDataset: AnalyzedDataset) => {
    setDataset(newDataset);
    setIsCustomDataset(true);
    setActiveHiddenRelationshipId(null);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newDataset));
    } catch (e) {
      console.warn('Failed saving dataset to sessionStorage', e);
    }
  };

  const resetToBaseline = () => {
    setDataset(BASELINE_DATASET);
    setIsCustomDataset(false);
    setActiveHiddenRelationshipId(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Failed removing dataset from sessionStorage', e);
    }
  };

  const loadPrebuiltSampleInvestigation = async () => {
    const analyzed = await processUploadedInvestigationFiles(PREBUILT_SAMPLE_FILES);
    analyzed.datasetName = 'OP AEGIS · 3 MULTI-SOURCE FILES';
    applyAnalyzedDataset(analyzed);
  };

  const hiddenRelationships: DiscoveredHiddenRelationship[] = dataset.hiddenRelationships || BASELINE_HIDDEN_RELATIONSHIPS;
  const activeHiddenRelationship = hiddenRelationships.find((r) => r.id === activeHiddenRelationshipId) || null;

  const findConnectionsBetween = (sourceId: string, targetId: string) => {
    return findDeepPathsBetween(sourceId, targetId, dataset.nodes, dataset.edges, 5);
  };

  const activeCaseId = dataset.edges[0]?.caseId || 'CR-2026-0142';

  return (
    <IntelDataContext.Provider
      value={{
        nodes: dataset.nodes,
        edges: dataset.edges,
        evidence: dataset.evidence,
        suggestions: dataset.suggestions,
        stats: dataset.stats,
        hiddenPath: dataset.hiddenPath,
        hiddenRelationships,
        activeHiddenRelationshipId,
        activeHiddenRelationship,
        setActiveHiddenRelationshipId,
        findConnectionsBetween,
        centralityData: dataset.centralityData,
        typeDistribution: dataset.typeDistribution,
        timelineData: dataset.timelineData,
        activeDatasetName: dataset.datasetName,
        isCustomDataset,
        activeCaseId,
        extractedEntityList: dataset.extractedEntityList,
        constructedLinkList: dataset.constructedLinkList,
        applyAnalyzedDataset,
        resetToBaseline,
        loadPrebuiltSampleInvestigation
      }}
    >
      {children}
    </IntelDataContext.Provider>
  );
};

export function useIntelData(): IntelDataContextType {
  const context = useContext(IntelDataContext);
  if (!context) {
    throw new Error('useIntelData must be used within an IntelDataProvider');
  }
  return context;
}
