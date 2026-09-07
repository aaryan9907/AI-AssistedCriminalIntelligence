import React, { useState, useMemo, useEffect } from 'react';
import { 
  ChevronDown, 
  Command, 
  Filter, 
  Sparkles, 
  ZoomIn, 
  ZoomOut, 
  ArrowRight,
  Search,
  RotateCcw,
  BarChart3,
  Network,
  Orbit,
  SlidersHorizontal,
  X,
  Check
} from 'lucide-react';
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
  NexusEvidence,
  NexusSuggestion
} from '../../services/nexusData';
import { useIntelData } from '../../context/IntelDataContext';
import { NavSection } from '../layout/SidebarNav';
import { EvidenceModal } from '../evidence/EvidenceModal';
import { NetworkAnalyticsPanel } from '../network/NetworkAnalyticsPanel';
import { EgoCentricRadialGraph } from '../network/EgoCentricRadialGraph';
import { InvestigativeSuggestions } from '../network/InvestigativeSuggestions';
import { EntityDetailCard } from '../network/EntityDetailCard';
import { getCanonicalEntity, getEntityDisplayName } from '../../services/canonicalEntities';

interface CommandCenterProps {
  stats?: any;
  leads?: any[];
  entities?: any[];
  relationships?: any[];
  timeline?: any[];
  onNavigate: (section: NavSection) => void;
  onSelectLead?: (lead: any) => void;
  onSelectEntity?: (entityId: string) => void;
}

type GraphViewTab = 'CANVAS' | 'RADIAL' | 'ANALYTICS';

export function formatNodeName(node: NexusNode, maxChars: number = 16): string {
  // Always resolve to the human-readable actual name
  let name = node.name || node.id;
  if (
    !name || 
    name === node.id || 
    /^Phone\s+PH/i.test(name) || 
    /^Vehicle\s+VH/i.test(name) || 
    /^Case\s+CASE/i.test(name) || 
    /^Location\s+LOC/i.test(name) || 
    /^Account\s+ACC/i.test(name)
  ) {
    const canonical = getCanonicalEntity(node.id);
    if (canonical) {
      name = canonical.name;
    }
  }

  // If phone like: "+91 98773-97255 (Garima's Phone)"
  const phoneOwnerMatch = name.match(/\((.+)'s Phone\)/i);
  if (phoneOwnerMatch) {
    return `${phoneOwnerMatch[1]}'s Phone`;
  }
  // If vehicle like: "Hyundai i20 (UP16-AA-1646)" or "Maruti Swift (DL01-WQ-8995)"
  const modelMatch = name.match(/^([^(]+)\s*\(/);
  if (modelMatch && (node.type === 'VEHICLE' || node.id?.startsWith('VH'))) {
    return modelMatch[1].trim();
  }
  // If Case like: "Vehicle Related Case (CASE04)" or "Theft Case (CASE01)"
  const caseMatch = name.match(/^([^(]+)\s*\(/);
  if (caseMatch && (node.type === 'CASE' || node.id?.startsWith('CASE'))) {
    return caseMatch[1].trim();
  }
  // If Bank Account: "Metro Cooperative Bank (Monika - Savings)"
  const bankMatch = name.match(/^([^(]+)\s*\(/);
  if (bankMatch && (node.type === 'BANK ACCOUNT' || node.id?.startsWith('ACC'))) {
    const acctHolderMatch = name.match(/\((.+)\)/);
    if (acctHolderMatch) {
      return acctHolderMatch[1].trim();
    }
    return bankMatch[1].trim();
  }
  // If Location: "Central Interstate Bus Terminal" -> "Central Bus Terminal"
  if (name.includes('Central Interstate Bus Terminal')) {
    return 'Bus Terminal';
  }
  if (name.length > maxChars) {
    const parts = name.split(' ');
    if (parts.length > 1 && node.type === 'PERSON') {
      return `${parts[0]} ${parts[1][0]}.`;
    }
    return `${name.slice(0, maxChars - 1)}…`;
  }
  return name;
}

export function formatNodeSubLabel(node: NexusNode): string {
  let name = node.name || node.id;
  if (!name || name === node.id) {
    const canonical = getCanonicalEntity(node.id);
    if (canonical) {
      name = canonical.name;
    }
  }
  // For phone: show the formatted number
  const numMatch = name.match(/^(?:\+91\s*)?([0-9-]{10,14})/);
  if (numMatch && (node.type === 'PHONE' || node.id?.startsWith('PH'))) {
    return numMatch[1];
  }
  // For vehicle / case: show plate or docket in brackets
  const regMatch = name.match(/\(([^)]+)\)/);
  if (regMatch && (node.type === 'VEHICLE' || node.type === 'CASE' || node.type === 'BANK ACCOUNT' || node.id?.startsWith('VH') || node.id?.startsWith('CASE') || node.id?.startsWith('ACC'))) {
    return regMatch[1];
  }
  if (node.type === 'PERSON' && node.subtitle && node.subtitle !== 'PERSON') {
    return node.subtitle;
  }
  const canonical = getCanonicalEntity(node.id);
  if (canonical?.subtitle && canonical.subtitle !== canonical.type) {
    return canonical.subtitle;
  }
  return node.type;
}

const ALL_RELATION_CATEGORIES = [
  'COMMUNICATION',
  'VEHICLE',
  'LOCATION',
  'FINANCIAL',
  'CASE',
  'ORGANIZATION',
] as const;

export const CommandCenter: React.FC<CommandCenterProps> = ({
  onNavigate,
  onSelectEntity,
}) => {
  const {
    nodes,
    edges,
    evidence,
    suggestions,
    stats: intelStats,
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
  const allStats = intelStats.length > 0 ? intelStats : NEXUS_STATS;
  const allHiddenPath = hiddenPath.length > 0 ? hiddenPath : NEXUS_HIDDEN_PATH;

  // Navigation & Sub-view State
  const [activeTab, setActiveTab] = useState<GraphViewTab>('CANVAS');
  const [showSuggestions, setShowSuggestions] = useState<boolean>(true);
  const [selectedId, setSelectedId] = useState<string>(allNodes[0]?.id || 'P003');

  // Find matching hidden relationship for currently selected entity
  const matchedRelForSelected = useMemo(() => {
    if (!selectedId) return null;
    return hiddenRelationships.find(
      (r) => r.sourceNodeId === selectedId || r.targetNodeId === selectedId || (r.pathNodeIds && r.pathNodeIds.includes(selectedId)) || r.sourceId === selectedId || r.targetId === selectedId
    ) || null;
  }, [selectedId, hiddenRelationships]);

  const leadRel = useMemo(() => {
    if (matchedRelForSelected) return matchedRelForSelected;
    if (activeHiddenRelationship && (
      activeHiddenRelationship.sourceNodeId === selectedId ||
      activeHiddenRelationship.targetNodeId === selectedId ||
      activeHiddenRelationship.sourceId === selectedId ||
      activeHiddenRelationship.targetId === selectedId ||
      (activeHiddenRelationship.pathNodeIds && activeHiddenRelationship.pathNodeIds.includes(selectedId))
    )) {
      return activeHiddenRelationship;
    }
    const anyMatching = hiddenRelationships.find(
      (r) => r.sourceId === selectedId || r.targetId === selectedId || (r.pathNodeIds && r.pathNodeIds.includes(selectedId))
    );
    return anyMatching || activeHiddenRelationship || hiddenRelationships[0] || null;
  }, [matchedRelForSelected, activeHiddenRelationship, hiddenRelationships, selectedId]);

  const effectiveLeadPath = useMemo(() => {
    if (leadRel?.pathNodeIds && leadRel.pathNodeIds.length > 0) {
      return leadRel.pathNodeIds;
    }
    return allHiddenPath;
  }, [leadRel, allHiddenPath]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeEntityTypes, setActiveEntityTypes] = useState<string[]>([
    'PERSON', 'PHONE', 'VEHICLE', 'LOCATION', 'ORGANIZATION', 'CASE', 'BANK ACCOUNT'
  ]);
  const [activeRelationCategories, setActiveRelationCategories] = useState<string[]>([
    'COMMUNICATION', 'VEHICLE', 'LOCATION', 'FINANCIAL', 'CASE', 'ORGANIZATION'
  ]);
  const [selectedCase, setSelectedCase] = useState<string>('ALL');
  const [selectedSource, setSelectedSource] = useState<string>('ALL');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('ALL');
  const [maxDepth, setMaxDepth] = useState<number>(5);
  const [minConfidence, setMinConfidence] = useState<number>(0.5);

  // Entity Display Limit: only show top important entities on canvas (default 15)
  const [entityLimit, setEntityLimit] = useState<number | 'ALL'>(15);

  // Dropdown Open States
  const [openDropdown, setOpenDropdown] = useState<'CASE' | 'SOURCE' | 'DATE' | 'DEPTH' | 'LIMIT' | null>(null);

  // Graph Animation States
  const [pathProgress, setPathProgress] = useState<number>(effectiveLeadPath.length || 5);

  // Synchronize pathProgress whenever effectiveLeadPath updates
  useEffect(() => {
    if (effectiveLeadPath && effectiveLeadPath.length > 0) {
      setPathProgress(effectiveLeadPath.length);
    }
  }, [effectiveLeadPath]);

  const [analysisStep, setAnalysisStep] = useState<number>(0);
  const [activeModalRecordId, setActiveModalRecordId] = useState<string | null>(null);
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

  const [commandInput, setCommandInput] = useState<string>('');
  const [activeSuggestionId, setActiveSuggestionId] = useState<string | null>(null);

  const [radialNodesCount, setRadialNodesCount] = useState<number>(15);

  // Selected Node Entity - ensure valid
  const effectiveSelectedId = useMemo(() => {
    if (allNodes.some((n) => n.id === selectedId)) return selectedId;
    return allNodes[0]?.id || 'P-014';
  }, [allNodes, selectedId]);

  // Main Lead root entity for radial orbit anchoring
  const mainLeadEntityId = useMemo(() => {
    if (leadRel) {
      return (
        leadRel.sourceNodeId ||
        leadRel.sourceId ||
        leadRel.pathNodeIds?.[0] ||
        effectiveSelectedId
      );
    }
    if (effectiveLeadPath && effectiveLeadPath.length > 0) {
      return effectiveLeadPath[0];
    }
    return effectiveSelectedId;
  }, [leadRel, effectiveLeadPath, effectiveSelectedId]);

  const selectedEntity = useMemo(() => {
    return allNodes.find((e) => e.id === effectiveSelectedId) || allNodes[0];
  }, [allNodes, effectiveSelectedId]);

  // Reactive Visible Edges based on all active filters
  const visibleEdges = useMemo(() => {
    return allEdges.filter((edge) => {
      // 1. Relationship Category Filter
      if (!activeRelationCategories.includes(edge.category)) return false;

      // 2. Case Docket Filter
      if (selectedCase !== 'ALL' && edge.caseId !== selectedCase) return false;

      // 3. Source Type Filter
      if (selectedSource !== 'ALL' && edge.sourceType !== selectedSource) return false;

      // 4. Confidence Threshold
      if (edge.confidence < minConfidence) return false;

      // 5. Source and Target Entity Types Filter
      const sNode = allNodes.find((n) => n.id === edge.source);
      const tNode = allNodes.find((n) => n.id === edge.target);
      if (!sNode || !tNode) return false;
      if (!activeEntityTypes.includes(sNode.type) || !activeEntityTypes.includes(tNode.type)) return false;

      return true;
    });
  }, [allEdges, allNodes, activeRelationCategories, selectedCase, selectedSource, minConfidence, activeEntityTypes]);

  // Filtered Nodes for search & entity list
  const filteredNodes = useMemo(() => {
    return allNodes.filter((node) => {
      const typeMatch = activeEntityTypes.includes(node.type);
      if (!typeMatch) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const displayName = getEntityDisplayName(node).toLowerCase();
      const subLabel = formatNodeSubLabel(node).toLowerCase();
      return (
        displayName.includes(q) ||
        subLabel.includes(q) ||
        node.name.toLowerCase().includes(q) ||
        node.id.toLowerCase().includes(q) ||
        node.type.toLowerCase().includes(q)
      );
    });
  }, [allNodes, activeEntityTypes, searchQuery]);

  // 1-Hop direct neighbors of selected / inspected entity
  const selectedNeighborIds = useMemo(() => {
    const focusId = selectedId || effectiveSelectedId;
    const neighbors = new Set<string>();
    allEdges.forEach((e) => {
      if (e.source === focusId) neighbors.add(e.target);
      if (e.target === focusId) neighbors.add(e.source);
    });
    return neighbors;
  }, [allEdges, selectedId, effectiveSelectedId]);

  // Rank filteredNodes by importance: Selected > In Active Hidden Path > 1-Hop Neighbors > Search Match > Connections > Risk
  const rankedNodes = useMemo(() => {
    const pathSet = new Set(effectiveLeadPath);
    const focusId = selectedId || effectiveSelectedId;
    const q = searchQuery.trim().toLowerCase();

    return [...filteredNodes].sort((a, b) => {
      // 1. Primary: Selected entity always guaranteed #1 rank
      const aFocus = (a.id === focusId) ? 1 : 0;
      const bFocus = (b.id === focusId) ? 1 : 0;
      if (aFocus !== bFocus) return bFocus - aFocus;

      // 2. Secondary: In active hidden path / investigative lead (prioritized over generic 1-hop neighbors)
      const aPath = pathSet.has(a.id) ? 1 : 0;
      const bPath = pathSet.has(b.id) ? 1 : 0;
      if (aPath !== bPath) return bPath - aPath;

      // 3. Tertiary: 1-hop neighbor of focused entity
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
  }, [filteredNodes, selectedId, effectiveSelectedId, selectedNeighborIds, searchQuery, effectiveLeadPath]);

  // Slice to active entity limit (default 15), but ALWAYS guarantee that all active path nodes are displayed
  const displayedNodes = useMemo(() => {
    const base = entityLimit === 'ALL' ? [...rankedNodes] : rankedNodes.slice(0, entityLimit);
    const existingIds = new Set(base.map((n) => n.id));

    // Ensure all nodes in effectiveLeadPath are displayed
    effectiveLeadPath.forEach((id: string) => {
      if (!existingIds.has(id)) {
        const found = allNodes.find((n) => n.id === id);
        if (found) {
          base.push(found);
          existingIds.add(id);
        }
      }
    });
    return base;
  }, [rankedNodes, entityLimit, effectiveLeadPath, allNodes]);

  const displayedNodeIds = useMemo(() => {
    return new Set(displayedNodes.map((n) => n.id));
  }, [displayedNodes]);

  // Consecutive path edges set for precision active edge highlighting
  const consecutivePathEdges = useMemo(() => {
    const set = new Set<string>();
    for (let i = 0; i < effectiveLeadPath.length - 1; i++) {
      const u = effectiveLeadPath[i];
      const v = effectiveLeadPath[i + 1];
      set.add(`${u}__${v}`);
      set.add(`${v}__${u}`);
    }
    return set;
  }, [effectiveLeadPath]);

  // Canvas Edges: Interconnect nodes that are both currently displayed, including all path edges of the active hidden relationship
  const canvasEdges = useMemo(() => {
    const existingPairs = new Set<string>();
    const edges = visibleEdges.filter((edge) => {
      existingPairs.add(`${edge.source}__${edge.target}`);
      existingPairs.add(`${edge.target}__${edge.source}`);
      return displayedNodeIds.has(edge.source) && displayedNodeIds.has(edge.target);
    });

    // Ensure all consecutive hops along the tracked hidden path are explicitly present in canvasEdges
    const activePath = effectiveLeadPath || [];
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
            caseId: leadRel?.caseDocket || 'CASE01',
            sourceType: 'intelligence_provenance',
            date: '2026-02-15',
            active: true
          } as any);
        }
      } else {
        const match = edges.find(
          (e) => (e.source === u && e.target === v) || (e.source === v && e.target === u)
        );
        if (match) {
          match.active = true;
        }
      }
    }

    // Ensure the central selected node is physically connected to at least one visible node
    const focusId = effectiveSelectedId;
    const hasFocusEdge = edges.some(e => e.source === focusId || e.target === focusId);
    if (!hasFocusEdge && displayedNodeIds.has(focusId)) {
      const fallbackEdge = allEdges.find(
        (e) => (e.source === focusId && displayedNodeIds.has(e.target)) ||
               (e.target === focusId && displayedNodeIds.has(e.source))
      );
      if (fallbackEdge) {
        edges.push({ ...fallbackEdge, active: true });
      }
    }

    return edges;
  }, [visibleEdges, displayedNodeIds, effectiveLeadPath, allEdges, leadRel, effectiveSelectedId]);

  // Dynamic coordinate space and concentric layout for displayed nodes
  const { nodeLayout, canvasDimension } = useMemo(() => {
    const count = displayedNodes.length;
    let dim = 100;
    if (count > 50) dim = 300;
    else if (count > 25) dim = 220;
    else if (count > 12) dim = 160;

    const coords = new Map<string, { x: number; y: number }>();
    if (count === 0) return { nodeLayout: coords, canvasDimension: dim };

    // For default 9 nodes with no custom dataset, keep handcrafted positions
    if (nodes.length === 0 && allNodes.length <= 9) {
      displayedNodes.forEach((n) => coords.set(n.id, { x: n.x, y: n.y }));
      return { nodeLayout: coords, canvasDimension: 100 };
    }

    const centerPos = dim / 2;
    // Central focus node: effectiveSelectedId if present in displayedNodes, otherwise #1 ranked node
    const center = displayedNodes.find((n) => n.id === effectiveSelectedId) || displayedNodes[0];
    coords.set(center.id, { x: centerPos, y: centerPos });

    const others = displayedNodes.filter((n) => n.id !== center.id);
    const pathSet = new Set(effectiveLeadPath);

    // CRUCIAL: Sort path nodes in others strictly by their index in effectiveLeadPath!
    const pathNodesInOthers = others
      .filter((n) => pathSet.has(n.id))
      .sort((a, b) => effectiveLeadPath.indexOf(a.id) - effectiveLeadPath.indexOf(b.id));

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
          x: Math.round((centerPos + pathRadius * Math.cos(angle)) * 10) / 10,
          y: Math.round((centerPos + pathRadius * Math.sin(angle)) * 10) / 10,
        });
      });
    }

    // Distribute remaining non-path neighbors across lower and outer rings away from the upper path arc
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
            x: Math.round((centerPos + radius * Math.cos(angle)) * 10) / 10,
            y: Math.round((centerPos + radius * Math.sin(angle)) * 10) / 10,
          });
        });
        if (allocated >= remCount) break;
      }
    }

    return { nodeLayout: coords, canvasDimension: dim };
  }, [displayedNodes, nodes.length, allNodes.length, effectiveSelectedId, effectiveLeadPath]);

  // Dynamic visual sizing to prevent text & circle overlapping
  const densityScale = useMemo(() => {
    const count = displayedNodes.length;
    if (count <= 10) {
      return { nodeR: 4.2, activeR: 5.6, strokeW: 0.35, labelY: 8.5, fontSize: 2.1, maxChars: 18, showType: true, badgeScale: 1.0 };
    }
    if (count <= 25) {
      return { nodeR: 3.4, activeR: 4.6, strokeW: 0.30, labelY: 7.2, fontSize: 1.8, maxChars: 14, showType: true, badgeScale: 0.9 };
    }
    if (count <= 50) {
      return { nodeR: 2.6, activeR: 3.6, strokeW: 0.25, labelY: 5.8, fontSize: 1.4, maxChars: 11, showType: false, badgeScale: 0.75 };
    }
    return { nodeR: 2.0, activeR: 2.8, strokeW: 0.20, labelY: 4.6, fontSize: 1.15, maxChars: 9, showType: false, badgeScale: 0.65 };
  }, [displayedNodes.length]);

  // Nodes currently connected by visible edges or searched
  const visibleNodeIds = useMemo(() => {
    const ids = new Set<string>();
    visibleEdges.forEach((e) => {
      ids.add(e.source);
      ids.add(e.target);
    });
    filteredNodes.forEach((n) => ids.add(n.id));
    return ids;
  }, [visibleEdges, filteredNodes]);

  const pathNodeIds = useMemo(() => {
    return new Set(effectiveLeadPath.slice(0, pathProgress));
  }, [effectiveLeadPath, pathProgress]);

  const activeModalRecord = useMemo(() => {
    return allEvidence.find((e) => e.id === activeModalRecordId) || null;
  }, [allEvidence, activeModalRecordId]);

  // Dynamic investigation query suggestions derived from active dataset
  const dataDrivenSuggestions = useMemo(() => {
    const list: { label: string; query: string; targetId: string; categories?: string[]; tone: 'signal' | 'safe' | 'azure' | 'warn' }[] = [];

    // 1. POI multi-hop bridge
    const p3 = allNodes.find((n) => n.id === 'P003' || n.name.toLowerCase().includes('garima'));
    const p20 = allNodes.find((n) => n.id === 'P020' || n.name.toLowerCase().includes('shailesh'));
    if (p3) {
      const p3Name = getEntityDisplayName(p3);
      const p20Name = p20 ? getEntityDisplayName(p20) : '';
      list.push({
        label: p20 ? `Trace ${p3Name.split(' ')[0]} ↔ ${p20Name.split(' ')[0]} 5-hop bridge` : `Trace ${p3Name} Hidden Links`,
        query: `Trace multi-hop path from ${p3Name} to ${p20 ? p20Name : 'syndicate'}`,
        targetId: p3.id,
        categories: ['COMMUNICATION', 'VEHICLE'],
        tone: 'signal',
      });
    }

    // 2. Vehicle nexus to Case
    const vh = allNodes.find((n) => n.id === 'VH02' || n.name.includes('UP16') || n.type === 'VEHICLE');
    const p5 = allNodes.find((n) => n.id === 'P005' || n.name.toLowerCase().includes('rashi'));
    if (vh) {
      const vhName = getEntityDisplayName(vh);
      list.push({
        label: `Vehicle ${vhName} Case Nexus`,
        query: `Investigate vehicle ${vhName} links to Case 04`,
        targetId: p5 ? p5.id : vh.id,
        categories: ['VEHICLE', 'CASE'],
        tone: 'safe',
      });
    }

    // 3. Banking wire bridge
    const acc = allNodes.find((n) => n.id === 'ACC05' || n.type === 'BANK ACCOUNT');
    const p7 = allNodes.find((n) => n.id === 'P007' || n.name.toLowerCase().includes('monika'));
    if (acc) {
      const accName = getEntityDisplayName(acc);
      list.push({
        label: `Wire Transfers: ${accName.split('(')[0].trim()}`,
        query: `Trace financial fund flows through ${accName}`,
        targetId: p7 ? p7.id : acc.id,
        categories: ['FINANCIAL'],
        tone: 'azure',
      });
    }

    // 4. Location rendezvous
    const loc = allNodes.find((n) => n.id === 'LOC09' || n.type === 'LOCATION');
    const p15 = allNodes.find((n) => n.id === 'P015' || n.name.toLowerCase().includes('sonali'));
    if (loc) {
      const locName = getEntityDisplayName(loc);
      list.push({
        label: `Co-location at ${locName.length > 20 ? locName.slice(0, 18) + '…' : locName}`,
        query: `Analyze physical rendezvous at location ${locName}`,
        targetId: p15 ? p15.id : loc.id,
        categories: ['LOCATION'],
        tone: 'warn',
      });
    }

    // Fallback: If custom dataset with other entities
    if (list.length < 3 && allNodes.length >= 2) {
      const topEntities = [...allNodes].sort((a, b) => b.connections - a.connections).slice(0, 3);
      topEntities.forEach((ent, i) => {
        const entName = getEntityDisplayName(ent);
        list.push({
          label: `Investigate Hub: ${entName}`,
          query: `Focus entity hub ${entName}`,
          targetId: ent.id,
          tone: i === 0 ? 'signal' : i === 1 ? 'safe' : 'azure',
        });
      });
    }

    return list.slice(0, 4);
  }, [allNodes]);

  // Stepper Animation
  const runAnalysis = () => {
    setAnalysisStep(1);
    setPathProgress(1);
    const stepsCount = Math.max(2, effectiveLeadPath.length);
    Array.from({ length: stepsCount - 1 }).forEach((_, idx) => {
      const step = idx + 2;
      window.setTimeout(() => {
        setAnalysisStep(Math.min(5, step));
        setPathProgress(step);
      }, 650 * (idx + 1));
    });
  };

  const [inspectingEntityId, setInspectingEntityId] = useState<string | null>(null);

  const handleEntitySelect = async (entityId: string) => {
    setSelectedId(entityId);
    setInspectingEntityId(entityId);

    // Correlate with known hidden relationships or dynamically track from intelligence engine
    if (trackEntityHiddenRelationship) {
      try {
        const activeRel = await trackEntityHiddenRelationship(entityId);
        if (activeRel && activeRel.pathNodeIds) {
          setPathProgress(activeRel.pathNodeIds.length);
        }
      } catch (err) {
        console.warn('Error tracking entity hidden relationship:', err);
      }
    } else {
      const matchingRel = hiddenRelationships.find((r) =>
        r.sourceNodeId === entityId ||
        r.targetNodeId === entityId ||
        r.sourceId === entityId ||
        r.targetId === entityId ||
        (r.pathNodeIds && r.pathNodeIds.includes(entityId))
      );

      if (matchingRel) {
        setActiveHiddenRelationshipId(matchingRel.id);
        setPathProgress(matchingRel.pathNodeIds.length);
      }
    }

    if (onSelectEntity) {
      onSelectEntity(entityId);
    }
  };

  // Reset all filters to full overview
  const resetAllFilters = () => {
    setActiveRelationCategories([
      'COMMUNICATION', 'VEHICLE', 'LOCATION', 'FINANCIAL', 'CASE', 'ORGANIZATION'
    ]);
    setActiveEntityTypes([
      'PERSON', 'PHONE', 'VEHICLE', 'LOCATION', 'ORGANIZATION', 'CASE', 'BANK ACCOUNT'
    ]);
    setSelectedCase('ALL');
    setSelectedSource('ALL');
    setSelectedDateRange('ALL');
    setMaxDepth(5);
    setMinConfidence(0.5);
    setEntityLimit(15);
    setSearchQuery('');
    setCommandInput('');
    setActiveSuggestionId(null);
    setSelectedId(allNodes[0]?.id || 'P-014');
    setInspectingEntityId(null);
  };

  // Apply a smart suggestion
  const handleApplySuggestion = (suggestion: NexusSuggestion) => {
    setActiveSuggestionId(suggestion.id);
    if (suggestion.targetNodeId) {
      setSelectedId(suggestion.targetNodeId);
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

  const analysisStepLabels = [
    '',
    'ANALYZING NETWORK',
    'RESOLVING ENTITY CONNECTIONS',
    'TRACING MULTI-HOP RELATIONSHIPS',
    'CROSS-REFERENCING EVIDENCE',
    'POTENTIAL RELATIONSHIP DETECTED',
  ];

  return (
    <div className="p-5 xl:p-6 grid grid-cols-12 gap-4 xl:gap-5 font-body">
      {/* 6 Top KPI Metric Cards */}
      <section className="col-span-12 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 xl:gap-4">
        {allStats.map((stat) => (
          <div
            key={stat.label}
            className={`glass rounded-lg p-4 ${stat.tone === 'warn' ? 'border-warn/30' : ''}`}
          >
            <div
              className={`text-[10px] tracking-[0.2em] font-mono ${
                stat.tone === 'warn' ? 'text-warn/80' : 'text-muted-foreground'
              }`}
            >
              {stat.label}
            </div>
            <div
              className={`font-display text-3xl font-semibold mt-1 ${
                stat.tone === 'warn'
                  ? 'text-warn'
                  : stat.tone === 'signal'
                  ? 'text-signal'
                  : 'text-foreground'
              }`}
            >
              {stat.value}
            </div>
            <div
              className={`text-[11px] mt-1 ${
                stat.tone === 'safe' ? 'text-safe' : 'text-muted-foreground'
              }`}
            >
              {stat.hint}
            </div>
          </div>
        ))}
      </section>

      {/* Main Knowledge Graph Section (Left 8 Columns) */}
      <section className="col-span-12 xl:col-span-8 glass rounded-xl p-4 relative overflow-hidden flex flex-col gap-3 min-h-[560px]">
        {/* Top Header with Multi-Graph Sub-View Switcher & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div>
            <div className="text-[10px] tracking-[0.22em] font-mono text-signal/70">
              KNOWLEDGE GRAPH
            </div>
            <div className="font-display text-sm font-medium text-foreground flex flex-wrap items-center gap-2">
              <span>Network Overview</span>
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
            {/* Entity Density Limit Filter Segmented Control */}
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

            {/* View Switcher Tabs: Canvas, Radial, Analytics */}
            <div className="flex rounded-md bg-void/80 border border-signal/20 p-0.5">
              <button
                onClick={() => setActiveTab('CANVAS')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono transition ${
                  activeTab === 'CANVAS'
                    ? 'bg-signal/20 text-signal border border-signal/30'
                    : 'text-muted-foreground hover:text-foreground border border-transparent'
                }`}
                title="Full 2D Topology Graph with Animated Threads"
              >
                <Network className="size-3.5" />
                <span className="hidden sm:inline">Canvas</span>
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
                <span className="hidden sm:inline">Radial Orbit</span>
              </button>
              <button
                onClick={() => setActiveTab('ANALYTICS')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono transition ${
                  activeTab === 'ANALYTICS'
                    ? 'bg-signal/20 text-signal border border-signal/30'
                    : 'text-muted-foreground hover:text-foreground border border-transparent'
                }`}
                title="Network Degree Centrality & Timeline Graphs"
              >
                <BarChart3 className="size-3.5" />
                <span className="hidden sm:inline">Analytics</span>
              </button>
            </div>

            {/* Find Hidden Relationships Action Button */}
            <button
              onClick={runAnalysis}
              disabled={analysisStep > 0 && analysisStep < 5}
              className="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium bg-signal/15 border border-signal/40 text-signal hover:bg-signal/25 transition disabled:opacity-50"
            >
              <span>{analysisStep > 0 && analysisStep < 5 ? 'Analyzing network…' : 'Find Hidden Relationships'}</span>
              <Sparkles className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Dynamic Graph Canvas or Sub-Graph View */}
        <div 
          className="relative h-[530px] rounded-lg bg-void/60 border border-signal/10 overflow-hidden grid-bg"
          onWheel={activeTab === 'CANVAS' ? handleWheel : undefined}
        >
          {activeTab === 'CANVAS' && (
            <>
              <div className="absolute inset-0 graph-vignette pointer-events-none" />

              <div className="absolute left-3 top-3 z-10 font-mono text-[10px] text-muted-foreground">
                {analysisStep ? analysisStepLabels[analysisStep] : 'GRAPH READY · SELECT AN ENTITY TO FOCUS'}
              </div>

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
                aria-label="Interactive entity relationship graph"
              >
                {/* Glow Filters for Animated Threads & Photons */}
                <defs>
                  <filter id="thread-glow" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="0.6" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="packet-glow" x="-60%" y="-60%" width="220%" height="220%">
                    <feGaussianBlur stdDeviation="1.0" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Graph Edges with Animated Connecting Threads (Filtered to visible displayed nodes) */}
                {canvasEdges.map((edge, idx) => {
                  const srcNode = allNodes.find((n) => n.id === edge.source);
                  const tgtNode = allNodes.find((n) => n.id === edge.target);
                  const srcPos = nodeLayout.get(edge.source) || (srcNode ? { x: srcNode.x, y: srcNode.y } : null);
                  const tgtPos = nodeLayout.get(edge.target) || (tgtNode ? { x: tgtNode.x, y: tgtNode.y } : null);
                  if (!srcPos || !tgtPos) return null;
                  const isConsecutive = consecutivePathEdges.has(`${edge.source}__${edge.target}`);
                  const isPathActive = isConsecutive && pathNodeIds.has(edge.source) && pathNodeIds.has(edge.target);

                  // Ensure photon travels in the forward direction of effectiveLeadPath
                  const sIdx = effectiveLeadPath.indexOf(edge.source);
                  const tIdx = effectiveLeadPath.indexOf(edge.target);
                  const [fromPos, toPos] = (sIdx !== -1 && tIdx !== -1 && sIdx > tIdx)
                    ? [tgtPos, srcPos]
                    : [srcPos, tgtPos];

                  return (
                    <g
                      key={edge.id}
                      className={isPathActive ? 'graph-edge graph-edge-active' : 'graph-edge'}
                      onClick={() => setActiveModalRecordId(edge.recordId)}
                      style={{ outline: 'none' }}
                    >
                      {/* Structural Base Thread */}
                      <line
                        x1={srcPos.x}
                        y1={srcPos.y}
                        x2={tgtPos.x}
                        y2={tgtPos.y}
                        className="thread-base"
                        style={{ strokeWidth: `${densityScale.strokeW}px` }}
                      />
                      
                      {/* Flowing Animated Dash Thread */}
                      <line
                        x1={srcPos.x}
                        y1={srcPos.y}
                        x2={tgtPos.x}
                        y2={tgtPos.y}
                        className="thread-pulse"
                        style={{ strokeWidth: `${densityScale.strokeW * 1.3}px` }}
                      />

                      {/* Traveling Luminous Photon Particle ONLY on actively traced path edges */}
                      {isPathActive && (
                        <circle
                          r={densityScale.nodeR * 0.25}
                          fill="#00f0ff"
                          filter="url(#packet-glow)"
                          className="photon-particle"
                        >
                          <animateMotion
                            dur="1.8s"
                            repeatCount="indefinite"
                            path={`M ${fromPos.x} ${fromPos.y} L ${toPos.x} ${toPos.y}`}
                          />
                        </circle>
                      )}

                      {displayedNodes.length <= 25 && (
                        <text
                          x={(srcPos.x + tgtPos.x) / 2}
                          y={(srcPos.y + tgtPos.y) / 2 - 1}
                          className="edge-label"
                          style={{ fontSize: `${densityScale.fontSize * 0.7}px` }}
                        >
                          {edge.label}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Graph Nodes - Prioritized displayedNodes only */}
                {displayedNodes.map((node) => {
                  const pos = nodeLayout.get(node.id) || { x: node.x, y: node.y };
                  const isFocused = node.id === effectiveSelectedId;
                  const isPath = pathNodeIds.has(node.id);
                  const isVisible = visibleNodeIds.has(node.id);
                  const isActive = isFocused || node.id === inspectingEntityId;

                  return (
                    <g
                      key={node.id}
                      className={`graph-node ${isActive ? 'graph-node-active graph-node-focused' : ''} ${
                        isPath ? 'graph-node-path' : ''
                      } ${!isVisible ? 'opacity-20' : ''}`}
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
                          cx={densityScale.nodeR * 0.8}
                          cy={-densityScale.nodeR * 0.8}
                          r={densityScale.nodeR * 0.3}
                          fill="#00f0ff"
                          filter="url(#thread-glow)"
                          className="blink"
                        />
                      )}

                      {/* Dynamic Scaled Node Name */}
                      <text
                        y={densityScale.labelY}
                        className={`node-name ${isActive ? 'font-semibold' : ''}`}
                        style={{
                          fill: isActive ? '#ffffff' : undefined,
                          fontSize: `${densityScale.fontSize}px`
                        }}
                      >
                        {formatNodeName(node, densityScale.maxChars)}
                      </text>

                      {/* Active Status Badge Pill vs Regular Type Label */}
                      {isActive ? (
                        <g transform={`translate(0, ${densityScale.labelY + densityScale.fontSize * 1.6})`}>
                          <rect
                            x={-7 * densityScale.badgeScale}
                            y={-1.8 * densityScale.badgeScale}
                            width={14 * densityScale.badgeScale}
                            height={3.2 * densityScale.badgeScale}
                            rx={1.6 * densityScale.badgeScale}
                            fill="rgba(0, 240, 255, 0.22)"
                            stroke="rgba(0, 240, 255, 0.75)"
                            strokeWidth={0.25 * densityScale.badgeScale}
                          />
                          <text
                            y={0.3 * densityScale.badgeScale}
                            fill="#00f0ff"
                            fontSize={1.3 * densityScale.badgeScale}
                            textAnchor="middle"
                            fontFamily="var(--font-mono)"
                            fontWeight="bold"
                            letterSpacing="0.05em"
                          >
                            ● ACTIVE
                          </text>
                        </g>
                      ) : densityScale.showType ? (
                        <text
                          y={densityScale.labelY + densityScale.fontSize * 1.6}
                          className="node-type"
                          style={{ fontSize: `${densityScale.fontSize * 0.75}px` }}
                        >
                          {formatNodeSubLabel(node)}
                        </text>
                      ) : null}
                    </g>
                  );
                })}
              </svg>

              {/* Zoom Controls (Bottom Left) */}
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

              {/* Zoom Indicator (Bottom Right) */}
              <div className="absolute bottom-3 right-3 font-mono text-[10px] text-muted-foreground border border-signal/15 bg-panel/80 rounded px-2.5 py-1 z-10 shadow-md backdrop-blur-md flex items-center gap-1.5">
                <span className="text-signal font-semibold">{Math.round(zoom * 100)}%</span>
                <span>·</span>
                <span>drag to pan</span>
              </div>

              {/* Relationship Detected Alert Banner */}
              {analysisStep === 5 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-warn/30 bg-warn/10 px-4 py-2 text-[10px] font-mono tracking-wide text-warn z-10 animate-in fade-in zoom-in-95">
                  POTENTIAL RELATIONSHIP DETECTED · {Math.max(1, effectiveLeadPath.length - 1)} HOPS · HUMAN VERIFICATION REQUIRED
                </div>
              )}
            </>
          )}

          {activeTab === 'RADIAL' && (
            <EgoCentricRadialGraph
              centerEntityId={mainLeadEntityId}
              selectedEntityId={inspectingEntityId || effectiveSelectedId}
              onSelectEntity={handleEntitySelect}
              onSelectEdgeRecord={(recId) => setActiveModalRecordId(recId)}
              entityLimit={entityLimit}
              leadPathNodeIds={effectiveLeadPath}
              onNodesCountChange={setRadialNodesCount}
            />
          )}

          {activeTab === 'ANALYTICS' && (
            <div className="p-4 h-full overflow-y-auto">
              <NetworkAnalyticsPanel
                selectedEntityId={effectiveSelectedId}
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
                  setSelectedId(id);
                  setActiveTab('RADIAL');
                }}
                onOpenEvidenceModal={(recId) => setActiveModalRecordId(recId)}
                onNavigateToProfile={() => onNavigate('ENTITIES')}
              />
            </div>
          )}
        </div>
      </section>

      {/* Right Column: Entity Focus & Potential Investigative Lead */}
      <aside className="col-span-12 xl:col-span-4 flex flex-col gap-4">
        {/* Entity Focus Card */}
        <div className="glass rounded-xl p-4 border-signal/20">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] tracking-[0.22em] font-mono text-signal/70">
              ENTITY FOCUS
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">{selectedEntity ? formatNodeSubLabel(selectedEntity) : ''}</span>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`entity-icon entity-icon-${
                NEXUS_ENTITY_TONES[selectedEntity?.type || 'PERSON']
              }`}
            >
              {NEXUS_ENTITY_ICONS[selectedEntity?.type || 'PERSON']}
            </div>
            <div>
              <div className="font-display text-base font-semibold text-foreground">
                {getEntityDisplayName(selectedEntity)}
              </div>
              <div className="text-[10px] font-mono text-muted-foreground">
                {selectedEntity?.type} · {selectedEntity?.subtitle}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4 text-[11px]">
            <div>
              <div className="font-mono text-[10px] text-muted-foreground">CONNECTIONS</div>
              <div className="text-[11px] mt-0.5 text-foreground">{selectedEntity?.connections ?? 0}</div>
            </div>
            <div>
              <div className="font-mono text-[10px] text-muted-foreground">RELATED CASES</div>
              <div className="text-[11px] mt-0.5 text-foreground">{selectedEntity?.cases ?? 0}</div>
            </div>
            <div>
              <div className="font-mono text-[10px] text-muted-foreground">IDENTIFIER</div>
              <div className="text-[11px] mt-0.5 text-foreground">{selectedEntity ? formatNodeSubLabel(selectedEntity) : '—'}</div>
            </div>
            <div>
              <div className="font-mono text-[10px] text-muted-foreground">STATUS</div>
              <div className="text-[11px] mt-0.5 text-foreground">RESOLVED</div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-signal/15 flex items-center justify-between gap-2">
            <button
              onClick={() => setInspectingEntityId(selectedEntity?.id || null)}
              className="inline-flex items-center gap-1 text-xs text-signal hover:underline font-mono transition"
              title="Open detail card for this entity"
            >
              <span>Inspect Detail Card</span>
            </button>
            <button
              onClick={() => onNavigate('ENTITIES')}
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition"
            >
              <span>Full profile</span>
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Potential Investigative Lead Card */}
        <div className="glass rounded-xl p-4 border-warn/25 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-warn blink" />
                <div className="text-[10px] tracking-[0.22em] font-mono text-warn font-bold">
                  POTENTIAL INVESTIGATIVE LEAD
                </div>
              </div>
              {leadRel && (
                <span className="px-2 py-0.5 rounded bg-warn/15 text-warn font-mono text-[9px] font-bold">
                  {leadRel.categoryTitle}
                </span>
              )}
            </div>

            <div className="font-display text-base font-semibold text-foreground">
              {leadRel ? (
                <span>
                  {getEntityDisplayName(leadRel.sourceNodeName || leadRel.sourceId)} <span className="text-warn">↔</span> {getEntityDisplayName(leadRel.targetNodeName || leadRel.targetId)}
                </span>
              ) : (
                <span>
                  {getEntityDisplayName(allNodes.find((n) => n.id === effectiveLeadPath[0]) || effectiveLeadPath[0] || allNodes[0] || 'Primary Subject')}{' '}
                  <span className="text-warn">↔</span>{' '}
                  {getEntityDisplayName(allNodes.find((n) => n.id === effectiveLeadPath[effectiveLeadPath.length - 1]) || effectiveLeadPath[effectiveLeadPath.length - 1] || allNodes[1] || 'Target Subject')}
                </span>
              )}
            </div>
            
            <div className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
              {leadRel?.discoverySummary || `Indirect multi-hop relationship · ${Math.max(1, effectiveLeadPath.length - 1)} hops`}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div>
                <div className="font-mono text-[10px] text-muted-foreground">CONFIDENCE SCORE</div>
                <div className="text-[11px] mt-0.5 text-signal font-mono font-semibold">
                  {((leadRel?.confidence || allSuggestions[0]?.confidence || 0.88) * 100).toFixed(0)}%
                </div>
              </div>
              <div>
                <div className="font-mono text-[10px] text-muted-foreground">SUPPORTING RECORDS</div>
                <div className="text-[11px] mt-0.5 text-foreground">{leadRel?.corroboratingEvidenceCount || allEvidence.length}</div>
              </div>
              <div>
                <div className="font-mono text-[10px] text-muted-foreground">HOPS IN CONDUIT</div>
                <div className="text-[11px] mt-0.5 text-foreground">{leadRel?.hopCount || Math.max(1, effectiveLeadPath.length - 1)} Hops</div>
              </div>
              <div>
                <div className="font-mono text-[10px] text-muted-foreground">STATUS</div>
                <div className="text-[11px] mt-0.5 text-warn font-mono">NEEDS VERIFICATION</div>
              </div>
            </div>

            {/* Confidence Score Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                <span>CONFIDENCE</span>
                <span className="text-signal font-bold">
                  {Math.round((leadRel?.confidence || allSuggestions[0]?.confidence || 0.88) * 100)}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-foreground/5 mt-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-signal"
                  style={{ width: `${Math.round((leadRel?.confidence || allSuggestions[0]?.confidence || 0.88) * 100)}%` }}
                />
              </div>
            </div>

            {/* Multi-Hop Path Chips */}
            <div className="mt-4">
              <div className="font-mono text-[10px] text-muted-foreground mb-1.5 flex items-center justify-between">
                <span>CONDUIT PATHWAY</span>
                <span className="text-signal">{effectiveLeadPath.length} nodes</span>
              </div>
              <div className="flex flex-wrap gap-1.5 text-[10px] font-mono bg-void/50 rounded-md p-2 border border-signal/10">
                {effectiveLeadPath.map((nodeId, idx) => (
                  <span
                    key={`${nodeId}-${idx}`}
                    className="text-signal font-semibold"
                  >
                    {getEntityDisplayName(allNodes.find((t) => t.id === nodeId) || nodeId)}
                    {idx < effectiveLeadPath.length - 1 ? ' →' : ''}
                  </span>
                ))}
              </div>
            </div>

            {/* Trace in Network View Button */}
            <button
              onClick={() => {
                if (leadRel) setActiveHiddenRelationshipId(leadRel.id);
                onNavigate('NETWORK');
              }}
              className="w-full mt-4 py-2 px-3 rounded-lg bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/25 font-mono text-xs font-bold flex items-center justify-center gap-2 transition shadow-sm"
            >
              <Sparkles className="size-3.5 text-cyan-400" />
              <span>Trace Lead on Network Canvas →</span>
            </button>
          </div>

          {/* Supporting Evidence List */}
          <div className="mt-4">
            <div className="font-mono text-[10px] text-muted-foreground mb-1.5">SUPPORTING EVIDENCE</div>
            <div className="space-y-1.5">
              {allEvidence.slice(0, 3).map((ev) => (
                <button
                  key={ev.id}
                  onClick={() => setActiveModalRecordId(ev.id)}
                  className="w-full text-left flex items-center justify-between rounded-md bg-ink/60 border border-signal/15 px-3 py-2 hover:border-signal/40 transition"
                >
                  <span className="text-[11px] text-foreground">
                    {ev.id} · {ev.type}
                  </span>
                  <span className="font-mono text-[10px] text-signal">
                    {ev.confidence.toFixed(2)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Human Verification Advisory Banner */}
          <div className="mt-4 flex items-start gap-2 rounded-md bg-warn/10 border border-warn/30 px-3 py-2">
            <span className="text-warn text-sm">⚠</span>
            <span className="text-[10px] leading-relaxed text-warn">
              HUMAN VERIFICATION REQUIRED — this is an investigative lead, not a conclusion.
            </span>
          </div>
        </div>
      </aside>

      {/* AI-Assisted Investigative Suggestions Section */}
      <section className="col-span-12">
        <InvestigativeSuggestions
          onApplySuggestion={handleApplySuggestion}
          activeSuggestionId={activeSuggestionId}
        />
      </section>

      {/* Structured Inquiry Command Bar with Data-Driven Suggestion Chips */}
      <section className="col-span-12 glass rounded-xl px-4 py-3 flex flex-col gap-2.5 border-signal/20">
        <div className="flex items-center gap-3">
          <Command className="size-4 text-signal shrink-0" />
          <input
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && commandInput.trim()) {
                const matched = allNodes.find((n) =>
                  n.name.toLowerCase().includes(commandInput.toLowerCase()) ||
                  n.id.toLowerCase() === commandInput.toLowerCase()
                );
                if (matched) {
                  handleEntitySelect(matched.id);
                  runAnalysis();
                }
              }
            }}
            className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none border-0"
            placeholder="Ask the investigation system… (e.g. Trace Garima ↔ Shailesh, find vehicle nexus, or click a suggestion below)"
          />
          <span className="hidden md:block text-[10px] font-mono text-muted-foreground px-2 py-1 rounded border border-signal/15">
            STRUCTURED INQUIRY
          </span>
          <button
            onClick={() => {
              if (commandInput.trim()) {
                const matched = allNodes.find((n) =>
                  n.name.toLowerCase().includes(commandInput.toLowerCase()) ||
                  n.id.toLowerCase() === commandInput.toLowerCase()
                );
                if (matched) {
                  handleEntitySelect(matched.id);
                  runAnalysis();
                }
              }
            }}
            className="rounded px-3 py-1 text-xs font-medium bg-signal/15 border border-signal/40 text-signal hover:bg-signal/25 transition"
          >
            Run
          </button>
        </div>

        {/* Quick Suggestion Chips (Dynamically Generated From Live Data) */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/50 text-[10px] font-mono">
          <span className="text-muted-foreground">SUGGESTED QUERIES:</span>
          {dataDrivenSuggestions.map((sug, idx) => {
            const toneColors = {
              signal: 'bg-signal/10 border-signal/25 text-signal hover:bg-signal/20',
              safe: 'bg-safe/10 border-safe/25 text-safe hover:bg-safe/20',
              azure: 'bg-azure/10 border-azure/25 text-azure hover:bg-azure/20',
              warn: 'bg-warn/10 border-warn/25 text-warn hover:bg-warn/20',
            }[sug.tone] || 'bg-signal/10 border-signal/25 text-signal hover:bg-signal/20';

            return (
              <button
                key={idx}
                onClick={() => {
                  setCommandInput(sug.query);
                  handleEntitySelect(sug.targetId);
                  if (sug.categories) {
                    setActiveRelationCategories(sug.categories);
                  }
                  runAnalysis();
                  setActiveTab('CANVAS');
                }}
                className={`px-2 py-0.5 rounded border transition ${toneColors}`}
                title={`Run inquiry: ${sug.query}`}
              >
                ✦ {sug.label}
              </button>
            );
          })}
          <button
            onClick={resetAllFilters}
            className="px-2 py-0.5 rounded bg-panel border border-signal/15 text-muted-foreground hover:text-foreground transition ml-auto flex items-center gap-1"
          >
            <RotateCcw className="size-2.5" />
            <span>Reset All Filters</span>
          </button>
        </div>
      </section>

      {/* Bottom Split Row: Functional Entity Search & Functional Graph Filters */}
      <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Functional Entity Search Card */}
        <div className="glass rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] tracking-[0.22em] font-mono text-signal/70">
                ENTITY SEARCH & FILTER
              </div>
              <div className="text-sm font-display text-foreground mt-1 font-semibold">
                Find a subject or connected record
              </div>
            </div>
            <Search className="size-4 text-muted-foreground" />
          </div>

          <div className="mt-3 relative">
            <Search className="absolute left-3 top-2.5 size-3.5 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md pl-9 pr-8 py-2 text-xs bg-ink/50 border border-signal/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-signal/40"
              placeholder="Filter by name, ID, phone, vehicle plate..."
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <div className="mt-3 space-y-1.5 max-h-48 overflow-auto">
            {filteredNodes.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground font-mono">
                No entities match active filters
              </div>
            ) : (
              filteredNodes.slice(0, 5).map((node) => (
                <button
                  key={node.id}
                  onClick={() => handleEntitySelect(node.id)}
                  className={`w-full text-left flex items-center justify-between rounded-md px-2.5 py-2 border transition ${
                    effectiveSelectedId === node.id
                      ? 'border-signal/40 bg-signal/5'
                      : 'border-transparent hover:border-signal/15'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`text-${
                        NEXUS_ENTITY_TONES[node.type] || 'signal'
                      } text-sm font-mono`}
                    >
                      {NEXUS_ENTITY_ICONS[node.type]}
                    </span>
                    <span>
                      <span className="block text-[11px] text-foreground font-medium">{getEntityDisplayName(node)}</span>
                      <span className="block text-[9px] font-mono text-muted-foreground">
                        {node.type} · {formatNodeSubLabel(node)}
                      </span>
                    </span>
                  </span>
                  <span className="font-mono text-[9px] text-muted-foreground">
                    {node.connections} conn.
                  </span>
                </button>
              ))
            )}
          </div>

          {/* Interactive Entity Type Toggles */}
          <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-1.5">
            {['PERSON', 'PHONE', 'VEHICLE', 'ORGANIZATION', 'LOCATION', 'CASE', 'BANK ACCOUNT'].map((typeName) => {
              const isIncluded = activeEntityTypes.includes(typeName);
              return (
                <button
                  key={typeName}
                  onClick={() =>
                    setActiveEntityTypes(
                      isIncluded
                        ? activeEntityTypes.filter((t) => t !== typeName)
                        : [...activeEntityTypes, typeName]
                    )
                  }
                  className={`rounded border px-2 py-1 font-mono text-[9px] transition ${
                    isIncluded
                      ? 'border-signal/40 text-signal bg-signal/10'
                      : 'border-border text-muted-foreground hover:border-signal/20'
                  }`}
                >
                  {isIncluded ? '✓ ' : ''}
                  {typeName}
                </button>
              );
            })}
          </div>
        </div>

        {/* Functional Graph Filters Card */}
        <div className="glass rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] tracking-[0.22em] font-mono text-signal/70">
                GRAPH FILTERS & THRESHOLDS
              </div>
              <div className="text-sm font-display text-foreground mt-1 font-semibold">
                Focus the visible relationship set
              </div>
            </div>
            <Filter className="size-4 text-muted-foreground" />
          </div>

          {/* 4 Interactive Dropdowns */}
          <div className="mt-4 grid grid-cols-2 gap-3 relative">
            {/* CASE DROPDOWN */}
            <div className="relative">
              <div className="font-mono text-[10px] text-muted-foreground mb-1.5">CASE DOCKET</div>
              <button
                onClick={() => setOpenDropdown(openDropdown === 'CASE' ? null : 'CASE')}
                className="w-full flex items-center justify-between rounded-md border border-signal/10 bg-ink/50 px-2.5 py-2 text-left text-[11px] text-foreground hover:border-signal/30 transition"
              >
                <span className="truncate">{selectedCase === 'ALL' ? 'All Cases' : selectedCase}</span>
                <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
              </button>

              {openDropdown === 'CASE' && (
                <div className="absolute top-full left-0 mt-1 w-full rounded-md glass border border-signal/30 p-1 z-30 shadow-xl font-mono text-[11px]">
                  {['ALL', 'CR-2026-0142', 'CR-2025-0811'].map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        setSelectedCase(c);
                        setOpenDropdown(null);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between ${
                        selectedCase === c ? 'bg-signal/20 text-signal' : 'text-foreground hover:bg-signal/10'
                      }`}
                    >
                      <span>{c === 'ALL' ? 'All Cases' : c}</span>
                      {selectedCase === c && <Check className="size-3 text-signal" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* SOURCE DROPDOWN */}
            <div className="relative">
              <div className="font-mono text-[10px] text-muted-foreground mb-1.5">SOURCE LOG TYPE</div>
              <button
                onClick={() => setOpenDropdown(openDropdown === 'SOURCE' ? null : 'SOURCE')}
                className="w-full flex items-center justify-between rounded-md border border-signal/10 bg-ink/50 px-2.5 py-2 text-left text-[11px] text-foreground hover:border-signal/30 transition"
              >
                <span className="truncate">{selectedSource === 'ALL' ? 'All source records' : selectedSource}</span>
                <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
              </button>

              {openDropdown === 'SOURCE' && (
                <div className="absolute top-full left-0 mt-1 w-full rounded-md glass border border-signal/30 p-1 z-30 shadow-xl font-mono text-[11px]">
                  {['ALL', 'Telecom CDR', 'Field observation', 'ANPR / CCTV', 'Banking / Wire', 'Tower dump'].map((src) => (
                    <button
                      key={src}
                      onClick={() => {
                        setSelectedSource(src);
                        setOpenDropdown(null);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between ${
                        selectedSource === src ? 'bg-signal/20 text-signal' : 'text-foreground hover:bg-signal/10'
                      }`}
                    >
                      <span>{src === 'ALL' ? 'All sources' : src}</span>
                      {selectedSource === src && <Check className="size-3 text-signal" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* DATE RANGE DROPDOWN */}
            <div className="relative">
              <div className="font-mono text-[10px] text-muted-foreground mb-1.5">DATE RANGE</div>
              <button
                onClick={() => setOpenDropdown(openDropdown === 'DATE' ? null : 'DATE')}
                className="w-full flex items-center justify-between rounded-md border border-signal/10 bg-ink/50 px-2.5 py-2 text-left text-[11px] text-foreground hover:border-signal/30 transition"
              >
                <span className="truncate">
                  {selectedDateRange === 'ALL' ? '01 Jan — 30 Jun 2026' : selectedDateRange}
                </span>
                <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
              </button>

              {openDropdown === 'DATE' && (
                <div className="absolute top-full left-0 mt-1 w-full rounded-md glass border border-signal/30 p-1 z-30 shadow-xl font-mono text-[11px]">
                  {['ALL', 'Q1 2026 (Jan–Mar)', 'Active Window (11-13 Mar)'].map((d) => (
                    <button
                      key={d}
                      onClick={() => {
                        setSelectedDateRange(d);
                        setOpenDropdown(null);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between ${
                        selectedDateRange === d ? 'bg-signal/20 text-signal' : 'text-foreground hover:bg-signal/10'
                      }`}
                    >
                      <span>{d === 'ALL' ? 'All (Jan–Jun 2026)' : d}</span>
                      {selectedDateRange === d && <Check className="size-3 text-signal" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* DEPTH DROPDOWN */}
            <div className="relative">
              <div className="font-mono text-[10px] text-muted-foreground mb-1.5">MAX HOP DEPTH</div>
              <button
                onClick={() => setOpenDropdown(openDropdown === 'DEPTH' ? null : 'DEPTH')}
                className="w-full flex items-center justify-between rounded-md border border-signal/10 bg-ink/50 px-2.5 py-2 text-left text-[11px] text-foreground hover:border-signal/30 transition"
              >
                <span>{maxDepth} {maxDepth === 1 ? 'Hop' : 'Hops'}</span>
                <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
              </button>

              {openDropdown === 'DEPTH' && (
                <div className="absolute top-full left-0 mt-1 w-full rounded-md glass border border-signal/30 p-1 z-30 shadow-xl font-mono text-[11px]">
                  {[1, 2, 3, 4, 5].map((depth) => (
                    <button
                      key={depth}
                      onClick={() => {
                        setMaxDepth(depth);
                        setOpenDropdown(null);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between ${
                        maxDepth === depth ? 'bg-signal/20 text-signal' : 'text-foreground hover:bg-signal/10'
                      }`}
                    >
                      <span>{depth} {depth === 1 ? 'Hop' : 'Hops'}</span>
                      {maxDepth === depth && <Check className="size-3 text-signal" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ENTITY DENSITY LIMIT DROPDOWN */}
            <div className="relative col-span-2">
              <div className="font-mono text-[10px] text-muted-foreground mb-1.5 flex items-center justify-between">
                <span>ENTITY DENSITY LIMIT</span>
                <span className="text-signal text-[9px]">
                  {displayedNodes.length} of {allNodes.length} active
                </span>
              </div>
              <button
                onClick={() => setOpenDropdown(openDropdown === 'LIMIT' ? null : 'LIMIT')}
                className="w-full flex items-center justify-between rounded-md border border-signal/20 bg-ink/60 px-2.5 py-2 text-left text-[11px] text-foreground hover:border-signal/40 transition"
              >
                <span className="flex items-center gap-2">
                  <SlidersHorizontal className="size-3 text-signal" />
                  <span className="font-medium text-signal">
                    {entityLimit === 'ALL' ? `All Entities (${allNodes.length})` : `Top ${entityLimit} Critical Entities`}
                  </span>
                </span>
                <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
              </button>

              {openDropdown === 'LIMIT' && (
                <div className="absolute top-full left-0 mt-1 w-full rounded-md glass border border-signal/30 p-1 z-30 shadow-xl font-mono text-[11px]">
                  {([10, 15, 25, 50, 'ALL'] as const).map((lim) => (
                    <button
                      key={String(lim)}
                      onClick={() => {
                        setEntityLimit(lim);
                        setOpenDropdown(null);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between ${
                        entityLimit === lim ? 'bg-signal/20 text-signal font-semibold' : 'text-foreground hover:bg-signal/10'
                      }`}
                    >
                      <span>{lim === 'ALL' ? `All Entities (${allNodes.length})` : `Top ${lim} Most Important Entities`}</span>
                      {entityLimit === lim && <Check className="size-3 text-signal" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Interactive Relationship Category Toggles */}
          <div className="mt-4 pt-3 border-t border-border/60">
            <div className="font-mono text-[10px] text-muted-foreground mb-2 flex items-center justify-between">
              <span>RELATIONSHIP CATEGORY TOGGLES</span>
              <span className="text-signal">
                {activeRelationCategories.length} / {ALL_RELATION_CATEGORIES.length} ACTIVE
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {ALL_RELATION_CATEGORIES.map((category) => {
                const isActive = activeRelationCategories.includes(category);
                return (
                  <button
                    key={category}
                    onClick={() => {
                      if (isActive) {
                        if (activeRelationCategories.length > 1) {
                          setActiveRelationCategories(
                            activeRelationCategories.filter((c) => c !== category)
                          );
                        }
                      } else {
                        setActiveRelationCategories([...activeRelationCategories, category]);
                      }
                    }}
                    className={`rounded-md border px-2.5 py-1 text-[10px] font-mono transition ${
                      isActive
                        ? 'border-signal/40 text-signal bg-signal/10 shadow-[0_0_8px_rgba(0,240,255,0.1)]'
                        : 'border-border text-muted-foreground hover:border-signal/20'
                    }`}
                  >
                    {isActive ? '✓ ' : ''}
                    {category}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Evidence Timeline Row */}
      <section className="col-span-12 glass rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] tracking-[0.22em] font-mono text-signal/70">
            EVIDENCE TIMELINE
          </div>
          <button
            onClick={() => onNavigate('EVIDENCE')}
            className="text-[11px] text-muted-foreground hover:text-signal transition flex items-center gap-1"
          >
            <span>Open evidence register</span>
            <ArrowRight className="size-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {allEvidence.slice(0, 4).map((ev) => (
            <button
              key={ev.id}
              onClick={() => setActiveModalRecordId(ev.id)}
              className={`text-left rounded-lg bg-ink/50 border p-3 hover:border-signal/40 transition ${
                activeModalRecordId === ev.id ? 'border-signal/50' : 'border-signal/10'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-signal text-sm">
                  {ev.type === 'Communication'
                    ? '◇'
                    : ev.type === 'Vehicle observation'
                    ? '◈'
                    : ev.type === 'Transaction'
                    ? '◎'
                    : '▦'}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {ev.date} · {ev.time}
                </span>
              </div>
              <div className="text-[12px] text-foreground mt-1.5 font-medium">{ev.type}</div>
              <div className="text-[11px] text-muted-foreground truncate">{ev.title}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Source Record Drawer/Modal */}
      {activeModalRecord && (
        <EvidenceModal
          record={activeModalRecord}
          onClose={() => setActiveModalRecordId(null)}
        />
      )}
    </div>
  );
};
