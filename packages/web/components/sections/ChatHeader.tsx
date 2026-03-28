'use client';

export interface ChatHeaderProps {
  isCanvasMode: boolean;
  methodology: string;
  onNewChat: () => void;
  onToggleCanvas: () => void;
  onOpenMindMap: (view: 'graph' | 'history') => void;
}

export default function ChatHeader({
  isCanvasMode,
  methodology,
  onNewChat,
  onToggleCanvas,
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
            {/* Canvas Mode Toggle */}
            <button
              onClick={onToggleCanvas}
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-medium transition-all ${
                isCanvasMode
                  ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300'
                  : 'bg-relic-ghost text-relic-silver hover:bg-relic-mist dark:bg-relic-slate/30 dark:text-relic-ghost'
              }`}
            >
              <span>{isCanvasMode ? '◫' : '☰'}</span>
              <span>{isCanvasMode ? 'Canvas' : 'Classic'}</span>
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
