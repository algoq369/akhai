'use client'

import { RefObject } from 'react'
import { motion } from 'framer-motion'
import { InstinctModeConsole } from '@/components/InstinctModeConsole'
import MethodologyFrame from '@/components/MethodologyFrame'
import ConversationConsole from '@/components/ConversationConsole'
import LiveRefinementCanal from '@/components/LiveRefinementCanal'
import ChatDashboard from '@/components/ChatDashboard'
import { Message } from '@/lib/chat-store'

interface InputSectionProps {
  // Core state
  isExpanded: boolean
  isLoading: boolean
  isTransitioning: boolean
  query: string
  onQueryChange: (v: string) => void
  onSubmit: (e: React.FormEvent) => void
  inputRef: RefObject<HTMLInputElement | null>
  // File attachment
  fileInputRef: RefObject<HTMLInputElement | null>
  attachedFiles: File[]
  setAttachedFiles: (fn: (prev: File[]) => File[]) => void
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  triggerFileSelect: () => void
  // Methodology
  methodology: string
  onMethodologyClick: (id: string) => void
  // Layer dashboard
  showLayerDashboard: boolean
  setShowLayerDashboard: (v: boolean) => void
  // Console toggles
  instinctModeEnabled: boolean
  setInstinctModeEnabled: (v: boolean) => void
  suggestionsEnabled: boolean
  setSuggestionsEnabled: (v: boolean) => void
  auditEnabled: boolean
  setAuditEnabled: (v: boolean) => void
  mindmapConnectorEnabled: boolean
  setMindmapConnectorEnabled: (v: boolean) => void
  sideCanalEnabled: boolean
  setSideCanalEnabled: (v: boolean) => void
  pipelineEnabled: boolean
  setPipelineEnabled: (v: boolean) => void
  selectedModel: string
  setSelectedModel: (v: string) => void
  globalVizMode: 'off' | 'synthesis' | 'insight'
  setGlobalVizMode: (v: 'off' | 'synthesis' | 'insight') => void
  // Dashboard
  user: any
  legendMode: boolean
  darkMode: boolean
  onMethodologySwitch: (newMethodology: string, option: 'same' | 'side' | 'new') => void
  onGuardToggle: (feature: 'suggestions' | 'bias' | 'hype' | 'echo' | 'drift' | 'factuality', enabled: boolean) => void
  onLegendModeToggle: (enabled: boolean) => void
  toggleDarkMode: () => void
  messages: Message[]
}

export default function InputSection(props: InputSectionProps) {
  const {
    isExpanded, isLoading, isTransitioning, query, onQueryChange, onSubmit,
    inputRef, fileInputRef, attachedFiles, setAttachedFiles, onFileSelect,
    triggerFileSelect, methodology, onMethodologyClick, showLayerDashboard,
    setShowLayerDashboard, instinctModeEnabled, setInstinctModeEnabled,
    suggestionsEnabled, setSuggestionsEnabled, auditEnabled, setAuditEnabled,
    mindmapConnectorEnabled, setMindmapConnectorEnabled, sideCanalEnabled,
    setSideCanalEnabled, pipelineEnabled, setPipelineEnabled, selectedModel,
    setSelectedModel, globalVizMode, setGlobalVizMode, user, legendMode,
    darkMode, onMethodologySwitch, onGuardToggle, onLegendModeToggle,
    toggleDarkMode, messages,
  } = props

  return (
    <div
      className={`transition-all duration-500 ease-out ${isExpanded ? 'pb-2 pt-1 border-t border-relic-mist/20 dark:border-relic-slate/20 bg-white dark:bg-relic-void sticky bottom-0' : 'pb-8'}`}
    >
      {/* Pipeline History Panel — fixed drawer */}
      <LiveRefinementCanal
        isVisible={isExpanded && messages.length > 0}
        isLoading={isLoading}
      />
      <form onSubmit={onSubmit} className="max-w-3xl mx-auto px-3 sm:px-6">
        {/* Input Box */}
        <div className="relative transition-all duration-300">
          <input
            ref={inputRef}
            id="query-input"
            name="query"
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={isExpanded ? 'continue conversation...' : ''}
            autoComplete="off"
            className={`
              relic-input text-sm transition-all duration-300 text-center
              ${isExpanded ? 'py-2 px-4' : 'py-3'}
            `}
            autoFocus
            disabled={isLoading}
          />

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.txt,.md,.docx"
            onChange={onFileSelect}
            className="hidden"
          />
        </div>

        {/* Attached Files Display */}
        {attachedFiles.length > 0 && (
          <div className="mt-2 flex items-center gap-3 text-[9px] font-mono text-relic-slate dark:text-relic-silver">
            {attachedFiles.map((file, index) => {
              const getFileType = (file: File): 'img' | 'pdf' | 'txt' => {
                if (file.type.startsWith('image/')) return 'img';
                if (file.type === 'application/pdf') return 'pdf';
                return 'txt';
              };

              const fileType = getFileType(file);
              const sizeKB = (file.size / 1024).toFixed(0);

              return (
                <div key={index} className="inline-flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-emerald-500" />
                  <span className="truncate max-w-[100px]">{file.name}</span>
                  <span className="text-relic-silver/60">{sizeKB}k</span>
                  <span className="text-relic-silver/60">{fileType}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
                    }}
                    className="text-relic-silver/60 hover:text-relic-void dark:hover:text-white transition-colors text-[8px]"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Methodology Dots */}
        <motion.div
          className={`flex justify-center ${isExpanded ? 'mt-1' : 'mt-5'}`}
          initial={false}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <MethodologyFrame
            currentMethodology={methodology}
            onMethodologyChange={onMethodologyClick}
            isSubmitting={isTransitioning}
            consoleOpen={showLayerDashboard}
            onConsoleToggle={() => setShowLayerDashboard(!showLayerDashboard)}
          />
        </motion.div>

        {/* Instinct Mode Console */}
        <div className="flex justify-center">
          <InstinctModeConsole />
        </div>

        {/* Console - Inline below methodology */}
        <div className="mt-0.5 flex justify-center">
          <ConversationConsole
            instinctMode={instinctModeEnabled}
            onInstinctModeChange={setInstinctModeEnabled}
            suggestions={suggestionsEnabled}
            onSuggestionsChange={setSuggestionsEnabled}
            audit={auditEnabled}
            onAuditChange={setAuditEnabled}
            mindmapConnector={mindmapConnectorEnabled}
            onMindmapConnectorChange={setMindmapConnectorEnabled}
            sideCanalEnabled={sideCanalEnabled}
            onSideCanalChange={setSideCanalEnabled}
            pipelineEnabled={pipelineEnabled}
            onPipelineChange={setPipelineEnabled}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            visualizationMode={globalVizMode}
            onVisualizationChange={setGlobalVizMode}
            attachedFilesCount={attachedFiles.length}
            onFilesClick={triggerFileSelect}
          />
        </div>

        {/* Submit button */}
        {!isExpanded && (
          <div className="mt-6 text-center">
            <button
              type="submit"
              id="submit-button"
              name="submit"
              className="px-6 py-2 text-[10px] font-mono uppercase tracking-wider border border-relic-slate dark:border-white text-relic-slate dark:text-white bg-transparent hover:bg-relic-ghost/50 dark:hover:bg-relic-slate/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || isTransitioning}
            >
              transmit
            </button>
          </div>
        )}

        {/* Horizontal Dashboard - Only when not in conversation */}
        {user && !isExpanded && (
          <ChatDashboard
            userId={user?.id || null}
            currentMethodology={methodology}
            legendMode={legendMode}
            darkMode={darkMode}
            sideCanalEnabled={true}
            newsNotificationsEnabled={true}
            realtimeDataEnabled={true}
            contextInjectionEnabled={true}
            autoMethodologyEnabled={true}
            onMethodologyChange={onMethodologySwitch}
            onGuardToggle={onGuardToggle}
            onLegendModeToggle={onLegendModeToggle}
            onDarkModeToggle={toggleDarkMode}
            onSideCanalToggle={(enabled) => {
              localStorage.setItem('sideCanalEnabled', String(enabled));
            }}
            onNewsNotificationsToggle={(enabled) => {
              localStorage.setItem('newsNotificationsEnabled', String(enabled));
            }}
            onRealtimeDataToggle={(enabled) => {
              localStorage.setItem('realtimeDataEnabled', String(enabled));
            }}
            onContextInjectionToggle={(enabled) => {
              localStorage.setItem('contextInjectionEnabled', String(enabled));
            }}
            onAutoMethodologyToggle={(enabled) => {
              localStorage.setItem('autoMethodologyEnabled', String(enabled));
            }}
            onClose={() => {}}
            isCompact={isExpanded}
          />
        )}
      </form>
    </div>
  )
}
