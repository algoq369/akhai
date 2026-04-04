/**
 * Pertinent Links Generator
 * Generates query-specific, always-new, truly relevant links
 * Based on actual query content and AI response entities
 */

import {
  addQuantumLinks,
  addUAPLinks,
  addPatentLinks,
  addGovernmentLinks,
  addAerospaceLinks,
  addBiomedicalLinks,
  addEngineeringLinks,
  addFinanceLinks,
  addCryptoLinks,
} from './pertinent-link-generators';

export interface PertinentLink {
  id: string;
  url: string;
  title: string;
  source: string;
  description: string;
  relevance: number;
}

/**
 * Extract main entities from text (capitalized words/phrases)
 */
function extractEntities(text: string): string[] {
  const entities: string[] = [];

  // Extract capitalized words and phrases
  const capitalizedMatches = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g) || [];

  capitalizedMatches.forEach((match) => {
    const normalized = match.toLowerCase();
    if (normalized.length > 2 && !entities.includes(normalized)) {
      entities.push(normalized);
    }
  });

  return entities;
}

/**
 * Detect query intent and characteristics
 */
function analyzeQuery(query: string, content: string) {
  const queryLower = query.toLowerCase();
  const contentLower = content.toLowerCase();

  return {
    // Intent types
    isResearch:
      /research|stud|paper|publication|academ/i.test(query) || /\d+%|\d+\.\d+/i.test(content),
    isImplementation: /how to|implement|build|create|develop|tutorial|guide/i.test(query),
    isExplanation: /what is|explain|define|understand|meaning/i.test(query),
    isComparison: /versus|vs|compare|better|worse|difference/i.test(query),
    isNews: /latest|recent|2024|2025|2026|news|current|today/i.test(query),
    isCode: /code|library|framework|api|github|repository/i.test(query),
    isVideo: /video|watch|tutorial|course/i.test(query),
    isDiscussion: /discussion|community|forum|reddit|opinion/i.test(query),
    isData: /data|statistics|stats|metrics|numbers/i.test(content),
    isScientific: /scientific|journal|peer|review|arxiv/i.test(query),

    // Domain detection - IMPROVED: Check QUERY primarily, not just content
    isTech: /technolog|software|hardware|computer|digital/i.test(queryLower + ' ' + contentLower),
    isAI: /artificial intelligence|machine learning|neural network|deep learning|ai|ml/i.test(
      queryLower + ' ' + contentLower
    ),
    isClimate:
      /climate|environment|emission|carbon|sustainability/i.test(queryLower) &&
      !/econom|market|financ/i.test(queryLower),
    isHealth:
      /health|medical|disease|treatment|doctor|patient/i.test(queryLower) &&
      !/econom|market|financ/i.test(queryLower),
    isEconomic:
      /econom|market|trade|financ|business|invest|stock|bond|currency|gdp|inflation|monetary|fiscal/i.test(
        queryLower + ' ' + contentLower
      ),
    isFinance: /financ|invest|portfolio|stock|bond|asset|wealth|trading|bank|crypto|defi/i.test(
      queryLower + ' ' + contentLower
    ),
    isScience: /physics|chemistry|biology|science|quantum/i.test(queryLower + ' ' + contentLower),
    isCrypto: /crypto|bitcoin|ethereum|blockchain|defi|web3|nft/i.test(
      queryLower + ' ' + contentLower
    ),
    isPolicy: /polic|regulation|government|law|legislation/i.test(queryLower + ' ' + contentLower),

    // NEW: High-quality research domains
    isQuantum: /quantum|qubit|superposition|entanglement|decoherence|bell\s+inequality/i.test(
      queryLower + ' ' + contentLower
    ),
    isUAP: /uap|ufo|unidentified\s+aerial|disclosure|pentagon|navy\s+encounter|tic\s+tac/i.test(
      queryLower
    ),
    isPatent: /patent|invention|uspto|intellectual\s+property|prior\s+art/i.test(queryLower),
    isGovernment:
      /darpa|air\s+force|government\s+program|classified|foia|national\s+security/i.test(
        queryLower
      ),
    isAerospace: /aerospace|nasa|rocket|spacecraft|satellite|space\s+exploration|mars|iss/i.test(
      queryLower + ' ' + contentLower
    ),
    isBiomedical: /gene|protein|dna|rna|biomedical|clinical|pharmacology|pathology/i.test(
      queryLower + ' ' + contentLower
    ),
    isEngineering: /engineering|design|fabrication|manufacturing|ieee|technical\s+standard/i.test(
      queryLower + ' ' + contentLower
    ),
  };
}

/**
 * Generate pertinent, query-specific links
 * Always returns NEW links based on actual query content
 */
export function generatePertinentLinks(
  query: string,
  aiResponse: string,
  maxLinks: number = 3
): PertinentLink[] {
  const links: PertinentLink[] = [];

  // Extract main entities from BOTH query and response
  const queryEntities = extractEntities(query);
  const responseEntities = extractEntities(aiResponse);
  const allEntities = [...new Set([...queryEntities, ...responseEntities])];

  const mainEntity = allEntities[0] || query.split(' ').slice(0, 3).join(' ');
  const secondEntity = allEntities[1] || '';

  // Analyze query characteristics
  const intent = analyzeQuery(query, aiResponse);

  // Encode entities for URLs
  const encodedMain = encodeURIComponent(mainEntity);
  const encodedQuery = encodeURIComponent(query.slice(0, 100));

  // 1. RESEARCH LINKS - For academic/data queries
  if (intent.isResearch || intent.isScientific) {
    links.push({
      id: `scholar-${Date.now()}-${Math.random()}`,
      url: `https://scholar.google.com/scholar?q=${encodedMain}+research+papers`,
      title: `${mainEntity} - Research Papers`,
      source: 'Google Scholar',
      description: `Peer-reviewed academic research on ${mainEntity}`,
      relevance: 0.95,
    });

    links.push({
      id: `arxiv-${Date.now()}-${Math.random()}`,
      url: `https://arxiv.org/search/?query=${encodedMain}&searchtype=all`,
      title: `${mainEntity} - Scientific Papers`,
      source: 'ArXiv',
      description: `Open-access scientific papers about ${mainEntity}`,
      relevance: 0.93,
    });
  }

  // Domain-specific links via extracted generators
  if (intent.isQuantum) addQuantumLinks(links, encodedMain, mainEntity);
  if (intent.isUAP) addUAPLinks(links);
  if (intent.isPatent) addPatentLinks(links, encodedMain, mainEntity);
  if (intent.isGovernment) addGovernmentLinks(links);
  if (intent.isAerospace) addAerospaceLinks(links, encodedMain, mainEntity);
  if (intent.isBiomedical || (intent.isHealth && intent.isResearch))
    addBiomedicalLinks(links, encodedMain, mainEntity);
  if (intent.isEngineering || (intent.isTech && intent.isResearch))
    addEngineeringLinks(links, encodedMain, mainEntity);

  // 2. IMPLEMENTATION/TUTORIAL LINKS - For how-to queries
  if (intent.isImplementation) {
    links.push({
      id: `github-${Date.now()}-${Math.random()}`,
      url: `https://github.com/search?q=${encodedMain}&type=repositories`,
      title: `${mainEntity} - GitHub Repositories`,
      source: 'GitHub',
      description: `Code repositories and implementations for ${mainEntity}`,
      relevance: 0.96,
    });

    links.push({
      id: `github-docs-${Date.now()}-${Math.random()}`,
      url: `https://github.com/search?q=${encodedMain}+documentation&type=wikis`,
      title: `${mainEntity} - Technical Documentation`,
      source: 'GitHub Docs',
      description: `Project wikis and technical documentation`,
      relevance: 0.94,
    });

    links.push({
      id: `readthedocs-${Date.now()}-${Math.random()}`,
      url: `https://readthedocs.org/search/?q=${encodedMain}`,
      title: `${mainEntity} - ReadTheDocs`,
      source: 'ReadTheDocs',
      description: `Open-source project documentation and guides`,
      relevance: 0.92,
    });
  }

  // 3. EXPLANATION LINKS - For conceptual understanding
  if (intent.isExplanation) {
    links.push({
      id: `youtube-${Date.now()}-${Math.random()}`,
      url: `https://www.youtube.com/results?search_query=${encodedMain}+explained+tutorial`,
      title: `${mainEntity} Explained - Video Tutorials`,
      source: 'YouTube',
      description: `Video explanations and visual guides for ${mainEntity}`,
      relevance: 0.92,
    });

    links.push({
      id: `wiki-${Date.now()}-${Math.random()}`,
      url: `https://en.wikipedia.org/wiki/${mainEntity.replace(/\s+/g, '_')}`,
      title: `${mainEntity} - Encyclopedia`,
      source: 'Wikipedia',
      description: `Comprehensive overview and background on ${mainEntity}`,
      relevance: 0.9,
    });
  }

  // 4. SOCIAL & COMMUNITY - Always include diverse sources (Twitter, Reddit, YouTube)
  // Twitter/X - Real-time discussions
  links.push({
    id: `twitter-${Date.now()}-${Math.random()}`,
    url: `https://twitter.com/search?q=${encodedMain}&f=live`,
    title: `${mainEntity} - Live Twitter Discussion`,
    source: 'Twitter/X',
    description: `Real-time tweets and threads about ${mainEntity}`,
    relevance: 0.88,
  });

  // Reddit - Community discussions
  links.push({
    id: `reddit-${Date.now()}-${Math.random()}`,
    url: `https://www.reddit.com/search/?q=${encodedMain}`,
    title: `${mainEntity} - Reddit Discussions`,
    source: 'Reddit',
    description: `Community insights and discussions on ${mainEntity}`,
    relevance: 0.87,
  });

  // YouTube - Video content
  links.push({
    id: `youtube-general-${Date.now()}-${Math.random()}`,
    url: `https://www.youtube.com/results?search_query=${encodedMain}`,
    title: `${mainEntity} - Video Content`,
    source: 'YouTube',
    description: `Video tutorials, talks, and analysis on ${mainEntity}`,
    relevance: 0.89,
  });

  // Medium - Articles and blogs
  links.push({
    id: `medium-${Date.now()}-${Math.random()}`,
    url: `https://medium.com/search?q=${encodedMain}`,
    title: `${mainEntity} - Medium Articles`,
    source: 'Medium',
    description: `In-depth articles and perspectives on ${mainEntity}`,
    relevance: 0.86,
  });

  // 5. NEWS/CURRENT EVENTS - For latest information
  if (intent.isNews) {
    links.push({
      id: `news-${Date.now()}-${Math.random()}`,
      url: `https://news.google.com/search?q=${encodedMain}+2025`,
      title: `${mainEntity} - Latest News 2025`,
      source: 'Google News',
      description: `Recent news and developments about ${mainEntity}`,
      relevance: 0.94,
    });
  }

  // 5. CODE/TECHNICAL RESOURCES - For developers
  if (intent.isCode) {
    links.push({
      id: `stackof-${Date.now()}-${Math.random()}`,
      url: `https://stackoverflow.com/search?q=${encodedMain}`,
      title: `${mainEntity} - Developer Q&A`,
      source: 'Stack Overflow',
      description: `Technical questions and solutions for ${mainEntity}`,
      relevance: 0.93,
    });

    if (intent.isAI) {
      links.push({
        id: `pwc-${Date.now()}-${Math.random()}`,
        url: 'https://paperswithcode.com',
        title: `${mainEntity} - ML Research & Code`,
        source: 'Papers With Code',
        description: 'Latest ML research with implementation code',
        relevance: 0.96,
      });
    }
  }

  // 6. DISCUSSION/COMMUNITY - For opinions and experiences
  if (intent.isDiscussion) {
    links.push({
      id: `reddit-${Date.now()}-${Math.random()}`,
      url: `https://www.reddit.com/search/?q=${encodedMain}`,
      title: `${mainEntity} - Community Discussions`,
      source: 'Reddit',
      description: `User experiences and community insights on ${mainEntity}`,
      relevance: 0.88,
    });
  }

  // 7. DATA/STATISTICS - For quantitative information
  if (intent.isData) {
    // Economic data
    if (intent.isEconomic) {
      links.push({
        id: `worldbank-${Date.now()}-${Math.random()}`,
        url: `https://data.worldbank.org/indicator?q=${encodedMain}`,
        title: `${mainEntity} - Economic Data`,
        source: 'World Bank',
        description: `Global economic indicators and development data`,
        relevance: 0.96,
      });

      links.push({
        id: `fred-${Date.now()}-${Math.random()}`,
        url: `https://fred.stlouisfed.org/search?st=${encodedMain}`,
        title: `${mainEntity} - FRED Data`,
        source: 'Federal Reserve',
        description: `Economic data from Federal Reserve Bank of St. Louis`,
        relevance: 0.95,
      });
    }

    // General statistics
    links.push({
      id: `statista-${Date.now()}-${Math.random()}`,
      url: `https://www.statista.com/search/?q=${encodedMain}`,
      title: `${mainEntity} - Statistics`,
      source: 'Statista',
      description: `Market data, statistics, and industry reports`,
      relevance: 0.92,
    });

    links.push({
      id: `ourworldindata-${Date.now()}-${Math.random()}`,
      url: `https://ourworldindata.org/search?q=${encodedMain}`,
      title: `${mainEntity} - Global Data`,
      source: 'Our World in Data',
      description: `Research-backed data visualizations and statistics`,
      relevance: 0.93,
    });
  }

  // 8. COMPARISON LINKS - For vs/compare queries
  if (intent.isComparison && secondEntity) {
    // For tech comparisons, use specialized sources
    if (intent.isTech || intent.isAI) {
      links.push({
        id: `compare-tech-${Date.now()}-${Math.random()}`,
        url: `https://github.com/search?q=${encodedMain}+vs+${encodeURIComponent(secondEntity)}&type=issues`,
        title: `${mainEntity} vs ${secondEntity} - Developer Discussions`,
        source: 'GitHub Issues',
        description: `Real-world developer comparisons and experiences`,
        relevance: 0.94,
      });
    }

    // For academic comparisons, use scholar
    if (intent.isResearch || intent.isScientific) {
      links.push({
        id: `compare-scholar-${Date.now()}-${Math.random()}`,
        url: `https://scholar.google.com/scholar?q=${encodedMain}+versus+${encodeURIComponent(secondEntity)}`,
        title: `${mainEntity} vs ${secondEntity} - Research`,
        source: 'Google Scholar',
        description: `Academic comparison studies and analysis`,
        relevance: 0.95,
      });
    }
  }

  // 9. FINANCIAL/ECONOMIC SOURCES - For finance/markets/economy queries
  if (intent.isFinance || intent.isEconomic) addFinanceLinks(links, encodedMain, mainEntity);

  // 10. CRYPTO/BLOCKCHAIN SOURCES - For crypto queries
  if (intent.isCrypto) addCryptoLinks(links, encodedMain, mainEntity);

  // 11. DOMAIN-SPECIFIC AUTHORITATIVE SOURCES (Only if PRIMARY domain)
  // Only add if no financial/economic intent (avoid mixing domains)
  if (intent.isClimate && !intent.isEconomic && !intent.isFinance) {
    links.push({
      id: `ipcc-${Date.now()}-${Math.random()}`,
      url: `https://www.ipcc.ch/reports`,
      title: 'IPCC Climate Reports',
      source: 'UN Climate Panel',
      description: 'Authoritative climate science assessments',
      relevance: 0.97,
    });
  }

  if (intent.isHealth && !intent.isEconomic && !intent.isFinance) {
    links.push({
      id: `who-${Date.now()}-${Math.random()}`,
      url: `https://www.who.int/health-topics/${mainEntity.replace(/\s+/g, '-')}`,
      title: `${mainEntity} - Health Information`,
      source: 'World Health Organization',
      description: `Official WHO health information on ${mainEntity}`,
      relevance: 0.96,
    });
  }

  // 12. FALLBACK - Only if insufficient specialized links
  // Use Wikipedia and Google Scholar as quality fallbacks instead of generic search
  if (links.length < maxLinks) {
    // Wikipedia as first fallback (reliable, encyclopedic)
    if (links.length < maxLinks) {
      links.push({
        id: `wiki-fallback-${Date.now()}-${Math.random()}`,
        url: `https://en.wikipedia.org/wiki/Special:Search?search=${encodedMain}`,
        title: `${mainEntity} - Encyclopedia`,
        source: 'Wikipedia',
        description: `Comprehensive overview and background information`,
        relevance: 0.82,
      });
    }

    // Google Scholar as second fallback (academic credibility)
    if (links.length < maxLinks) {
      links.push({
        id: `scholar-fallback-${Date.now()}-${Math.random()}`,
        url: `https://scholar.google.com/scholar?q=${encodedMain}`,
        title: `${mainEntity} - Academic Search`,
        source: 'Google Scholar',
        description: `Research papers and academic sources`,
        relevance: 0.8,
      });
    }
  }

  // Sort by relevance and return top N
  return links.sort((a, b) => b.relevance - a.relevance).slice(0, maxLinks);
}

/**
 * Generate detailed, context-aware suggestion
 */
export function generateDetailedSuggestion(query: string, aiResponse: string): string {
  const entities = extractEntities(aiResponse);
  const mainTopic = entities[0] || 'this topic';
  const secondTopic = entities[1] || '';

  const intent = analyzeQuery(query, aiResponse);

  // Implementation queries
  if (intent.isImplementation) {
    return `Step-by-step guide to implementing ${mainTopic} with practical examples and best practices`;
  }

  // Comparison queries
  if (intent.isComparison && secondTopic) {
    return `Detailed comparison: ${mainTopic} vs ${secondTopic} - pros, cons, use cases, and expert recommendations`;
  }

  // Research/academic queries
  if (intent.isResearch || intent.isScientific) {
    return `Latest academic research on ${mainTopic}: peer-reviewed studies, methodologies, and findings (2024-2025)`;
  }

  // News/current events
  if (intent.isNews) {
    return `Current developments in ${mainTopic}: breaking news, trends, and expert analysis for 2025`;
  }

  // Technical/code queries
  if (intent.isCode) {
    return `Complete ${mainTopic} code examples, popular libraries, and production-ready implementations`;
  }

  // Explanation queries
  if (intent.isExplanation) {
    return `In-depth explanation of ${mainTopic}: core concepts, visual diagrams, and real-world applications`;
  }

  // Data/statistics queries
  if (intent.isData) {
    return `Comprehensive ${mainTopic} statistics: latest data, trends, charts, and analytical insights`;
  }

  // Discussion/community queries
  if (intent.isDiscussion) {
    return `Community perspectives on ${mainTopic}: user experiences, common pitfalls, and expert advice`;
  }

  // Default - exploratory
  return `Explore ${mainTopic} in depth: comprehensive overview, key insights, and further resources`;
}
