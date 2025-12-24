/**
 * Web Search Tool
 * 
 * Provides internet search capabilities for AKHAI Mother Base.
 * Supports multiple search backends: Brave, SearX, DuckDuckGo.
 */

export interface SearchResult {
  title: string;
  url: string;
  description: string;
  publishedDate?: string;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  totalResults?: number;
  searchTime: number;
}

export interface WebSearchConfig {
  provider: 'brave' | 'searx' | 'duckduckgo';
  apiKey?: string;
  endpoint?: string;
  maxResults: number;
}

const DEFAULT_CONFIG: WebSearchConfig = {
  provider: 'brave',
  maxResults: 5,
};

export class WebSearch {
  private config: WebSearchConfig;

  constructor(config: Partial<WebSearchConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    if (this.config.provider === 'brave' && !this.config.apiKey) {
      this.config.apiKey = process.env.BRAVE_API_KEY;
    }

    console.log(`[WebSearch] 🔍 Initialized with ${this.config.provider}`);
  }

  /**
   * Search the web
   */
  async search(query: string, maxResults?: number): Promise<SearchResponse> {
    const startTime = Date.now();
    const count = maxResults || this.config.maxResults;

    let results: SearchResult[];

    switch (this.config.provider) {
      case 'brave':
        results = await this.searchBrave(query, count);
        break;
      case 'searx':
        results = await this.searchSearX(query, count);
        break;
      case 'duckduckgo':
        results = await this.searchDuckDuckGo(query, count);
        break;
      default:
        throw new Error(`Unknown search provider: ${this.config.provider}`);
    }

    return {
      query,
      results,
      searchTime: Date.now() - startTime,
    };
  }

  /**
   * Brave Search API
   */
  private async searchBrave(query: string, count: number): Promise<SearchResult[]> {
    if (!this.config.apiKey) {
      throw new Error('Brave Search requires API key (set BRAVE_API_KEY)');
    }

    const url = new URL('https://api.search.brave.com/res/v1/web/search');
    url.searchParams.set('q', query);
    url.searchParams.set('count', count.toString());

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': this.config.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Brave search failed: ${response.status}`);
    }

    const data = await response.json() as any;

    return (data.web?.results || []).map((r: any) => ({
      title: r.title,
      url: r.url,
      description: r.description,
      publishedDate: r.age,
    }));
  }

  /**
   * SearXNG (self-hosted) Search
   */
  private async searchSearX(query: string, count: number): Promise<SearchResult[]> {
    const endpoint = this.config.endpoint || 'https://searx.be';

    const url = new URL(`${endpoint}/search`);
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('pageno', '1');

    const response = await fetch(url.toString(), {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`SearX search failed: ${response.status}`);
    }

    const data = await response.json() as any;

    return (data.results || []).slice(0, count).map((r: any) => ({
      title: r.title,
      url: r.url,
      description: r.content,
      publishedDate: r.publishedDate,
    }));
  }

  /**
   * DuckDuckGo Instant Answer API (limited)
   */
  private async searchDuckDuckGo(query: string, count: number): Promise<SearchResult[]> {
    const url = new URL('https://api.duckduckgo.com/');
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('no_html', '1');

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`DuckDuckGo search failed: ${response.status}`);
    }

    const data = await response.json() as any;
    const results: SearchResult[] = [];

    // Abstract (main answer)
    if (data.Abstract) {
      results.push({
        title: data.Heading || query,
        url: data.AbstractURL || '',
        description: data.Abstract,
      });
    }

    // Related topics
    if (data.RelatedTopics) {
      for (const topic of data.RelatedTopics.slice(0, count - 1)) {
        if (topic.Text && topic.FirstURL) {
          results.push({
            title: topic.Text.split(' - ')[0] || topic.Text,
            url: topic.FirstURL,
            description: topic.Text,
          });
        }
      }
    }

    return results.slice(0, count);
  }

  /**
   * Format results for AI context
   */
  formatForContext(response: SearchResponse): string {
    if (response.results.length === 0) {
      return `No search results found for: "${response.query}"`;
    }

    let output = `Web Search Results for "${response.query}":\n\n`;

    response.results.forEach((result, i) => {
      output += `[${i + 1}] ${result.title}\n`;
      output += `    URL: ${result.url}\n`;
      output += `    ${result.description}\n`;
      if (result.publishedDate) {
        output += `    Published: ${result.publishedDate}\n`;
      }
      output += '\n';
    });

    output += `(${response.results.length} results in ${response.searchTime}ms)`;

    return output;
  }
}
