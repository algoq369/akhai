/**
 * Calculate relevance score with authority boosting
 * Extracted from enhanced-links route for file-size compliance.
 */
export async function calculateRelevance(
  link: { url: string; title: string; snippet: string },
  query: string,
  conversationContext: string
): Promise<number> {
  // Keyword matching
  const queryWords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3);
  const combinedText = (link.title + ' ' + link.snippet).toLowerCase();

  let score = 0.4;

  // Keyword relevance
  queryWords.forEach((word) => {
    if (combinedText.includes(word)) {
      score += 0.12;
    }
  });

  // Boost for highly authoritative domains
  // Economic/Finance authorities
  if (link.url.includes('weforum.org')) {
    score += 0.28; // Highest boost for World Economic Forum
  } else if (link.url.includes('imf.org')) {
    score += 0.27; // Very high boost for IMF
  } else if (link.url.includes('worldbank.org')) {
    score += 0.26; // Very high boost for World Bank
  } else if (link.url.includes('federalreserve.gov')) {
    score += 0.25; // High boost for Federal Reserve
  } else if (link.url.includes('oecd.org')) {
    score += 0.24; // High boost for OECD
  } else if (link.url.includes('bis.org')) {
    score += 0.24; // High boost for BIS (Bank for International Settlements)
  }
  // AI/ML authorities
  else if (link.url.includes('paperswithcode.com')) {
    score += 0.25; // Highest boost for Papers with Code
  } else if (link.url.includes('huggingface.co')) {
    score += 0.23; // High boost for Hugging Face
  } else if (link.url.includes('arxiv.org')) {
    score += 0.2; // High boost for arXiv
  } else if (link.url.includes('github.com')) {
    score += 0.18; // Good boost for GitHub
  } else if (link.url.includes('stackoverflow.com')) {
    score += 0.16; // Good boost for Stack Overflow
  } else if (link.url.includes('pcpartpicker.com')) {
    score += 0.16; // Good boost for PC builds
  } else if (link.url.includes('scholar.google')) {
    score += 0.15; // Moderate boost for Google Scholar
  } else if (link.url.includes('.edu') || link.url.includes('.gov')) {
    score += 0.14; // Moderate boost for academic/government
  } else if (link.url.includes('medium.com') || link.url.includes('towardsdatascience.com')) {
    score += 0.1; // Small boost for tech blogs
  }
  // Penalize generic search engines appearing as links
  else if (
    link.url.includes('google.com/search') ||
    link.url.includes('bing.com/search') ||
    link.url.includes('duckduckgo.com/?q')
  ) {
    score -= 0.3; // Heavy penalty for generic search links
  }

  return Math.min(score, 1.0);
}
