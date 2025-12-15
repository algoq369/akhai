type EventCallback = (event: any) => void;

const subscribers = new Map<string, Set<EventCallback>>();

export function emitQueryEvent(queryId: string, event: any) {
  const subs = subscribers.get(queryId);
  if (subs) {
    subs.forEach((cb) => {
      try {
        cb(event);
      } catch (error) {
        console.error('Error in event callback:', error);
      }
    });
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

  // Return unsubscribe function
  return () => {
    const subs = subscribers.get(queryId);
    if (subs) {
      subs.delete(callback);
      // Clean up empty subscriber sets
      if (subs.size === 0) {
        subscribers.delete(queryId);
      }
    }
  };
}

export function clearQuerySubscribers(queryId: string) {
  subscribers.delete(queryId);
}

export function hasSubscribers(queryId: string): boolean {
  const subs = subscribers.get(queryId);
  return subs ? subs.size > 0 : false;
}
