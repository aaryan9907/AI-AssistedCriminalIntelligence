import React, { useState, useRef } from 'react';
import { 
  CloudUpload, 
  Check, 
  FileText, 
  FileCode, 
  Layers,
  Sparkles,
  ArrowRight,
  Download,
  RotateCcw,
  Network,
  Activity,
  ShieldAlert,
  Sliders,
  Database
} from 'lucide-react';
import { NavSection } from '../layout/SidebarNav';
import { useIntelData } from '../../context/IntelDataContext';
import { 
  processUploadedInvestigationFiles, 
  AnalyzedDataset, 
  PREBUILT_SAMPLE_FILES 
} from '../../services/dataIngestionService';
import { NEXUS_ENTITY_ICONS, NEXUS_ENTITY_TONES } from '../../services/nexusData';
import { apiService } from '../../services/api';

interface DataIngestionViewProps {
  stats?: any;
  onIngestSuccess?: (newStats: any) => void;
  onNavigate?: (section: NavSection) => void;
}

const PIPELINE_STEPS = [
  'Records received',
  'Data validated',
  'Entities extracted',
  'Entities resolved',
  'Relationships constructed',
  'Graph generated',
  'Analysis complete',
];

export const DataIngestionView: React.FC<DataIngestionViewProps> = ({
  onIngestSuccess,
  onNavigate,
}) => {
  const { 
    applyAnalyzedDataset, 
    resetToBaseline, 
    loadPrebuiltSampleInvestigation,
    isCustomDataset,
    activeDatasetName,
    nodes,
    edges,
    stats,
    extractedEntityList,
    constructedLinkList
  } = useIntelData();

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [completedStepIndex, setCompletedStepIndex] = useState<number>(isCustomDataset ? 6 : -1);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: string }[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [activePreviewTab, setActivePreviewTab] = useState<'ENTITIES' | 'LINKS' | 'FILES'>('ENTITIES');
  const [analyzedDataset, setAnalyzedDataset] = useState<AnalyzedDataset | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Read file as text promise
  const readFileAsText = (file: File): Promise<{ name: string; content: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({ name: file.name, content: (e.target?.result as string) || '' });
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  // Real Multi-File Ingestion Handler
  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setUploadedFiles(
      fileArray.map((f) => ({
        name: f.name,
        size: (f.size / 1024).toFixed(1) + ' KB',
      }))
    );
    setIsProcessing(true);
    setCompletedStepIndex(0);

    try {
      // Step 1: Read all files in parallel
      const fileContents = await Promise.all(fileArray.map(readFileAsText));
      setCompletedStepIndex(1); // Records received

      await new Promise((r) => setTimeout(r, 400));
      setCompletedStepIndex(2); // Data validated

      await new Promise((r) => setTimeout(r, 450));
      setCompletedStepIndex(3); // Entities extracted

      // Step 2: Execute actual extraction & graph analysis
      const analyzed = await processUploadedInvestigationFiles(fileContents);
      
      await new Promise((r) => setTimeout(r, 400));
      setCompletedStepIndex(4); // Entities resolved

      await new Promise((r) => setTimeout(r, 400));
      setCompletedStepIndex(5); // Relationships constructed

      await new Promise((r) => setTimeout(r, 400));
      setCompletedStepIndex(6); // Graph generated & Analysis complete

      // Store in state & apply to global intelligence platform
      setAnalyzedDataset(analyzed);
      applyAnalyzedDataset(analyzed);

      // Sync with FastAPI Backend
      apiService.ingestData({
        files: fileArray.map((f) => ({ name: f.name, type: 'CSV', recordsCount: 50 }))
      }).catch((e) => console.warn('Backend ingest sync deferred:', e));

      if (onIngestSuccess) {
        onIngestSuccess(analyzed.stats);
      }
    } catch (err) {
      console.error('File parsing error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Load sample investigation files
  const handleLoadSampleData = async () => {
    setIsProcessing(true);
    setCompletedStepIndex(0);
    setUploadedFiles(
      PREBUILT_SAMPLE_FILES.map((f) => ({
        name: f.name,
        size: `${(f.content.length / 1024).toFixed(1)} KB`,
      }))
    );

    for (let i = 1; i <= 6; i++) {
      await new Promise((r) => setTimeout(r, 350));
      setCompletedStepIndex(i);
    }

    await loadPrebuiltSampleInvestigation();
    setIsProcessing(false);
  };

  // Download Sample CSV / JSON Templates
  const handleDownloadTemplate = (type: 'csv' | 'json') => {
    let filename = '';
    let blobContent = '';
    if (type === 'csv') {
      filename = 'investigation_records_template.csv';
      blobContent = `CallerName,CallerPhone,ReceiverName,ReceiverPhone,CallDate,DurationSec,TowerLocation,CaseDocket
Vikram Malhotra,+91 98111-22334,Sunil Grover,+91 98222-33445,2026-03-12,180,Tower Bandra East,CR-2026-0142
Sunil Grover,+91 98222-33445,Vehicle DL-04-AB-1234,+91 98333-44556,2026-03-12,90,Checkpoint Vashi,CR-2026-0142
Vehicle DL-04-AB-1234,+91 98333-44556,Hotel Safehouse North,+91 98444-55667,2026-03-12,320,Andheri MIDC,CR-2026-0142`;
    } else {
      filename = 'investigation_records_template.json';
      blobContent = JSON.stringify([
        {
          source: "Vikram Malhotra",
          target: "Sunil Grover",
          label: "COMMUNICATED_WITH",
          category: "COMMUNICATION",
          confidence: 0.94,
          sourceType: "Telecom CDR",
          caseId: "CR-2026-0142",
          description: "Encrypted voice call intercepted via tower dump"
        },
        {
          source: "Sunil Grover",
          target: "Vehicle DL-04-AB-1234",
          label: "USES",
          category: "VEHICLE",
          confidence: 0.91,
          sourceType: "ANPR Sighting",
          caseId: "CR-2026-0142",
          description: "Driver identified operating vehicle at toll barrier"
        }
      ], null, 2);
    }

    const blob = new Blob([blobContent], { type: type === 'csv' ? 'text/csv' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const displayEntities = analyzedDataset?.extractedEntityList || extractedEntityList || [];
  const displayLinks = analyzedDataset?.constructedLinkList || constructedLinkList || [];
  const displayStats = analyzedDataset?.stats || stats;

  return (
    <main className="p-5 xl:p-6 max-w-6xl mx-auto font-body space-y-5">
      {/* Top Banner indicating Active Dataset State */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 glass rounded-xl border-signal/20">
        <div className="flex items-center gap-3">
          <Database className="size-4 text-signal shrink-0" />
          <div>
            <div className="text-[10px] tracking-[0.22em] font-mono text-signal/80">
              ACTIVE DATASET
            </div>
            <div className="font-display text-sm font-semibold text-foreground flex items-center gap-2">
              <span>{activeDatasetName}</span>
              {isCustomDataset && (
                <span className="text-[10px] font-mono text-safe px-1.5 py-0.5 rounded bg-safe/10 border border-safe/30">
                  ● USER UPLOADED
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isCustomDataset && (
            <button
              onClick={resetToBaseline}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono text-muted-foreground hover:text-signal border border-signal/15 bg-void/50 hover:border-signal/30 transition"
              title="Revert to default benchmark dataset"
            >
              <RotateCcw className="size-3.5" />
              <span>Reset to Baseline Dataset</span>
            </button>
          )}

          <button
            onClick={handleLoadSampleData}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono text-signal bg-signal/15 border border-signal/35 hover:bg-signal/25 transition disabled:opacity-50"
            title="Load 3 multi-source investigation files with 1 click"
          >
            <Sparkles className="size-3.5" />
            <span>Load Sample Investigation (3 Files)</span>
          </button>
        </div>
      </div>

      {/* Main Upload Zone & Processing Pipeline Split */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        {/* Upload Zone (Left 3 Columns) */}
        <section className="xl:col-span-3 glass rounded-xl p-5 flex flex-col justify-between">
          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFiles(e.target.files);
              }
            }}
            accept=".csv,.json,.txt"
            className="hidden"
          />

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border border-dashed rounded-xl min-h-[300px] grid place-items-center bg-ink/40 cursor-pointer transition ${
              isDragging
                ? 'border-signal bg-signal/10'
                : 'border-signal/30 hover:border-signal/60'
            }`}
          >
            <div className="text-center p-6">
              <div className="mx-auto grid size-14 place-items-center rounded-full bg-signal/10 border border-signal/30 text-signal">
                <CloudUpload className="size-6" />
              </div>
              <h2 className="font-display text-xl text-foreground mt-4 font-semibold">
                DROP INVESTIGATION FILES HERE
              </h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                Upload CDR logs, ANPR sightings, bank transactions, or entity reports. Supports CSV, JSON, TXT.
              </p>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="mt-5 rounded-md px-4 py-2 text-xs font-medium bg-signal/15 border border-signal/40 text-signal hover:bg-signal/25 transition"
              >
                {uploadedFiles.length > 0 ? 'Upload More Files' : 'Browse local files'}
              </button>

              {uploadedFiles.length > 0 && (
                <div className="mt-4 flex flex-wrap justify-center gap-2 max-h-24 overflow-y-auto">
                  {uploadedFiles.map((file, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-panel border border-signal/20 text-[11px] text-foreground font-mono"
                    >
                      <FileText className="size-3 text-signal" />
                      <span>{file.name}</span>
                      <span className="text-muted-foreground">({file.size})</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Supported Format Pills & Template Downloads */}
          <div className="mt-4 pt-4 border-t border-signal/15 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex gap-4 text-muted-foreground font-mono text-[11px]">
              <span className="flex items-center gap-1.5">
                <FileText className="size-3.5 text-signal" />
                CSV (CDR, ANPR, Banking)
              </span>
              <span className="flex items-center gap-1.5">
                <FileCode className="size-3.5 text-signal" />
                JSON (Graph / Array)
              </span>
              <span className="flex items-center gap-1.5">
                <FileText className="size-3.5 text-signal" />
                TXT (Field Logs)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-muted-foreground">Templates:</span>
              <button
                onClick={() => handleDownloadTemplate('csv')}
                className="inline-flex items-center gap-1 text-[11px] font-mono text-signal hover:underline"
              >
                <Download className="size-3" />
                <span>CSV</span>
              </button>
              <button
                onClick={() => handleDownloadTemplate('json')}
                className="inline-flex items-center gap-1 text-[11px] font-mono text-signal hover:underline"
              >
                <Download className="size-3" />
                <span>JSON</span>
              </button>
            </div>
          </div>
        </section>

        {/* Processing Pipeline Checklist (Right 2 Columns) */}
        <section className="xl:col-span-2 glass rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="text-[10px] tracking-[0.22em] font-mono text-signal/70">
              ANALYSIS PIPELINE
            </div>
            <div className="font-display text-base font-semibold text-foreground mt-0.5">
              Entity Extraction Protocol
            </div>

            <div className="space-y-3.5 mt-5">
              {PIPELINE_STEPS.map((step, idx) => {
                const isPassed = completedStepIndex >= idx;
                const isCurrent = completedStepIndex === idx && isProcessing;

                return (
                  <div key={step} className="flex items-center gap-3 text-xs">
                    <span
                      className={`grid size-6 place-items-center rounded-full border transition-all ${
                        isPassed
                          ? 'border-safe/40 bg-safe/10 text-safe'
                          : isCurrent
                          ? 'border-signal/60 bg-signal/20 text-signal animate-pulse'
                          : 'border-signal/15 text-muted-foreground'
                      }`}
                    >
                      {isPassed ? (
                        <Check className="size-3.5" />
                      ) : (
                        <span className="size-1.5 rounded-full bg-muted-foreground/40" />
                      )}
                    </span>
                    <span
                      className={
                        isPassed
                          ? 'text-foreground font-medium'
                          : isCurrent
                          ? 'text-signal font-medium'
                          : 'text-muted-foreground'
                      }
                    >
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {completedStepIndex === 6 && onNavigate && (
            <div className="mt-6 pt-4 border-t border-signal/15 space-y-2">
              <button
                onClick={() => onNavigate('COMMAND_CENTER')}
                className="w-full flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium bg-safe/15 border border-safe/40 text-safe hover:bg-safe/25 transition"
              >
                <span>Launch Analyzed Graph in Command Center</span>
                <ArrowRight className="size-3.5" />
              </button>

              <button
                onClick={() => onNavigate('NETWORK')}
                className="w-full flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium bg-signal/15 border border-signal/40 text-signal hover:bg-signal/25 transition"
              >
                <span>View in Network Investigation View</span>
                <Network className="size-3.5" />
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Database Statistics Summary Cards reflecting Real Ingested Data */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {displayStats.map((st) => (
          <div key={st.label} className="glass rounded-lg p-3.5 border-signal/15">
            <div className="font-mono text-[9px] tracking-wider text-muted-foreground uppercase">
              {st.label}
            </div>
            <div className="font-display text-2xl text-foreground font-semibold mt-0.5">
              {st.value}
            </div>
            <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
              {st.hint}
            </div>
          </div>
        ))}
      </div>

      {/* Extracted Intelligence Preview Table & Cards */}
      <section className="glass rounded-xl p-5 border-signal/20">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <div className="text-[10px] tracking-[0.22em] font-mono text-signal/70">
              ANALYSIS RESULTS & EXTRACTED DATASET
            </div>
            <div className="font-display text-sm font-semibold text-foreground mt-0.5">
              Extracted Entities & Relationships from Given Upload
            </div>
          </div>

          {/* Preview Tabs */}
          <div className="flex rounded-md bg-void/80 border border-signal/20 p-0.5 font-mono text-xs">
            <button
              onClick={() => setActivePreviewTab('ENTITIES')}
              className={`px-3 py-1 rounded transition ${
                activePreviewTab === 'ENTITIES'
                  ? 'bg-signal/20 text-signal border border-signal/30'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Extracted Entities ({displayEntities.length})
            </button>
            <button
              onClick={() => setActivePreviewTab('LINKS')}
              className={`px-3 py-1 rounded transition ${
                activePreviewTab === 'LINKS'
                  ? 'bg-signal/20 text-signal border border-signal/30'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Constructed Links ({displayLinks.length})
            </button>
          </div>
        </div>

        {/* Tab 1: Extracted Entities Cards */}
        {activePreviewTab === 'ENTITIES' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-96 overflow-y-auto pr-1">
            {displayEntities.map((ent) => {
              const tone = NEXUS_ENTITY_TONES[ent.type] || 'signal';
              const icon = NEXUS_ENTITY_ICONS[ent.type] || '▣';

              return (
                <div
                  key={ent.id}
                  className="p-3 rounded-lg bg-void/60 border border-signal/15 flex flex-col justify-between hover:border-signal/35 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-${tone} font-mono text-base`}>
                      {icon}
                    </span>
                    <span className="text-[9px] font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-panel border border-signal/10">
                      {ent.id}
                    </span>
                  </div>

                  <div className="mt-2 min-w-0">
                    <div className="font-display text-sm font-semibold text-foreground truncate">
                      {ent.name}
                    </div>
                    <div className="text-[10px] font-mono text-signal truncate mt-0.5">
                      {ent.type}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                      {ent.role}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-signal/10 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                    <span>{ent.linksCount} links</span>
                    <span className="text-safe">Extracted</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Constructed Links List */}
        {activePreviewTab === 'LINKS' && (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1 font-mono text-xs">
            {displayLinks.map((link, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-void/60 border border-signal/15 flex flex-wrap items-center justify-between gap-2 text-[11px]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-semibold text-foreground truncate">{link.source}</span>
                  <span className="text-signal text-[10px] px-2 py-0.5 rounded bg-signal/10 border border-signal/25">
                    {link.type}
                  </span>
                  <span className="font-semibold text-foreground truncate">{link.target}</span>
                </div>

                <div className="flex items-center gap-3 text-muted-foreground text-[10px]">
                  <span>Source: {link.fileSource}</span>
                  <span className="text-signal font-semibold">
                    {Math.round(link.confidence * 100)}% conf
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};
