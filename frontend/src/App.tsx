import React, { useState } from 'react';
import { TopNavHUD } from './components/layout/TopNavHUD';
import { SidebarNav, NavSection } from './components/layout/SidebarNav';
import { CommandCenter } from './components/command-center/CommandCenter';
import { DataIngestionView } from './components/ingestion/DataIngestionView';
import { EntitiesExplorer } from './components/entities/EntitiesExplorer';
import { NetworkHero } from './components/network/NetworkHero';
import { LeadsView } from './components/leads/LeadsView';
import { EvidenceTimelineView } from './components/evidence/EvidenceTimelineView';
import { EvidenceModal } from './components/evidence/EvidenceModal';
import { IntelDataProvider, useIntelData } from './context/IntelDataContext';

const SECTION_HEADERS: Record<NavSection, { eyebrow: string; title: string; subtitle: string }> = {
  COMMAND_CENTER: {
    eyebrow: 'INVESTIGATIVE INTELLIGENCE WORKSTATION',
    title: 'INTELLIGENCE COMMAND CENTER',
    subtitle: 'Evidence-backed relationship discovery for human investigators.',
  },
  DATA_INGESTION: {
    eyebrow: 'PIPELINE / 01',
    title: 'DATA INGESTION',
    subtitle: 'Import investigation records for relationship analysis.',
  },
  ENTITIES: {
    eyebrow: 'EXPLORATION / 02',
    title: 'ENTITY EXPLORER',
    subtitle: 'Resolved entities from synthetic investigation records.',
  },
  NETWORK: {
    eyebrow: 'INVESTIGATION / 03',
    title: 'NETWORK INVESTIGATION',
    subtitle: 'Trace potential relationship paths across fragmented records.',
  },
  LEADS: {
    eyebrow: 'REVIEW / 04',
    title: 'INVESTIGATIVE LEADS',
    subtitle: 'Potential relationships surfaced for human verification.',
  },
  EVIDENCE: {
    eyebrow: 'TRACEABILITY / 05',
    title: 'EVIDENCE REGISTER',
    subtitle: 'Every relationship is traceable to a source record.',
  },
};

function AppContent() {
  const [currentSection, setCurrentSection] = useState<NavSection>('COMMAND_CENTER');
  const [focusEntityId, setFocusEntityId] = useState<string | null>(null);
  const [activeEvidenceModalId, setActiveEvidenceModalId] = useState<string | null>(null);

  const { nodes, evidence, activeDatasetName, isCustomDataset, activeCaseId } = useIntelData();

  // If focusEntityId is null or not in nodes, fallback to first node
  const effectiveFocusId = focusEntityId && nodes.some(n => n.id === focusEntityId)
    ? focusEntityId
    : (nodes[0]?.id || 'P003');

  const currentHeader = SECTION_HEADERS[currentSection] || SECTION_HEADERS.COMMAND_CENTER;
  const activeModalRecord = activeEvidenceModalId
    ? evidence.find((e) => e.id === activeEvidenceModalId) || null
    : null;

  const handleSelectEntity = (entityId: string) => {
    setFocusEntityId(entityId);
  };

  return (
    <div className="min-h-screen bg-void text-foreground grid-bg font-body selection:bg-signal/30">
      {/* Ambient background field */}
      <div className="fixed inset-0 pointer-events-none ambient-field" />

      {/* Main Shell Layout */}
      <div className="relative flex min-h-screen">
        {/* Left Sidebar */}
        <SidebarNav
          currentSection={currentSection}
          onSelectSection={setCurrentSection}
        />

        {/* Right Pane */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Header */}
          <TopNavHUD
            eyebrow={currentHeader.eyebrow}
            title={currentHeader.title}
            subtitle={currentHeader.subtitle}
            activeCase={isCustomDataset ? activeDatasetName : activeCaseId}
          />

          {/* Dynamic Content Views with Smooth Tab Transition */}
          <div className="flex-1 overflow-y-auto">
            <div key={currentSection} className="animate-tab-transition">
              {currentSection === 'COMMAND_CENTER' && (
                <CommandCenter
                  onNavigate={setCurrentSection}
                  onSelectEntity={handleSelectEntity}
                />
              )}

              {currentSection === 'DATA_INGESTION' && (
                <DataIngestionView
                  onNavigate={setCurrentSection}
                />
              )}

              {currentSection === 'ENTITIES' && (
                <EntitiesExplorer
                  focusId={effectiveFocusId}
                  onSelectEntity={handleSelectEntity}
                  onNavigate={setCurrentSection}
                />
              )}

              {currentSection === 'NETWORK' && (
                <NetworkHero
                  initialSelectedEntityId={effectiveFocusId}
                  onNavigate={setCurrentSection}
                />
              )}

              {currentSection === 'LEADS' && (
                <LeadsView
                  onNavigate={setCurrentSection}
                  onOpenEvidenceModal={(id) => setActiveEvidenceModalId(id)}
                />
              )}

              {currentSection === 'EVIDENCE' && (
                <EvidenceTimelineView
                  onOpenEvidenceModal={(id) => setActiveEvidenceModalId(id)}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Global Evidence Modal */}
      {activeModalRecord && (
        <EvidenceModal
          record={activeModalRecord}
          onClose={() => setActiveEvidenceModalId(null)}
        />
      )}
    </div>
  );
}

export function App() {
  return (
    <IntelDataProvider>
      <AppContent />
    </IntelDataProvider>
  );
}

export default App;

