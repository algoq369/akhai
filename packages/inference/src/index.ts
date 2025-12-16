/**
 * AKHAI Inference Package
 * 
 * Self-hosted AI infrastructure for sovereign intelligence.
 */

// Core Mother Base
export { MotherBase, MOTHER_BASE_CONFIGS } from './MotherBase.js';
export type { MotherBaseConfig, ModelConfig, QueryOptions, ConsensusResult } from './MotherBase.js';

// Providers
export { SelfHostedProvider } from './providers/self-hosted.js';
export type { 
  SelfHostedConfig, 
  CompletionRequest, 
  CompletionResponse, 
  StreamChunk,
  Message 
} from './providers/self-hosted.js';

// Version
export const VERSION = '0.1.0';
