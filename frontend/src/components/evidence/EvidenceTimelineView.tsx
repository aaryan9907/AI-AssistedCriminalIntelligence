import React, { useState } from 'react';
import { FileText, ArrowRight, Search, CheckCircle, AlertCircle } from 'lucide-react';
import { NEXUS_EVIDENCE, NexusEvidence } from '../../services/nexusData';
import { useIntelData } from '../../context/IntelDataContext';
import { EvidenceModal } from './EvidenceModal';

interface EvidenceTimelineViewProps {
  timeline?: any[];
  evidenceRecords?: Record<string, any>;
  onOpenEvidenceModal?: (recId: string) => void;
  onSelectEntityId?: (entityId: string) => void;
}

export const EvidenceTimelineView: React.FC<EvidenceTimelineViewProps> = () => {
  const { evidence } = useIntelData();
  const allEvidence = evidence.length > 0 ? evidence : NEXUS_EVIDENCE;
  const [selectedEvidence, setSelectedEvidence] = useState<NexusEvidence | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredEvidence = allEvidence.filter((ev) =>
    `${ev.id} ${ev.type} ${ev.title} ${ev.description} ${ev.caseId} ${ev.source}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  return (
    <main className="p-6 max-w-4xl font-body">
      {/* Search Evidence Records */}
      <div className="mb-5 relative">
        <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-panel/70 border border-signal/15 text-foreground placeholder:text-muted-foreground text-xs focus:outline-none focus:border-signal/40"
          placeholder="Filter by ID, event type, date, or source..."
        />
      </div>

      <div className="space-y-3">
        {filteredEvidence.map((record) => (
          <article
            key={record.id}
            onClick={() => setSelectedEvidence(record)}
            className="glass rounded-xl p-4 hover:border-signal/40 transition cursor-pointer"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <div className="grid size-9 place-items-center rounded-md bg-signal/10 border border-signal/20 text-signal shrink-0">
                  <FileText className="size-4" />
                </div>
                <div>
                  <div className="font-display text-base text-foreground font-semibold">
                    {record.id} · {record.type}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    {record.title}
                  </div>
                </div>
              </div>
              <span className="font-mono text-[10px] text-signal shrink-0">
                {record.confidence.toFixed(2)} confidence
              </span>
            </div>

            <p className="text-sm text-muted-foreground mt-4 max-w-2xl leading-relaxed">
              {record.description}
            </p>

            <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-border text-[10px] font-mono text-muted-foreground">
              <span>
                {record.date} · {record.time}
              </span>
              <span>{record.caseId}</span>
              <span className="text-signal/80">{record.source}</span>
            </div>
          </article>
        ))}
      </div>

      {selectedEvidence && (
        <EvidenceModal
          record={selectedEvidence}
          onClose={() => setSelectedEvidence(null)}
        />
      )}
    </main>
  );
};
