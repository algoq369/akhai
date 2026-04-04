'use client';

import { FlashProgress } from './FlashProgress';
import { ReasoningLog } from './ReasoningLog';
import { GroundingAlert } from './grounding';
import { ThoughtBufferView, MetaBufferView, DistillationProgress } from './bot';
import { useVerificationStream } from './useVerificationStream';
import type { VerificationWindowProps } from './VerificationWindow.types';

export default function VerificationWindow({ queryId }: VerificationWindowProps) {
  const {
    rounds,
    redactorOutput,
    finalDecision,
    isComplete,
    error,
    errorHint,
    progress,
    elapsedTime,
    isGTP,
    gtpAdvisors,
    quorumStatus,
    insightsCount,
    reasoningSteps,
    currentPhase,
    roundPaused,
    pausedRound,
    groundingAlerts,
    isBoT,
    thoughtBuffer,
    metaBuffers,
    isDistilling,
    distillationStrategy,
    distillationProgress,
    bufferSize,
    maxBufferSize,
    addReasoningStep,
    handleContinue,
    handleAccept,
    handleCancel,
    handleRefine,
    handleContinueAlert,
    handlePivot,
    handleDismissAlert,
  } = useVerificationStream(queryId);

  if (error) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-4">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-white font-semibold text-sm">Query Failed</h3>
        </div>
        <p className="text-gray-400 text-sm mb-2">{error}</p>
        {errorHint && (
          <p className="text-gray-500 text-xs mb-3 bg-gray-800/50 border-l-2 border-gray-700 pl-2 py-1">
            Hint: {errorHint}
          </p>
        )}
        <div className="flex gap-2">
          <a
            href="/"
            className="px-3 py-1.5 text-xs font-medium text-black bg-white rounded-lg hover:bg-gray-200 transition-colors"
          >
            Try Again
          </a>
          <a
            href="/settings"
            className="px-3 py-1.5 text-xs font-medium text-gray-300 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Check Settings
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Progress Bar */}
      {!isComplete && !error && !isGTP && (
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Processing query...</span>
            <span className="text-xs text-gray-600 font-mono">{elapsedTime}s</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Reasoning Log */}
      {reasoningSteps.length > 0 && !isComplete && (
        <ReasoningLog steps={reasoningSteps} currentPhase={currentPhase} />
      )}

      {/* Round Pause UI */}
      {roundPaused && pausedRound !== null && (
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
          <h3 className="text-white font-medium text-sm mb-2">
            Round {pausedRound} Complete - Review Consensus
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            Consensus round {pausedRound} has completed. You can review the advisor responses above
            and decide whether to continue to the next round, accept the current consensus, or
            cancel the query.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleContinue}
              className="px-4 py-2 bg-white text-black text-sm rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Continue to Next Round
            </button>
            <button
              onClick={handleAccept}
              className="px-4 py-2 bg-gray-800 text-white text-sm rounded-lg hover:bg-gray-700 border border-gray-700 transition-colors font-medium"
            >
              Accept Consensus
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-900 text-gray-400 text-sm rounded-lg hover:bg-gray-800 border border-gray-800 transition-colors font-medium"
            >
              Cancel Query
            </button>
          </div>
        </div>
      )}

      {/* GTP Flash Progress */}
      {isGTP && gtpAdvisors.length > 0 && !isComplete && (
        <FlashProgress
          advisorCount={gtpAdvisors.length}
          advisors={gtpAdvisors}
          quorum={quorumStatus}
          insightsCount={insightsCount}
        />
      )}

      {/* Consensus Rounds */}
      {rounds.map((round) => (
        <div
          key={round.round}
          className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-300">
              Round {round.round}
              {round.consensusReached && <span className="ml-2 text-white text-xs">Consensus</span>}
            </h3>
            {!round.consensusReached && (
              <span className="text-gray-500 text-xs">In Progress...</span>
            )}
          </div>

          <div className="space-y-2">
            {round.responses.map((resp, idx) => (
              <div
                key={idx}
                className={`bg-gray-800/50 backdrop-blur-sm rounded-lg p-3 border ${
                  resp.status === 'thinking' ? 'border-gray-600' : 'border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-xs text-gray-300">
                    Slot {resp.slot}: {resp.family}
                  </span>
                  {resp.status === 'thinking' && (
                    <span className="flex items-center text-xs text-gray-400">
                      <span className="animate-pulse mr-1">●</span>
                      Thinking...
                    </span>
                  )}
                  {resp.status === 'complete' && (
                    <span className="text-xs text-white">Complete</span>
                  )}
                </div>
                <p className="text-xs text-gray-500">{resp.response}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Redactor Output */}
      {redactorOutput && (
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-4">
          <h3 className="text-white font-medium text-sm mb-2">Redactor Synthesis</h3>
          <p className="text-gray-400 text-sm">{redactorOutput}</p>
        </div>
      )}

      {/* Final Decision / GTP Synthesis */}
      {finalDecision && (
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
          <h3 className="text-white font-medium text-sm mb-2">
            {isGTP ? 'Mother Base Synthesis (GTP)' : 'Mother Base Decision'}
          </h3>
          <p className="text-gray-300 text-sm">{finalDecision}</p>
        </div>
      )}

      {/* Grounding Alerts */}
      {groundingAlerts.map((alert, index) => (
        <GroundingAlert
          key={index}
          alert={alert}
          onRefine={() => handleRefine(alert)}
          onContinue={() => {
            handleContinueAlert(alert);
            handleDismissAlert(index);
          }}
          onPivot={() => handlePivot(alert)}
          onDismiss={() => handleDismissAlert(index)}
        />
      ))}

      {/* Buffer of Thoughts Visualization */}
      {isBoT && (
        <div className="bg-relic-white/80 backdrop-blur-sm border border-relic-mist rounded-sm p-6">
          <h2 className="text-xs uppercase tracking-widest text-relic-silver mb-6">
            buffer of thoughts
          </h2>

          {/* Distillation Progress */}
          <DistillationProgress
            isDistilling={isDistilling}
            bufferSize={bufferSize}
            maxBufferSize={maxBufferSize}
            strategy={distillationStrategy}
            progress={distillationProgress}
          />

          {/* Thought Buffer */}
          <ThoughtBufferView
            thoughts={thoughtBuffer}
            onThoughtSelect={(thought) => {
              addReasoningStep(
                'BoT Thought Selected',
                `User selected thought: ${thought.content.substring(0, 50)}...`
              );
            }}
          />

          {/* Meta-Buffers */}
          <MetaBufferView
            metaBuffers={metaBuffers}
            onMetaBufferSelect={(mb) => {
              addReasoningStep(
                'BoT Meta-Buffer Selected',
                `User selected meta-buffer: ${mb.summary.substring(0, 50)}...`
              );
            }}
          />
        </div>
      )}

      {/* Loading State */}
      {!isComplete && rounds.length === 0 && (
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-3"></div>
            <p className="text-gray-500 text-sm">Initializing consensus engine...</p>
          </div>
        </div>
      )}

      {/* Complete State */}
      {isComplete && (
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-3 text-center">
          <p className="text-white font-medium text-sm">Query Complete</p>
        </div>
      )}
    </div>
  );
}
