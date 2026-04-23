import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth';
import { callProvider } from '@/lib/multi-provider-api';
import { appendMessage, getThread, listThreadsForQuery } from '@/lib/db/arboreal-threads';
import { buildBlockChatContext } from '@/lib/arboreal/build-context';
import type { Layer } from '@/lib/layer-metadata';

export const dynamic = 'force-dynamic';

function parseBody(body: unknown) {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  if (!b.query || !b.userQuestion || b.layer === undefined) return null;
  return {
    query: String(b.query),
    queryId: String(b.queryId ?? ''),
    layer: Number(b.layer),
    sectionIndex: Number(b.sectionIndex ?? 0),
    paragraphTitle: b.paragraphTitle ? String(b.paragraphTitle) : null,
    paragraphBody: String(b.paragraphBody ?? ''),
    paragraphSigil: String(b.paragraphSigil ?? ''),
    siblingTitles: Array.isArray(b.siblingTitles) ? (b.siblingTitles as string[]) : [],
    userQuestion: String(b.userQuestion),
  };
}

function resolveUserId(request: NextRequest): string {
  const token = request.cookies.get('session_token')?.value;
  const user = token ? getUserFromSession(token) : null;
  return user?.id || 'anonymous';
}

export async function POST(request: NextRequest) {
  try {
    const userId = resolveUserId(request);
    const parsed = parseBody(await request.json());
    if (!parsed) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existing = getThread(userId, parsed.queryId, parsed.layer);
    const threadHistory = existing?.messages ?? [];

    const ctx = buildBlockChatContext({
      query: parsed.query,
      layer: parsed.layer as Layer,
      paragraph: {
        title: parsed.paragraphTitle,
        body: parsed.paragraphBody,
        color: '',
        sigil: parsed.paragraphSigil,
        layer: parsed.layer as Layer,
        originalIndex: parsed.sectionIndex,
      },
      siblingTitles: parsed.siblingTitles,
      threadHistory,
      userQuestion: parsed.userQuestion,
    });

    const response = await callProvider('anthropic', {
      messages: ctx.messages,
      model: 'claude-sonnet-4-20250514',
      maxTokens: 1024,
      temperature: 0.7,
      systemPrompt: ctx.systemPrompt,
    });

    const now = Date.now();
    appendMessage(userId, parsed.queryId, parsed.layer, parsed.sectionIndex, {
      role: 'user',
      content: parsed.userQuestion,
      timestamp: now,
    });
    appendMessage(userId, parsed.queryId, parsed.layer, parsed.sectionIndex, {
      role: 'assistant',
      content: response.content,
      timestamp: now + 1,
    });

    return NextResponse.json({
      content: response.content,
      usage: response.usage,
      model: response.model,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    console.error('[arboreal-chat] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = resolveUserId(request);
    const { searchParams } = new URL(request.url);
    const queryId = searchParams.get('queryId');
    if (!queryId) return NextResponse.json({ error: 'queryId required' }, { status: 400 });

    if (searchParams.get('listAll')) {
      const threads = listThreadsForQuery(userId, queryId).map((t) => ({
        layer: t.layer,
        messageCount: t.messages.length,
        updatedAt: t.updatedAt,
      }));
      return NextResponse.json({ threads });
    }

    const layer = searchParams.get('layer');
    if (!layer) return NextResponse.json({ error: 'layer required' }, { status: 400 });
    const thread = getThread(userId, queryId, Number(layer));
    return NextResponse.json({ messages: thread?.messages ?? [] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
