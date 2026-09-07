import React, { useState, useMemo, useEffect } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { 
  NEXUS_NODES, 
  NEXUS_EDGES, 
  NEXUS_ENTITY_ICONS, 
  NEXUS_ENTITY_TONES,
  NexusNode 
} from '../../services/nexusData';
import { useIntelData } from '../../context/IntelDataContext';
import { formatNodeName, formatNodeSubLabel } from '../command-center/CommandCenter';
import { getCanonicalEntity, getEntityDisplayName } from '../../services/canonicalEntities';

interface EgoCentricRadialGraphProps {
  centerEntityId: string;
  selectedEntityId?: string;
  onSelectEntity: (entityId: string) => void;
  onSelectEdgeRecord?: (recordId: string) => void;
  entityLimit?: number | 'ALL';
  leadPathNodeIds?: string[];
  isMainLead?: boolean;
  onNodesCountChange?: (count: number) => void;
  zoom?: number;
  pan?: { x: number; y: number };
  onZoomChange?: (z: number | ((prev: number) => number)) => void;
  onPanChange?: (p: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void;
}

export const EgoCentricRadialGraph: React.FC<EgoCentricRadialGraphProps> = ({
  centerEntityId,
  selectedEntityId,
  onSelectEntity,
  onSelectEdgeRecord,
  entityLimit = 15,
  leadPathNodeIds = [],
  isMainLead = true,
  onNodesCountChange,
  zoom: propZoom,
  pan: propPan,
  onZoomChange,
  onPanChange,
}) => {
  const { nodes, edges } = useIntelData();
  const allNodes = nodes.length > 0 ? nodes : NEXUS_NODES;
  const allEdges = edges.length > 0 ? edges : NEXUS_EDGES;

  // Internal Zoom & Pan fallback state if not managed by parent
  const [internalZoom, setInternalZoom] = useState<number>(1);
  const [internalPan, setInternalPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const effectiveZoom = propZoom !== undefined ? propZoom : internalZoom;
  const effectivePan = propPan !== undefined ? propPan : internalPan;

  const setEffectiveZoom = (updater: number | ((prev: number) => number)) => {
    if (onZoomChange) onZoomChange(updater);
    else setInternalZoom(updater);
  };

  const setEffectivePan = (updater: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => {
    if (onPanChange) onPanChange(updater);
    else setInternalPan(updater);
  };

  // Center node: Main lead root or focused subject
  const centerNode = useMemo(() => {
    const found = allNodes.find((n) => n.id === centerEntityId);
    if (found) return found;
    const canonical = getCanonicalEntity(centerEntityId);
    if (canonical) {
      return {
        id: canonical.id,
        name: canonical.name,
        type: canonical.type,
        subtitle: canonical.subtitle,
        x: 50,
        y: 50,
        connections: 12,
        cases: 2,
        riskScore: canonical.riskScore
      } as NexusNode;
    }
    return allNodes[0];
  }, [allNodes, centerEntityId]);

  const effectiveCenterId = centerNode?.id || centerEntityId;

  // 1-Hop direct neighbors
  const rawDirectEdges = useMemo(() => {
    return allEdges.filter(
      (e) => e.source === effectiveCenterId || e.target === effectiveCenterId
    );
  }, [allEdges, effectiveCenterId]);

  const rawDirectNeighborIds = useMemo(() => {
    const ids = new Set<string>();
    rawDirectEdges.forEach((e) => {
      if (e.source === effectiveCenterId) ids.add(e.target);
      if (e.target === effectiveCenterId) ids.add(e.source);
    });
    return Array.from(ids);
  }, [rawDirectEdges, effectiveCenterId]);

  // 2-Hop secondary neighbors
  const rawSecondaryEdges = useMemo(() => {
    return allEdges.filter(
      (e) =>
        (rawDirectNeighborIds.includes(e.source) || rawDirectNeighborIds.includes(e.target)) &&
        e.source !== effectiveCenterId &&
        e.target !== effectiveCenterId
    );
  }, [allEdges, rawDirectNeighborIds, effectiveCenterId]);

  const rawSecondaryNeighborIds = useMemo(() => {
    const ids = new Set<string>();
    rawSecondaryEdges.forEach((e) => {
      if (!rawDirectNeighborIds.includes(e.source) && e.source !== effectiveCenterId) ids.add(e.source);
      if (!rawDirectNeighborIds.includes(e.target) && e.target !== effectiveCenterId) ids.add(e.target);
    });
    return Array.from(ids);
  }, [rawSecondaryEdges, rawDirectNeighborIds, effectiveCenterId]);

  // Filter and prioritize neighbors strictly according to entityLimit (10, 15, 25, 50, ALL)
  const { directNeighborIds, secondaryNeighborIds } = useMemo(() => {
    const maxPeripheral = entityLimit === 'ALL' || !entityLimit ? 9999 : Math.max(1, entityLimit - 1);
    const pathSet = new Set(leadPathNodeIds);

    // Score direct neighbors
    const sortedDirect = [...rawDirectNeighborIds].sort((a, b) => {
      const aPath = pathSet.has(a) ? 100 : 0;
      const bPath = pathSet.has(b) ? 100 : 0;
      if (aPath !== bPath) return bPath - aPath;
      const nodeA = allNodes.find((n) => n.id === a);
      const nodeB = allNodes.find((n) => n.id === b);
      return (nodeB?.connections || 0) - (nodeA?.connections || 0);
    });

    // Score secondary neighbors
    const sortedSecondary = [...rawSecondaryNeighborIds].sort((a, b) => {
      const aPath = pathSet.has(a) ? 100 : 0;
      const bPath = pathSet.has(b) ? 100 : 0;
      if (aPath !== bPath) return bPath - aPath;
      const nodeA = allNodes.find((n) => n.id === a);
      const nodeB = allNodes.find((n) => n.id === b);
      return (nodeB?.connections || 0) - (nodeA?.connections || 0);
    });

    if (entityLimit === 'ALL') {
      return { directNeighborIds: sortedDirect, secondaryNeighborIds: sortedSecondary };
    }

    // Allocate spots between Orbit 1 (Direct) and Orbit 2 (Secondary)
    const targetDirect = Math.min(sortedDirect.length, Math.ceil(maxPeripheral * 0.6));
    const selectedDirect = sortedDirect.slice(0, targetDirect);
    const remainingSpots = Math.max(0, maxPeripheral - selectedDirect.length);
    const selectedSecondary = sortedSecondary.slice(0, remainingSpots);

    // If still have unused spots and more direct neighbors available, backfill
    if (selectedDirect.length + selectedSecondary.length < maxPeripheral && selectedDirect.length < sortedDirect.length) {
      const extra = sortedDirect.slice(selectedDirect.length, selectedDirect.length + (maxPeripheral - (selectedDirect.length + selectedSecondary.length)));
      selectedDirect.push(...extra);
    }

    return { directNeighborIds: selectedDirect, secondaryNeighborIds: selectedSecondary };
  }, [rawDirectNeighborIds, rawSecondaryNeighborIds, entityLimit, leadPathNodeIds, allNodes]);

  const totalEntities = 1 + directNeighborIds.length + secondaryNeighborIds.length;

  // Sync count with parent
  useEffect(() => {
    if (onNodesCountChange) {
      onNodesCountChange(totalEntities);
    }
  }, [totalEntities, onNodesCountChange]);

  // Dynamic canvas dimension based on entity limit & active density
  const canvasDimension = useMemo(() => {
    if (entityLimit === 'ALL' || totalEntities > 40) return 300;
    if (entityLimit >= 25 || totalEntities > 20) return 230;
    if (entityLimit >= 15 || totalEntities > 12) return 170;
    return 130;
  }, [entityLimit, totalEntities]);

  const cx = canvasDimension / 2;
  const cy = canvasDimension / 2;

  // STRICTLY CIRCULAR GEOMETRY: Orbit 1 and Orbit 2 concentric rings
  const { positionedNodes, r1, r2 } = useMemo(() => {
    const coords: Record<string, { x: number; y: number; hop: number; isPath: boolean }> = {};
    const pathSet = new Set(leadPathNodeIds);

    // Center node: Main lead root placed right at the center
    coords[effectiveCenterId] = { 
      x: cx, 
      y: cy, 
      hop: 0, 
      isPath: pathSet.has(effectiveCenterId) || true 
    };

    // Radius 1: Orbit 1 circle
    const orbit1Radius = canvasDimension * 0.24;
    const n1 = directNeighborIds.length;

    // Distribute Orbit 1 nodes evenly along the circle
    directNeighborIds.forEach((id, i) => {
      const angle = (2 * Math.PI * i) / (n1 || 1) - Math.PI / 2;
      coords[id] = {
        x: Math.round((cx + orbit1Radius * Math.cos(angle)) * 10) / 10,
        y: Math.round((cy + orbit1Radius * Math.sin(angle)) * 10) / 10,
        hop: 1,
        isPath: pathSet.has(id),
      };
    });

    // Radius 2: Orbit 2 circle
    const orbit2Radius = canvasDimension * 0.42;
    const n2 = secondaryNeighborIds.length;

    // Distribute Orbit 2 nodes evenly along the outer circle
    secondaryNeighborIds.forEach((id, i) => {
      const angle = (2 * Math.PI * i) / (n2 || 1) - Math.PI / 4;
      coords[id] = {
        x: Math.round((cx + orbit2Radius * Math.cos(angle)) * 10) / 10,
        y: Math.round((cy + orbit2Radius * Math.sin(angle)) * 10) / 10,
        hop: 2,
        isPath: pathSet.has(id),
      };
    });

    return { positionedNodes: coords, r1: orbit1Radius, r2: orbit2Radius };
  }, [effectiveCenterId, directNeighborIds, secondaryNeighborIds, canvasDimension, cx, cy, leadPathNodeIds]);

  // Edges between displayed nodes
  const displayedNodeIds = useMemo(() => {
    return new Set([effectiveCenterId, ...directNeighborIds, ...secondaryNeighborIds]);
  }, [effectiveCenterId, directNeighborIds, secondaryNeighborIds]);

  const activeEdges = useMemo(() => {
    const existingPairs = new Set<string>();
    const edgesList = allEdges.filter((e) => {
      const valid = displayedNodeIds.has(e.source) && displayedNodeIds.has(e.target);
      if (valid) {
        existingPairs.add(`${e.source}__${e.target}`);
        existingPairs.add(`${e.target}__${e.source}`);
      }
      return valid;
    });

    // Ensure consecutive path edges between displayed nodes are present
    for (let i = 0; i < leadPathNodeIds.length - 1; i++) {
      const u = leadPathNodeIds[i];
      const v = leadPathNodeIds[i + 1];
      if (displayedNodeIds.has(u) && displayedNodeIds.has(v)) {
        const pair = `${u}__${v}`;
        if (!existingPairs.has(pair)) {
          existingPairs.add(pair);
          existingPairs.add(`${v}__${u}`);
          edgesList.push({
            id: `radial-path-${u}-${v}`,
            source: u,
            target: v,
            category: 'COMMUNICATION',
            label: 'LEAD_TRAIL',
            confidence: 0.95,
            recordId: `REC-${u}-${v}`,
            sourceType: 'lead_trail',
            active: true
          } as any);
        }
      }
    }

    return edgesList;
  }, [allEdges, displayedNodeIds, leadPathNodeIds]);

  // Consecutive path edge pairs set
  const consecutivePathEdges = useMemo(() => {
    const set = new Set<string>();
    for (let i = 0; i < leadPathNodeIds.length - 1; i++) {
      set.add(`${leadPathNodeIds[i]}__${leadPathNodeIds[i + 1]}`);
      set.add(`${leadPathNodeIds[i + 1]}__${leadPathNodeIds[i]}`);
    }
    return set;
  }, [leadPathNodeIds]);

  // Dynamic Density Scale: Proportional sizing of nodes, labels, and strokes
  const densityScale = useMemo(() => {
    const dim = canvasDimension;
    if (totalEntities > 35) {
      return {
        centerR: dim * 0.034,
        directR: dim * 0.022,
        secondaryR: dim * 0.016,
        activeR: dim * 0.040,
        strokeW: 0.35,
        fontSize: dim * 0.018,
        subFontSize: dim * 0.012,
        labelY: dim * 0.030,
        maxChars: 11,
        photonR: 0.8,
      };
    }
    if (totalEntities > 20) {
      return {
        centerR: dim * 0.038,
        directR: dim * 0.025,
        secondaryR: dim * 0.018,
        activeR: dim * 0.045,
        strokeW: 0.5,
        fontSize: dim * 0.020,
        subFontSize: dim * 0.014,
        labelY: dim * 0.036,
        maxChars: 13,
        photonR: 1.0,
      };
    }
    if (totalEntities > 12) {
      return {
        centerR: dim * 0.042,
        directR: dim * 0.028,
        secondaryR: dim * 0.020,
        activeR: dim * 0.050,
        strokeW: 0.65,
        fontSize: dim * 0.024,
        subFontSize: dim * 0.016,
        labelY: dim * 0.042,
        maxChars: 15,
        photonR: 1.2,
      };
    }
    return {
      centerR: dim * 0.048,
      directR: dim * 0.034,
      secondaryR: dim * 0.024,
      activeR: dim * 0.058,
      strokeW: 0.85,
      fontSize: dim * 0.028,
      subFontSize: dim * 0.018,
      labelY: dim * 0.050,
      maxChars: 18,
      photonR: 1.5,
    };
  }, [totalEntities, canvasDimension]);

  // Mouse Wheel Zoom Handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 0.88;
    setEffectiveZoom((z) => Math.min(3.0, Math.max(0.4, Math.round(z * factor * 100) / 100)));
  };

  // Mouse Drag Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement | SVGElement;
    if (target.closest('.graph-node') || target.closest('button')) return;
    setIsPanning(true);
    setDragStart({ x: e.clientX - effectivePan.x, y: e.clientY - effectivePan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setEffectivePan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsPanning(false);

  // Zoom Button Handlers
  const handleZoomIn = () => setEffectiveZoom((z) => Math.min(3.0, Math.round((z + 0.15) * 100) / 100));
  const handleZoomOut = () => setEffectiveZoom((z) => Math.max(0.4, Math.round((z - 0.15) * 100) / 100));
  const handleResetZoom = () => {
    setEffectiveZoom(1);
    setEffectivePan({ x: 0, y: 0 });
  };

  return (
    <div 
      className="relative size-full overflow-hidden bg-void/60 rounded-lg border border-signal/10 grid-bg select-none"
      onWheel={handleWheel}
    >
      <div className="absolute inset-0 graph-vignette pointer-events-none" />

      {/* Orbit Rings Legend / Status */}
      <div className="absolute left-3 top-3 z-10 font-mono text-[10px] text-muted-foreground space-y-0.5 pointer-events-none">
        <div className="text-amber-400 font-semibold flex items-center gap-1.5">
          <Sparkles className="size-3 text-amber-400 animate-pulse" />
          <span>CIRCULAR RADIAL ORBIT · MAIN LEAD: {getEntityDisplayName(centerNode)}</span>
        </div>
        <div>
          Showing {totalEntities} entities (limit: {entityLimit}) · Orbit 1: {directNeighborIds.length} · Orbit 2: {secondaryNeighborIds.length}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${canvasDimension} ${canvasDimension}`}
        className={`absolute inset-0 size-full ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ 
          transform: `translate(${effectivePan.x}px, ${effectivePan.y}px) scale(${effectiveZoom})`,
          transformOrigin: 'center center',
          transition: isPanning ? 'none' : 'transform 0.2s ease-out'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <defs>
          <filter id="radial-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="0.6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="lead-halo" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Faint Radar Crosshairs */}
        <line 
          x1={cx} 
          y1={cy - canvasDimension * 0.48} 
          x2={cx} 
          y2={cy + canvasDimension * 0.48} 
          stroke="rgba(0, 240, 255, 0.05)" 
          strokeDasharray="2 4" 
        />
        <line 
          x1={cx - canvasDimension * 0.48} 
          y1={cy} 
          x2={cx + canvasDimension * 0.48} 
          y2={cy} 
          stroke="rgba(0, 240, 255, 0.05)" 
          strokeDasharray="2 4" 
        />

        {/* Outer Radar Boundary Circle */}
        <circle 
          cx={cx} 
          cy={cy} 
          r={canvasDimension * 0.48} 
          fill="none" 
          stroke="rgba(0, 240, 255, 0.06)" 
          strokeWidth={densityScale.strokeW * 0.7}
        />

        {/* PERFECT CIRCULAR ORBIT 1 GUIDE RING */}
        <circle 
          cx={cx} 
          cy={cy} 
          r={r1} 
          fill="none" 
          stroke="rgba(0, 240, 255, 0.16)" 
          strokeDasharray="2.5 3.5" 
          strokeWidth={densityScale.strokeW}
        />
        <text 
          x={cx} 
          y={cy - r1 + densityScale.fontSize * 1.3} 
          fill="rgba(0, 240, 255, 0.5)" 
          fontSize={`${densityScale.fontSize * 0.65}px`} 
          textAnchor="middle" 
          fontFamily="var(--font-mono)"
          letterSpacing="0.08em"
          fontWeight="bold"
        >
          ORBIT 1 · DIRECT CONNECTIONS
        </text>

        {/* PERFECT CIRCULAR ORBIT 2 GUIDE RING */}
        <circle 
          cx={cx} 
          cy={cy} 
          r={r2} 
          fill="none" 
          stroke="rgba(0, 240, 255, 0.10)" 
          strokeDasharray="3 4.5" 
          strokeWidth={densityScale.strokeW}
        />
        <text 
          x={cx} 
          y={cy - r2 + densityScale.fontSize * 1.3} 
          fill="rgba(140, 160, 184, 0.4)" 
          fontSize={`${densityScale.fontSize * 0.65}px`} 
          textAnchor="middle" 
          fontFamily="var(--font-mono)"
          letterSpacing="0.08em"
        >
          ORBIT 2 · MULTI-HOP REACH
        </text>

        {/* Connecting Radial Threads */}
        {activeEdges.map((edge) => {
          const sPos = positionedNodes[edge.source];
          const tPos = positionedNodes[edge.target];
          if (!sPos || !tPos) return null;
          const isDirect = edge.source === effectiveCenterId || edge.target === effectiveCenterId;
          const isLeadTrail = consecutivePathEdges.has(`${edge.source}__${edge.target}`);

          // Downstream photon direction along lead trail
          const srcIdx = leadPathNodeIds.indexOf(edge.source);
          const tgtIdx = leadPathNodeIds.indexOf(edge.target);
          const isForward = srcIdx !== -1 && tgtIdx !== -1 ? srcIdx < tgtIdx : isDirect ? edge.source === effectiveCenterId : true;
          const pStart = isForward ? sPos : tPos;
          const pEnd = isForward ? tPos : sPos;

          return (
            <g
              key={edge.id}
              className={isLeadTrail ? 'graph-edge graph-edge-active' : isDirect ? 'graph-edge' : 'graph-edge opacity-60'}
              onClick={() => onSelectEdgeRecord && onSelectEdgeRecord(edge.recordId)}
              style={{ outline: 'none' }}
            >
              <line 
                x1={sPos.x} 
                y1={sPos.y} 
                x2={tPos.x} 
                y2={tPos.y} 
                className="thread-base" 
                style={{ 
                  stroke: isLeadTrail ? 'rgba(245, 158, 11, 0.6)' : isDirect ? 'rgba(0, 240, 255, 0.35)' : 'rgba(0, 240, 255, 0.15)',
                  strokeWidth: `${isLeadTrail ? densityScale.strokeW * 1.6 : isDirect ? densityScale.strokeW * 1.2 : densityScale.strokeW * 0.8}px` 
                }}
              />
              <line 
                x1={sPos.x} 
                y1={sPos.y} 
                x2={tPos.x} 
                y2={tPos.y} 
                className="thread-pulse" 
                style={{ 
                  stroke: isLeadTrail ? '#f59e0b' : '#00f0ff',
                  strokeWidth: `${isLeadTrail ? densityScale.strokeW * 2.0 : isDirect ? densityScale.strokeW * 1.5 : densityScale.strokeW}px` 
                }}
              />

              {/* Luminous Animated Photon Packet */}
              {(isLeadTrail || isDirect) && (
                <circle
                  r={isLeadTrail ? densityScale.photonR * 1.2 : densityScale.photonR}
                  fill={isLeadTrail ? '#fbbf24' : '#00f0ff'}
                  filter="url(#radial-glow)"
                  className="photon-particle"
                >
                  <animateMotion
                    dur={isLeadTrail ? '1.5s' : isDirect ? '2.0s' : '3.6s'}
                    repeatCount="indefinite"
                    path={`M ${pStart.x} ${pStart.y} L ${pEnd.x} ${pEnd.y}`}
                  />
                </circle>
              )}

              {totalEntities <= 20 && isDirect && (
                <text 
                  x={(sPos.x + tPos.x) / 2} 
                  y={(sPos.y + tPos.y) / 2 - 1} 
                  className="edge-label"
                  style={{ fontSize: `${densityScale.fontSize * 0.65}px` }}
                >
                  {edge.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Positioned Nodes */}
        {Object.entries(positionedNodes).map(([nodeId, pos]) => {
          let node = allNodes.find((n) => n.id === nodeId);
          if (!node) {
            const canonical = getCanonicalEntity(nodeId);
            if (canonical) {
              node = {
                id: canonical.id,
                name: canonical.name,
                type: canonical.type,
                subtitle: canonical.subtitle,
                x: pos.x,
                y: pos.y,
                connections: 5,
                cases: 1,
                riskScore: canonical.riskScore
              } as NexusNode;
            }
          }
          if (!node) return null;
          const isCenter = nodeId === effectiveCenterId;
          const isDirect = pos.hop === 1;
          const isPath = pos.isPath;
          const isSelected = nodeId === selectedEntityId || isCenter;
          const nodeR = isCenter 
            ? densityScale.centerR 
            : isDirect 
            ? densityScale.directR 
            : densityScale.secondaryR;

          return (
            <g
              key={nodeId}
              className={`graph-node ${isCenter ? 'graph-node-active graph-node-focused' : isSelected ? 'graph-node-active' : isPath ? 'graph-node-path' : ''}`}
              transform={`translate(${pos.x}, ${pos.y})`}
              onClick={() => onSelectEntity(nodeId)}
              style={{ outline: 'none' }}
            >
              {/* Center Main Lead Golden Radar Halo */}
              {isCenter && (
                <>
                  <circle
                    r={densityScale.activeR * 1.4}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth={densityScale.strokeW * 0.8}
                    className="active-radar-ring"
                  />
                  <circle
                    r={densityScale.activeR * 1.0}
                    fill="none"
                    stroke="#00f0ff"
                    className="active-radar-ring"
                    style={{ animationDuration: '2.5s' }}
                  />
                </>
              )}

              {/* Selected Peripheral Entity Pulse */}
              {!isCenter && isSelected && (
                <circle
                  r={nodeR * 1.4}
                  fill="none"
                  stroke="#00f0ff"
                  className="active-radar-ring"
                />
              )}

              {/* Main Node Circle */}
              <circle 
                r={nodeR} 
                fill={isCenter ? '#f59e0b' : isPath ? '#00f0ff' : undefined}
                stroke={isCenter ? '#fef08a' : undefined}
                strokeWidth={isCenter ? densityScale.strokeW * 1.2 : undefined}
                filter={isCenter ? 'url(#lead-halo)' : undefined}
              />

              {/* Active Beacon Dot */}
              {(isCenter || isSelected) && (
                <circle
                  cx={nodeR * 0.7}
                  cy={-nodeR * 0.7}
                  r={densityScale.secondaryR * 0.35}
                  fill={isCenter ? '#fef08a' : '#00f0ff'}
                  filter="url(#radial-glow)"
                  className="blink"
                />
              )}

              <text
                y={densityScale.labelY}
                className={`node-name ${isCenter || isSelected ? 'font-semibold' : ''}`}
                style={{ 
                  fontSize: `${densityScale.fontSize}px`, 
                  fill: isCenter ? '#fbbf24' : isSelected ? '#ffffff' : undefined 
                }}
              >
                {formatNodeName(node, densityScale.maxChars)}
              </text>

              {/* Center Node Main Lead Badge vs Regular Sub-Label */}
              {isCenter ? (
                <g transform={`translate(0, ${densityScale.labelY + densityScale.fontSize * 1.1})`}>
                  <rect
                    x={-densityScale.fontSize * 2.8}
                    y={-densityScale.fontSize * 0.6}
                    width={densityScale.fontSize * 5.6}
                    height={densityScale.fontSize * 1.15}
                    rx={densityScale.fontSize * 0.5}
                    fill="rgba(245, 158, 11, 0.25)"
                    stroke="rgba(245, 158, 11, 0.85)"
                    strokeWidth={densityScale.strokeW * 0.6}
                  />
                  <text
                    y={densityScale.fontSize * 0.22}
                    fill="#fbbf24"
                    fontSize={`${densityScale.fontSize * 0.55}px`}
                    textAnchor="middle"
                    fontFamily="var(--font-mono)"
                    fontWeight="bold"
                    letterSpacing="0.06em"
                  >
                    ★ MAIN LEAD
                  </text>
                </g>
              ) : isPath ? (
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
                    LEAD TRAIL
                  </text>
                </g>
              ) : (
                <text 
                  y={densityScale.labelY + densityScale.fontSize * 0.9} 
                  className="node-sub"
                  style={{ fontSize: `${densityScale.subFontSize}px` }}
                >
                  {formatNodeSubLabel(node)}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Interactive Zoom Controls HUD */}
      <div className="absolute bottom-3 left-3 flex gap-1.5 z-20">
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

      {/* Live Zoom & Pan Status Pill */}
      <div className="absolute bottom-3 right-3 font-mono text-[10px] text-muted-foreground border border-signal/15 bg-panel/80 rounded px-2.5 py-1 z-20 shadow-md backdrop-blur-md flex items-center gap-1.5">
        <span className="text-signal font-semibold">{Math.round(effectiveZoom * 100)}%</span>
        <span>·</span>
        <span>drag to pan</span>
      </div>
    </div>
  );
};

