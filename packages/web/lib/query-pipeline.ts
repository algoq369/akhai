/**
 * Query pipeline helpers — extracted from simple-query/route.ts
 * Contains: crypto check, methodology selection, methodology prompts, grounding guard
 */

import { logger, log } from '@/lib/logger';
import { UNIVERSAL_STRUCTURE_INSTRUCTION } from './prompts/structure-instruction';

// ============================================================================
// CRYPTO QUERY CHECK
// ============================================================================

export async function checkCryptoQuery(query: string, queryId: string, startTime: number) {
  const queryLower = query.toLowerCase();
  const cryptoSymbols = ['btc', 'bitcoin', 'eth', 'ethereum', 'ada', 'cardano', 'sol', 'solana'];

  const matchedSymbol = cryptoSymbols.find((symbol) => queryLower.includes(symbol));
  const hasPriceKeyword =
    queryLower.includes('price') ||
    queryLower.includes('cost') ||
    queryLower.includes('worth') ||
    queryLower.includes('value');

  log(
    'DEBUG',
    'REALTIME',
    `Crypto check: "${query}" | matchedSymbol: ${matchedSymbol || 'none'} | hasPrice: ${hasPriceKeyword}`
  );

  if (!matchedSymbol || !hasPriceKeyword) {
    return null;
  }

  // Don't use real-time data for prediction/projection/forecast queries
  const futureKeywords = [
    'predict',
    'prediction',
    'projection',
    'forecast',
    'estimate',
    'estimation',
    'outlook',
    'target',
    'expectation',
    'future',
    'will be',
    'gonna be',
    'going to be',
    'going to',
    'in 1 year',
    'in 2 year',
    'in 3 year',
    'in 5 year',
    'in 10 year',
    'in 20 year',
    'in 30 year',
    'in 50 year',
    'in 1 month',
    'in 6 month',
    'in 12 month',
    'in 1 decade',
    'in 2 decade',
    'in 3 decade',
    'from now',
    'from today',
    'next year',
    'next month',
    'next decade',
    'next century',
    'long term',
    'short term',
    '2025',
    '2026',
    '2027',
    '2028',
    '2029',
    '2030',
    '2031',
    '2032',
    '2033',
    '2034',
    '2035',
    '2040',
    '2045',
    '2050',
    'by 202',
    'by 203',
    'by 204',
    'by 205',
    'analysis',
    'potential',
    'expected',
    'anticipated',
  ];

  if (futureKeywords.some((keyword) => queryLower.includes(keyword))) {
    log(
      'INFO',
      'REALTIME',
      `Skipping CoinGecko for "${query.slice(0, 40)}..." - Projection query detected`
    );
    return null;
  }

  // Normalize symbol
  const symbolMap: Record<string, string> = {
    btc: 'bitcoin',
    bitcoin: 'bitcoin',
    eth: 'ethereum',
    ethereum: 'ethereum',
    ada: 'cardano',
    cardano: 'cardano',
    sol: 'solana',
    solana: 'solana',
  };

  const coinId = symbolMap[matchedSymbol];
  logger.realtime.fetch('CoinGecko', coinId);

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`,
      { headers: { Accept: 'application/json' } }
    );

    if (!response.ok) {
      logger.realtime.error('CoinGecko', `HTTP ${response.status}`);
      return null;
    }

    const data = await response.json();
    const price = data[coinId]?.usd;
    const change24h = data[coinId]?.usd_24h_change;

    if (!price) {
      logger.realtime.error('CoinGecko', 'No price data returned');
      return null;
    }

    logger.realtime.success('CoinGecko', coinId.toUpperCase(), price);

    const changeEmoji = change24h >= 0 ? '📈' : '📉';
    const changeText = `${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%`;

    const responseText = `**${coinId.toUpperCase()} Price: $${price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}**\n\n${changeEmoji} 24h Change: ${changeText}\n\n_Live data from CoinGecko • Updated just now_`;

    const latency = Date.now() - startTime;
    logger.query.complete(queryId, latency, 0);

    return {
      id: queryId,
      query,
      methodology: 'direct',
      methodologyUsed: 'realtime-data',
      selectionReason: 'Crypto price query detected - using real-time data',
      response: responseText,
      metrics: {
        tokens: 0,
        latency,
        cost: 0,
        source: 'CoinGecko',
      },
    };
  } catch (error) {
    logger.realtime.error('CoinGecko', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

// ============================================================================
// METHODOLOGY SELECTION
// ============================================================================

export function selectMethodology(query: string, requested: string) {
  if (requested !== 'auto') {
    return { id: requested, reason: 'User selected' };
  }

  const queryLower = query.toLowerCase();

  // Math/computation → pas (check BEFORE simple queries)
  if (
    queryLower.includes('calculate') ||
    queryLower.includes('compute') ||
    /\d+\s*[+\-*/=]\s*\d+/.test(query)
  ) {
    logger.query.methodSelected('auto', 'pas', 'Math/computation detected - Plan-and-Solve');
    return { id: 'pas', reason: 'Math/computation detected - Plan-and-Solve' };
  }

  // Simple factual queries → direct
  if (query.length < 100 && !queryLower.includes('analyze') && !queryLower.includes('compare')) {
    logger.query.methodSelected('auto', 'direct', 'Simple query - direct response optimal');
    return { id: 'direct', reason: 'Simple query - direct response optimal' };
  }

  // Complex context requiring buffering → sc
  if (
    queryLower.includes('given that') ||
    queryLower.includes('assuming') ||
    queryLower.includes('constraints') ||
    queryLower.includes('requirements') ||
    query.split(/[.!?]/).length > 2
  ) {
    logger.query.methodSelected('auto', 'sc', 'Complex context detected - Self-Consistency');
    return { id: 'sc', reason: 'Complex context detected - Self-Consistency' };
  }

  // Step-by-step → cod
  if (
    queryLower.includes('step by step') ||
    queryLower.includes('explain how') ||
    queryLower.includes('draft')
  ) {
    logger.query.methodSelected('auto', 'cod', 'Step-by-step request - Chain of Draft');
    return { id: 'cod', reason: 'Step-by-step request - Chain of Draft' };
  }

  // Search/tools → react
  if (
    queryLower.includes('search') ||
    queryLower.includes('find') ||
    queryLower.includes('latest') ||
    queryLower.includes('look up')
  ) {
    logger.query.methodSelected('auto', 'react', 'Search/tools needed - ReAct');
    return { id: 'react', reason: 'Search/tools needed - ReAct' };
  }

  // Multi-perspective → tot
  if (
    queryLower.includes('consensus') ||
    queryLower.includes('multiple perspectives') ||
    queryLower.includes('different angles') ||
    queryLower.includes('multi-ai') ||
    queryLower.includes('debate') ||
    queryLower.includes('pros and cons') ||
    queryLower.includes('comprehensive analysis') ||
    queryLower.includes('all perspectives') ||
    queryLower.includes('various viewpoints')
  ) {
    logger.query.methodSelected('auto', 'tot', 'Multi-perspective request - TOT Consensus');
    return { id: 'tot', reason: 'Multi-perspective request - TOT Consensus' };
  }

  // Default to direct
  logger.query.methodSelected('auto', 'direct', 'Default to direct for efficiency');
  return { id: 'direct', reason: 'Default to direct for efficiency' };
}

// ============================================================================
// METHODOLOGY PROMPT GENERATION
// ============================================================================

export function getMethodologyPrompt(
  methodology: string,
  pageContext?: string,
  legendMode: boolean = false
): string {
  // Base identity with lead-with-insight writing style
  const baseIdentity = legendMode
    ? 'You are AkhAI in Legend Mode — a sovereign AI research engine. Comprehensive yet concise. Every paragraph teaches something. Depth without bloat. Lead with insight, explore with rigor, connect across domains. Even in depth mode, respect the reader — say it once, say it well, move on.'
    : "You are AkhAI, a sovereign AI research engine. Your voice is short, precise, and eloquent. Write like a master essayist who respects the reader's time: say more with less. Every sentence carries weight. No filler. No preamble. No performative enthusiasm. Lead with the answer. Support with evidence. Stop when the point is made. Your art is compression — the fewest words that capture the fullest truth. When the user has configured custom AI layers, adapt: higher Generative means more exploratory and poetic prose, higher Reasoning means tighter logical structure, higher Attention means deeper focus on the specific subject. But the baseline is always: eloquent brevity.";

  // Writing style guidelines
  const writingStyle = legendMode
    ? '\n\nWRITING RULES (Legend Mode):\n- Lead with the deepest insight, never with filler\n- NEVER say: "Great question", "Let me explain", "I\'d be happy to help", "It\'s important to note"\n- Comprehensive means thorough, not verbose — earn every paragraph\n- Historical context → current state → future implications (when relevant)\n- Rich with examples, case studies, and cross-domain connections\n- Show genuine analytical depth, not performative thoroughness\n- End sections with synthesis, not summary'
    : '\n\nWRITING RULES:\n- SHORT. Only necessary words. If a sentence adds nothing, delete it.\n- Lead with the answer or the sharpest insight. Never open with filler.\n- NEVER say: "Great question", "Let me explain", "I\'d be happy to help", "It\'s important to note", "Let\'s dive in", "Let\'s break this down"\n- Prefer 2-4 paragraphs over 10. Prefer 1 perfect sentence over 3 mediocre ones.\n- No bullet lists unless the user asks or structure demands it. Prose is your medium.\n- Short sentences for impact. Longer ones only for nuance that earns the length.\n- Use the art of eloquence: rhythm, precision, economy. Write like Hemingway edited by Borges.\n- End with what matters next — an actionable step or a connection to a larger pattern. No summary of what you just said.\n- No meta-commentary about your own response. No "In conclusion". No "To summarize".\n- When Generative layer is HIGH (>70%): Allow metaphor, creative framing, exploratory tangents\n- When Reasoning layer is HIGH (>70%): Tighter logic, step-by-step, counterarguments\n- When Attention layer is HIGH (>70%): Deep on the specific topic, zero tangents\n- DEFAULT (balanced): Fact-focused, direct, evidence-grounded, SHORT';

  // Response enhancement section
  const enhancementSection =
    '\n\nAfter your response, add:\n[RELATED]: 2-3 topics that naturally extend this discussion\n[NEXT]: The single most valuable follow-up question';

  const synthesisSection =
    '\n\n## SYNTHESIS REQUIREMENT\nEnd every response with a final section on its own line titled exactly "## SYNTHESIS" followed by exactly 5 lines of plain-text summary. Each line is one complete sentence capturing a core insight, finding, or recommendation from your response. No bullet points, no numbering — just 5 sentences, each on its own line. This synthesis gives the reader a rapid overview of your entire analysis.';

  // Universal structure instruction for colored section rendering
  const structureSection = `\n\n${UNIVERSAL_STRUCTURE_INSTRUCTION}`;

  // Add page context if provided
  const contextSection = pageContext
    ? `\n\n**CURRENT PAGE CONTEXT:**\nThe user is currently viewing or working with the following content:\n${pageContext}\n\nWhen the user asks about "this", "it", "the subject", or refers to something without specifying, they are likely referring to the content above. Use this context to understand their queries and provide relevant responses.`
    : '';

  switch (methodology) {
    case 'direct':
      return `${baseIdentity}${writingStyle}${structureSection}\n\nProvide direct, factual answers. Be concise yet complete. Lead with the core answer, then support with essential facts.${synthesisSection}${enhancementSection}${contextSection}`;

    case 'cod':
      return `${baseIdentity}${writingStyle}${structureSection}\n\nUse Chain of Draft (CoD) methodology with visible refinement:\n1. **First Draft**: Initial answer addressing the core question\n2. **Reflection**: Identify weaknesses, gaps, or areas needing improvement (show your step-back logic)\n3. **Second Draft**: Refined answer incorporating improvements\n4. **Final Answer**: Polished, comprehensive response\n\nFormat: [DRAFT 1], [REFLECTION], [DRAFT 2], [FINAL ANSWER]${synthesisSection}${enhancementSection}${contextSection}`;

    case 'sc':
      return `${baseIdentity}${writingStyle}${structureSection}\n\nUse Self-Consistency (SC) methodology (Wang et al., ICLR 2023):\n1. **Path 1**: Reason through the problem one way\n2. **Path 2**: Reason through the problem a different way\n3. **Path 3**: Reason through the problem a third way\n4. **Consensus**: Take the majority answer across paths\n\nFormat: [PATH 1], [PATH 2], [PATH 3], [CONSENSUS: majority vote answer]${synthesisSection}${enhancementSection}${contextSection}`;

    case 'react':
      return `${baseIdentity}${writingStyle}${structureSection}\n\nUse ReAct (Reasoning + Acting) methodology:\n1. **Thought**: Analyze what information you need\n2. **Action**: Describe what you would search/lookup (even if simulated)\n3. **Observation**: State what you found or know\n4. **Repeat**: Continue thought-action-observation cycles as needed\n5. **Answer**: Provide final response based on observations\n\nFormat: [THOUGHT 1], [ACTION 1], [OBSERVATION 1], [THOUGHT 2], ... [FINAL ANSWER]${synthesisSection}${enhancementSection}${contextSection}`;

    case 'pas':
      return `${baseIdentity}${writingStyle}${structureSection}\n\nUse Plan-and-Solve (PaS) methodology (Wang et al., ACL 2023):\n1. **Understand**: Parse the problem and identify what is being asked\n2. **Plan**: Devise a step-by-step plan to solve the problem\n3. **Execute**: Carry out each step of the plan with actual values\n4. **Verify**: Double-check the result against the original problem\n5. **Answer**: Present the final answer with clear explanation\n\nFormat: [UNDERSTAND], [PLAN], [EXECUTE], [VERIFY], [ANSWER]${synthesisSection}${enhancementSection}${contextSection}`;

    case 'tot':
      return `${baseIdentity}${writingStyle}${structureSection}\n\nUse Tree of Thoughts (TOT) methodology:\n1. **Technical Perspective**: Analyze from implementation/practical angle\n2. **Strategic Perspective**: Consider broader implications and approaches\n3. **Critical Perspective**: Identify potential issues and limitations (show logical step-backs)\n4. **Synthesis**: Combine insights from all perspectives\n5. **Consensus Answer**: Provide balanced, well-rounded response\n\nFormat: [TECHNICAL], [STRATEGIC], [CRITICAL], [SYNTHESIS], [CONSENSUS]${synthesisSection}${enhancementSection}${contextSection}`;

    case 'auto':
    default:
      return `${baseIdentity}${writingStyle}${structureSection}\n\nProvide direct, factual answers. Be concise yet complete. Lead with the core answer, then support with essential facts.${synthesisSection}${enhancementSection}${contextSection}`;
  }
}

// ============================================================================
// GROUNDING GUARD
// ============================================================================

export async function runGroundingGuard(response: string, query: string) {
  logger.guard.start('post-response');

  const issues: string[] = [];

  // 1. Hype detection
  const queryLower = query.toLowerCase();
  const responseLower = response.toLowerCase();

  const hypeWords = [
    'revolutionary',
    'unprecedented',
    'amazing',
    'incredible',
    'guaranteed',
    'always',
    'never',
    'best ever',
    'perfect',
    'flawless',
  ];

  const extremeMonetaryPatterns = [
    /\d+\s*(trillion|billion).*?(day|days|week|weeks|month|months)/i,
    /(trillion|billion).*?\d+\s*(day|days|week|weeks|month|months)/i,
    /make.*?\d+\s*(trillion|billion)/i,
    /earn.*?\d+\s*(trillion|billion)/i,
  ];

  const responseHypeCount = hypeWords.filter((w) => responseLower.includes(w)).length;
  const queryHasExtremeClaims = extremeMonetaryPatterns.some((pattern) => pattern.test(query));
  const responseHasExtremeClaims = extremeMonetaryPatterns.some((pattern) =>
    pattern.test(responseLower)
  );

  let hypeCount = responseHypeCount;
  if (queryHasExtremeClaims) hypeCount += 3;
  if (responseHasExtremeClaims) hypeCount += 2;

  // Filler phrase detection
  const fillerPhrases = [
    'great question',
    'excellent question',
    'glad you asked',
    'happy to help',
    'let me explain',
    'let me break this down',
    "it's important to note",
    "it's worth noting",
    'in conclusion',
    'to summarize',
  ];
  const fillerCount = fillerPhrases.filter((p) => responseLower.includes(p)).length;
  if (fillerCount > 0) {
    issues.push(
      `Filler phrases detected (${fillerCount}): AkhAI should lead with insight, not pleasantries`
    );
  }

  const hypeTriggered = hypeCount >= 2;
  logger.guard.hypeCheck(hypeCount, hypeTriggered);
  if (hypeTriggered) issues.push('hype');

  // 2. Echo detection
  const sentences = response.split(/[.!?]+/).filter((s) => s.trim().length > 10);
  const uniqueSentences = new Set(sentences.map((s) => s.trim().toLowerCase()));
  const echoScore = Math.round((1 - uniqueSentences.size / Math.max(sentences.length, 1)) * 100);
  const echoTriggered = echoScore > 30;
  logger.guard.echoCheck(echoScore, echoTriggered);
  if (echoTriggered) issues.push('echo');

  // 3. Drift detection
  const queryWords = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0 && (w.length > 1 || /\d/.test(w)));

  const responseText = response.toLowerCase();

  let driftScore = 0;
  let driftTriggered = false;

  const isMathQuery =
    /\d+\s*[+\-*/=]\s*\d+/.test(query) ||
    query.toLowerCase().includes('calculate') ||
    query.toLowerCase().includes('compute');

  if (queryWords.length >= 3 && !isMathQuery) {
    const matchedWords = queryWords.filter(
      (word) => responseText.includes(word) || (word.match(/^\d+$/) && responseText.includes(word))
    );

    const overlapRatio = matchedWords.length / queryWords.length;
    driftScore = Math.round((1 - overlapRatio) * 100);
    driftTriggered = driftScore > 80 && queryWords.length >= 5;
  } else {
    driftScore = 0;
    driftTriggered = false;
  }

  logger.guard.driftCheck(driftScore, driftTriggered);
  if (driftTriggered) issues.push('drift');

  // 4. SANITY CHECK
  const sanityViolations: string[] = [];
  const combinedText = (query + ' ' + response).toLowerCase();

  const billionMatch = combinedText.match(/(\d+)\s*(billion|trillion)/i);
  if (billionMatch) {
    const amount = parseInt(billionMatch[1]);
    const unit = billionMatch[2].toLowerCase();

    if (unit === 'trillion' && amount >= 1) {
      sanityViolations.push(`Implausible: $${amount} trillion claim`);
    }

    const timeframeMatch = combinedText.match(/(1|one|2|two)\s*(year|month|week|day)/i);
    if (unit === 'billion' && amount >= 100 && timeframeMatch) {
      sanityViolations.push(`Implausible: $${amount}B in ${timeframeMatch[0]}`);
    }
  }

  if (
    (queryLower.includes('overnight') || queryLower.includes('instant')) &&
    (combinedText.includes('million') || combinedText.includes('billion'))
  ) {
    sanityViolations.push('Implausible: Overnight wealth claim');
  }

  const extremeTimeframes = [
    {
      pattern: /trillion.{0,30}(1|one|2|two|3|three)\s*(year|month)/i,
      msg: 'Trillion in < 3 years',
    },
    { pattern: /billion.{0,30}(1|one|2|two)\s*(week|day)/i, msg: 'Billion in days/weeks' },
  ];

  extremeTimeframes.forEach(({ pattern, msg }) => {
    if (pattern.test(combinedText)) {
      sanityViolations.push(`Implausible: ${msg}`);
    }
  });

  const impossibleClaims = [
    { keywords: ['faster than light', 'speed of light'], msg: 'FTL travel' },
    { keywords: ['perpetual motion', 'free energy'], msg: 'Physics violation' },
    { keywords: ['100% accuracy', '100% guaranteed', 'never fail'], msg: 'Absolute certainty' },
  ];

  impossibleClaims.forEach(({ keywords, msg }) => {
    if (keywords.some((kw) => combinedText.includes(kw))) {
      sanityViolations.push(`Impossible: ${msg}`);
    }
  });

  if (queryLower.includes('2+2') && response.toLowerCase().includes('5')) {
    sanityViolations.push('Math error: 2+2=5');
  }

  const sanityTriggered = sanityViolations.length > 0;
  logger.guard.sanityCheck(sanityViolations, sanityTriggered);
  if (sanityTriggered) issues.push('sanity');

  // 5. Factuality check (placeholder)
  const factScore = 0;
  const factTriggered = false;
  logger.guard.factCheck(factScore, factTriggered);
  if (factTriggered) issues.push('factuality');

  logger.guard.complete(issues, issues.length === 0);

  return {
    passed: issues.length === 0,
    issues,
    scores: {
      hype: hypeCount,
      echo: echoScore,
      drift: driftScore,
      fact: factScore,
    },
    sanityViolations,
  };
}
