/**
 * Intelligent Link Generator
 * Generates query-specific research links based on:
 * 1. Actual query topics and entities
 * 2. Depth annotation sigils and insights
 * 3. Key concepts discussed in the response
 *
 * NO generic social media links - only targeted research sources
 */

export interface IntelligentLink {
  id: string
  url: string
  title: string
  source: string
  description: string
  relevance: number
  category: 'research' | 'data' | 'news' | 'forum' | 'code' | 'media'
}

/**
 * Extract key phrases from text (not just capitalized words)
 */
function extractKeyPhrases(text: string): string[] {
  const phrases: string[] = []

  // Extract noun phrases (2-4 words, starting with capital or important keywords)
  const nounPhrasePattern = /\b(?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}|(?:artificial intelligence|machine learning|deep learning|neural network|quantum computing|climate change|cryptocurrency|blockchain technology|renewable energy|gene therapy|space exploration))\b/g
  const matches = text.match(nounPhrasePattern) || []

  matches.forEach(match => {
    const normalized = match.toLowerCase()
    if (normalized.length > 4 && !phrases.includes(normalized)) {
      phrases.push(normalized)
    }
  })

  // Extract metrics and important numbers with context
  const metricPattern = /(\w+(?:\s+\w+){0,2})\s*[:–—]\s*(\$?[\d,]+[KMB%]?)/g
  let metricMatch
  while ((metricMatch = metricPattern.exec(text)) !== null) {
    const context = metricMatch[1].toLowerCase()
    if (!phrases.includes(context)) {
      phrases.push(context)
    }
  }

  return phrases.slice(0, 5) // Top 5 phrases
}

/**
 * Detect domain and generate specialized research sources
 */
function detectDomain(query: string, response: string) {
  const combined = (query + ' ' + response).toLowerCase()

  return {
    // Technology domains
    isAI: /artificial intelligence|machine learning|neural network|deep learning|llm|gpt|claude|ai model/i.test(combined),
    isCrypto: /bitcoin|ethereum|blockchain|cryptocurrency|defi|web3|crypto|btc|eth/i.test(combined),
    isQuantum: /quantum computing|qubit|quantum entanglement|quantum|superposition/i.test(combined),
    isClimatetech: /climate|carbon|emission|renewable energy|solar|wind|sustainability/i.test(combined),
    isBiotech: /gene therapy|crispr|biotech|genomics|pharmaceutical|drug development/i.test(combined),
    isAerospace: /space|nasa|rocket|satellite|mars|aerospace/i.test(combined),

    // Geopolitical/economic
    isGeopolitics: /geopolitic|sanction|trade war|china|russia|us\s+policy|export control/i.test(combined),
    isEconomic: /gdp|inflation|market|economic|recession|trade|tariff|fiscal/i.test(combined),
    isFinance: /investment|stock|bond|portfolio|asset|trading|financial/i.test(combined),

    // Research types
    isScientific: /research|study|paper|peer-reviewed|journal|scientific/i.test(combined),
    isPatent: /patent|invention|intellectual property|uspto/i.test(combined),
    isDataDriven: /\d+%|data|statistics|metrics|benchmark|performance/i.test(response),
  }
}

/**
 * Generate intelligent, topic-specific research links
 */
export function generateIntelligentLinks(
  query: string,
  aiResponse: string,
  annotations?: Array<{ term: string; content: string }>,
  maxLinks: number = 8
): IntelligentLink[] {
  const links: IntelligentLink[] = []

  // Extract key topics from query, response, and annotations
  const queryPhrases = extractKeyPhrases(query)
  const responsePhrases = extractKeyPhrases(aiResponse)
  const annotationTopics = annotations?.map(a => a.term.toLowerCase()) || []

  // Combine and prioritize topics
  const allTopics = [
    ...queryPhrases.slice(0, 2), // Top 2 from query (highest priority)
    ...annotationTopics.slice(0, 2), // Top 2 from annotations
    ...responsePhrases.slice(0, 1), // Top 1 from response
  ]
  const uniqueTopics = [...new Set(allTopics)].slice(0, 3)
  const mainTopic = uniqueTopics[0] || query.split(' ').slice(0, 3).join(' ')

  // Combined text for domain detection
  const combined = (query + ' ' + aiResponse).toLowerCase()

  // Detect domain
  const domain = detectDomain(query, aiResponse)

  // Generate specialized links based on domain

  // ============ AI/ML RESEARCH ============
  if (domain.isAI) {
    const encodedTopic = encodeURIComponent(mainTopic)

    // HIGH-VALUE: State-of-the-art models and benchmarks
    links.push({
      id: `huggingface-${Date.now()}`,
      url: `https://huggingface.co/models?search=${encodedTopic}&sort=trending`,
      title: `${mainTopic} - Trending AI Models`,
      source: 'Hugging Face',
      description: `State-of-the-art pre-trained models, datasets, and spaces`,
      relevance: 0.97,
      category: 'code'
    })

    links.push({
      id: `papers-with-code-${Date.now()}`,
      url: `https://paperswithcode.com/search?q=${encodedTopic}`,
      title: `${mainTopic} - Papers + Implementation`,
      source: 'Papers With Code',
      description: `AI research papers with reproducible code and benchmarks`,
      relevance: 0.96,
      category: 'research'
    })

    // RESEARCH: Latest papers and breakthroughs
    links.push({
      id: `arxiv-ai-${Date.now()}`,
      url: `https://arxiv.org/search/?query=${encodedTopic}+machine+learning&searchtype=all&order=-announced_date_first&size=50`,
      title: `${mainTopic} - Latest AI Research`,
      source: 'ArXiv (cs.AI)',
      description: `Recent machine learning and AI research papers`,
      relevance: 0.95,
      category: 'research'
    })

    // BENCHMARKS: Performance comparisons
    if (/benchmark|performance|evaluation|leaderboard/i.test(combined)) {
      links.push({
        id: `paperswithcode-bench-${Date.now()}`,
        url: `https://paperswithcode.com/sota`,
        title: `${mainTopic} - SOTA Benchmarks`,
        source: 'Papers With Code SOTA',
        description: `State-of-the-art performance benchmarks and leaderboards`,
        relevance: 0.97,
        category: 'data'
      })
    }

    // LLM SPECIFIC: LLM leaderboards and evaluations
    if (/llm|language model|gpt|claude|chatgpt|ai agent/i.test(combined)) {
      links.push({
        id: `lmsys-${Date.now()}`,
        url: `https://chat.lmsys.org/?leaderboard`,
        title: `LLM Chatbot Arena Leaderboard`,
        source: 'LMSYS',
        description: `Real-world LLM performance rankings via human evaluation`,
        relevance: 0.98,
        category: 'data'
      })

      links.push({
        id: `artificialanalysis-${Date.now()}`,
        url: `https://artificialanalysis.ai/`,
        title: `${mainTopic} - LLM Performance Comparison`,
        source: 'Artificial Analysis',
        description: `Independent LLM benchmarks: quality, speed, and cost`,
        relevance: 0.96,
        category: 'data'
      })
    }

    // TWITTER/X: Curated AI research accounts
    links.push({
      id: `twitter-ai-${Date.now()}`,
      url: `https://twitter.com/search?q=${encodeURIComponent(mainTopic + ' (from:karpathy OR from:AndrewYNg OR from:ylecun OR from:goodfellow_ian OR from:hardmaru)')}&f=live`,
      title: `${mainTopic} - AI Research Twitter`,
      source: 'X (AI Researchers)',
      description: `Top AI researchers and practitioners discussing ${mainTopic}`,
      relevance: 0.93,
      category: 'forum'
    })

    // GITHUB: AI repositories
    links.push({
      id: `github-ai-${Date.now()}`,
      url: `https://github.com/search?q=${encodedTopic}+machine+learning&type=repositories&s=stars&o=desc`,
      title: `${mainTopic} - GitHub AI Repos`,
      source: 'GitHub',
      description: `Top-starred AI/ML repositories and implementations`,
      relevance: 0.92,
      category: 'code'
    })
  }

  // ============ CRYPTO/BLOCKCHAIN/WEB3 ============
  if (domain.isCrypto) {
    const cryptoSymbol = mainTopic.match(/bitcoin|btc/i) ? 'bitcoin' :
                        mainTopic.match(/ethereum|eth/i) ? 'ethereum' :
                        mainTopic.match(/solana|sol/i) ? 'solana' :
                        mainTopic.toLowerCase().replace(/\s+/g, '-')

    // HIGH-VALUE: On-chain analytics (most insightful)
    links.push({
      id: `dune-${Date.now()}`,
      url: `https://dune.com/browse/dashboards?q=${encodeURIComponent(mainTopic)}`,
      title: `${mainTopic} - On-Chain Dashboards & Analytics`,
      source: 'Dune Analytics',
      description: `Real-time on-chain data dashboards and metrics for ${mainTopic}`,
      relevance: 0.98,
      category: 'data'
    })

    links.push({
      id: `nansen-${Date.now()}`,
      url: `https://www.nansen.ai/`,
      title: `${mainTopic} - Smart Money Tracking`,
      source: 'Nansen',
      description: `Track whale wallets and smart money flows for ${mainTopic}`,
      relevance: 0.97,
      category: 'data'
    })

    // RESEARCH: Deep crypto research
    links.push({
      id: `messari-${Date.now()}`,
      url: `https://messari.io/research/${cryptoSymbol}`,
      title: `${mainTopic} - Professional Research Reports`,
      source: 'Messari',
      description: `In-depth crypto research, metrics, and market analysis`,
      relevance: 0.96,
      category: 'research'
    })

    links.push({
      id: `theblock-${Date.now()}`,
      url: `https://www.theblock.co/search?query=${encodeURIComponent(mainTopic)}`,
      title: `${mainTopic} - Institutional Research`,
      source: 'The Block Research',
      description: `Institutional-grade crypto research and data`,
      relevance: 0.95,
      category: 'research'
    })

    // DEFI SPECIFIC: DeFi protocols and yields
    if (/defi|yield|staking|liquidity|dex|lending/i.test(combined)) {
      links.push({
        id: `defillama-${Date.now()}`,
        url: `https://defillama.com/`,
        title: `DeFi TVL & Protocol Analytics`,
        source: 'DefiLlama',
        description: `Total Value Locked, yields, and DeFi protocol metrics`,
        relevance: 0.98,
        category: 'data'
      })

      links.push({
        id: `tokenterminal-${Date.now()}`,
        url: `https://tokenterminal.com/`,
        title: `${mainTopic} - Fundamental Metrics`,
        source: 'Token Terminal',
        description: `Revenue, fees, and fundamental crypto metrics`,
        relevance: 0.96,
        category: 'data'
      })
    }

    // TWITTER/X: Curated crypto trading accounts
    links.push({
      id: `twitter-crypto-${Date.now()}`,
      url: `https://twitter.com/search?q=${encodeURIComponent(mainTopic + ' (from:tier10k OR from:DefiIgnas OR from:route2FI OR from:kaito_ai_agent)')}&f=live`,
      title: `${mainTopic} - Curated Crypto Twitter Insights`,
      source: 'X (Crypto Alpha)',
      description: `Top crypto analysts and researchers discussing ${mainTopic}`,
      relevance: 0.93,
      category: 'forum'
    })

    // DEV RESOURCES: GitHub and documentation
    if (/smart contract|solidity|evm|development/i.test(combined)) {
      links.push({
        id: `github-crypto-${Date.now()}`,
        url: `https://github.com/search?q=${encodeURIComponent(mainTopic)}&type=repositories&s=stars&o=desc`,
        title: `${mainTopic} - GitHub Repositories`,
        source: 'GitHub',
        description: `Top crypto repositories and smart contract code`,
        relevance: 0.92,
        category: 'code'
      })
    }
  }

  // ============ GEOPOLITICS/TRADE ============
  if (domain.isGeopolitics) {
    const encodedTopic = encodeURIComponent(mainTopic)

    links.push({
      id: `cfr-${Date.now()}`,
      url: `https://www.cfr.org/search?s=${encodedTopic}`,
      title: `${mainTopic} - Foreign Policy Analysis`,
      source: 'Council on Foreign Relations',
      description: `Expert geopolitical analysis on ${mainTopic}`,
      relevance: 0.96,
      category: 'research'
    })

    links.push({
      id: `sipri-${Date.now()}`,
      url: `https://www.sipri.org/search/site/${encodedTopic}`,
      title: `${mainTopic} - Peace & Security Research`,
      source: 'SIPRI',
      description: `Stockholm International Peace Research Institute data on ${mainTopic}`,
      relevance: 0.94,
      category: 'data'
    })

    links.push({
      id: `nber-${Date.now()}`,
      url: `https://www.nber.org/search?page=1&perPage=50&q=${encodedTopic}`,
      title: `${mainTopic} - Economic Research`,
      source: 'NBER',
      description: `National Bureau of Economic Research papers on ${mainTopic}`,
      relevance: 0.93,
      category: 'research'
    })
  }

  // ============ QUANTUM COMPUTING ============
  if (domain.isQuantum) {
    const encodedTopic = encodeURIComponent(mainTopic)

    links.push({
      id: `arxiv-quantum-${Date.now()}`,
      url: `https://arxiv.org/search/?query=${encodedTopic}&searchtype=all&abstracts=show&order=-announced_date_first&size=50`,
      title: `${mainTopic} - Quantum Physics Papers`,
      source: 'ArXiv (Quantum)',
      description: `Latest quantum computing research on ${mainTopic}`,
      relevance: 0.98,
      category: 'research'
    })

    links.push({
      id: `qiskit-${Date.now()}`,
      url: `https://qiskit.org/documentation/`,
      title: `Quantum Development Framework`,
      source: 'IBM Qiskit',
      description: `Open-source quantum computing framework and tutorials`,
      relevance: 0.92,
      category: 'code'
    })
  }

  // ============ BIOTECH/HEALTHCARE ============
  if (domain.isBiotech) {
    const encodedTopic = encodeURIComponent(mainTopic)

    links.push({
      id: `pubmed-${Date.now()}`,
      url: `https://pubmed.ncbi.nlm.nih.gov/?term=${encodedTopic}`,
      title: `${mainTopic} - Biomedical Research`,
      source: 'PubMed',
      description: `Peer-reviewed biomedical and life sciences research`,
      relevance: 0.97,
      category: 'research'
    })

    links.push({
      id: `clinicaltrials-${Date.now()}`,
      url: `https://clinicaltrials.gov/search?term=${encodedTopic}`,
      title: `${mainTopic} - Clinical Trials`,
      source: 'ClinicalTrials.gov',
      description: `Active clinical trials and research studies`,
      relevance: 0.94,
      category: 'data'
    })
  }

  // ============ GENERIC FALLBACK: Academic + Data ============
  if (links.length === 0) {
    const encodedTopic = encodeURIComponent(mainTopic)

    // Always include Google Scholar for research
    links.push({
      id: `scholar-${Date.now()}`,
      url: `https://scholar.google.com/scholar?q=${encodedTopic}`,
      title: `${mainTopic} - Academic Research`,
      source: 'Google Scholar',
      description: `Peer-reviewed papers and citations on ${mainTopic}`,
      relevance: 0.90,
      category: 'research'
    })

    // Add arXiv for scientific topics
    if (domain.isScientific) {
      links.push({
        id: `arxiv-${Date.now()}`,
        url: `https://arxiv.org/search/?query=${encodedTopic}&searchtype=all`,
        title: `${mainTopic} - Scientific Papers`,
        source: 'ArXiv',
        description: `Open-access research papers on ${mainTopic}`,
        relevance: 0.89,
        category: 'research'
      })
    }

    // Add Wikipedia for explanations
    links.push({
      id: `wikipedia-${Date.now()}`,
      url: `https://en.wikipedia.org/wiki/Special:Search?search=${encodedTopic}`,
      title: `${mainTopic} - Encyclopedia`,
      source: 'Wikipedia',
      description: `Comprehensive overview and background on ${mainTopic}`,
      relevance: 0.85,
      category: 'research'
    })
  }

  // ============ ANNOTATION-SPECIFIC LINKS ============
  // Generate links for each annotated topic
  if (annotations && annotations.length > 0) {
    annotations.slice(0, 2).forEach(ann => {
      const annotationTopic = ann.term
      const encodedAnn = encodeURIComponent(annotationTopic)

      // Check if annotation contains metrics (data-focused)
      const hasMetric = /\$?[\d,]+[KMB%]?/.test(ann.content)

      if (hasMetric && domain.isCrypto) {
        links.push({
          id: `coinmetrics-${Date.now()}-${Math.random()}`,
          url: `https://coinmetrics.io/`,
          title: `${annotationTopic} - Crypto Metrics`,
          source: 'Coin Metrics',
          description: `On-chain data and metrics for ${annotationTopic}`,
          relevance: 0.93,
          category: 'data'
        })
      } else if (hasMetric) {
        links.push({
          id: `statista-${Date.now()}-${Math.random()}`,
          url: `https://www.statista.com/search/?q=${encodedAnn}`,
          title: `${annotationTopic} - Statistics & Data`,
          source: 'Statista',
          description: `Market data and statistics on ${annotationTopic}`,
          relevance: 0.88,
          category: 'data'
        })
      }
    })
  }

  // Sort by relevance and category diversity
  // Prioritize: data (0.95+) > research (0.94+) > code (0.92+) > forum (0.90+)
  const sortedLinks = links.sort((a, b) => {
    // First sort by relevance
    if (Math.abs(b.relevance - a.relevance) > 0.02) {
      return b.relevance - a.relevance
    }
    // Then prioritize category: data > research > code > forum
    const categoryWeight: Record<string, number> = {
      data: 4,
      research: 3,
      code: 2,
      forum: 1,
      news: 1,
      media: 0
    }
    return (categoryWeight[b.category] || 0) - (categoryWeight[a.category] || 0)
  })

  // Return top N, ensuring diversity (max 3 per category)
  const result: IntelligentLink[] = []
  const categoryCount: Record<string, number> = {}

  for (const link of sortedLinks) {
    if (result.length >= maxLinks) break

    const count = categoryCount[link.category] || 0
    if (count < 3) { // Max 3 links per category
      result.push(link)
      categoryCount[link.category] = count + 1
    }
  }

  return result
}
