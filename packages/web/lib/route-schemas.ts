/**
 * Route input contracts (Zod). Pure module: zod-only imports, so schemas are testable
 * in any vitest environment and reusable across boundaries.
 */
import { z } from 'zod';

export const AuthEmailSchema = z.object({
  email: z.string().email().max(320),
  action: z.enum(['send', 'verify']),
  // 6-digit code; length-capped only — format wrongness surfaces as the handler's own
  // 'Invalid or expired code' (behavior-preserving), presence is checked per-action below
  code: z.string().min(1).max(10).optional(),
});

export const AuthWalletSchema = z.object({
  // EVM address: 0x + 40 hex chars (checksummed or lowercase)
  address: z.string().regex(/^0x[0-9a-fA-F]{40}$/, 'invalid wallet address'),
});

export const AuthWalletVerifySchema = z.object({
  // EVM address: 0x + 40 hex chars (checksummed or lowercase)
  address: z.string().regex(/^0x[0-9a-fA-F]{40}$/, 'invalid wallet address'),
  // 0x-hex floor. Standard ECDSA personal_sign is 0x+130 hex, but smart-account (EIP-1271)
  // signatures run longer — and verifyWalletSignature is currently a placeholder, so this
  // is a shape floor, not a cryptographic check.
  signature: z.string().regex(/^0x[0-9a-fA-F]+$/, 'invalid signature').max(5000),
  // the handler regenerates and compares the exact expected message (~150 chars)
  message: z.string().min(1).max(500),
});

export const CheckoutSchema = z.object({
  priceId: z.string().min(1).max(200),
  // passed straight through as the Stripe Checkout mode — only these two are valid here
  mode: z.enum(['subscription', 'payment']),
  planId: z.string().max(200).optional(),
  userId: z.string().max(200).optional(),
  // Stripe line-item quantity; the UI always sends 1 — 100 is a generous ceiling
  quantity: z.number().int().min(1).max(100).default(1),
  // analytics-only fields PricingCard sends alongside the checkout body
  price: z.number().nonnegative().max(1_000_000).optional(),
  tokens: z.number().nonnegative().max(1_000_000_000_000).optional(),
});

export const CheckoutCustomCreditsSchema = z.object({
  // handler contract: $5–$10,000; fractional dollars are valid (UI parseFloat, Stripe gets
  // Math.round(amount*100) cents) — int() would 400 a currently-valid $7.50 purchase
  amount: z.number().min(5).max(10000),
  // UI computes Math.floor(dollars/0.04*1000) — max legit is 250M at $10,000; 1e9 = absurdity guard
  tokens: z.number().int().positive().max(1_000_000_000),
});

// schema-level SSRF floor: http(s) only, even though the fetcher also guards
const HttpUrl = z
  .string()
  .url()
  .max(2048)
  .refine((u) => /^https?:\/\//i.test(u), 'http(s) only');

export const FetchUrlSchema = z.object({
  urls: z.union([HttpUrl, z.array(HttpUrl).max(20)]).optional(),
  text: z.string().max(20000).optional(),
  maxUrls: z.number().int().min(1).max(10).default(3),
});

export const WebBrowseSchema = z.object({
  // schema-level SSRF floor: http(s) only, even though the handler also parses the URL
  url: z
    .string()
    .url()
    .max(2048)
    .refine((u) => /^https?:\/\//i.test(u), 'http(s) only'),
  query: z.string().max(4000).optional(),
  // the handler's switch treated unknown types as 'webpage' — the enum makes that contract explicit
  type: z.enum(['github', 'youtube', 'image', 'webpage']).optional(),
});

export const WebSearchSchema = z.object({
  // simple-query's auto-search forwards the full user query (its schema caps at 10000)
  query: z.string().min(1).max(10000),
  maxResults: z.number().int().min(1).max(20).default(5),
});

// ⚠ INTERNAL CONTRACT: simple-query/route.ts calls tot-consensus with the body
// { query, conversationHistory } where both already passed simple-query's own schema
// (query ≤10000; history is an UNBOUNDED array of {role, content} — no caps here, or a
// long conversation would 400 the internal call and silently degrade ToT to single-model).
export const TotConsensusSchema = z.object({
  query: z.string().min(1).max(10000),
  conversationHistory: z
    .array(z.object({ role: z.string(), content: z.string() }))
    .default([]),
});

// NOTE: flatten() emits schema messages only — the submitted key value is NEVER echoed
export const TestKeySchema = z.object({
  provider: z.enum(['anthropic', 'deepseek', 'xai', 'openrouter']),
  key: z.string().min(1).max(300),
});

// ───────────────────────────── tranche 2 ─────────────────────────────

/** chat message shape shared by the god-view / natal chat routes: 100-turn cap, 8k per message */
const ChatMessagesSchema = z
  .array(z.object({ role: z.string().max(20), content: z.string().max(8000) }))
  .max(100);

const EsotericModeSchema = z.enum(['secular', 'esoteric']);

export const EsotericAnalyzeSchema = z.object({
  query: z.string().min(1).max(10000),
  topics: z.array(z.string().max(200)).max(50).default([]),
  mode: EsotericModeSchema.optional(),
});

// ⚠ PII: the natal routes carry BIRTH-DATA-derived chart placements. 400 responses emit
// flatten() messages only — received values are NEVER echoed (test-key precedent).
// Chart sub-objects use .passthrough(): natal-synthesis forwards chart.aspects VERBATIM into
// the prompt payload, so stripping unknown keys (symbol/angle/exact) would silently thin the
// model's input. Bounds apply to the fields the handlers actually interpolate.
const NatalNodeSchema = z
  .object({
    sign: z.string().max(50),
    formattedDegree: z.string().max(50),
    house: z.number(),
  })
  .passthrough();

const NatalChartSchema = z
  .object({
    northNode: NatalNodeSchema,
    southNode: NatalNodeSchema,
    aspects: z
      .array(
        z
          .object({ planet: z.string().max(50), type: z.string().max(50), orb: z.number() })
          .passthrough()
      )
      .max(100)
      .optional(),
    planets: z
      .array(
        z
          .object({
            name: z.string().max(50),
            sign: z.string().max(50),
            signDegree: z.number(),
            house: z.number(),
          })
          .passthrough()
      )
      .max(30)
      .optional(),
  })
  .passthrough();

export const NatalChatSchema = z.object({
  question: z.string().min(1).max(4000),
  chart: NatalChartSchema,
  mode: EsotericModeSchema.optional(),
  messages: ChatMessagesSchema.default([]),
});

export const NatalSynthesisSchema = z.object({
  chart: NatalChartSchema,
  mode: EsotericModeSchema.optional(),
});

export const GodViewAgentChatSchema = z.object({
  // resolved against COUNCIL_AGENTS at runtime (unknown ids keep today's 404) — a bounded
  // string, not an enum, so adding an agent never requires a schema edit
  agentId: z.string().min(1).max(50),
  messages: ChatMessagesSchema.min(1),
  // AgentChat always sends both, possibly '' — the handler slices originalResponse to 3000
  originalQuery: z.string().max(10000).optional(),
  originalResponse: z.string().max(20000).optional(),
});

export const GodViewCouncilSchema = z.object({
  query: z.string().min(1).max(10000),
  // both callers pre-slice to 4000 and the handler slices again — 8000 is headroom, not a promise
  response: z.string().max(8000).optional(),
});

export const GodViewPredictSchema = z.object({
  // seed can be a whole page/node text; the handler slices per-use (entity prompt: 5000)
  seed: z.string().min(1).max(20000),
  question: z.string().min(1).max(4000),
  // free-form from the UI ('auto' triggers detection; other values pass through to prompts)
  domain: z.string().max(100).optional(),
});

export const GodViewScenarioChatSchema = z.object({
  branchSummary: z.string().max(8000).optional(),
  keyEvents: z.array(z.string().max(2000)).max(50).optional(),
  question: z.string().min(1).max(4000),
  messages: ChatMessagesSchema.optional(),
});

export const SideCanalSchema = z.object({
  query: z.string().min(1).max(10000),
  // the FULL answer text the store posts after completion — generous cap, never clip a
  // legitimate long answer
  response: z.string().min(1).max(60000),
  queryId: z.string().min(1).max(200),
});

export const SideCanalSynopsisSchema = z.object({
  topicId: z.string().min(1).max(200),
  queryIds: z.array(z.string().max(200)).max(500),
});

// The whole body IS the settings object; keys are known — typed explicitly, all optional,
// spread-merge semantics preserved. apiKey values may arrive masked ('sk-***'); the handler
// skips masked values itself. Unknown provider keys are stripped (they only polluted the
// in-memory store before).
export const SettingsSchema = z.object({
  apiKeys: z
    .object({
      anthropic: z.string().max(300).optional(),
      deepseek: z.string().max(300).optional(),
      xai: z.string().max(300).optional(),
      openrouter: z.string().max(300).optional(),
    })
    .optional(),
  modelConfig: z
    .object({
      motherBase: z.string().max(100).optional(),
      slot1: z.string().max(100).optional(),
      slot2: z.string().max(100).optional(),
    })
    .optional(),
  consensus: z
    .object({
      maxRounds: z.number().int().min(1).max(10).optional(),
      timeoutSeconds: z.number().int().min(1).max(600).optional(),
      autoApproveThreshold: z.number().min(0).max(100).optional(),
    })
    .optional(),
  appearance: z.object({ compactView: z.boolean().optional() }).optional(),
});

// ───────────────────────── tranche 3 (terminal) ─────────────────────────

/** 11-layer weight map keyed by numeric layer id; handlers fill missing layers with 0.5 */
const LayerWeightsSchema = z
  .record(z.string().regex(/^\d+$/), z.number().min(0).max(1))
  .refine((o) => Object.keys(o).length <= 32, 'too many layer keys');

const PillarBalanceSchema = z.object({
  left: z.number().min(0).max(1),
  middle: z.number().min(0).max(1),
  right: z.number().min(0).max(1),
});

const ProcessingModeSchema = z.enum(['weighted', 'parallel', 'adaptive']);

export const CanvasStageSchema = z.object({
  // every call site (page.tsx / canvas/page.tsx) sends a pre-cleaned string[]; the handler
  // slices to 5 — the 100 cap here is transport sanity, not the business limit
  stageIds: z.array(z.string().max(200)).max(100).default([]),
});

export const DiscoverLinksSchema = z.object({
  query: z.string().min(1).max(4000),
  topics: z.array(z.string().max(200)).max(50).optional(),
  maxLinks: z.number().int().min(1).max(20).default(6),
});

export const GeocodeSchema = z.object({
  city: z.string().min(1).max(200),
});

// idea-factory agent config: name/type land in columns; the WHOLE object persists as
// config_json — passthrough keeps arbitrary agent settings, the refine bounds the DB row
export const IdeaFactoryAgentSchema = z
  .object({
    name: z.string().max(200).optional(),
    type: z.string().max(50).optional(),
  })
  .passthrough()
  .refine((o) => JSON.stringify(o).length <= 50_000, 'config too large');

export const ImplementationsCreateSchema = z.object({
  featureName: z.string().min(1).max(300),
  // Implementation['featureType'] in lib/implementation-tracker.ts
  featureType: z.enum(['function', 'tool', 'app', 'methodology', 'enhancement', 'fix', 'integration']),
  description: z.string().min(1).max(4000),
  sessionId: z.string().max(200).optional(),
  commandUsed: z.string().max(500).optional(),
  filesCreated: z.array(z.string().max(500)).max(200).optional(),
  filesModified: z.array(z.string().max(500)).max(200).optional(),
  linesAdded: z.number().int().min(0).optional(),
  linesModified: z.number().int().min(0).optional(),
  // the handler only ACTS on 'validated'/'testing'; other values echo back — bounded string,
  // not an enum, so unknown CLI callers keep today's behavior
  status: z.string().max(50).optional(),
  validationMessage: z.string().max(2000).optional(),
});

export const ImplementationsPatchSchema = z.object({
  id: z.number().int().positive(), // Implementation.id is numeric (implementation-store types)
  action: z.enum(['validate', 'reject', 'revert', 'testing', 'update-files']),
  message: z.string().max(2000).optional(),
  filesCreated: z.array(z.string().max(500)).max(200).optional(),
  filesModified: z.array(z.string().max(500)).max(200).optional(),
  linesAdded: z.number().int().min(0).optional(),
  linesModified: z.number().int().min(0).optional(),
});

export const LayerTestSchema = z.object({
  query: z.string().min(1).max(4000),
  // ⚠ COST AMPLIFICATION: each config entry fans into one live LLM run — the 20 cap is a
  // cost-safety bound, not a style choice
  configs: z
    .array(z.object({ name: z.string().max(200).optional(), weights: LayerWeightsSchema.optional() }))
    .min(1)
    .max(20),
});

// whole-body PATCH: only the fields the handler persists; unknown keys are stripped
export const MindmapTopicPatchSchema = z.object({
  color: z.string().max(50).optional(),
  // the UI sends booleans; SQLite persists 0/1 — accept both, exactly what works today
  pinned: z.union([z.boolean(), z.number().int().min(0).max(1)]).optional(),
  archived: z.union([z.boolean(), z.number().int().min(0).max(1)]).optional(),
  ai_instructions: z.string().max(4000).optional(),
});

export const TreeConfigSaveSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  layerWeights: LayerWeightsSchema,
  antipatternSuppression: z
    .record(z.string().regex(/^\d+$/), z.number().min(0).max(1))
    .optional(),
  pillarBalance: PillarBalanceSchema.optional(),
  processingMode: ProcessingModeSchema.optional(),
});

export const TreeConfigPatchSchema = z.object({
  configId: z.number().int().positive(), // TreeConfiguration.id is numeric
  action: z.enum(['activate', 'update']),
  updates: z
    .object({
      name: z.string().max(200).optional(),
      description: z.string().max(2000).optional(),
      layerWeights: LayerWeightsSchema.optional(),
      antipatternSuppression: z
        .record(z.string().regex(/^\d+$/), z.number().min(0).max(1))
        .optional(),
      pillarBalance: PillarBalanceSchema.optional(),
      processingMode: ProcessingModeSchema.optional(),
    })
    .optional(),
});

export const TreeConfigTestSchema = z.object({
  // ⚠ fans into the live pipeline (internal simple-query call) — bounds are cost-safety
  query: z.string().min(1).max(4000),
  weights: LayerWeightsSchema.optional(),
  processingMode: ProcessingModeSchema.default('weighted'),
});

export const XVideoAnalysisSchema = z.object({
  url: HttpUrl,
  // accepted for caller compat; NEVER used — identity is session-derived
  // (E4.2 HIGH: client id selected other users' stored X tokens)
  userId: z.string().max(200).optional(),
  analysisPrompt: z.string().max(4000).optional(),
});
