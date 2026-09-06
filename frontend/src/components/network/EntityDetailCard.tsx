import React from 'react';
import { 
  X, 
  Orbit, 
  ArrowRight, 
  FileText, 
  Sparkles, 
  Layers, 
  ExternalLink,
  ShieldAlert,
  Activity
} from 'lucide-react';
import { 
  NEXUS_NODES, 
  NEXUS_EDGES, 
  NEXUS_ENTITY_ICONS, 
  NEXUS_ENTITY_TONES,
  NexusNode,
  NexusEdge
} from '../../services/nexusData';
import { useIntelData } from '../../context/IntelDataContext';

interface EntityDetailCardProps {
  entityId: string;
  onClose: () => void;
  onSelectEntity?: (entityId: string) => void;
  onViewRadialOrbit?: (entityId: string) => void;
  onOpenEvidenceModal?: (recordId: string) => void;
  onNavigateToProfile?: (entityId: string) => void;
  className?: string;
}

export const EntityDetailCard: React.FC<EntityDetailCardProps> = ({
  entityId,
  onClose,
  onSelectEntity,
  onViewRadialOrbit,
  onOpenEvidenceModal,
  onNavigateToProfile,
  className = '',
}) => {
  const { nodes, edges } = useIntelData();
  const allNodes = nodes.length > 0 ? nodes : NEXUS_NODES;
  const allEdges = edges.length > 0 ? edges : NEXUS_EDGES;

  const entity = allNodes.find((n) => n.id === entityId) || allNodes[0];
  if (!entity) return null;

  const tone = NEXUS_ENTITY_TONES[entity.type] || 'signal';
  const icon = NEXUS_ENTITY_ICONS[entity.type] || '▣';

  // Find all direct relationships
  const connectedEdges = allEdges.filter(
    (e) => e.source === entity.id || e.target === entity.id
  );

  const risk = entity.riskScore ?? 75;
  const riskColor = risk >= 80 ? 'text-warn' : risk >= 60 ? 'text-signal' : 'text-safe';
  const riskBorder = risk >= 80 ? 'border-warn/40' : risk >= 60 ? 'border-signal/40' : 'border-safe/40';

  return (
    <div 
      className={`glass rounded-xl border border-signal/30 p-4 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 font-body select-none ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(12, 20, 37, 0.95) 0%, rgba(5, 8, 17, 0.98) 100%)',
      }}
    >
      {/* Top HUD Header with Close Action */}
      <div className="flex items-center justify-between pb-2.5 border-b border-signal/15">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-signal blink" />
          <span className="text-[10px] tracking-[0.22em] font-mono text-signal font-semibold">
            ENTITY DOSSIER
          </span>
          <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-void/80 border border-signal/15">
            {entity.id}
          </span>
          <span className="text-[9px] font-mono text-safe font-semibold px-1.5 py-0.5 rounded bg-safe/10 border border-safe/30 flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-safe blink" />
            ACTIVE
          </span>
        </div>

        <button
          onClick={onClose}
          className="size-6 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-signal/15 transition"
          title="Close Card"
          aria-label="Close entity detail card"
        >
          <X className="size-3.5" />
        </button>
      </div>

      {/* Main Subject Identification */}
      <div className="flex items-center gap-3 mt-3">
        <div className={`entity-icon entity-icon-${tone} shrink-0`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-base font-semibold text-foreground truncate">
            {entity.name}
          </div>
          <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-1.5 mt-0.5">
            <span className="text-signal font-medium">{entity.type}</span>
            <span>·</span>
            <span className="truncate">{entity.subtitle}</span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-signal/10 text-center font-mono">
        <div className="p-2 rounded bg-void/70 border border-signal/15">
          <div className="text-[9px] text-muted-foreground uppercase">CONNECTIONS</div>
          <div className="text-xs font-semibold text-foreground mt-0.5">{entity.connections}</div>
        </div>
        <div className="p-2 rounded bg-void/70 border border-signal/15">
          <div className="text-[9px] text-muted-foreground uppercase">CASES</div>
          <div className="text-xs font-semibold text-foreground mt-0.5">{entity.cases}</div>
        </div>
        <div className={`p-2 rounded bg-void/70 border ${riskBorder}`}>
          <div className="text-[9px] text-muted-foreground uppercase">RISK LEVEL</div>
          <div className={`text-xs font-semibold mt-0.5 ${riskColor}`}>{risk}%</div>
        </div>
      </div>

      {/* Direct Connected Relationships (Top 4) */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground mb-1.5">
          <span>ACTIVE NETWORK LINKS ({connectedEdges.length})</span>
          <span className="text-[9px] text-signal/70">CLICK TO FOCUS</span>
        </div>

        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
          {connectedEdges.length === 0 ? (
            <div className="text-[11px] text-muted-foreground font-mono italic py-2 text-center">
              No active links under current filter
            </div>
          ) : (
            connectedEdges.slice(0, 4).map((edge) => {
              const otherId = edge.source === entity.id ? edge.target : edge.source;
              const otherNode = allNodes.find((n) => n.id === otherId);
              const otherTone = NEXUS_ENTITY_TONES[otherNode?.type || 'PERSON'] || 'signal';
              const otherIcon = NEXUS_ENTITY_ICONS[otherNode?.type || 'PERSON'] || '▣';

              return (
                <div
                  key={edge.id}
                  className="flex items-center justify-between p-1.5 rounded bg-void/50 border border-signal/10 hover:border-signal/30 transition group"
                >
                  <button
                    onClick={() => onSelectEntity && onSelectEntity(otherId)}
                    className="flex items-center gap-2 min-w-0 text-left flex-1"
                    title={`Focus on ${otherNode?.name}`}
                  >
                    <span className={`text-${otherTone} font-mono text-xs shrink-0`}>
                      {otherIcon}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[11px] font-medium text-foreground group-hover:text-signal truncate transition">
                        {otherNode?.name || otherId}
                      </div>
                      <div className="text-[9px] font-mono text-muted-foreground truncate">
                        {edge.label} · {edge.sourceType}
                      </div>
                    </div>
                  </button>

                  {/* Forensic Evidence Quick Link */}
                  {onOpenEvidenceModal && (
                    <button
                      onClick={() => onOpenEvidenceModal(edge.recordId)}
                      className="shrink-0 p-1 text-muted-foreground hover:text-signal transition"
                      title={`Inspect Source Record ${edge.recordId}`}
                      aria-label="Inspect evidence"
                    >
                      <FileText className="size-3" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Action Buttons Footer */}
      <div className="mt-3.5 pt-2.5 border-t border-signal/15 flex items-center justify-between gap-2 text-xs font-mono">
        {onViewRadialOrbit && (
          <button
            onClick={() => onViewRadialOrbit(entity.id)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-signal/15 border border-signal/30 text-signal hover:bg-signal/25 transition text-[11px]"
          >
            <Orbit className="size-3" />
            <span>Radial Orbit</span>
          </button>
        )}

        {onNavigateToProfile && (
          <button
            onClick={() => onNavigateToProfile(entity.id)}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition text-[11px] ml-auto"
          >
            <span>Full Profile</span>
            <ArrowRight className="size-3" />
          </button>
        )}
      </div>

      {/* Human-in-the-loop warning note */}
      <div className="mt-2 text-[9px] font-mono text-warn/80 flex items-center gap-1">
        <span>⚠</span>
        <span>HUMAN VERIFICATION REQUIRED</span>
      </div>
    </div>
  );
};
