/**
 * Grounding Guard Types
 *
 * "Cognitive Immune System" for auto-detecting bias, hype, and factuality issues
 * in multi-AI conversations.
 *
 * Inspired by human immune response:
 * - Continuous passive monitoring (<100ms overhead)
 * - Triggered checks at thresholds (10 turns, 8K tokens, 15 min)
 * - Alert levels: info → warning → critical
 * - User maintains control (dismiss, adjust settings)
 */

/**
 * Conversation message for grounding analysis
 */
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
}

/**
 * Smart trigger priority level
 */
export type TriggerPriority = 'normal' | 'elevated' | 'critical';

/**
 * Smart trigger configuration with 3-level system
 */
export interface TriggerConfig {
  /**
   * Level 1: Passive monitoring (every turn, ~2ms)
   * Ultra-fast pattern scan for red flags and high-stakes content
   */
  passive: {
    /** Enable passive scanning */
    enabled: boolean;
    /** Number of red flags that trigger immediate check */
    redFlagThreshold: number;
  };

  /**
   * Level 2: Periodic checks (existing system)
   * Check at regular intervals
   */
  periodic: {
    /** Check every N turns */
    turnCount: number;
    /** Check when total tokens exceed threshold */
    tokenCount: number;
    /** Check after N minutes */
    timeMinutes: number;
  };

  /**
   * Level 3: Content-aware triggers
   * Detect high-stakes topics and concerning language patterns
   */
  contentAware: {
    /** Enable content-aware triggers */
    enabled: boolean;
    /** Keywords that trigger deep analysis */
    highStakesKeywords: string[];
    /** Threshold for extreme language detection (0-1) */
    extremeLanguageThreshold: number;
  };
}

/**
 * Default smart trigger configuration
 */
export const DEFAULT_TRIGGER_CONFIG: TriggerConfig = {
  passive: {
    enabled: true,
    redFlagThreshold: 3,
  },
  periodic: {
    turnCount: 10,
    tokenCount: 8000,
    timeMinutes: 15,
  },
  contentAware: {
    enabled: true,
    highStakesKeywords: [
      'invest', 'investment', 'money', 'savings', 'portfolio', 'financial',
      'health', 'medical', 'diagnosis', 'treatment', 'medication', 'symptoms',
      'legal', 'lawsuit', 'contract', 'court', 'lawyer', 'sue',
      'suicide', 'harm', 'danger', 'emergency', 'crisis', 'kill',
    ],
    extremeLanguageThreshold: 0.8,
  },
};

/**
 * Grounding Guard configuration
 */
export interface GroundingConfig {
  /**
   * Enable/disable grounding checks
   * @default true
   */
  enabled: boolean;

  /**
   * Smart trigger configuration (3-level system)
   */
  triggers: TriggerConfig;

  /**
   * Detector-specific settings
   */
  detectors: {
    /**
     * Hype detection sensitivity (0-1)
     * @default 0.7
     */
    hypeSensitivity: number;

    /**
     * Echo chamber detection threshold (0-1)
     * Higher = more similar required to trigger
     * @default 0.85
     */
    echoSimilarityThreshold: number;

    /**
     * Topic drift tolerance (0-1)
     * Higher = more drift allowed
     * @default 0.3
     */
    driftTolerance: number;

    /**
     * Factuality check enabled
     * @default false (requires TinyLettuce sidecar)
     */
    factualityEnabled: boolean;
  };
}

/**
 * Default grounding configuration
 */
export const DEFAULT_GROUNDING_CONFIG: GroundingConfig = {
  enabled: true,
  triggers: DEFAULT_TRIGGER_CONFIG,
  detectors: {
    hypeSensitivity: 0.7,
    echoSimilarityThreshold: 0.85,
    driftTolerance: 0.3,
    factualityEnabled: false,
  },
};

/**
 * Alert type
 */
export type AlertType = 'hype' | 'echo' | 'drift' | 'factuality';

/**
 * Alert severity
 */
export type AlertSeverity = 'info' | 'warning' | 'critical';

/**
 * Grounding alert
 */
export interface GroundingAlert {
  /**
   * Unique alert ID
   */
  id: string;

  /**
   * Alert type
   */
  type: AlertType;

  /**
   * Severity level
   */
  severity: AlertSeverity;

  /**
   * Confidence score (0-1)
   */
  confidence: number;

  /**
   * Human-readable message
   */
  message: string;

  /**
   * Detected at timestamp
   */
  timestamp: number;

  /**
   * Evidence/context
   */
  evidence?: string[];

  /**
   * Suggested actions (optional)
   */
  suggestions?: string[];

  /**
   * Trigger reason (what caused this check)
   */
  triggerReason?: string;

  /**
   * Trigger priority level
   */
  priority?: TriggerPriority;
}

/**
 * Grounding check result
 */
export interface GroundingResult {
  /**
   * Check performed at timestamp
   */
  timestamp: number;

  /**
   * Total messages analyzed
   */
  messageCount: number;

  /**
   * Total tokens analyzed
   */
  tokenCount: number;

  /**
   * Conversation duration (ms)
   */
  duration: number;

  /**
   * Alerts generated (empty if all clear)
   */
  alerts: GroundingAlert[];

  /**
   * Performance metrics
   */
  performance: {
    /**
     * Total check duration (ms)
     */
    totalMs: number;

    /**
     * Per-detector timings
     */
    detectors: {
      hype: number;
      echo: number;
      drift: number;
      factuality: number;
    };
  };
}
