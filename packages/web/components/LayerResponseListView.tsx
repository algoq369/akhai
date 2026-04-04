'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { CoreInsight, CATEGORY_CONFIG } from './LayerResponseUtils';

interface LayerResponseListViewProps {
  insights: CoreInsight[];
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  onDeepDive?: (query: string) => void;
}

export default function LayerResponseListView({
  insights,
  expandedId,
  setExpandedId,
  onDeepDive,
}: LayerResponseListViewProps) {
  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-700">
      {insights.map((insight, idx) => {
        const config = CATEGORY_CONFIG[insight.category];
        const isExpanded = expandedId === insight.id;

        return (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.03 }}
            className={`group transition-colors ${isExpanded ? config.bg : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/50'}`}
          >
            <div className="px-3 py-2">
              <div
                className="flex items-start gap-2 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : insight.id)}
              >
                {/* Rank */}
                <div
                  className={`w-5 h-5 rounded ${config.badge} flex items-center justify-center flex-shrink-0`}
                >
                  <span className="text-[9px] font-bold">{insight.rank}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[10px] ${config.text}`}>{config.icon}</span>
                    <h4 className="text-[11px] font-medium text-slate-800 dark:text-slate-200 flex-1 min-w-0 truncate">
                      {insight.title}
                    </h4>

                    {/* Data Metrics Badges - PROMINENT */}
                    {insight.metrics.length > 0 && (
                      <div className="flex items-center gap-1">
                        {insight.metrics.slice(0, 3).map((metric, i) => (
                          <span
                            key={i}
                            className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-mono font-semibold"
                            title="Extracted metric"
                          >
                            {metric}
                          </span>
                        ))}
                        {insight.metrics.length > 3 && (
                          <span className="text-[8px] text-slate-400 font-mono">
                            +{insight.metrics.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Data Density Indicator */}
                  {insight.dataDensity > 0.3 && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden max-w-[100px]">
                        <div
                          className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 transition-all"
                          style={{ width: `${insight.dataDensity * 100}%` }}
                        />
                      </div>
                      <span className="text-[8px] text-slate-500 font-mono">
                        {Math.round(insight.dataDensity * 100)}% data
                      </span>
                    </div>
                  )}

                  {/* Expanded - Compact with Actions */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-2 overflow-hidden"
                      >
                        <p className="text-[10px] text-slate-700 dark:text-slate-300 leading-relaxed mb-2 font-medium">
                          {insight.fullContent}
                        </p>

                        {/* All Metrics - Expanded View */}
                        {insight.metrics.length > 0 && (
                          <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                            <div className="text-[8px] text-blue-600 dark:text-blue-400 font-semibold mb-1 uppercase tracking-wide">
                              📊 Key Data Points ({insight.metrics.length})
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {insight.metrics.map((metric, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 font-mono font-bold"
                                >
                                  {metric}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-[8px] px-1.5 py-0.5 rounded ${config.badge} capitalize font-semibold`}
                          >
                            {insight.category}
                          </span>
                          <span className="text-[8px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono">
                            {Math.round(insight.dataDensity * 100)}% data
                          </span>
                          {/* Actions - Open in new tab */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeepDive?.(`Explain more about: ${insight.title}`);
                            }}
                            className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors font-medium"
                          >
                            🔍 Deep Dive
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const copyText = `${insight.title}\n\n${insight.fullContent}\n\nMetrics: ${insight.metrics.join(', ')}`;
                              navigator.clipboard.writeText(copyText);
                            }}
                            className="text-[8px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium"
                          >
                            📋 Copy All
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Metrics - Compact */}
                <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono text-emerald-600 font-bold">
                      {Math.round(insight.confidence * 100)}%
                    </span>
                    <span className="text-[9px] font-mono text-blue-600 font-bold">
                      {Math.round(insight.impact * 100)}%
                    </span>
                    <ChevronDownIcon
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </div>
                  {insight.metrics.length > 0 && (
                    <span className="text-[7px] text-blue-600 font-mono font-semibold">
                      {insight.metrics.length} metrics
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
