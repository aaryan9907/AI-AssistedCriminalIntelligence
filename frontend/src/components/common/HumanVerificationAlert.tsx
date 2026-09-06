import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

interface HumanVerificationAlertProps {
  leadId?: string;
  isVerified?: boolean;
  onToggleVerification?: () => void;
  className?: string;
}

export const HumanVerificationAlert: React.FC<HumanVerificationAlertProps> = ({
  leadId,
  isVerified = false,
  onToggleVerification,
  className = '',
}) => {
  return (
    <div
      className={`rounded-lg border p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
        isVerified
          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
          : 'bg-amber-950/30 border-amber-500/50 text-amber-200'
      } ${className}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`p-2 rounded-md ${
            isVerified ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
          }`}
        >
          {isVerified ? <ShieldCheck className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5 animate-pulse" />}
        </div>
        <div>
          <div className="flex items-center gap-2 font-mono font-bold text-xs tracking-wider uppercase">
            <span>{isVerified ? 'Lead Verified By Investigator' : '⚠ Human Verification Required'}</span>
            {leadId && <span className="text-[10px] text-slate-400 font-normal">[{leadId}]</span>}
          </div>
          <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
            {isVerified
              ? 'This investigative pattern has been reviewed and affirmed by human intelligence personnel.'
              : 'This is an investigative lead, not an automated conclusion. Final determination rests strictly with the human investigator.'}
          </p>
        </div>
      </div>

      {onToggleVerification && (
        <button
          onClick={onToggleVerification}
          className={`shrink-0 text-xs font-mono font-medium px-3 py-1.5 rounded transition-all border ${
            isVerified
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-600'
              : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/50 shadow-glow-amber'
          }`}
        >
          {isVerified ? 'Mark Pending Review' : 'Mark as Human Verified'}
        </button>
      )}
    </div>
  );
};
