import React, { createContext, useContext, useState, ReactNode } from 'react';
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
  datasetName: 'SYNTHETIC INTEL DB (OP AEGIS)',
  sourceFilesCount: 4,
  totalRecordsCount: 428,
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
    return findDeepPathsBetween(sourceId, targetId, dataset.nodes, dataset.edges, 4);
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
