'use client'

import { Suspense } from 'react'
import TopicsPanel from '@/components/TopicsPanel'
import MindMap from '@/components/MindMap'
import AuthModal from '@/components/AuthModal'
import SuggestionToast from '@/components/SuggestionToast'
import MethodologyChangePrompt from '@/components/MethodologyChangePrompt'
import NewsNotification from '@/components/NewsNotification'
import TreeConfigurationModal from '@/components/TreeConfigurationModal'
import PipelineHistoryPanel from '@/components/PipelineHistoryPanel'
import { Message } from '@/lib/chat-store'

interface OverlaysProps {
  // TopicsPanel (hidden)
  showTopicsPanel: boolean
  setShowTopicsPanel: (v: boolean) => void
  setShowMindMap: (v: boolean) => void
  // MindMap
  showMindMap: boolean
  onCloseMindMap: () => void
  onSendMindMapQuery: (q: string) => void
  userId: string | null
  mindMapInitialView: 'graph' | 'history' | 'report'
  // Auth
  showAuthModal: boolean
  onCloseAuth: () => void
  onAuthSuccess: () => void
  // Suggestions
  topicSuggestions: any[]
  onRemoveSuggestion: (id: string) => void
  onSuggestionClick: (suggestion: any) => void
  // Methodology prompt
  showMethodologyPrompt: boolean
  methodologyName: string
  onContinueInCurrentChat: () => void
  onStartNewChat: () => void
  onCancelMethodologyChange: () => void
  // Tree config
  showLayerDashboard: boolean
  onCloseLayerDashboard: () => void
  // Continue watcher
  ContinueParamWatcher: React.ComponentType<{ onContinue: (id: string) => void }>
  loadConversation: (id: string) => void
  // Pipeline history (disabled)
  historyPanelOpen: boolean
  setHistoryPanelOpen: (v: boolean) => void
  messages: Message[]
}

export default function Overlays(props: OverlaysProps) {
  return (
    <>
      {/* Topics Panel — hidden */}
      {false && <TopicsPanel
        isOpen={props.showTopicsPanel}
        onClose={() => props.setShowTopicsPanel(false)}
        onOpenMindMap={() => props.setShowMindMap(true)}
      />}

      {/* Mind Map */}
      <MindMap
        isOpen={props.showMindMap}
        onClose={props.onCloseMindMap}
        onSendQuery={props.onSendMindMapQuery}
        userId={props.userId}
        initialView={props.mindMapInitialView}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={props.showAuthModal}
        onClose={props.onCloseAuth}
        onSuccess={props.onAuthSuccess}
      />

      {/* Topic Suggestions Toast */}
      <SuggestionToast
        suggestions={props.topicSuggestions}
        onRemoveSuggestion={props.onRemoveSuggestion}
        onSuggestionClick={props.onSuggestionClick}
      />

      {/* Methodology Change Prompt */}
      <MethodologyChangePrompt
        isOpen={props.showMethodologyPrompt}
        methodologyName={props.methodologyName}
        onContinue={props.onContinueInCurrentChat}
        onNewChat={props.onStartNewChat}
        onCancel={props.onCancelMethodologyChange}
      />

      {/* News Notification - Top Left */}
      <NewsNotification />

      {/* Tree Configuration Modal */}
      <TreeConfigurationModal
        isOpen={props.showLayerDashboard}
        onClose={props.onCloseLayerDashboard}
      />

      {/* URL Parameter Watcher */}
      <Suspense fallback={null}>
        <props.ContinueParamWatcher onContinue={props.loadConversation} />
      </Suspense>

      {/* Pipeline History */}
      {/* Only show metadata panel when conversation has messages */}
      {props.messages && props.messages.length > 0 && (
        <PipelineHistoryPanel
          isOpen={props.historyPanelOpen}
          onToggle={() => props.setHistoryPanelOpen(!props.historyPanelOpen)}
          messages={props.messages}
        />
      )}
    </>
  )
}
