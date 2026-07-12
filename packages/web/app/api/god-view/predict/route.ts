import { NextRequest } from 'next/server';
import { callProvider } from '@/lib/multi-provider-api';
import { GodViewPredictSchema } from '@/lib/route-schemas';
import { MODELS } from '@/lib/models';
import {
  buildEntityPrompt,
  buildBranchPrompt,
  detectDomain,
  parseJSONResponse,
  type EntityResult,
  type ScenarioBranch,
  type BranchLens,
} from '@/lib/god-view/scenario-engine';
import { requireAuth } from '@/lib/api-guard';

export const dynamic = 'force-dynamic';

function sseEvent(event: string, data: string): string {
  return `event: ${event}\ndata: ${data}\n\n`;
}

function isCreditError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return (
    msg.includes('credit') ||
    msg.includes('balance') ||
    msg.includes('insufficient') ||
    msg.includes('billing')
  );
}

const CREDIT_ERROR_MSG =
  'API credits exhausted. Please check your Anthropic billing at console.anthropic.com.';

export async function POST(request: NextRequest) {
    const guard = requireAuth(request);
    if (guard.error) return guard.error;
  try {
    const parsed = GodViewPredictSchema.safeParse(await request.json());
    if (!parsed.success) {
      // raw Response to match this SSE route's style (it does not import NextResponse)
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: parsed.error.flatten() }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const { seed, question, domain: rawDomain } = parsed.data;

    // omitted domain auto-detects like 'auto' (callers always send one; pre-schema an omitted
    // value reached the prompts as the literal string "undefined")
    const domain = rawDomain === 'auto' || rawDomain === undefined ? detectDomain(seed, question) : rawDomain;
    const startTime = Date.now();

    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: unknown) => {
          controller.enqueue(new TextEncoder().encode(sseEvent(event, JSON.stringify(data))));
        };

        try {
          /* ── Step 1: Entity extraction ─────────────────────── */
          send('status', 'Extracting entities...');

          const entityResponse = await callProvider('anthropic', {
            messages: [
              { role: 'system', content: buildEntityPrompt() },
              { role: 'user', content: seed.slice(0, 5000) },
            ],
            model: MODELS.mid,
            maxTokens: 500,
            temperature: 0.3,
          });

          let entities: EntityResult;
          try {
            entities = parseJSONResponse<EntityResult>(entityResponse.content);
          } catch {
            entities = { entities: [], relationships: [] };
          }

          send('entities', entities);
          let totalCost = entityResponse.cost;

          /* ── Step 2: Build branch prompts ──────────────────── */
          send('status', 'Building scenario branches...');

          const lenses: BranchLens[] = ['optimistic', 'balanced', 'pessimistic'];
          const branchPrompts = lenses.map((lens) =>
            buildBranchPrompt(entities, question, domain, lens)
          );

          /* ── Step 3: Run 3 predictions in parallel ─────────── */
          send('status', 'Running predictions (0/3)...');

          const branchCalls = branchPrompts.map((prompt, i) =>
            callProvider('anthropic', {
              messages: [
                { role: 'system', content: prompt },
                {
                  role: 'user',
                  content: `Seed material: ${seed.slice(0, 3000)}\n\nQuestion: ${question}`,
                },
              ],
              model: MODELS.mid,
              maxTokens: 800,
              temperature: 0.7,
            }).then((res) => ({ res, lens: lenses[i] }))
          );

          const settled = await Promise.allSettled(branchCalls);
          let completedCount = 0;

          for (const result of settled) {
            completedCount++;
            if (result.status === 'fulfilled') {
              const { res, lens } = result.value;
              totalCost += res.cost;
              try {
                const parsed = parseJSONResponse<Omit<ScenarioBranch, 'id'>>(res.content);
                const branch: ScenarioBranch = { id: lens, ...parsed };
                send('branch', branch);
              } catch {
                send('branch', {
                  id: lens,
                  title: `${lens.charAt(0).toUpperCase() + lens.slice(1)} Scenario`,
                  summary: res.content.slice(0, 500),
                  keyEvents: [],
                  confidence: 50,
                  assumptions: ['Could not parse structured response'],
                  risks: ['Response parsing failed'],
                });
              }
            } else {
              send('branch', {
                id: lenses[completedCount - 1],
                title: 'Prediction Failed',
                summary: `Error: ${result.reason}`,
                keyEvents: [],
                confidence: 0,
                assumptions: [],
                risks: ['Provider call failed'],
              });
            }
            send('status', `Running predictions (${completedCount}/3)...`);
          }

          /* ── Step 4: Complete ──────────────────────────────── */
          const totalLatency = Date.now() - startTime;
          send('complete', { totalCost, totalLatency });
        } catch (err) {
          const msg = isCreditError(err)
            ? CREDIT_ERROR_MSG
            : err instanceof Error
              ? err.message
              : 'Unknown error';
          controller.enqueue(
            new TextEncoder().encode(sseEvent('error', JSON.stringify({ error: msg })))
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Predict route error:', error);
    return new Response(JSON.stringify({ error: 'Prediction failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
