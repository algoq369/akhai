'use client';

import LayerMini from '@/components/LayerMini';

interface DevelopmentTabProps {
  stats: any;
  setShowTopicsPanel: (show: boolean) => void;
}

export default function DevelopmentTab({ stats, setShowTopicsPanel }: DevelopmentTabProps) {
  return (
    <div className="space-y-4">
      {/* Development Level */}
      <div className="bg-white dark:bg-relic-void/50 border border-relic-mist dark:border-relic-slate/30 p-4">
        <div className="text-[10px] text-relic-silver dark:text-relic-ghost uppercase tracking-[0.2em] mb-3">
          development level
        </div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-light text-relic-slate dark:text-white">
              L{stats.developmentLevel}
            </span>
            <span className="text-[10px] text-relic-silver dark:text-relic-ghost">
              {stats.stats.total_points} / {stats.pointsForNextLevel} pts
            </span>
          </div>
          <div className="text-relic-silver dark:text-relic-ghost text-sm">
            {stats.developmentLevel >= 10
              ? '◊'
              : stats.developmentLevel >= 7
                ? '◊'
                : stats.developmentLevel >= 5
                  ? '◊'
                  : stats.developmentLevel >= 3
                    ? '•'
                    : '·'}
          </div>
        </div>
        <div className="w-full bg-relic-ghost dark:bg-relic-slate/20 h-[2px]">
          <div
            className="bg-relic-slate dark:bg-relic-ghost h-[2px] transition-all duration-500"
            style={{
              width: `${Math.min(100, (stats.stats.total_points / stats.pointsForNextLevel) * 100)}%`,
            }}
          />
        </div>
      </div>

      {/* Token Consumption */}
      <div className="bg-white dark:bg-relic-void/50 border border-relic-mist dark:border-relic-slate/30 p-4">
        <div className="text-[10px] text-relic-silver dark:text-relic-ghost uppercase tracking-[0.2em] mb-3">
          token consumption
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <div className="text-[9px] text-relic-mist dark:text-relic-slate uppercase tracking-wider mb-1">
              queries
            </div>
            <div className="text-sm font-mono text-relic-slate dark:text-white">
              {stats.stats.queries_completed}
            </div>
          </div>
          <div>
            <div className="text-[9px] text-relic-mist dark:text-relic-slate uppercase tracking-wider mb-1">
              tokens
            </div>
            <div className="text-sm font-mono text-relic-slate dark:text-white">
              {stats.stats.tokens_consumed.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-[9px] text-relic-mist dark:text-relic-slate uppercase tracking-wider mb-1">
              cost
            </div>
            <div className="text-sm font-mono text-relic-slate dark:text-white">
              ${stats.stats.cost_spent.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Methodology Usage */}
      <div className="bg-white dark:bg-relic-void/50 border border-relic-mist dark:border-relic-slate/30 p-4">
        <div className="text-[10px] text-relic-silver dark:text-relic-ghost uppercase tracking-[0.2em] mb-3">
          methodology usage
        </div>
        <div className="space-y-2">
          {stats.methodologyStats.map((method: any) => (
            <div key={method.methodology} className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-2 flex-1">
                <span className="font-mono text-relic-slate dark:text-white uppercase w-12">
                  {method.methodology}
                </span>
                <div className="flex-1 bg-relic-ghost dark:bg-relic-slate/20 h-[1px]">
                  <div
                    className="bg-relic-slate dark:bg-relic-ghost h-[1px] transition-all duration-500"
                    style={{
                      width: `${(method.count / stats.stats.queries_completed) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 text-relic-silver dark:text-relic-ghost font-mono ml-3">
                <span>{method.count}</span>
                <span>{method.tokens.toLocaleString()}</span>
                <span>${method.cost.toFixed(3)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Points System */}
      <div className="bg-relic-ghost dark:bg-relic-slate/20 border border-relic-mist dark:border-relic-slate/30 p-4">
        <div className="text-[10px] text-relic-silver dark:text-relic-ghost uppercase tracking-[0.2em] mb-2">
          points system
        </div>
        <div className="text-[10px] text-relic-silver dark:text-relic-ghost leading-relaxed space-y-1">
          <div>• 1 pt per query</div>
          <div>• bonus for advanced methods</div>
          <div>• tournaments coming soon</div>
        </div>
      </div>

      {/* Recent Activity */}
      {stats.recentActivity && stats.recentActivity.length > 0 && (
        <div className="bg-white dark:bg-relic-void/50 border border-relic-mist dark:border-relic-slate/30 p-4">
          <div className="text-[10px] text-relic-silver dark:text-relic-ghost uppercase tracking-[0.2em] mb-3">
            recent 30d
          </div>
          <div className="space-y-1">
            {stats.recentActivity.slice(0, 10).map((activity: any) => (
              <div
                key={activity.date}
                className="flex items-center justify-between text-[9px] font-mono"
              >
                <span className="text-relic-slate dark:text-white">{activity.date}</span>
                <div className="flex items-center gap-3 text-relic-silver dark:text-relic-ghost">
                  <span>{activity.queries}q</span>
                  <span>{activity.tokens.toLocaleString()}t</span>
                  <span>${activity.cost.toFixed(3)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mini Visualizations */}
      <div className="grid grid-cols-2 gap-4">
        {/* Mini AI Layers */}
        <div className="bg-white dark:bg-relic-void/50 border border-relic-mist dark:border-relic-slate/30 p-4 relative group">
          <div className="flex items-center justify-center min-h-[180px]">
            <LayerMini
              activations={{
                1: stats.developmentLevel >= 1 ? 1 : 0,
                2: stats.developmentLevel >= 2 ? 0.8 : 0,
                3: stats.developmentLevel >= 3 ? 0.6 : 0,
                4: stats.developmentLevel >= 4 ? 0.6 : 0,
                5: stats.developmentLevel >= 5 ? 0.4 : 0,
                6: stats.developmentLevel >= 6 ? 0.4 : 0,
                7: stats.developmentLevel >= 7 ? 0.2 : 0,
                8: stats.developmentLevel >= 8 ? 0.8 : 0,
                9: stats.developmentLevel >= 9 ? 0.8 : 0,
                10: stats.developmentLevel >= 10 ? 1 : 0,
                11: 0, // Synthesis
              }}
              userLevel={stats.developmentLevel}
              onExpand={() => {
                // TODO: Open full AI Layers visualization
                console.log('[Profile] Expand AI Layers visualization');
              }}
            />
          </div>
        </div>

        {/* Mini Topics Map */}
        <div className="bg-white dark:bg-relic-void/50 border border-relic-mist dark:border-relic-slate/30 p-4">
          <div className="text-[10px] text-relic-silver dark:text-relic-ghost uppercase tracking-[0.2em] mb-3">
            topics map
          </div>
          <button
            onClick={() => setShowTopicsPanel(true)}
            className="w-full h-32 border border-relic-mist dark:border-relic-slate/30 hover:border-relic-slate dark:hover:border-relic-ghost transition-colors flex flex-col items-center justify-center gap-2"
          >
            <div className="text-2xl text-relic-silver dark:text-relic-ghost">○</div>
            <div className="text-[9px] text-relic-silver dark:text-relic-ghost">view topics</div>
          </button>
        </div>
      </div>
    </div>
  );
}
