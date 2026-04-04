import type {
  GroundingAlert as GroundingAlertType,
  ThoughtNode,
  MetaBuffer,
  DistillationStrategy,
} from '@akhai/core';

export interface AdvisorResponse {
  slot: number;
  family: string;
  response: string;
  status?: 'thinking' | 'complete';
  timestamp?: number;
}

export interface ConsensusRound {
  round: number;
  responses: AdvisorResponse[];
  consensusReached: boolean;
}

export interface GTPAdvisor {
  slot: number;
  family: string;
  role: string;
  status: 'waiting' | 'thinking' | 'complete' | 'failed';
  confidence?: number;
  keyPoints?: string[];
}

export interface QuorumStatus {
  responsesReceived: number;
  responsesExpected: number;
  agreementLevel: number;
  reached: boolean;
  reason?: string;
}

export interface ReasoningStep {
  timestamp: number;
  phase: string;
  message: string;
  data?: any;
}

export interface VerificationWindowProps {
  queryId: string;
}

export type { GroundingAlertType, ThoughtNode, MetaBuffer, DistillationStrategy };
