'use client';

import Link from 'next/link';
import { Message } from '@/lib/chat-store';
import { Layer, LAYER_METADATA } from '@/lib/layer-registry';
import { analyzeLayerContent } from '@/lib/layer-mapper';
import type { DepthConfig } from '@/lib/depth-annotations';
import { shouldShowLayers } from '@/components/LayerResponse';
import { shouldShowInsightMap } from '@/components/InsightMindmap';
import { shouldShowMindmap } from '@/components/ResponseMindmap';
import GuardWarning from '@/components/GuardWarning';
import ProcessingIndicator from '@/components/ProcessingIndicator';
import { DepthText } from '@/components/DepthAnnotation';
import MetadataStrip from '@/components/MetadataStrip';
import { InlineConsole } from '@/components/ConversationConsole';
import ResponseMindmap from '@/components/ResponseMindmap';
import IntelligenceBadge from '@/components/IntelligenceBadge';
import { LayerTreeFull } from '@/components/LayerTreeFull';
import ViewTabs from '@/components/sections/ViewTabs';
import GnosticDetails from '@/components/sections/GnosticDetails';

/**
 * Generate LayerMini data for every query - adapts to content and evolves with conversation
 * Always returns valid activations even if gnostic metadata doesn't exist
 */
function generateLayerData(
  message: Message,
  messageIndex: number,
  totalMessages: number
): {
  activations: Record<number, number>;
  userLevel: Layer;
} {
  // Default activations for all 11 Layers (ensures no undefined values)
  const defaultActivations: Record<number, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    7: 0,
    8: 0,
    9: 0,
    10: 0,
    11: 0,
  };

  // PRIORITY 1: Use Intelligence Fusion activations (most accurate from pre-processing)
  if (message.intelligence?.layerActivations && message.intelligence.layerActivations.length > 0) {
    const activations: Record<number, number> = { ...defaultActivations };
    message.intelligence.layerActivations.forEach(({ layerNode, activation }) => {
      activations[layerNode] = activation ?? 0;
    });
    return {
      activations,
      userLevel: (message.gnostic?.progressState?.currentLevel || 1) as Layer,
    };
  }

  // PRIORITY 2: Use gnostic metadata (from API response processing)
  if (message.gnostic?.layerAnalysis) {
    return {
      activations: { ...defaultActivations, ...message.gnostic.layerAnalysis.activations },
      userLevel: (message.gnostic.progressState?.currentLevel || 1) as Layer,
    };
  }

  // Generate activations based on content analysis
  const content = message.content || '';
  const analysis = analyzeLayerContent(content);

  // Convert analysis to activations record (with defaults)
  const activations: Record<number, number> = { ...defaultActivations };
  analysis.activations.forEach(({ layerNode, activation }) => {
    activations[layerNode] = activation ?? 0;
  });

  // Calculate user level based on conversation progression
  // More messages = higher ascent (evolves with chat)
  const progressionLevel = Math.min(Math.ceil((messageIndex + 1) / 3), 10);
  const userLevel = progressionLevel as Layer;

  return { activations, userLevel };
}

interface ChatMessagesProps {
  messages: Message[];
  methodology: string;
  vizMode: Record<string, 'layers' | 'insight' | 'text' | 'mindmap'>;
  setVizMode: React.Dispatch<
    React.SetStateAction<Record<string, 'layers' | 'insight' | 'text' | 'mindmap'>>
  >;
  globalVizMode: 'off' | 'synthesis' | 'insight';
  depthConfig: DepthConfig;
  setDepthConfig: (config: DepthConfig) => void;
  messageAnnotations: Record<string, any[]>;
  mindmapVisibility: Record<string, boolean>;
  setMindmapVisibility: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  gnosticVisibility: Record<string, boolean>;
  setGnosticVisibility: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  pipelineEnabled: boolean;
  hiddenPipelines: Set<string>;
  toggleMsgPipeline: (msgId: string) => void;
  loadingSuggestions: string | null;
  guardSuggestions: Record<string, { refine?: string[]; pivot?: string[] }>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  setQuery: (q: string) => void;
  setShowMindMap: (show: boolean) => void;
  setDeepDiveQuery: (query: string) => void;
  handleGuardRefine: (messageId: string, query?: string) => void;
  handleGuardPivot: (messageId: string, query?: string) => void;
  handleGuardContinue: (messageId: string) => void;
}

export default function ChatMessages({
  messages,
  methodology,
  vizMode,
  setVizMode,
  globalVizMode,
  depthConfig,
  setDepthConfig,
  messageAnnotations,
  mindmapVisibility,
  setMindmapVisibility,
  gnosticVisibility,
  setGnosticVisibility,
  pipelineEnabled,
  hiddenPipelines,
  toggleMsgPipeline,
  loadingSuggestions,
  guardSuggestions,
  messagesEndRef,
  setQuery,
  setShowMindMap,
  setDeepDiveQuery,
  handleGuardRefine,
  handleGuardPivot,
  handleGuardContinue,
}: ChatMessagesProps) {
  return (
    <div className="flex-1 overflow-y-auto px-6 pb-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            data-message-id={message.id}
            className={`animate-fade-in ${message.role === 'user' ? 'text-right' : ''}`}
          >
            {message.role === 'user' ? (
              // User message
              <div className="inline-block max-w-[80%] text-left">
                <p className="text-relic-slate dark:text-relic-ghost px-4 py-3 text-sm">
                  {message.content}
                </p>
              </div>
            ) : (
              // Assistant message
              <div className="max-w-[90%]">
                {/* Guard Warning - Shows if guard failed and pending */}
                {message.guardResult && message.guardAction === 'pending' && (
                  <GuardWarning
                    guardResult={message.guardResult}
                    originalQuery={messages[messages.indexOf(message) - 1]?.content || ''}
                    onRefine={(query) => handleGuardRefine(message.id, query)}
                    onPivot={(query) => handleGuardPivot(message.id, query)}
                    onContinue={() => handleGuardContinue(message.id)}
                    isLoadingSuggestions={loadingSuggestions === message.id}
                    refineSuggestions={guardSuggestions[message.id]?.refine}
                    pivotSuggestions={guardSuggestions[message.id]?.pivot}
                  />
                )}

                {/* Condensed Alert - Shows after any guard action was taken (Refine/Pivot/Continue) */}
                {message.guardResult &&
                  (message.guardAction === 'refined' ||
                    message.guardAction === 'pivoted' ||
                    message.guardAction === 'accepted') && (
                    <div className="mt-4 mb-4 bg-relic-ghost/20 border-l-2 border-relic-slate/20 p-3 animate-fade-in">
                      <div className="flex items-center gap-2 text-xs">
                        <span>⚠️</span>
                        <span className="font-medium text-relic-slate">Reality Check</span>
                      </div>

                      {/* Show violations */}
                      {message.guardResult.sanityViolations &&
                        message.guardResult.sanityViolations.length > 0 && (
                          <div className="mt-2 text-xs text-relic-silver">
                            {message.guardResult.sanityViolations.map((v, i) => (
                              <div key={i} className="flex items-start gap-1">
                                <span>→</span>
                                <span>{v}</span>
                              </div>
                            ))}
                          </div>
                        )}

                      {/* Show other issues */}
                      {message.guardResult.issues &&
                        message.guardResult.issues.filter((i) => i !== 'sanity').length > 0 && (
                          <div className="mt-2 flex gap-2">
                            {message.guardResult.issues
                              .filter((i) => i !== 'sanity')
                              .map((issue, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] px-2 py-0.5 bg-relic-mist/50 text-relic-silver rounded"
                                >
                                  {issue}
                                </span>
                              ))}
                          </div>
                        )}

                      {/* Show action taken */}
                      <div className="mt-2 text-xs text-relic-slate border-t border-relic-mist/30 pt-2">
                        {message.guardAction === 'accepted' && (
                          <span className="text-green-600">✓ Continued with caution</span>
                        )}
                        {message.guardAction === 'refined' && (
                          <>
                            <span className="text-relic-silver">🔄 Refined to:</span>
                            <span className="ml-2 italic">{message.guardActionQuery}</span>
                          </>
                        )}
                        {message.guardAction === 'pivoted' && (
                          <>
                            <span className="text-relic-silver">📍 Pivoted to:</span>
                            <span className="ml-2 italic">{message.guardActionQuery}</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                {/* Actual Response - Shows if not hidden */}
                {!message.isHidden && (
                  <div className="border-l-2 border-relic-slate/30 pl-4">
                    <ViewTabs
                      message={message}
                      previousUserQuery={messages[messages.indexOf(message) - 1]?.content || ''}
                      currentVizMode={vizMode[message.id]}
                      globalVizMode={globalVizMode}
                      methodology={methodology}
                      onSetVizMode={(mode) =>
                        setVizMode((prev) => ({ ...prev, [message.id]: mode }))
                      }
                      onOpenMindMap={() => setShowMindMap(true)}
                      onDeepDive={(query) => setDeepDiveQuery(query)}
                    />

                    {/* TEXT - Always shown after visualizations (skip if streaming with no content) */}
                    {message.isStreaming && !message.content ? (
                      <ProcessingIndicator messageId={message.id} isVisible={true} />
                    ) : depthConfig.enabled &&
                      messageAnnotations[message.id] &&
                      messageAnnotations[message.id].length > 0 ? (
                      <DepthText
                        text={message.content}
                        annotations={messageAnnotations[message.id]}
                        config={depthConfig}
                        className="text-relic-slate leading-relaxed text-sm"
                        onExpand={(query) => {
                          // When user clicks an expandable annotation, set it as the query
                          setQuery(query);
                        }}
                      />
                    ) : (
                      <div className="text-relic-slate leading-relaxed whitespace-pre-wrap text-sm">
                        {message.content.split(/(\bhttps?:\/\/[^\s]+)/g).map((part, idx) => {
                          // Check if this part is a URL
                          if (/^https?:\/\//.test(part)) {
                            return (
                              <a
                                key={idx}
                                href={part}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-relic-slate dark:text-white underline hover:text-relic-void dark:hover:text-relic-ghost transition-colors"
                              >
                                {part}
                              </a>
                            );
                          }
                          return <span key={idx}>{part}</span>;
                        })}
                      </div>
                    )}

                    {/* Metadata Thought Stream — real-time pipeline stage */}
                    {message.role === 'assistant' && (
                      <div className="relative">
                        {/* Per-message toggle */}
                        <button
                          onClick={() => toggleMsgPipeline(message.id)}
                          className={`absolute -right-6 top-0 w-4 h-4 flex items-center justify-center text-[8px] font-mono rounded transition-all ${
                            pipelineEnabled && !hiddenPipelines.has(message.id)
                              ? 'text-relic-silver hover:text-relic-slate'
                              : 'text-relic-ghost hover:text-relic-silver'
                          }`}
                          title={
                            hiddenPipelines.has(message.id) ? 'Show pipeline' : 'Hide pipeline'
                          }
                        >
                          &#9671;
                        </button>
                        {pipelineEnabled && !hiddenPipelines.has(message.id) && (
                          <MetadataStrip messageId={message.id} isStreaming={message.isStreaming} />
                        )}
                      </div>
                    )}

                    {/* Depth Annotations Toggle + Density */}
                    {message.role === 'assistant' && !message.isStreaming && (
                      <div className="flex items-center gap-3 mt-1">
                        <button
                          onClick={() =>
                            setDepthConfig({ ...depthConfig, enabled: !depthConfig.enabled })
                          }
                          className={`text-[8px] font-mono transition-colors ${
                            depthConfig.enabled
                              ? 'text-relic-silver/70 hover:text-relic-slate'
                              : 'text-relic-silver/30 hover:text-relic-silver/50'
                          }`}
                        >
                          {depthConfig.enabled ? 'ᶠ depth on' : 'ᶠ depth off'}
                        </button>
                        {depthConfig.enabled && (
                          <div className="flex items-center gap-1">
                            {(['minimal', 'standard', 'maximum'] as const).map((level) => (
                              <button
                                key={level}
                                onClick={() => setDepthConfig({ ...depthConfig, density: level })}
                                className={`text-[7px] font-mono px-1 py-0.5 rounded transition-colors ${
                                  depthConfig.density === level
                                    ? 'text-relic-slate bg-relic-ghost dark:text-relic-ghost dark:bg-relic-slate/20'
                                    : 'text-relic-silver/40 hover:text-relic-silver/60'
                                }`}
                              >
                                {level}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Inline Visualize Button */}
                    {(shouldShowLayers(message.content, !!message.gnostic) ||
                      shouldShowInsightMap(message.content, !!message.gnostic)) &&
                      globalVizMode === 'off' && (
                        <InlineConsole
                          onVisualize={() =>
                            setVizMode((prev) => ({ ...prev, [message.id]: 'layers' }))
                          }
                        />
                      )}

                    {/* Response Mindmap - Visual concept map */}
                    {shouldShowMindmap(message.content, message.topics) && (
                      <ResponseMindmap
                        content={message.content}
                        topics={message.topics}
                        isVisible={mindmapVisibility[message.id] || false}
                        onToggle={() =>
                          setMindmapVisibility((prev) => ({
                            ...prev,
                            [message.id]: !prev[message.id],
                          }))
                        }
                        methodology={methodology}
                        query={messages[messages.indexOf(message) - 1]?.content || ''}
                      />
                    )}

                    {/* INTELLIGENCE FUSION BADGE */}
                    {message.intelligence && (
                      <div className="mt-4 pt-3 border-t border-relic-mist/20 dark:border-relic-slate/15">
                        <IntelligenceBadge
                          intelligence={message.intelligence}
                          methodology={message.methodology}
                          selectionReason={
                            message.gnostic?.layerAnalysis?.dominant
                              ? `Layer analysis: ${message.gnostic.layerAnalysis.dominant} dominant`
                              : undefined
                          }
                        />
                      </div>
                    )}

                    {/* LAYERS MINI - ALWAYS VISIBLE (Evolves with conversation) */}
                    <div className="mt-6 pt-4 border-t border-relic-mist/30 dark:border-relic-slate/20">
                      {(() => {
                        const messageIndex = messages
                          .filter((m) => m.role === 'assistant')
                          .indexOf(message);
                        const totalMessages = messages.filter((m) => m.role === 'assistant').length;
                        const layersData = generateLayerData(message, messageIndex, totalMessages);

                        return (
                          <Link
                            href="/tree-of-life"
                            className="block cursor-pointer transition-all hover:shadow-lg"
                          >
                            <div className="bg-white dark:bg-relic-void/30 border border-relic-mist dark:border-relic-slate/30 p-4 mb-4 hover:border-purple-300 dark:hover:border-purple-500 transition-colors">
                              <div className="text-[9px] uppercase tracking-[0.2em] text-relic-silver mb-3 text-center flex items-center justify-center gap-2">
                                <span>
                                  Tree of Life • Query {messageIndex + 1}/{totalMessages}
                                </span>
                                <span className="text-[8px] text-relic-silver dark:text-relic-ghost opacity-60">
                                  Click to explore →
                                </span>
                              </div>
                              <LayerTreeFull
                                activations={layersData.activations}
                                compact={true}
                                showLabels={true}
                                showPaths={true}
                                className="mx-auto"
                              />
                              <div className="mt-3 text-center text-[8px] text-relic-silver">
                                Ascent Level: {layersData.userLevel}/11
                              </div>
                            </div>
                          </Link>
                        );
                      })()}
                    </div>

                    {/* GNOSTIC SOVEREIGN INTELLIGENCE FOOTER (Optional Details) */}
                    {message.gnostic && (
                      <GnosticDetails
                        message={message}
                        isVisible={
                          gnosticVisibility[message.id] === undefined
                            ? true
                            : gnosticVisibility[message.id]
                        }
                        onToggle={() =>
                          setGnosticVisibility((prev) => ({
                            ...prev,
                            [message.id]:
                              prev[message.id] === undefined ? false : !prev[message.id],
                          }))
                        }
                      />
                    )}

                    {/* Metrics */}
                    {message.metrics && (
                      <div className="flex gap-4 mt-3 text-[10px] text-relic-silver">
                        <span>
                          {message.metrics.tokens !== undefined ? (
                            message.metrics.tokens === 0 ? (
                              <span className="text-green-600">0 tok (free)</span>
                            ) : (
                              `${message.metrics.tokens} tok`
                            )
                          ) : (
                            '—'
                          )}
                        </span>
                        <span>
                          {message.metrics.latency && message.metrics.latency > 0
                            ? `${(message.metrics.latency / 1000).toFixed(2)}s`
                            : '—'}
                        </span>
                        <span>
                          {message.metrics.cost !== undefined ? (
                            message.metrics.cost === 0 ? (
                              <span className="text-green-600">$0 (free)</span>
                            ) : (
                              `$${message.metrics.cost.toFixed(4)}`
                            )
                          ) : (
                            '—'
                          )}
                        </span>
                        {message.metrics.source && (
                          <span className="text-green-600">{message.metrics.source}</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator — now handled inline by streaming placeholder message */}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
