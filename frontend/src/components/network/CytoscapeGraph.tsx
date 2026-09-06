import React, { useEffect, useRef } from 'react';
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
  Calendar
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

  // Initialize and update Cytoscape instance
  useEffect(() => {
    if (!containerRef.current) return;

    // Convert entities to Cytoscape nodes with custom SVG icons
    const nodes = entities.map((entity) => {
      const style = ENTITY_STYLES[entity.type] || { shape: 'ellipse', bg: '#334155', border: '#94a3b8' };
      const icon = ENTITY_ICONS[entity.type] || ENTITY_ICONS.PERSON;
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
        },
      };
    });

    // Convert relationships to Cytoscape edges
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
        // Base Node Style with Custom SVG Icon
        {
          selector: 'node',
          style: {
            'background-color': 'data(bgColor)',
            'border-color': 'data(borderColor)',
            'border-width': 2,
            'shape': 'data(shape)' as any,
            'width': 44,
            'height': 44,
            'background-image': 'data(nodeIcon)',
            'background-fit': 'none',
            'background-width': '22px',
            'background-height': '22px',
            'background-image-opacity': 0.95,
            'background-position-x': '50%',
            'background-position-y': '50%',
            'label': 'data(label)',
            'color': '#e2e8f0',
            'font-family': 'Inter, sans-serif',
            'font-size': '10px',
            'font-weight': 600,
            'text-valign': 'bottom',
            'text-margin-y': 7,
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
        // Base Edge Style
        {
          selector: 'edge',
          style: {
            'width': 1.5,
            'line-color': 'rgba(0, 240, 255, 0.25)',
            'curve-style': 'bezier',
            'target-arrow-shape': 'triangle',
            'target-arrow-color': 'rgba(0, 240, 255, 0.45)',
            'arrow-scale': 0.8,
            'label': 'data(label)',
            'color': '#64748b',
            'font-family': 'JetBrains Mono, monospace',
            'font-size': '8px',
            'text-rotation': 'autorotate',
            'text-background-opacity': 0.8,
            'text-background-color': '#060a16',
            'text-background-padding': '2px',
            'transition-property': 'line-color, width, opacity',
            'transition-duration': 0.3,
          },
        },
        // Selected Node Style
        {
          selector: 'node:selected, node.highlighted',
          style: {
            'border-color': '#00f0ff',
            'border-width': 4,
            'width': 52,
            'height': 52,
            'background-width': '26px',
            'background-height': '26px',
            'color': '#00f0ff',
            'text-border-color': '#00f0ff',
          },
        },
        // Discovered Path Node Style
        {
          selector: 'node.path-node',
          style: {
            'border-color': '#00f0ff',
            'border-width': 4,
            'width': 54,
            'height': 54,
            'background-width': '28px',
            'background-height': '28px',
            'color': '#00f0ff',
            'text-border-color': '#00f0ff',
            'background-color': '#0284c7',
          },
        },
        // Discovered Path Edge Style
        {
          selector: 'edge.path-edge',
          style: {
            'width': 4,
            'line-color': '#00f0ff',
            'line-style': 'dashed',
            'line-dash-pattern': [8, 4],
            'target-arrow-shape': 'triangle',
            'target-arrow-color': '#00f0ff',
            'arrow-scale': 1.2,
            'color': '#00f0ff',
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
            'opacity': 0.08,
          },
        },
      ],
      layout: {
        name: layoutName === 'cose' ? 'cose' : layoutName,
        animate: false,
        padding: 40,
        componentSpacing: 80,
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

    cyRef.current = cy;

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
      cancelAnimationFrame(animFrameId);
      cy.destroy();
    };
  }, [entities, relationships, layoutName]);

  // Handle Selection & Dimming
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    cy.batch(() => {
      cy.elements().removeClass('highlighted dimmed path-node path-edge');

      if (selectedEntityId) {
        const selectedNode = cy.getElementById(selectedEntityId);
        if (selectedNode.length > 0) {
          const neighborhood = selectedNode.neighborhood().add(selectedNode);
          cy.elements().difference(neighborhood).addClass('dimmed');
          selectedNode.addClass('highlighted');
          neighborhood.edges().addClass('highlighted');

          cy.animate({
            center: { eles: selectedNode },
            zoom: 1.3,
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
  }, [selectedEntityId, selectedEdgeId]);

  // WOW MOMENT: Sequential Path Highlight Animation
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

    highlightPath.forEach((nodeId, idx) => {
      setTimeout(() => {
        const node = cy.getElementById(nodeId);
        if (node.length > 0) {
          node.removeClass('dimmed').addClass('path-node');

          node.animate({
            style: {
              width: 60,
              height: 60,
            },
            duration: 200,
            complete: () => {
              node.animate({
                style: {
                  width: 52,
                  height: 52,
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
          padding: 80,
        },
        duration: 800,
      });
    }, delay + 200);
  }, [highlightPath]);

  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.25);
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() * 0.8);
  const handleFit = () => cyRef.current?.fit(undefined, 50);
  const handleReset = () => {
    onClearSelection();
    cyRef.current?.elements().removeClass('highlighted dimmed path-node path-edge');
    cyRef.current?.fit(undefined, 50);
  };

  return (
    <div className="relative w-full h-full bg-[#050813] overflow-hidden cyber-grid">
      <div className="absolute inset-0 scanline-overlay pointer-events-none" />

      {/* Cytoscape Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating Canvas Controls (HUD Overlay) */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5 bg-slate-950/80 p-1.5 rounded-lg border border-cyan-500/30 backdrop-blur-md">
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
      <div className="absolute bottom-4 left-4 z-20 hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-950/90 border border-slate-800 text-[10px] font-mono text-slate-400 backdrop-blur-md overflow-x-auto no-scrollbar max-w-[calc(100%-100px)]">
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
