import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Sparkles, 
  RotateCcw, 
  Sliders, 
  Layers, 
  CheckSquare, 
  Square,
  ShieldAlert,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Entity, EntityType, RelationshipType, FilterState } from '../../types/intel';
import { CyberBadge } from '../common/CyberBadge';

interface InvestigationControlsProps {
  entities: Entity[];
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onSelectEntity: (entityId: string) => void;
  onFindHiddenRelationships: () => void;
  onResetView: () => void;
  layoutName: string;
  onLayoutChange: (layout: string) => void;
}

const ALL_ENTITY_TYPES: EntityType[] = [
  'PERSON',
  'PHONE',
  'VEHICLE',
  'LOCATION',
  'ORGANIZATION',
  'CASE',
  'BANK ACCOUNT',
  'EVENT',
];

const ALL_RELATIONSHIP_TYPES: RelationshipType[] = [
  'USES',
  'OWNS',
  'COMMUNICATED_WITH',
  'VISITED',
  'LOCATED_AT',
  'MEMBER_OF',
  'INVOLVED_IN',
  'TRANSFERRED_MONEY_TO',
  'OBSERVED_AT',
];

export const InvestigationControls: React.FC<InvestigationControlsProps> = ({
  entities,
  filters,
  onFilterChange,
  onSelectEntity,
  onFindHiddenRelationships,
  onResetView,
  layoutName,
  onLayoutChange,
}) => {
  const [searchQuery, setSearchQuery] = useState(filters.searchQuery);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(true);

  // Autocomplete matching
  const matchingEntities = entities.filter((e) => {
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase();
    return (
      e.name.toLowerCase().includes(q) ||
      e.id.toLowerCase().includes(q) ||
      e.type.toLowerCase().includes(q) ||
      (e.aliases && e.aliases.some((a) => a.toLowerCase().includes(q)))
    );
  });

  const toggleEntityType = (type: EntityType) => {
    const exists = filters.entityTypes.includes(type);
    const updated = exists
      ? filters.entityTypes.filter((t) => t !== type)
      : [...filters.entityTypes, type];
    onFilterChange({ ...filters, entityTypes: updated });
  };

  const toggleRelationshipType = (type: RelationshipType) => {
    const exists = filters.relationshipTypes.includes(type);
    const updated = exists
      ? filters.relationshipTypes.filter((t) => t !== type)
      : [...filters.relationshipTypes, type];
    onFilterChange({ ...filters, relationshipTypes: updated });
  };

  return (
    <div className="w-80 shrink-0 bg-[#070d1e]/90 border-r border-cyan-500/20 flex flex-col h-full overflow-y-auto p-4 space-y-4 select-none">
      {/* Primary Action Button: FIND HIDDEN RELATIONSHIPS */}
      <div className="pt-1">
        <button
          onClick={onFindHiddenRelationships}
          className="w-full relative group overflow-hidden px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-600 via-cyan-500 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 font-mono font-bold text-xs tracking-wider uppercase shadow-glow-cyan-lg transition-all duration-300 transform active:scale-95"
        >
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 animate-spin text-slate-950" />
            <span>FIND HIDDEN RELATIONSHIPS</span>
          </div>
          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </button>
        <p className="text-[10px] font-mono text-center text-slate-400 mt-1.5">
          Traces multi-hop links & cross-references evidence
        </p>
      </div>

      {/* Prominent Entity Search Box with Autocomplete */}
      <div className="relative">
        <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1 font-semibold">
          TARGET ENTITY SEARCH
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              onFilterChange({ ...filters, searchQuery: e.target.value });
              setShowSearchResults(true);
            }}
            onFocus={() => setShowSearchResults(true)}
            placeholder="Search person, phone, vehicle, case..."
            className="w-full px-3 py-2 pl-9 rounded-lg bg-slate-950/80 border border-cyan-500/30 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
          />
          <Search className="w-4 h-4 text-cyan-400 absolute left-3 top-2.5" />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                onFilterChange({ ...filters, searchQuery: '' });
              }}
              className="absolute right-2.5 top-2.5 text-xs text-slate-500 hover:text-slate-300"
            >
              ✕
            </button>
          )}
        </div>

        {/* Autocomplete Dropdown List */}
        {showSearchResults && matchingEntities.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 max-h-60 overflow-y-auto rounded-lg bg-slate-950 border border-cyan-500/40 shadow-2xl z-50 divide-y divide-slate-800">
            {matchingEntities.map((entity) => (
              <div
                key={entity.id}
                onClick={() => {
                  onSelectEntity(entity.id);
                  setSearchQuery(entity.name);
                  setShowSearchResults(false);
                }}
                className="p-2.5 hover:bg-cyan-950/40 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-100">{entity.name}</span>
                  <CyberBadge type={entity.type} size="sm" />
                </div>
                <div className="flex items-center gap-3 mt-1 text-[10px] font-mono text-slate-400">
                  <span className="text-cyan-400">{entity.id}</span>
                  <span>• {entity.metrics.caseCount} Cases</span>
                  <span>• {entity.metrics.connectionCount} Connections</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Graph Layout & Reset Controls */}
      <div className="space-y-1.5 pt-1 border-t border-slate-800">
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
          <span>GRAPH TOPOLOGY</span>
          <button
            onClick={onResetView}
            className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>RESET VIEW</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {['cose', 'concentric', 'circle', 'breadthfirst'].map((lName) => (
            <button
              key={lName}
              onClick={() => onLayoutChange(lName)}
              className={`px-2 py-1.5 rounded font-mono text-[10px] uppercase font-semibold border transition-all ${
                layoutName === lName
                  ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-300 shadow-glow-cyan'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              {lName}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Section Toggle */}
      <div className="space-y-3 pt-2 border-t border-slate-800">
        <button
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          className="w-full flex items-center justify-between text-xs font-mono text-slate-300 uppercase tracking-wider font-semibold py-1"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span>INVESTIGATION FILTERS</span>
          </div>
          {isFiltersOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {isFiltersOpen && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Hop Depth Filter Slider */}
            <div>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase mb-1">
                <span>CONNECTION DEPTH</span>
                <span className="text-cyan-400 font-bold">{filters.maxHops} HOPS</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={filters.maxHops}
                onChange={(e) => onFilterChange({ ...filters, maxHops: parseInt(e.target.value) })}
                className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded cursor-pointer"
              />
              <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-0.5">
                <span>1 Hop</span>
                <span>3 Hops</span>
                <span>5 Hops</span>
              </div>
            </div>

            {/* Confidence Threshold Slider */}
            <div>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase mb-1">
                <span>MIN CONFIDENCE</span>
                <span className="text-cyan-400 font-bold">{Math.round(filters.minConfidence * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.50"
                max="1.00"
                step="0.05"
                value={filters.minConfidence}
                onChange={(e) => onFilterChange({ ...filters, minConfidence: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded cursor-pointer"
              />
              <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-0.5">
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Entity Types Checkboxes */}
            <div>
              <span className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2 font-semibold">
                ENTITY TYPES ({filters.entityTypes.length}/{ALL_ENTITY_TYPES.length})
              </span>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {ALL_ENTITY_TYPES.map((type) => {
                  const isChecked = filters.entityTypes.includes(type);
                  return (
                    <div
                      key={type}
                      onClick={() => toggleEntityType(type)}
                      className="flex items-center justify-between p-1.5 rounded hover:bg-slate-900 cursor-pointer text-xs font-mono"
                    >
                      <div className="flex items-center gap-2">
                        {isChecked ? (
                          <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-slate-600" />
                        )}
                        <span className={isChecked ? 'text-slate-200' : 'text-slate-500'}>{type}</span>
                      </div>
                      <CyberBadge type={type} size="sm" />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Relationship Types Checkboxes */}
            <div>
              <span className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2 font-semibold">
                RELATIONSHIP TYPES ({filters.relationshipTypes.length}/{ALL_RELATIONSHIP_TYPES.length})
              </span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {ALL_RELATIONSHIP_TYPES.map((relType) => {
                  const isChecked = filters.relationshipTypes.includes(relType);
                  return (
                    <div
                      key={relType}
                      onClick={() => toggleRelationshipType(relType)}
                      className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-900 cursor-pointer text-[11px] font-mono"
                    >
                      {isChecked ? (
                        <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-slate-600" />
                      )}
                      <span className={isChecked ? 'text-slate-200' : 'text-slate-500'}>
                        {relType}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
