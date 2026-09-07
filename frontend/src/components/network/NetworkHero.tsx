import React, { useState, useMemo, useEffect } from 'react';
import { 
  Network, 
  Orbit, 
  BarChart3, 
  Sparkles, 
  Filter, 
  ChevronDown, 
  Check, 
  SlidersHorizontal, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Search, 
  ArrowRight, 
  X, 
  Command, 
  ShieldAlert,
  Sliders,
  Layers,
  ChevronLeft,
  ExternalLink,
  CheckCircle2,
  GitFork,
  Loader2,
  Clock,
  FileText,
  AlertTriangle,
  Fingerprint,
  ShieldCheck
} from 'lucide-react';
import { apiService } from '../../services/api';
import { 
  NEXUS_STATS, 
  NEXUS_NODES, 
  NEXUS_EDGES, 
  NEXUS_EVIDENCE, 
  NEXUS_HIDDEN_PATH, 
  NEXUS_ENTITY_ICONS, 
  NEXUS_ENTITY_TONES,
  NEXUS_SUGGESTIONS,
  NexusNode,
  NexusSuggestion
} from '../../services/nexusData';
import { useIntelData } from '../../context/IntelDataContext';
import { formatNodeName, formatNodeSubLabel } from '../command-center/CommandCenter';
import { getCanonicalEntity, getEntityDisplayName } from '../../services/canonicalEntities';
import { NavSection } from '../layout/SidebarNav';
import { EvidenceModal } from '../evidence/EvidenceModal';
import { NetworkAnalyticsPanel } from './NetworkAnalyticsPanel';
import { EgoCentricRadialGraph } from './EgoCentricRadialGraph';
import { InvestigativeSuggestions } from './InvestigativeSuggestions';
import { EntityDetailCard } from './EntityDetailCard';
import { HiddenRelationshipsDrawer } from './HiddenRelationshipsDrawer';
import { DiscoveredHiddenRelationship } from '../../services/deepAnalysisEngine';

interface NetworkHeroProps {
  entities?: any[];
  relationships?: any[];
  leads?: any[];
  evidenceRecords?: any;
  onOpenEvidenceModal?: (evidenceId: string) => void;
  onToggleLeadVerification?: (leadId: string) => void;
  initialLead?: any;
  initialSelectedEntityId?: string | null;
  onNavigate?: (section: NavSection) => void;
}

type GraphViewTab = 'CANVAS' | 'RADIAL' | 'ANALYTICS';

const ALL_RELATION_CATEGORIES = [
  'COMMUNICATION',
  'VEHICLE',
  'LOCATION',
  'FINANCIAL',
  'CASE',
  'ORGANIZATION',
] as const;

export const NetworkHero: React.FC<NetworkHeroProps> = ({
  initialSelectedEntityId,
  onNavigate,
  onOpenEvidenceModal,
}) => {
  const {
    nodes,
    edges,
    evidence,
    suggestions,
    hiddenPath,
    hiddenRelationships,
    activeHiddenRelationshipId,
    activeHiddenRelationship,
    setActiveHiddenRelationshipId,
    trackEntityHiddenRelationship,
    activeDatasetName,
    isCustomDataset,
  } = useIntelData();

  const allNodes = nodes.length > 0 ? nodes : NEXUS_NODES;
  const allEdges = edges.length > 0 ? edges : NEXUS_EDGES;
  const allEvidence = evidence.length > 0 ? evidence : NEXUS_EVIDENCE;
  const allSuggestions = suggestions.length > 0 ? suggestions : NEXUS_SUGGESTIONS;
  const allHiddenPath = hiddenPath.length > 0 ? hiddenPath : NEXUS_HIDDEN_PATH;

  // Drawer open state
  const [isHiddenDrawerOpen, setIsHiddenDrawerOpen] = useState<boolean>(false);

  // Deep Hidden Relationship Discovery & Path Reveal State
  const [isFindingHidden, setIsFindingHidden] = useState<boolean>(false);
  const [discoveredLeads, setDiscoveredLeads] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [isRevealingPath, setIsRevealingPath] = useState<boolean>(false);
  const [revealStep, setRevealStep] = useState<number>(0);

  // Selected Node State
  const [selectedNodeId, setSelectedNodeId] = useState<string>(initialSelectedEntityId || allNodes[0]?.id || 'P003');

  // Dynamic active hidden path (prioritizes active selected lead, then relationship matching selected node, then active traced relationship)
  const effectiveHiddenPath = useMemo(() => {
    if (selectedLead && selectedLead.path && selectedLead.path.length > 0) {
      return selectedLead.path.map((p: any) => (typeof p === 'string' ? p : p.entityId || String(p)));
    }
    // If activeHiddenRelationship contains selectedNodeId, use it directly
    if (activeHiddenRelationship && activeHiddenRelationship.pathNodeIds.length > 0) {
      if (
        !selectedNodeId ||
        activeHiddenRelationship.sourceNodeId === selectedNodeId ||
        activeHiddenRelationship.targetNodeId === selectedNodeId ||
        activeHiddenRelationship.sourceId === selectedNodeId ||
        activeHiddenRelationship.targetId === selectedNodeId ||
        activeHiddenRelationship.pathNodeIds.includes(selectedNodeId)
      ) {
        return activeHiddenRelationship.pathNodeIds;
      }
    }
    // Check if any hiddenRelationship contains selectedNodeId
    if (selectedNodeId) {
      const match = hiddenRelationships.find(
        (r) =>
          r.sourceNodeId === selectedNodeId ||
          r.targetNodeId === selectedNodeId ||
          r.sourceId === selectedNodeId ||
          r.targetId === selectedNodeId ||
          (r.pathNodeIds && r.pathNodeIds.includes(selectedNodeId))
      );
      if (match && match.pathNodeIds.length > 0) {
        return match.pathNodeIds;
      }
    }
    if (activeHiddenRelationship && activeHiddenRelationship.pathNodeIds.length > 0) {
      return activeHiddenRelationship.pathNodeIds;
    }
    if (hiddenRelationships.length > 0 && hiddenRelationships[0].pathNodeIds.length > 0) {
      return hiddenRelationships[0].pathNodeIds;
    }
    return allHiddenPath;
  }, [selectedLead, activeHiddenRelationship, selectedNodeId, hiddenRelationships, allHiddenPath]);

  // Dynamic investigation query suggestions derived from active dataset
  const dataDrivenSuggestions = useMemo(() => {
    if (suggestions && suggestions.length > 0) {
      return suggestions.slice(0, 4);
    }
    const list: NexusSuggestion[] = [];

    // 1. POI multi-hop bridge
    const p3 = allNodes.find((n) => n.id === 'P003' || n.name.toLowerCase().includes('garima'));
    const p20 = allNodes.find((n) => n.id === 'P020' || n.name.toLowerCase().includes('shailesh'));
    if (p3) {
      list.push({
        id: 'sug-garima-shailesh',
        title: p20 ? `Trace ${p3.name.split(' ')[0]} ↔ ${p20.name.split(' ')[0]}` : `Trace ${p3.name}`,
        category: 'LEAD',
        description: `Discovered 5-hop indirect connection connecting ${p3.name} (${p3.id}) with ${p20 ? p20.name : 'syndicate'}.`,
        confidence: 0.94,
        actionLabel: p20 ? `Trace ${p3.name.split(' ')[0]} ↔ ${p20.name.split(' ')[0]}` : `Trace ${p3.name}`,
        targetNodeId: p3.id,
        activeCategories: ['COMMUNICATION', 'VEHICLE'],
        stepAnimation: true,
      });
    }

    // 2. Vehicle nexus to Case
    const vh = allNodes.find((n) => n.id === 'VH02' || n.name.includes('UP16') || n.type === 'VEHICLE');
    if (vh) {
      list.push({
        id: 'sug-vehicle-nexus',
        title: `Isolate ${vh.name.split(' ')[0]} Nexus`,
        category: 'ANOMALY',
        description: `Vehicle ${vh.name} (${vh.id}) bridges multi-subject movements across Case records.`,
        confidence: 0.89,
        actionLabel: `Focus Vehicle ${vh.name.split(' ')[0]}`,
        targetNodeId: vh.id,
        activeCategories: ['VEHICLE', 'CASE'],
        searchFilter: vh.name.split(' ')[0],
      });
    }

    // 3. Banking wire bridge
    const acc = allNodes.find((n) => n.id === 'ACC05' || n.type === 'BANK ACCOUNT');
    if (acc) {
      list.push({
        id: 'sug-wire-transfer',
        title: `Wire Flow: ${acc.name.split('(')[0].trim()}`,
        category: 'LEAD',
        description: `Financial transfers via account ${acc.name} (${acc.id}).`,
        confidence: 0.88,
        actionLabel: 'Filter Fund Flows',
        targetNodeId: acc.id,
        activeCategories: ['FINANCIAL'],
        searchFilter: acc.id,
      });
    }

    // 4. Location rendezvous
    const loc = allNodes.find((n) => n.id === 'LOC09' || n.type === 'LOCATION');
    if (loc) {
      list.push({
        id: 'sug-location-rendezvous',
        title: `Rendezvous at ${loc.name.length > 18 ? loc.name.slice(0, 16) + '…' : loc.name}`,
        category: 'VERIFY',
        description: `Physical rendezvous logs at ${loc.name} (${loc.id}).`,
        confidence: 0.91,
        actionLabel: 'Filter Location',
        targetNodeId: loc.id,
        activeCategories: ['LOCATION'],
        searchFilter: loc.name.split(' ')[0],
      });
    }

    if (list.length === 0) {
      return allSuggestions.slice(0, 4);
    }
    return list;
  }, [allNodes, suggestions, allSuggestions]);

  // Navigation & Sub-view State
  const [activeTab, setActiveTab] = useState<GraphViewTab>('CANVAS');
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Mouse Wheel Zoom Handler (0.4x to 3.0x)
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 0.88;
    setZoom((z) => Math.min(3.0, Math.max(0.4, Math.round(z * factor * 100) / 100)));
  };

  // Mouse Drag Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement | SVGElement;
    if (target.closest('.graph-node') || target.closest('button')) return;
    setIsPanning(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsPanning(false);

  // Zoom Button Handlers
  const handleZoomIn = () => setZoom((z) => Math.min(3.0, Math.round((z + 0.15) * 100) / 100));
  const handleZoomOut = () => setZoom((z) => Math.max(0.4, Math.round((z - 0.15) * 100) / 100));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const [showPath, setShowPath] = useState<boolean>(true);
  const [activeEvidenceId, setActiveEvidenceId] = useState<string | null>(null);
  const [inspectingEntityId, setInspectingEntityId] = useState<string | null>(null);

  // When an active hidden relationship is set, reveal the full path and ensure focus
  useEffect(() => {
    if (activeHiddenRelationship) {
      setShowPath(true);
      setPathProgress(activeHiddenRelationship.pathNodeIds.length);
      if (!selectedNodeId || !activeHiddenRelationship.pathNodeIds.includes(selectedNodeId)) {
        setSelectedNodeId(activeHiddenRelationship.sourceNodeId);
        setInspectingEntityId(activeHiddenRelationship.sourceNodeId);
      }
      setActiveTab('CANVAS');
    }
  }, [activeHiddenRelationship]);

  const [radialNodesCount, setRadialNodesCount] = useState<number>(15);

  // Ensure effective selected node
  const effectiveSelectedNodeId = useMemo(() => {
    if (selectedNodeId && allNodes.some((n) => n.id === selectedNodeId)) return selectedNodeId;
    return allNodes[0]?.id || 'P003';
  }, [allNodes, selectedNodeId]);

  // Main Lead root entity for radial orbit anchoring
  const mainLeadEntityId = useMemo(() => {
    if (activeHiddenRelationship) {
      return (
        activeHiddenRelationship.sourceNodeId ||
        activeHiddenRelationship.sourceId ||
        activeHiddenRelationship.pathNodeIds?.[0] ||
        effectiveSelectedNodeId
      );
    }
    if (selectedLead) {
      return (
        selectedLead.sourceEntityId ||
        selectedLead.sourceId ||
        selectedLead.path?.[0]?.entityId ||
        effectiveSelectedNodeId
      );
    }
    if (effectiveHiddenPath && effectiveHiddenPath.length > 0) {
      return effectiveHiddenPath[0];
    }
    return effectiveSelectedNodeId;
  }, [activeHiddenRelationship, selectedLead, effectiveHiddenPath, effectiveSelectedNodeId]);

  const selectedNode = useMemo(() => {
    return allNodes.find((n) => n.id === effectiveSelectedNodeId) || allNodes[0];
  }, [allNodes, effectiveSelectedNodeId]);

  const handleEntitySelect = async (nodeId: string) => {
    setSelectedNodeId(nodeId);
    setInspectingEntityId(nodeId);

    // 1. Dynamic correlation via trackEntityHiddenRelationship
    if (trackEntityHiddenRelationship) {
      try {
        const activeRel = await trackEntityHiddenRelationship(nodeId);
        if (activeRel) {
          setSelectedLead(null);
          setShowPath(true);
          setPathProgress(activeRel.pathNodeIds.length);
          setAnalysisStep(activeRel.pathNodeIds.length);
          return;
        }
      } catch (err) {
        console.warn('Error tracking entity hidden relationship in NetworkHero:', err);
      }
    }

    // 2. Correlate with known hidden relationships (source, target, or path intermediary)
    const matchingRel = hiddenRelationships.find((r) =>
      r.sourceNodeId === nodeId ||
      r.targetNodeId === nodeId ||
      r.sourceId === nodeId ||
      r.targetId === nodeId ||
      (r.pathNodeIds && r.pathNodeIds.includes(nodeId))
    );

    if (matchingRel) {
      setActiveHiddenRelationshipId(matchingRel.id);
      setSelectedLead(null);
      setShowPath(true);
      setPathProgress(matchingRel.pathNodeIds.length);
      setAnalysisStep(matchingRel.pathNodeIds.length);
    } else {
      // 3. Check discovered leads
      const matchingLead = discoveredLeads.find((l) =>
        l.sourceEntityId === nodeId ||
        l.targetEntityId === nodeId ||
        (Array.isArray(l.path) && l.path.some((p: any) => (typeof p === 'string' ? p : p.entityId) === nodeId))
      );
      if (matchingLead) {
        handleSelectLead(matchingLead);
      } else {
        setActiveHiddenRelationshipId(null);
        setSelectedLead(null);
      }
    }
  };

  const handleSelectLead = (lead: any) => {
    setSelectedLead(lead);
    setIsRevealingPath(true);
    setRevealStep(1);
    setShowPath(true);
    setPathProgress(1);
    setActiveTab('CANVAS');

    const pathNodes = lead.path.map((p: any) => p.entityId);
    pathNodes.forEach((_: any, idx: number) => {
      window.setTimeout(() => {
        setRevealStep(idx + 1);
        setPathProgress(idx + 1);
        if (idx === pathNodes.length - 1) {
          setIsRevealingPath(false);
        }
      }, 650 * (idx + 1));
    });
  };

  const handleFindHiddenRelationships = async () => {
    const focusId = selectedNode?.id || effectiveSelectedNodeId;
    setIsFindingHidden(true);
    try {
      const res = await apiService.findHiddenRelationships(focusId, maxDepth, 5);
      if (res && res.leads && res.leads.length > 0) {
        setDiscoveredLeads(res.leads);
        handleSelectLead(res.leads[0]);
      } else {
        const matches = hiddenRelationships.filter(
          (r) => r.sourceNodeId === focusId || r.targetNodeId === focusId
        );
        const candidates = matches.length > 0 ? matches : hiddenRelationships.slice(0, 4);
        if (candidates.length > 0) {
          const formatted = candidates.slice(0, 5).map((r) => ({
            target_entity: {
              id: r.targetNodeId,
              name: r.targetNodeName,
              type: 'PERSON',
            },
            path: r.pathNodeIds.map((nid) => ({
              entityId: nid,
              entityName: allNodes.find((n) => n.id === nid)?.name || nid,
              entityType: allNodes.find((n) => n.id === nid)?.type || 'UNKNOWN',
            })),
            path_length: r.hops,
            path_score: 13.4,
            confidence: r.confidence,
            supporting_records: r.evidenceRecordIds || [],
            supporting_cases: ['CASE-0142'],
            evidence_types: [r.category],
            why_flagged: [
              r.discoverySummary || r.title,
              `Corroborated by ${(r.evidenceRecordIds || []).length} independent operational records across multiple tables.`,
            ],
            human_verification_required: true,
          }));
          setDiscoveredLeads(formatted);
          handleSelectLead(formatted[0]);
        }
      }
    } catch (err) {
      console.error('Error finding hidden relationships:', err);
    } finally {
      setIsFindingHidden(false);
    }
  };

  // Dynamic Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeRelationCategories, setActiveRelationCategories] = useState<string[]>([
    'COMMUNICATION', 'VEHICLE', 'LOCATION', 'FINANCIAL', 'CASE', 'ORGANIZATION'
  ]);
  const [selectedCase, setSelectedCase] = useState<string>('ALL');
  const [selectedSource, setSelectedSource] = useState<string>('ALL');
  const [minConfidence, setMinConfidence] = useState<number>(0.5);
  const [maxDepth, setMaxDepth] = useState<number>(5);

  // Entity Display Limit: only show top important entities on canvas (default 15)
  const [entityLimit, setEntityLimit] = useState<number | 'ALL'>(15);

  // Dropdown open states
  const [openDropdown, setOpenDropdown] = useState<'CASE' | 'SOURCE' | 'DEPTH' | 'LIMIT' | null>(null);

  // Path analysis step animation
  const [analysisStep, setAnalysisStep] = useState<number>(0);
  const [pathProgress, setPathProgress] = useState<number>(effectiveHiddenPath.length || 5);
  const [activeSuggestionId, setActiveSuggestionId] = useState<string | null>(null);
  const [commandInput, setCommandInput] = useState<string>('');

  // Hidden path nodes
  const pathSet = useMemo(() => {
    return new Set(showPath ? effectiveHiddenPath.slice(0, pathProgress) : []);
  }, [showPath, effectiveHiddenPath, pathProgress]);

  // Filtered Edges based on active controls
  const visibleEdges = useMemo(() => {
    return allEdges.filter((edge) => {
      // Category filter
      if (!activeRelationCategories.includes(edge.category)) return false;

      // Case filter
      if (selectedCase !== 'ALL' && edge.caseId !== selectedCase) return false;

      // Source filter
      if (selectedSource !== 'ALL' && edge.sourceType !== selectedSource) return false;

      // Confidence threshold
      if (edge.confidence < minConfidence) return false;

      return true;
    });
  }, [allEdges, activeRelationCategories, selectedCase, selectedSource, minConfidence]);

  // Nodes currently connected by visible edges or query
  const visibleNodeIds = useMemo(() => {
    const ids = new Set<string>();
    visibleEdges.forEach((e) => {
      ids.add(e.source);
      ids.add(e.target);
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      allNodes.forEach((n) => {
        if (
          n.name.toLowerCase().includes(q) ||
          n.id.toLowerCase().includes(q) ||
          n.type.toLowerCase().includes(q)
        ) {
          ids.add(n.id);
        }
      });
    }

    return ids;
  }, [allNodes, visibleEdges, searchQuery]);

  // 1-Hop direct neighbors of selected entity
  const selectedNeighborIds = useMemo(() => {
    const focusId = selectedNodeId || effectiveSelectedNodeId;
    const neighbors = new Set<string>();
    allEdges.forEach((e) => {
      if (e.source === focusId) neighbors.add(e.target);
      if (e.target === focusId) neighbors.add(e.source);
    });
    return neighbors;
  }, [allEdges, selectedNodeId, effectiveSelectedNodeId]);

  // Rank nodes by importance: Selected > In Active Hidden Path > 1-Hop Neighbors > Search Match > Connections > Risk
  const rankedNodes = useMemo(() => {
    const focusId = selectedNodeId || effectiveSelectedNodeId;
    const q = searchQuery.trim().toLowerCase();

    return [...allNodes].sort((a, b) => {
      // 1. Primary: Selected node always #1
      const aFocus = (a.id === focusId) ? 1 : 0;
      const bFocus = (b.id === focusId) ? 1 : 0;
      if (aFocus !== bFocus) return bFocus - aFocus;

      // 2. Secondary: In active hidden path / lead (CRUCIAL: ensures all entities in the tracked hidden link are prioritized!)
      const aPath = pathSet.has(a.id) ? 1 : 0;
      const bPath = pathSet.has(b.id) ? 1 : 0;
      if (aPath !== bPath) return bPath - aPath;

      // 3. Tertiary: 1-hop neighbor of focused node
      const aNbr = selectedNeighborIds.has(a.id) ? 1 : 0;
      const bNbr = selectedNeighborIds.has(b.id) ? 1 : 0;
      if (aNbr !== bNbr) return bNbr - aNbr;

      // 4. Quaternary: Search query match
      if (q) {
        const aMatch = (a.name.toLowerCase().includes(q) || a.id.toLowerCase().includes(q) || a.type.toLowerCase().includes(q)) ? 1 : 0;
        const bMatch = (b.name.toLowerCase().includes(q) || b.id.toLowerCase().includes(q) || b.type.toLowerCase().includes(q)) ? 1 : 0;
        if (aMatch !== bMatch) return bMatch - aMatch;
      }

      // 5. Quinary: Connection count / Degree centrality
      const connDiff = (b.connections || 0) - (a.connections || 0);
      if (connDiff !== 0) return connDiff;

      // 6. Senary: Risk score
      return (b.riskScore || 50) - (a.riskScore || 50);
    });
  }, [allNodes, selectedNodeId, effectiveSelectedNodeId, selectedNeighborIds, searchQuery, pathSet]);

  // Slice to active entity limit (default 15), but ALWAYS guarantee that all active path nodes are displayed
  const displayedNodes = useMemo(() => {
    const base = entityLimit === 'ALL' ? [...rankedNodes] : rankedNodes.slice(0, entityLimit);
    const existingIds = new Set(base.map((n) => n.id));

    // Ensure all nodes in effectiveHiddenPath are displayed
    effectiveHiddenPath.forEach((id: string) => {
      if (!existingIds.has(id)) {
        const found = allNodes.find((n) => n.id === id);
        if (found) {
          base.push(found);
          existingIds.add(id);
        } else if (selectedLead) {
          const step = selectedLead.path?.find((p: any) => p.entityId === id);
          if (step) {
            base.push({
              id: step.entityId,
              name: step.entityName,
              type: step.entityType,
              riskScore: 70,
              subtitle: step.entityType,
              x: 50,
              y: 50
            } as any);
            existingIds.add(id);
          }
        }
      }
    });
    return base;
  }, [rankedNodes, entityLimit, effectiveHiddenPath, allNodes, selectedLead]);

  const displayedNodeIds = useMemo(() => {
    return new Set(displayedNodes.map((n) => n.id));
  }, [displayedNodes]);

  // Canvas Edges: Interconnect nodes that are both currently displayed, including all path edges of the active hidden relationship
  const canvasEdges = useMemo(() => {
    const existingPairs = new Set<string>();
    const edges = visibleEdges.filter((edge) => {
      existingPairs.add(`${edge.source}__${edge.target}`);
      existingPairs.add(`${edge.target}__${edge.source}`);
      return displayedNodeIds.has(edge.source) && displayedNodeIds.has(edge.target);
    });

    // Ensure all consecutive hops along the tracked hidden path are explicitly present in canvasEdges
    const activePath = effectiveHiddenPath || [];
    for (let i = 0; i < activePath.length - 1; i++) {
      const u = activePath[i];
      const v = activePath[i + 1];
      const pair = `${u}__${v}`;
      if (!existingPairs.has(pair)) {
        existingPairs.add(pair);
        existingPairs.add(`${v}__${u}`);
        const realEdge = allEdges.find(
          (e) => (e.source === u && e.target === v) || (e.source === v && e.target === u)
        );
        if (realEdge) {
          edges.push({
            ...realEdge,
            active: true
          });
        } else {
          edges.push({
            id: `edge-path-${u}-${v}`,
            source: u,
            target: v,
            category: 'COMMUNICATION',
            label: 'TRACKED_PATH_LINK',
            confidence: 0.95,
            recordId: `REC-${u}-${v}`,
            caseId: activeHiddenRelationship?.caseDocket || 'CASE01',
            sourceType: 'intelligence_provenance',
            date: '2026-02-15',
            active: true
          } as any);
        }
      }
    }

    return edges;
  }, [visibleEdges, displayedNodeIds, effectiveHiddenPath, allEdges, activeHiddenRelationship]);

  // Set of consecutive path edge pairs for strict single-threaded progression
  const consecutivePathEdges = useMemo(() => {
    const set = new Set<string>();
    const activePath = showPath ? effectiveHiddenPath.slice(0, pathProgress) : [];
    for (let i = 0; i < activePath.length - 1; i++) {
      set.add(`${activePath[i]}__${activePath[i + 1]}`);
      set.add(`${activePath[i + 1]}__${activePath[i]}`);
    }
    return set;
  }, [showPath, effectiveHiddenPath, pathProgress]);

  // Dynamic density scale for node radius, label font-size, and stroke widths in NetworkHero
  const densityScale = useMemo(() => {
    const count = displayedNodes.length;
    if (count > 50) {
      return { nodeR: 2.2, activeR: 3.2, fontSize: 2.2, strokeW: 0.35, labelY: 3.8, maxChars: 7 };
    }
    if (count > 25) {
      return { nodeR: 2.8, activeR: 3.8, fontSize: 2.7, strokeW: 0.5, labelY: 4.6, maxChars: 9 };
    }
    if (count > 12) {
      return { nodeR: 3.4, activeR: 4.6, fontSize: 3.2, strokeW: 0.65, labelY: 5.5, maxChars: 11 };
    }
    return { nodeR: 4.2, activeR: 5.8, fontSize: 3.8, strokeW: 0.85, labelY: 6.8, maxChars: 14 };
  }, [displayedNodes.length]);

  // Clean, non-overlapping concentric layout for displayed nodes with dynamic coordinate space
  const { nodeLayout, canvasDimension } = useMemo(() => {
    const count = displayedNodes.length;
    let dim = 100;
    if (count > 50) dim = 300;
    else if (count > 25) dim = 220;
    else if (count > 12) dim = 160;

    const coords = new Map<string, { x: number; y: number }>();
    if (count === 0) return { nodeLayout: coords, canvasDimension: dim };

    const cx = dim / 2;
    const cy = dim * 0.48;

    // Central focus node: effectiveSelectedNodeId if present, else #1
    const center = displayedNodes.find((n) => n.id === effectiveSelectedNodeId) || displayedNodes[0];
    coords.set(center.id, { x: cx, y: cy });

    const others = displayedNodes.filter((n) => n.id !== center.id);

    // Separate into path nodes and non-path nodes so path nodes form an organized arc
    // CRUCIAL: Sort path nodes in others strictly by their index in effectiveHiddenPath!
    const pathNodesInOthers = others
      .filter((n) => pathSet.has(n.id))
      .sort((a, b) => effectiveHiddenPath.indexOf(a.id) - effectiveHiddenPath.indexOf(b.id));

    const nonPathNodes = others.filter((n) => !pathSet.has(n.id));

    // Place path nodes in sequence along the upper arc so the hidden connection is immediately clear
    if (pathNodesInOthers.length > 0) {
      const pathRadius = dim * 0.32;
      const arcStart = -Math.PI * 0.85;
      const arcEnd = -Math.PI * 0.15;
      pathNodesInOthers.forEach((n, idx) => {
        const t = pathNodesInOthers.length === 1 ? 0.5 : idx / (pathNodesInOthers.length - 1);
        const angle = arcStart + t * (arcEnd - arcStart);
        coords.set(n.id, {
          x: Math.round((cx + pathRadius * Math.cos(angle)) * 10) / 10,
          y: Math.round((cy + pathRadius * Math.sin(angle)) * 10) / 10,
        });
      });
    }

    // Distribute remaining non-path neighbors across lower and outer rings
    const remCount = nonPathNodes.length;
    if (remCount > 0) {
      const hasPathArc = pathNodesInOthers.length > 0;
      const rings = remCount > 30 ? 3 : remCount > 12 ? 2 : 1;
      const ringRadii = rings === 1
        ? [dim * 0.38]
        : rings === 2
        ? [dim * 0.30, dim * 0.44]
        : [dim * 0.24, dim * 0.35, dim * 0.46];

      const ringCapacities = rings === 1
        ? [remCount]
        : rings === 2
        ? [Math.min(8, Math.ceil(remCount * 0.4)), remCount]
        : [6, 12, remCount];

      let allocated = 0;
      for (let r = 0; r < rings; r++) {
        const radius = ringRadii[r];
        const maxInRing = ringCapacities[r];
        const currentRingNodes = nonPathNodes.slice(allocated, allocated + maxInRing);
        allocated += currentRingNodes.length;
        const ringLen = currentRingNodes.length;

        // If path nodes exist on upper arc, place non-path nodes along lower & lateral arc (0.05*PI to 0.95*PI)
        const lowerStart = 0.05 * Math.PI;
        const lowerEnd = 0.95 * Math.PI;

        currentRingNodes.forEach((n, i) => {
          let angle: number;
          if (hasPathArc) {
            const t = ringLen === 1 ? 0.5 : i / (ringLen - 1);
            angle = lowerStart + t * (lowerEnd - lowerStart);
          } else {
            const startAngle = (r * Math.PI) / 6;
            angle = startAngle + (2 * Math.PI * i) / (ringLen || 1);
          }
          coords.set(n.id, {
            x: Math.round((cx + radius * Math.cos(angle)) * 10) / 10,
            y: Math.round((cy + radius * Math.sin(angle)) * 10) / 10,
          });
        });
        if (allocated >= remCount) break;
      }
    }

    return { nodeLayout: coords, canvasDimension: dim };
  }, [displayedNodes, effectiveSelectedNodeId, pathSet, effectiveHiddenPath]);

  const activeEvidence = useMemo(() => {
    return allEvidence.find((e) => e.id === activeEvidenceId) || null;
  }, [allEvidence, activeEvidenceId]);

  // Toggle single relation category
  const toggleRelationCategory = (cat: string) => {
    setActiveRelationCategories((prev) => {
      if (prev.includes(cat)) {
        if (prev.length === 1) return prev; // keep at least one
        return prev.filter((c) => c !== cat);
      }
      return [...prev, cat];
    });
  };

  // Reset all filters
  const resetFilters = () => {
    setActiveRelationCategories([
      'COMMUNICATION', 'VEHICLE', 'LOCATION', 'FINANCIAL', 'CASE', 'ORGANIZATION'
    ]);
    setSelectedCase('ALL');
    setSelectedSource('ALL');
    setMinConfidence(0.5);
    setMaxDepth(5);
    setEntityLimit(15);
    setSearchQuery('');
    setCommandInput('');
    setActiveSuggestionId(null);
    setSelectedNodeId(allNodes[0]?.id || 'P-014');
    setInspectingEntityId(null);
  };

  // Run path analysis animation
  const runAnalysis = () => {
    if (!activeHiddenRelationship && hiddenRelationships.length > 0) {
      setActiveHiddenRelationshipId(hiddenRelationships[0].id);
    }
    setShowPath(true);
    setAnalysisStep(1);
    setPathProgress(1);
    const stepsCount = Math.max(2, effectiveHiddenPath.length);
    Array.from({ length: stepsCount - 1 }).forEach((_, idx) => {
      const step = idx + 2;
      window.setTimeout(() => {
        setAnalysisStep(Math.min(5, step));
        setPathProgress(step);
      }, 650 * (idx + 1));
    });
  };

  // Apply a smart suggestion
  const handleApplySuggestion = (suggestion: NexusSuggestion) => {
    setActiveSuggestionId(suggestion.id);
    if (suggestion.targetNodeId) {
      setSelectedNodeId(suggestion.targetNodeId);
      setInspectingEntityId(suggestion.targetNodeId);
    }
    if (suggestion.activeCategories) {
      setActiveRelationCategories(suggestion.activeCategories);
    }
    if (suggestion.searchFilter) {
      setSearchQuery(suggestion.searchFilter);
    }
    if (suggestion.stepAnimation) {
      runAnalysis();
    }
    setActiveTab('CANVAS');
  };

  return (
    <div className="p-5 xl:p-6 space-y-5 font-body">
      {/* 1. Top Intelligent Control & Filter Bar */}
      <section className="glass rounded-xl p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: Search & Scope Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[240px]">
              <Search className="absolute left-3 top-2.5 size-3.5 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search entities, phones, plates..."
                className="w-full rounded-md pl-8 pr-7 py-1.5 text-xs bg-void/80 border border-signal/20 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-signal/50 font-mono"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
              <span className="text-signal">●</span>
              <span>LIVE INVESTIGATION</span>
            </div>
          </div>

          {/* Center/Categories: Multi-category relation filters */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-mono text-muted-foreground mr-1 hidden lg:inline">
              RELATIONS:
            </span>

            {ALL_RELATION_CATEGORIES.map((cat) => {
              const active = activeRelationCategories.includes(cat);
              const count = allEdges.filter((e) => e.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => toggleRelationCategory(cat)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono flex items-center gap-1.5 border transition ${
                    active
                      ? 'bg-signal/15 border-signal/50 text-signal shadow-[0_0_8px_rgba(0,240,255,0.15)]'
                      : 'bg-void/60 border-signal/10 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className={`size-1.5 rounded-full ${active ? 'bg-signal' : 'bg-muted-foreground/40'}`} />
                  <span>{cat}</span>
                  <span className="text-[9px] opacity-70">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Right: Dropdowns & Reset Action */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Case Docket Filter */}
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'CASE' ? null : 'CASE')}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-void/80 border border-signal/20 text-xs font-mono text-foreground hover:border-signal/40 transition"
              >
                <span className="text-muted-foreground text-[10px]">CASE:</span>
                <span className="text-signal font-medium">{selectedCase}</span>
                <ChevronDown className="size-3 text-muted-foreground" />
              </button>

              {openDropdown === 'CASE' && (
                <div className="absolute right-0 mt-1 w-44 rounded-lg bg-panel border border-signal/30 shadow-2xl py-1 z-30 font-mono text-xs animate-in fade-in zoom-in-95">
                  {['ALL', 'CR-2026-0142', 'CR-2025-0811'].map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        setSelectedCase(c);
                        setOpenDropdown(null);
                      }}
                      className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-signal/15 transition ${
                        selectedCase === c ? 'text-signal bg-signal/10' : 'text-foreground'
                      }`}
                    >
                      <span>{c === 'ALL' ? 'All Case Dockets' : c}</span>
                      {selectedCase === c && <Check className="size-3 text-signal" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Entity Density Limit Filter Dropdown */}
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'LIMIT' ? null : 'LIMIT')}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-void/80 border border-signal/20 text-xs font-mono text-foreground hover:border-signal/40 transition"
              >
                <SlidersHorizontal className="size-3 text-signal" />
                <span className="text-muted-foreground text-[10px]">ENTITIES:</span>
                <span className="text-signal font-medium">
                  {entityLimit === 'ALL' ? `All (${allNodes.length})` : `Top ${entityLimit}`}
                </span>
                <ChevronDown className="size-3 text-muted-foreground" />
              </button>

              {openDropdown === 'LIMIT' && (
                <div className="absolute right-0 mt-1 w-48 rounded-lg bg-panel border border-signal/30 shadow-2xl py-1 z-30 font-mono text-xs animate-in fade-in zoom-in-95">
                  {([10, 15, 25, 50, 'ALL'] as const).map((lim) => (
                    <button
                      key={String(lim)}
                      onClick={() => {
                        setEntityLimit(lim);
                        setOpenDropdown(null);
                      }}
                      className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-signal/15 transition ${
                        entityLimit === lim ? 'text-signal bg-signal/10 font-semibold' : 'text-foreground'
                      }`}
                    >
                      <span>{lim === 'ALL' ? `All Entities (${allNodes.length})` : `Top ${lim} Critical Entities`}</span>
                      {entityLimit === lim && <Check className="size-3 text-signal" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Reset Filters */}
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs font-mono text-muted-foreground hover:text-signal border border-signal/10 hover:border-signal/30 bg-void/40 transition"
              title="Reset all filters to defaults"
            >
              <RotateCcw className="size-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Main Graph Viewport & Inspector Layout */}
      <div className="grid grid-cols-12 gap-4 xl:gap-5">
        {/* Graph Canvas / Radial / Analytics Container (Left 8 Cols) */}
        <section className="col-span-12 xl:col-span-8 glass rounded-xl p-4 relative min-h-[660px] overflow-hidden flex flex-col justify-between">
          {/* View Switcher Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3 px-1">
            <div>
              <div className="text-[10px] tracking-[0.22em] font-mono text-signal/70">
                NETWORK INVESTIGATION
              </div>
              <div className="font-display text-sm font-medium text-foreground flex flex-wrap items-center gap-2">
                <span>Multi-Hop Relationship Discovery</span>
                <span className="text-signal font-mono text-[11px]">
                  {canvasEdges.length} active edges
                </span>
                <span className="text-muted-foreground text-[11px] font-mono">
                  · Showing <span className="text-signal font-semibold">{activeTab === 'RADIAL' ? radialNodesCount : displayedNodes.length}</span> of {allNodes.length} entities
                </span>
                {(activeTab === 'RADIAL' ? radialNodesCount : displayedNodes.length) < allNodes.length && (
                  <span className="text-[9px] font-mono text-safe bg-safe/10 border border-safe/25 px-1.5 py-0.5 rounded">
                    {activeTab === 'RADIAL' ? 'RADIAL ORBIT' : 'KEY HUBS ONLY'}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Entity Limit Quick Selector */}
              <div className="flex items-center gap-1 bg-void/80 border border-signal/20 rounded-md p-0.5 text-xs font-mono">
                <span className="text-[10px] text-muted-foreground px-1.5 flex items-center gap-1">
                  <SlidersHorizontal className="size-3 text-signal" />
                  <span className="hidden sm:inline">ENTITIES:</span>
                </span>
                {([10, 15, 25, 50, 'ALL'] as const).map((lim) => (
                  <button
                    key={String(lim)}
                    onClick={() => setEntityLimit(lim)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition ${
                      entityLimit === lim
                        ? 'bg-signal/20 text-signal border border-signal/40 font-semibold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-signal/10 border border-transparent'
                    }`}
                    title={lim === 'ALL' ? `Show all ${allNodes.length} entities` : `Show top ${lim} most important entities`}
                  >
                    {lim === 'ALL' ? 'ALL' : lim}
                  </button>
                ))}
              </div>

              {/* Sub-view Switcher Tabs */}
              <div className="flex rounded-md bg-void/80 border border-signal/20 p-0.5">
                <button
                  onClick={() => setActiveTab('CANVAS')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono transition ${
                    activeTab === 'CANVAS'
                      ? 'bg-signal/20 text-signal border border-signal/30'
                      : 'text-muted-foreground hover:text-foreground border border-transparent'
                  }`}
                  title="2D Topological Graph Canvas"
                >
                  <Network className="size-3.5" />
                  <span>Canvas</span>
                </button>
                <button
                  onClick={() => setActiveTab('RADIAL')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono transition ${
                    activeTab === 'RADIAL'
                      ? 'bg-signal/20 text-signal border border-signal/30'
                      : 'text-muted-foreground hover:text-foreground border border-transparent'
                  }`}
                  title="Ego-Centric Radial Orbit Graph"
                >
                  <Orbit className="size-3.5" />
                  <span>Radial Orbit</span>
                </button>
                <button
                  onClick={() => setActiveTab('ANALYTICS')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono transition ${
                    activeTab === 'ANALYTICS'
                      ? 'bg-signal/20 text-signal border border-signal/30'
                      : 'text-muted-foreground hover:text-foreground border border-transparent'
                  }`}
                  title="Network Centrality & Activity Density Graphs"
                >
                  <BarChart3 className="size-3.5" />
                  <span>Analytics</span>
                </button>
              </div>

              {/* Deep Hidden Relationships Trigger Button */}
              <button
                onClick={() => setIsHiddenDrawerOpen(true)}
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-mono font-medium border transition shadow-sm ${
                  isHiddenDrawerOpen || activeHiddenRelationship
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                    : 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/25'
                }`}
                title="Open Deep Hidden Relationships Analyzer Drawer"
              >
                <Sparkles className="size-3.5 text-cyan-400 animate-pulse" />
                <span>Deep Hidden Leads</span>
                <span className="px-1.5 py-0.2 rounded-full bg-cyan-500/30 text-cyan-200 text-[10px] font-bold">
                  {hiddenRelationships.length}
                </span>
              </button>

              {/* Trace Path Action Button */}
              <button
                onClick={runAnalysis}
                disabled={analysisStep > 0 && analysisStep < 5}
                className="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium bg-signal/15 border border-signal/40 text-signal hover:bg-signal/25 transition disabled:opacity-50"
              >
                <span>{analysisStep > 0 && analysisStep < 5 ? 'Tracing path…' : 'Trace Active Lead'}</span>
                <Network className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Sub-view Area */}
          <div 
            className="relative flex-1 min-h-[550px] rounded-lg bg-void/60 border border-signal/10 overflow-hidden grid-bg"
            onWheel={activeTab === 'CANVAS' ? handleWheel : undefined}
          >
            {activeTab === 'CANVAS' && (
              <>
                <div className="absolute inset-0 graph-vignette pointer-events-none" />

                <div className="absolute left-3 top-3 z-10 font-mono text-[10px] text-muted-foreground flex items-center gap-2">
                  <span className="size-2 rounded-full bg-signal blink" />
                  <span>GRAPH ACTIVE · DYNAMIC FILTERING & PHOTON DASH PACKETS</span>
                </div>

                {/* Active Hidden Lead HUD Banner */}
                {activeHiddenRelationship && (
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-[#070d1e]/95 border border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.25)] backdrop-blur-md animate-in fade-in zoom-in-95">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                    <span className="font-mono text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                      TRACING HIDDEN LEAD:
                    </span>
                    <span className="font-mono text-xs text-slate-200 font-bold">
                      {activeHiddenRelationship.sourceNodeName} ↔ {activeHiddenRelationship.targetNodeName}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[9px] font-bold">
                      {activeHiddenRelationship.categoryTitle} · {activeHiddenRelationship.hopCount} HOPS
                    </span>
                    <button
                      onClick={() => setActiveHiddenRelationshipId(null)}
                      className="ml-1 px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] font-mono border border-slate-700 transition"
                      title="Clear active trace"
                    >
                      Clear
                    </button>
                  </div>
                )}

                <svg
                  viewBox={`0 0 ${canvasDimension} ${canvasDimension}`}
                  className={`absolute inset-0 size-full select-none ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
                  style={{ 
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: 'center center',
                    transition: isPanning ? 'none' : 'transform 0.2s ease-out'
                  }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  aria-label="Interactive network canvas"
                >
                  {/* Glow Filters for Animated Threads & Photons */}
                  <defs>
                    <filter id="net-thread-glow" x="-30%" y="-30%" width="160%" height="160%">
                      <feGaussianBlur stdDeviation="0.6" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    <filter id="net-packet-glow" x="-60%" y="-60%" width="220%" height="220%">
                      <feGaussianBlur stdDeviation="1.0" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Virtual Discovered Cyber Arc (Rendered when an indirect hidden relationship is active) */}
                  {activeHiddenRelationship && (() => {
                    const sPos = nodeLayout.get(activeHiddenRelationship.sourceNodeId);
                    const tPos = nodeLayout.get(activeHiddenRelationship.targetNodeId);
                    if (!sPos || !tPos) return null;

                    const dx = tPos.x - sPos.x;
                    const dy = tPos.y - sPos.y;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    const mx = (sPos.x + tPos.x) / 2 - (dy / dist) * 10;
                    const my = (sPos.y + tPos.y) / 2 + (dx / dist) * 10;
                    const arcPath = `M ${sPos.x} ${sPos.y} Q ${mx} ${my} ${tPos.x} ${tPos.y}`;

                    return (
                      <g className="virtual-cyber-arc">
                        {/* Outer glow aura */}
                        <path
                          d={arcPath}
                          fill="none"
                          stroke="rgba(245, 158, 11, 0.4)"
                          strokeWidth={`${densityScale.strokeW * 2.8}px`}
                          strokeLinecap="round"
                          filter="url(#net-thread-glow)"
                        />
                        {/* Flowing animated dash arc */}
                        <path
                          d={arcPath}
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth={`${densityScale.strokeW * 1.4}px`}
                          strokeDasharray="3 2"
                          strokeLinecap="round"
                        />
                        {/* High-intensity traveling photon along the indirect arc */}
                        <circle r={densityScale.nodeR * 0.3} fill="#fef08a" filter="url(#net-packet-glow)">
                          <animateMotion dur="2.2s" repeatCount="indefinite" path={arcPath} />
                        </circle>
                        {/* Category Label Pill at Midpoint */}
                        <g transform={`translate(${mx}, ${my})`}>
                          <rect
                            x={-densityScale.fontSize * 3.8}
                            y={-densityScale.fontSize * 1.2}
                            width={densityScale.fontSize * 7.6}
                            height={densityScale.fontSize * 2.2}
                            rx={densityScale.fontSize * 0.6}
                            fill="#070d1e"
                            stroke="#f59e0b"
                            strokeWidth={densityScale.strokeW * 0.7}
                          />
                          <text
                            x="0"
                            y={densityScale.fontSize * 0.45}
                            textAnchor="middle"
                            fill="#fbbf24"
                            fontSize={`${densityScale.fontSize * 0.75}px`}
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            {activeHiddenRelationship.categoryTitle.slice(0, 14)}
                          </text>
                        </g>
                      </g>
                    );
                  })()}

                  {/* Edges with Animated Connecting Threads & Traveling Photons (Filtered to displayed nodes) */}
                  {canvasEdges.map((edge, idx) => {
                    const sNode = allNodes.find((n) => n.id === edge.source);
                    const tNode = allNodes.find((n) => n.id === edge.target);
                    const sPos = nodeLayout.get(edge.source) || (sNode ? { x: sNode.x, y: sNode.y } : null);
                    const tPos = nodeLayout.get(edge.target) || (tNode ? { x: tNode.x, y: tNode.y } : null);
                    if (!sPos || !tPos) return null;
                    const isConsecutive = consecutivePathEdges.has(`${edge.source}__${edge.target}`);
                    const isPathActive = isConsecutive && (showPath ? (pathSet.has(edge.source) && pathSet.has(edge.target)) : false);
                    const isLeadActive = Boolean(selectedLead);
                    const isDimmedEdge = (isLeadActive || showPath) && !isPathActive;
                    const durationSec = isPathActive ? 1.6 : 3.2 + (idx % 4) * 0.7;

                    // Ensure photon travels in downstream direction of path
                    const srcIdx = effectiveHiddenPath.indexOf(edge.source);
                    const tgtIdx = effectiveHiddenPath.indexOf(edge.target);
                    const isForward = srcIdx !== -1 && tgtIdx !== -1 ? srcIdx < tgtIdx : true;
                    const pStart = isForward ? sPos : tPos;
                    const pEnd = isForward ? tPos : sPos;

                    return (
                      <g
                        key={edge.id}
                        className={`${isPathActive ? 'graph-edge graph-edge-active' : 'graph-edge'} ${
                          isDimmedEdge ? 'opacity-10 transition-opacity duration-300' : 'transition-opacity duration-300'
                        }`}
                        onClick={() => setActiveEvidenceId(edge.recordId)}
                        style={{ outline: 'none' }}
                      >
                        {/* Structural Base Thread */}
                        <line
                          x1={sPos.x}
                          y1={sPos.y}
                          x2={tPos.x}
                          y2={tPos.y}
                          className="thread-base"
                          style={{ strokeWidth: `${densityScale.strokeW}px` }}
                        />
                        
                        {/* Flowing Animated Dash Thread */}
                        <line
                          x1={sPos.x}
                          y1={sPos.y}
                          x2={tPos.x}
                          y2={tPos.y}
                          className="thread-pulse"
                          style={{ strokeWidth: `${densityScale.strokeW * 1.3}px` }}
                        />

                        {/* Traveling Luminous Photon Particle ONLY along actively traced consecutive path edges */}
                        {isPathActive && (
                          <circle
                            r={densityScale.nodeR * 0.25}
                            fill="#00f0ff"
                            filter="url(#net-packet-glow)"
                            className="photon-particle"
                          >
                            <animateMotion
                              dur="1.6s"
                              repeatCount="indefinite"
                              path={`M ${pStart.x} ${pStart.y} L ${pEnd.x} ${pEnd.y}`}
                            />
                          </circle>
                        )}

                        {displayedNodes.length <= 25 && (
                          <text
                            x={(sPos.x + tPos.x) / 2}
                            y={(sPos.y + tPos.y) / 2 - 1}
                            className="edge-label"
                            style={{ fontSize: `${densityScale.fontSize * 0.7}px` }}
                          >
                            {edge.label}
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {/* Nodes - Prioritized displayedNodes only */}
                  {displayedNodes.map((node) => {
                    const pos = nodeLayout.get(node.id) || { x: node.x, y: node.y };
                    const isFocused = node.id === effectiveSelectedNodeId;
                    const isPath = pathSet.has(node.id);
                    const isVisible = visibleNodeIds.has(node.id);
                    const isActive = isFocused || node.id === inspectingEntityId;
                    const isLeadActive = Boolean(selectedLead);
                    const isDimmed = isLeadActive ? !isPath : !isVisible;

                    return (
                      <g
                        key={node.id}
                        className={`graph-node ${isActive ? 'graph-node-active graph-node-focused' : ''} ${
                          isPath ? 'graph-node-path' : ''
                        } ${isDimmed ? 'opacity-20 transition-opacity duration-300' : 'transition-opacity duration-300'}`}
                        transform={`translate(${pos.x}, ${pos.y})`}
                        onClick={() => handleEntitySelect(node.id)}
                        style={{ outline: 'none' }}
                      >
                        {/* Active Status Radar Wave Halo */}
                        {isActive && (
                          <circle
                            r={densityScale.activeR * 1.3}
                            fill="none"
                            stroke="#00f0ff"
                            className="active-radar-ring"
                          />
                        )}

                        {/* Main Node Circle */}
                        <circle r={isActive ? densityScale.activeR : densityScale.nodeR} />

                        {/* Active Status Beacon Dot */}
                        {isActive && (
                          <circle
                            cx={densityScale.activeR * 0.7}
                            cy={-densityScale.activeR * 0.7}
                            r={densityScale.nodeR * 0.28}
                            fill="#00f0ff"
                            filter="url(#net-thread-glow)"
                            className="blink"
                          />
                        )}

                        <text
                          y={densityScale.labelY}
                          className={`node-name ${isActive ? 'font-semibold' : ''}`}
                          style={{ fontSize: `${densityScale.fontSize}px`, fill: isActive ? '#ffffff' : undefined }}
                        >
                          {formatNodeName(node, densityScale.maxChars)}
                        </text>

                        {/* Active Status Badge Pill vs Regular Type Label */}
                        {isActive ? (
                          <g transform={`translate(0, ${densityScale.labelY + densityScale.fontSize * 1.1})`}>
                            <rect
                              x={-densityScale.fontSize * 2.2}
                              y={-densityScale.fontSize * 0.6}
                              width={densityScale.fontSize * 4.4}
                              height={densityScale.fontSize * 1.1}
                              rx={densityScale.fontSize * 0.5}
                              fill="rgba(0, 240, 255, 0.22)"
                              stroke="rgba(0, 240, 255, 0.75)"
                              strokeWidth={densityScale.strokeW * 0.5}
                            />
                            <text
                              y={densityScale.fontSize * 0.2}
                              fill="#00f0ff"
                              fontSize={`${densityScale.fontSize * 0.55}px`}
                              textAnchor="middle"
                              fontFamily="var(--font-mono)"
                              fontWeight="bold"
                              letterSpacing="0.05em"
                            >
                              FOCUSED
                            </text>
                          </g>
                        ) : (
                          <text
                            y={densityScale.labelY + densityScale.fontSize * 0.9}
                            className="node-sub"
                            style={{ fontSize: `${densityScale.fontSize * 0.65}px` }}
                          >
                            {formatNodeSubLabel(node)}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>

                {/* Canvas Zoom Controls */}
                <div className="absolute bottom-3 left-3 flex gap-1.5 z-10">
                  <button
                    onClick={handleZoomIn}
                    className="grid size-8 place-items-center rounded border border-signal/20 bg-panel/85 text-foreground hover:bg-signal/20 transition shadow-lg backdrop-blur-md"
                    title="Zoom in (or scroll wheel up)"
                    aria-label="Zoom in"
                  >
                    <ZoomIn className="size-3.5 text-signal" />
                  </button>
                  <button
                    onClick={handleZoomOut}
                    className="grid size-8 place-items-center rounded border border-signal/20 bg-panel/85 text-foreground hover:bg-signal/20 transition shadow-lg backdrop-blur-md"
                    title="Zoom out (or scroll wheel down)"
                    aria-label="Zoom out"
                  >
                    <ZoomOut className="size-3.5 text-signal" />
                  </button>
                  <button
                    onClick={handleResetZoom}
                    className="grid size-8 place-items-center rounded border border-signal/20 bg-panel/85 text-foreground hover:bg-signal/20 transition shadow-lg backdrop-blur-md"
                    title="Reset zoom & center pan"
                    aria-label="Reset zoom"
                  >
                    <RotateCcw className="size-3.5 text-signal" />
                  </button>
                </div>

                <div className="absolute bottom-3 right-3 font-mono text-[10px] text-muted-foreground border border-signal/15 bg-panel/80 rounded px-2.5 py-1 z-10 shadow-md backdrop-blur-md flex items-center gap-1.5">
                  <span className="text-signal font-semibold">{Math.round(zoom * 100)}%</span>
                  <span>·</span>
                  <span>drag to pan</span>
                </div>

                {/* Alert Badge on Path Reveal */}
                {analysisStep === 5 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-warn/30 bg-warn/10 px-4 py-2 text-[10px] font-mono tracking-wide text-warn z-10 animate-in fade-in zoom-in-95">
                    POTENTIAL RELATIONSHIP DETECTED · {Math.max(1, allHiddenPath.length - 1)} HOPS · HUMAN VERIFICATION REQUIRED
                  </div>
                )}
              </>
            )}

            {/* Radial Orbit Sub-Graph View */}
            {activeTab === 'RADIAL' && (
              <EgoCentricRadialGraph
                centerEntityId={mainLeadEntityId}
                selectedEntityId={inspectingEntityId || effectiveSelectedNodeId}
                onSelectEntity={handleEntitySelect}
                onSelectEdgeRecord={(recId) => setActiveEvidenceId(recId)}
                entityLimit={entityLimit}
                leadPathNodeIds={effectiveHiddenPath}
                onNodesCountChange={setRadialNodesCount}
              />
            )}

            {/* Network Centrality & Timeline Analytics View */}
            {activeTab === 'ANALYTICS' && (
              <div className="p-4 h-full overflow-y-auto">
                <NetworkAnalyticsPanel
                  selectedEntityId={effectiveSelectedNodeId}
                  onSelectEntity={handleEntitySelect}
                />
              </div>
            )}

            {/* Floating Small Entity Inspection Card */}
            {inspectingEntityId && (
              <div className="absolute top-3 right-3 z-30 w-[330px] max-w-[calc(100%-1.5rem)]">
                <EntityDetailCard
                  entityId={inspectingEntityId}
                  onClose={() => setInspectingEntityId(null)}
                  onSelectEntity={handleEntitySelect}
                  onViewRadialOrbit={(id) => {
                    setSelectedNodeId(id);
                    setActiveTab('RADIAL');
                  }}
                  onOpenEvidenceModal={(recId) => setActiveEvidenceId(recId)}
                  onNavigateToProfile={() => onNavigate && onNavigate('ENTITIES')}
                />
              </div>
            )}
          </div>
        </section>

        {/* Selected Entity & Path Dossier (Right 4 Cols) */}
        <aside className="col-span-12 xl:col-span-4 flex flex-col gap-4">
          {/* Entity Focus Card */}
          <div className="glass rounded-xl p-4 border-signal/20">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] tracking-[0.22em] font-mono text-signal/70">
                ENTITY FOCUS
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">{selectedNode ? formatNodeSubLabel(selectedNode) : ''}</span>
            </div>

            <div className="flex items-center gap-3">
              <div
                className={`entity-icon entity-icon-${
                  NEXUS_ENTITY_TONES[selectedNode?.type || 'PERSON']
                }`}
              >
                {NEXUS_ENTITY_ICONS[selectedNode?.type || 'PERSON']}
              </div>
              <div>
                <div className="font-display text-base font-semibold text-foreground">
                  {getEntityDisplayName(selectedNode)}
                </div>
                <div className="text-[10px] font-mono text-muted-foreground">
                  {selectedNode?.type} · {selectedNode?.subtitle}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4 text-[11px]">
              <div>
                <div className="font-mono text-[10px] text-muted-foreground">CONNECTIONS</div>
                <div className="text-[11px] mt-0.5 text-foreground">{selectedNode?.connections ?? 0}</div>
              </div>
              <div>
                <div className="font-mono text-[10px] text-muted-foreground">RELATED CASES</div>
                <div className="text-[11px] mt-0.5 text-foreground">{selectedNode?.cases ?? 0}</div>
              </div>
              <div>
                <div className="font-mono text-[10px] text-muted-foreground">IDENTIFIER</div>
                <div className="text-[11px] mt-0.5 text-foreground">{selectedNode ? formatNodeSubLabel(selectedNode) : ''}</div>
              </div>
              <div>
                <div className="font-mono text-[10px] text-muted-foreground">RESOLUTION</div>
                <div className="text-[11px] mt-0.5 text-safe">HIGH CONFIDENCE</div>
              </div>
            </div>

            {/* Primary Action: Deep Hidden Relationships Traversal */}
            <div className="mt-4 pt-3 border-t border-signal/15">
              <button
                onClick={handleFindHiddenRelationships}
                disabled={isFindingHidden}
                className="w-full py-2.5 px-3 rounded-lg bg-gradient-to-r from-signal/20 via-cyan-500/25 to-warn/20 hover:from-signal/30 hover:via-cyan-500/35 hover:to-warn/30 border border-signal/40 hover:border-signal text-signal font-mono text-xs font-bold flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,255,200,0.15)] transition disabled:opacity-50 group"
              >
                {isFindingHidden ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-signal" />
                    <span>TRAVERSING 2-5 HOP PATHS...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-signal group-hover:rotate-12 transition-transform" />
                    <span>FIND HIDDEN RELATIONSHIPS (2-5 HOPS)</span>
                  </>
                )}
              </button>
            </div>

            {/* Actions for this entity */}
            <div className="mt-2.5 flex items-center justify-between gap-2">
              <button
                onClick={() => setInspectingEntityId(selectedNode?.id || null)}
                className="inline-flex items-center gap-1 text-xs text-signal hover:underline font-mono transition"
                title="Open floating detail card for this entity"
              >
                <span>Inspect Card</span>
              </button>

              <button
                onClick={() => setActiveTab('RADIAL')}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-mono transition"
              >
                <Orbit className="size-3" />
                <span>Orbit</span>
              </button>

              {onNavigate && (
                <button
                  onClick={() => onNavigate('ENTITIES')}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-mono transition"
                >
                  <span>Profile</span>
                  <ArrowRight className="size-3" />
                </button>
              )}
            </div>
          </div>

          {/* Discovered Deep Leads HUD & Evidence Audit Panel */}
          {discoveredLeads.length > 0 ? (
            <div className="glass rounded-xl p-4 border-warn/25 flex-1 flex flex-col gap-3 overflow-y-auto max-h-[540px]">
              {/* Header */}
              <div className="text-[10px] tracking-[0.2em] font-mono text-warn flex items-center justify-between pb-2 border-b border-warn/20">
                <span className="flex items-center gap-1.5 font-bold">
                  <GitFork className="w-3.5 h-3.5 text-warn" />
                  POTENTIAL RELATIONSHIPS DETECTED ({discoveredLeads.length})
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-signal/15 text-signal font-mono font-bold">
                  2-5 HOPS EVALUATED
                </span>
              </div>

              {/* Detected Leads Selector HUD Cards */}
              <div className="space-y-1.5">
                {discoveredLeads.map((lead: any, idx: number) => {
                  const isSelected = selectedLead === lead;
                  return (
                    <button
                      key={`lead-${lead.target_entity?.id || idx}`}
                      onClick={() => handleSelectLead(lead)}
                      className={`w-full text-left p-2.5 rounded-lg border transition flex flex-col gap-1.5 ${
                        isSelected
                          ? 'bg-warn/15 border-warn text-foreground shadow-[0_0_12px_rgba(234,179,8,0.2)]'
                          : 'bg-panel/40 border-signal/15 text-muted-foreground hover:border-warn/40 hover:text-foreground hover:bg-panel/70'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-warn">#{idx + 1}</span>
                          <span className="font-semibold text-xs text-foreground">
                            {getEntityDisplayName(lead.target_entity || lead.targetEntityId || lead.target_entity?.id)}
                          </span>
                        </div>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-panel/60 border border-signal/20 text-signal">
                          {lead.target_entity?.type || 'ENTITY'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                        <span className="flex items-center gap-1 text-foreground/80">
                          <span>{lead.path_length} Hops</span>
                          <span>•</span>
                          <span className="text-signal font-bold">Score {typeof lead.path_score === 'number' ? lead.path_score.toFixed(1) : lead.path_score}</span>
                        </span>
                        <span className="text-warn font-semibold">
                          {Math.round((lead.confidence || 0.85) * 100)}% Conf
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Comprehensive Evidence Audit Provenance Panel */}
              {selectedLead && (
                <div className="mt-1 pt-3 border-t border-signal/15 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold tracking-wider text-cyan-400 flex items-center gap-1.5">
                      <Fingerprint className="w-3.5 h-3.5 text-cyan-400" />
                      EVIDENCE AUDIT PROVENANCE
                    </span>
                    <button
                      onClick={() => handleSelectLead(selectedLead)}
                      className="text-[10px] font-mono text-signal hover:underline flex items-center gap-1"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      Re-trace Path
                    </button>
                  </div>

                  {/* Path Sequence Steps */}
                  <div className="space-y-1">
                    <div className="text-[10px] font-mono text-muted-foreground">TRAVERSED PATH SEQUENCE:</div>
                    <div className="space-y-1">
                      {selectedLead.path?.map((step: any, sIdx: number) => (
                        <button
                          key={`step-${step.entityId}-${sIdx}`}
                          onClick={() => {
                            setSelectedNodeId(step.entityId);
                            setInspectingEntityId(step.entityId);
                          }}
                          className={`w-full text-left flex items-center justify-between p-1.5 px-2 rounded border text-[11px] font-mono transition ${
                            effectiveSelectedNodeId === step.entityId
                              ? 'bg-signal/15 border-signal text-signal'
                              : 'bg-panel/30 border-signal/10 text-muted-foreground hover:border-signal/30 hover:text-foreground'
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <span className="text-warn/80 font-bold">{sIdx + 1}.</span>
                            <span className="text-foreground">{step.entityName || step.entityId}</span>
                          </span>
                          <span className="text-[9px] px-1 rounded bg-black/40 text-muted-foreground">{step.entityType}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Why Flagged Explainability */}
                  {selectedLead.why_flagged && selectedLead.why_flagged.length > 0 && (
                    <div className="space-y-1.5 rounded-lg bg-panel/40 p-2.5 border border-signal/10">
                      <div className="text-[10px] font-mono text-warn font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-warn" />
                        <span>WHY FLAGGED (ALGORITHMIC RATIONALE):</span>
                      </div>
                      <ul className="space-y-1 text-[10.5px] leading-relaxed text-foreground/90 pl-1">
                        {selectedLead.why_flagged.map((item: string, wIdx: number) => (
                          <li key={`why-${wIdx}`} className="flex items-start gap-1.5">
                            <span className="text-signal text-xs mt-[-1px]">▸</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Supporting Records Provenance */}
                  {selectedLead.supporting_records && selectedLead.supporting_records.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                        <FileText className="w-3 h-3 text-signal" />
                        <span>SUPPORTING RECORDS ({selectedLead.supporting_records.length}):</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {selectedLead.supporting_records.slice(0, 8).map((recId: string, rIdx: number) => (
                          <button
                            key={`rec-${rIdx}`}
                            onClick={() => {
                              if (onOpenEvidenceModal) {
                                onOpenEvidenceModal(recId);
                              } else {
                                setActiveEvidenceId(recId);
                              }
                            }}
                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-signal/10 hover:bg-signal/20 border border-signal/30 text-signal hover:text-signal transition inline-flex items-center gap-1"
                            title={`Inspect evidence record: ${recId}`}
                          >
                            <span>{recId}</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Related Cases & Time Window */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-1">
                    {selectedLead.supporting_cases && selectedLead.supporting_cases.length > 0 && (
                      <div>
                        <span className="text-muted-foreground block text-[9px]">RELATED CASES</span>
                        <span className="text-warn font-bold">{selectedLead.supporting_cases.join(', ')}</span>
                      </div>
                    )}
                    {selectedLead.earliest_timestamp && (
                      <div>
                        <span className="text-muted-foreground block text-[9px] flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          TIME WINDOW
                        </span>
                        <span className="text-foreground/90 truncate block text-[9px]">
                          {selectedLead.earliest_timestamp.split('T')[0]} → {selectedLead.latest_timestamp ? selectedLead.latest_timestamp.split('T')[0] : 'PRESENT'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Human Verification Badge */}
                  <div className="flex items-start gap-2 rounded-md bg-warn/10 border border-warn/30 px-2.5 py-2">
                    <ShieldAlert className="text-warn w-4 h-4 shrink-0 mt-0.5" />
                    <span className="text-[9.5px] leading-relaxed text-warn font-mono">
                      HUMAN VERIFICATION REQUIRED — This is an algorithmic investigative lead, not a legal conclusion. Corroborate evidence records before formal action.
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Fallback: Discovered Relationship Path & Hidden Lead Card */
            <div className="glass rounded-xl p-4 border-warn/25 flex-1 flex flex-col justify-between">
              <div>
                <div className="text-[10px] tracking-[0.22em] font-mono text-warn mb-2 flex items-center justify-between">
                  <span>DISCOVERED RELATIONSHIP PATH</span>
                  <span className="text-[9px] font-mono text-signal font-bold">
                    {Math.round((activeHiddenRelationship?.confidence || allSuggestions[0]?.confidence || 0.88) * 100)}% CONFIDENCE
                  </span>
                </div>
                
                <div className="text-sm font-display font-semibold text-foreground flex items-center justify-between">
                  <div>
                    {activeHiddenRelationship ? (
                      <span>
                        {getEntityDisplayName(activeHiddenRelationship.sourceNodeName || activeHiddenRelationship.sourceId)}{' '}
                        <span className="text-warn">↔</span>{' '}
                        {getEntityDisplayName(activeHiddenRelationship.targetNodeName || activeHiddenRelationship.targetId)}
                      </span>
                    ) : (
                      <span>
                        {getEntityDisplayName(allNodes.find((n) => n.id === effectiveHiddenPath[0]) || effectiveHiddenPath[0])}{' '}
                        <span className="text-warn">↔</span>{' '}
                        {getEntityDisplayName(allNodes.find((n) => n.id === effectiveHiddenPath[effectiveHiddenPath.length - 1]) || effectiveHiddenPath[effectiveHiddenPath.length - 1])}
                      </span>
                    )}
                  </div>
                  {activeHiddenRelationship && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-warn/15 text-warn font-semibold">
                      {activeHiddenRelationship.categoryTitle.split(' ')[0]}
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                  {activeHiddenRelationship?.discoverySummary || (
                    `${Math.max(1, effectiveHiddenPath.length - 1)} hops through discovered multi-source linkages across operational records.`
                  )}
                </p>

                {/* Path Node Steps */}
                <div className="mt-4 space-y-1.5">
                  {effectiveHiddenPath.map((nodeId, idx) => {
                    const n = allNodes.find((t) => t.id === nodeId);
                    const displayName = getEntityDisplayName(n || nodeId);
                    const subLabel = n ? formatNodeSubLabel(n) : getCanonicalEntity(nodeId)?.subtitle || '';
                    return (
                      <button
                        key={`${nodeId}-${idx}`}
                        onClick={() => {
                          setSelectedNodeId(nodeId);
                          setInspectingEntityId(nodeId);
                        }}
                        className={`w-full text-left flex items-center justify-between p-2 rounded border text-xs font-mono transition ${
                          effectiveSelectedNodeId === nodeId
                            ? 'bg-signal/10 border-signal text-signal'
                            : 'bg-panel/40 border-signal/10 text-muted-foreground hover:border-signal/30 hover:text-foreground'
                        }`}
                      >
                        <span className="flex items-center gap-1.5 min-w-0">
                          <span className="text-signal/60 font-mono shrink-0">{idx + 1}.</span>
                          <span className="font-medium text-foreground truncate">{displayName}</span>
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0">{subLabel}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Action to open full Deep Relationships Analyzer */}
                <button
                  onClick={() => setIsHiddenDrawerOpen(true)}
                  className="w-full mt-3 py-1.5 px-3 rounded-lg border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Explore All {hiddenRelationships.length} Hidden Leads & Paths →</span>
                </button>
              </div>

              <div className="mt-4 flex items-start gap-2 rounded-md bg-warn/10 border border-warn/30 px-3 py-2">
                <ShieldAlert className="text-warn w-4 h-4 shrink-0 mt-0.5" />
                <span className="text-[10px] leading-relaxed text-warn font-mono">
                  HUMAN VERIFICATION REQUIRED — Click "FIND HIDDEN RELATIONSHIPS" above to perform multi-hop provenance traversal for this entity.
                </span>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* 3. AI-Assisted Investigative Suggestions */}
      <section className="col-span-12">
        <InvestigativeSuggestions
          onApplySuggestion={handleApplySuggestion}
          activeSuggestionId={activeSuggestionId}
          suggestions={dataDrivenSuggestions}
        />
      </section>

      {/* 4. Structured Inquiry & Quick Chips */}
      <section className="glass rounded-xl px-4 py-3 flex flex-col gap-2.5 border-signal/20">
        <div className="flex items-center gap-3">
          <Command className="size-4 text-signal shrink-0" />
          <input
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && commandInput.trim()) {
                const q = commandInput.trim().toLowerCase();
                const matched = allNodes.find((n) =>
                  n.name.toLowerCase().includes(q) ||
                  n.id.toLowerCase() === q ||
                  n.id.toLowerCase().includes(q)
                );
                if (matched) {
                  setSelectedNodeId(matched.id);
                  setInspectingEntityId(matched.id);
                }
              }
            }}
            className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none border-0"
            placeholder="Ask the investigation system… (e.g. Trace Garima ↔ Shailesh, find vehicle nexus, or click a suggestion)"
          />
          <span className="hidden md:block text-[10px] font-mono text-muted-foreground px-2 py-1 rounded border border-signal/15">
            STRUCTURED INQUIRY
          </span>
          <button
            onClick={() => {
              if (commandInput.trim()) {
                const q = commandInput.trim().toLowerCase();
                const matched = allNodes.find((n) =>
                  n.name.toLowerCase().includes(q) ||
                  n.id.toLowerCase() === q ||
                  n.id.toLowerCase().includes(q)
                );
                if (matched) {
                  setSelectedNodeId(matched.id);
                  setInspectingEntityId(matched.id);
                }
              }
            }}
            className="rounded bg-signal/20 px-3 py-1 text-xs font-mono text-signal hover:bg-signal/30 transition"
          >
            Submit
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-signal/10 text-xs font-mono">
          <span className="text-[10px] text-muted-foreground">SUGGESTED QUERIES:</span>
          {dataDrivenSuggestions.map((sug) => (
            <button
              key={sug.id}
              onClick={() => {
                setCommandInput(sug.actionLabel || sug.title);
                handleApplySuggestion(sug);
              }}
              className="px-2 py-0.5 rounded bg-signal/10 text-signal border border-signal/25 hover:bg-signal/20 transition text-[11px]"
            >
              {sug.actionLabel || sug.title}
            </button>
          ))}
          <button
            onClick={resetFilters}
            className="px-2 py-0.5 rounded bg-panel/50 text-muted-foreground border border-signal/10 hover:text-signal transition text-[11px]"
          >
            Reset All Filters
          </button>
        </div>
      </section>

      {/* Forensic Evidence Modal */}
      {activeEvidence && (
        <EvidenceModal
          record={activeEvidence}
          onClose={() => setActiveEvidenceId(null)}
        />
      )}

      {/* Deep Hidden Relationships Analysis Drawer */}
      <HiddenRelationshipsDrawer
        isOpen={isHiddenDrawerOpen}
        onClose={() => setIsHiddenDrawerOpen(false)}
        onSelectEntityId={(id) => {
          setSelectedNodeId(id);
          setInspectingEntityId(id);
        }}
        onOpenEvidenceModal={(recId) => setActiveEvidenceId(recId)}
      />
    </div>
  );
};
