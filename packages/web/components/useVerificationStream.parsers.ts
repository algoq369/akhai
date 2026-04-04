'use client';

import type {
  GTPAdvisor,
  QuorumStatus,
  ThoughtNode,
  MetaBuffer,
  DistillationStrategy,
} from './VerificationWindow.types';

type AddReasoningStep = (phase: string, message: string, data?: any) => void;

export function parseGtpEvent(
  data: any,
  setIsGTP: (v: boolean) => void,
  setGtpAdvisors: React.Dispatch<React.SetStateAction<GTPAdvisor[]>>,
  setQuorumStatus: React.Dispatch<React.SetStateAction<QuorumStatus | undefined>>,
  setInsightsCount: (v: number) => void,
  setSynthesisOutput: (v: string | null) => void,
  setProgress: React.Dispatch<React.SetStateAction<number>>,
  setFinalDecision: (v: string | null) => void,
  addReasoningStep: AddReasoningStep
): boolean {
  switch (data.type) {
    case 'tot-analysis':
      setIsGTP(true);
      setProgress(10);
      addReasoningStep(
        'TOT Analysis',
        'Query analyzed for TOT methodology - using parallel Flash architecture'
      );
      return true;

    case 'flash-prepare':
      setProgress(15);
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
      return true;

    case 'flash-broadcast':
      setProgress(20);
      addReasoningStep(
        'Flash Broadcast',
        'Broadcasting context frame to all advisors simultaneously (TRUE parallelism)'
      );
      return true;

    case 'advisor-failed':
      setGtpAdvisors((prev) =>
        prev.map((advisor) =>
          advisor.slot === data.data.slot ? { ...advisor, status: 'failed' as const } : advisor
        )
      );
      return true;

    case 'merge-update':
      setInsightsCount(data.data.insightsCount || 0);
      setProgress(40 + (data.data.responsesReceived / data.data.responsesExpected) * 30);
      return true;

    case 'quorum-progress':
      setQuorumStatus({
        responsesReceived: data.data.responsesReceived,
        responsesExpected: data.data.responsesExpected,
        agreementLevel: data.data.agreementLevel,
        reached: data.data.reached,
        reason: data.data.reason,
      });
      return true;

    case 'quorum-reached':
      setProgress(75);
      setQuorumStatus((prev) =>
        prev ? { ...prev, reached: true, reason: data.data.reason } : undefined
      );
      return true;

    case 'synthesis-start':
      setProgress(80);
      setSynthesisOutput('Mother Base is synthesizing advisor insights...');
      return true;

    case 'synthesis-complete':
      setProgress(95);
      setSynthesisOutput(data.data.output);
      setFinalDecision(data.data.output);
      return true;

    default:
      return false;
  }
}

export function parseScEvent(
  data: any,
  setIsBoT: (v: boolean) => void,
  setThoughtBuffer: React.Dispatch<React.SetStateAction<ThoughtNode[]>>,
  setMetaBuffers: React.Dispatch<React.SetStateAction<MetaBuffer[]>>,
  setIsDistilling: (v: boolean) => void,
  setDistillationStrategy: (v: DistillationStrategy) => void,
  setDistillationProgress: (v: number) => void,
  setBufferSize: React.Dispatch<React.SetStateAction<number>>,
  setMaxBufferSize: (v: number) => void,
  bufferSize: number,
  distillationStrategy: DistillationStrategy,
  addReasoningStep: AddReasoningStep
): boolean {
  switch (data.type) {
    case 'sc-init':
      setIsBoT(true);
      if (data.data?.config) {
        setMaxBufferSize(data.data.config.maxBufferSize || 10);
        setDistillationStrategy(data.data.config.distillationStrategy || 'hierarchical');
      }
      addReasoningStep('SC Initialize', 'Self-Consistency methodology activated');
      return true;

    case 'sc-thought-added':
      if (data.data?.thought) {
        setThoughtBuffer((prev) => [...prev, data.data.thought]);
        setBufferSize((prev) => prev + 1);
        addReasoningStep(
          'SC Thought',
          `New thought added (depth ${data.data.thought.depth}): ${data.data.thought.content.substring(0, 50)}...`
        );
      }
      return true;

    case 'sc-distillation-start':
      setIsDistilling(true);
      setDistillationProgress(0);
      addReasoningStep(
        'SC Distillation',
        `Starting distillation (${data.data?.bufferSize || bufferSize} thoughts, strategy: ${data.data?.strategy || distillationStrategy})`
      );
      return true;

    case 'sc-distillation-progress':
      if (data.data?.progress !== undefined) {
        setDistillationProgress(data.data.progress);
      }
      return true;

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
      setThoughtBuffer([]);
      setBufferSize(0);
      return true;

    case 'sc-buffer-update':
      if (data.data?.snapshot) {
        setThoughtBuffer(data.data.snapshot.thoughts || []);
        setMetaBuffers(data.data.snapshot.metaBuffers || []);
        setBufferSize(data.data.snapshot.thoughts?.length || 0);
      }
      return true;

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
      return true;

    default:
      return false;
  }
}
