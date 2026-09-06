import React, { useState } from 'react';
import { Terminal, Send, Sparkles, HelpCircle } from 'lucide-react';

interface JarvisCommandBarProps {
  onExecuteCommand: (command: string) => void;
  onSelectSuggestion: (query: string) => void;
}

const QUICK_SUGGESTIONS = [
  'Show connections for Rahul Sharma',
  'Find relationships between Rahul Sharma and Case CR-2026-0142',
  'Show all vehicles connected to this person',
  'Show cross-case relationships',
  'Find hidden relationships between Rahul Sharma and Amit Kumar',
];

export const JarvisCommandBar: React.FC<JarvisCommandBarProps> = ({
  onExecuteCommand,
  onSelectSuggestion,
}) => {
  const [inputVal, setInputVal] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    onExecuteCommand(inputVal.trim());
    setInputVal('');
  };

  return (
    <div className="w-full bg-[#070e22]/90 border-t border-cyan-500/20 px-4 py-2.5 backdrop-blur-md">
      <div className="flex flex-col gap-2">
        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-2 overflow-x-auto text-[11px] font-mono no-scrollbar py-0.5">
          <span className="shrink-0 text-slate-500 uppercase tracking-wider text-[10px] flex items-center gap-1 font-semibold">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>JARVIS QUERIES:</span>
          </span>
          {QUICK_SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => onSelectSuggestion(suggestion)}
              className="shrink-0 px-2.5 py-1 rounded-full bg-slate-900/90 hover:bg-cyan-950/60 border border-slate-700/80 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 transition-all font-mono text-[11px]"
            >
              {suggestion}
            </button>
          ))}
        </div>

        {/* Command Form */}
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <div className="absolute left-3.5 flex items-center pointer-events-none text-cyan-400">
            <Terminal className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Ask the investigation system (e.g. 'Show connections for Rahul Sharma' or 'Find hidden relationships')..."
            className="w-full bg-slate-950/90 border border-cyan-500/30 rounded-xl pl-10 pr-24 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
          />
          <button
            type="submit"
            disabled={!inputVal.trim()}
            className="absolute right-2 px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-semibold flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>DISCOVER</span>
            <Send className="w-3 h-3" />
          </button>
        </form>
      </div>
    </div>
  );
};
