/**
 * Quick Query API - Lightweight endpoint for QuickChat mini-assistant
 * Enhanced with user context and conversation history access
 * Uses Direct methodology only, max 500 tokens for fast responses
 */

import { NextRequest, NextResponse } from 'next/server';
import { MODELS } from '@/lib/models';
import { z } from 'zod';
import { callProvider, type CompletionRequest } from '@/lib/multi-provider-api';
import { recordCall } from '@/lib/cogs-scorecard';
import { getRecentQueries } from '@/lib/database';
import { getUserFromSession } from '@/lib/auth';
import { requireAuth } from '@/lib/api-guard';

const QuickQuerySchema = z.object({
  query: z.string().min(1).max(10000),
  userContext: z
    .object({
      username: z.string().optional(),
      email: z.string().optional(),
      userId: z.string().optional(),
    })
    .optional(),
});

export const dynamic = 'force-dynamic';

// Alt free models for when primary OpenRouter model is rate-limited
const ALT_FREE_MODELS = [
  'stepfun/step-3.5-flash:free',
  'nvidia/nemotron-3-nano-30b-a3b:free',
  'openai/gpt-oss-20b:free',
];
async function callOpenRouterAlt(request: CompletionRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('No OpenRouter key');
  for (const model of ALT_FREE_MODELS) {
    try {
      const startedAt = Date.now();
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://akhai.app',
          'X-Title': 'AkhAI',
        },
        body: JSON.stringify({
          model,
          messages: request.messages.map((m) => ({ role: m.role, content: m.content })),
          max_tokens: request.maxTokens || 500,
          temperature: request.temperature ?? 0.7,
        }),
        // Free models can hang — abort per attempt so the loop moves to the next model
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) continue; // Try next model
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        const durationMs = Date.now() - startedAt;
        const u = data.usage || {};
        const inTok = u.prompt_tokens || 0;
        const outTok = u.completion_tokens || 0;
        // cost 0 is honest (free models) — the row exists so this path shows up in COGS
        recordCall({
          queryId: 'quick-query',
          purpose: 'quick-query [ALT FALLBACK]',
          model,
          inTok,
          cacheRead: 0,
          cacheCreation: 0,
          outTok,
          durationMs,
          costUSD: 0,
          outcome: 'ok',
          objectiveMet: true,
        });
        return {
          content,
          provider: 'openrouter',
          model,
          usage: { inputTokens: inTok, outputTokens: outTok, totalTokens: inTok + outTok },
          cost: 0,
          latencyMs: durationMs,
        };
      }
    } catch {
      continue;
    }
  }
  throw new Error('All alt models failed');
}

export async function POST(request: NextRequest) {
    const guard = requireAuth(request);
    if (guard.error) return guard.error;
  try {
    const parsed = QuickQuerySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.format() },
        { status: 400 }
      );
    }
    const { query, userContext } = parsed.data;

    // history is session-scoped — body userId was an IDOR (E4.2b): it read other users'
    // recent queries into the prompt. userContext.username stays (harmless display string).
    const token = request.cookies.get('session_token')?.value;
    const sessionUser = token ? getUserFromSession(token) : null;
    const sessionUserId = sessionUser?.id ?? null;

    // Build context-aware system prompt
    let systemPrompt =
      'You are AkhAI Quick Chat assistant. Provide concise, helpful answers. Keep responses brief (2-3 paragraphs max).';

    // Add user profile context (username only — email is PII and this prompt
    // can reach 3rd-party free models on the fallback path)
    if (userContext?.username) {
      systemPrompt += `\n\nUser Profile:\n- Username: ${userContext.username}`;
    }

    // Fetch recent conversation history from main chat
    let conversationContext = '';
    if (sessionUserId) {
      try {
        // Get last 3 conversations from history
        const recentQueries = getRecentQueries(3, sessionUserId);

        if (recentQueries && recentQueries.length > 0) {
          conversationContext = '\n\nRecent Conversation History (last 3 exchanges):\n';
          // `result` holds JSON.stringify({ finalAnswer }) (see updateQuery writers) — parse
          // defensively; legacy/error rows fall back to 'No response'.
          recentQueries.reverse().forEach((q: { query: string; flow: string; result?: string | null }, i: number) => {
            let answer = '';
            try {
              answer = q.result ? JSON.parse(q.result).finalAnswer || '' : '';
            } catch {
              answer = '';
            }
            const responsePreview = answer ? answer.substring(0, 300) : 'No response';
            conversationContext += `\n[${i + 1}] User: ${q.query}\nAkhAI (${q.flow}): ${responsePreview}...\n`;
          });
          systemPrompt += conversationContext;
          systemPrompt +=
            '\n\nYou have access to the user\'s recent main chat conversations above. Reference them when the user asks about "my last conversation" or similar queries. Provide continuity and personalized responses.';
        }
      } catch (error) {
        console.error('[QuickQuery] Failed to fetch conversation history:', error);
      }
    }

    // Call provider with automatic OpenRouter fallback
    const providerRequest = {
      messages: [
        {
          role: 'system' as const,
          content: systemPrompt,
        },
        {
          role: 'user' as const,
          content: query,
        },
      ],
      // Budget model (Haiku): quick-query is the direct-only, 500-token fast path —
      // the clearest cost-cascade candidate (cheaper AND faster than premium). Do not raise to premium.
      model: MODELS.budget,
      maxTokens: 500,
      temperature: 0.7,
    };

    let response;
    try {
      response = await callProvider('anthropic', providerRequest);
    } catch (err) {
      // Credit/quota signals only — a genuine 400 (malformed request) must throw, not reroute
      if (
        (err as Error).message?.includes('credit balance') ||
        (err as Error).message?.includes('402')
      ) {
        console.log('[QuickQuery] Anthropic credits depleted, trying OpenRouter');
        try {
          response = await callProvider('openrouter', providerRequest);
        } catch (orErr) {
          if (
            (orErr as Error).message?.includes('429') ||
            (orErr as Error).message?.includes('rate limit')
          ) {
            console.log('[QuickQuery] OpenRouter rate limited, trying alt model');
            try {
              response = await callOpenRouterAlt(providerRequest);
            } catch {
              // All providers exhausted — return graceful message
              return NextResponse.json({
                content: 'AI analysis temporarily unavailable. Please try again in a few minutes.',
                methodology: 'direct',
                tokens: 0,
                cost: 0,
                latencyMs: 0,
              });
            }
          } else {
            throw orErr;
          }
        }
      } else {
        throw err;
      }
    }

    return NextResponse.json({
      content: response.content,
      methodology: 'direct',
      tokens: response.usage.totalTokens,
      cost: response.cost,
      latencyMs: response.latencyMs,
    });
  } catch (error) {
    console.error('[QuickQuery] Error:', error);
    return NextResponse.json(
      {
        error: (error as Error).message || 'An error occurred',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
      },
      { status: 500 }
    );
  }
}
