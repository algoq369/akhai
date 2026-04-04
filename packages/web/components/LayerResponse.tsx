'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SparklesIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { CoreInsight, CATEGORY_CONFIG, extractHighLevelInsights } from './LayerResponseUtils';
import LayerResponseListView from './LayerResponseListView';
import LayerResponseTreeView from './LayerResponseTreeView';
import LayerResponseFooter from './LayerResponseFooter';

interface LayerResponseProps {
  content: string;
  query: string;
  methodology?: string;
  onClose?: () => void;
  onSwitchToInsight?: () => void;
  onOpenMindMap?: () => void;
  onDeepDive?: (query: string) => void;
}

export default function LayerResponse({
  content,
  query,
  methodology = 'auto',
  onClose,
  onSwitchToInsight,
  onOpenMindMap,
  onDeepDive,
}: LayerResponseProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('list');

  const insights = useMemo(() => extractHighLevelInsights(content, query), [content, query]);

  const canShowInsight = useMemo(() => {
    const boldCount = (content.match(/\*\*[^*]+\*\*/g) || []).length;
    const headerCount = (content.match(/^#+\s*.+$/gm) || []).length;
    const bulletCount = (content.match(/^[-•*]\s+.+$/gm) || []).length;
    return boldCount >= 2 || headerCount >= 2 || bulletCount >= 3;
  }, [content]);

  const grouped = useMemo(() => {
    const groups: Record<string, CoreInsight[]> = {
      executive: [],
      strategy: [],
      action: [],
      insight: [],
      data: [],
    };
    insights.forEach((ins) => groups[ins.category].push(ins));
    return groups;
  }, [insights]);

  const connections = useMemo(() => {
    const conns: Array<{ from: string; to: string; strength: number }> = [];
    insights.forEach((a, i) => {
      insights.slice(i + 1).forEach((b) => {
        const wordsA = new Set(a.fullContent.toLowerCase().split(/\s+/));
        const wordsB = new Set(b.fullContent.toLowerCase().split(/\s+/));
        const intersection = [...wordsA].filter((w) => wordsB.has(w) && w.length > 3);
        const strength = intersection.length / Math.min(wordsA.size, wordsB.size);

        if (strength > 0.2) {
          conns.push({ from: a.id, to: b.id, strength });
        }
      });
    });
    return conns;
  }, [insights]);

  const layout = useMemo(() => {
    const total = insights.length;
    if (total <= 3) return 'compact' as const;
    if (total <= 6) return 'dual' as const;
    return 'full' as const;
  }, [insights]);

  const stats = useMemo(() => {
    const totalMetrics = insights.reduce((sum, ins) => sum + ins.metrics.length, 0);
    const avgDataDensity = Math.round(
      (insights.reduce((a, b) => a + b.dataDensity, 0) / insights.length) * 100
    );

    return {
      total: insights.length,
      avgConfidence: Math.round(
        (insights.reduce((a, b) => a + b.confidence, 0) / insights.length) * 100
      ),
      avgImpact: Math.round((insights.reduce((a, b) => a + b.impact, 0) / insights.length) * 100),
      categories: Object.entries(grouped).filter(([, items]) => items.length > 0).length,
      totalMetrics,
      avgDataDensity,
    };
  }, [insights, grouped]);

  if (insights.length < 2) {
    return <FallbackView content={content} />;
  }

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
      <div className="rounded-xl border border-slate-200/60 dark:border-relic-slate/30 bg-white dark:bg-relic-slate/20 overflow-hidden shadow-sm">
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-relic-slate/30 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-relic-slate/30 transition-colors"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-sm">
              <SparklesIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white">
                {(() => {
                  const queryWords = query.split(' ').filter((w) => w.length > 3);
                  const keyTopic = queryWords.slice(0, 3).join(' ');
                  const topCategory =
                    Object.entries(grouped)
                      .filter(([, items]) => items.length > 0)
                      .sort((a, b) => b[1].length - a[1].length)[0]?.[0] || 'insight';

                  return keyTopic.length > 40
                    ? `${keyTopic.substring(0, 37)}... — ${topCategory} synthesis`
                    : `${keyTopic} — ${topCategory} analysis`;
                })()}
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-relic-ghost/70 font-mono">
                {insights.length} insights · {stats.totalMetrics} data points ·{' '}
                {stats.avgDataDensity}% data · {stats.avgConfidence}% confidence
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-100 dark:bg-relic-slate/40">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setViewMode('list');
                }}
                className={`px-2 py-1 text-[9px] rounded-md transition-all ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-relic-void shadow-sm text-slate-700 dark:text-white'
                    : 'text-slate-500 dark:text-relic-ghost'
                }`}
              >
                ≡ List
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setViewMode('tree');
                }}
                className={`px-2 py-1 text-[9px] rounded-md transition-all ${
                  viewMode === 'tree'
                    ? 'bg-white dark:bg-relic-void shadow-sm text-slate-700 dark:text-white'
                    : 'text-slate-500 dark:text-relic-ghost'
                }`}
              >
                ◎ Tree
              </button>
            </div>
            {isCollapsed ? (
              <ChevronDownIcon className="w-4 h-4 text-slate-400 dark:text-relic-ghost" />
            ) : (
              <ChevronUpIcon className="w-4 h-4 text-slate-400 dark:text-relic-ghost" />
            )}
          </div>
        </div>

        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              {/* Stats Bar */}
              <div className="px-4 py-2 bg-slate-50/50 dark:bg-relic-slate/10 border-b border-slate-100 dark:border-relic-slate/30 flex items-center gap-4">
                <div className="flex items-center gap-3">
                  {Object.entries(grouped)
                    .filter(([, items]) => items.length > 0)
                    .map(([cat, items]) => {
                      const config = CATEGORY_CONFIG[cat as keyof typeof CATEGORY_CONFIG];
                      return (
                        <div key={cat} className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${config.dot}`} />
                          <span className="text-[10px] text-slate-600 dark:text-relic-ghost capitalize">
                            {cat}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-relic-ghost/60">
                            ({items.length})
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {viewMode === 'list' ? (
                <LayerResponseListView
                  insights={insights}
                  expandedId={expandedId}
                  setExpandedId={setExpandedId}
                  onDeepDive={onDeepDive}
                />
              ) : (
                <LayerResponseTreeView
                  insights={insights}
                  connections={connections}
                  layout={layout}
                  expandedId={expandedId}
                  setExpandedId={setExpandedId}
                  onDeepDive={onDeepDive}
                />
              )}

              <LayerResponseFooter
                insights={insights}
                connections={connections}
                grouped={grouped}
                stats={stats}
                viewMode={viewMode}
                query={query}
                canShowInsight={canShowInsight}
                onSwitchToInsight={onSwitchToInsight}
                onOpenMindMap={onOpenMindMap}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ── Fallback view for responses with < 2 insights ─────────── */

function FallbackView({ content }: { content: string }) {
  const words = content.split(/\s+/).filter((w) => w.length > 0);
  const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const keywords = [
    ...new Set(
      words.filter((w) => w.length > 4 && /^[a-zA-Z]+$/.test(w)).map((w) => w.toLowerCase())
    ),
  ].slice(0, 3);
  const summary = content
    .replace(/[#*`\-]/g, '')
    .trim()
    .substring(0, 200);

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
      <div className="rounded-xl border border-slate-200/60 dark:border-relic-slate/30 bg-white dark:bg-relic-slate/20 overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-relic-slate/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-sm">
              <SparklesIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white">
                Response Analysis
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-relic-ghost/70 font-mono">
                {words.length} words · {sentences.length} sentences
              </p>
            </div>
          </div>
        </div>
        <div className="p-4 space-y-3">
          {keywords.length > 0 && (
            <div>
              <div className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                Keywords
              </div>
              <div className="flex flex-wrap gap-1.5">
                {keywords.map((kw, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400 font-mono"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div>
            <div className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
              Summary
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              {summary}
              {summary.length >= 200 ? '...' : ''}
            </p>
          </div>
          <p className="text-[9px] text-slate-400 dark:text-slate-500 italic pt-1">
            Layer analysis available with more structured responses
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export function shouldShowLayers(content: string, hasGnosticData: boolean = false): boolean {
  if (hasGnosticData) {
    return true;
  }

  const headerCount = (content.match(/^#+\s*.+$/gm) || []).length;
  const boldCount = (content.match(/\*\*[^*]+\*\*/g) || []).length;
  const bulletCount = (content.match(/^[-•*]\s+.+$/gm) || []).length;

  return headerCount >= 1 || boldCount >= 2 || bulletCount >= 2 || content.length > 200;
}
