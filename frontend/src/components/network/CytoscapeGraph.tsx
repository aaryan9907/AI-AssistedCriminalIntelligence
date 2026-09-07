import React, { useEffect, useRef, useMemo } from 'react';
import cytoscape, { Core, EventObject } from 'cytoscape';
import { Entity, Relationship, EntityType } from '../../types/intel';
import { 
  Maximize2, 
  ZoomIn, 
  ZoomOut, 
  RefreshCw,
  User,
  Smartphone,
  Car,
  MapPin,
  Building2,
  ShieldAlert,
  Landmark,
  Calendar,
  Activity
} from 'lucide-react';

interface CytoscapeGraphProps {
  entities: Entity[];
  relationships: Relationship[];
  selectedEntityId?: string | null;
  selectedEdgeId?: string | null;
  highlightPath?: string[] | null;
  layoutName?: string;
  onSelectNode: (entityId: string) => void;
  onSelectEdge: (edgeId: string) => void;
  onClearSelection: () => void;
}

interface AdaptiveGraphConfig {
  nodeBaseSize: number;
  iconSize: number;
  fontSize: string;
  textMargin: number;
  borderWidth: number;
  edgeWidth: number;
  edgeOpacity: number;
  showEdgeLabels: boolean;
  edgeFontSize: string;
  idealEdgeLength: number;
  nodeRepulsion: number;
  componentSpacing: number;
  padding: number;
  densityLabel: string;
  densityColor: string;
}

function getAdaptiveConfig(nodeCount: number, edgeCount: number): AdaptiveGraphConfig {
  if (nodeCount <= 12) {
    return {
      nodeBaseSize: 56,
      iconSize: 28,
      fontSize: '11px',
      textMargin: 8,
      borderWidth: 2.5,
      edgeWidth: 2.2,
      edgeOpacity: 0.38,
      showEdgeLabels: true,
      edgeFontSize: '8.5px',
      idealEdgeLength: 140,
      nodeRepulsion: 9500,
      componentSpacing: 110,
      padding: 60,
      densityLabel: 'FOCUSED CLUSTER',
      densityColor: 'text-emerald-400'
    };
  }
  if (nodeCount <= 30) {
    return {
      nodeBaseSize: 46,
      iconSize: 22,
      fontSize: '10px',
      textMargin: 7,
      borderWidth: 2.0,
      edgeWidth: 1.7,
      edgeOpacity: 0.28,
      showEdgeLabels: edgeCount <= 45,
      edgeFontSize: '8px',
      idealEdgeLength: 125,
      nodeRepulsion: 9000,
      componentSpacing: 95,
      padding: 45,
      densityLabel: 'BALANCED TOPOLOGY',
      densityColor: 'text-cyan-400'
    };
  }
  if (nodeCount <= 75) {
    return {
      nodeBaseSize: 36,
      iconSize: 18,
      fontSize: '8.5px',
      textMargin: 6,
      borderWidth: 1.8,
      edgeWidth: 1.2,
      edgeOpacity: 0.22,
      showEdgeLabels: false,
      edgeFontSize: '7px',
      idealEdgeLength: 115,
      nodeRepulsion: 10500,
      componentSpacing: 85,
      padding: 40,
      densityLabel: 'HIGH DENSITY CLUSTER',
      densityColor: 'text-amber-400'
    };
  }
  return {
    nodeBaseSize: 30,
    iconSize: 15,
    fontSize: '8px',
    textMargin: 6,
    borderWidth: 1.5,
    edgeWidth: 1.0,
    edgeOpacity: 0.16,
    showEdgeLabels: false,
    edgeFontSize: '6.5px',
    idealEdgeLength: 125,
    nodeRepulsion: 12500,
    componentSpacing: 85,
    padding: 35,
    densityLabel: 'MACRO ENTERPRISE GRAPH',
    densityColor: 'text-purple-400'
  };
}

const ENTITY_STYLES: Record<EntityType, { shape: string; bg: string; border: string }> = {
  PERSON: { shape: 'ellipse', bg: '#1d4ed8', border: '#60a5fa' },
  PHONE: { shape: 'round-rectangle', bg: '#0e7490', border: '#22d3ee' },
  VEHICLE: { shape: 'round-diamond', bg: '#b45309', border: '#fbbf24' },
  LOCATION: { shape: 'pentagon', bg: '#047857', border: '#34d399' },
  ORGANIZATION: { shape: 'round-rectangle', bg: '#7e22ce', border: '#c084fc' },
  CASE: { shape: 'hexagon', bg: '#be123c', border: '#fb7185' },
  'BANK ACCOUNT': { shape: 'tag', bg: '#a16207', border: '#fde047' },
  EVENT: { shape: 'diamond', bg: '#4338ca', border: '#818cf8' },
};

// Custom SVG Icons encoded as Data URIs for Cytoscape node rendering
const ENTITY_ICONS: Record<EntityType, string> = {
  PERSON: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2'/><circle cx='12' cy='7' r='4'/></svg>",
  PHONE: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect width='14' height='20' x='5' y='2' rx='2' ry='2'/><path d='M12 18h.01'/></svg>",
  VEHICLE: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2'/><circle cx='7' cy='17' r='2'/><path d='M9 17h6'/><circle cx='17' cy='17' r='2'/></svg>",
  LOCATION: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z'/><circle cx='12' cy='10' r='3'/></svg>",
  ORGANIZATION: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect width='16' height='20' x='4' y='2' rx='2' ry='2'/><path d='M9 22v-4h6v4'/><path d='M8 6h.01'/><path d='M16 6h.01'/><path d='M8 10h.01'/><path d='M16 10h.01'/><path d='M8 14h.01'/><path d='M16 14h.01'/></svg>",
  CASE: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10'/></svg>",
  'BANK ACCOUNT': "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><line x1='3' x2='21' y1='22' y2='22'/><line x1='6' x2='6' y1='18' y2='11'/><line x1='10' x2='10' y1='18' y2='11'/><line x1='14' x2='14' y1='18' y2='11'/><line x1='18' x2='18' y1='18' y2='11'/><polygon points='12 2 20 7 4 7'/></svg>",
  EVENT: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='10'/><polyline points='12 6 12 12 16 14'/></svg>"
};

export const CytoscapeGraph: React.FC<CytoscapeGraphProps> = ({
  entities,
  relationships,
  selectedEntityId,
  selectedEdgeId,
  highlightPath,
  layoutName = 'cose',
  onSelectNode,
  onSelectEdge,
  onClearSelection,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);

  const nodeCount = entities.length;
  const edgeCount = relationships.length;
  const adaptive = useMemo(() => getAdaptiveConfig(nodeCount, edgeCount), [nodeCount, edgeCount]);

  // Initialize and update Cytoscape instance with adaptive geometry
  useEffect(() => {
    if (!containerRef.current) return;

    // Calculate node degree for hub prominence weighting
    const degreeMap: Record<string, number> = {};
    relationships.forEach((r) => {
      degreeMap[r.source] = (degreeMap[r.source] || 0) + 1;
      degreeMap[r.target] = (degreeMap[r.target] || 0) + 1;
    });

    // Convert entities to Cytoscape nodes with adaptive dimensions
    const nodes = entities.map((entity) => {
      const style = ENTITY_STYLES[entity.type] || { shape: 'ellipse', bg: '#334155', border: '#94a3b8' };
      const icon = ENTITY_ICONS[entity.type] || ENTITY_ICONS.PERSON;
      const deg = degreeMap[entity.id] || 0;

      // Hub nodes scaled larger (+18%), isolated leaves scaled slightly smaller (-10%)
      const sizeMultiplier = deg >= 6 ? 1.18 : (deg <= 1 && nodeCount > 15 ? 0.90 : 1.0);
      const computedSize = Math.round(adaptive.nodeBaseSize * sizeMultiplier);
      const computedIconSize = `${Math.round(adaptive.iconSize * sizeMultiplier)}px`;

      return {
        data: {
          id: entity.id,
          label: entity.name,
          type: entity.type,
          bgColor: style.bg,
          borderColor: style.border,
          shape: style.shape,
          nodeIcon: icon,
          risk: entity.riskScore || 50,
          nodeSize: computedSize,
          iconSize: computedIconSize,
          degree: deg,
        },
      };
    });

    // Convert relationships to Cytoscape edges with adaptive styling
    const edges = relationships.map((rel) => ({
      data: {
        id: rel.id,
        source: rel.source,
        target: rel.target,
        label: rel.type,
        confidence: rel.confidence,
      },
    }));

    const cy = cytoscape({
      container: containerRef.current,
      elements: [...nodes, ...edges],
      style: [
        // Adaptive Base Node Style
        {
          selector: 'node',
          style: {
            'background-color': 'data(bgColor)',
            'border-color': 'data(borderColor)',
            'border-width': adaptive.borderWidth,
            'shape': 'data(shape)' as any,
            'width': 'data(nodeSize)' as any,
            'height': 'data(nodeSize)' as any,
            'background-image': 'data(nodeIcon)',
            'background-fit': 'none',
            'background-width': 'data(iconSize)' as any,
            'background-height': 'data(iconSize)' as any,
            'background-image-opacity': 0.95,
            'background-position-x': '50%',
            'background-position-y': '50%',
            'label': 'data(label)',
            'color': '#e2e8f0',
            'font-family': 'Inter, sans-serif',
            'font-size': adaptive.fontSize,
            'font-weight': 600,
            'text-valign': 'bottom',
            'text-margin-y': adaptive.textMargin,
            'text-max-width': '85px',
            'text-wrap': 'ellipsis',
            'min-zoomed-font-size': 6,
            'text-background-opacity': 0.88,
            'text-background-color': '#060a16',
            'text-background-padding': '3px',
            'text-background-shape': 'roundrectangle',
            'text-border-opacity': 0.4,
            'text-border-width': 1,
            'text-border-color': '#1e293b',
            'transition-property': 'background-color, border-color, width, height, opacity, border-width',
            'transition-duration': 0.3,
          },
        },
        // Adaptive Base Edge Style
        {
          selector: 'edge',
          style: {
            'width': adaptive.edgeWidth,
            'line-color': `rgba(0, 240, 255, ${adaptive.edgeOpacity})`,
            'curve-style': 'bezier',
            'target-arrow-shape': 'triangle',
            'target-arrow-color': `rgba(0, 240, 255, ${Math.min(0.65, adaptive.edgeOpacity + 0.15)})`,
            'arrow-scale': nodeCount > 50 ? 0.65 : 0.85,
            'label': adaptive.showEdgeLabels ? 'data(label)' : '',
            'color': '#64748b',
            'font-family': 'JetBrains Mono, monospace',
            'font-size': adaptive.edgeFontSize,
            'text-rotation': 'autorotate',
            'text-background-opacity': 0.8,
            'text-background-color': '#060a16',
            'text-background-padding': '2px',
            'transition-property': 'line-color, width, opacity',
            'transition-duration': 0.3,
          },
        },
        // Edge Hover / Selected Style (Reveals label even if hidden in dense mode!)
        {
          selector: 'edge:selected, edge.highlighted',
          style: {
            'width': Math.max(3.0, adaptive.edgeWidth * 2.2),
            'line-color': '#00f0ff',
            'target-arrow-color': '#00f0ff',
            'arrow-scale': 1.1,
            'opacity': 1.0,
            'label': 'data(label)',
            'color': '#00f0ff',
            'z-index': 999,
          },
        },
        // Selected Node Style
        {
          selector: 'node:selected, node.highlighted',
          style: {
            'border-color': '#00f0ff',
            'border-width': Math.max(3, adaptive.borderWidth * 1.8),
            'width': (ele: any) => Math.round((ele.data('nodeSize') || adaptive.nodeBaseSize) * 1.25),
            'height': (ele: any) => Math.round((ele.data('nodeSize') || adaptive.nodeBaseSize) * 1.25),
            'color': '#00f0ff',
            'text-border-color': '#00f0ff',
            'z-index': 999,
          },
        },
        // Discovered Path Node Style
        {
          selector: 'node.path-node',
          style: {
            'border-color': '#00f0ff',
            'border-width': Math.max(3.5, adaptive.borderWidth * 2),
            'width': (ele: any) => Math.round((ele.data('nodeSize') || adaptive.nodeBaseSize) * 1.28),
            'height': (ele: any) => Math.round((ele.data('nodeSize') || adaptive.nodeBaseSize) * 1.28),
            'color': '#00f0ff',
            'text-border-color': '#00f0ff',
            'background-color': '#0284c7',
            'z-index': 999,
          },
        },
        // Discovered Path Edge Style
        {
          selector: 'edge.path-edge',
          style: {
            'width': Math.max(3.5, adaptive.edgeWidth * 2.5),
            'line-color': '#00f0ff',
            'line-style': 'dashed',
            'line-dash-pattern': [8, 4],
            'target-arrow-shape': 'triangle',
            'target-arrow-color': '#00f0ff',
            'arrow-scale': 1.2,
            'label': 'data(label)',
            'color': '#00f0ff',
            'opacity': 1.0,
            'z-index': 999,
          },
        },
        // Dimmed State
        {
          selector: 'node.dimmed',
          style: {
            'opacity': 0.15,
          },
        },
        {
          selector: 'edge.dimmed',
          style: {
            'opacity': 0.05,
          },
        },
      ],
      layout: {
        name: layoutName === 'cose' ? 'cose' : layoutName,
        animate: false,
        padding: adaptive.padding,
        nodeDimensionsIncludeLabels: true,
        nodeRepulsion: () => adaptive.nodeRepulsion,
        idealEdgeLength: () => adaptive.idealEdgeLength,
        componentSpacing: adaptive.componentSpacing,
        nodeOverlap: 4,
        gravity: 0.18,
        edgeElasticity: 32,
        nestingFactor: 1.2,
        numIter: 1200,
      } as any,
    });

    // Event handlers
    cy.on('tap', 'node', (evt: EventObject) => {
      const node = evt.target;
      onSelectNode(node.id());
    });

    cy.on('tap', 'edge', (evt: EventObject) => {
      const edge = evt.target;
      onSelectEdge(edge.id());
    });

    cy.on('tap', (evt: EventObject) => {
      if (evt.target === cy) {
        onClearSelection();
      }
    });

    // Hover effect on edges to reveal relationship label in dense graphs
    cy.on('mouseover', 'edge', (evt: EventObject) => {
      const edge = evt.target;
      if (!edge.hasClass('dimmed')) {
        edge.addClass('highlighted');
      }
    });

    cy.on('mouseout', 'edge', (evt: EventObject) => {
      const edge = evt.target;
      if (!edge.selected()) {
        edge.removeClass('highlighted');
      }
    });

    cyRef.current = cy;

    // Automatic container resize observer
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        try {
          cy.resize();
        } catch {
          // Cy might be disposed
        }
      });
      resizeObserver.observe(containerRef.current);
    }

    // Continuous Animation Loop for Connecting Thread Dashes
    let dashOffset = 0;
    let animFrameId: number;
    const animateDashes = () => {
      dashOffset = (dashOffset + 1) % 48;
      try {
        const pathEdges = cy.edges('.path-edge');
        if (pathEdges.length > 0) {
          pathEdges.style('line-dash-offset', -dashOffset);
        }
      } catch {
        // Cy might be disposed
      }
      animFrameId = requestAnimationFrame(animateDashes);
    };
    animFrameId = requestAnimationFrame(animateDashes);

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      cancelAnimationFrame(animFrameId);
      cy.destroy();
    };
  }, [entities, relationships, layoutName, adaptive]);

  // Handle Selection & Dimming
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    cy.batch(() => {
      cy.elements().removeClass('highlighted dimmed path-node path-edge');

      if (selectedEntityId) {
        const selectedNode = cy.getElementById(selectedEntityId);
        if (selectedNode.length > 0) {
          let activeEles = selectedNode.neighborhood().add(selectedNode);

          // If there is an active highlightPath, preserve all path nodes and edges so multi-hop links stay connected and visible
          if (highlightPath && highlightPath.length > 0) {
            highlightPath.forEach((id) => {
              const pNode = cy.getElementById(id);
              if (pNode.length > 0) {
                activeEles = activeEles.add(pNode);
                pNode.addClass('path-node');
              }
            });
            for (let i = 0; i < highlightPath.length - 1; i++) {
              const u = highlightPath[i];
              const v = highlightPath[i + 1];
              const pEdges = cy.edges().filter((e) => {
                const s = e.data('source');
                const t = e.data('target');
                return (s === u && t === v) || (s === v && t === u);
              });
              if (pEdges.length > 0) {
                activeEles = activeEles.add(pEdges);
                pEdges.addClass('path-edge');
              }
            }
          }

          cy.elements().difference(activeEles).addClass('dimmed');
          selectedNode.addClass('highlighted');
          selectedNode.neighborhood().edges().addClass('highlighted');

          cy.animate({
            center: { eles: selectedNode },
            zoom: nodeCount > 50 ? 1.6 : 1.3,
            duration: 500,
          });
        }
      } else if (selectedEdgeId) {
        const edge = cy.getElementById(selectedEdgeId);
        if (edge.length > 0) {
          const connected = edge.connectedNodes().add(edge);
          cy.elements().difference(connected).addClass('dimmed');
          edge.addClass('path-edge');
        }
      }
    });
  }, [selectedEntityId, selectedEdgeId, nodeCount, highlightPath]);

  // Sequential Path Highlight Animation with adaptive scaling
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || !highlightPath || highlightPath.length === 0) return;

    cy.elements().removeClass('highlighted dimmed path-node path-edge');
    cy.elements().addClass('dimmed');

    const pathNodes = highlightPath.map((id) => cy.getElementById(id));
    const pathEdges: any[] = [];

    for (let i = 0; i < highlightPath.length - 1; i++) {
      const u = highlightPath[i];
      const v = highlightPath[i + 1];
      const edge = cy.edges().filter((e) => {
        const s = e.data('source');
        const t = e.data('target');
        return (s === u && t === v) || (s === v && t === u);
      });
      if (edge.length > 0) {
        pathEdges.push(edge[0]);
      }
    }

    let delay = 0;
    const stepDuration = 350;
    const targetPulseSize = Math.round(adaptive.nodeBaseSize * 1.38);
    const targetRestSize = Math.round(adaptive.nodeBaseSize * 1.24);

    highlightPath.forEach((nodeId, idx) => {
      setTimeout(() => {
        const node = cy.getElementById(nodeId);
        if (node.length > 0) {
          node.removeClass('dimmed').addClass('path-node');

          node.animate({
            style: {
              width: targetPulseSize,
              height: targetPulseSize,
            },
            duration: 200,
            complete: () => {
              node.animate({
                style: {
                  width: targetRestSize,
                  height: targetRestSize,
                },
                duration: 200,
              });
            },
          });
        }

        if (idx > 0 && pathEdges[idx - 1]) {
          const edge = pathEdges[idx - 1];
          edge.removeClass('dimmed').addClass('path-edge');
        }
      }, delay);

      delay += stepDuration;
    });

    setTimeout(() => {
      const allPathEles = cy.collection();
      pathNodes.forEach((n) => allPathEles.merge(n));
      pathEdges.forEach((e) => allPathEles.merge(e));

      cy.animate({
        fit: {
          eles: allPathEles,
          padding: adaptive.padding + 30,
        },
        duration: 800,
      });
    }, delay + 200);
  }, [highlightPath, adaptive]);

  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.25);
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() * 0.8);
  const handleFit = () => cyRef.current?.fit(undefined, adaptive.padding);
  const handleReset = () => {
    onClearSelection();
    cyRef.current?.elements().removeClass('highlighted dimmed path-node path-edge');
    cyRef.current?.fit(undefined, adaptive.padding);
  };

  return (
    <div className="relative w-full h-full bg-[#050813] overflow-hidden cyber-grid">
      <div className="absolute inset-0 scanline-overlay pointer-events-none" />

      {/* Adaptive Topology Scale & Density Indicator */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-slate-950/85 px-3 py-1.5 rounded-lg border border-cyan-500/30 backdrop-blur-md text-[11px] font-mono shadow-lg shadow-black/50">
        <Activity className={`w-3.5 h-3.5 ${adaptive.densityColor} animate-pulse`} />
        <span className="text-slate-400">ADAPTIVE GRAPH:</span>
        <span className={`font-semibold ${adaptive.densityColor}`}>{adaptive.densityLabel}</span>
        <span className="text-slate-500 text-[10px]">({entities.length} nodes · {relationships.length} links)</span>
      </div>

      {/* Cytoscape Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating Canvas Controls (HUD Overlay) */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5 bg-slate-950/80 p-1.5 rounded-lg border border-cyan-500/30 backdrop-blur-md shadow-lg shadow-black/50">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-1.5 rounded hover:bg-cyan-950/60 text-slate-400 hover:text-cyan-300 transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-1.5 rounded hover:bg-cyan-950/60 text-slate-400 hover:text-cyan-300 transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleFit}
          title="Fit Graph to Screen"
          className="p-1.5 rounded hover:bg-cyan-950/60 text-slate-400 hover:text-cyan-300 transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          onClick={handleReset}
          title="Reset Graph"
          className="p-1.5 rounded hover:bg-cyan-950/60 text-slate-400 hover:text-cyan-300 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Custom Icon Graph Legend Overlay at Bottom-Left */}
      <div className="absolute bottom-4 left-4 z-20 hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-950/90 border border-slate-800 text-[10px] font-mono text-slate-400 backdrop-blur-md overflow-x-auto no-scrollbar max-w-[calc(100%-100px)] shadow-lg shadow-black/50">
        <span className="text-slate-500 font-bold uppercase shrink-0">ENTITY TAXONOMY:</span>
        <div className="flex items-center gap-1 shrink-0 text-blue-400">
          <User className="w-3 h-3" />
          <span>Person</span>
        </div>
        <div className="flex items-center gap-1 shrink-0 text-cyan-400">
          <Smartphone className="w-3 h-3" />
          <span>Phone</span>
        </div>
        <div className="flex items-center gap-1 shrink-0 text-amber-400">
          <Car className="w-3 h-3" />
          <span>Vehicle</span>
        </div>
        <div className="flex items-center gap-1 shrink-0 text-emerald-400">
          <MapPin className="w-3 h-3" />
          <span>Location</span>
        </div>
        <div className="flex items-center gap-1 shrink-0 text-purple-400">
          <Building2 className="w-3 h-3" />
          <span>Org</span>
        </div>
        <div className="flex items-center gap-1 shrink-0 text-rose-400">
          <ShieldAlert className="w-3 h-3" />
          <span>Case</span>
        </div>
        <div className="flex items-center gap-1 shrink-0 text-yellow-300">
          <Landmark className="w-3 h-3" />
          <span>Account</span>
        </div>
        <div className="flex items-center gap-1 shrink-0 text-indigo-300">
          <Calendar className="w-3 h-3" />
          <span>Event</span>
        </div>
      </div>
    </div>
  );
};
