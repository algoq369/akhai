/**
 * USER GNOSIS ENGINE - Deep User Understanding
 * 
 * Gnosis (γνῶσις) means "knowledge through experience"
 * 
 * This module builds a deep understanding of each user through:
 * - Communication style analysis
 * - Worldview mapping
 * - Learning preference detection
 * - Interaction pattern recognition
 * - Evolution tracking over time
 * 
 * The goal: AkhAI should understand users better with each interaction,
 * adapting its responses to serve them more effectively.
 * 
 * @module user-gnosis
 */

import { db } from './database';
import { randomBytes } from 'crypto';

// =============================================================================
// INTERFACES
// =============================================================================

/**
 * Complete User Gnosis Profile
 */
export interface UserGnosisProfile {
  id: string;
  userId: string;
  
  // Communication Analysis
  communicationStyle: CommunicationStyle;
  
  // Worldview Mapping
  worldview: WorldviewMap;
  
  // Learning Preferences
  learningPreferences: LearningPreferences;
  
  // Interaction Patterns
  interactionPattern: InteractionPattern;
  
  // Confidence in each assessment
  confidenceScores: ConfidenceScores;
  
  // Metadata
  interactionCount: number;
  totalTokensExchanged: number;
  firstInteraction: Date;
  lastInteraction: Date;
  lastProfileUpdate: Date;
}

/**
 * How the user communicates
 */
export interface CommunicationStyle {
  // Formality level (0 = casual, 1 = formal)
  formality: number;
  
  // Technical depth (0 = layman, 1 = expert)
  technicality: number;
  
  // Emotional expression (0 = reserved, 1 = expressive)
  emotionality: number;
  
  // Abstract vs concrete (0 = concrete, 1 = abstract)
  abstractness: number;
  
  // Response tempo preference
  tempo: 'fast' | 'measured' | 'contemplative';
  
  // Preferred response length
  preferredLength: 'concise' | 'moderate' | 'detailed';
  
  // Language patterns
  languagePatterns: {
    usesEmojis: boolean;
    usesSlang: boolean;
    usesJargon: string[]; // Domain-specific terms they use
    averageSentenceLength: number;
    questionFrequency: number; // How often they ask questions
  };
}

/**
 * How the user sees the world
 */
export interface WorldviewMap {
  // Dominant metaphors they use
  dominantMetaphors: MetaphorPattern[];
  
  // Core values detected
  valueSystem: ValueIndicator[];
  
  // Knowledge domains (expertise areas)
  knowledgeDomains: KnowledgeDomain[];
  
  // Potential blind spots
  blindSpots: string[];
  
  // Philosophical leanings
  philosophicalLeanings: string[];
  
  // Cultural context indicators
  culturalContext: {
    timeZoneRegion: string | null;
    languageStyle: string;
    referenceFrameworks: string[]; // e.g., "tech startup", "academic", "spiritual"
  };
}

export interface MetaphorPattern {
  domain: string; // e.g., "war", "journey", "building"
  frequency: number;
  examples: string[];
}

export interface ValueIndicator {
  value: string;
  strength: number;
  evidence: string[];
}

export interface KnowledgeDomain {
  domain: string;
  expertise: 'novice' | 'intermediate' | 'advanced' | 'expert';
  topics: string[];
  lastDiscussed: Date;
}

/**
 * How the user prefers to learn
 */
export interface LearningPreferences {
  // Visual vs textual learning
  visualVsTextual: number; // 0 = textual, 1 = visual
  
  // Theoretical vs practical
  theoreticalVsPractical: number; // 0 = practical, 1 = theoretical
  
  // Breadth vs depth
  breadthVsDepth: number; // 0 = depth, 1 = breadth
  
  // Structured vs organic
  structuredVsOrganic: number; // 0 = organic, 1 = structured
  
  // Examples preference
  examplesPreference: 'few' | 'moderate' | 'many';
  
  // Code preference (for technical users)
  codePreference: {
    prefersFunctional: boolean;
    prefersTypes: boolean;
    preferredLanguages: string[];
  };
  
  // Explanation style
  explanationStyle: {
    prefersAnalogies: boolean;
    prefersStepByStep: boolean;
    prefersHighLevelFirst: boolean;
    toleratesAmbiguity: number; // 0 = needs certainty, 1 = comfortable with ambiguity
  };
}

/**
 * How the user interacts with AI
 */
export interface InteractionPattern {
  // Trust level in AI
  trustLevel: number; // 0 = skeptical, 1 = trusting
  
  // Expected AI role
  expectedRole: 'tool' | 'assistant' | 'collaborator' | 'teacher' | 'peer';
  
  // How much guidance vs autonomy they prefer
  preferredSovereignty: number; // 0 = AI leads, 1 = human leads
  
  // Feedback style preference
  feedbackStyle: 'direct' | 'gentle' | 'socratic';
  
  // Receptivity to being challenged
  challengeReceptivity: number; // 0 = prefers agreement, 1 = welcomes challenge
  
  // Session patterns
  sessionPatterns: {
    averageSessionLength: number; // minutes
    messagesPerSession: number;
    topicSwitchingFrequency: number;
    followUpFrequency: number;
  };
  
  // Emotional patterns
  emotionalPatterns: {
    frustrationTriggers: string[];
    appreciationTriggers: string[];
    engagementIndicators: string[];
  };
}

/**
 * Confidence in each assessment
 */
export interface ConfidenceScores {
  communicationStyle: number;
  worldview: number;
  learningPreferences: number;
  interactionPattern: number;
  overall: number;
}

/**
 * Evolution record - tracks growth over time
 */
export interface EvolutionRecord {
  id: string;
  userId: string;
  timestamp: Date;
  eventType: 'milestone' | 'adaptation' | 'insight' | 'preference_change';
  eventData: {
    description: string;
    previousValue?: any;
    newValue?: any;
    trigger?: string;
  };
  impact: number; // How much this changed understanding
}

// =============================================================================
// ANALYSIS FUNCTIONS
// =============================================================================

/**
 * Analyze a user's communication style from their message
 */
function analyzeCommunicationStyle(
  message: string,
  existingStyle?: CommunicationStyle
): Partial<CommunicationStyle> {
  const words = message.split(/\s+/);
  const sentences = message.split(/[.!?]+/).filter(s => s.trim());
  
  // Formality detection
  const formalIndicators = message.match(/\b(please|kindly|would you|could you|I would appreciate|thank you)\b/gi) || [];
  const informalIndicators = message.match(/\b(hey|yo|gonna|wanna|kinda|sorta|lol|haha|btw)\b/gi) || [];
  const formality = Math.min(1, Math.max(0, 
    0.5 + (formalIndicators.length * 0.1) - (informalIndicators.length * 0.1)
  ));
  
  // Technicality detection
  const technicalTerms = message.match(/\b(api|function|algorithm|implementation|architecture|database|deployment|kubernetes|docker|async|typescript|react|node|python)\b/gi) || [];
  const technicality = Math.min(1, technicalTerms.length * 0.15);
  
  // Emotionality detection
  const emotionalWords = message.match(/\b(love|hate|amazing|terrible|excited|frustrated|worried|happy|sad|angry|anxious|thrilled)\b/gi) || [];
  const emojis = message.match(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]/gu) || [];
  const emotionality = Math.min(1, (emotionalWords.length * 0.15) + (emojis.length * 0.1));
  
  // Abstractness detection
  const abstractTerms = message.match(/\b(concept|theory|philosophy|principle|paradigm|framework|essence|fundamentally|metaphysically)\b/gi) || [];
  const concreteTerms = message.match(/\b(example|specifically|step|how to|tutorial|code|file|button|screen)\b/gi) || [];
  const abstractness = Math.min(1, Math.max(0,
    0.5 + (abstractTerms.length * 0.1) - (concreteTerms.length * 0.1)
  ));
  
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
      usesJargon: technicalTerms.map(t => t.toLowerCase()),
      averageSentenceLength: sentences.length > 0 ? words.length / sentences.length : words.length,
      questionFrequency: (message.match(/\?/g) || []).length / Math.max(1, sentences.length),
    },
  };
}

/**
 * Analyze worldview from message content
 */
function analyzeWorldview(
  message: string,
  existingWorldview?: WorldviewMap
): Partial<WorldviewMap> {
  const metaphors: MetaphorPattern[] = [];
  const values: ValueIndicator[] = [];
  const domains: string[] = [];
  
  // Detect metaphor domains
  const warMetaphors = message.match(/\b(battle|fight|strategy|win|lose|attack|defend|victory|defeat)\b/gi);
  if (warMetaphors && warMetaphors.length >= 2) {
    metaphors.push({ domain: 'war/conflict', frequency: warMetaphors.length, examples: warMetaphors.slice(0, 3) });
  }
  
  const journeyMetaphors = message.match(/\b(path|journey|road|step|milestone|destination|progress|advance)\b/gi);
  if (journeyMetaphors && journeyMetaphors.length >= 2) {
    metaphors.push({ domain: 'journey', frequency: journeyMetaphors.length, examples: journeyMetaphors.slice(0, 3) });
  }
  
  const buildingMetaphors = message.match(/\b(build|foundation|structure|architecture|framework|construct|design)\b/gi);
  if (buildingMetaphors && buildingMetaphors.length >= 2) {
    metaphors.push({ domain: 'building/construction', frequency: buildingMetaphors.length, examples: buildingMetaphors.slice(0, 3) });
  }
  
  // Detect values
  if (message.match(/\b(sovereign|independent|freedom|autonomy|self-reliant)\b/gi)) {
    values.push({ value: 'sovereignty/independence', strength: 0.8, evidence: ['Uses sovereignty language'] });
  }
  if (message.match(/\b(efficient|optimize|performance|fast|quick)\b/gi)) {
    values.push({ value: 'efficiency', strength: 0.7, evidence: ['Emphasizes speed/optimization'] });
  }
  if (message.match(/\b(quality|excellence|best|premium|careful)\b/gi)) {
    values.push({ value: 'quality', strength: 0.7, evidence: ['Emphasizes quality'] });
  }
  if (message.match(/\b(spiritual|gnostic|kabbala|esoteric|hermetic|mystical)\b/gi)) {
    values.push({ value: 'spirituality/esotericism', strength: 0.9, evidence: ['Uses esoteric terminology'] });
  }
  
  // Detect knowledge domains
  if (message.match(/\b(code|programming|software|api|function|typescript|react|python|database)\b/gi)) {
    domains.push('software development');
  }
  if (message.match(/\b(ai|machine learning|neural|model|training|inference|llm|gpt|claude)\b/gi)) {
    domains.push('artificial intelligence');
  }
  if (message.match(/\b(crypto|blockchain|bitcoin|ethereum|defi|web3|token)\b/gi)) {
    domains.push('cryptocurrency/blockchain');
  }
  if (message.match(/\b(kabbala|sefirot|tree of life|gnostic|hermetic|alchemy)\b/gi)) {
    domains.push('esoteric/kabbalistic');
  }
  
  return {
    dominantMetaphors: metaphors,
    valueSystem: values,
    knowledgeDomains: domains.map(d => ({
      domain: d,
      expertise: 'intermediate' as const,
      topics: [],
      lastDiscussed: new Date(),
    })),
    philosophicalLeanings: values.filter(v => 
      ['sovereignty/independence', 'spirituality/esotericism'].includes(v.value)
    ).map(v => v.value),
  };
}

/**
 * Analyze learning preferences from interactions
 */
function analyzeLearningPreferences(
  messages: string[],
  responses: string[],
  existingPrefs?: LearningPreferences
): Partial<LearningPreferences> {
  const allText = messages.join(' ');
  
  // Detect code preference
  const asksForCode = allText.match(/\b(code|example|implementation|snippet|show me|how to implement)\b/gi);
  const asksForTheory = allText.match(/\b(explain|why|concept|theory|understand|principle)\b/gi);
  
  const theoreticalVsPractical = asksForCode && asksForTheory
    ? (asksForTheory.length / (asksForCode.length + asksForTheory.length))
    : 0.5;
  
  // Detect depth preference
  const asksForDetails = allText.match(/\b(detail|deep|comprehensive|thorough|everything|complete)\b/gi);
  const asksForOverview = allText.match(/\b(quick|brief|summary|overview|simple|basic)\b/gi);
  
  const breadthVsDepth = asksForDetails && asksForOverview
    ? (asksForOverview.length / (asksForDetails.length + asksForOverview.length))
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
function analyzeInteractionPattern(
  messages: string[],
  timestamps: Date[],
  existingPattern?: InteractionPattern
): Partial<InteractionPattern> {
  const allText = messages.join(' ');
  
  // Trust level detection
  const skepticalPhrases = allText.match(/\b(are you sure|verify|double check|don't think|wrong|incorrect)\b/gi);
  const trustingPhrases = allText.match(/\b(thanks|great|perfect|exactly|trust|believe)\b/gi);
  
  const trustLevel = trustingPhrases && skepticalPhrases
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
  const challengeReceptivity = allText.match(/\b(but|however|disagree|alternative|other option)\b/gi)
    ? 0.7 : 0.4;
  
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
      followUpFrequency: messages.filter(m => m.match(/\b(also|another|follow up|additionally)\b/gi)).length / messages.length,
    },
  };
}

function calculateSessionLength(timestamps: Date[]): number {
  if (timestamps.length < 2) return 5;
  const first = timestamps[0].getTime();
  const last = timestamps[timestamps.length - 1].getTime();
  return Math.round((last - first) / 60000); // minutes
}

// =============================================================================
// PROFILE MANAGEMENT
// =============================================================================

/**
 * Create a new user gnosis profile
 */
function createUserGnosisProfile(userId: string): UserGnosisProfile {
  const now = new Date();
  
  return {
    id: randomBytes(16).toString('hex'),
    userId,
    
    communicationStyle: {
      formality: 0.5,
      technicality: 0.5,
      emotionality: 0.3,
      abstractness: 0.5,
      tempo: 'measured',
      preferredLength: 'moderate',
      languagePatterns: {
        usesEmojis: false,
        usesSlang: false,
        usesJargon: [],
        averageSentenceLength: 15,
        questionFrequency: 0.3,
      },
    },
    
    worldview: {
      dominantMetaphors: [],
      valueSystem: [],
      knowledgeDomains: [],
      blindSpots: [],
      philosophicalLeanings: [],
      culturalContext: {
        timeZoneRegion: null,
        languageStyle: 'neutral',
        referenceFrameworks: [],
      },
    },
    
    learningPreferences: {
      visualVsTextual: 0.5,
      theoreticalVsPractical: 0.5,
      breadthVsDepth: 0.5,
      structuredVsOrganic: 0.5,
      examplesPreference: 'moderate',
      codePreference: {
        prefersFunctional: false,
        prefersTypes: false,
        preferredLanguages: [],
      },
      explanationStyle: {
        prefersAnalogies: true,
        prefersStepByStep: true,
        prefersHighLevelFirst: true,
        toleratesAmbiguity: 0.5,
      },
    },
    
    interactionPattern: {
      trustLevel: 0.5,
      expectedRole: 'assistant',
      preferredSovereignty: 0.5,
      feedbackStyle: 'direct',
      challengeReceptivity: 0.5,
      sessionPatterns: {
        averageSessionLength: 10,
        messagesPerSession: 5,
        topicSwitchingFrequency: 0.3,
        followUpFrequency: 0.2,
      },
      emotionalPatterns: {
        frustrationTriggers: [],
        appreciationTriggers: [],
        engagementIndicators: [],
      },
    },
    
    confidenceScores: {
      communicationStyle: 0.1,
      worldview: 0.1,
      learningPreferences: 0.1,
      interactionPattern: 0.1,
      overall: 0.1,
    },
    
    interactionCount: 0,
    totalTokensExchanged: 0,
    firstInteraction: now,
    lastInteraction: now,
    lastProfileUpdate: now,
  };
}

/**
 * Update profile with new interaction data
 */
function updateUserGnosisProfile(
  profile: UserGnosisProfile,
  message: string,
  response: string
): UserGnosisProfile {
  const now = new Date();
  
  // Analyze communication style
  const styleAnalysis = analyzeCommunicationStyle(message, profile.communicationStyle);
  
  // Merge with existing (weighted average favoring recent)
  const weight = Math.min(0.3, 1 / (profile.interactionCount + 1));
  
  if (styleAnalysis.formality !== undefined) {
    profile.communicationStyle.formality = 
      profile.communicationStyle.formality * (1 - weight) + styleAnalysis.formality * weight;
  }
  if (styleAnalysis.technicality !== undefined) {
    profile.communicationStyle.technicality = 
      profile.communicationStyle.technicality * (1 - weight) + styleAnalysis.technicality * weight;
  }
  if (styleAnalysis.emotionality !== undefined) {
    profile.communicationStyle.emotionality = 
      profile.communicationStyle.emotionality * (1 - weight) + styleAnalysis.emotionality * weight;
  }
  if (styleAnalysis.abstractness !== undefined) {
    profile.communicationStyle.abstractness = 
      profile.communicationStyle.abstractness * (1 - weight) + styleAnalysis.abstractness * weight;
  }
  
  // Analyze worldview
  const worldviewAnalysis = analyzeWorldview(message, profile.worldview);
  
  if (worldviewAnalysis.dominantMetaphors) {
    // Merge metaphors
    for (const newMetaphor of worldviewAnalysis.dominantMetaphors) {
      const existing = profile.worldview.dominantMetaphors.find(m => m.domain === newMetaphor.domain);
      if (existing) {
        existing.frequency += newMetaphor.frequency;
        existing.examples = [...new Set([...existing.examples, ...newMetaphor.examples])].slice(0, 5);
      } else {
        profile.worldview.dominantMetaphors.push(newMetaphor);
      }
    }
  }
  
  if (worldviewAnalysis.valueSystem) {
    for (const newValue of worldviewAnalysis.valueSystem) {
      const existing = profile.worldview.valueSystem.find(v => v.value === newValue.value);
      if (existing) {
        existing.strength = Math.min(1, existing.strength + 0.1);
        existing.evidence = [...new Set([...existing.evidence, ...newValue.evidence])].slice(0, 5);
      } else {
        profile.worldview.valueSystem.push(newValue);
      }
    }
  }
  
  if (worldviewAnalysis.knowledgeDomains) {
    for (const newDomain of worldviewAnalysis.knowledgeDomains) {
      const existing = profile.worldview.knowledgeDomains.find(d => d.domain === newDomain.domain);
      if (existing) {
        existing.lastDiscussed = now;
        // Could upgrade expertise based on demonstrated knowledge
      } else {
        profile.worldview.knowledgeDomains.push(newDomain);
      }
    }
  }
  
  // Update confidence scores
  profile.confidenceScores.communicationStyle = Math.min(0.95, 
    profile.confidenceScores.communicationStyle + 0.05
  );
  profile.confidenceScores.worldview = Math.min(0.95,
    profile.confidenceScores.worldview + 0.03
  );
  profile.confidenceScores.overall = (
    profile.confidenceScores.communicationStyle +
    profile.confidenceScores.worldview +
    profile.confidenceScores.learningPreferences +
    profile.confidenceScores.interactionPattern
  ) / 4;
  
  // Update metadata
  profile.interactionCount++;
  profile.totalTokensExchanged += message.length + response.length;
  profile.lastInteraction = now;
  profile.lastProfileUpdate = now;
  
  return profile;
}

// =============================================================================
// DATABASE OPERATIONS
// =============================================================================

/**
 * Load user gnosis profile from database
 */
async function loadUserGnosisProfile(userId: string): Promise<UserGnosisProfile | null> {
  try {
    const row = await db.prepare(`
      SELECT * FROM user_gnosis_profiles WHERE user_id = ?
    `).get(userId) as any;
    
    if (!row) return null;
    
    return {
      id: row.id,
      userId: row.user_id,
      communicationStyle: JSON.parse(row.communication_style || '{}'),
      worldview: JSON.parse(row.worldview || '{}'),
      learningPreferences: JSON.parse(row.learning_preferences || '{}'),
      interactionPattern: JSON.parse(row.interaction_pattern || '{}'),
      confidenceScores: JSON.parse(row.confidence_scores || '{}'),
      interactionCount: row.interaction_count || 0,
      totalTokensExchanged: row.total_tokens || 0,
      firstInteraction: new Date(row.first_interaction || Date.now()),
      lastInteraction: new Date(row.last_interaction || Date.now()),
      lastProfileUpdate: new Date(row.updated_at || Date.now()),
    };
  } catch (error) {
    console.warn('[UserGnosis] Failed to load profile:', error);
    return null;
  }
}

/**
 * Save user gnosis profile to database
 */
async function saveUserGnosisProfile(profile: UserGnosisProfile): Promise<void> {
  try {
    await db.prepare(`
      INSERT INTO user_gnosis_profiles (
        id, user_id, communication_style, worldview, learning_preferences,
        interaction_pattern, confidence_scores, interaction_count, total_tokens,
        first_interaction, last_interaction, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        communication_style = excluded.communication_style,
        worldview = excluded.worldview,
        learning_preferences = excluded.learning_preferences,
        interaction_pattern = excluded.interaction_pattern,
        confidence_scores = excluded.confidence_scores,
        interaction_count = excluded.interaction_count,
        total_tokens = excluded.total_tokens,
        last_interaction = excluded.last_interaction,
        updated_at = excluded.updated_at
    `).run(
      profile.id,
      profile.userId,
      JSON.stringify(profile.communicationStyle),
      JSON.stringify(profile.worldview),
      JSON.stringify(profile.learningPreferences),
      JSON.stringify(profile.interactionPattern),
      JSON.stringify(profile.confidenceScores),
      profile.interactionCount,
      profile.totalTokensExchanged,
      profile.firstInteraction.toISOString(),
      profile.lastInteraction.toISOString(),
      profile.firstInteraction.toISOString(),
      profile.lastProfileUpdate.toISOString()
    );
  } catch (error) {
    console.warn('[UserGnosis] Failed to save profile:', error);
  }
}

/**
 * Record an evolution event
 */
async function recordEvolution(
  userId: string,
  eventType: EvolutionRecord['eventType'],
  eventData: EvolutionRecord['eventData'],
  impact: number
): Promise<void> {
  try {
    await db.prepare(`
      INSERT INTO user_evolution_records (
        id, user_id, event_type, event_data, insight, impact_score, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      randomBytes(16).toString('hex'),
      userId,
      eventType,
      JSON.stringify(eventData),
      eventData.description,
      impact,
      new Date().toISOString()
    );
  } catch (error) {
    console.warn('[UserGnosis] Failed to record evolution:', error);
  }
}

/**
 * Get evolution history for a user
 */
async function getEvolutionHistory(
  userId: string,
  limit: number = 50
): Promise<EvolutionRecord[]> {
  try {
    const rows = await db.prepare(`
      SELECT * FROM user_evolution_records 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `).all(userId, limit) as any[];
    
    return rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      timestamp: new Date(row.created_at),
      eventType: row.event_type,
      eventData: JSON.parse(row.event_data || '{}'),
      impact: row.impact_score,
    }));
  } catch (error) {
    console.warn('[UserGnosis] Failed to get evolution history:', error);
    return [];
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  createUserGnosisProfile,
  updateUserGnosisProfile,
  loadUserGnosisProfile,
  saveUserGnosisProfile,
  analyzeCommunicationStyle,
  analyzeWorldview,
  analyzeLearningPreferences,
  analyzeInteractionPattern,
  recordEvolution,
  getEvolutionHistory,
};
