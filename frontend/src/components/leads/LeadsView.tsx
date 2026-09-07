import React, { useState } from 'react';
import { ShieldAlert, ArrowRight, CheckCircle, AlertCircle, Sparkles, FileText, ChevronRight } from 'lucide-react';
import { NavSection } from '../layout/SidebarNav';
import { useIntelData } from '../../context/IntelDataContext';
import { NEXUS_NODES, NEXUS_EVIDENCE, NEXUS_SUGGESTIONS } from '../../services/nexusData';
import { getEntityDisplayName } from '../../services/canonicalEntities';

interface LeadsViewProps {
  leads?: any[];
  onSelectLead?: (lead: any) => void;
  onOpenEvidenceModal?: (recordId: string) => void;
  onToggleVerification?: (leadId: string) => void;
  onNavigate?: (section: NavSection) => void;
}

export const LeadsView: React.FC<LeadsViewProps> = ({
  onNavigate,
  onOpenEvidenceModal,
}) => {
  const { nodes, evidence, suggestions, hiddenPath, isCustomDataset } = useIntelData();

  const allSuggestions = suggestions.length > 0 ? suggestions : NEXUS_SUGGESTIONS;
  const allNodes = nodes.length > 0 ? nodes : NEXUS_NODES;
  const allEvidence = evidence.length > 0 ? evidence : NEXUS_EVIDENCE;

  const [selectedLeadIndex, setSelectedLeadIndex] = useState<number>(0);
  const activeLead = allSuggestions[selectedLeadIndex] || allSuggestions[0];

  // Resolve start and target node
  const startNode = allNodes.find((n) => n.id === hiddenPath[0]) || allNodes[0];
  const endNode = allNodes.find((n) => n.id === hiddenPath[hiddenPath.length - 1]) || allNodes[1] || startNode;

  const leadTitle = activeLead
    ? activeLead.title
    : `${startNode?.name} ↔ ${endNode?.name}`;

  const pathLength = hiddenPath.length > 1 ? hiddenPath.length - 1 : 4;
  const confidencePercent = Math.round((activeLead?.confidence ?? 0.87) * 100);

  return (
    <main className="p-6 font-body max-w-5xl space-y-6">
      {/* Lead Selector Tabs / List if multiple leads exist */}
      {allSuggestions.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {allSuggestions.map((sug, idx) => (
            <button
              key={sug.id}
              onClick={() => setSelectedLeadIndex(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-2 border ${
                selectedLeadIndex === idx
                  ? 'bg-signal/20 border-signal text-signal shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                  : 'bg-panel/70 border-signal/15 text-muted-foreground hover:text-foreground hover:border-signal/30'
              }`}
            >
              <ShieldAlert className="size-3 text-warn" />
              <span>LEAD #{idx + 1}: {sug.title}</span>
            </button>
          ))}
        </div>
      )}

      <div className="glass rounded-xl p-6 border-warn/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-warn">
            <ShieldAlert className="size-4 animate-pulse" />
            <span className="font-mono text-[10px] tracking-[0.2em]">
              POTENTIAL INVESTIGATIVE LEAD · AI SURFACED
            </span>
          </div>

          <span className="font-mono text-[10px] px-2 py-0.5 rounded border border-signal/30 bg-signal/10 text-signal">
            CONFIDENCE SCORE {((activeLead?.confidence ?? 0.87)).toFixed(2)}
          </span>
        </div>

        <div className="font-display text-2xl text-foreground font-semibold mt-3">
          {leadTitle}
        </div>

        <p className="text-sm text-muted-foreground mt-1">
          {activeLead?.description || `Indirect multi-hop relationship across ${pathLength} hops detected in active records.`}
        </p>

        {/* Path Sequence Chips */}
        {hiddenPath.length > 1 && (
          <div className="mt-4 p-3 rounded-lg bg-void/70 border border-signal/15">
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2">
              DISCOVERED RELATIONSHIP PATHWAY
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              {hiddenPath.map((nodeId, idx) => {
                const node = allNodes.find((n) => n.id === nodeId);
                return (
                  <React.Fragment key={nodeId}>
                    <span className="px-2 py-1 rounded bg-panel/90 border border-signal/25 text-signal font-semibold">
                      {getEntityDisplayName(node || nodeId)}
                      <span className="text-[9px] text-muted-foreground ml-1.5 font-normal">
                        ({node?.type || 'ENTITY'})
                      </span>
                    </span>
                    {idx < hiddenPath.length - 1 && (
                      <span className="text-warn font-bold">→</span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          {[
            [String(pathLength), 'PATH HOPS'],
            [String(allEvidence.length), 'SUPPORTING RECORDS'],
            [String(allNodes.length), 'LINKED ENTITIES'],
            [`${confidencePercent}%`, 'CONFIDENCE SCORE'],
          ].map(([val, label]) => (
            <div key={label} className="rounded-lg bg-ink/50 border border-border p-3">
              <div className="font-display text-xl text-foreground font-semibold">{val}</div>
              <div className="font-mono text-[9px] text-muted-foreground mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Chain of Custody & Corroborating Evidence Records */}
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between">
            <div className="font-mono text-[10px] text-muted-foreground uppercase">
              CORROBORATING SOURCE EVIDENCE RECORDS ({allEvidence.length})
            </div>
            <span className="text-[10px] font-mono text-signal/70">CLICK ANY RECORD TO AUDIT</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {allEvidence.slice(0, 6).map((ev) => (
              <button
                key={ev.id}
                onClick={() => onOpenEvidenceModal && onOpenEvidenceModal(ev.id)}
                className="text-left rounded-md bg-panel/70 border border-signal/15 p-3 hover:border-signal/40 transition flex items-center justify-between group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-signal font-semibold">{ev.id}</span>
                    <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.2 rounded bg-void/80 border border-border">
                      {ev.type}
                    </span>
                  </div>
                  <p className="text-[11px] text-foreground mt-1 truncate group-hover:text-signal transition">
                    {ev.title}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                    {ev.description}
                  </p>
                </div>
                <div className="ml-3 text-right shrink-0">
                  <span className="font-mono text-[11px] text-signal font-bold block">
                    {ev.confidence.toFixed(2)}
                  </span>
                  <span className="font-mono text-[9px] text-muted-foreground">
                    {ev.date}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Human Verification Warning Banner */}
        <div className="mt-6 rounded-md bg-warn/10 border border-warn/30 p-3 text-xs text-warn flex items-center gap-2.5">
          <AlertCircle className="size-4 shrink-0" />
          <span>
            <strong>HUMAN VERIFICATION MANDATE:</strong> This relationship is surfaced as an investigative lead derived from probabilistic algorithmic correlation. It is not conclusive proof of criminal liability.
          </span>
        </div>

        {/* Navigation Action */}
        {onNavigate && (
          <div className="mt-5 flex items-center justify-between">
            <button
              onClick={() => onNavigate('COMMAND_CENTER')}
              className="inline-flex items-center gap-2 text-xs text-signal font-medium hover:underline px-3 py-1.5 rounded bg-signal/10 border border-signal/25"
            >
              <span>Explore full path in Knowledge Graph</span>
              <ArrowRight className="size-3.5" />
            </button>
            
            <button
              onClick={() => onNavigate('EVIDENCE')}
              className="text-xs text-muted-foreground hover:text-foreground font-mono"
            >
              View all {allEvidence.length} evidence records →
            </button>
          </div>
        )}
      </div>
    </main>
  );
};
