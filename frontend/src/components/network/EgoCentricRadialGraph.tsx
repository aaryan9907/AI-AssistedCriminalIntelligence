import React, { useMemo } from 'react';
import { 
  NEXUS_NODES, 
  NEXUS_EDGES, 
  NEXUS_ENTITY_ICONS, 
  NEXUS_ENTITY_TONES,
  NexusNode 
} from '../../services/nexusData';
import { useIntelData } from '../../context/IntelDataContext';

interface EgoCentricRadialGraphProps {
  centerEntityId: string;
  selectedEntityId?: string;
  onSelectEntity: (entityId: string) => void;
  onSelectEdgeRecord?: (recordId: string) => void;
  zoom?: number;
}

export const EgoCentricRadialGraph: React.FC<EgoCentricRadialGraphProps> = ({
  centerEntityId,
  selectedEntityId,
  onSelectEntity,
  onSelectEdgeRecord,
  zoom = 1,
}) => {
  const { nodes, edges } = useIntelData();
  const allNodes = nodes.length > 0 ? nodes : NEXUS_NODES;
  const allEdges = edges.length > 0 ? edges : NEXUS_EDGES;

  const centerNode = useMemo(() => {
    return allNodes.find((n) => n.id === centerEntityId) || allNodes[0];
  }, [allNodes, centerEntityId]);

  const effectiveCenterId = centerNode?.id || centerEntityId;

  // 1-Hop direct neighbors
  const directEdges = useMemo(() => {
    return allEdges.filter(
      (e) => e.source === effectiveCenterId || e.target === effectiveCenterId
    );
  }, [allEdges, effectiveCenterId]);

  const directNeighborIds = useMemo(() => {
    const ids = new Set<string>();
    directEdges.forEach((e) => {
      if (e.source === effectiveCenterId) ids.add(e.target);
      if (e.target === effectiveCenterId) ids.add(e.source);
    });
    return Array.from(ids);
  }, [directEdges, effectiveCenterId]);

  // 2-Hop indirect neighbors
  const secondaryEdges = useMemo(() => {
    return allEdges.filter(
      (e) =>
        (directNeighborIds.includes(e.source) || directNeighborIds.includes(e.target)) &&
        e.source !== effectiveCenterId &&
        e.target !== effectiveCenterId
    );
  }, [allEdges, directNeighborIds, effectiveCenterId]);

  const secondaryNeighborIds = useMemo(() => {
    const ids = new Set<string>();
    secondaryEdges.forEach((e) => {
      if (!directNeighborIds.includes(e.source) && e.source !== effectiveCenterId) ids.add(e.source);
      if (!directNeighborIds.includes(e.target) && e.target !== effectiveCenterId) ids.add(e.target);
    });
    return Array.from(ids);
  }, [secondaryEdges, directNeighborIds, effectiveCenterId]);

  // Compute radial coordinates
  const positionedNodes = useMemo(() => {
    const coords: Record<string, { x: number; y: number; hop: number }> = {};
    
    // Center node
    coords[effectiveCenterId] = { x: 50, y: 50, hop: 0 };

    // 1-Hop Orbit (Radius = 24)
    const r1 = 24;
    directNeighborIds.forEach((id, i) => {
      const angle = (2 * Math.PI * i) / (directNeighborIds.length || 1) - Math.PI / 2;
      coords[id] = {
        x: 50 + r1 * Math.cos(angle),
        y: 50 + r1 * Math.sin(angle),
        hop: 1,
      };
    });

    // 2-Hop Orbit (Radius = 40)
    const r2 = 40;
    secondaryNeighborIds.forEach((id, i) => {
      const angle = (2 * Math.PI * i) / (secondaryNeighborIds.length || 1) - Math.PI / 4;
      coords[id] = {
        x: 50 + r2 * Math.cos(angle),
        y: 50 + r2 * Math.sin(angle),
        hop: 2,
      };
    });

    return coords;
  }, [centerEntityId, directNeighborIds, secondaryNeighborIds]);

  const allActiveEdges = [...directEdges, ...secondaryEdges];

  return (
    <div className="relative size-full overflow-hidden bg-void/60 rounded-lg border border-signal/10 grid-bg">
      <div className="absolute inset-0 graph-vignette" />

      {/* Orbit Rings Legend / Status */}
      <div className="absolute left-3 top-3 z-10 font-mono text-[10px] text-muted-foreground space-y-0.5">
        <div className="text-signal font-semibold">
          EGO-CENTRIC RADIAL ORBIT · {centerNode.name}
        </div>
        <div>
          1-Hop Direct: {directNeighborIds.length} · 2-Hop Peripheral: {secondaryNeighborIds.length}
        </div>
      </div>

      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 size-full transition-transform duration-500"
        style={{ transform: `scale(${zoom})` }}
      >
        <defs>
          <filter id="radial-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="0.6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Concentric Orbit Guide Rings */}
        <circle cx="50" cy="50" r="24" fill="none" stroke="rgba(0, 240, 255, 0.12)" strokeDasharray="1.5 2.5" />
        <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(0, 240, 255, 0.08)" strokeDasharray="2 3" />
        
        <text x="50" y="27" fill="rgba(140, 160, 184, 0.5)" fontSize="1.4" textAnchor="middle" fontFamily="var(--font-mono)">
          ORBIT 1 · DIRECT CONNECTIONS
        </text>
        <text x="50" y="11" fill="rgba(140, 160, 184, 0.35)" fontSize="1.3" textAnchor="middle" fontFamily="var(--font-mono)">
          ORBIT 2 · MULTI-HOP REACH
        </text>

        {/* Connecting Radial Threads */}
        {allActiveEdges.map((edge, idx) => {
          const sPos = positionedNodes[edge.source];
          const tPos = positionedNodes[edge.target];
          if (!sPos || !tPos) return null;
          const isDirect = edge.source === centerEntityId || edge.target === centerEntityId;

          return (
            <g
              key={edge.id}
              className={isDirect ? 'graph-edge graph-edge-active' : 'graph-edge'}
              onClick={() => onSelectEdgeRecord && onSelectEdgeRecord(edge.recordId)}
            >
              <line x1={sPos.x} y1={sPos.y} x2={tPos.x} y2={tPos.y} className="thread-base" />
              <line x1={sPos.x} y1={sPos.y} x2={tPos.x} y2={tPos.y} className="thread-pulse" />

              {/* Luminous Animated Photon */}
              <circle
                r={isDirect ? 0.9 : 0.55}
                fill={isDirect ? '#00f0ff' : 'rgba(0, 240, 255, 0.7)'}
                filter={isDirect ? 'url(#radial-glow)' : undefined}
                className="photon-particle"
              >
                <animateMotion
                  dur={isDirect ? '1.8s' : '3.6s'}
                  repeatCount="indefinite"
                  path={`M ${sPos.x} ${sPos.y} L ${tPos.x} ${tPos.y}`}
                />
              </circle>

              <text x={(sPos.x + tPos.x) / 2} y={(sPos.y + tPos.y) / 2 - 1} className="edge-label">
                {edge.label}
              </text>
            </g>
          );
        })}

        {/* Positioned Nodes */}
        {Object.entries(positionedNodes).map(([nodeId, pos]) => {
          const node = allNodes.find((n) => n.id === nodeId);
          if (!node) return null;
          const isCenter = nodeId === centerEntityId;

          const isSelected = nodeId === selectedEntityId || isCenter;

          return (
            <g
              key={nodeId}
              className={`graph-node ${isSelected ? 'graph-node-active graph-node-focused' : 'graph-node-path'}`}
              transform={`translate(${pos.x}, ${pos.y})`}
              onClick={() => onSelectEntity(nodeId)}
              style={{ outline: 'none' }}
            >
              {/* Active Radar Pulse */}
              {isSelected && (
                <circle
                  r={isCenter ? 6.5 : 4.5}
                  fill="none"
                  stroke="#00f0ff"
                  className="active-radar-ring"
                />
              )}

              {/* Main Node Circle */}
              <circle r={isCenter ? 6 : 4} />

              {/* Active Beacon Dot */}
              {isSelected && (
                <circle
                  cx={isCenter ? 4.2 : 3}
                  cy={isCenter ? -4.2 : -3}
                  r={1.1}
                  fill="#00f0ff"
                  filter="url(#radial-glow)"
                  className="blink"
                />
              )}

              <text
                y="9"
                className={`node-name ${isSelected ? 'font-semibold' : ''}`}
                style={{ fill: isSelected ? '#ffffff' : undefined }}
              >
                {node.name}
              </text>

              {/* Active Status Badge vs Regular Label */}
              {isSelected ? (
                <g transform="translate(0, 13)">
                  <rect
                    x="-8"
                    y="-2"
                    width="16"
                    height="3.2"
                    rx="1.6"
                    fill="rgba(0, 240, 255, 0.22)"
                    stroke="rgba(0, 240, 255, 0.75)"
                    strokeWidth="0.3"
                  />
                  <text
                    y="0.3"
                    fill="#00f0ff"
                    fontSize="1.5"
                    textAnchor="middle"
                    fontFamily="var(--font-mono)"
                    fontWeight="bold"
                    letterSpacing="0.05em"
                  >
                    ● ACTIVE
                  </text>
                </g>
              ) : (
                <text y="12.8" className="node-type">
                  {node.type}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
