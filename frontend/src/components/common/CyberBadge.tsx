import React from 'react';
import { 
  User, 
  Smartphone, 
  Car, 
  MapPin, 
  Building2, 
  ShieldAlert, 
  Landmark, 
  Calendar,
  Share2,
  ArrowRight,
  Eye,
  DollarSign
} from 'lucide-react';
import { EntityType, RelationshipType } from '../../types/intel';

interface CyberBadgeProps {
  type: EntityType | RelationshipType | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const CyberBadge: React.FC<CyberBadgeProps> = ({ 
  type, 
  size = 'sm', 
  showIcon = true, 
  className = '' 
}) => {
  const getBadgeStyle = (val: string) => {
    switch (val) {
      case 'PERSON':
        return 'bg-blue-950/80 text-blue-400 border-blue-500/40';
      case 'PHONE':
        return 'bg-cyan-950/80 text-cyan-400 border-cyan-500/40';
      case 'VEHICLE':
        return 'bg-amber-950/80 text-amber-400 border-amber-500/40';
      case 'LOCATION':
        return 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40';
      case 'ORGANIZATION':
        return 'bg-purple-950/80 text-purple-400 border-purple-500/40';
      case 'CASE':
        return 'bg-rose-950/80 text-rose-400 border-rose-500/40';
      case 'BANK ACCOUNT':
        return 'bg-yellow-950/80 text-yellow-300 border-yellow-500/40';
      case 'EVENT':
        return 'bg-indigo-950/80 text-indigo-300 border-indigo-500/40';
      // Relationships
      case 'USES':
      case 'OWNS':
        return 'bg-slate-900/90 text-cyan-300 border-cyan-500/30';
      case 'COMMUNICATED_WITH':
        return 'bg-slate-900/90 text-blue-300 border-blue-500/30';
      case 'OBSERVED_AT':
      case 'VISITED':
      case 'LOCATED_AT':
        return 'bg-slate-900/90 text-emerald-300 border-emerald-500/30';
      case 'TRANSFERRED_MONEY_TO':
        return 'bg-slate-900/90 text-amber-300 border-amber-500/30';
      case 'INVOLVED_IN':
      case 'MEMBER_OF':
        return 'bg-slate-900/90 text-purple-300 border-purple-500/30';
      default:
        return 'bg-slate-900 text-slate-400 border-slate-700';
    }
  };

  const getEntityIcon = (val: string) => {
    const iconSize = size === 'lg' ? 'w-4 h-4' : size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3';
    switch (val) {
      case 'PERSON':
        return <User className={iconSize} />;
      case 'PHONE':
        return <Smartphone className={iconSize} />;
      case 'VEHICLE':
        return <Car className={iconSize} />;
      case 'LOCATION':
        return <MapPin className={iconSize} />;
      case 'ORGANIZATION':
        return <Building2 className={iconSize} />;
      case 'CASE':
        return <ShieldAlert className={iconSize} />;
      case 'BANK ACCOUNT':
        return <Landmark className={iconSize} />;
      case 'EVENT':
        return <Calendar className={iconSize} />;
      case 'COMMUNICATED_WITH':
      case 'USES':
        return <Share2 className={iconSize} />;
      case 'OBSERVED_AT':
      case 'VISITED':
        return <Eye className={iconSize} />;
      case 'TRANSFERRED_MONEY_TO':
        return <DollarSign className={iconSize} />;
      default:
        return null;
    }
  };

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 tracking-wider gap-1',
    md: 'text-xs px-2.5 py-1 tracking-wide gap-1.5',
    lg: 'text-sm px-3 py-1.5 font-medium gap-2',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-mono font-semibold uppercase rounded border ${getBadgeStyle(
        type
      )} ${sizeClasses} ${className}`}
    >
      {showIcon && getEntityIcon(type)}
      <span>{type}</span>
    </span>
  );
};
