'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CoreInsight, CATEGORY_CONFIG } from './LayerResponseUtils';

interface ConnectionData {
  from: string;
  to: string;
  strength: number;
}

interface LayerResponseTreeViewProps {
  insights: CoreInsight[];
  connections: ConnectionData[];
  layout: 'compact' | 'dual' | 'full';
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  onDeepDive?: (query: string) => void;
}

export default function LayerResponseTreeView({
  insights,
  connections,
  layout,
  expandedId,
  setExpandedId,
  onDeepDive,
}: LayerResponseTreeViewProps) {
  return (
    <div className="relative p-4 min-h-[300px] bg-gradient-to-br from-slate-50/50 to-indigo-50/20">
      {/* SVG Connections Layer */}
      <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
        {connections.map((conn, i) => (
          <line
            key={i}
            x1="50%"
            y1="30%"
            x2="50%"
            y2="70%"
            stroke={`rgba(139, 92, 246, ${conn.strength})`}
            strokeWidth={conn.strength * 2}
            strokeDasharray={conn.strength > 0.5 ? '0' : '4,4'}
            className="transition-all"
          />
        ))}
      </svg>

      {/* Dynamic Layout */}
      {layout === 'compact' ? (
        <CompactLayout
          insights={insights}
          connections={connections}
          expandedId={expandedId}
          setExpandedId={setExpandedId}
          onDeepDive={onDeepDive}
        />
      ) : layout === 'dual' ? (
        <DualLayout
          insights={insights}
          connections={connections}
          expandedId={expandedId}
          setExpandedId={setExpandedId}
          onDeepDive={onDeepDive}
        />
      ) : (
        <FullLayout
          insights={insights}
          connections={connections}
          expandedId={expandedId}
          setExpandedId={setExpandedId}
        />
      )}

      {/* Connection Count Indicator */}
      {connections.length > 0 && (
        <div className="absolute bottom-2 right-2 text-[8px] text-slate-400 dark:text-relic-ghost/60">
          {connections.length} connections
        </div>
      )}
    </div>
  );
}

/* ── Compact Layout (Single Row - Few Insights) ─────────────── */

function CompactLayout({
  insights,
  connections,
  expandedId,
  setExpandedId,
  onDeepDive,
}: Omit<LayerResponseTreeViewProps, 'layout'>) {
  return (
    <div className="flex justify-center gap-4" style={{ zIndex: 10, position: 'relative' }}>
      {insights.slice(0, 3).map((insight, idx) => {
        const config = CATEGORY_CONFIG[insight.category];
        const isExpanded = expandedId === insight.id;
        const nodeConnections = connections.filter(
          (c) => c.from === insight.id || c.to === insight.id
        );

        return (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className={`relative cursor-pointer ${isExpanded ? 'z-50' : 'z-10'}`}
            onClick={() => setExpandedId(isExpanded ? null : insight.id)}
          >
            <div
              className={`px-4 py-3 rounded-xl border-2 ${config.bg} ${config.border} min-w-[180px] max-w-[240px] transition-all ${isExpanded ? 'shadow-lg scale-105' : 'hover:shadow-md'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2 h-2 rounded-full ${config.dot}`} />
                <span className={`text-[10px] font-semibold ${config.text} capitalize`}>
                  {insight.category}
                </span>
                {nodeConnections.length > 0 && (
                  <span className="text-[8px] text-slate-400">🔗{nodeConnections.length}</span>
                )}
              </div>
              <h4
                className={`text-[11px] font-medium ${config.text} ${isExpanded ? '' : 'line-clamp-2'}`}
              >
                {insight.title}
              </h4>

              {/* Data Metrics Preview - Collapsed */}
              {!isExpanded && insight.metrics.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {insight.metrics.slice(0, 2).map((metric, i) => (
                    <span
                      key={i}
                      className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-mono font-bold"
                    >
                      {metric}
                    </span>
                  ))}
                  {insight.metrics.length > 2 && (
                    <span className="text-[8px] text-slate-500 font-mono">
                      +{insight.metrics.length - 2}
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 mt-2">
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-mono font-bold">
                  {Math.round(insight.confidence * 100)}%
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-mono font-bold">
                  {Math.round(insight.impact * 100)}%
                </span>
                {insight.dataDensity > 0.3 && (
                  <span className="text-[8px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-600 font-mono">
                    {Math.round(insight.dataDensity * 100)}% data
                  </span>
                )}
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-3 pt-3 border-t border-white/50 space-y-2"
                  >
                    {/* Full Content */}
                    <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
                      {insight.fullContent}
                    </p>

                    {/* Extracted Data Metrics - PROMINENT */}
                    {insight.metrics.length > 0 && (
                      <div className="p-2 bg-blue-50 rounded border border-blue-200">
                        <div className="text-[8px] text-blue-600 font-bold mb-1.5 uppercase tracking-wide">
                          📊 Extracted Data ({insight.metrics.length})
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {insight.metrics.map((metric, i) => (
                            <span
                              key={i}
                              className="text-[10px] px-2 py-1 rounded bg-white border border-blue-300 text-blue-700 font-mono font-bold shadow-sm"
                            >
                              {metric}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Metrics */}
                    <div className="flex items-center gap-3 pt-2 flex-wrap">
                      <div className="flex items-center gap-1">
                        <span className="text-[8px] text-slate-500">Confidence:</span>
                        <span className="text-[9px] font-mono text-emerald-600 font-bold">
                          {Math.round(insight.confidence * 100)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[8px] text-slate-500">Impact:</span>
                        <span className="text-[9px] font-mono text-blue-600 font-bold">
                          {Math.round(insight.impact * 100)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[8px] text-slate-500">Data:</span>
                        <span className="text-[9px] font-mono text-indigo-600 font-bold">
                          {Math.round(insight.dataDensity * 100)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[8px] text-slate-500">Rank:</span>
                        <span className="text-[9px] font-mono text-slate-600 font-bold">
                          #{insight.rank}
                        </span>
                      </div>
                    </div>

                    {/* Connected Topics */}
                    {nodeConnections.length > 0 && (
                      <div className="pt-2">
                        <div className="text-[8px] text-slate-400 mb-1">
                          🔗 Connected to {nodeConnections.length} topics:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {nodeConnections.map((c, i) => {
                            const relatedId = c.from === insight.id ? c.to : c.from;
                            const related = insights.find((ins) => ins.id === relatedId);
                            if (!related) return null;
                            const relatedConfig = CATEGORY_CONFIG[related.category];

                            return (
                              <button
                                key={i}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedId(related.id);
                                }}
                                className={`text-[9px] px-2 py-1 rounded-md ${relatedConfig.badge} hover:opacity-80 transition-opacity`}
                              >
                                {related.title.substring(0, 30)}
                                {related.title.length > 30 ? '...' : ''}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5 pt-2 border-t border-white/30">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeepDive?.(`Explore: ${insight.title}`);
                        }}
                        className="text-[9px] px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                      >
                        ↗ Explore More
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(insight.fullContent);
                        }}
                        className="text-[9px] px-2 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                      >
                        📋 Copy
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Could integrate with Mind Map here
                        }}
                        className="text-[9px] px-2 py-1 rounded bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
                      >
                        🗺️ Add to Map
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ── Dual Layout (Two Rows - Medium Insights) ────────────────── */

function DualLayout({
  insights,
  connections,
  expandedId,
  setExpandedId,
  onDeepDive,
}: Omit<LayerResponseTreeViewProps, 'layout'>) {
  return (
    <>
      <div className="flex justify-center gap-4 mb-4" style={{ zIndex: 10, position: 'relative' }}>
        {insights.slice(0, 3).map((insight, idx) => {
          const config = CATEGORY_CONFIG[insight.category];
          const isExpanded = expandedId === insight.id;
          const nodeConnections = connections.filter(
            (c) => c.from === insight.id || c.to === insight.id
          );

          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`relative cursor-pointer ${isExpanded ? 'z-50' : 'z-10'}`}
              onClick={() => setExpandedId(isExpanded ? null : insight.id)}
            >
              <div
                className={`px-3 py-2 rounded-lg border-2 ${config.bg} ${config.border} transition-all ${isExpanded ? 'min-w-[240px] shadow-2xl' : 'min-w-[140px] max-w-[180px] hover:shadow-md'}`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                  <span className={`text-[9px] ${config.text}`}>{config.icon}</span>
                  {nodeConnections.length > 0 && (
                    <span className="text-[7px] text-slate-400">🔗{nodeConnections.length}</span>
                  )}
                </div>
                <h4
                  className={`text-[10px] font-medium ${config.text} ${isExpanded ? '' : 'line-clamp-2'}`}
                >
                  {insight.title}
                </h4>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-2 pt-2 border-t border-white/50 space-y-2"
                    >
                      <p className="text-[10px] text-slate-700 leading-relaxed">
                        {insight.fullContent}
                      </p>

                      <div className="flex items-center gap-2 text-[8px]">
                        <span className="text-emerald-600 font-semibold">
                          {Math.round(insight.confidence * 100)}%
                        </span>
                        <span className="text-blue-600 font-semibold">
                          {Math.round(insight.impact * 100)}%
                        </span>
                      </div>

                      {nodeConnections.length > 0 && (
                        <div className="text-[8px] text-slate-500">
                          🔗 {nodeConnections.length} connections
                        </div>
                      )}

                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeepDive?.(`Explore: ${insight.title}`);
                          }}
                          className="text-[8px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700"
                        >
                          ↗
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(insight.fullContent);
                          }}
                          className="text-[8px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700"
                        >
                          📋
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="flex justify-center mb-4">
        <div className="w-px h-8 bg-gradient-to-b from-purple-200 via-violet-300 to-emerald-200" />
      </div>

      <div className="flex justify-center gap-3" style={{ zIndex: 10, position: 'relative' }}>
        {insights.slice(3, 6).map((insight, idx) => {
          const config = CATEGORY_CONFIG[insight.category];
          const isExpanded = expandedId === insight.id;
          const nodeConnections = connections.filter(
            (c) => c.from === insight.id || c.to === insight.id
          );

          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + idx * 0.05 }}
              className={`cursor-pointer ${isExpanded ? 'z-50' : 'z-10'}`}
              onClick={() => setExpandedId(isExpanded ? null : insight.id)}
            >
              <div
                className={`px-3 py-2 rounded-lg border ${config.bg} ${config.border} transition-all ${isExpanded ? 'min-w-[200px] shadow-2xl' : 'min-w-[120px] max-w-[160px] hover:shadow'}`}
              >
                <div className="flex items-center gap-1.5">
                  <span className={`text-[9px] ${config.text}`}>{config.icon}</span>
                  <span
                    className={`text-[10px] font-medium ${config.text} ${isExpanded ? '' : 'line-clamp-1'}`}
                  >
                    {insight.title}
                  </span>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-2 pt-2 border-t border-white/50 space-y-1.5"
                    >
                      <p className="text-[9px] text-slate-700 leading-relaxed">
                        {insight.fullContent}
                      </p>
                      <div className="flex items-center gap-2 text-[8px]">
                        <span className="text-emerald-600">
                          {Math.round(insight.confidence * 100)}%
                        </span>
                        <span className="text-blue-600">{Math.round(insight.impact * 100)}%</span>
                        {nodeConnections.length > 0 && (
                          <span className="text-slate-400">🔗{nodeConnections.length}</span>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>
    </>
  );
}

/* ── Full Layout (Three Rows - Full Layout) ──────────────────── */

function FullLayout({
  insights,
  connections,
  expandedId,
  setExpandedId,
}: Omit<LayerResponseTreeViewProps, 'layout' | 'onDeepDive'>) {
  return (
    <>
      {/* Top: High-impact insights */}
      <div className="flex justify-center gap-3 mb-3" style={{ zIndex: 10, position: 'relative' }}>
        {insights.slice(0, 2).map((insight, idx) => {
          const config = CATEGORY_CONFIG[insight.category];
          const nodeConnections = connections.filter(
            (c) => c.from === insight.id || c.to === insight.id
          );
          const isExpanded = expandedId === insight.id;

          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`cursor-pointer ${isExpanded ? 'z-50' : 'z-10'}`}
              onClick={() => setExpandedId(isExpanded ? null : insight.id)}
            >
              <div
                className={`px-4 py-3 rounded-xl border-2 ${config.bg} ${config.border} transition-all hover:shadow-lg hover:scale-105 ${isExpanded ? 'min-w-[280px] shadow-2xl scale-105' : 'min-w-[160px] max-w-[200px]'}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full ${config.dot}`} />
                  <span className={`text-[10px] font-semibold ${config.text}`}>
                    {insight.category}
                  </span>
                  {nodeConnections.length > 0 && (
                    <span className="text-[8px] text-slate-400">🔗{nodeConnections.length}</span>
                  )}
                </div>
                <h4
                  className={`text-[11px] font-medium ${config.text} ${isExpanded ? '' : 'line-clamp-2'}`}
                >
                  {insight.title}
                </h4>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-3 pt-3 border-t border-white/50 space-y-2"
                    >
                      <p className="text-[10px] text-slate-700 leading-relaxed">
                        {insight.fullContent}
                      </p>
                      <div className="flex items-center gap-3 text-[8px]">
                        <span className="text-emerald-600 font-semibold">
                          {Math.round(insight.confidence * 100)}%
                        </span>
                        <span className="text-blue-600 font-semibold">
                          {Math.round(insight.impact * 100)}%
                        </span>
                        <span className="text-slate-600">#{insight.rank}</span>
                      </div>
                      {nodeConnections.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {nodeConnections.slice(0, 3).map((c, i) => {
                            const relatedId = c.from === insight.id ? c.to : c.from;
                            const related = insights.find((ins) => ins.id === relatedId);
                            if (!related) return null;
                            return (
                              <button
                                key={i}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedId(related.id);
                                }}
                                className="text-[8px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 hover:bg-slate-200"
                              >
                                → {related.title.substring(0, 20)}...
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Middle: Strategy/Action */}
      <div className="flex justify-center gap-3 mb-3" style={{ zIndex: 10, position: 'relative' }}>
        {insights.slice(2, 6).map((insight, idx) => {
          const config = CATEGORY_CONFIG[insight.category];
          const isExpanded = expandedId === insight.id;
          const nodeConnections = connections.filter(
            (c) => c.from === insight.id || c.to === insight.id
          );

          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + idx * 0.05 }}
              className={`cursor-pointer ${isExpanded ? 'z-50' : 'z-10'}`}
              onClick={() => setExpandedId(isExpanded ? null : insight.id)}
            >
              <div
                className={`px-3 py-2 rounded-lg border ${config.bg} ${config.border} transition-all hover:shadow hover:scale-105 ${isExpanded ? 'min-w-[220px] shadow-2xl scale-105' : 'min-w-[120px] max-w-[150px]'}`}
              >
                <div className="flex items-center gap-1.5">
                  <span className={`text-[9px] ${config.text}`}>{config.icon}</span>
                  <span
                    className={`text-[10px] font-medium ${config.text} ${isExpanded ? '' : 'line-clamp-1'}`}
                  >
                    {insight.title}
                  </span>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-2 pt-2 border-t border-white/50 space-y-1.5"
                    >
                      <p className="text-[9px] text-slate-700 leading-relaxed">
                        {insight.fullContent}
                      </p>
                      <div className="flex items-center gap-2 text-[8px]">
                        <span className="text-emerald-600">
                          {Math.round(insight.confidence * 100)}%
                        </span>
                        <span className="text-blue-600">{Math.round(insight.impact * 100)}%</span>
                        {nodeConnections.length > 0 && (
                          <span className="text-slate-400">🔗{nodeConnections.length}</span>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Bottom: Details/Data */}
      <div
        className="flex justify-center gap-2 flex-wrap"
        style={{ zIndex: 10, position: 'relative' }}
      >
        {insights.slice(6, 10).map((insight, idx) => {
          const config = CATEGORY_CONFIG[insight.category];
          const isExpanded = expandedId === insight.id;

          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + idx * 0.03 }}
              className={`cursor-pointer ${isExpanded ? 'z-50' : 'z-10'}`}
              onClick={() => setExpandedId(isExpanded ? null : insight.id)}
            >
              <div
                className={`px-2 py-1.5 rounded border ${config.bg} ${config.border} transition-all hover:shadow hover:scale-105 ${isExpanded ? 'min-w-[180px] shadow-xl scale-105' : 'min-w-[100px] max-w-[120px]'}`}
              >
                <span className={`text-[9px] ${config.text} ${isExpanded ? '' : 'line-clamp-1'}`}>
                  {insight.title}
                </span>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-2 pt-2 border-t border-white/50 dark:border-relic-slate/30"
                    >
                      <p className="text-[8px] text-slate-700 dark:text-relic-ghost/80 leading-relaxed">
                        {insight.fullContent}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5 text-[7px]">
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {Math.round(insight.confidence * 100)}%
                        </span>
                        <span className="text-blue-600 dark:text-blue-400">
                          {Math.round(insight.impact * 100)}%
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>
    </>
  );
}
