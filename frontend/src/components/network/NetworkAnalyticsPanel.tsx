import React from 'react';
import { 
  BarChart3, 
  PieChart, 
  Activity, 
  Clock, 
  Target, 
  ArrowRight, 
  TrendingUp, 
  ShieldAlert 
} from 'lucide-react';
import { 
  NETWORK_CENTRALITY_DATA, 
  ENTITY_TYPE_DISTRIBUTION, 
  TIMELINE_ACTIVITY_DATA,
  NEXUS_ENTITY_ICONS, 
  NEXUS_ENTITY_TONES 
} from '../../services/nexusData';
import { useIntelData } from '../../context/IntelDataContext';

interface NetworkAnalyticsPanelProps {
  selectedEntityId: string;
  onSelectEntity: (entityId: string) => void;
}

export const NetworkAnalyticsPanel: React.FC<NetworkAnalyticsPanelProps> = ({
  selectedEntityId,
  onSelectEntity,
}) => {
  const { centralityData, typeDistribution, timelineData } = useIntelData();

  const activeCentrality = centralityData && centralityData.length > 0 ? centralityData : NETWORK_CENTRALITY_DATA;
  const activeDistribution = typeDistribution && typeDistribution.length > 0 ? typeDistribution : ENTITY_TYPE_DISTRIBUTION;
  const activeTimeline = timelineData && timelineData.length > 0 ? timelineData : TIMELINE_ACTIVITY_DATA;

  const maxDegree = Math.max(...activeCentrality.map((c) => c.degree), 1);
  const maxTimelineCount = Math.max(...activeTimeline.map((t) => t.count), 1);

  return (
    <div className="space-y-4 font-body animate-in fade-in duration-300">
      {/* 1. Network Degree Centrality Ranking Graph */}
      <div className="glass rounded-xl p-4 border-signal/20">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[10px] tracking-[0.22em] font-mono text-signal/70">
              NETWORK CENTRALITY METRICS
            </div>
            <div className="font-display text-sm font-semibold text-foreground mt-0.5">
              Entity Connection Density Ranking
            </div>
          </div>
          <BarChart3 className="size-4 text-signal" />
        </div>

        <p className="text-[11px] text-muted-foreground mb-3">
          Higher degree centrality denotes critical communication hubs, intermediary bridges, or case nexus points. Click any bar to focus on that entity in the graph.
        </p>

        <div className="space-y-2">
          {activeCentrality.map((item) => {
            const isSelected = item.id === selectedEntityId;
            const tone = NEXUS_ENTITY_TONES[item.type] || 'signal';
            const percentage = Math.min(100, Math.max(12, (item.degree / maxDegree) * 100));

            return (
              <button
                key={item.id}
                onClick={() => onSelectEntity(item.id)}
                className={`w-full text-left p-2 rounded-lg border transition-all group ${
                  isSelected
                    ? 'bg-signal/15 border-signal/50 shadow-[0_0_12px_rgba(0,240,255,0.15)]'
                    : 'bg-ink/40 border-signal/10 hover:border-signal/30 hover:bg-ink/70'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="flex items-center gap-2">
                    <span className={`text-${tone} font-mono text-sm`}>
                      {NEXUS_ENTITY_ICONS[item.type] || '▣'}
                    </span>
                    <span className="font-medium text-foreground group-hover:text-signal transition">
                      {item.name}
                    </span>
                    <span className="text-[9px] font-mono text-muted-foreground">
                      ({item.type})
                    </span>
                  </span>
                  <span className="font-mono text-[10px] text-signal font-semibold">
                    {item.degree} links · Risk {item.risk}
                  </span>
                </div>

                {/* Centrality Bar */}
                <div className="h-1.5 w-full rounded-full bg-void/60 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      isSelected
                        ? 'bg-signal shadow-[0_0_8px_var(--color-signal)]'
                        : 'bg-signal/40 group-hover:bg-signal/80'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2-Column Split: Entity Type Distribution & Temporal Interaction Frequency */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Entity Distribution Graph */}
        <div className="glass rounded-xl p-4 border-signal/15">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[10px] tracking-[0.22em] font-mono text-signal/70">
                TOPOLOGY BREAKDOWN
              </div>
              <div className="font-display text-sm font-semibold text-foreground mt-0.5">
                Entity Type Distribution
              </div>
            </div>
            <PieChart className="size-4 text-muted-foreground" />
          </div>

          <div className="space-y-2 mt-3">
            {activeDistribution.map((ent) => (
              <div key={ent.type} className="text-xs">
                <div className="flex justify-between font-mono text-[10px] text-muted-foreground mb-1">
                  <span className="text-foreground font-medium flex items-center gap-1.5">
                    <span className="text-signal">{NEXUS_ENTITY_ICONS[ent.type]}</span>
                    {ent.type}
                  </span>
                  <span>
                    {ent.count} ({ent.percent}%)
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-void/60 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${ent.percent}%`,
                      backgroundColor: ent.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Temporal Interaction Volume Graph */}
        <div className="glass rounded-xl p-4 border-signal/15">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[10px] tracking-[0.22em] font-mono text-signal/70">
                TEMPORAL DENSITY
              </div>
              <div className="font-display text-sm font-semibold text-foreground mt-0.5">
                Interaction Timeline
              </div>
            </div>
            <Clock className="size-4 text-muted-foreground" />
          </div>

          <div className="space-y-3 mt-3">
            {activeTimeline.map((item) => (
              <div key={item.date} className="text-xs">
                <div className="flex justify-between items-center text-[10px] font-mono text-muted-foreground mb-1">
                  <span className="text-foreground font-medium">{item.date}</span>
                  <span className="text-signal">{item.count} events</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 rounded-full bg-void/60 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-azure"
                      style={{ width: `${Math.min(100, Math.max(15, (item.count / maxTimelineCount) * 100))}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-mono text-muted-foreground truncate w-24 text-right">
                    {item.label}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[10px] font-mono text-muted-foreground">
            <span>PEAK ACTIVITY: {activeTimeline[0]?.date || 'RECENT'}</span>
            <span className="text-signal">RECORD BURST DETECTED</span>
          </div>
        </div>
      </div>
    </div>
  );
};
