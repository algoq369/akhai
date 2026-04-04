'use client';

import { useEffect, useState } from 'react';
import type {
  ConsensusRound,
  GTPAdvisor,
  QuorumStatus,
  ReasoningStep,
  ThoughtNode,
  MetaBuffer,
  DistillationStrategy,
  GroundingAlertType,
} from './VerificationWindow.types';
import {
  createRoundPauseHandlers,
  createGroundingHandlers,
} from './useVerificationStream.handlers';

export function useVerificationStream(queryId: string) {
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

  // Grounding Guard state
  const [groundingAlerts, setGroundingAlerts] = useState<GroundingAlertType[]>([]);

  // Buffer of Thoughts state
  const [isBoT, setIsBoT] = useState(false);
  const [thoughtBuffer, setThoughtBuffer] = useState<ThoughtNode[]>([]);
  const [metaBuffers, setMetaBuffers] = useState<MetaBuffer[]>([]);
  const [isDistilling, setIsDistilling] = useState(false);
  const [distillationStrategy, setDistillationStrategy] =
    useState<DistillationStrategy>('hierarchical');
  const [distillationProgress, setDistillationProgress] = useState(0);
  const [bufferSize, setBufferSize] = useState(0);
  const [maxBufferSize, setMaxBufferSize] = useState(10);

  const addReasoningStep = (phase: string, message: string, data?: any) => {
    setReasoningSteps((prev) => [...prev, { timestamp: Date.now(), phase, message, data }]);
    setCurrentPhase(phase);
  };

  // Round pause handlers (extracted)
  const { handleContinue, handleAccept, handleCancel } = createRoundPauseHandlers(
    setRoundPaused,
    setPausedRound,
    pausedRound,
    setIsComplete,
    setError,
    addReasoningStep
  );

  // Grounding Guard action handlers (extracted)
  const { handleRefine, handleContinueAlert, handlePivot, handleDismissAlert } =
    createGroundingHandlers(addReasoningStep, setGroundingAlerts);

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
        setErrorHint(
          'Check provider status at /api/test-providers. One or more AI providers may be slow or down.'
        );
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

          // TOT-specific events
          case 'tot-analysis':
            setIsGTP(true);
            setProgress(10);
            addReasoningStep(
              'TOT Analysis',
              'Query analyzed for TOT methodology - using parallel Flash architecture'
            );
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
              addReasoningStep(
                'Flash Prepare',
                `Initialized ${initialAdvisors.length} advisor roles: ${data.data.roles.join(', ')}`
              );
            }
            break;

          case 'flash-broadcast':
            setProgress(20);
            addReasoningStep(
              'Flash Broadcast',
              'Broadcasting context frame to all advisors simultaneously (TRUE parallelism)'
            );
            break;

          case 'advisor-failed':
            setGtpAdvisors((prev) =>
              prev.map((advisor) =>
                advisor.slot === data.data.slot
                  ? { ...advisor, status: 'failed' as const }
                  : advisor
              )
            );
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
            setQuorumStatus((prev) =>
              prev ? { ...prev, reached: true, reason: data.data.reason } : undefined
            );
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
            setProgress((prev) => Math.min(prev + 10, 60));

            // Update GTP advisors if in GTP mode
            if (data.data.role) {
              setGtpAdvisors((prev) =>
                prev.map((advisor) =>
                  advisor.slot === data.data.slot
                    ? { ...advisor, family: data.data.family, status: 'thinking' as const }
                    : advisor
                )
              );
              addReasoningStep(
                'Advisor Start',
                `Slot ${data.data.slot} (${data.data.family}/${data.data.role}) analyzing query...`
              );
            } else {
              addReasoningStep(
                'Advisor Start',
                `Slot ${data.data.slot} (${data.data.family}) processing...`
              );
            }

            // Also update rounds for non-GTP flows
            if (data.data.round !== undefined) {
              setRounds((prev) => {
                const newRounds = [...prev];
                const roundIndex = newRounds.findIndex((r) => r.round === data.data.round);

                const response = {
                  slot: data.data.slot,
                  family: data.data.family,
                  response: data.data.response || `${data.data.family} is analyzing...`,
                  status: 'thinking' as const,
                  timestamp: Date.now(),
                };

                if (roundIndex >= 0) {
                  const respIndex = newRounds[roundIndex].responses.findIndex(
                    (r) => r.slot === data.data.slot
                  );
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
            setProgress((prev) => Math.min(prev + 10, 70));

            // Update GTP advisors if in GTP mode
            if (data.data.role) {
              setGtpAdvisors((prev) =>
                prev.map((advisor) =>
                  advisor.slot === data.data.slot
                    ? {
                        ...advisor,
                        status: 'complete' as const,
                        confidence: data.data.confidence,
                        keyPoints: data.data.keyPoints,
                      }
                    : advisor
                )
              );
              addReasoningStep(
                'Advisor Complete',
                `Slot ${data.data.slot} completed with ${Math.round((data.data.confidence || 0) * 100)}% confidence`,
                {
                  slot: data.data.slot,
                  family: data.data.family,
                  response: data.data.keyPoints?.[0] || 'Analysis complete',
                }
              );
            } else {
              addReasoningStep(
                'Advisor Complete',
                `Slot ${data.data.slot} (${data.data.family}) finished analysis`
              );
            }

            // Also update rounds for non-GTP flows
            if (data.data.round !== undefined) {
              setRounds((prev) => {
                const newRounds = [...prev];
                const roundIndex = newRounds.findIndex((r) => r.round === data.data.round);

                const response = {
                  slot: data.data.slot,
                  family: data.data.family,
                  response: data.data.response,
                  status: 'complete' as const,
                  timestamp: Date.now(),
                };

                if (roundIndex >= 0) {
                  const respIndex = newRounds[roundIndex].responses.findIndex(
                    (r) => r.slot === data.data.slot
                  );
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
            setRounds((prev) => {
              const newRounds = [...prev];
              const roundIndex = newRounds.findIndex((r) => r.round === data.data.round);
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
            addReasoningStep(
              'Round Complete',
              `Round ${data.data.round} complete. Review consensus before continuing.`
            );
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
            // Check for grounding alerts in result
            if (data.data?.groundingAlerts && data.data.groundingAlerts.length > 0) {
              setGroundingAlerts(data.data.groundingAlerts);
              addReasoningStep(
                'Grounding Check',
                `${data.data.groundingAlerts.length} grounding alert(s) detected`
              );
            }
            break;

          case 'grounding-alert':
            // Handle grounding alert event
            if (data.data?.alert) {
              setGroundingAlerts((prev) => [...prev, data.data.alert]);
              addReasoningStep(
                'Grounding Alert',
                `${data.data.alert.type} alert: ${data.data.alert.message}`
              );
            }
            break;

          // Self-Consistency events
          case 'sc-init':
            setIsBoT(true);
            if (data.data?.config) {
              setMaxBufferSize(data.data.config.maxBufferSize || 10);
              setDistillationStrategy(data.data.config.distillationStrategy || 'hierarchical');
            }
            addReasoningStep('SC Initialize', 'Self-Consistency methodology activated');
            break;

          case 'sc-thought-added':
            if (data.data?.thought) {
              setThoughtBuffer((prev) => [...prev, data.data.thought]);
              setBufferSize((prev) => prev + 1);
              addReasoningStep(
                'SC Thought',
                `New thought added (depth ${data.data.thought.depth}): ${data.data.thought.content.substring(0, 50)}...`
              );
            }
            break;

          case 'sc-distillation-start':
            setIsDistilling(true);
            setDistillationProgress(0);
            addReasoningStep(
              'SC Distillation',
              `Starting distillation (${data.data?.bufferSize || bufferSize} thoughts, strategy: ${data.data?.strategy || distillationStrategy})`
            );
            break;

          case 'sc-distillation-progress':
            if (data.data?.progress !== undefined) {
              setDistillationProgress(data.data.progress);
            }
            break;

          case 'sc-distillation-complete':
            setIsDistilling(false);
            setDistillationProgress(1);
            if (data.data?.metaBuffer) {
              setMetaBuffers((prev) => [...prev, data.data.metaBuffer]);
              addReasoningStep(
                'SC Meta-Buffer',
                `Distillation complete: ${data.data.metaBuffer.keyInsights.length} key insights, ${data.data.metaBuffer.tokensSaved} tokens saved`
              );
            }
            // Clear thought buffer after distillation
            setThoughtBuffer([]);
            setBufferSize(0);
            break;

          case 'sc-buffer-update':
            if (data.data?.snapshot) {
              setThoughtBuffer(data.data.snapshot.thoughts || []);
              setMetaBuffers(data.data.snapshot.metaBuffers || []);
              setBufferSize(data.data.snapshot.thoughts?.length || 0);
            }
            break;

          case 'sc-solution-path':
            if (data.data?.path) {
              const pathIds = data.data.path.map((t: ThoughtNode) => t.id);
              setThoughtBuffer((prev) =>
                prev.map((t) => ({
                  ...t,
                  isOnSolutionPath: pathIds.includes(t.id),
                }))
              );
              addReasoningStep(
                'BoT Solution Path',
                `Identified solution path with ${data.data.path.length} thoughts`
              );
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

  return {
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
    synthesisOutput,
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
  };
}
