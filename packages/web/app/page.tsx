'use client';

import { Suspense, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { useHomePageState } from '@/hooks/useHomePageState';
import ChatHeader from '@/components/sections/ChatHeader';
import ChatMessages from '@/components/sections/ChatMessages';
import LogoSection from '@/components/home/LogoSection';
import FooterBar from '@/components/home/FooterBar';
import Overlays from '@/components/home/Overlays';
import InputSection from '@/components/home/InputSection';
import FileDropZone from '@/components/FileDropZone';
import { METHODOLOGIES } from '@/lib/methodology-data';
import { classifyContent } from '@/lib/mini-canvas/content-classifier';

// Lazy-load heavy components that render conditionally
const CanvasWorkspace = dynamic(() => import('@/components/canvas/CanvasWorkspace'), {
  ssr: false,
});
const LiveRefinementCanal = dynamic(() => import('@/components/LiveRefinementCanal'), {
  ssr: false,
});
const MiniCanvasView = dynamic(() => import('@/components/mini-canvas/MiniCanvasView'), {
  ssr: false,
});
const SideChat = dynamic(() => import('@/components/SideChat'), { ssr: false });
const SideMiniChat = dynamic(() => import('@/components/SideMiniChat'), { ssr: false });
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

  // Client-side fallback: if miniCanvas is missing from the message, compute it from response text
  const miniCanvasData = useMemo(() => {
    const last = s.messages.filter((m) => m.role === 'assistant').pop();
    if (last?.miniCanvas) return last.miniCanvas;
    if (!last?.content || last.content.length < 50) return null;
    const q = s.messages.filter((m) => m.role === 'user').pop()?.content || '';
    return classifyContent(last.content, q);
  }, [s.messages]);

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
          viewMode={s.viewMode}
          methodology={s.methodology}
          onNewChat={s.handleNewChat}
          onSetViewMode={(mode) => {
            s.setViewMode(mode);
            if (mode === 'canvas')
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
        className={`flex-1 flex flex-col transition-all duration-500 ease-out ${s.isExpanded && s.viewMode === 'classic' ? 'ml-60' : ''}`}
      >
        {/* Canvas Mode */}
        {s.isCanvasMode && s.isExpanded && (
          <CanvasWorkspace
            queryCards={s.queryCards}
            visualNodes={s.visualNodes}
            visualEdges={s.visualEdges}
            onQuerySelect={(id) => {
              s.setViewMode('classic');
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
            onSwitchToClassic={() => s.setViewMode('classic')}
            aiInsights={s.topicInsights}
          />
        )}

        {/* Classic/Mini Canvas - Logo Section */}
        {s.viewMode !== 'canvas' && !s.isExpanded && (
          <LogoSection
            methodology={s.methodology}
            expandedMethodology={s.expandedMethodology}
            setExpandedMethodology={s.setExpandedMethodology}
            diamondRef={s.diamondRef}
          />
        )}

        {!s.isExpanded && <div className="flex-1" />}

        {s.isExpanded && s.viewMode === 'classic' && (
          <div className="text-center py-3 mb-2">
            <span className="text-2xl font-extralight opacity-50 text-relic-mist">◊</span>
          </div>
        )}

        {/* Mini Canvas — exclusive view: user query + 3 panels only */}
        {s.isExpanded && s.viewMode === 'mini-canvas' && (
          <>
            {s.messages.filter((m) => m.role === 'user').pop()?.content && (
              <div className="max-w-5xl mx-auto px-6 pt-4 pb-2">
                <p className="text-sm text-relic-slate dark:text-relic-ghost font-mono">
                  {s.messages.filter((m) => m.role === 'user').pop()?.content}
                </p>
              </div>
            )}
            <MiniCanvasView data={miniCanvasData} isLoading={s.isLoading} />
          </>
        )}

        {/* Messages Area — only in Classic mode */}
        {s.isExpanded && s.viewMode === 'classic' && <ChatMessages {...s.chatMessagesProps} />}

        <LiveRefinementCanal
          isVisible={s.isExpanded && s.messages.length > 0}
          isLoading={s.isLoading}
        />

        {/* Input Section */}
        <InputSection {...s.inputSectionProps} />

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
        {...s.overlaysProps}
        methodologyName={
          s.pendingMethodology
            ? METHODOLOGIES.find((m) => m.id === s.pendingMethodology)?.name || s.pendingMethodology
            : ''
        }
        ContinueParamWatcher={ContinueParamWatcher}
      />

      {/* Side Mini Chat — hidden in mini-canvas mode */}
      <SideMiniChat
        isVisible={s.messages.length > 0 && s.viewMode !== 'mini-canvas'}
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
