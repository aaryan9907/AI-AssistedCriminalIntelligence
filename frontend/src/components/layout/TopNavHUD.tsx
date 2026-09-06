import React, { useState, useEffect } from 'react';

export interface TopNavHUDProps {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  activeCase?: string;
}

export const TopNavHUD: React.FC<TopNavHUDProps> = ({
  eyebrow = 'INVESTIGATIVE INTELLIGENCE WORKSTATION',
  title = 'INTELLIGENCE COMMAND CENTER',
  subtitle = 'Evidence-backed relationship discovery for human investigators.',
  activeCase = 'CR-2026-0142',
}) => {
  const [timeStr, setTimeStr] = useState<string>('14:32:07');
  const [dateStr, setDateStr] = useState<string>('12 MAR 2026');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const time = now.toLocaleTimeString('en-GB', { hour12: false });
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const date = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
      setTimeStr(time);
      setDateStr(date);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-signal/10 glass sticky top-0 z-20">
      <div>
        <div className="text-[10px] tracking-[0.22em] font-mono text-signal/70 uppercase">
          {eyebrow}
        </div>
        <h1 className="font-display text-lg font-semibold tracking-wide text-foreground mt-1">
          {title}
        </h1>
        <p className="text-[12px] text-muted-foreground">
          {subtitle}
        </p>
      </div>

      <div className="flex items-center gap-6 font-mono text-[11px]">
        <div className="text-right">
          <div className="flex items-center gap-1.5 text-safe">
            <span className="size-1.5 rounded-full bg-safe blink" />
            SYSTEM ONLINE
          </div>
          <div className="text-muted-foreground mt-0.5">DATASET · LOADED</div>
        </div>

        <div className="h-8 w-px bg-signal/15" />

        <div className="text-right hidden sm:block">
          <div className="flex items-center gap-1.5 text-signal">
            <span className="size-1.5 rounded-full bg-signal shadow-[0_0_8px_var(--color-signal)]" />
            NETWORK ENGINE
          </div>
          <div className="text-muted-foreground mt-0.5">ADAPTIVE TOPOLOGY</div>
        </div>

        <div className="h-8 w-px bg-signal/15" />

        <div className="text-right">
          <div className="text-muted-foreground">ACTIVE INVESTIGATION</div>
          <div className="text-muted-foreground/70 mt-0.5">{activeCase}</div>
        </div>

        <div className="h-8 w-px bg-signal/15" />

        <div className="text-right">
          <div className="text-foreground text-sm">{timeStr}</div>
          <div className="text-muted-foreground/70 mt-0.5">{dateStr}</div>
        </div>
      </div>
    </header>
  );
};
