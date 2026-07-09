/**
 * THOUGHT STREAM SSE ENDPOINT
 *
 * Server-Sent Events endpoint for real-time pipeline metadata.
 * Clients connect with ?queryId= to receive stage-by-stage updates.
 *
 * @module thought-stream/route
 */

import { NextRequest } from 'next/server';
import type { ThoughtEvent } from '@/lib/thought-stream';
import { connections, getBufferedThoughts } from '@/lib/thought-stream';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const queryId = request.nextUrl.searchParams.get('queryId');

  if (!queryId) {
    return new Response('Missing queryId parameter', { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      // Register this controller
      if (!connections.has(queryId)) {
        connections.set(queryId, new Set());
      }
      connections.get(queryId)!.add(controller);

      // Replay any events already emitted before this subscription connected. The query POST and
      // this SSE GET run concurrently, so early stages can precede registration — without replay
      // they are lost to the race (the reported "RECEIVED connected / 1 pipeline stage" symptom).
      const backlog = getBufferedThoughts(queryId);
      for (const ev of backlog) {
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(ev)}\n\n`));
      }

      // Confirm the connection only when there is no real backlog yet, to avoid a redundant
      // 'connected' event once genuine stages exist.
      if (backlog.length === 0) {
        const initEvent: ThoughtEvent = {
          id: `${queryId}-init`,
          queryId,
          stage: 'received',
          timestamp: 0,
          data: 'connected',
        };
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(initEvent)}\n\n`));
      }
    },
    cancel() {
      // Clean up when client disconnects
      const controllers = connections.get(queryId);
      if (controllers) {
        if (controllers.size <= 1) {
          connections.delete(queryId);
        }
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
}
