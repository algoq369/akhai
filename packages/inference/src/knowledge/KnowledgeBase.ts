/**
 * AKHAI Knowledge Base
 * 
 * Ingests and indexes all knowledge from GitHub repositories.
 * This is the foundational memory of Mother Base.
 */

export interface Document {
  id: string;
  content: string;
  metadata: {
    source: string;
    path: string;
    type: 'code' | 'docs' | 'config' | 'data';
    language?: string;
    repo: string;
    branch: string;
    lastUpdated: string;
  };
  embedding?: number[];
}

export interface KnowledgeStats {
  totalDocuments: number;
  totalTokens: number;
  repos: string[];
  lastIngested: string;
  byType: Record<string, number>;
}

export interface SearchResult {
  document: Document;
  score: number;
  snippet: string;
}

/**
 * GitHub Repository Ingester
 */
export class GitHubIngester {
  private token: string;
  private baseUrl = 'https://api.github.com';

  constructor(token?: string) {
    this.token = token || process.env.GITHUB_TOKEN || '';
    if (!this.token) {
      console.warn('[Knowledge] ⚠️ No GitHub token - rate limits apply');
    }
  }

  async listRepos(owner: string): Promise<string[]> {
    const repos: string[] = [];
    let page = 1;

    while (true) {
      const response = await this.fetch(`/users/${owner}/repos?per_page=100&page=${page}`);
      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) break;
      repos.push(...data.map((r: any) => r.name));
      page++;
    }

    console.log(`[Knowledge] 📚 Found ${repos.length} repos for ${owner}`);
    return repos;
  }

  async getRepoTree(owner: string, repo: string, branch = 'main'): Promise<Array<{ path: string; type: string; sha: string }>> {
    try {
      const response = await this.fetch(`/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`);
      const data = await response.json();
      if (!data.tree) {
        const masterResponse = await this.fetch(`/repos/${owner}/${repo}/git/trees/master?recursive=1`);
        const masterData = await masterResponse.json();
        return masterData.tree || [];
      }
      return data.tree;
    } catch (error) {
      console.error(`[Knowledge] ❌ Failed to get tree for ${owner}/${repo}:`, error);
      return [];
    }
  }

  async getFileContent(owner: string, repo: string, path: string): Promise<string | null> {
    try {
      const response = await this.fetch(`/repos/${owner}/${repo}/contents/${path}`);
      const data = await response.json();
      if (data.content) {
        return Buffer.from(data.content, 'base64').toString('utf-8');
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  async ingestRepo(owner: string, repo: string, branch = 'main'): Promise<Document[]> {
    console.log(`[Knowledge] 🔄 Ingesting ${owner}/${repo}...`);
    const tree = await this.getRepoTree(owner, repo, branch);
    const documents: Document[] = [];

    const relevantExtensions = [
      '.md', '.txt', '.ts', '.tsx', '.js', '.jsx',
      '.py', '.json', '.yaml', '.yml', '.toml',
      '.sh', '.bash', '.sql', '.prisma',
      '.css', '.scss', '.html', '.vue', '.svelte'
    ];

    const relevantFiles = tree.filter(item => {
      if (item.type !== 'blob') return false;
      const ext = '.' + item.path.split('.').pop()?.toLowerCase();
      return relevantExtensions.includes(ext);
    });

    console.log(`[Knowledge] 📄 Processing ${relevantFiles.length} files...`);

    const batchSize = 10;
    for (let i = 0; i < relevantFiles.length; i += batchSize) {
      const batch = relevantFiles.slice(i, i + batchSize);

      const batchResults = await Promise.all(
        batch.map(async (file) => {
          const content = await this.getFileContent(owner, repo, file.path);
          if (!content) return null;

          const ext = file.path.split('.').pop()?.toLowerCase() || '';
          return {
            id: `${owner}/${repo}/${file.path}`,
            content,
            metadata: {
              source: `github:${owner}/${repo}`,
              path: file.path,
              type: this.getFileType(ext),
              language: this.getLanguage(ext),
              repo: `${owner}/${repo}`,
              branch,
              lastUpdated: new Date().toISOString(),
            },
          } as Document;
        })
      );

      documents.push(...batchResults.filter((d): d is Document => d !== null));
      console.log(`[Knowledge] ✅ ${Math.min(i + batchSize, relevantFiles.length)}/${relevantFiles.length}`);
      if (i + batchSize < relevantFiles.length) await new Promise(r => setTimeout(r, 100));
    }

    console.log(`[Knowledge] ✅ Ingested ${documents.length} documents from ${owner}/${repo}`);
    return documents;
  }

  async ingestAllRepos(owner: string): Promise<Document[]> {
    const repos = await this.listRepos(owner);
    const allDocuments: Document[] = [];

    for (const repo of repos) {
      try {
        const docs = await this.ingestRepo(owner, repo);
        allDocuments.push(...docs);
      } catch (error) {
        console.error(`[Knowledge] ❌ Failed ${repo}:`, error);
      }
    }

    console.log(`[Knowledge] 🎉 Total: ${allDocuments.length} docs from ${repos.length} repos`);
    return allDocuments;
  }

  private async fetch(path: string): Promise<Response> {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'AKHAI-MotherBase',
    };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    return fetch(`${this.baseUrl}${path}`, { headers });
  }

  private getFileType(ext: string): 'code' | 'docs' | 'config' | 'data' {
    if (['md', 'txt', 'rst'].includes(ext)) return 'docs';
    if (['json', 'yaml', 'yml', 'toml', 'env'].includes(ext)) return 'config';
    if (['csv', 'sql', 'prisma'].includes(ext)) return 'data';
    return 'code';
  }

  private getLanguage(ext: string): string {
    const langMap: Record<string, string> = {
      'ts': 'typescript', 'tsx': 'typescript', 'js': 'javascript', 'jsx': 'javascript',
      'py': 'python', 'md': 'markdown', 'json': 'json', 'yaml': 'yaml', 'yml': 'yaml',
      'sh': 'bash', 'bash': 'bash', 'sql': 'sql', 'css': 'css', 'scss': 'scss',
      'html': 'html', 'vue': 'vue', 'svelte': 'svelte',
    };
    return langMap[ext] || ext;
  }
}

/**
 * In-Memory Vector Store
 */
export class MemoryVectorStore {
  private documents: Document[] = [];

  async addDocuments(docs: Document[]): Promise<void> {
    this.documents.push(...docs);
    console.log(`[VectorStore] 📥 Added ${docs.length} (total: ${this.documents.length})`);
  }

  async search(query: string, limit = 5): Promise<SearchResult[]> {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(w => w.length >= 3);

    const scored = this.documents.map(doc => {
      let score = 0;
      const contentLower = doc.content.toLowerCase();
      const pathLower = doc.metadata.path.toLowerCase();

      for (const word of queryWords) {
        if (pathLower.includes(word)) score += 10;
        const matches = (contentLower.match(new RegExp(word, 'g')) || []).length;
        score += Math.min(matches, 10);
      }
      if (doc.metadata.type === 'docs') score *= 1.5;
      return { document: doc, score };
    });

    return scored
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(r => ({
        document: r.document,
        score: r.score,
        snippet: this.extractSnippet(r.document.content, queryWords),
      }));
  }

  async getStats(): Promise<KnowledgeStats> {
    const byType: Record<string, number> = {};
    const repos = new Set<string>();
    let totalTokens = 0;

    for (const doc of this.documents) {
      byType[doc.metadata.type] = (byType[doc.metadata.type] || 0) + 1;
      repos.add(doc.metadata.repo);
      totalTokens += Math.ceil(doc.content.length / 4);
    }

    return {
      totalDocuments: this.documents.length,
      totalTokens,
      repos: Array.from(repos),
      lastIngested: this.documents[this.documents.length - 1]?.metadata.lastUpdated || '',
      byType,
    };
  }

  async save(path: string): Promise<void> {
    const fs = await import('fs/promises');
    await fs.writeFile(path, JSON.stringify(this.documents, null, 2));
    console.log(`[VectorStore] 💾 Saved ${this.documents.length} docs to ${path}`);
  }

  async load(path: string): Promise<void> {
    const fs = await import('fs/promises');
    try {
      const data = await fs.readFile(path, 'utf-8');
      this.documents = JSON.parse(data);
      console.log(`[VectorStore] 📂 Loaded ${this.documents.length} docs from ${path}`);
    } catch {
      console.log(`[VectorStore] 📂 No existing data at ${path}`);
    }
  }

  private extractSnippet(content: string, queryWords: string[]): string {
    const lines = content.split('\n');
    let bestLine = 0, bestScore = 0;

    for (let i = 0; i < lines.length; i++) {
      const lineLower = lines[i].toLowerCase();
      let score = 0;
      for (const word of queryWords) {
        if (lineLower.includes(word)) score++;
      }
      if (score > bestScore) { bestScore = score; bestLine = i; }
    }

    const start = Math.max(0, bestLine - 2);
    const end = Math.min(lines.length, bestLine + 3);
    return lines.slice(start, end).join('\n').slice(0, 500);
  }
}

/**
 * AKHAI Knowledge Base - Main Interface
 */
export class KnowledgeBase {
  private ingester: GitHubIngester;
  private store: MemoryVectorStore;
  private dataPath: string;

  constructor(githubToken?: string, dataPath = './data/knowledge.json') {
    this.ingester = new GitHubIngester(githubToken);
    this.store = new MemoryVectorStore();
    this.dataPath = dataPath;
  }

  async initialize(): Promise<void> {
    await this.store.load(this.dataPath);
    const stats = await this.store.getStats();
    console.log(`[Knowledge] 🧠 Initialized with ${stats.totalDocuments} documents`);
  }

  async ingestFromGitHub(owner: string): Promise<void> {
    console.log(`[Knowledge] 🚀 Starting GitHub ingestion for ${owner}...`);
    const documents = await this.ingester.ingestAllRepos(owner);
    await this.store.addDocuments(documents);
    await this.store.save(this.dataPath);

    const stats = await this.store.getStats();
    console.log(`[Knowledge] ✅ Complete! ${stats.totalDocuments} docs, ~${stats.totalTokens.toLocaleString()} tokens`);
  }

  async ingestRepo(owner: string, repo: string): Promise<void> {
    const documents = await this.ingester.ingestRepo(owner, repo);
    await this.store.addDocuments(documents);
    await this.store.save(this.dataPath);
  }

  async search(query: string, limit = 5): Promise<SearchResult[]> {
    return this.store.search(query, limit);
  }

  async getContext(query: string, maxTokens = 4000): Promise<string> {
    const results = await this.search(query, 10);
    let context = '', tokens = 0;

    for (const result of results) {
      const docTokens = Math.ceil(result.document.content.length / 4);
      if (tokens + docTokens > maxTokens) {
        const remaining = (maxTokens - tokens) * 4;
        context += `\n\n--- ${result.document.metadata.path} ---\n`;
        context += result.document.content.slice(0, remaining);
        break;
      }
      context += `\n\n--- ${result.document.metadata.path} ---\n`;
      context += result.document.content;
      tokens += docTokens;
    }
    return context.trim();
  }

  async getStats(): Promise<KnowledgeStats> {
    return this.store.getStats();
  }

  formatResults(results: SearchResult[]): string {
    if (results.length === 0) return 'No relevant documents found.';
    let output = `Found ${results.length} relevant documents:\n\n`;
    for (const r of results) {
      output += `📄 ${r.document.metadata.path} (score: ${r.score.toFixed(1)})\n`;
      output += `   ${r.snippet.slice(0, 150)}...\n\n`;
    }
    return output;
  }
}
