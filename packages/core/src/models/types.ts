// Grounding Guard Types (imported)
import type { GroundingAlert } from '../grounding/types.js';

// Model Provider Types
export type ModelFamily = 'anthropic' | 'deepseek' | 'mistral' | 'xai';

export interface ModelConfig {
  family: ModelFamily;
  model?: string;
  apiKey?: string;
  baseUrl?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface ProviderConfig {
  family: ModelFamily;
  models: string[];
  defaultModel: string;
  requiresApiKey: boolean;
  baseUrl?: string;
}

export interface CompletionRequest {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface CompletionResponse {
  content: string;
  usage?: { inputTokens: number; outputTokens: number };
  model: string;
  family: ModelFamily;
}

// Advisor Layer Types
export type AdvisorRole = 'brainstormer' | 'redactor';

export interface AdvisorSlotInfo {
  slot: 1 | 2 | 3 | 4;
  family: ModelFamily;
  role: AdvisorRole;
  isAlignedWithMotherBase: boolean;
}

export interface ResolvedAdvisorLayer {
  slot1: AdvisorSlotInfo;
  slot2: AdvisorSlotInfo;
  slot3: AdvisorSlotInfo;
  slot4: AdvisorSlotInfo;
}

// Consensus Types
export interface ConsensusRound {
  round: number;
  responses: Array<{
    slot: number;
    family: string;
    response: string;
  }>;
  consensusReached: boolean;
}

export interface ConsensusResult {
  rounds: ConsensusRound[];
  totalRounds: number;
  consensusReachedAt: number | null;
  finalConsensus: Array<{
    slot: number;
    family: string;
    finalPosition: string;
  }>;
}

// Flow Types
export interface FlowAResult {
  layerConsensus: ConsensusResult;
  redactorOutput: string;
  motherBaseExchanges: Array<{
    advisorOutput: string;
    motherBaseResponse: string;
    approved: boolean;
  }>;
  totalMotherBaseExchanges: number;
  approvedAt: number | null;
  finalDecision: string;
  groundingAlerts: GroundingAlert[];
}

export interface FlowBResult {
  layerConsensus: ConsensusResult;
  redactorOutput: string;
  subAgentExchanges: Array<{
    guidance: string;
    agentResponse: string;
    complete: boolean;
  }>;
  totalSubAgentExchanges: number;
  subAgentCompletedAt: number | null;
  motherBaseApproval: {
    exchanges: Array<{
      subAgentWork: string;
      motherBaseResponse: string;
      approved: boolean;
    }>;
    totalExchanges: number;
    approvedAt: number | null;
  };
  finalOutput: string;
  groundingAlerts: GroundingAlert[];
}

// Execution Callback Types
export interface ExecutionCallbacks {
  onAdvisorStart?: (slot: number, family: string, round: number) => void;
  onAdvisorComplete?: (slot: number, family: string, round: number, output: string) => void;
  onConsensusCheck?: (round: number, reached: boolean) => void;
  onRoundComplete?: (round: number, totalRounds: number) => void;
  onRedactorStart?: () => void;
  onRedactorComplete?: (synthesis: string, family: string) => void;
  onMotherBaseReview?: (exchange: number, approved: boolean, response: string) => void;
  onSubAgentStart?: (agentName: string, exchange: number) => void;
  onSubAgentComplete?: (agentName: string, exchange: number, output: string, complete: boolean) => void;
  onGroundingAlert?: (alert: GroundingAlert) => void;
}
