'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SparklesIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';
import { Layer, LAYER_METADATA } from '@/lib/layer-registry';
import {
  ConceptNode,
  ResearchLink,
  InsightMindmapProps,
  LAYER_COLORS,
  extractInsights,
  generateQueryInsight,
  discoverResearchLinks,
} from './insightMindmapTypes';
import InsightFallbackView from './InsightFallbackView';
import ConceptNodeItem from './ConceptNodeItem';

export default function InsightMindmap({
  content,
  query,
  onSwitchToLayers,
  onOpenMindMap,
  onDeepDive,
}: InsightMindmapProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedNode, setSelectedNode] = useState<ConceptNode | null>(null);
  const [researchLinks, setResearchLinks] = useState<ResearchLink[]>([]);
  const [searchUnavailable, setSearchUnavailable] = useState(false);

  const nodes = useMemo(() => extractInsights(content, query), [content, query]);
  const queryInsight = useMemo(
    () => generateQueryInsight(query, content, nodes),
    [query, content, nodes]
  );

  // Discover research links
  useEffect(() => {
    discoverResearchLinks(query, content).then(({ links, searchUnavailable: unavailable }) => {
      setResearchLinks(links);
      setSearchUnavailable(unavailable);
    });
  }, [query, content]);

  // Check if Layers view is available
  const canShowLayers = useMemo(() => {
    const headerCount = (content.match(/^#+\s*.+$/gm) || []).length;
    const boldCount = (content.match(/\*\*[^*]+\*\*/g) || []).length;
    return headerCount >= 2 || boldCount >= 3;
  }, [content]);

  if (nodes.length < 1) {
    return <InsightFallbackView content={content} query={query} onDeepDive={onDeepDive} />;
  }

  // Get unique Layers from all nodes for the summary
  const activeLayers = (() => {
    const layersSet = new Set<Layer>();
    nodes.forEach((n) => n.layerMapping.forEach((s) => layersSet.add(s)));
    return Array.from(layersSet).slice(0, 4);
  })();

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        {/* Header - Compact */}
        <div
          className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-4 h-4 text-purple-500" />
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">
              Concept Insights
            </span>
            <span className="text-[9px] text-slate-400 dark:text-slate-500">
              {nodes.length} topics
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Active Layers indicators */}
            <div className="flex items-center gap-0.5">
              {activeLayers.map((s) => (
                <div
                  key={s}
                  className="w-2 h-2 rounded-full border border-white/50"
                  style={{ backgroundColor: LAYER_COLORS[s] }}
                  title={LAYER_METADATA[s]?.name}
                />
              ))}
            </div>
            {isCollapsed ? (
              <ChevronDownIcon className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronUpIcon className="w-3.5 h-3.5 text-slate-400" />
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
              {/* Query Intent & Keywords - Compact */}
              <div className="px-3 py-2 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Intent
                    </div>
                    <p className="text-[10px] text-slate-700 dark:text-slate-300">
                      {queryInsight.intent}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Layer Focus
                    </div>
                    <div className="flex items-center gap-1">
                      {queryInsight.layersFocus.map(({ layerNode, reason }) => (
                        <div
                          key={layerNode}
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-medium"
                          style={{
                            backgroundColor: LAYER_COLORS[layerNode] + '20',
                            color: layerNode === 10 ? '#64748b' : LAYER_COLORS[layerNode],
                          }}
                          title={reason}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: LAYER_COLORS[layerNode] }}
                          />
                          {LAYER_METADATA[layerNode]?.name}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Keywords */}
                {queryInsight.keywords.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                    <div className="text-[8px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                      Keywords
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {queryInsight.keywords.map((kw, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[9px] text-slate-600 dark:text-slate-400"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Concept Topics - Compact List */}
              <div className="p-3">
                <div className="text-[8px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                  Topics & Connections
                </div>
                <div className="space-y-1.5">
                  {nodes.slice(0, 6).map((node, i) => (
                    <ConceptNodeItem
                      key={node.id}
                      node={node}
                      index={i}
                      isSelected={selectedNode?.id === node.id}
                      onSelect={() => setSelectedNode(selectedNode?.id === node.id ? null : node)}
                    />
                  ))}
                </div>

                {/* Show more indicator */}
                {nodes.length > 6 && (
                  <div className="mt-2 text-center text-[9px] text-slate-400">
                    +{nodes.length - 6} more concepts
                  </div>
                )}
              </div>

              {/* Footer - Links & Actions */}
              <div className="px-3 py-2 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                {/* Research Links - Compact */}
                {researchLinks.length > 0 && (
                  <div className="mb-2">
                    <div className="text-[8px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                      Related Resources
                    </div>
                    <div className="space-y-1.5">
                      {researchLinks.map((link) => {
                        let hostname = '';
                        try {
                          hostname = new URL(link.url).hostname.replace('www.', '');
                        } catch {
                          hostname = link.source || '';
                        }
                        return (
                          <a
                            key={link.id}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block px-2 py-1.5 rounded-md border border-slate-200/60 dark:border-slate-700/50 hover:border-blue-300 dark:hover:border-blue-600/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors group"
                          >
                            <div className="flex items-start gap-1.5">
                              <LinkIcon className="w-3 h-3 text-slate-400 dark:text-slate-500 mt-0.5 flex-shrink-0 group-hover:text-blue-500" />
                              <div className="min-w-0 flex-1">
                                <div className="text-[10px] font-medium text-slate-700 dark:text-slate-300 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                  {link.title || hostname}
                                </div>
                                {link.snippet && (
                                  <div className="text-[9px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                                    {link.snippet}
                                  </div>
                                )}
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[8px] text-slate-400 dark:text-slate-500 font-mono">
                                    {hostname}
                                  </span>
                                  {link.relevance > 0 && (
                                    <span className="text-[8px] text-slate-400 dark:text-slate-500">
                                      {Math.round(link.relevance * 100)}% match
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
                {searchUnavailable && researchLinks.length === 0 && (
                  <div className="mb-2">
                    <div className="text-[8px] text-slate-400 dark:text-slate-500 italic">
                      Research links temporarily unavailable — results will appear on next query
                    </div>
                  </div>
                )}

                {/* View Switch */}
                {((onSwitchToLayers && canShowLayers) || onOpenMindMap) && (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                    <span className="text-[8px] text-slate-400 uppercase tracking-wider">
                      Views:
                    </span>
                    {onSwitchToLayers && canShowLayers && (
                      <button
                        onClick={onSwitchToLayers}
                        className="px-2 py-1 rounded text-[9px] font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                      >
                        ◆ AI Config
                      </button>
                    )}
                    {onOpenMindMap && (
                      <button
                        onClick={onOpenMindMap}
                        className="px-2 py-1 rounded text-[9px] font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
                      >
                        Mind Map
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export function shouldShowInsightMap(content: string, hasGnosticData: boolean = false): boolean {
  if (hasGnosticData) return true;

  const boldCount = (content.match(/\*\*[^*]+\*\*/g) || []).length;
  const headerCount = (content.match(/^#+\s*.+$/gm) || []).length;
  const bulletCount = (content.match(/^[-•*]\s+.+$/gm) || []).length;
  // Free-tier models use [TAG]: format instead of markdown
  const tagCount = (
    content.match(/\[(?:TECHNICAL|STRATEGIC|CRITICAL|RELATED|NEXT|KEY|SUMMARY|INSIGHT)\]/gi) || []
  ).length;
  const numberedSteps = (content.match(/^\d+\.\s+.+$/gm) || []).length;

  return (
    boldCount >= 1 ||
    headerCount >= 1 ||
    bulletCount >= 2 ||
    tagCount >= 1 ||
    numberedSteps >= 3 ||
    content.length > 200
  );
}
