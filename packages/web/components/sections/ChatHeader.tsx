'use client';

export type ViewMode = 'classic' | 'mini-canvas' | 'canvas' | 'arboreal';

export interface ChatHeaderProps {
  viewMode: ViewMode;
  methodology: string;
  onNewChat: () => void;
  onSetViewMode: (mode: ViewMode) => void;
  onOpenMindMap: (view: 'graph' | 'history') => void;
}

export default function ChatHeader({
  viewMode,
  methodology,
  onNewChat,
  onSetViewMode,
  onOpenMindMap,
}: ChatHeaderProps) {
  return (
    <header className="border-b border-relic-mist/50 dark:border-relic-slate/30 bg-white/80 dark:bg-relic-void/80 backdrop-blur-sm sticky top-0 z-20 animate-fade-in">
      <div className="max-w-3xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={onNewChat}
            className="text-[10px] uppercase tracking-[0.3em] text-relic-silver dark:text-relic-silver/70 hover:text-relic-slate dark:hover:text-relic-ghost transition-colors"
          >
            ◊ akhai
          </button>
          <div className="flex items-center gap-3">
            {/* View Mode — 3-way selector */}
            <button
              onClick={() => onSetViewMode('classic')}
              className={`text-[9px] uppercase tracking-wider transition-colors ${viewMode === 'classic' ? 'text-relic-slate dark:text-relic-ghost font-medium' : 'text-relic-silver/60 hover:text-relic-slate dark:hover:text-relic-ghost'}`}
            >
              ☰ classic
            </button>
            <button
              onClick={() => onSetViewMode('mini-canvas')}
              className={`text-[9px] uppercase tracking-wider transition-colors ${viewMode === 'mini-canvas' ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-relic-silver/60 hover:text-relic-slate dark:hover:text-relic-ghost'}`}
            >
              ◈ mini canvas
            </button>
            <button
              onClick={() => onSetViewMode('canvas')}
              className={`text-[9px] uppercase tracking-wider transition-colors ${viewMode === 'canvas' ? 'text-purple-600 dark:text-purple-400 font-medium' : 'text-relic-silver/60 hover:text-relic-slate dark:hover:text-relic-ghost'}`}
            >
              ◇ canvas
            </button>
            <button
              onClick={() => onSetViewMode('arboreal')}
              className={`text-[9px] uppercase tracking-wider transition-colors ${viewMode === 'arboreal' ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-relic-silver/60 hover:text-relic-slate dark:hover:text-relic-ghost'}`}
            >
              ◇ arboreal
            </button>
            <span className="text-[10px] text-relic-silver dark:text-relic-silver/70">
              {methodology}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-blink-green" />
              <span className="text-[9px] uppercase tracking-wider text-relic-silver dark:text-relic-silver/70 font-medium">
                guard active
              </span>
            </div>
            {/* Quick Nav — accessible from chat view */}
            <span className="text-relic-mist dark:text-relic-slate/30">|</span>
            <button
              onClick={() => onOpenMindMap('graph')}
              className="text-[9px] uppercase tracking-wider text-relic-silver/60 hover:text-relic-slate dark:hover:text-relic-ghost transition-colors"
            >
              mindmap
            </button>
            <button
              onClick={() => onOpenMindMap('history')}
              className="text-[9px] uppercase tracking-wider text-relic-silver/60 hover:text-relic-slate dark:hover:text-relic-ghost transition-colors"
            >
              history
            </button>
            <a
              href="/grimoires"
              className="text-[9px] uppercase tracking-wider text-relic-silver/60 hover:text-relic-slate dark:hover:text-relic-ghost transition-colors"
            >
              grimoire
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
