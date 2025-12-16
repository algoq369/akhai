import { NextRequest } from 'next/server';
import { queries, loadQuery } from '@/lib/query-store';
import { subscribeToQuery, clearQuerySubscribers } from '@/lib/event-emitter';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      let isClosed = false;
      let heartbeatInterval: NodeJS.Timeout | null = null;
      let unsubscribe: (() => void) | null = null;

      const sendEvent = (data: any) => {
        if (isClosed) return;
        try {
          const message = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch (error) {
          console.error('Error sending event:', error);
          cleanup();
        }
      };

      const cleanup = () => {
        if (isClosed) return;
        isClosed = true;

        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
          heartbeatInterval = null;
        }

        if (unsubscribe) {
          unsubscribe();
          unsubscribe = null;
        }

        try {
          controller.close();
        } catch (error) {
          console.error('Error closing controller:', error);
        }
      };

      try {
        // Try to get from memory first, then load from database
        let queryData = queries.get(id) || loadQuery(id);

        if (!queryData) {
          sendEvent({ type: 'error', message: 'Query not found' });
          cleanup();
          return;
        }

        // Send initial status
        sendEvent({
          type: 'init',
          status: queryData.status,
          query: queryData.query,
          flow: queryData.flow,
        });

        // If query is already complete, send all historical events
        if (queryData.status === 'complete' || queryData.status === 'error') {
          // Send all historical events EXCEPT final complete/error events
          // (we'll send our own complete event with the full result at the end)
          for (const event of queryData.events) {
            if (event.type !== 'complete' && event.type !== 'error') {
              sendEvent(event);
            }
          }
          // Send the result with finalAnswer for complete queries
          if (queryData.status === 'complete' && queryData.result) {
            sendEvent({
              type: 'result',
              data: queryData.result
            });
          }
          // Send final complete/error event
          sendEvent({
            type: queryData.status === 'complete' ? 'complete' : 'error',
            data: queryData.error ? { message: queryData.error } : {}
          });
          cleanup();
          return;
        }

        // Subscribe to real-time events for this query
        unsubscribe = subscribeToQuery(id, (event: any) => {
          sendEvent(event);

          // Auto-close on complete or error
          if (event.type === 'complete' || event.type === 'error') {
            setTimeout(() => cleanup(), 100);
          }
        });

        // Heartbeat every 5 seconds to keep connection alive
        heartbeatInterval = setInterval(() => {
          if (!isClosed) {
            sendEvent({ type: 'heartbeat', timestamp: Date.now() });
          }
        }, 5000);

        // Handle client disconnect
        request.signal.addEventListener('abort', () => {
          console.log(`Client disconnected from query ${id}`);
          cleanup();
        });

        // Set a maximum timeout of 10 minutes
        setTimeout(() => {
          if (!isClosed) {
            sendEvent({
              type: 'error',
              message: 'Query processing timeout (10 minutes)',
            });
            cleanup();
          }
        }, 600000);

      } catch (error) {
        console.error('Stream error:', error);
        sendEvent({
          type: 'error',
          message: 'An error occurred during streaming',
        });
        cleanup();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
