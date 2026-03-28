'use client';

import { Suspense, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useHomePageState } from '@/hooks/useHomePageState';
import ChatHeader from '@/components/sections/ChatHeader';
import ChatMessages from '@/components/sections/ChatMessages';
import LogoSection from '@/components/home/LogoSection';
import FooterBar from '@/components/home/FooterBar';
import Overlays from '@/components/home/Overlays';
import InputSection from '@/components/home/InputSection';
import FileDropZone from '@/components/FileDropZone';
import CanvasWorkspace from '@/components/canvas/CanvasWorkspace';
import LiveRefinementCanal from '@/components/LiveRefinementCanal';
import SideChat from '@/components/SideChat';
import SideMiniChat from '@/components/SideMiniChat';
import { METHODOLOGIES } from '@/lib/methodology-data';

/**
 * Helper component to watch URL parameters
 * Separated to enable proper Suspense boundary for Next.js 15
 */
function ContinueParamWatcher({ onContinue }: { onContinue: (id: string) => void }) {
  const searchParams = useSearchParams();
  const continueParam = searchParams?.get('continue');

  useEffect(() => {
    if (continueParam) {
      console.log('[History] Loading conversation:', continueParam);
      onContinue(continueParam);
    }
  }, [continueParam, onContinue]);

  return null;
}

function HomePage() {
  const s = useHomePageState();

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-300 ${s.darkMode ? 'bg-relic-void' : 'bg-white'}`}
      style={{ paddingTop: 22 }}
    >
      {/* Global File Drop Zone */}
      <FileDropZone
        onFilesChange={s.setAttachedFiles}
        onUploadComplete={(files) => {
          const urls = files.map((f) => f.url);
          console.log('📎 page.tsx: File URLs stored in state:', urls);
          s.setUploadedFileUrls(urls);
        }}
        maxFiles={5}
        maxSizeMB={10}
      />

      {/* Header - Only show when expanded */}
      {s.isExpanded && (
        <ChatHeader
          isCanvasMode={s.isCanvasMode}
          methodology={s.methodology}
          onNewChat={s.handleNewChat}
          onToggleCanvas={() => {
            s.setIsCanvasMode(!s.isCanvasMode);
            if (!s.isCanvasMode)
              import('@/lib/analytics').then(({ trackCanvasOpened }) => trackCanvasOpened());
          }}
          onOpenMindMap={(view) => {
            s.setMindMapInitialView(view);
            s.setShowMindMap(true);
          }}
        />
      )}

      {/* Main Content */}
      <main
        className={`flex-1 flex flex-col transition-all duration-500 ease-out ${s.isExpanded && !s.isCanvasMode ? 'ml-60' : ''}`}
      >
        {/* Canvas Mode */}
        {s.isCanvasMode && s.isExpanded && (
          <CanvasWorkspace
            queryCards={s.queryCards}
            visualNodes={s.visualNodes}
            visualEdges={s.visualEdges}
            onQuerySelect={(id) => {
              s.setIsCanvasMode(false);
              requestAnimationFrame(() => {
                setTimeout(() => {
                  const el = document.querySelector(`[data-message-id="${id}"]`);
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el.classList.add('ring-2', 'ring-purple-400/50', 'rounded-lg');
                    setTimeout(
                      () => el.classList.remove('ring-2', 'ring-purple-400/50', 'rounded-lg'),
                      2000
                    );
                  }
                }, 200);
              });
            }}
            onNodeSelect={(id) => console.log('Selected node:', id)}
            onSwitchToClassic={() => s.setIsCanvasMode(false)}
            aiInsights={s.topicInsights}
          />
        )}

        {/* Classic Mode - Logo Section */}
        {!s.isCanvasMode && !s.isExpanded && (
          <LogoSection
            methodology={s.methodology}
            expandedMethodology={s.expandedMethodology}
            setExpandedMethodology={s.setExpandedMethodology}
            diamondRef={s.diamondRef}
          />
        )}

        {!s.isExpanded && <div className="flex-1" />}

        {s.isExpanded && !s.isCanvasMode && (
          <div className="text-center py-3 mb-2">
            <span className="text-2xl font-extralight opacity-50 text-relic-mist">◊</span>
          </div>
        )}

        {/* Messages Area */}
        {s.isExpanded && !s.isCanvasMode && (
          <ChatMessages
            messages={s.messages}
            methodology={s.methodology}
            vizMode={s.vizMode}
            setVizMode={s.setVizMode}
            globalVizMode={s.globalVizMode}
            depthConfig={s.depthConfig}
            setDepthConfig={s.setDepthConfig}
            messageAnnotations={s.messageAnnotations}
            mindmapVisibility={s.mindmapVisibility}
            setMindmapVisibility={s.setMindmapVisibility}
            gnosticVisibility={s.gnosticVisibility}
            setGnosticVisibility={s.setGnosticVisibility}
            pipelineEnabled={s.pipelineEnabled}
            hiddenPipelines={s.hiddenPipelines}
            toggleMsgPipeline={s.toggleMsgPipeline}
            loadingSuggestions={s.loadingSuggestions}
            guardSuggestions={s.guardSuggestions}
            messagesEndRef={s.messagesEndRef}
            setQuery={s.setQuery}
            setShowMindMap={s.setShowMindMap}
            setDeepDiveQuery={s.setDeepDiveQuery}
            handleGuardRefine={s.handleGuardRefine}
            handleGuardPivot={s.handleGuardPivot}
            handleGuardContinue={s.handleGuardContinue}
          />
        )}

        <LiveRefinementCanal
          isVisible={s.isExpanded && s.messages.length > 0}
          isLoading={s.isLoading}
        />

        {/* Input Section */}
        <InputSection
          isExpanded={s.isExpanded}
          isLoading={s.isLoading}
          isTransitioning={s.isTransitioning}
          query={s.query}
          onQueryChange={s.handleQueryChange}
          onSubmit={s.handleSubmit}
          inputRef={s.inputRef}
          fileInputRef={s.fileInputRef}
          attachedFiles={s.attachedFiles}
          setAttachedFiles={s.setAttachedFiles}
          onFileSelect={s.handleFileSelect}
          triggerFileSelect={s.triggerFileSelect}
          methodology={s.methodology}
          onMethodologyClick={s.handleMethodologyClick}
          showLayerDashboard={s.showLayerDashboard}
          setShowLayerDashboard={s.setShowLayerDashboard}
          instinctModeEnabled={s.instinctModeEnabled}
          setInstinctModeEnabled={s.setInstinctModeEnabled}
          suggestionsEnabled={s.suggestionsEnabled}
          setSuggestionsEnabled={s.setSuggestionsEnabled}
          auditEnabled={s.auditEnabled}
          setAuditEnabled={s.setAuditEnabled}
          mindmapConnectorEnabled={s.mindmapConnectorEnabled}
          setMindmapConnectorEnabled={s.setMindmapConnectorEnabled}
          sideCanalEnabled={s.sideCanalEnabled}
          setSideCanalEnabled={s.setSideCanalEnabled}
          pipelineEnabled={s.pipelineEnabled}
          setPipelineEnabled={s.setPipelineEnabled}
          selectedModel={s.selectedModel}
          setSelectedModel={s.setSelectedModel}
          globalVizMode={s.globalVizMode}
          setGlobalVizMode={s.setGlobalVizMode}
          user={s.user}
          legendMode={s.legendMode}
          darkMode={s.darkMode}
          onMethodologySwitch={s.handleMethodologySwitch}
          onGuardToggle={s.handleGuardToggle}
          onLegendModeToggle={(enabled) => {
            s.setLegendMode(enabled);
            if (enabled) localStorage.setItem('legendMode', 'true');
            else localStorage.removeItem('legendMode');
          }}
          toggleDarkMode={s.toggleDarkMode}
          messages={s.messages}
        />

        {!s.isExpanded && <div className="flex-1" />}
      </main>

      {/* Continuing Conversation Indicator */}
      {s.continuingConversation && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-relic-ghost border border-relic-mist px-4 py-2 rounded-md animate-chat-continue">
          <span className="text-xs text-relic-slate font-mono">Continuing conversation...</span>
        </div>
      )}

      {/* Side Chats */}
      {s.sideChats.map((sideChat) => (
        <SideChat
          key={sideChat.id}
          id={sideChat.id}
          methodology={sideChat.methodology}
          messages={sideChat.messages}
          onClose={() => {
            s.setSideChats((prev) => prev.filter((c) => c.id !== sideChat.id));
            if (s.activeChatId === sideChat.id) s.setActiveChatId(null);
          }}
          onMinimize={() => {}}
          onSendMessage={(query) => s.handleSideChatSendMessage(sideChat, query)}
          isLoading={s.isLoading && s.activeChatId === sideChat.id}
          guardSuggestions={s.guardSuggestions}
          onRefine={() => {}}
          onPivot={() => {}}
          onContinue={() => {}}
        />
      ))}

      {/* Footer - Only when not expanded */}
      {!s.isExpanded && (
        <FooterBar
          user={s.user}
          showLayerDashboard={s.showLayerDashboard}
          setShowLayerDashboard={s.setShowLayerDashboard}
          onMindMapClick={() => {
            s.setMindMapInitialView('graph');
            s.setShowMindMap(true);
            import('@/lib/analytics').then(({ trackMindmapOpened }) => trackMindmapOpened('graph'));
          }}
        />
      )}

      {/* Overlays */}
      <Overlays
        showTopicsPanel={s.showTopicsPanel}
        setShowTopicsPanel={s.setShowTopicsPanel}
        setShowMindMap={s.setShowMindMap}
        showMindMap={s.showMindMap}
        onCloseMindMap={() => {
          s.setShowMindMap(false);
          s.setMindMapInitialView('graph');
        }}
        onSendMindMapQuery={(q) => {
          s.setQuery(q);
          setTimeout(() => {
            const form = s.inputRef.current?.closest('form');
            if (form) form.requestSubmit();
          }, 100);
        }}
        userId={s.user?.id || null}
        mindMapInitialView={s.mindMapInitialView}
        showAuthModal={s.showAuthModal}
        onCloseAuth={() => s.setShowAuthModal(false)}
        onAuthSuccess={() => {
          s.checkSession();
          s.setShowAuthModal(false);
        }}
        topicSuggestions={s.topicSuggestions}
        onRemoveSuggestion={s.removeSuggestion}
        onSuggestionClick={(suggestion) => {
          s.setQuery(suggestion.topicName + ' ');
          if (s.inputRef.current) s.inputRef.current.focus();
        }}
        showMethodologyPrompt={s.showMethodologyPrompt}
        methodologyName={
          s.pendingMethodology
            ? METHODOLOGIES.find((m) => m.id === s.pendingMethodology)?.name || s.pendingMethodology
            : ''
        }
        onContinueInCurrentChat={s.handleContinueInCurrentChat}
        onStartNewChat={s.handleStartNewChat}
        onCancelMethodologyChange={s.handleCancelMethodologyChange}
        showLayerDashboard={s.showLayerDashboard}
        onCloseLayerDashboard={() => s.setShowLayerDashboard(false)}
        ContinueParamWatcher={ContinueParamWatcher}
        loadConversation={s.loadConversation}
        historyPanelOpen={s.historyPanelOpen}
        setHistoryPanelOpen={s.setHistoryPanelOpen}
        messages={s.messages}
      />

      {/* Side Mini Chat */}
      <SideMiniChat
        isVisible={s.messages.length > 0}
        draggable={s.isCanvasMode}
        defaultPosition={s.isCanvasMode ? { left: 10, top: 500 } : undefined}
        messages={s.messages}
        externalQuery={s.deepDiveQuery}
        conversationId={s.currentConversationId}
        onSendQuery={(queryText) => s.handleMiniChatSendQuery(queryText)}
        onPromoteToMain={(query, response) => s.handlePromoteToMain(query, response)}
      />
    </div>
  );
}

// Export with Suspense boundary for production builds
export default function HomePageWithSuspense() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-relic-white dark:bg-relic-void flex items-center justify-center">
          <div className="text-center">
            <div className="animate-pulse text-relic-slate dark:text-relic-ghost">Loading...</div>
          </div>
        </div>
      }
    >
      <HomePage />
    </Suspense>
  );
}
