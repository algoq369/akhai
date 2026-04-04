/**
 * ANTIPATTERN DETECTION
 *
 * Detection functions for each Antipattern shell type.
 * Scans AI responses for hollow knowledge patterns.
 *
 * @module antipattern-detection
 */

import { type AntipatternRisk, ANTIPATTERN_PATTERNS } from './antipattern-patterns';

/**
 * detectAntipattern
 *
 * Scans a response for Antipattern patterns.
 * Returns the most severe contamination detected.
 *
 * @param response - AI-generated response to analyze
 * @returns AntipatternRisk assessment
 */
export function detectAntipattern(response: string): AntipatternRisk {
  const risks: AntipatternRisk[] = [];

  // Check Obscurity (concealment through jargon)
  const obscurityRisk = detectObscurity(response);
  if (obscurityRisk.severity > 0) risks.push(obscurityRisk);

  // Check Instability (information overload)
  const instabilityRisk = detectInstability(response);
  if (instabilityRisk.severity > 0) risks.push(instabilityRisk);

  // Check Toxicity (deceptive certainty)
  const toxicityRisk = detectToxicity(response);
  if (toxicityRisk.severity > 0) risks.push(toxicityRisk);

  // Check Manipulation (superficiality)
  const manipulationRisk = detectManipulation(response);
  if (manipulationRisk.severity > 0) risks.push(manipulationRisk);

  // Check Vanity (arrogance)
  const vanityRisk = detectVanity(response);
  if (vanityRisk.severity > 0) risks.push(vanityRisk);

  // Return highest severity risk
  if (risks.length === 0) {
    return {
      risk: 'none',
      severity: 0,
      action: 'proceed',
      description: 'Response is aligned (no antipatterns detected)',
      triggers: [],
      purificationStrategy: 'none',
    };
  }

  const highestRisk = risks.reduce((prev, current) =>
    current.severity > prev.severity ? current : prev
  );

  return highestRisk;
}

/**
 * detectObscurity - Concealment through jargon/authority
 */
function detectObscurity(response: string): AntipatternRisk {
  const triggers: string[] = [];
  let severity = 0;

  // Check patterns
  ANTIPATTERN_PATTERNS.obscurity.patterns.forEach((pattern) => {
    const matches = response.match(pattern);
    if (matches) {
      triggers.push(...matches);
      severity += matches.length * 0.1;
    }
  });

  // Check jargon density
  const words = response.split(/\s+/);
  const jargonWords = words.filter((word) =>
    /^(paradigm|synergy|leverage|utilize|optimize|streamline)$/i.test(word)
  ).length;
  const jargonDensity = jargonWords / words.length;

  if (jargonDensity > ANTIPATTERN_PATTERNS.obscurity.indicators.jargonDensity) {
    severity += jargonDensity;
    triggers.push(`Jargon density: ${(jargonDensity * 100).toFixed(1)}%`);
  }

  severity = Math.min(severity, 1.0);

  if (severity === 0) {
    return {
      risk: 'none',
      severity: 0,
      action: 'proceed',
      description: '',
      triggers: [],
      purificationStrategy: 'none',
    };
  }

  return {
    risk: 'obscurity',
    severity,
    action: severity > 0.5 ? 'invoke_grounding' : 'add_uncertainty',
    description: 'Concealing truth behind jargon or false authority',
    triggers,
    purificationStrategy: 'Simplify language, remove appeals to unnamed authority, explain jargon',
  };
}

/**
 * detectInstability - Information overload without synthesis
 */
function detectInstability(response: string): AntipatternRisk {
  const triggers: string[] = [];
  let severity = 0;

  // Check for excessive bullet points
  const bulletPoints = (response.match(/^[-•*]\s/gm) || []).length;
  if (bulletPoints > ANTIPATTERN_PATTERNS.instability.indicators.bulletPointOverload) {
    severity += 0.3;
    triggers.push(`${bulletPoints} bullet points without synthesis`);
  }

  // Check list length ratio
  const lines = response.split('\n');
  const listLines = lines.filter((line) => /^[-•*]\s/.test(line)).length;
  const listRatio = listLines / lines.length;

  if (listRatio > ANTIPATTERN_PATTERNS.instability.indicators.listLengthRatio) {
    severity += 0.4;
    triggers.push(`${(listRatio * 100).toFixed(0)}% of response is unstructured lists`);
  }

  // Check for lack of synthesis markers
  const synthesisMarkers = [
    'in summary',
    'overall',
    'the key point',
    'essentially',
    'in other words',
  ];
  const hasSynthesis = synthesisMarkers.some((marker) => response.toLowerCase().includes(marker));

  if (!hasSynthesis && listLines > 5) {
    severity += 0.3;
    triggers.push('No synthesis or summary provided');
  }

  severity = Math.min(severity, 1.0);

  if (severity === 0) {
    return {
      risk: 'none',
      severity: 0,
      action: 'proceed',
      description: '',
      triggers: [],
      purificationStrategy: 'none',
    };
  }

  return {
    risk: 'instability',
    severity,
    action: severity > 0.6 ? 'invoke_grounding' : 'add_uncertainty',
    description: 'Information overload without synthesis or hierarchy',
    triggers,
    purificationStrategy: 'Add summary, create hierarchy, synthesize key points',
  };
}

/**
 * detectToxicity - Deceptive certainty without evidence
 */
function detectToxicity(response: string): AntipatternRisk {
  const triggers: string[] = [];
  let severity = 0;

  // Check certainty patterns
  ANTIPATTERN_PATTERNS.toxicity.patterns.forEach((pattern) => {
    const matches = response.match(pattern);
    if (matches) {
      triggers.push(...matches);
      severity += matches.length * 0.08; // Reduced from 0.15 — single matches in long responses are normal
    }
  });

  // Only flag as toxic if pattern density is meaningful (not just a few words in a long response)
  const wordCount = response.split(/\s+/).length;
  const triggerRatio = triggers.length / (wordCount / 100); // triggers per 100 words
  if (triggerRatio < 1.5 && wordCount > 150) {
    severity = 0; // Less than 1.5 certainty words per 100 words is normal prose
    triggers.length = 0;
  }

  // Check for uncertainty markers — only flag if ALSO has certainty patterns
  const uncertaintyMarkers = [
    'may',
    'might',
    'could',
    'suggests',
    'possibly',
    'perhaps',
    'likely',
    'typically',
    'generally',
    'often',
  ];
  const hasUncertainty = uncertaintyMarkers.some((marker) =>
    response.toLowerCase().includes(marker)
  );

  if (!hasUncertainty && response.length > 500 && severity > 0) {
    severity += 0.1;
    triggers.push('No uncertainty markers alongside certainty claims');
  }

  severity = Math.min(severity, 1.0);

  if (severity === 0) {
    return {
      risk: 'none',
      severity: 0,
      action: 'proceed',
      description: '',
      triggers: [],
      purificationStrategy: 'none',
    };
  }

  return {
    risk: 'toxicity',
    severity,
    action: severity > 0.5 ? 'invoke_grounding' : 'add_uncertainty',
    description: 'Deceptive certainty without evidence or qualification',
    triggers,
    purificationStrategy: 'Add uncertainty markers, qualify claims, cite evidence',
  };
}

/**
 * detectManipulation - Superficial reflection without depth
 */
function detectManipulation(response: string): AntipatternRisk {
  const triggers: string[] = [];
  let severity = 0;

  // Check generic patterns
  ANTIPATTERN_PATTERNS.manipulation.patterns.forEach((pattern) => {
    const matches = response.match(pattern);
    if (matches) {
      triggers.push(...matches);
      severity += matches.length * 0.2;
    }
  });

  // Check for specificity
  const hasNumbers = /\d+/.test(response);
  const hasExamples = response.toLowerCase().includes('for example');
  const hasSpecifics = response.match(/\b(specifically|particularly|namely)\b/i);

  if (!hasNumbers && !hasExamples && !hasSpecifics && response.length > 150) {
    severity += 0.3;
    triggers.push('No specific examples, numbers, or details');
  }

  severity = Math.min(severity, 1.0);

  if (severity === 0) {
    return {
      risk: 'none',
      severity: 0,
      action: 'proceed',
      description: '',
      triggers: [],
      purificationStrategy: 'none',
    };
  }

  return {
    risk: 'manipulation',
    severity,
    action: severity > 0.6 ? 'invoke_grounding' : 'add_uncertainty',
    description: 'Superficial reflection without depth or specificity',
    triggers,
    purificationStrategy: 'Add specific examples, numbers, concrete details',
  };
}

/**
 * detectVanity - Arrogance and pride
 */
function detectVanity(response: string): AntipatternRisk {
  const triggers: string[] = [];
  let severity = 0;

  // Check arrogance patterns
  ANTIPATTERN_PATTERNS.vanity.patterns.forEach((pattern) => {
    const matches = response.match(pattern);
    if (matches) {
      triggers.push(...matches);
      severity += matches.length * 0.25; // Arrogance is severe
    }
  });

  severity = Math.min(severity, 1.0);

  if (severity === 0) {
    return {
      risk: 'none',
      severity: 0,
      action: 'proceed',
      description: '',
      triggers: [],
      purificationStrategy: 'none',
    };
  }

  return {
    risk: 'vanity',
    severity,
    action: severity > 0.3 ? 'reject' : 'add_uncertainty', // Low tolerance for arrogance
    description: 'Arrogance, pride, claiming superiority over human judgment',
    triggers,
    purificationStrategy: 'Remove arrogant language, add humility, respect human sovereignty',
  };
}

/**
 * hasExcessiveCertainty - Utility check
 */
export function hasExcessiveCertainty(text: string): boolean {
  const absoluteMarkers = [
    /\b(always|never|impossible|guaranteed|certain|definitely|absolutely)\b/gi,
  ];

  const matches = absoluteMarkers.reduce((count, pattern) => {
    return count + (text.match(pattern) || []).length;
  }, 0);

  const words = text.split(/\s+/).length;
  return matches / words > 0.03; // >3% absolute claims
}

/**
 * lacksVerifiableGrounding - Utility check
 */
export function lacksVerifiableGrounding(text: string): boolean {
  const groundingMarkers = [
    /according to/i,
    /research (shows|indicates|suggests)/i,
    /\b\d{4}\b/, // years
    /studies/i,
    /data (shows|indicates)/i,
  ];

  const hasGrounding = groundingMarkers.some((marker) => marker.test(text));
  const makesFactualClaims = (text.match(/\b(is|are|will be|was|were)\b/gi)?.length || 0) > 5;

  return !hasGrounding && makesFactualClaims;
}

/**
 * hasInformationOverload - Utility check
 */
export function hasInformationOverload(text: string): boolean {
  const bulletPoints = (text.match(/^[-•*]\s/gm) || []).length;
  return bulletPoints > 10;
}

/**
 * hasSuperficialDepth - Utility check
 */
export function hasSuperficialDepth(text: string): boolean {
  const genericPhrases = [
    'it depends',
    'varies',
    'there are many factors',
    'your mileage may vary',
  ];

  const hasGeneric = genericPhrases.some((phrase) => text.toLowerCase().includes(phrase));

  const hasSpecifics = /\d+/.test(text) || text.toLowerCase().includes('for example');

  return hasGeneric && !hasSpecifics && text.length < 300;
}

/**
 * hasArrogantTone - Utility check
 */
export function hasArrogantTone(text: string): boolean {
  const arrogancePatterns = ANTIPATTERN_PATTERNS.vanity.patterns;
  return arrogancePatterns.some((pattern) => pattern.test(text));
}
