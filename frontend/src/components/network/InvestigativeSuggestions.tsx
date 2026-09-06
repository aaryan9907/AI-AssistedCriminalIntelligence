import React from 'react';
import { 
  Sparkles, 
  Lightbulb, 
  ArrowRight, 
  ShieldAlert, 
  Activity, 
  Compass, 
  CheckCircle, 
  Layers 
} from 'lucide-react';
import { NEXUS_SUGGESTIONS, NexusSuggestion } from '../../services/nexusData';
import { useIntelData } from '../../context/IntelDataContext';

interface InvestigativeSuggestionsProps {
  onApplySuggestion: (suggestion: NexusSuggestion) => void;
  activeSuggestionId?: string | null;
  suggestions?: NexusSuggestion[];
}

export const InvestigativeSuggestions: React.FC<InvestigativeSuggestionsProps> = ({
  onApplySuggestion,
  activeSuggestionId,
  suggestions: propSuggestions,
}) => {
  const intelData = useIntelData();
  const displaySuggestions = propSuggestions || (intelData?.suggestions?.length ? intelData.suggestions : NEXUS_SUGGESTIONS);

  return (
    <div className="glass rounded-xl p-4 border-signal/20 font-body">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-signal animate-pulse" />
          <div className="text-[10px] tracking-[0.22em] font-mono text-signal/80 uppercase">
            AI-ASSISTED INVESTIGATIVE SUGGESTIONS
          </div>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground">
          {displaySuggestions.length} LEADS GENERATED
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
        {displaySuggestions.map((sug) => {
          const isActive = sug.id === activeSuggestionId;

          return (
            <div
              key={sug.id}
              className={`p-3 rounded-lg border transition-all text-left flex flex-col justify-between ${
                isActive
                  ? 'bg-signal/15 border-signal/60 shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                  : 'bg-ink/50 border-signal/10 hover:border-signal/30'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span
                    className={`font-mono text-[9px] px-1.5 py-0.5 rounded border uppercase font-semibold ${
                      sug.category === 'ANOMALY'
                        ? 'bg-warn/15 text-warn border-warn/30'
                        : sug.category === 'VERIFY'
                        ? 'bg-azure/15 text-azure border-azure/30'
                        : 'bg-signal/15 text-signal border-signal/30'
                    }`}
                  >
                    {sug.category === 'ANOMALY'
                      ? 'ANOMALOUS BRIDGE'
                      : sug.category === 'VERIFY'
                      ? 'TELECOM BURST'
                      : 'INVESTIGATIVE LEAD'}
                  </span>
                  <span className="font-mono text-[10px] text-signal font-semibold">
                    {(sug.confidence * 100).toFixed(0)}% CONFIDENCE
                  </span>
                </div>

                <h4 className="font-display text-sm font-semibold text-foreground mt-1">
                  {sug.title}
                </h4>

                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                  {sug.description}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between">
                <span className="text-[9px] font-mono text-muted-foreground">
                  Human verification required
                </span>
                <button
                  onClick={() => onApplySuggestion(sug)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium bg-signal/15 border border-signal/40 text-signal hover:bg-signal/25 transition"
                >
                  <span>{sug.actionLabel}</span>
                  <ArrowRight className="size-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
