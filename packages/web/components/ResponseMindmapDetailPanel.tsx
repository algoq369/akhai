'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { SparklesIcon, BookOpenIcon, LinkIcon } from '@heroicons/react/24/outline';
import type { MindmapNode } from './ResponseMindmap.types';
import { NODE_GRADIENTS } from './ResponseMindmap.types';

interface MindmapDetailPanelProps {
  selectedNode: MindmapNode;
  nodes: MindmapNode[];
  conceptCount: number;
  accentGradient: { from: string; to: string };
  showLinkMenu: boolean;
  onShowLinkMenuToggle: () => void;
  onSelectNode: (node: MindmapNode) => void;
  onHideLinkMenu: () => void;
}

export default function MindmapDetailPanel({
  selectedNode,
  nodes,
  conceptCount,
  accentGradient,
  showLinkMenu,
  onShowLinkMenuToggle,
  onSelectNode,
  onHideLinkMenu,
}: MindmapDetailPanelProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: 300, opacity: 1 }}
        exit={{ width: 0, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="border-l border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm overflow-hidden"
      >
        <div className="p-4 h-full overflow-auto">
          {/* Header */}
          <div className="flex items-start gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${
                  selectedNode.level === 0
                    ? accentGradient.from
                    : NODE_GRADIENTS[nodes.indexOf(selectedNode) % NODE_GRADIENTS.length]?.from ||
                      '#667eea'
                }, ${
                  selectedNode.level === 0
                    ? accentGradient.to
                    : NODE_GRADIENTS[nodes.indexOf(selectedNode) % NODE_GRADIENTS.length]?.to ||
                      '#764ba2'
                })`,
              }}
            >
              <BookOpenIcon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-tight">
                {selectedNode.label}
              </h3>
              {selectedNode.category && (
                <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[9px] rounded-full font-medium">
                  {selectedNode.category}
                </span>
              )}
            </div>
          </div>

          {/* Full Text */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 mb-4">
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {selectedNode.fullText}
            </p>
          </div>

          {/* Related Concepts */}
          {selectedNode.level === 0 ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <SparklesIcon className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {conceptCount} Concepts Extracted
                </span>
              </div>
              <div className="space-y-1">
                {nodes
                  .filter((n) => n.level === 1)
                  .map((n, i) => (
                    <button
                      key={n.id}
                      onClick={() => onSelectNode(n)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                    >
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{
                          background: `linear-gradient(135deg, ${NODE_GRADIENTS[i % NODE_GRADIENTS.length].from}, ${NODE_GRADIENTS[i % NODE_GRADIENTS.length].to})`,
                        }}
                      />
                      <span className="text-xs text-slate-600 dark:text-slate-400 truncate">
                        {n.label}
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Related Topics
                  </span>
                </div>
                <button
                  onClick={onShowLinkMenuToggle}
                  className="text-[9px] text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                >
                  {showLinkMenu ? 'Hide' : 'Show All'}
                </button>
              </div>
              <button
                onClick={() => onSelectNode(nodes[0])}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${accentGradient.from}, ${accentGradient.to})`,
                  }}
                />
                <span className="text-xs text-slate-600 dark:text-slate-400 truncate">
                  {nodes[0].label}
                </span>
              </button>
              {showLinkMenu && (
                <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
                  <div className="text-[8px] text-slate-400 uppercase tracking-wider mb-2">
                    All Topics
                  </div>
                  <div className="space-y-1 max-h-[120px] overflow-y-auto">
                    {nodes.slice(1).map((n, i) => (
                      <button
                        key={n.id}
                        onClick={() => {
                          onSelectNode(n);
                          onHideLinkMenu();
                        }}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left"
                      >
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{
                            background: `linear-gradient(135deg, ${NODE_GRADIENTS[i % NODE_GRADIENTS.length].from}, ${NODE_GRADIENTS[i % NODE_GRADIENTS.length].to})`,
                          }}
                        />
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 truncate">
                          {n.label}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <a
                      href="/mindmap"
                      className="w-full flex items-center justify-center gap-1 px-2 py-1.5 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-[10px] text-slate-600 dark:text-slate-300 font-medium"
                    >
                      Open in Mind Map →
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
