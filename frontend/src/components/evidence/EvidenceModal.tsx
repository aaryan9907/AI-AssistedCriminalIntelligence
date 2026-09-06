import React from 'react';
import { EvidenceRecord } from '../../types/intel';

interface EvidenceModalProps {
  record: EvidenceRecord | {
    id: string;
    type: string;
    title: string;
    description: string;
    date?: string;
    time?: string;
    timestamp?: string;
    caseId: string;
    confidence: number;
    source?: string;
  } | null;
  onClose: () => void;
  onToggleVerification?: (recordId: string) => void;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({
  record,
  onClose,
}) => {
  if (!record) return null;

  const rec = record as any;
  const type = rec.type || rec.recordType || 'Record';
  const timeDisplay = rec.date 
    ? `${rec.date} · ${rec.time}` 
    : rec.timestamp || '12 MAR 2026 · 14:32';
  const confidence = typeof rec.confidence === 'number' 
    ? rec.confidence 
    : typeof rec.confidenceScore === 'number' 
    ? rec.confidenceScore 
    : 0.85;

  return (
    <div className="fixed right-4 bottom-4 z-50 w-[min(380px,calc(100vw-2rem))] glass rounded-xl border border-signal/30 p-4 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] tracking-[0.22em] font-mono text-signal/70">
            SOURCE RECORD
          </div>
          <div className="font-display text-base text-foreground mt-1 font-semibold">
            {record.id}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground text-xs px-2 py-1 rounded hover:bg-signal/10 transition"
        >
          Close
        </button>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <div className="font-mono text-[10px] text-muted-foreground">RELATIONSHIP / EVENT</div>
          <div className="text-[11px] mt-0.5 text-foreground font-medium">{record.title}</div>
        </div>

        <div>
          <div className="font-mono text-[10px] text-muted-foreground">RECORD TYPE</div>
          <div className="text-[11px] mt-0.5 text-foreground">{type}</div>
        </div>

        <div>
          <div className="font-mono text-[10px] text-muted-foreground">TIMESTAMP</div>
          <div className="text-[11px] mt-0.5 text-foreground">{timeDisplay}</div>
        </div>

        <div>
          <div className="font-mono text-[10px] text-muted-foreground">CASE</div>
          <div className="text-[11px] mt-0.5 text-foreground">{record.caseId}</div>
        </div>

        <div>
          <div className="font-mono text-[10px] text-muted-foreground">CONFIDENCE</div>
          <div className="text-[11px] mt-0.5 text-signal font-mono font-semibold">
            {confidence.toFixed(2)}
          </div>
        </div>

        <div>
          <div className="font-mono text-[10px] text-muted-foreground">EVIDENCE DESCRIPTION</div>
          <p className="text-[11px] leading-relaxed text-foreground mt-1">
            {record.description}
          </p>
        </div>

        {'source' in record && record.source && (
          <div>
            <div className="font-mono text-[10px] text-muted-foreground">DATA SOURCE</div>
            <div className="text-[11px] mt-0.5 text-muted-foreground font-mono">{record.source}</div>
          </div>
        )}
      </div>
    </div>
  );
};
