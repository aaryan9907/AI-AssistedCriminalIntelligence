import React, { useState, useMemo } from 'react';
import {
  X,
  Sparkles,
  GitFork,
  Phone,
  DollarSign,
  MapPin,
  Car,
  Network,
  Shield,
  ArrowRight,
  Search,
  CheckCircle2,
  ExternalLink,
  Layers,
  HelpCircle,
  Eye,
  Activity,
  ChevronRight
} from 'lucide-react';
import { useIntelData } from '../../context/IntelDataContext';
import {
  DiscoveredHiddenRelationship,
  HiddenRelationshipCategory,
  CATEGORY_META
} from '../../services/deepAnalysisEngine';
import { CyberBadge } from '../common/CyberBadge';
import { apiService } from '../../services/api';

interface HiddenRelationshipsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEntityId: (id: string) => void;
  onOpenEvidenceModal?: (evidenceId: string) => void;
}

export const HiddenRelationshipsDrawer: React.FC<HiddenRelationshipsDrawerProps> = ({
  isOpen,
  onClose,
  onSelectEntityId,
  onOpenEvidenceModal
}) => {
  const {
    nodes,
    hiddenRelationships,
    activeHiddenRelationshipId,
    setActiveHiddenRelationshipId,
    findConnectionsBetween
  } = useIntelData();

  // Active Category Filter
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'DISCOVERED' | 'TARGETED'>('DISCOVERED');

  // Targeted Deep Search State
  const [sourceEntityId, setSourceEntityId] = useState<string>(nodes[0]?.id || '');
  const [targetEntityId, setTargetEntityId] = useState<string>(nodes[1]?.id || '');
  const [customPaths, setCustomPaths] = useState<DiscoveredHiddenRelationship[] | null>(null);
  const [isSearchingTargeted, setIsSearchingTargeted] = useState<boolean>(false);

  // Filtered List of Discovered Relationships
  const filteredRelationships = useMemo(() => {
    return hiddenRelationships.filter((rel) => {
      // Category filter
      if (selectedCategory !== 'ALL' && rel.category !== selectedCategory) {
        return false;
      }
      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesNames =
          rel.sourceNodeName.toLowerCase().includes(q) ||
          rel.targetNodeName.toLowerCase().includes(q) ||
          rel.discoverySummary.toLowerCase().includes(q) ||
          (rel.intermediaryValue && rel.intermediaryValue.toLowerCase().includes(q));
        if (!matchesNames) return false;
      }
      return true;
    });
  }, [hiddenRelationships, selectedCategory, searchQuery]);

  // Handle Targeted Deep Search
  const handleExecuteTargetedSearch = () => {
    if (!sourceEntityId || !targetEntityId || sourceEntityId === targetEntityId) return;
    setIsSearchingTargeted(true);
    setTimeout(() => {
      const results = findConnectionsBetween(sourceEntityId, targetEntityId);
      setCustomPaths(results);
      setIsSearchingTargeted(false);
    }, 150);
  };

  const getCategoryIcon = (category: HiddenRelationshipCategory) => {
    switch (category) {
      case 'SHARED_PHONE':
        return <Phone className="w-3.5 h-3.5 text-sky-400" />;
      case 'FINANCIAL_CONDUIT':
        return <DollarSign className="w-3.5 h-3.5 text-emerald-400" />;
      case 'CO_LOCATION':
        return <MapPin className="w-3.5 h-3.5 text-amber-400" />;
      case 'SHARED_VEHICLE':
        return <Car className="w-3.5 h-3.5 text-teal-400" />;
      case 'CRITICAL_BROKER':
        return <Network className="w-3.5 h-3.5 text-purple-400" />;
      case 'MULTI_HOP_TRAIL':
      default:
        return <GitFork className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  const handleTraceRelationship = (rel: DiscoveredHiddenRelationship) => {
    if (activeHiddenRelationshipId === rel.id) {
      setActiveHiddenRelationshipId(null);
    } else {
      setActiveHiddenRelationshipId(rel.id);
      onSelectEntityId(rel.sourceNodeId);
    }
  };

  if (!isOpen) return null;

  return (
    <aside className="w-[480px] shrink-0 bg-[#070d1e]/98 border-l border-cyan-500/25 flex flex-col h-full overflow-hidden select-none z-40 shadow-2xl backdrop-blur-xl animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-cyan-500/20 bg-gradient-to-r from-[#0d1b38]/80 to-[#070d1e]/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs uppercase tracking-widest text-cyan-400 font-bold">
                  DEEP RELATIONSHIP ANALYZER
                </span>
                <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold">
                  {hiddenRelationships.length} DISCOVERED
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Multi-hop trails, burner SIMs, money mules & nexus brokers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector: Discovered vs Targeted Query */}
        <div className="flex rounded-lg bg-slate-900/90 p-0.5 border border-cyan-500/20 mt-3 font-mono text-xs">
          <button
            onClick={() => setActiveTab('DISCOVERED')}
            className={`flex-1 py-1.5 rounded text-center transition-colors font-semibold flex items-center justify-center gap-1.5 ${
              activeTab === 'DISCOVERED'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>DISCOVERED LEADS ({hiddenRelationships.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('TARGETED')}
            className={`flex-1 py-1.5 rounded text-center transition-colors font-semibold flex items-center justify-center gap-1.5 ${
              activeTab === 'TARGETED'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitFork className="w-3.5 h-3.5" />
            <span>DEEP PATHFINDER (A ➔ B)</span>
          </button>
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'DISCOVERED' ? (
          <>
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by suspect name, burner phone, vehicle, account..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900/80 border border-cyan-500/20 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 font-mono"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 font-mono text-[10px]">
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`px-2.5 py-1 rounded-md border shrink-0 transition-colors ${
                  selectedCategory === 'ALL'
                    ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300 font-bold'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                ALL ({hiddenRelationships.length})
              </button>
              {(Object.keys(CATEGORY_META) as HiddenRelationshipCategory[]).map((cat) => {
                const count = hiddenRelationships.filter((r) => r.category === cat).length;
                if (count === 0) return null;
                const meta = CATEGORY_META[cat];
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-md border shrink-0 transition-colors flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300 font-bold'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {getCategoryIcon(cat)}
                    <span>{meta.title.split(' ')[0]} ({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Investigative Alert / Notice */}
            <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/20 text-[11px] font-mono text-cyan-300/80 flex items-start gap-2">
              <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-cyan-300 uppercase">Investigative Lead Notice: </span>
                Multi-hop trails and shared asset conduits are generated algorithmically from ingested evidence logs. Always verify with primary records before statutory actions.
              </div>
            </div>

            {/* Relationship Cards */}
            <div className="space-y-3">
              {filteredRelationships.length === 0 ? (
                <div className="p-8 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-xl">
                  No hidden relationships match your current filters.
                </div>
              ) : (
                filteredRelationships.map((rel) => {
                  const isTracing = activeHiddenRelationshipId === rel.id;
                  const meta = CATEGORY_META[rel.category];

                  return (
                    <div
                      key={rel.id}
                      className={`p-3.5 rounded-xl border transition-all duration-200 ${
                        isTracing
                          ? 'bg-gradient-to-b from-[#0e2246] to-[#071329] border-cyan-400/80 shadow-[0_0_20px_rgba(0,240,255,0.2)]'
                          : 'bg-[#091124]/90 border-cyan-500/20 hover:border-cyan-500/40'
                      }`}
                    >
                      {/* Top Row: Category + Confidence + Hops */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          {getCategoryIcon(rel.category)}
                          <span className="text-[11px] font-mono font-bold text-cyan-300 uppercase">
                            {meta.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[10px] font-bold">
                            {rel.hopCount} HOPS
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                            {Math.round(rel.confidence * 100)}% CONF
                          </span>
                        </div>
                      </div>

                      {/* Connection Overview */}
                      <div className="flex items-center justify-between py-1 text-xs font-mono font-semibold text-slate-100">
                        <button
                          onClick={() => onSelectEntityId(rel.sourceNodeId)}
                          className="hover:text-cyan-300 transition-colors text-left"
                        >
                          {rel.sourceNodeName}
                        </button>
                        <div className="flex items-center gap-1 text-cyan-400/60 text-[10px]">
                          <span className="h-[1px] w-6 bg-cyan-500/40" />
                          <span>INDIRECT</span>
                          <ArrowRight className="w-3 h-3 text-cyan-400" />
                        </div>
                        <button
                          onClick={() => onSelectEntityId(rel.targetNodeId)}
                          className="hover:text-cyan-300 transition-colors text-right"
                        >
                          {rel.targetNodeName}
                        </button>
                      </div>

                      {/* Discovery Narrative */}
                      <p className="text-[11px] text-slate-300/90 font-mono mt-2 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                        {rel.discoverySummary}
                      </p>

                      {/* Breadcrumb Trail of Nodes */}
                      <div className="mt-3 pt-2.5 border-t border-cyan-500/10">
                        <div className="text-[10px] text-slate-400 font-mono uppercase mb-1.5 flex items-center justify-between">
                          <span>Connection Pathway:</span>
                          <span className="text-cyan-400">{rel.pathBreadcrumb.length} steps</span>
                        </div>
                        <div className="flex items-center flex-wrap gap-1.5 font-mono text-[11px]">
                          {rel.pathBreadcrumb.map((step, idx) => (
                            <React.Fragment key={`${step.entityId}-${idx}`}>
                              <button
                                onClick={() => onSelectEntityId(step.entityId)}
                                className={`px-2 py-1 rounded border transition-colors flex items-center gap-1 ${
                                  idx === 0 || idx === rel.pathBreadcrumb.length - 1
                                    ? 'bg-cyan-950/70 border-cyan-500/40 text-cyan-200 font-bold hover:bg-cyan-900/50'
                                    : 'bg-slate-900/80 border-slate-700 text-amber-300/90 hover:bg-slate-800'
                                }`}
                                title={`Focus on ${step.entityName} (${step.entityType})`}
                              >
                                <span>{step.entityName}</span>
                              </button>
                              {idx < rel.pathBreadcrumb.length - 1 && (
                                <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" />
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="mt-3 pt-2.5 border-t border-cyan-500/15 flex items-center justify-between gap-2">
                        <button
                          onClick={() => handleTraceRelationship(rel)}
                          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all ${
                            isTracing
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30'
                              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 shadow-sm'
                          }`}
                        >
                          <Activity className={`w-3.5 h-3.5 ${isTracing ? 'animate-spin' : ''}`} />
                          <span>{isTracing ? 'CLEAR TRACE' : 'TRACE ON NETWORK CANVAS'}</span>
                        </button>

                        {onOpenEvidenceModal && rel.pathBreadcrumb.some((s) => s.viaEvidenceId) && (
                          <button
                            onClick={() => {
                              const evId = rel.pathBreadcrumb.find((s) => s.viaEvidenceId)?.viaEvidenceId;
                              if (evId) onOpenEvidenceModal(evId);
                            }}
                            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800/80 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 transition-colors"
                            title="Inspect Corroborating Evidence"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          /* TARGETED DEEP SEARCH (A ➔ B) */
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-[#091124]/90 border border-cyan-500/30 space-y-3">
              <div className="text-xs font-mono font-bold text-cyan-300 uppercase flex items-center gap-2">
                <GitFork className="w-4 h-4 text-cyan-400" />
                <span>Targeted Entity-to-Entity Path Finder</span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Select any two subjects or assets from the ingested dataset to search for indirect multi-hop trails and common intermediaries.
              </p>

              {/* Source Entity Selector */}
              <div className="space-y-1 font-mono">
                <label className="text-[10px] text-slate-400 uppercase">Origin Suspect / Asset (Entity A):</label>
                <select
                  value={sourceEntityId}
                  onChange={(e) => setSourceEntityId(e.target.value)}
                  className="w-full p-2 rounded-lg bg-slate-900 border border-cyan-500/30 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name} ({n.type}) [{n.id}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Entity Selector */}
              <div className="space-y-1 font-mono">
                <label className="text-[10px] text-slate-400 uppercase">Destination Suspect / Asset (Entity B):</label>
                <select
                  value={targetEntityId}
                  onChange={(e) => setTargetEntityId(e.target.value)}
                  className="w-full p-2 rounded-lg bg-slate-900 border border-cyan-500/30 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name} ({n.type}) [{n.id}]
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleExecuteTargetedSearch}
                disabled={isSearchingTargeted || !sourceEntityId || !targetEntityId || sourceEntityId === targetEntityId}
                className="w-full py-2 px-4 rounded-lg bg-cyan-500 text-slate-950 font-mono text-xs font-bold hover:bg-cyan-400 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isSearchingTargeted ? 'Searching Graph Topology...' : 'Calculate Deep Paths'}</span>
              </button>
            </div>

            {/* Targeted Search Results */}
            {customPaths !== null && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-cyan-400 font-bold px-1">
                  <span>QUERY RESULTS ({customPaths.length} PATHS FOUND)</span>
                </div>

                {customPaths.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-xl">
                    No multi-hop path (up to 5 hops) found between the selected entities in the current dataset.
                  </div>
                ) : (
                  customPaths.map((rel) => {
                    const isTracing = activeHiddenRelationshipId === rel.id;
                    return (
                      <div
                        key={rel.id}
                        className={`p-3.5 rounded-xl border transition-all ${
                          isTracing
                            ? 'bg-gradient-to-b from-[#0e2246] to-[#071329] border-cyan-400/80 shadow-[0_0_20px_rgba(0,240,255,0.2)]'
                            : 'bg-[#091124]/90 border-cyan-500/20 hover:border-cyan-500/40'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-mono font-bold text-cyan-300 uppercase">
                            {rel.categoryTitle}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[10px] font-bold">
                              {rel.hopCount} HOPS
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                              {Math.round(rel.confidence * 100)}% CONF
                            </span>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-300/90 font-mono mt-1 leading-relaxed bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                          {rel.discoverySummary}
                        </p>

                        <div className="mt-2.5 flex items-center flex-wrap gap-1 font-mono text-[11px]">
                          {rel.pathBreadcrumb.map((step, idx) => (
                            <React.Fragment key={`${step.entityId}-${idx}`}>
                              <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200">
                                {step.entityName}
                              </span>
                              {idx < rel.pathBreadcrumb.length - 1 && (
                                <ArrowRight className="w-3 h-3 text-cyan-400 shrink-0" />
                              )}
                            </React.Fragment>
                          ))}
                        </div>

                        <button
                          onClick={() => handleTraceRelationship(rel)}
                          className={`w-full mt-3 py-1.5 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all ${
                            isTracing
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30'
                          }`}
                        >
                          <Activity className={`w-3.5 h-3.5 ${isTracing ? 'animate-spin' : ''}`} />
                          <span>{isTracing ? 'CLEAR CANVAS TRACE' : 'TRACE THIS PATH ON CANVAS'}</span>
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
