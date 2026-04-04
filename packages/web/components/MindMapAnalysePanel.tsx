'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { Node } from './MindMap';
import type { ClusterData } from './MindMapUtils';
import { getClusterColor } from './MindMapUtils';

export interface AnalyseData {
  queryCount: number;
  connections: number;
  clusters: number;
  clusterBreakdown: Record<string, number>;
  internalConns: number;
  crossConns: number;
  topConnections: { id: string; name: string; category: string; strength: number }[];
  bridges: string[];
}

interface AnalysePanelProps {
  analyseOpen: boolean;
  selectedTopic: Node | null;
  analyseData: AnalyseData | null;
  clusters: ClusterData[];
  aiLoading: boolean;
  aiInsight: string | null;
  onAnalyse: () => void;
  onClose: () => void;
  onContinueToChat?: (query: string) => void;
}

export default function MindMapAnalysePanel({
  analyseOpen,
  selectedTopic,
  analyseData,
  clusters,
  aiLoading,
  aiInsight,
  onAnalyse,
  onClose,
  onContinueToChat,
}: AnalysePanelProps) {
  return (
    <AnimatePresence mode="wait">
      {analyseOpen && selectedTopic && analyseData && (
        <motion.div
          key={selectedTopic.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute inset-x-0 bottom-10 mx-auto max-w-xs z-50"
        >
          <div
            className="bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden"
            style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 border-b border-slate-100">
              <div>
                <h3 className="font-semibold text-slate-800 text-xs">{selectedTopic.name}</h3>
                <p className="text-[9px] text-slate-500">{selectedTopic.category || 'other'}</p>
              </div>
              <button
                onClick={onClose}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Metrics row */}
            <div className="grid grid-cols-3 gap-px bg-slate-100">
              <div className="bg-white px-2 py-1.5 text-center">
                <div className="text-xs font-bold text-slate-800">{analyseData.queryCount}</div>
                <div className="text-[7px] text-slate-400 uppercase tracking-wider">queries</div>
              </div>
              <div className="bg-white px-2 py-1.5 text-center">
                <div className="text-xs font-bold text-slate-800">{analyseData.connections}</div>
                <div className="text-[7px] text-slate-400 uppercase tracking-wider">
                  connections
                </div>
              </div>
              <div className="bg-white px-2 py-1.5 text-center">
                <div className="text-xs font-bold text-slate-800">{analyseData.clusters}</div>
                <div className="text-[7px] text-slate-400 uppercase tracking-wider">clusters</div>
              </div>
            </div>

            {/* Connection map */}
            <div className="px-3 py-1.5 border-t border-slate-100">
              <div className="flex items-center gap-3 text-[8px] mb-1">
                <span className="text-slate-400">
                  internal:{' '}
                  <span className="text-slate-700 font-medium">{analyseData.internalConns}</span>
                </span>
                <span className="text-slate-400">
                  cross:{' '}
                  <span className="text-slate-700 font-medium">{analyseData.crossConns}</span>
                </span>
              </div>

              {/* Top connections */}
              {analyseData.topConnections.length > 0 && (
                <div className="space-y-1 mb-2">
                  <div className="text-[8px] text-slate-400 uppercase tracking-wider">
                    top connections
                  </div>
                  {analyseData.topConnections.slice(0, 3).map((conn) => {
                    const ci = clusters.findIndex((c) => c.category === conn.category);
                    const cc = getClusterColor(conn.category, ci >= 0 ? ci : 0);
                    return (
                      <div key={conn.id} className="flex items-center gap-1.5 text-[9px]">
                        <span
                          style={{ width: 4, height: 4, borderRadius: '50%', background: cc.text }}
                          className="inline-block flex-shrink-0"
                        />
                        <span className="text-slate-600 truncate">{conn.name}</span>
                        <span className="text-slate-300 ml-auto flex-shrink-0">
                          {conn.category}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Bridges */}
              {analyseData.bridges.length > 0 && (
                <div className="text-[9px] text-slate-400">
                  bridges to:{' '}
                  {analyseData.bridges.map((b, i) => {
                    const ci = clusters.findIndex((c) => c.category === b);
                    const cc = getClusterColor(b, ci >= 0 ? ci : 0);
                    return (
                      <span key={b}>
                        {i > 0 && ', '}
                        <span style={{ color: cc.text }}>{b}</span>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* AI Insight */}
            {(aiLoading || aiInsight) && (
              <div className="px-3 py-1.5 border-t border-slate-100">
                {aiLoading ? (
                  <div className="flex items-center gap-2 text-[9px] text-slate-400">
                    <div className="w-3 h-3 border border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                    analysing...
                  </div>
                ) : (
                  <p
                    className="text-[9px] text-slate-600 leading-relaxed"
                    style={{ maxHeight: 48, overflow: 'hidden' }}
                  >
                    {aiInsight}
                  </p>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border-t border-slate-100">
              <button
                onClick={onAnalyse}
                disabled={aiLoading}
                className="flex-1 px-2 py-1 text-[9px] font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors text-center disabled:opacity-50"
              >
                {aiLoading ? '\u25CC analysing...' : '\u25C7 analyse'}
              </button>
              <button
                onClick={() => {
                  onContinueToChat?.(`Tell me more about ${selectedTopic.name}`);
                  onClose();
                }}
                className="flex-1 px-2 py-1 text-[9px] font-medium text-white bg-slate-700 hover:bg-slate-800 rounded-lg transition-colors text-center"
              >
                &#x2192; continue
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
