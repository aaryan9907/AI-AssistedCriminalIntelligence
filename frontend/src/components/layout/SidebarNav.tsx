import React from 'react';
import { 
  Radar, 
  Database, 
  Layers, 
  Activity, 
  ShieldCheck, 
  Clock3 
} from 'lucide-react';

export type NavSection = 'COMMAND_CENTER' | 'DATA_INGESTION' | 'ENTITIES' | 'NETWORK' | 'LEADS' | 'EVIDENCE';

interface SidebarNavProps {
  currentSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  leadsCount?: number;
  anomaliesCount?: number;
}

const NAV_ITEMS = [
  { id: 'COMMAND_CENTER' as NavSection, label: 'Command Center', icon: Radar },
  { id: 'DATA_INGESTION' as NavSection, label: 'Data Ingestion', icon: Database },
  { id: 'ENTITIES' as NavSection, label: 'Entities', icon: Layers },
  { id: 'NETWORK' as NavSection, label: 'Network', icon: Activity },
  { id: 'LEADS' as NavSection, label: 'Leads', icon: ShieldCheck },
  { id: 'EVIDENCE' as NavSection, label: 'Evidence', icon: Clock3 },
];

export const SidebarNav: React.FC<SidebarNavProps> = ({
  currentSection,
  onSelectSection,
}) => {
  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col gap-1 p-4 glass border-r border-signal/10 h-screen sticky top-0">
      {/* Brand logo & title */}
      <div className="flex items-center gap-3 px-2 py-3 mb-4">
        <div className="grid size-9 place-items-center rounded-md bg-signal/15 border border-signal/40 text-signal font-mono text-sm pulse-glow">
          SI
        </div>
        <div>
          <div className="font-display font-semibold text-sm tracking-wide text-foreground">
            SIH·26189
          </div>
          <div className="text-[10px] tracking-[0.22em] text-signal/70 font-mono">
            LINK DISCOVERY
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentSection === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectSection(item.id)}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] font-medium border-l-2 transition-colors text-left ${
                isActive
                  ? 'bg-signal/10 text-foreground border-signal'
                  : 'text-muted-foreground hover:text-foreground border-transparent'
              }`}
            >
              <span
                className={`size-1.5 rounded-full shrink-0 ${
                  isActive
                    ? 'bg-signal shadow-[0_0_8px_var(--color-signal)]'
                    : 'bg-muted-foreground/40'
                }`}
              />
              <Icon className="size-3.5 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Synthetic Data Box */}
      <div className="mt-auto pt-4">
        <div className="rounded-md bg-panel/60 border border-signal/10 p-3">
          <div className="text-[10px] tracking-[0.22em] font-mono text-muted-foreground">
            SYNTHETIC DATA
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Prototype — no real records.
          </div>
        </div>
      </div>
    </aside>
  );
};
