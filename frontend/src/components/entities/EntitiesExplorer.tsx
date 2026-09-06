import React, { useState } from 'react';
import { Search, ArrowRight, ArrowLeft } from 'lucide-react';
import { 
  NEXUS_NODES, 
  NEXUS_ENTITY_ICONS, 
  NEXUS_ENTITY_TONES,
  NexusNode 
} from '../../services/nexusData';
import { useIntelData } from '../../context/IntelDataContext';
import { NavSection } from '../layout/SidebarNav';

interface EntitiesExplorerProps {
  entities?: any[];
  onSelectEntity?: (entityId: string) => void;
  onNavigate?: (section: NavSection) => void;
  focusId?: string | null;
}

export const EntitiesExplorer: React.FC<EntitiesExplorerProps> = ({
  onSelectEntity,
  onNavigate,
  focusId,
}) => {
  const { nodes } = useIntelData();
  const allNodes = nodes.length > 0 ? nodes : NEXUS_NODES;
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredEntities = allNodes.filter((entity) =>
    `${entity.name} ${entity.id} ${entity.type} ${entity.subtitle}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const handleEntityClick = (entityId: string) => {
    if (onSelectEntity) {
      onSelectEntity(entityId);
    }
    if (onNavigate) {
      onNavigate('COMMAND_CENTER');
    }
  };

  return (
    <main className="p-6 font-body">
      {/* Search Bar */}
      <div className="max-w-xl relative">
        <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-panel/70 border border-signal/15 text-foreground placeholder:text-muted-foreground text-xs focus:outline-none focus:border-signal/40"
          placeholder="Search person, phone, vehicle, case or organization…"
        />
      </div>

      {/* Entity Cards Grid */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredEntities.map((entity) => {
          const isFocused = entity.id === focusId;
          const tone = NEXUS_ENTITY_TONES[entity.type] || 'signal';

          return (
            <button
              key={entity.id}
              onClick={() => handleEntityClick(entity.id)}
              className={`text-left glass rounded-xl p-4 hover:border-signal/40 transition cursor-pointer ${
                isFocused ? 'border-signal/50' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-${tone} text-lg font-mono`}>
                  {NEXUS_ENTITY_ICONS[entity.type] || '▣'}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {entity.id}
                </span>
              </div>

              <div className="font-display text-base font-semibold text-foreground mt-4">
                {entity.name}
              </div>
              <div className="font-mono text-[10px] text-muted-foreground mt-1">
                {entity.type} · {entity.subtitle}
              </div>

              <div className="mt-4 pt-3 border-t border-border flex justify-between text-[11px] text-muted-foreground">
                <span>{entity.connections} connections</span>
                <span className="flex items-center gap-1">
                  {entity.cases} cases
                  <ArrowRight className="inline size-3 ml-1" />
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Back to Command Center */}
      {onNavigate && (
        <button
          onClick={() => onNavigate('COMMAND_CENTER')}
          className="inline-flex items-center gap-2 text-[11px] text-signal mt-6 hover:underline"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to command center</span>
        </button>
      )}
    </main>
  );
};
