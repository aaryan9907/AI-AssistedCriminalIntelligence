import React from 'react';
import { 
  X, 
  Sparkles, 
  ExternalLink, 
  FileText, 
  Clock, 
  CheckCircle2, 
  ChevronRight,
  Shield,
  Layers,
  MapPin,
  Phone,
  Car,
  Building,
  User,
  AlertTriangle
} from 'lucide-react';
import { Entity, Relationship, InvestigativeLead, EvidenceRecord } from '../../types/intel';
import { CyberBadge } from '../common/CyberBadge';
import { HumanVerificationAlert } from '../common/HumanVerificationAlert';

interface InspectorDrawerProps {
  lead: InvestigativeLead | null;
  selectedEntity: Entity | null;
  selectedRelationship: Relationship | null;
  evidenceRecord: EvidenceRecord | null;
  onClose: () => void;
  onSelectEntityId: (id: string) => void;
  onOpenEvidenceModal: (evidenceId: string) => void;
  onToggleLeadVerification?: (leadId: string) => void;
}

export const InspectorDrawer: React.FC<InspectorDrawerProps> = ({
  lead,
  selectedEntity,
  selectedRelationship,
  evidenceRecord,
  onClose,
  onSelectEntityId,
  onOpenEvidenceModal,
  onToggleLeadVerification,
}) => {
  // If nothing is selected, drawer is hidden
  if (!lead && !selectedEntity && !selectedRelationship && !evidenceRecord) {
    return null;
  }

  return (
    <aside className="w-96 shrink-0 bg-[#070d1e]/95 border-l border-cyan-500/20 flex flex-col h-full overflow-y-auto p-4 select-none z-30 shadow-2xl">
      {/* Header with Close */}
      <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-cyan-400 font-bold">
            INTELLIGENCE DOSSIER
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="py-4 space-y-5">
        {/* CASE 1: POTENTIAL INVESTIGATIVE LEAD */}
        {lead && (
          <div className="space-y-4">
            {/* Title & Badge */}
            <div className="hud-panel-glow rounded-xl p-4 border border-cyan-500/40">
              <div className="flex items-center gap-1.5 text-cyan-400 text-[10px] font-mono uppercase font-bold tracking-widest mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>POTENTIAL INVESTIGATIVE LEAD</span>
              </div>
              <h3 className="font-mono text-lg font-bold text-slate-100">{lead.title}</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{lead.relationshipType}</p>

              {/* Metric Grid */}
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800 text-center font-mono">
                <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">PATH LENGTH</div>
                  <div className="text-sm font-bold text-purple-300">{lead.pathLength} HOPS</div>
                </div>
                <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">CONFIDENCE</div>
                  <div className="text-sm font-bold text-cyan-300">
                    {Math.round(lead.confidenceScore * 100)}%
                  </div>
                </div>
                <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">RECORDS</div>
                  <div className="text-sm font-bold text-amber-300">{lead.supportingRecordCount}</div>
                </div>
              </div>
            </div>

            {/* Why Flagged */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                WHY FLAGGED
              </span>
              <ul className="space-y-1.5 text-xs text-slate-300 font-sans">
                {lead.whyFlagged.map((item, idx) => (
                  <li
                    key={idx}
                    className="p-2 rounded bg-slate-900/60 border border-slate-800 flex items-start gap-2"
                  >
                    <span className="text-cyan-400 font-mono font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Sequential Path Breakdown */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                RELATIONSHIP PATH TRACE
              </span>
              <div className="space-y-2 p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs">
                {lead.path.map((step, idx) => (
                  <div key={step.entityId} className="space-y-1">
                    <div
                      onClick={() => onSelectEntityId(step.entityId)}
                      className="cursor-pointer p-2 rounded bg-slate-900 border border-slate-700 hover:border-cyan-400 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 font-mono">0{idx + 1}.</span>
                        <span className="font-bold text-slate-200">{step.entityName}</span>
                      </div>
                      <CyberBadge type={step.entityType} size="sm" />
                    </div>

                    {step.stepEdge && (
                      <div className="px-3 py-1 flex items-center justify-between text-[10px] text-cyan-400/80">
                        <div className="flex items-center gap-1.5">
                          <span>↓</span>
                          <span className="uppercase">{step.stepEdge.relationshipType}</span>
                        </div>
                        <button
                          onClick={() => onOpenEvidenceModal(step.stepEdge!.evidenceId)}
                          className="text-amber-400 hover:underline flex items-center gap-1"
                        >
                          <span>#{step.stepEdge.evidenceId}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Supporting Evidence Records */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                SUPPORTING EVIDENCE RECORDS
              </span>
              <div className="space-y-1.5">
                {lead.evidenceRecordIds.map((recId) => (
                  <div
                    key={recId}
                    onClick={() => onOpenEvidenceModal(recId)}
                    className="cursor-pointer p-2.5 rounded bg-slate-900/80 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/40 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <FileText className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-cyan-300 font-semibold">Record #{recId}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1 hover:text-slate-200">
                      <span>View Source</span>
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Human Verification Required Alert */}
            <HumanVerificationAlert
              leadId={lead.id}
              isVerified={lead.status === 'VERIFIED'}
              onToggleVerification={() => onToggleLeadVerification && onToggleLeadVerification(lead.id)}
            />
          </div>
        )}

        {/* CASE 2: SELECTED ENTITY */}
        {!lead && selectedEntity && (
          <div className="space-y-4 font-mono">
            {/* Entity Header Card */}
            <div className="hud-panel rounded-xl p-4 border border-cyan-500/30">
              <div className="flex items-center justify-between mb-2">
                <CyberBadge type={selectedEntity.type} size="md" />
                <span className="text-xs text-cyan-400 font-bold">{selectedEntity.id}</span>
              </div>
              <h3 className="text-xl font-bold text-slate-100">{selectedEntity.name}</h3>

              {selectedEntity.aliases && selectedEntity.aliases.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {selectedEntity.aliases.map((alias) => (
                    <span
                      key={alias}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700"
                    >
                      aka "{alias}"
                    </span>
                  ))}
                </div>
              )}

              {/* Anomaly & Risk Score */}
              <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">ANOMALY INDEX:</span>
                <span
                  className={`font-bold ${
                    (selectedEntity.riskScore || 0) > 75 ? 'text-rose-400' : 'text-cyan-400'
                  }`}
                >
                  {selectedEntity.riskScore || 65}/100
                </span>
              </div>
            </div>

            {/* Entity Details Specific to Type */}
            <div className="space-y-2 text-xs">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                ENTITY PROFILE ATTRIBUTES
              </span>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                {selectedEntity.details.phone && (
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-500">PHONE:</span>
                    <span>{selectedEntity.details.phone}</span>
                  </div>
                )}
                {selectedEntity.details.vehicleReg && (
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-500">REGISTRATION:</span>
                    <span className="text-amber-300">{selectedEntity.details.vehicleReg}</span>
                  </div>
                )}
                {selectedEntity.details.vehicleType && (
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-500">MAKE / MODEL:</span>
                    <span>{selectedEntity.details.vehicleType}</span>
                  </div>
                )}
                {selectedEntity.details.owner && (
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-500">REGISTERED OWNER:</span>
                    <span className="text-purple-300">{selectedEntity.details.owner}</span>
                  </div>
                )}
                {selectedEntity.details.organization && (
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-500">ORGANIZATION:</span>
                    <span>{selectedEntity.details.organization}</span>
                  </div>
                )}
                {selectedEntity.details.accountNumber && (
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-500">BANK ACCOUNT:</span>
                    <span className="text-yellow-300">{selectedEntity.details.accountNumber}</span>
                  </div>
                )}
                {selectedEntity.details.address && (
                  <div className="flex flex-col gap-0.5 text-slate-300">
                    <span className="text-slate-500">KNOWN ADDRESS:</span>
                    <span className="text-[11px] text-slate-300 font-sans">{selectedEntity.details.address}</span>
                  </div>
                )}
                {selectedEntity.details.status && (
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-500">STATUS:</span>
                    <span className="text-cyan-300">{selectedEntity.details.status}</span>
                  </div>
                )}
                {selectedEntity.details.communicationCount && (
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-500">CALL VOLUME:</span>
                    <span>{selectedEntity.details.communicationCount} Calls</span>
                  </div>
                )}
              </div>
            </div>

            {/* Related Cases */}
            {selectedEntity.details.cases && selectedEntity.details.cases.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  ASSOCIATED CASE DOCKETS
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedEntity.details.cases.map((cId: string) => (
                    <span
                      key={cId}
                      className="px-2 py-1 rounded bg-rose-950/40 text-rose-300 border border-rose-500/30 text-xs"
                    >
                      {cId}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-center">
                <div className="text-[10px] text-slate-500 uppercase">CONNECTIONS</div>
                <div className="text-base font-bold text-cyan-400">
                  {selectedEntity.metrics.connectionCount}
                </div>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-center">
                <div className="text-[10px] text-slate-500 uppercase">RELATED CASES</div>
                <div className="text-base font-bold text-blue-400">
                  {selectedEntity.metrics.caseCount}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CASE 3: SELECTED RELATIONSHIP / EDGE */}
        {!lead && !selectedEntity && selectedRelationship && (
          <div className="space-y-4 font-mono">
            <div className="hud-panel rounded-xl p-4 border border-cyan-500/30">
              <div className="text-[10px] text-cyan-400 uppercase tracking-widest font-bold mb-1">
                EDGE EVIDENCE TRACE
              </div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>{selectedRelationship.source}</span>
                <span className="text-cyan-400">──▶</span>
                <span>{selectedRelationship.target}</span>
              </h3>
              <div className="mt-2 flex items-center justify-between">
                <CyberBadge type={selectedRelationship.type} size="sm" />
                <span className="text-xs text-cyan-300">
                  {Math.round(selectedRelationship.confidence * 100)}% Confidence
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-500">SOURCE RECORD:</span>
                <button
                  onClick={() => onOpenEvidenceModal(selectedRelationship.evidenceRecordId)}
                  className="text-cyan-400 hover:underline flex items-center gap-1 font-bold"
                >
                  <span>#{selectedRelationship.evidenceRecordId}</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-500">TIMESTAMP:</span>
                <span>{selectedRelationship.timestamp}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-500">CASE DOCKET:</span>
                <span className="text-rose-300">{selectedRelationship.caseId}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 text-xs font-sans text-slate-300 leading-relaxed">
              <span className="block text-[10px] font-mono text-slate-500 uppercase mb-1">
                EVIDENCE SUMMARY
              </span>
              {selectedRelationship.description}
            </div>

            <button
              onClick={() => onOpenEvidenceModal(selectedRelationship.evidenceRecordId)}
              className="w-full py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>INSPECT RAW RECORD</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
