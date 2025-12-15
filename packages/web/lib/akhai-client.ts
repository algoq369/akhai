/**
 * AkhAI Client Wrapper
 *
 * This will be integrated with @akhai/core in the future.
 * For now, it provides the interface for API routes.
 */

export interface QueryRequest {
  query: string;
  flow: 'A' | 'B';
  agentName?: string;
}

export interface QueryResponse {
  queryId: string;
}

export interface StreamEvent {
  type: 'advisor-response' | 'consensus-reached' | 'redactor-synthesis' | 'mother-base-decision' | 'complete' | 'error';
  [key: string]: any;
}

export class AkhAIClient {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  async startQuery(request: QueryRequest): Promise<QueryResponse> {
    const response = await fetch(`${this.baseUrl}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to start query: ${response.statusText}`);
    }

    return response.json();
  }

  connectStream(queryId: string, onEvent: (event: StreamEvent) => void): EventSource {
    const eventSource = new EventSource(`${this.baseUrl}/api/stream/${queryId}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onEvent(data);

        if (data.type === 'complete' || data.type === 'error') {
          eventSource.close();
        }
      } catch (error) {
        console.error('Failed to parse stream event:', error);
      }
    };

    eventSource.onerror = () => {
      onEvent({ type: 'error', message: 'Connection lost' });
      eventSource.close();
    };

    return eventSource;
  }
}

// Singleton instance
export const akhaiClient = new AkhAIClient();
