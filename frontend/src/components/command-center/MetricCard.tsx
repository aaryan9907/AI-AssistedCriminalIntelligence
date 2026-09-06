import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'cyan' | 'blue' | 'amber' | 'purple' | 'emerald' | 'rose';
  trend?: string;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtitle,
  icon: Icon,
  variant = 'cyan',
  trend,
  onClick,
}) => {
  const variantStyles = {
    cyan: {
      border: 'border-cyan-500/25 hover:border-cyan-400/50',
      text: 'text-cyan-400',
      bg: 'bg-[#0a1122]/60 hover:bg-[#0c162d]/80',
      iconBg: 'text-cyan-400 bg-cyan-500/10',
    },
    blue: {
      border: 'border-blue-500/25 hover:border-blue-400/50',
      text: 'text-blue-400',
      bg: 'bg-[#0a1122]/60 hover:bg-[#0c162d]/80',
      iconBg: 'text-blue-400 bg-blue-500/10',
    },
    amber: {
      border: 'border-amber-500/25 hover:border-amber-400/50',
      text: 'text-amber-400',
      bg: 'bg-[#0a1122]/60 hover:bg-[#0c162d]/80',
      iconBg: 'text-amber-400 bg-amber-500/10',
    },
    purple: {
      border: 'border-purple-500/25 hover:border-purple-400/50',
      text: 'text-purple-400',
      bg: 'bg-[#0a1122]/60 hover:bg-[#0c162d]/80',
      iconBg: 'text-purple-400 bg-purple-500/10',
    },
    emerald: {
      border: 'border-emerald-500/25 hover:border-emerald-400/50',
      text: 'text-emerald-400',
      bg: 'bg-[#0a1122]/60 hover:bg-[#0c162d]/80',
      iconBg: 'text-emerald-400 bg-emerald-500/10',
    },
    rose: {
      border: 'border-rose-500/25 hover:border-rose-400/50',
      text: 'text-rose-400',
      bg: 'bg-[#0a1122]/60 hover:bg-[#0c162d]/80',
      iconBg: 'text-rose-400 bg-rose-500/10',
    },
  }[variant];

  return (
    <div
      onClick={onClick}
      className={`relative rounded-xl border p-3.5 transition-all duration-200 ${
        variantStyles.border
      } ${variantStyles.bg} ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
          {label}
        </span>
        <div className={`p-1.5 rounded-md ${variantStyles.iconBg}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>

      <div className="mt-2 flex items-baseline justify-between">
        <span className={`font-mono text-2xl font-bold tracking-tight ${variantStyles.text}`}>
          {value}
        </span>
        {trend && (
          <span className="font-mono text-[10px] text-slate-400">
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-0.5 text-[11px] text-slate-400 truncate">
          {subtitle}
        </p>
      )}
    </div>
  );
};
