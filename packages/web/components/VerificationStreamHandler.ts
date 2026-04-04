import type { Dispatch, SetStateAction } from 'react';
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

export interface StreamSetters {
  setProgress: Dispatch<SetStateAction<number>>;
  setIsGTP: Dispatch<SetStateAction<boolean>>;
  setGtpAdvisors: Dispatch<SetStateAction<GTPAdvisor[]>>;
  setQuorumStatus: Dispatch<SetStateAction<QuorumStatus | undefined>>;
  setInsightsCount: Dispatch<SetStateAction<number>>;
  setSynthesisOutput: Dispatch<SetStateAction<string | null>>;
  setRounds: Dispatch<SetStateAction<ConsensusRound[]>>;
  setRoundPaused: Dispatch<SetStateAction<boolean>>;
  setPausedRound: Dispatch<SetStateAction<number | null>>;
  setRedactorOutput: Dispatch<SetStateAction<string | null>>;
  setFinalDecision: Dispatch<SetStateAction<string | null>>;
  setGroundingAlerts: Dispatch<SetStateAction<GroundingAlertType[]>>;
  setIsBoT: Dispatch<SetStateAction<boolean>>;
  setThoughtBuffer: Dispatch<SetStateAction<ThoughtNode[]>>;
  setMetaBuffers: Dispatch<SetStateAction<MetaBuffer[]>>;
  setIsDistilling: Dispatch<SetStateAction<boolean>>;
  setDistillationStrategy: Dispatch<SetStateAction<DistillationStrategy>>;
  setDistillationProgress: Dispatch<SetStateAction<number>>;
  setBufferSize: Dispatch<SetStateAction<number>>;
  setMaxBufferSize: Dispatch<SetStateAction<number>>;
  setIsComplete: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setErrorHint: Dispatch<SetStateAction<string | null>>;
  addReasoningStep: (phase: string, message: string, data?: any) => void;
}

export interface StreamEventResult {
  closeSource?: boolean;
  clearTimeout?: boolean;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function handleStreamEvent(
  data: any,
  s: StreamSetters,
  finalDecision: string | null,
  bufferSize: number,
  distillationStrategy: DistillationStrategy
): StreamEventResult {
  const result: StreamEventResult = {};

  switch (data.type) {
    case 'init':
      s.setProgress(5);
      s.addReasoningStep('Initialize', 'Connected to query stream, starting execution...');
      break;

    // TOT-specific events
    case 'tot-analysis':
      s.setIsGTP(true);
      s.setProgress(10);
      s.addReasoningStep(
        'TOT Analysis',
        'Query analyzed for TOT methodology - using parallel Flash architecture'
      );
      break;

    case 'flash-prepare':
      s.setProgress(15);
      if (data.data.roles) {
        const initialAdvisors = data.data.roles.map((role: string, index: number) => ({
          slot: index + 1,
          family: '',
          role,
          status: 'waiting' as const,
        }));
        s.setGtpAdvisors(initialAdvisors);
        s.addReasoningStep(
          'Flash Prepare',
          `Initialized ${initialAdvisors.length} advisor roles: ${data.data.roles.join(', ')}`
        );
      }
      break;

    case 'flash-broadcast':
      s.setProgress(20);
      s.addReasoningStep(
        'Flash Broadcast',
        'Broadcasting context frame to all advisors simultaneously (TRUE parallelism)'
      );
      break;

    case 'advisor-failed':
      s.setGtpAdvisors((prev) =>
        prev.map((advisor) =>
          advisor.slot === data.data.slot ? { ...advisor, status: 'failed' as const } : advisor
        )
      );
      break;

    case 'merge-update':
      s.setInsightsCount(data.data.insightsCount || 0);
      s.setProgress(40 + (data.data.responsesReceived / data.data.responsesExpected) * 30);
      break;

    case 'quorum-progress':
      s.setQuorumStatus({
        responsesReceived: data.data.responsesReceived,
        responsesExpected: data.data.responsesExpected,
        agreementLevel: data.data.agreementLevel,
        reached: data.data.reached,
        reason: data.data.reason,
      });
      break;

    case 'quorum-reached':
      s.setProgress(75);
      s.setQuorumStatus((prev) =>
        prev ? { ...prev, reached: true, reason: data.data.reason } : undefined
      );
      break;

    case 'synthesis-start':
      s.setProgress(80);
      s.setSynthesisOutput('Mother Base is synthesizing advisor insights...');
      break;

    case 'synthesis-complete':
      s.setProgress(95);
      s.setSynthesisOutput(data.data.output);
      s.setFinalDecision(data.data.output);
      break;

    case 'advisor-start':
      s.setProgress((prev) => Math.min(prev + 10, 60));

      if (data.data.role) {
        s.setGtpAdvisors((prev) =>
          prev.map((advisor) =>
            advisor.slot === data.data.slot
              ? { ...advisor, family: data.data.family, status: 'thinking' as const }
              : advisor
          )
        );
        s.addReasoningStep(
          'Advisor Start',
          `Slot ${data.data.slot} (${data.data.family}/${data.data.role}) analyzing query...`
        );
      } else {
        s.addReasoningStep(
          'Advisor Start',
          `Slot ${data.data.slot} (${data.data.family}) processing...`
        );
      }

      if (data.data.round !== undefined) {
        s.setRounds((prev) => {
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
      s.setProgress((prev) => Math.min(prev + 10, 70));

      if (data.data.role) {
        s.setGtpAdvisors((prev) =>
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
        s.addReasoningStep(
          'Advisor Complete',
          `Slot ${data.data.slot} completed with ${Math.round((data.data.confidence || 0) * 100)}% confidence`,
          {
            slot: data.data.slot,
            family: data.data.family,
            response: data.data.keyPoints?.[0] || 'Analysis complete',
          }
        );
      } else {
        s.addReasoningStep(
          'Advisor Complete',
          `Slot ${data.data.slot} (${data.data.family}) finished analysis`
        );
      }

      if (data.data.round !== undefined) {
        s.setRounds((prev) => {
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
      break;

    case 'consensus-reached':
      s.setRounds((prev) => {
        const newRounds = [...prev];
        const roundIndex = newRounds.findIndex((r) => r.round === data.data.round);
        if (roundIndex >= 0) {
          newRounds[roundIndex].consensusReached = true;
        }
        return newRounds;
      });
      break;

    case 'round-complete':
      s.setRoundPaused(true);
      s.setPausedRound(data.data.round);
      s.addReasoningStep(
        'Round Complete',
        `Round ${data.data.round} complete. Review consensus before continuing.`
      );
      break;

    case 'redactor-start':
      s.setProgress(75);
      s.setRedactorOutput('Redactor is synthesizing advisor outputs...');
      break;

    case 'redactor-complete':
      s.setProgress(85);
      s.setRedactorOutput(data.data.output);
      break;

    case 'mother-base-review':
      s.setProgress(95);
      s.setFinalDecision(data.data.decision);
      break;

    case 'result':
      if (data.data?.finalAnswer) {
        s.setFinalDecision(data.data.finalAnswer);
        s.addReasoningStep('Final Answer', 'Mother Base has provided the final answer');
        s.setProgress(95);
      }
      if (data.data?.groundingAlerts && data.data.groundingAlerts.length > 0) {
        s.setGroundingAlerts(data.data.groundingAlerts);
        s.addReasoningStep(
          'Grounding Check',
          `${data.data.groundingAlerts.length} grounding alert(s) detected`
        );
      }
      break;

    case 'grounding-alert':
      if (data.data?.alert) {
        s.setGroundingAlerts((prev) => [...prev, data.data.alert]);
        s.addReasoningStep(
          'Grounding Alert',
          `${data.data.alert.type} alert: ${data.data.alert.message}`
        );
      }
      break;

    // Self-Consistency events
    case 'sc-init':
      s.setIsBoT(true);
      if (data.data?.config) {
        s.setMaxBufferSize(data.data.config.maxBufferSize || 10);
        s.setDistillationStrategy(data.data.config.distillationStrategy || 'hierarchical');
      }
      s.addReasoningStep('SC Initialize', 'Self-Consistency methodology activated');
      break;

    case 'sc-thought-added':
      if (data.data?.thought) {
        s.setThoughtBuffer((prev) => [...prev, data.data.thought]);
        s.setBufferSize((prev) => prev + 1);
        s.addReasoningStep(
          'SC Thought',
          `New thought added (depth ${data.data.thought.depth}): ${data.data.thought.content.substring(0, 50)}...`
        );
      }
      break;

    case 'sc-distillation-start':
      s.setIsDistilling(true);
      s.setDistillationProgress(0);
      s.addReasoningStep(
        'SC Distillation',
        `Starting distillation (${data.data?.bufferSize || bufferSize} thoughts, strategy: ${data.data?.strategy || distillationStrategy})`
      );
      break;

    case 'sc-distillation-progress':
      if (data.data?.progress !== undefined) {
        s.setDistillationProgress(data.data.progress);
      }
      break;

    case 'sc-distillation-complete':
      s.setIsDistilling(false);
      s.setDistillationProgress(1);
      if (data.data?.metaBuffer) {
        s.setMetaBuffers((prev) => [...prev, data.data.metaBuffer]);
        s.addReasoningStep(
          'SC Meta-Buffer',
          `Distillation complete: ${data.data.metaBuffer.keyInsights.length} key insights, ${data.data.metaBuffer.tokensSaved} tokens saved`
        );
      }
      s.setThoughtBuffer([]);
      s.setBufferSize(0);
      break;

    case 'sc-buffer-update':
      if (data.data?.snapshot) {
        s.setThoughtBuffer(data.data.snapshot.thoughts || []);
        s.setMetaBuffers(data.data.snapshot.metaBuffers || []);
        s.setBufferSize(data.data.snapshot.thoughts?.length || 0);
      }
      break;

    case 'sc-solution-path':
      if (data.data?.path) {
        const pathIds = data.data.path.map((t: ThoughtNode) => t.id);
        s.setThoughtBuffer((prev) =>
          prev.map((t) => ({
            ...t,
            isOnSolutionPath: pathIds.includes(t.id),
          }))
        );
        s.addReasoningStep(
          'BoT Solution Path',
          `Identified solution path with ${data.data.path.length} thoughts`
        );
      }
      break;

    case 'complete':
      s.setProgress(100);
      s.setIsComplete(true);
      if (data.data?.finalAnswer && !finalDecision) {
        s.setFinalDecision(data.data.finalAnswer);
      }
      result.closeSource = true;
      result.clearTimeout = true;
      break;

    case 'error':
      s.setError(data.message || data.data?.message || 'Unknown error');
      s.setErrorHint(data.hint || data.data?.hint || null);
      result.closeSource = true;
      result.clearTimeout = true;
      break;

    default:
    // Unknown event type - ignore
  }

  return result;
}
