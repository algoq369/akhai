/**
 * Web Scraper Tool
 * 
 * Fetches and extracts content from web pages.
 * Provides clean text for AI processing.
 */

import * as cheerio from 'cheerio';

export interface PageContent {
  url: string;
  title: string;
  description?: string;
  content: string;
  links: Array<{ text: string; href: string }>;
  images: Array<{ alt: string; src: string }>;
  fetchTime: number;
}

export interface ScraperConfig {
  userAgent: string;
  timeout: number;
  maxContentLength: number;
  removeSelectors: string[];
}

const DEFAULT_CONFIG: ScraperConfig = {
  userAgent: 'AKHAI-Bot/1.0 (Sovereign AI Research)',
  timeout: 30000,
  maxContentLength: 50000, // ~50KB of text
  removeSelectors: [
    'script', 'style', 'nav', 'header', 'footer',
    'aside', 'iframe', 'noscript', '.ads', '.advertisement',
    '.sidebar', '.menu', '.navigation', '.cookie-notice',
  ],
};

export class WebScraper {
  private config: ScraperConfig;

  constructor(config: Partial<ScraperConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    console.log(`[WebScraper] 🌐 Initialized`);
  }

  /**
   * Fetch and parse a web page
   */
  async fetch(url: string): Promise<PageContent> {
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(url, {
        headers: {
          'User-Agent': this.config.userAgent,
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('text/html')) {
        throw new Error(`Not HTML: ${contentType}`);
      }

      const html = await response.text();
      const content = this.parseHtml(html, url);

      return {
        ...content,
        fetchTime: Date.now() - startTime,
      };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error(`Timeout fetching ${url}`);
      }
      throw error;
    }
  }

  /**
   * Parse HTML and extract content
   */
  private parseHtml(html: string, url: string): Omit<PageContent, 'fetchTime'> {
    const $ = cheerio.load(html);

    // Remove unwanted elements
    this.config.removeSelectors.forEach(selector => {
      $(selector).remove();
    });

    // Get title
    const title = $('title').text().trim() ||
                  $('h1').first().text().trim() ||
                  'Untitled';

    // Get meta description
    const description = $('meta[name="description"]').attr('content') ||
                       $('meta[property="og:description"]').attr('content');

    // Get main content
    let content = '';

    // Try to find main content area
    const mainSelectors = ['main', 'article', '.content', '.post', '#content', '#main'];
    let mainElement = null;

    for (const selector of mainSelectors) {
      const el = $(selector);
      if (el.length > 0) {
        mainElement = el.first();
        break;
      }
    }

    if (mainElement) {
      content = this.extractText(mainElement, $);
    } else {
      // Fall back to body
      content = this.extractText($('body'), $);
    }

    // Truncate if too long
    if (content.length > this.config.maxContentLength) {
      content = content.slice(0, this.config.maxContentLength) + '\n\n[Content truncated...]';
    }

    // Extract links
    const links: Array<{ text: string; href: string }> = [];
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();
      if (href && text && !href.startsWith('#') && !href.startsWith('javascript:')) {
        links.push({
          text: text.slice(0, 100),
          href: this.resolveUrl(href, url),
        });
      }
    });

    // Extract images
    const images: Array<{ alt: string; src: string }> = [];
    $('img[src]').each((_, el) => {
      const src = $(el).attr('src');
      const alt = $(el).attr('alt') || '';
      if (src) {
        images.push({
          alt,
          src: this.resolveUrl(src, url),
        });
      }
    });

    return {
      url,
      title,
      description,
      content,
      links: links.slice(0, 20), // Limit to 20 links
      images: images.slice(0, 10), // Limit to 10 images
    };
  }

  /**
   * Extract clean text from element
   */
  private extractText(element: cheerio.Cheerio<any>, $: cheerio.CheerioAPI): string {
    // Get text content
    let text = element.text();

    // Clean up whitespace
    text = text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();

    // Split into paragraphs for readability
    const paragraphs = element.find('p');
    if (paragraphs.length > 0) {
      text = paragraphs
        .map((_, p) => $(p).text().trim())
        .get()
        .filter(p => p.length > 20) // Filter short paragraphs
        .join('\n\n');
    }

    return text;
  }

  /**
   * Resolve relative URL to absolute
   */
  private resolveUrl(href: string, base: string): string {
    try {
      return new URL(href, base).toString();
    } catch {
      return href;
    }
  }

  /**
   * Format page content for AI context
   */
  formatForContext(page: PageContent): string {
    let output = `Web Page Content:\n`;
    output += `URL: ${page.url}\n`;
    output += `Title: ${page.title}\n`;
    if (page.description) {
      output += `Description: ${page.description}\n`;
    }
    output += `\n--- Content ---\n\n`;
    output += page.content;
    output += `\n\n(Fetched in ${page.fetchTime}ms)`;

    return output;
  }
}
