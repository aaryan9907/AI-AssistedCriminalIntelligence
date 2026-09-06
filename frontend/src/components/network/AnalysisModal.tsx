import React, { useEffect, useState } from 'react';
import { 
  Cpu, 
  Network, 
  Search, 
  FileCheck, 
  CheckCircle2, 
  Sparkles,
  ShieldAlert
} from 'lucide-react';

interface AnalysisModalProps {
  isOpen: boolean;
  onComplete: () => void;
  onCancel?: () => void;
}

const ANALYSIS_STAGES = [
  {
    title: 'ANALYZING NETWORK',
    detail: 'Traversing 812 multi-modal graph edges across 14 case dockets...',
    icon: Network,
  },
  {
    title: 'RESOLVING ENTITY CONNECTIONS',
    detail: 'Disambiguating aliases, IMEI signatures, and commercial fleet registration...',
    icon: Search,
  },
  {
    title: 'TRACING MULTI-HOP RELATIONSHIPS',
    detail: 'Running bidirectional shortest-path heuristic (depth: 4 hops)...',
    icon: Cpu,
  },
  {
    title: 'CROSS-REFERENCING EVIDENCE',
    detail: 'Matching CDR #CDR-0087, ANPR #VEH-0231, and STR #TXN-9912 logs...',
    icon: FileCheck,
  },
  {
    title: 'POTENTIAL RELATIONSHIP DETECTED',
    detail: 'Evidence-backed 4-hop path isolated. Synthesizing investigative lead...',
    icon: CheckCircle2,
  },
];

export const AnalysisModal: React.FC<AnalysisModalProps> = ({ isOpen, onComplete, onCancel }) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStageIndex(0);
      return;
    }

    // Step through each of the 5 stages with smooth cadence
    const interval = setInterval(() => {
      setCurrentStageIndex((prev) => {
        if (prev < ANALYSIS_STAGES.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            onComplete();
          }, 800);
          return prev;
        }
      });
    }, 900);

    return () => clearInterval(interval);
  }, [isOpen, onComplete]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#050813]/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="hud-panel-glow w-full max-w-lg rounded-2xl border border-cyan-500/50 p-6 shadow-2xl relative overflow-hidden">
        {/* Animated Cyber Grid Accent in Modal */}
        <div className="absolute inset-0 cyber-grid-dense opacity-20 pointer-events-none" />

        {/* Modal Header */}
        <div className="relative z-10 flex items-center justify-between border-b border-cyan-500/20 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 animate-pulse">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-cyan-400 font-bold">
                AUTOMATED GRAPH INTELLIGENCE
              </span>
              <h3 className="font-mono text-base font-bold text-slate-100 uppercase tracking-wide">
                DISCOVERING HIDDEN RELATIONSHIPS
              </h3>
            </div>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 border border-cyan-500/30 text-cyan-400">
            STAGE {currentStageIndex + 1}/5
          </span>
        </div>

        {/* Stepper Pipeline */}
        <div className="relative z-10 my-6 space-y-4">
          {ANALYSIS_STAGES.map((stage, idx) => {
            const Icon = stage.icon;
            const isDone = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex;
            const isPending = idx > currentStageIndex;

            return (
              <div
                key={stage.title}
                className={`p-3 rounded-lg border transition-all duration-300 flex items-center gap-3 ${
                  isCurrent
                    ? 'bg-cyan-950/50 border-cyan-500/80 text-cyan-300 shadow-glow-cyan'
                    : isDone
                    ? 'bg-slate-900/40 border-slate-800 text-slate-400 opacity-75'
                    : 'bg-transparent border-slate-900 text-slate-600 opacity-40'
                }`}
              >
                <div
                  className={`p-1.5 rounded ${
                    isCurrent
                      ? 'bg-cyan-500/30 text-cyan-300 animate-spin'
                      : isDone
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-slate-800 text-slate-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold tracking-wider">{stage.title}</span>
                    {isDone && (
                      <span className="font-mono text-[10px] text-emerald-400 font-semibold">COMPLETE</span>
                    )}
                    {isCurrent && (
                      <span className="font-mono text-[10px] text-cyan-400 font-semibold animate-pulse">PROCESSING</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 font-sans">
                    {stage.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Telemetry Progress Indicator */}
        <div className="relative z-10 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
            <span>ALGORITHM: MULTI-HOP GRAPH TRAVERSAL</span>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-xs text-slate-500 hover:text-slate-300 hover:underline"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
