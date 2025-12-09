// Model Provider Types
export type ModelFamily = 'anthropic' | 'openai' | 'deepseek' | 'qwen' | 'google' | 'mistral' | 'openrouter' | 'ollama' | 'groq' | 'xai';

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
}
