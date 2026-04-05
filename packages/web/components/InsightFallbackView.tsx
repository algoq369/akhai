'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SparklesIcon, LinkIcon } from '@heroicons/react/24/outline';
import { discoverResearchLinks, type ResearchLink } from './insightMindmapTypes';

interface InsightFallbackViewProps {
  content: string;
  query?: string;
  onDeepDive?: (query: string) => void;
}

export default function InsightFallbackView({
  content,
  query,
  onDeepDive,
}: InsightFallbackViewProps) {
  const [researchLinks, setResearchLinks] = useState<ResearchLink[]>([]);
  const [searchUnavailable, setSearchUnavailable] = useState(false);

  const sentences = content
    .split(/[.!?]+/)
    .map((s) => s.replace(/[#*`\-]/g, '').trim())
    .filter((s) => s.length > 20 && s.length < 300)
    .slice(0, 5);

  useEffect(() => {
    if (!query) return;
    discoverResearchLinks(query, content).then(({ links, searchUnavailable: unavailable }) => {
      setResearchLinks(links);
      setSearchUnavailable(unavailable);
    });
  }, [query, content]);

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 dark:border-slate-800">
          <SparklesIcon className="w-4 h-4 text-purple-500" />
          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">
            Insight View
          </span>
          <span className="text-[9px] text-slate-400 dark:text-slate-500">
            {sentences.length} key points
          </span>
        </div>

        <div className="p-3">
          {/* Query context */}
          {query && (
            <div className="mb-2 px-2 py-1 bg-slate-50 dark:bg-slate-800/50 rounded text-[9px] text-slate-500 dark:text-slate-400 font-mono truncate">
              Query: {query}
            </div>
          )}

          <div className="text-[8px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            Key points from response
          </div>
          {sentences.length > 0 ? (
            <ul className="space-y-1.5">
              {sentences.map((s, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed group"
                >
                  <span className="text-purple-400 mt-0.5 flex-shrink-0">·</span>
                  <span className="flex-1">{s}</span>
                  {onDeepDive && (
                    <button
                      onClick={() => onDeepDive(s)}
                      className="opacity-0 group-hover:opacity-100 flex-shrink-0 text-[8px] text-purple-500 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-opacity"
                    >
                      explore →
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">
              Response content is being analyzed
            </p>
          )}

          {/* Research links */}
          {researchLinks.length > 0 && (
            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
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
            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="text-[8px] text-slate-400 dark:text-slate-500 italic">
                Research links temporarily unavailable — results will appear on next query
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
