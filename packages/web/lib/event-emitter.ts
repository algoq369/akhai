type EventCallback = (event: any) => void;

// globalThis singleton — survives Next.js HMR module reloading
// Without this, simple-query/route.ts and thought-stream/route.ts
// get separate Map instances and events never reach subscribers.
const SUBS_KEY = '__akhai_sse_subscribers__';
const BUF_KEY = '__akhai_sse_event_buffer__';

if (!(globalThis as any)[SUBS_KEY]) {
  (globalThis as any)[SUBS_KEY] = new Map<string, Set<EventCallback>>();
}
if (!(globalThis as any)[BUF_KEY]) {
  (globalThis as any)[BUF_KEY] = new Map<string, any[]>();
}

const subscribers: Map<string, Set<EventCallback>> = (globalThis as any)[SUBS_KEY];
const eventBuffer: Map<string, any[]> = (globalThis as any)[BUF_KEY];

export function emitQueryEvent(queryId: string, event: any) {
  const subs = subscribers.get(queryId);
  const subCount = subs ? subs.size : 0;
  console.log(`[SSE] emit ${event.stage || event.type || '?'} for ${queryId} → ${subCount} subscriber(s)`);

  // Always buffer the event so late-connecting SSE clients can replay
  if (!eventBuffer.has(queryId)) {
    eventBuffer.set(queryId, []);
  }
  eventBuffer.get(queryId)!.push(event);

  // Deliver to live subscribers
  if (subs) {
    subs.forEach((cb) => {
      try {
        cb(event);
      } catch (error) {
        console.error('[SSE] Error in event callback:', error);
      }
    });
  }

  // Auto-clean buffer after 60s to prevent memory leaks
  if (event.stage === 'complete' || event.stage === 'error') {
    setTimeout(() => {
      eventBuffer.delete(queryId);
    }, 60000);
  }
}

export function subscribeToQuery(
  queryId: string,
  callback: EventCallback
): () => void {
  if (!subscribers.has(queryId)) {
    subscribers.set(queryId, new Set());
  }
  subscribers.get(queryId)!.add(callback);
  console.log(`[SSE] subscribe ${queryId} — now ${subscribers.get(queryId)!.size} subscriber(s)`);

  // Return unsubscribe function
  return () => {
    const subs = subscribers.get(queryId);
    if (subs) {
      subs.delete(callback);
      if (subs.size === 0) {
        subscribers.delete(queryId);
      }
    }
  };
}

/**
 * Get and drain buffered events for a queryId.
 * Called by thought-stream SSE route to replay events
 * that fired before the client connected.
 */
export function getBufferedEvents(queryId: string): any[] {
  const events = eventBuffer.get(queryId);
  if (!events || events.length === 0) return [];
  console.log(`[SSE] replay ${events.length} buffered event(s) for ${queryId}`);
  // Return a copy — keep the buffer for potential reconnects
  return [...events];
}

export function clearQuerySubscribers(queryId: string) {
  subscribers.delete(queryId);
}

export function hasSubscribers(queryId: string): boolean {
  const subs = subscribers.get(queryId);
  return subs ? subs.size > 0 : false;
}
