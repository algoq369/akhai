/**
 * WebSearch - Brave Search API Integration
 *
 * Provides live web search capabilities to AkhAI for up-to-date information.
 */

export interface SearchResult {
  title: string;
  url: string;
  description: string;
  published?: string;
}

export class WebSearch {
  private apiKey: string;
  private endpoint = 'https://api.search.brave.com/res/v1/web/search';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Search the web using Brave Search API
   *
   * @param query - Search query
   * @param count - Number of results to return (default: 5)
   * @returns Array of search results
   */
  async search(query: string, count: number = 5): Promise<SearchResult[]> {
    try {
      const response = await fetch(
        `${this.endpoint}?q=${encodeURIComponent(query)}&count=${count}`,
        {
          headers: {
            'X-Subscription-Token': this.apiKey,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Brave Search API error: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as any;

      return (
        data.web?.results?.map((r: any) => ({
          title: r.title,
          url: r.url,
          description: r.description,
          published: r.age,
        })) || []
      );
    } catch (error) {
      console.error('WebSearch error:', error);
      throw error;
    }
  }

  /**
   * Format search results for inclusion in AI context
   *
   * @param results - Array of search results
   * @returns Formatted string for AI consumption
   */
  formatForContext(results: SearchResult[]): string {
    if (results.length === 0) {
      return 'No search results found.';
    }

    return results
      .map(
        (r, i) =>
          `[${i + 1}] ${r.title}\n    URL: ${r.url}\n    ${r.description}${
            r.published ? ` (${r.published})` : ''
          }`
      )
      .join('\n\n');
  }
}
