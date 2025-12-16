/**
 * Conversation Memory
 * 
 * Maintains context across multiple queries for coherent conversations.
 * Implements sliding window and summarization strategies to manage token limits.
 */

import type { ModelFamily } from '../models/types.js';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: {
    methodology?: string;
    quality?: number;
    tokens?: number;
  };
}

export interface MemoryConfig {
  maxMessages: number;       // Max messages to keep (default: 20)
  maxTokens: number;         // Max tokens for context (default: 8000)
  summarizeThreshold: number; // When to summarize old messages (default: 15)
}

export interface ConversationSummary {
  topics: string[];
  keyDecisions: string[];
  userPreferences: string[];
  lastUpdated: number;
}

const DEFAULT_CONFIG: MemoryConfig = {
  maxMessages: 20,
  maxTokens: 8000,
  summarizeThreshold: 15,
};

/**
 * Rough token estimation (4 chars ≈ 1 token)
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export class ConversationMemory {
  private messages: Message[] = [];
  private summary: ConversationSummary | null = null;
  private config: MemoryConfig;
  private conversationId: string;

  constructor(config: Partial<MemoryConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.conversationId = this.generateId();
    console.log(`[Memory] 🧠 Initialized conversation: ${this.conversationId}`);
  }

  /**
   * Add a message to memory
   */
  addMessage(role: 'user' | 'assistant', content: string, metadata?: Message['metadata']): void {
    const message: Message = {
      role,
      content,
      timestamp: Date.now(),
      metadata: {
        ...metadata,
        tokens: estimateTokens(content),
      },
    };

    this.messages.push(message);
    console.log(`[Memory] Added ${role} message (${message.metadata?.tokens} tokens)`);

    // Check if we need to compress
    if (this.messages.length > this.config.maxMessages) {
      this.compress();
    }
  }

  /**
   * Get conversation context for AI
   * Returns messages optimized for context window
   */
  getContext(maxTokens?: number): Message[] {
    const limit = maxTokens || this.config.maxTokens;
    const result: Message[] = [];
    let totalTokens = 0;

    // Add summary first if exists
    if (this.summary) {
      const summaryText = this.formatSummary();
      const summaryTokens = estimateTokens(summaryText);
      
      if (summaryTokens < limit * 0.3) { // Summary shouldn't exceed 30% of context
        result.push({
          role: 'system',
          content: `Previous conversation summary:\n${summaryText}`,
          timestamp: this.summary.lastUpdated,
        });
        totalTokens += summaryTokens;
      }
    }

    // Add recent messages (newest first priority)
    const recentMessages = [...this.messages].reverse();
    
    for (const message of recentMessages) {
      const msgTokens = message.metadata?.tokens || estimateTokens(message.content);
      
      if (totalTokens + msgTokens > limit) {
        break;
      }
      
      result.unshift(message); // Add to front to maintain order
      totalTokens += msgTokens;
    }

    console.log(`[Memory] Returning ${result.length} messages (${totalTokens} tokens)`);
    return result;
  }

  /**
   * Get just the last N messages
   */
  getRecentMessages(count: number = 5): Message[] {
    return this.messages.slice(-count);
  }

  /**
   * Get full conversation history
   */
  getFullHistory(): Message[] {
    return [...this.messages];
  }

  /**
   * Compress old messages into summary
   */
  private compress(): void {
    console.log(`[Memory] 📦 Compressing ${this.messages.length} messages...`);

    // Keep recent messages, summarize old ones
    const keepCount = Math.floor(this.config.maxMessages / 2);
    const toSummarize = this.messages.slice(0, -keepCount);
    const toKeep = this.messages.slice(-keepCount);

    // Extract key information from old messages
    const topics = new Set<string>();
    const decisions: string[] = [];
    const preferences: string[] = [];

    for (const msg of toSummarize) {
      // Extract topics (simple keyword extraction)
      const words = msg.content.toLowerCase().split(/\s+/);
      const significantWords = words.filter(w => w.length > 5);
      significantWords.slice(0, 3).forEach(w => topics.add(w));

      // Look for decisions
      if (msg.role === 'assistant' && (
        msg.content.includes('recommend') ||
        msg.content.includes('should') ||
        msg.content.includes('best approach')
      )) {
        const firstSentence = msg.content.split('.')[0];
        if (firstSentence.length < 200) {
          decisions.push(firstSentence);
        }
      }

      // Look for user preferences
      if (msg.role === 'user' && (
        msg.content.includes('prefer') ||
        msg.content.includes('want') ||
        msg.content.includes('like')
      )) {
        const firstSentence = msg.content.split('.')[0];
        if (firstSentence.length < 100) {
          preferences.push(firstSentence);
        }
      }
    }

    // Update summary
    this.summary = {
      topics: Array.from(topics).slice(0, 10),
      keyDecisions: decisions.slice(-5),
      userPreferences: preferences.slice(-3),
      lastUpdated: Date.now(),
    };

    // Replace messages with kept ones
    this.messages = toKeep;

    console.log(`[Memory] Compressed to ${this.messages.length} messages + summary`);
  }

  /**
   * Format summary for AI context
   */
  private formatSummary(): string {
    if (!this.summary) return '';

    const parts: string[] = [];

    if (this.summary.topics.length > 0) {
      parts.push(`Topics discussed: ${this.summary.topics.join(', ')}`);
    }

    if (this.summary.keyDecisions.length > 0) {
      parts.push(`Key decisions:\n${this.summary.keyDecisions.map(d => `- ${d}`).join('\n')}`);
    }

    if (this.summary.userPreferences.length > 0) {
      parts.push(`User preferences:\n${this.summary.userPreferences.map(p => `- ${p}`).join('\n')}`);
    }

    return parts.join('\n\n');
  }

  /**
   * Clear all memory
   */
  clear(): void {
    this.messages = [];
    this.summary = null;
    this.conversationId = this.generateId();
    console.log(`[Memory] 🗑️ Cleared. New conversation: ${this.conversationId}`);
  }

  /**
   * Get memory stats
   */
  getStats(): {
    messageCount: number;
    totalTokens: number;
    hasSummary: boolean;
    conversationId: string;
  } {
    const totalTokens = this.messages.reduce(
      (sum, msg) => sum + (msg.metadata?.tokens || estimateTokens(msg.content)),
      0
    );

    return {
      messageCount: this.messages.length,
      totalTokens,
      hasSummary: this.summary !== null,
      conversationId: this.conversationId,
    };
  }

  /**
   * Generate unique conversation ID
   */
  private generateId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Export conversation for persistence
   */
  export(): { messages: Message[]; summary: ConversationSummary | null; id: string } {
    return {
      messages: [...this.messages],
      summary: this.summary ? { ...this.summary } : null,
      id: this.conversationId,
    };
  }

  /**
   * Import conversation from persistence
   */
  import(data: { messages: Message[]; summary: ConversationSummary | null; id: string }): void {
    this.messages = [...data.messages];
    this.summary = data.summary ? { ...data.summary } : null;
    this.conversationId = data.id;
    console.log(`[Memory] 📥 Imported conversation: ${this.conversationId}`);
  }
}
