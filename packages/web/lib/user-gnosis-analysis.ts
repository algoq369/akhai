/**
 * USER GNOSIS ENGINE - Analysis Functions
 *
 * Communication style, worldview, learning preference,
 * and interaction pattern analysis.
 *
 * @module user-gnosis-analysis
 */

import type {
  CommunicationStyle,
  WorldviewMap,
  MetaphorPattern,
  ValueIndicator,
  LearningPreferences,
  InteractionPattern,
} from './user-gnosis-types';

// =============================================================================
// ANALYSIS FUNCTIONS
// =============================================================================

/**
 * Analyze a user's communication style from their message
 */
export function analyzeCommunicationStyle(
  message: string,
  existingStyle?: CommunicationStyle
): Partial<CommunicationStyle> {
  const words = message.split(/\s+/);
  const sentences = message.split(/[.!?]+/).filter((s) => s.trim());

  // Formality detection
  const formalIndicators =
    message.match(/\b(please|kindly|would you|could you|I would appreciate|thank you)\b/gi) || [];
  const informalIndicators =
    message.match(/\b(hey|yo|gonna|wanna|kinda|sorta|lol|haha|btw)\b/gi) || [];
  const formality = Math.min(
    1,
    Math.max(0, 0.5 + formalIndicators.length * 0.1 - informalIndicators.length * 0.1)
  );

  // Technicality detection
  const technicalTerms =
    message.match(
      /\b(api|function|algorithm|implementation|architecture|database|deployment|kubernetes|docker|async|typescript|react|node|python)\b/gi
    ) || [];
  const technicality = Math.min(1, technicalTerms.length * 0.15);

  // Emotionality detection
  const emotionalWords =
    message.match(
      /\b(love|hate|amazing|terrible|excited|frustrated|worried|happy|sad|angry|anxious|thrilled)\b/gi
    ) || [];
  const emojis = message.match(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]/gu) || [];
  const emotionality = Math.min(1, emotionalWords.length * 0.15 + emojis.length * 0.1);

  // Abstractness detection
  const abstractTerms =
    message.match(
      /\b(concept|theory|philosophy|principle|paradigm|framework|essence|fundamentally|metaphysically)\b/gi
    ) || [];
  const concreteTerms =
    message.match(/\b(example|specifically|step|how to|tutorial|code|file|button|screen)\b/gi) ||
    [];
  const abstractness = Math.min(
    1,
    Math.max(0, 0.5 + abstractTerms.length * 0.1 - concreteTerms.length * 0.1)
  );

  // Length preference
  let preferredLength: CommunicationStyle['preferredLength'] = 'moderate';
  if (words.length < 20) preferredLength = 'concise';
  if (words.length > 100) preferredLength = 'detailed';

  // Tempo (based on punctuation and structure)
  let tempo: CommunicationStyle['tempo'] = 'measured';
  if (message.match(/\?.*\?.*\?/)) tempo = 'fast'; // Multiple questions
  if (message.match(/\.\.\./g)) tempo = 'contemplative';

  return {
    formality,
    technicality,
    emotionality,
    abstractness,
    preferredLength,
    tempo,
    languagePatterns: {
      usesEmojis: emojis.length > 0,
      usesSlang: informalIndicators.length > 2,
      usesJargon: technicalTerms.map((t) => t.toLowerCase()),
      averageSentenceLength: sentences.length > 0 ? words.length / sentences.length : words.length,
      questionFrequency: (message.match(/\?/g) || []).length / Math.max(1, sentences.length),
    },
  };
}

/**
 * Analyze worldview from message content
 */
export function analyzeWorldview(
  message: string,
  existingWorldview?: WorldviewMap
): Partial<WorldviewMap> {
  const metaphors: MetaphorPattern[] = [];
  const values: ValueIndicator[] = [];
  const domains: string[] = [];

  // Detect metaphor domains
  const warMetaphors = message.match(
    /\b(battle|fight|strategy|win|lose|attack|defend|victory|defeat)\b/gi
  );
  if (warMetaphors && warMetaphors.length >= 2) {
    metaphors.push({
      domain: 'war/conflict',
      frequency: warMetaphors.length,
      examples: warMetaphors.slice(0, 3),
    });
  }

  const journeyMetaphors = message.match(
    /\b(path|journey|road|step|milestone|destination|progress|advance)\b/gi
  );
  if (journeyMetaphors && journeyMetaphors.length >= 2) {
    metaphors.push({
      domain: 'journey',
      frequency: journeyMetaphors.length,
      examples: journeyMetaphors.slice(0, 3),
    });
  }

  const buildingMetaphors = message.match(
    /\b(build|foundation|structure|architecture|framework|construct|design)\b/gi
  );
  if (buildingMetaphors && buildingMetaphors.length >= 2) {
    metaphors.push({
      domain: 'building/construction',
      frequency: buildingMetaphors.length,
      examples: buildingMetaphors.slice(0, 3),
    });
  }

  // Detect values
  if (message.match(/\b(sovereign|independent|freedom|autonomy|self-reliant)\b/gi)) {
    values.push({
      value: 'sovereignty/independence',
      strength: 0.8,
      evidence: ['Uses sovereignty language'],
    });
  }
  if (message.match(/\b(efficient|optimize|performance|fast|quick)\b/gi)) {
    values.push({
      value: 'efficiency',
      strength: 0.7,
      evidence: ['Emphasizes speed/optimization'],
    });
  }
  if (message.match(/\b(quality|excellence|best|premium|careful)\b/gi)) {
    values.push({ value: 'quality', strength: 0.7, evidence: ['Emphasizes quality'] });
  }
  if (message.match(/\b(spiritual|gnostic|kabbala|esoteric|hermetic|mystical)\b/gi)) {
    values.push({
      value: 'spirituality/esotericism',
      strength: 0.9,
      evidence: ['Uses esoteric terminology'],
    });
  }

  // Detect knowledge domains
  if (
    message.match(/\b(code|programming|software|api|function|typescript|react|python|database)\b/gi)
  ) {
    domains.push('software development');
  }
  if (message.match(/\b(ai|machine learning|neural|model|training|inference|llm|gpt|claude)\b/gi)) {
    domains.push('artificial intelligence');
  }
  if (message.match(/\b(crypto|blockchain|bitcoin|ethereum|defi|web3|token)\b/gi)) {
    domains.push('cryptocurrency/blockchain');
  }
  if (message.match(/\b(kabbala|layers|tree of life|gnostic|hermetic|alchemy)\b/gi)) {
    domains.push('esoteric/kabbalistic');
  }

  return {
    dominantMetaphors: metaphors,
    valueSystem: values,
    knowledgeDomains: domains.map((d) => ({
      domain: d,
      expertise: 'intermediate' as const,
      topics: [],
      lastDiscussed: new Date(),
    })),
    philosophicalLeanings: values
      .filter((v) => ['sovereignty/independence', 'spirituality/esotericism'].includes(v.value))
      .map((v) => v.value),
  };
}

/**
 * Analyze learning preferences from interactions
 */
export function analyzeLearningPreferences(
  messages: string[],
  responses: string[],
  existingPrefs?: LearningPreferences
): Partial<LearningPreferences> {
  const allText = messages.join(' ');

  // Detect code preference
  const asksForCode = allText.match(
    /\b(code|example|implementation|snippet|show me|how to implement)\b/gi
  );
  const asksForTheory = allText.match(/\b(explain|why|concept|theory|understand|principle)\b/gi);

  const theoreticalVsPractical =
    asksForCode && asksForTheory
      ? asksForTheory.length / (asksForCode.length + asksForTheory.length)
      : 0.5;

  // Detect depth preference
  const asksForDetails = allText.match(
    /\b(detail|deep|comprehensive|thorough|everything|complete)\b/gi
  );
  const asksForOverview = allText.match(/\b(quick|brief|summary|overview|simple|basic)\b/gi);

  const breadthVsDepth =
    asksForDetails && asksForOverview
      ? asksForOverview.length / (asksForDetails.length + asksForOverview.length)
      : 0.5;

  // Detect structure preference
  const asksForSteps = allText.match(/\b(step|steps|guide|walkthrough|tutorial|order)\b/gi);
  const structuredVsOrganic = asksForSteps ? Math.min(1, asksForSteps.length * 0.2) : 0.5;

  // Detect examples preference
  let examplesPreference: LearningPreferences['examplesPreference'] = 'moderate';
  const exampleRequests = allText.match(/\b(example|for example|e\.g\.|instance|show me)\b/gi);
  if (exampleRequests && exampleRequests.length > 3) examplesPreference = 'many';
  if (!exampleRequests || exampleRequests.length === 0) examplesPreference = 'few';

  return {
    theoreticalVsPractical,
    breadthVsDepth,
    structuredVsOrganic,
    examplesPreference,
    explanationStyle: {
      prefersAnalogies: !!allText.match(/\b(like|similar to|analogy|metaphor)\b/gi),
      prefersStepByStep: !!asksForSteps,
      prefersHighLevelFirst: !!asksForOverview,
      toleratesAmbiguity: asksForDetails ? 0.3 : 0.7,
    },
  };
}

/**
 * Analyze interaction patterns
 */
export function analyzeInteractionPattern(
  messages: string[],
  timestamps: Date[],
  existingPattern?: InteractionPattern
): Partial<InteractionPattern> {
  const allText = messages.join(' ');

  // Trust level detection
  const skepticalPhrases = allText.match(
    /\b(are you sure|verify|double check|don't think|wrong|incorrect)\b/gi
  );
  const trustingPhrases = allText.match(/\b(thanks|great|perfect|exactly|trust|believe)\b/gi);

  const trustLevel =
    trustingPhrases && skepticalPhrases
      ? Math.min(1, Math.max(0, 0.5 + (trustingPhrases.length - skepticalPhrases.length) * 0.1))
      : 0.5;

  // Expected role detection
  let expectedRole: InteractionPattern['expectedRole'] = 'assistant';
  if (allText.match(/\b(teach|explain|help me understand|what is|how does)\b/gi)) {
    expectedRole = 'teacher';
  }
  if (allText.match(/\b(let's|we could|together|collaborate|brainstorm)\b/gi)) {
    expectedRole = 'collaborator';
  }
  if (allText.match(/\b(just|quickly|do this|generate|create)\b/gi)) {
    expectedRole = 'tool';
  }

  // Sovereignty preference
  const directiveCount = allText.match(/\b(do|make|create|write|generate)\b/gi)?.length || 0;
  const questionCount = allText.match(/\?/g)?.length || 0;
  const preferredSovereignty = directiveCount > questionCount ? 0.8 : 0.4;

  // Feedback style preference
  let feedbackStyle: InteractionPattern['feedbackStyle'] = 'direct';
  if (allText.match(/\b(perhaps|maybe|might|could consider)\b/gi)) {
    feedbackStyle = 'gentle';
  }
  if (allText.match(/\b(why|what if|have you considered|think about)\b/gi)) {
    feedbackStyle = 'socratic';
  }

  // Challenge receptivity
  const challengeReceptivity = allText.match(
    /\b(but|however|disagree|alternative|other option)\b/gi
  )
    ? 0.7
    : 0.4;

  return {
    trustLevel,
    expectedRole,
    preferredSovereignty,
    feedbackStyle,
    challengeReceptivity,
    sessionPatterns: {
      averageSessionLength: calculateSessionLength(timestamps),
      messagesPerSession: messages.length,
      topicSwitchingFrequency: 0.3, // Would need topic detection
      followUpFrequency:
        messages.filter((m) => m.match(/\b(also|another|follow up|additionally)\b/gi)).length /
        messages.length,
    },
  };
}

export function calculateSessionLength(timestamps: Date[]): number {
  if (timestamps.length < 2) return 5;
  const first = timestamps[0].getTime();
  const last = timestamps[timestamps.length - 1].getTime();
  return Math.round((last - first) / 60000); // minutes
}
