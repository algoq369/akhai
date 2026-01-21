/**
 * AKHAI API Server
 *
 * REST and WebSocket API for Mother Base.
 * Provides programmatic access to AKHAI's AI capabilities.
 *
 * Endpoints:
 *   POST /v1/chat/completions   - OpenAI-compatible chat
 *   POST /v1/query              - Single query
 *   POST /v1/consensus          - Multi-model consensus
 *   GET  /v1/models             - List available models
 *   GET  /v1/status             - System status
 *   GET  /v1/search             - Web search
 *   POST /v1/scrape             - Web page content
 */

// Load environment variables from .env file
import 'dotenv/config';

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import { nanoid } from 'nanoid';
import { MotherBase, MOTHER_BASE_CONFIGS } from '@akhai/inference';
import { WebSearch, WebScraper } from '@akhai/tools';

// ============================================================================
// CONFIGURATION
// ============================================================================

interface ServerConfig {
  port: number;
  host: string;
  apiKeys: string[];
  motherBaseProvider: 'local' | 'together' | 'runpod' | 'custom';
  motherBaseEndpoint?: string;
  motherBaseApiKey?: string;
}

function loadConfig(): ServerConfig {
  return {
    port: parseInt(process.env.AKHAI_API_PORT || '8080'),
    host: process.env.AKHAI_API_HOST || '0.0.0.0',
    apiKeys: (process.env.AKHAI_API_KEYS || '').split(',').filter(Boolean),
    motherBaseProvider: (process.env.AKHAI_PROVIDER as any) || 'local',
    motherBaseEndpoint: process.env.AKHAI_ENDPOINT,
    motherBaseApiKey: process.env.AKHAI_API_KEY,
  };
}

// ============================================================================
// INITIALIZE SERVICES
// ============================================================================

const config = loadConfig();

// Initialize Mother Base
let motherBase: MotherBase;

switch (config.motherBaseProvider) {
  case 'local':
    motherBase = new MotherBase(MOTHER_BASE_CONFIGS.local);
    break;
  case 'together':
    if (!config.motherBaseApiKey) {
      throw new Error('Together AI requires AKHAI_API_KEY');
    }
    motherBase = new MotherBase(MOTHER_BASE_CONFIGS.together(config.motherBaseApiKey));
    break;
  case 'runpod':
    if (!config.motherBaseEndpoint || !config.motherBaseApiKey) {
      throw new Error('RunPod requires AKHAI_ENDPOINT and AKHAI_API_KEY');
    }
    motherBase = new MotherBase(MOTHER_BASE_CONFIGS.runpod(config.motherBaseEndpoint, config.motherBaseApiKey));
    break;
  default:
    motherBase = new MotherBase(MOTHER_BASE_CONFIGS.local);
}

// Initialize tools
const webSearch = new WebSearch();
const webScraper = new WebScraper();

// ============================================================================
// API SERVER
// ============================================================================

const app = new Hono();

// Middleware
app.use('*', cors());
app.use('*', logger());

// Auth middleware (optional - if API keys are configured)
app.use('/v1/*', async (c, next) => {
  if (config.apiKeys.length === 0) {
    return next(); // No auth required
  }

  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing API key' }, 401);
  }

  const apiKey = authHeader.slice(7);
  if (!config.apiKeys.includes(apiKey)) {
    return c.json({ error: 'Invalid API key' }, 401);
  }

  return next();
});

// ============================================================================
// ROUTES
// ============================================================================

/**
 * Health check
 */
app.get('/', (c) => {
  return c.json({
    name: 'AKHAI Mother Base API',
    version: '0.1.0',
    status: 'online',
  });
});

/**
 * OpenAI-compatible chat completions
 */
app.post('/v1/chat/completions', async (c) => {
  try {
    const body = await c.req.json();
    const { messages, stream = false, max_tokens, temperature } = body;

    if (!messages || !Array.isArray(messages)) {
      return c.json({ error: 'messages is required' }, 400);
    }

    const id = `chatcmpl-${nanoid()}`;
    const created = Math.floor(Date.now() / 1000);

    if (stream) {
      // TODO: Implement streaming
      return c.json({ error: 'Streaming not yet implemented' }, 501);
    }

    const response = await motherBase.chat(messages);

    return c.json({
      id,
      object: 'chat.completion',
      created,
      model: response.model,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: response.content,
        },
        finish_reason: 'stop',
      }],
      usage: {
        prompt_tokens: response.usage.inputTokens,
        completion_tokens: response.usage.outputTokens,
        total_tokens: response.usage.totalTokens,
      },
    });
  } catch (error: any) {
    console.error('[API] Chat error:', error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * Simple query endpoint
 */
app.post('/v1/query', async (c) => {
  try {
    const body = await c.req.json();
    const { prompt, use_consensus = false } = body;

    if (!prompt) {
      return c.json({ error: 'prompt is required' }, 400);
    }

    const response = await motherBase.query(prompt, { useConsensus: use_consensus });

    return c.json({
      id: `query-${nanoid()}`,
      prompt,
      response: response.content,
      model: response.model,
      latency: response.latency,
      usage: response.usage,
    });
  } catch (error: any) {
    console.error('[API] Query error:', error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * Multi-model consensus
 */
app.post('/v1/consensus', async (c) => {
  try {
    const body = await c.req.json();
    const { prompt } = body;

    if (!prompt) {
      return c.json({ error: 'prompt is required' }, 400);
    }

    const result = await motherBase.consensusQuery(prompt);

    return c.json({
      id: `consensus-${nanoid()}`,
      prompt,
      answer: result.finalAnswer,
      confidence: result.confidence,
      sources: result.sources.map(s => ({
        model: s.model,
        latency: s.latency,
      })),
      total_latency: result.totalLatency,
    });
  } catch (error: any) {
    console.error('[API] Consensus error:', error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * List available models
 */
app.get('/v1/models', async (c) => {
  const status = await motherBase.getStatus();

  const models = [
    {
      id: status.primary.model,
      object: 'model',
      owned_by: 'akhai',
      permission: [],
    },
    ...status.advisors.map(a => ({
      id: a.model,
      object: 'model',
      owned_by: 'akhai',
      permission: [],
    })),
  ];

  return c.json({
    object: 'list',
    data: models,
  });
});

/**
 * System status
 */
app.get('/v1/status', async (c) => {
  const status = await motherBase.getStatus();

  return c.json({
    initialized: status.initialized,
    primary: {
      name: status.primary.name,
      model: status.primary.model,
      healthy: status.primary.healthy,
    },
    advisors: status.advisors,
    tools: {
      web_search: true,
      web_scraper: true,
    },
  });
});

/**
 * Web search
 */
app.get('/v1/search', async (c) => {
  try {
    const query = c.req.query('q');
    const count = parseInt(c.req.query('count') || '5');

    if (!query) {
      return c.json({ error: 'q parameter is required' }, 400);
    }

    const results = await webSearch.search(query, count);

    return c.json({
      query,
      results: results.results,
      search_time: results.searchTime,
    });
  } catch (error: any) {
    console.error('[API] Search error:', error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * Web page scraping
 */
app.post('/v1/scrape', async (c) => {
  try {
    const body = await c.req.json();
    const { url } = body;

    if (!url) {
      return c.json({ error: 'url is required' }, 400);
    }

    const content = await webScraper.fetch(url);

    return c.json({
      url: content.url,
      title: content.title,
      description: content.description,
      content: content.content,
      links_count: content.links.length,
      images_count: content.images.length,
      fetch_time: content.fetchTime,
    });
  } catch (error: any) {
    console.error('[API] Scrape error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================================================
// START SERVER
// ============================================================================

console.log(`
╔═══════════════════════════════════════════════════════════╗
║  🧠 AKHAI MOTHER BASE API                                 ║
║  Sovereign AI Intelligence Server                         ║
╚═══════════════════════════════════════════════════════════╝
`);

// Initialize Mother Base before starting
motherBase.initialize().then((success) => {
  if (!success) {
    console.error('[API] ⚠️ Mother Base initialization failed - continuing anyway');
  }

  serve({
    fetch: app.fetch,
    port: config.port,
    hostname: config.host,
  });

  console.log(`[API] 🚀 Server running on http://${config.host}:${config.port}`);
  console.log(`[API] 📚 Endpoints:`);
  console.log(`     POST /v1/chat/completions  - OpenAI-compatible chat`);
  console.log(`     POST /v1/query             - Single query`);
  console.log(`     POST /v1/consensus         - Multi-model consensus`);
  console.log(`     GET  /v1/models            - List models`);
  console.log(`     GET  /v1/status            - System status`);
  console.log(`     GET  /v1/search?q=...      - Web search`);
  console.log(`     POST /v1/scrape            - Web page content`);
  console.log('');
});

export default app;
