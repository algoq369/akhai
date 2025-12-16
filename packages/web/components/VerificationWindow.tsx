'use client';

import { useEffect, useState } from 'react';
import { FlashProgress } from './FlashProgress';
import { ReasoningLog } from './ReasoningLog';

interface AdvisorResponse {
  slot: number;
  family: string;
  response: string;
  status?: 'thinking' | 'complete';
  timestamp?: number;
}

interface ConsensusRound {
  round: number;
  responses: AdvisorResponse[];
  consensusReached: boolean;
}

interface GTPAdvisor {
  slot: number;
  family: string;
  role: string;
  status: 'waiting' | 'thinking' | 'complete' | 'failed';
  confidence?: number;
  keyPoints?: string[];
}

interface QuorumStatus {
  responsesReceived: number;
  responsesExpected: number;
  agreementLevel: number;
  reached: boolean;
  reason?: string;
}

interface ReasoningStep {
  timestamp: number;
  phase: string;
  message: string;
  data?: any;
}

interface VerificationWindowProps {
  queryId: string;
}

export default function VerificationWindow({ queryId }: VerificationWindowProps) {
  const [rounds, setRounds] = useState<ConsensusRound[]>([]);
  const [redactorOutput, setRedactorOutput] = useState<string | null>(null);
  const [finalDecision, setFinalDecision] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorHint, setErrorHint] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  // GTP-specific state
  const [isGTP, setIsGTP] = useState(false);
  const [gtpAdvisors, setGtpAdvisors] = useState<GTPAdvisor[]>([]);
  const [quorumStatus, setQuorumStatus] = useState<QuorumStatus | undefined>();
  const [insightsCount, setInsightsCount] = useState<number>(0);
  const [synthesisOutput, setSynthesisOutput] = useState<string | null>(null);

  // Reasoning log
  const [reasoningSteps, setReasoningSteps] = useState<ReasoningStep[]>([]);
  const [currentPhase, setCurrentPhase] = useState<string>('');

  // Round pause state
  const [roundPaused, setRoundPaused] = useState(false);
  const [pausedRound, setPausedRound] = useState<number | null>(null);

  const addReasoningStep = (phase: string, message: string, data?: any) => {
    setReasoningSteps(prev => [...prev, { timestamp: Date.now(), phase, message, data }]);
    setCurrentPhase(phase);
  };

  // Round pause handlers
  const handleContinue = () => {
    setRoundPaused(false);
    setPausedRound(null);
    addReasoningStep('Round Continue', `Continuing to next round after round ${pausedRound}`);
  };

  const handleAccept = () => {
    setRoundPaused(false);
    setPausedRound(null);
    setIsComplete(true);
    addReasoningStep('Round Accept', `Accepted consensus from round ${pausedRound}, skipping further rounds`);
  };

  const handleCancel = () => {
    setRoundPaused(false);
    setPausedRound(null);
    setError('Query cancelled by user');
    addReasoningStep('Round Cancel', `Query cancelled during round ${pausedRound} pause`);
  };

  // Timer for elapsed time
  useEffect(() => {
    if (isComplete || error) return;
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isComplete, error]);

  useEffect(() => {
    const eventSource = new EventSource(`/api/stream/${queryId}`);

    // Add 180-second timeout (3 minutes)
    const timeoutId = setTimeout(() => {
      if (!isComplete && !error) {
        setError('Query timed out after 3 minutes');
        setErrorHint('Check provider status at /api/test-providers. One or more AI providers may be slow or down.');
        eventSource.close();
      }
    }, 180000);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'init':
            // Initial connection established
            setProgress(5);
            addReasoningStep('Initialize', 'Connected to query stream, starting execution...');
            break;

          // GTP-specific events
          case 'gtp-analysis':
            setIsGTP(true);
            setProgress(10);
            addReasoningStep('GTP Analysis', 'Query analyzed for GTP methodology - using parallel Flash architecture');
            break;

          case 'flash-prepare':
            setProgress(15);
            // Initialize GTP advisors
            if (data.data.roles) {
              const initialAdvisors = data.data.roles.map((role: string, index: number) => ({
                slot: index + 1,
                family: '',
                role,
                status: 'waiting' as const,
              }));
              setGtpAdvisors(initialAdvisors);
              addReasoningStep('Flash Prepare', `Initialized ${initialAdvisors.length} advisor roles: ${data.data.roles.join(', ')}`);
            }
            break;

          case 'flash-broadcast':
            setProgress(20);
            addReasoningStep('Flash Broadcast', 'Broadcasting context frame to all advisors simultaneously (TRUE parallelism)');
            break;

          case 'advisor-failed':
            setGtpAdvisors(prev => prev.map(advisor =>
              advisor.slot === data.data.slot
                ? { ...advisor, status: 'failed' as const }
                : advisor
            ));
            break;

          case 'merge-update':
            setInsightsCount(data.data.insightsCount || 0);
            setProgress(40 + (data.data.responsesReceived / data.data.responsesExpected) * 30);
            break;

          case 'quorum-progress':
            setQuorumStatus({
              responsesReceived: data.data.responsesReceived,
              responsesExpected: data.data.responsesExpected,
              agreementLevel: data.data.agreementLevel,
              reached: data.data.reached,
              reason: data.data.reason,
            });
            break;

          case 'quorum-reached':
            setProgress(75);
            setQuorumStatus(prev => prev ? { ...prev, reached: true, reason: data.data.reason } : undefined);
            break;

          case 'synthesis-start':
            setProgress(80);
            setSynthesisOutput('Mother Base is synthesizing advisor insights...');
            break;

          case 'synthesis-complete':
            setProgress(95);
            setSynthesisOutput(data.data.output);
            setFinalDecision(data.data.output);
            break;

          case 'advisor-start':
            setProgress(prev => Math.min(prev + 10, 60));

            // Update GTP advisors if in GTP mode
            if (data.data.role) {
              setGtpAdvisors(prev => prev.map(advisor =>
                advisor.slot === data.data.slot
                  ? { ...advisor, family: data.data.family, status: 'thinking' as const }
                  : advisor
              ));
              addReasoningStep('Advisor Start', `Slot ${data.data.slot} (${data.data.family}/${data.data.role}) analyzing query...`);
            } else {
              addReasoningStep('Advisor Start', `Slot ${data.data.slot} (${data.data.family}) processing...`);
            }

            // Also update rounds for non-GTP flows
            if (data.data.round !== undefined) {
              setRounds(prev => {
                const newRounds = [...prev];
                const roundIndex = newRounds.findIndex(r => r.round === data.data.round);

                const response = {
                  slot: data.data.slot,
                  family: data.data.family,
                  response: data.data.response || `${data.data.family} is analyzing...`,
                  status: 'thinking' as const,
                  timestamp: Date.now(),
                };

                if (roundIndex >= 0) {
                  const respIndex = newRounds[roundIndex].responses.findIndex(r => r.slot === data.data.slot);
                  if (respIndex >= 0) {
                    newRounds[roundIndex].responses[respIndex] = response;
                  } else {
                    newRounds[roundIndex].responses.push(response);
                  }
                } else {
                  newRounds.push({
                    round: data.data.round,
                    responses: [response],
                    consensusReached: false,
                  });
                }

                return newRounds;
              });
            }
            break;

          case 'advisor-complete':
            setProgress(prev => Math.min(prev + 10, 70));

            // Update GTP advisors if in GTP mode
            if (data.data.role) {
              setGtpAdvisors(prev => prev.map(advisor =>
                advisor.slot === data.data.slot
                  ? {
                      ...advisor,
                      status: 'complete' as const,
                      confidence: data.data.confidence,
                      keyPoints: data.data.keyPoints,
                    }
                  : advisor
              ));
              addReasoningStep('Advisor Complete', `Slot ${data.data.slot} completed with ${Math.round((data.data.confidence || 0) * 100)}% confidence`, {
                slot: data.data.slot,
                family: data.data.family,
                response: data.data.keyPoints?.[0] || 'Analysis complete'
              });
            } else {
              addReasoningStep('Advisor Complete', `Slot ${data.data.slot} (${data.data.family}) finished analysis`);
            }

            // Also update rounds for non-GTP flows
            if (data.data.round !== undefined) {
              setRounds(prev => {
                const newRounds = [...prev];
                const roundIndex = newRounds.findIndex(r => r.round === data.data.round);

                const response = {
                  slot: data.data.slot,
                  family: data.data.family,
                  response: data.data.response,
                  status: 'complete' as const,
                  timestamp: Date.now(),
                };

                if (roundIndex >= 0) {
                  const respIndex = newRounds[roundIndex].responses.findIndex(r => r.slot === data.data.slot);
                  if (respIndex >= 0) {
                    newRounds[roundIndex].responses[respIndex] = response;
                  } else {
                    newRounds[roundIndex].responses.push(response);
                  }
                } else {
                  newRounds.push({
                    round: data.data.round,
                    responses: [response],
                    consensusReached: false,
                  });
                }

                return newRounds;
              });
            }
            break;

          case 'heartbeat':
            // Heartbeat to keep connection alive
            break;

          case 'consensus-reached':
            setRounds(prev => {
              const newRounds = [...prev];
              const roundIndex = newRounds.findIndex(r => r.round === data.data.round);
              if (roundIndex >= 0) {
                newRounds[roundIndex].consensusReached = true;
              }
              return newRounds;
            });
            break;

          case 'round-complete':
            // Round complete event - trigger pause for user review
            setRoundPaused(true);
            setPausedRound(data.data.round);
            addReasoningStep('Round Complete', `Round ${data.data.round} complete. Review consensus before continuing.`);
            break;

          case 'redactor-start':
            setProgress(75);
            setRedactorOutput('Redactor is synthesizing advisor outputs...');
            break;

          case 'redactor-complete':
            setProgress(85);
            setRedactorOutput(data.data.output);
            break;

          case 'mother-base-review':
            setProgress(95);
            setFinalDecision(data.data.decision);
            break;

          case 'result':
            // Handle result event with finalAnswer
            if (data.data?.finalAnswer) {
              setFinalDecision(data.data.finalAnswer);
              addReasoningStep('Final Answer', 'Mother Base has provided the final answer');
              setProgress(95);
            }
            break;

          case 'complete':
            setProgress(100);
            setIsComplete(true);
            // Also extract finalAnswer from complete event if available
            if (data.data?.finalAnswer && !finalDecision) {
              setFinalDecision(data.data.finalAnswer);
            }
            eventSource.close();
            clearTimeout(timeoutId);
            break;

          case 'error':
            setError(data.message || data.data?.message || 'Unknown error');
            setErrorHint(data.hint || data.data?.hint || null);
            eventSource.close();
            clearTimeout(timeoutId);
            break;

          default:
            // Unknown event type - ignore
        }
      } catch (err) {
        console.error('Failed to parse event:', err);
      }
    };

    eventSource.onerror = () => {
      if (!isComplete && !error) {
        setError('Connection lost. Please refresh the page.');
        setErrorHint('The connection to the server was interrupted.');
      }
      eventSource.close();
      clearTimeout(timeoutId);
    };

    return () => {
      eventSource.close();
      clearTimeout(timeoutId);
    };
  }, [queryId, isComplete, error]);

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
        <ReasoningLog
          steps={reasoningSteps}
          currentPhase={currentPhase}
        />
      )}

      {/* Round Pause UI */}
      {roundPaused && pausedRound !== null && (
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
          <h3 className="text-white font-medium text-sm mb-2">
            Round {pausedRound} Complete - Review Consensus
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            Consensus round {pausedRound} has completed. You can review the advisor responses above and decide whether to continue to the next round, accept the current consensus, or cancel the query.
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
              {round.consensusReached && (
                <span className="ml-2 text-white text-xs">Consensus</span>
              )}
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
                  resp.status === 'thinking'
                    ? 'border-gray-600'
                    : 'border-gray-700'
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
          <h3 className="text-white font-medium text-sm mb-2">
            Redactor Synthesis
          </h3>
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
