# Arboreal — Commit 6: Scoped per-block chat UI + API route

Paste into `cc` from `~/akhai`.

---

Arboreal commit 6 — scoped per-block chat with heavy context + DB persistence. STOP on any gate failure.

This is the largest arboreal commit. Creates 3 new files + edits 3 existing ones.

SCOPE GUARD: Only arboreal files + one new API route. No changes to classic/mini-canvas/canvas views. No prompt changes.

CONTEXT:
- Auth: request.cookies.get('session_token')?.value → getUserFromSession(token) from lib/auth
- Provider: callProvider('anthropic', request) from lib/multi-provider-api — returns CompletionResponse { content, usage, model, cost }
- CompletionRequest: { messages, model, maxTokens, temperature, systemPrompt }
- DB: appendMessage, getThread, listThreadsForQuery from lib/db/arboreal-threads
- LAYER_METADATA from lib/layer-metadata — has name, kabbalisticName, aiRole, queryCharacteristics
- ArborealSection from lib/arboreal/bin-sections — has title, body, color, sigil, layer
- ParagraphBlock currently has no chat — onClick toggles expand/collapse
- ArborealView has access to messages[] (full conversation) and the last assistant message

DESIGN DECISIONS (from planning phase):
- Heavy context: query + layer metadata + sibling titles + paragraph body + thread history
- Same methodology as parent query (decision 11a) — use 'anthropic' provider + claude-sonnet-4-20250514 model for block chats (fast + cheap, not opus)
- DB-persisted threads (decision 5)
- Thread stays inside tree, no promote (decision 13)
- Collapsed blocks show ×N badge for thread message count (decision 13a)


══════ STEP 1 — Create build-context.ts ══════

CREATE: packages/web/lib/arboreal/build-context.ts (~50 lines)

Builds the system prompt for per-block chat. Heavy context = query + layer metadata + sibling titles + paragraph body.

```ts
import { Layer, LAYER_METADATA } from '@/lib/layer-metadata';
import type { ArborealSection } from './bin-sections';
import type { ArborealMessage } from '@/lib/db/arboreal-threads';

export interface BlockChatContext {
  systemPrompt: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export function buildBlockChatContext(opts: {
  query: string;
  layer: Layer;
  paragraph: ArborealSection;
  siblingTitles: string[];
  threadHistory: ArborealMessage[];
  userQuestion: string;
}): BlockChatContext {
  const meta = LAYER_METADATA[opts.layer];
  const layerDesc = meta
    ? `${meta.name} (${meta.kabbalisticName}) — ${meta.aiRole}. Characteristics: ${meta.queryCharacteristics?.join(', ') ?? 'general analysis'}.`
    : 'Unknown layer';

  const siblingContext = opts.siblingTitles.length > 0
    ? `Other sections in this response: ${opts.siblingTitles.join('; ')}.`
    : '';

  const systemPrompt = [
    `You are AkhAI, a sovereign AI research engine. You are responding within a scoped paragraph chat.`,
    `The user's original query was: "${opts.query}"`,
    `You are answering from the perspective of the ${layerDesc}`,
    `The paragraph you are discussing:`,
    `"${opts.paragraph.title ? opts.paragraph.sigil + ' ' + opts.paragraph.title + ': ' : ''}${opts.paragraph.body.slice(0, 1500)}"`,
    siblingContext,
    `Keep answers focused on this specific paragraph. Be concise — 2-4 paragraphs max.`,
  ].filter(Boolean).join('\n\n');

  const messages = [
    ...opts.threadHistory.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user' as const, content: opts.userQuestion },
  ];

  return { systemPrompt, messages };
}
```


══════ STEP 2 — Create API route ══════

CREATE: packages/web/app/api/arboreal-chat/route.ts (~90 lines)

Simple POST → JSON (non-streaming). Arboreal block chats are short — no need for SSE complexity.

```ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth';
import { callProvider } from '@/lib/multi-provider-api';
import { appendMessage, getThread } from '@/lib/db/arboreal-threads';
import { buildBlockChatContext } from '@/lib/arboreal/build-context';
import { Layer, LAYER_METADATA } from '@/lib/layer-metadata';
import type { ArborealMessage } from '@/lib/db/arboreal-threads';

export const dynamic = 'force-dynamic';

const RequestSchema = {
  parse(body: any) {
    if (!body?.query || !body?.userQuestion || body?.layer === undefined) {
      return null;
    }
    return {
      query: String(body.query),
      queryId: String(body.queryId || ''),
      layer: Number(body.layer),
      sectionIndex: Number(body.sectionIndex ?? 0),
      paragraphTitle: body.paragraphTitle ? String(body.paragraphTitle) : null,
      paragraphBody: String(body.paragraphBody || ''),
      paragraphSigil: String(body.paragraphSigil || ''),
      siblingTitles: Array.isArray(body.siblingTitles) ? body.siblingTitles : [],
      userQuestion: String(body.userQuestion),
    };
  },
};

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('session_token')?.value;
    const user = token ? getUserFromSession(token) : null;
    const userId = user?.id || 'anonymous';

    const body = await request.json();
    const parsed = RequestSchema.parse(body);
    if (!parsed) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Load existing thread history
    const existingThread = getThread(userId, parsed.queryId, parsed.layer);
    const threadHistory: ArborealMessage[] = existingThread?.messages ?? [];

    // Build heavy context
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

    // Call provider (non-streaming, fast model)
    const response = await callProvider('anthropic', {
      messages: ctx.messages,
      model: 'claude-sonnet-4-20250514',
      maxTokens: 1024,
      temperature: 0.7,
      systemPrompt: ctx.systemPrompt,
    });

    // Persist both user message and assistant reply
    const now = Date.now();
    appendMessage(userId, parsed.queryId, parsed.layer, parsed.sectionIndex, {
      role: 'user', content: parsed.userQuestion, timestamp: now,
    });
    appendMessage(userId, parsed.queryId, parsed.layer, parsed.sectionIndex, {
      role: 'assistant', content: response.content, timestamp: now + 1,
    });

    return NextResponse.json({
      content: response.content,
      usage: response.usage,
      model: response.model,
    });
  } catch (err: any) {
    console.error('[arboreal-chat] Error:', err?.message);
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
  }
}
```


══════ STEP 3 — Create BlockChat.tsx ══════

CREATE: packages/web/components/arboreal/BlockChat.tsx (~130 lines)

Chat UI embedded inside expanded ParagraphBlock. Shows thread history, input, send button, loading state.

```tsx
'use client';

import { useState, useEffect, useRef } from 'react';

interface BlockChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface BlockChatProps {
  queryId: string;
  query: string;
  layer: number;
  sectionIndex: number;
  paragraphTitle: string | null;
  paragraphBody: string;
  paragraphSigil: string;
  siblingTitles: string[];
  color: string;
}

export default function BlockChat({
  queryId, query, layer, sectionIndex,
  paragraphTitle, paragraphBody, paragraphSigil,
  siblingTitles, color,
}: BlockChatProps) {
  const [messages, setMessages] = useState<BlockChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load existing thread on mount
  useEffect(() => {
    if (loaded || !queryId) return;
    setLoaded(true);
    fetch(`/api/arboreal-chat?queryId=${queryId}&layer=${layer}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.messages) setMessages(data.messages);
      })
      .catch(() => {});
  }, [queryId, layer, loaded]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);
    try {
      const res = await fetch('/api/arboreal-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query, queryId, layer, sectionIndex,
          paragraphTitle, paragraphBody, paragraphSigil,
          siblingTitles, userQuestion: userMsg,
        }),
      });
      const data = await res.json();
      if (data.content) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '(error — try again)' }]);
    }
    setLoading(false);
  };
```

```tsx
  return (
    <div
      className="mt-2 pt-2 border-t"
      style={{ borderColor: `${color}33` }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Thread messages */}
      <div ref={scrollRef} className="max-h-40 overflow-y-auto space-y-2 mb-2">
        {messages.length === 0 && !loading && (
          <div className="text-[9px] font-mono text-relic-silver/50 py-1">
            chat about this paragraph — scoped to this layer only
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className="flex gap-2 text-[10px]">
            <span className="font-mono text-relic-silver/50 flex-shrink-0 pt-0.5" style={{ minWidth: 28 }}>
              {msg.role === 'user' ? '→' : '←'}
            </span>
            <span className={msg.role === 'assistant' ? 'text-relic-ghost/80' : 'text-relic-ghost'}>
              {msg.content}
            </span>
          </div>
        ))}
        {loading && (
          <div className="text-[9px] font-mono animate-pulse" style={{ color }}>
            thinking...
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-1.5">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
          placeholder="ask about this..."
          disabled={loading}
          className="flex-1 px-2 py-1 text-[10px] bg-transparent border rounded font-mono text-relic-ghost placeholder:text-relic-silver/30 focus:outline-none"
          style={{ borderColor: `${color}44` }}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="px-2 py-1 text-[9px] font-mono rounded border transition-colors"
          style={{
            borderColor: `${color}44`,
            color: color,
            opacity: loading || !input.trim() ? 0.4 : 1,
          }}
        >
          ↗
        </button>
      </div>
    </div>
  );
}
```


══════ STEP 4 — Wire BlockChat into ParagraphBlock ══════

EDIT: packages/web/components/arboreal/ParagraphBlock.tsx

4A) Add import at top:
  import BlockChat from './BlockChat';

4B) Add new props to ParagraphBlockProps interface:
  queryId: string;
  query: string;
  siblingTitles: string[];

Add these to the destructured props list too.

4C) Inside the expanded body section (the div with className="px-3 py-2 space-y-3"), AFTER the sections.map loop, add the BlockChat component:

          <BlockChat
            queryId={queryId}
            query={query}
            layer={primary.layer}
            sectionIndex={primary.originalIndex}
            paragraphTitle={primary.title}
            paragraphBody={primary.body}
            paragraphSigil={primary.sigil}
            siblingTitles={siblingTitles}
            color={primary.color}
          />

4D) Add a ×N badge on the COLLAPSED state to show thread message count. Add a new prop:
  threadMessageCount?: number;

In the header strip, next to the +N additional sections badge, add:
  {!expanded && threadMessageCount && threadMessageCount > 0 && (
    <span className="text-[8px] font-mono opacity-60" style={{ color: primary.color }}>
      ×{threadMessageCount}
    </span>
  )}

══════ STEP 5 — Wire queryId + query + siblingTitles into ParagraphTree ══════

EDIT: packages/web/components/arboreal/ParagraphTree.tsx

5A) Add new props to ParagraphTreeProps:
  queryId: string;
  query: string;

5B) Compute siblingTitles from bins (all section titles across all layers):
  const siblingTitles = useMemo(() => {
    const titles: string[] = [];
    bins.forEach((sections) => {
      sections.forEach((s) => { if (s.title) titles.push(s.title); });
    });
    return titles;
  }, [bins]);

5C) Load thread message counts for badge display:
  const [threadCounts, setThreadCounts] = useState<Record<number, number>>({});

  useEffect(() => {
    if (!queryId) return;
    fetch(`/api/arboreal-chat?queryId=${queryId}&listAll=true`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.threads) {
          const counts: Record<number, number> = {};
          data.threads.forEach((t: any) => { counts[t.layer] = t.messageCount; });
          setThreadCounts(counts);
        }
      })
      .catch(() => {});
  }, [queryId]);

5D) Pass new props to ParagraphBlock:
  queryId={queryId}
  query={query}
  siblingTitles={siblingTitles}
  threadMessageCount={threadCounts[layer] ?? 0}


══════ STEP 6 — Wire queryId + query into ArborealView ══════

EDIT: packages/web/components/arboreal/ArborealView.tsx

6A) Extract queryId from the last user message. The messages array contains user + assistant messages. We need the query ID which may be embedded in the message metadata or we can derive it from the conversation. The simplest approach: pass a queryId prop from the parent.

Add to ArborealViewProps:
  queryId?: string;

6B) Pass to ParagraphTree:
  <ParagraphTree
    sections={sections}
    queryId={queryId ?? ''}
    query={lastUser?.content ?? ''}
  />

6C) In app/page.tsx where ArborealView is rendered, pass queryId. Find the ArborealView render and add:
  queryId={s.currentConversationId ?? s.messages[0]?.id ?? ''}

Check what identifier is available. If currentConversationId is a prop on the state (s), use it. Otherwise use a derived value. grep for 'currentConversationId' or 'queryId' in the useHomePageState hook to find the right prop.

══════ STEP 7 — Add GET handler to API route for loading threads ══════

EDIT: packages/web/app/api/arboreal-chat/route.ts

Add a GET handler that:
- If ?queryId=X&layer=Y → returns the specific thread's messages
- If ?queryId=X&listAll=true → returns all threads for that query with message counts

```ts
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('session_token')?.value;
    const user = token ? getUserFromSession(token) : null;
    const userId = user?.id || 'anonymous';

    const { searchParams } = new URL(request.url);
    const queryId = searchParams.get('queryId');
    if (!queryId) return NextResponse.json({ error: 'queryId required' }, { status: 400 });

    if (searchParams.get('listAll')) {
      const threads = listThreadsForQuery(userId, queryId);
      return NextResponse.json({
        threads: threads.map(t => ({
          layer: t.layer,
          messageCount: t.messages.length,
          updatedAt: t.updatedAt,
        })),
      });
    }

    const layer = searchParams.get('layer');
    if (!layer) return NextResponse.json({ error: 'layer required' }, { status: 400 });
    const thread = getThread(userId, queryId, Number(layer));
    return NextResponse.json({
      messages: thread?.messages ?? [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
```


══════ GATES ══════

1. npx tsc --noEmit → exit 0
   Watch for: missing imports, prop type mismatches between ParagraphTree → ParagraphBlock → BlockChat chain.

2. npm run predev && npx vitest run --reporter=dot → 69+ passing (was 69 after commit 5)

3. Dev restart:
   lsof -ti:3000 | xargs kill -9 || true; sleep 3
   cd packages/web && rm -rf .next .turbo
   npm run predev
   nohup bash -c 'set -a && source .env.local && set +a && SKIP_ENV_VALIDATION=1 npx next dev --turbopack -p 3000' > /tmp/akhai-dev.log 2>&1 &
   sleep 14
   curl -sI http://localhost:3000 | head -1
   Expected: 200

4. API route smoke test:
   curl -s http://localhost:3000/api/arboreal-chat?queryId=test&listAll=true | head -c 200
   Expected: JSON response (may be empty threads array, NOT 500)

5. File sizes:
   wc -l lib/arboreal/build-context.ts app/api/arboreal-chat/route.ts components/arboreal/BlockChat.tsx
   build-context ≤ 60
   route ≤ 120
   BlockChat ≤ 140
   ParagraphBlock ≤ 160 (was 125, adding ~30 lines of props + BlockChat embed)
   ParagraphTree ≤ 175 (was 150, adding ~25 lines of queryId/siblingTitles/threadCounts)

6. Dev log: tail -20 /tmp/akhai-dev.log | grep -iE 'error' | head
   Expected: empty

══════ COMMIT ══════

  git add packages/web/lib/arboreal/build-context.ts \
          packages/web/app/api/arboreal-chat/route.ts \
          packages/web/components/arboreal/BlockChat.tsx \
          packages/web/components/arboreal/ParagraphBlock.tsx \
          packages/web/components/arboreal/ParagraphTree.tsx \
          packages/web/components/arboreal/ArborealView.tsx \
          packages/web/app/page.tsx

  git commit -m "feat(arboreal): scoped per-block chat with heavy context + DB persistence

3 new files:
- lib/arboreal/build-context.ts: builds heavy system prompt from query +
  layer metadata + sibling titles + paragraph body + thread history
- app/api/arboreal-chat/route.ts: POST (send message, get reply, persist)
  + GET (load thread or list all threads for badge counts). Uses
  claude-sonnet-4 for fast/cheap scoped replies.
- components/arboreal/BlockChat.tsx: chat UI embedded inside expanded
  blocks — thread history, input, send button, loading state

3 edited files:
- ParagraphBlock: embeds BlockChat when expanded, shows xN badge when
  collapsed to indicate existing thread messages
- ParagraphTree: passes queryId, query, siblingTitles, threadCounts
  down to blocks. Loads thread counts on mount for badge display.
- ArborealView: accepts queryId prop, passes to ParagraphTree

Each block is an independent chat scoped to its paragraph. Claude receives
heavy context (query + layer identity + paragraph + siblings) but NOT the
full response — keeps tokens tight (~930 input per turn).

Threads persist in arboreal_threads table (commit 5). Come back next week,
your thread is still there inside that block."

══════ REPORT BACK ══════

- Commit hash
- tsc exit code
- vitest X/Y passing
- File sizes for 3 new files + 2 edited files
- API smoke test result (GET listAll)
- Any deviations from spec
- Browser verification for user:
  1. Open arboreal view, expand a block with content
  2. See chat input at the bottom of the expanded block
  3. Type a question and hit send/enter
  4. See "thinking..." loading state, then assistant reply appears
  5. Collapse the block → see xN badge indicating thread exists
  6. Re-expand → thread history is still there (loaded from DB)

No push, no deploy, local only. Stop at commit 6.
