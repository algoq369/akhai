'use client';

import { Message } from '@/lib/chat-store';
import { LAYER_METADATA } from '@/lib/layer-registry';
import AntipatternBadge from '@/components/AntipatternBadge';

interface GnosticDetailsProps {
  message: Message;
  isVisible: boolean;
  onToggle: () => void;
}

export default function GnosticDetails({ message, isVisible, onToggle }: GnosticDetailsProps) {
  if (!message.gnostic) return null;

  return (
    <div className="mt-2">
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-relic-silver hover:text-relic-slate dark:hover:text-relic-ghost transition-colors mb-3"
      >
        <span className="text-relic-silver">⟁</span>
        <span>Gnostic Details</span>
        <span className="text-relic-mist">{isVisible ? '▼' : '▶'}</span>
      </button>

      {isVisible && (
        <div className="space-y-4 animate-fade-in">
          {/* Antipatterns Purification Notice */}
          {message.gnostic.antipatternPurified && (
            <AntipatternBadge
              antipatternType={message.gnostic.antipatternType}
              severity={message.gnostic.antipatternCritique?.severity ?? 0.5}
              critique={message.gnostic.antipatternCritique ?? null}
            />
          )}

          {/* Sovereignty Reminder */}
          {message.gnostic.sovereigntyFooter && (
            <div className="bg-relic-ghost/50 dark:bg-relic-void/30 border border-relic-mist dark:border-relic-slate/30 p-3">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-relic-slate dark:text-relic-ghost mb-2">
                <span>◈</span>
                <span>sovereignty reminder</span>
              </div>
              <p className="text-[10px] text-relic-silver leading-relaxed whitespace-pre-wrap">
                {message.gnostic.sovereigntyFooter}
              </p>
            </div>
          )}

          {/* Ascent Progress */}
          {message.gnostic.progressState && (
            <div className="bg-relic-ghost/50 dark:bg-relic-void/30 border border-relic-mist dark:border-relic-slate/30 p-3">
              <div className="text-[9px] text-relic-silver uppercase tracking-[0.2em] mb-3">
                Layer Ascent
              </div>
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-relic-mist/50 dark:border-relic-slate/20">
                <span className="text-[10px] text-relic-silver">Current Level:</span>
                <div className="text-[10px] font-mono text-relic-slate dark:text-white">
                  {message.gnostic.progressState.levelName} (
                  {message.gnostic.progressState.currentLevel}/11)
                </div>
              </div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-relic-silver">Velocity:</span>
                <span className="text-[10px] font-mono text-relic-slate dark:text-relic-ghost">
                  {message.gnostic.progressState.velocity.toFixed(2)} levels/query
                  {message.gnostic.progressState.velocity > 2.0 && ' ⚡'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-relic-silver">Total Queries:</span>
                <span className="text-[10px] font-mono text-relic-slate dark:text-relic-ghost">
                  {message.gnostic.progressState.totalQueries}
                </span>
              </div>
              {message.gnostic.progressState.nextElevation && (
                <div className="mt-3 pt-3 border-t border-relic-mist/50 dark:border-relic-slate/20">
                  <div className="text-[9px] text-relic-silver uppercase tracking-wider mb-1">
                    Next Elevation
                  </div>
                  <p className="text-[10px] text-relic-slate dark:text-relic-ghost leading-relaxed">
                    {message.gnostic.progressState.nextElevation}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Detailed Layer Activations */}
          {message.gnostic.layerAnalysis?.activations && (
            <div className="bg-relic-ghost/50 dark:bg-relic-void/30 border border-relic-mist dark:border-relic-slate/30 p-3">
              <div className="text-[9px] text-relic-silver uppercase tracking-[0.2em] mb-3">
                Layer Analysis
              </div>
              <div className="space-y-1.5">
                {(() => {
                  // Convert Record<Layer, number> to array and sort
                  const activationsArray = Object.entries(message.gnostic.layerAnalysis.activations)
                    .map(([layerNode, activation]) => ({
                      layerNode: parseInt(layerNode),
                      activation,
                    }))
                    .sort((a, b) => b.activation - a.activation)
                    .slice(0, 5);

                  return activationsArray.map((act, idx) => {
                    const layerNode = Object.entries(LAYER_METADATA).find(
                      ([_, meta]) => meta.level === act.layerNode
                    )?.[1];
                    if (!layerNode) return null;
                    const percentage = Math.round(act.activation * 100);
                    return (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-[10px] text-relic-slate dark:text-relic-ghost">
                          {layerNode.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-1.5 bg-relic-mist dark:bg-relic-slate/30 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-relic-slate dark:bg-relic-ghost transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-[9px] font-mono text-relic-silver w-8 text-right">
                            {percentage}%
                          </span>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
              {message.gnostic?.layerAnalysis?.dominant && (
                <div className="mt-3 pt-2 border-t border-relic-mist/50 dark:border-relic-slate/20">
                  <div className="text-[9px] text-relic-silver">
                    Dominant:{' '}
                    <span className="text-relic-slate dark:text-white font-medium">
                      {message.gnostic.layerAnalysis.dominant}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Synthesis Insight */}
          {message.gnostic.layerAnalysis.synthesisInsight && (
            <div className="bg-relic-ghost/50 dark:bg-relic-void/30 border border-relic-mist dark:border-relic-slate/30 p-3">
              <div className="text-[10px] uppercase tracking-wider text-relic-slate dark:text-relic-ghost mb-2">
                Synthesis Insight
              </div>
              <p className="text-[10px] text-relic-silver leading-relaxed mb-2">
                {message.gnostic.layerAnalysis.synthesisInsight.insight}
              </p>
              <div className="text-[9px] text-relic-mist font-mono">
                Confidence:{' '}
                {(message.gnostic.layerAnalysis.synthesisInsight.confidence * 100).toFixed(0)}%
              </div>
            </div>
          )}

          {/* Meta-Core Protocol State */}
          {message.gnostic.metaCoreState && (
            <div className="bg-relic-ghost/50 dark:bg-relic-void/30 border border-relic-mist dark:border-relic-slate/30 p-3">
              <div className="text-[9px] text-relic-silver mb-3">Meta-Cognitive Protocol</div>
              <div className="space-y-2 text-[10px]">
                <div className="flex justify-between items-baseline">
                  <span className="text-relic-silver">Intent:</span>
                  <span className="text-relic-slate dark:text-relic-ghost text-right ml-4">
                    {message.gnostic.metaCoreState.intent}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-relic-silver">Boundary:</span>
                  <span className="text-relic-slate dark:text-relic-ghost text-right ml-4">
                    {message.gnostic.metaCoreState.boundary}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-relic-silver">Reflection:</span>
                  <span className="text-relic-slate dark:text-relic-ghost font-mono">
                    {message.gnostic.metaCoreState.reflectionMode ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-relic-silver">Ascent Level:</span>
                  <span className="text-relic-slate dark:text-relic-ghost font-mono">
                    {message.gnostic.metaCoreState.ascentLevel}/10
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Dominant Layer */}
          <div className="text-[9px] text-relic-silver text-center border-t border-relic-mist/30 dark:border-relic-slate/20 pt-3">
            <div className="mb-1">Dominant Layer:</div>
            <div className="font-mono text-relic-slate dark:text-white">
              {message.gnostic.layerAnalysis.dominant}
            </div>
            <div className="text-[8px] text-relic-mist mt-1">
              Average Level: {message.gnostic.layerAnalysis.averageLevel.toFixed(1)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
