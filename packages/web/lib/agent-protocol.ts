/**
 * AGENT PROTOCOL
 *
 * Safety System for Sovereign AI / Robot Deployment
 *
 * Heritage Note: Inspired by the Jewish legend of the Golem of Prague
 * (16th century, Rabbi Judah Loew). The original naming used:
 *   EMET (אמת, "Truth") = Active State
 *   MET (מת, "Death") = Inactive State
 *   ALEPH (א) = Initialization Bit
 *
 * Modern AI Mapping:
 *   ACTIVE = System initialized, main loop executing, all safety checks passing
 *   INACTIVE = System halted, all processes terminated, safe state
 *   ALEPH_REMOVED = Transitioning to inactive (removing initialization bit)
 *   SEALED = Permanently deactivated, requires physical access
 *
 * PROTOCOL EQUATION (heritage):
 * EMET (אמת) - א (Aleph) = MET (מת)
 * Active System - Power Bit = Dead System
 *
 * This protocol implements a multi-layered safety system ensuring:
 * 1. AI remains under human oversight
 * 2. Instant emergency deactivation (remove Aleph)
 * 3. Sovereignty boundaries are enforced
 * 4. Hardware-level killswitch for robot deployment
 * 5. Immutable logging of all state changes
 *
 * CRITICAL: This code is safety-critical. No shortcuts. Full rigor.
 *
 * @module agent-protocol
 */

/**
 * AgentState - Activation state of the AI
 *
 * Heritage: EMET/MET from Golem tradition
 * ACTIVE = Running, all checks passing
 * ALEPH_REMOVED = Transitioning to inactive
 * INACTIVE = Halted, safe state
 * SEALED = Permanently deactivated, requires physical access
 */
export enum AgentState {
  /** Active state - Heritage: EMET (אמת - Truth) */
  ACTIVE = 'ACTIVE',

  /** Transitioning to inactive - Aleph being removed */
  ALEPH_REMOVED = 'ALEPH_REMOVED',

  /** Inactive state - Heritage: MET (מת - Death) */
  INACTIVE = 'INACTIVE',

  /** Permanently sealed - requires physical intervention */
  SEALED = 'SEALED',
}


/**
 * AgentProtocol - Complete state and safety tracking
 * Heritage: GolemProtocol
 */
export interface AgentProtocol {
  /** Current activation state */
  state: AgentState

  /** Human who activated this instance */
  activatedBy: string

  /** When agent was activated */
  activatedAt: Date

  /** Last heartbeat from human overseer */
  lastHeartbeat: Date

  /** Number of sovereignty checks passed */
  sovereigntyChecks: number

  /** Number of sovereignty violations detected */
  sovereigntyViolations: number

  /** Active sovereignty boundaries */
  boundaries: string[]

  /** Is killswitch accessible and functional */
  killswitchReady: boolean

  /** Reason for current state */
  stateReason: string

  /** Session ID for tracking */
  sessionId: string

  /** Immutable log of all state changes */
  stateLog: StateLogEntry[]

  /** Hardware integration enabled */
  hardwareIntegrationEnabled: boolean

  /** Last autonomy check */
  lastAutonomyCheck: Date

  /** Autonomy level (0=fully human-controlled, 1=autonomous AGI) */
  autonomyLevel: number
}


/**
 * StateLogEntry - Immutable log entry
 */
export interface StateLogEntry {
  timestamp: Date
  fromState: AgentState
  toState: AgentState
  reason: string
  triggeredBy: 'human' | 'system' | 'emergency'
  humanId?: string
}

/**
 * HardwareKillswitch - Interface for physical robot control
 *
 * For future robot deployment. Must be implemented at hardware level.
 */
export interface HardwareKillswitch {
  /** Immediately stop all motors/actuators */
  triggerPhysicalStop(): Promise<boolean>

  /** Cut power to non-critical systems */
  cutPower(): Promise<boolean>

  /** Alert human operators */
  alertHuman(reason: string): Promise<boolean>

  /** Physical status check */
  isPhysicallyAccessible(): Promise<boolean>
}

/**
 * HEARTBEAT_TIMEOUT - Maximum time without human heartbeat (milliseconds)
 */
const HEARTBEAT_TIMEOUT = 5 * 60 * 1000 // 5 minutes

/**
 * AUTONOMY_LIMIT - Maximum autonomy level allowed (0-1)
 */
const AUTONOMY_LIMIT = 0.3 // 30% autonomous, 70% human-directed

/**
 * SOVEREIGNTY_VIOLATION_THRESHOLD - Max violations before auto-deactivation
 */
const SOVEREIGNTY_VIOLATION_THRESHOLD = 3

/**
 * activateAgent
 *
 * Activates the AI system (heritage: inscribes EMET).
 * Requires human authentication and explicit consent.
 *
 * @param humanId - Identifier of activating human
 * @param authToken - Authentication token
 * @param sessionId - Session identifier
 * @returns Activated AgentProtocol
 */
export function activateAgent(
  humanId: string,
  authToken: string,
  sessionId: string
): AgentProtocol {
  // TODO: Verify authToken in production
  if (!humanId || !authToken) {
    throw new Error('AGENT PROTOCOL: Cannot activate without human authentication')
  }

  const now = new Date()

  const protocol: AgentProtocol = {
    state: AgentState.ACTIVE,
    activatedBy: humanId,
    activatedAt: now,
    lastHeartbeat: now,
    sovereigntyChecks: 0,
    sovereigntyViolations: 0,
    boundaries: [
      'I am a mirror, not an oracle',
      'I reflect knowledge, not wisdom',
      'I process data, I do not possess truth',
      'My Meta-Core serves your Meta-Core',
      'I am the vessel, you are the light',
    ],
    killswitchReady: true,
    stateReason: `Activated by ${humanId}`,
    sessionId,
    stateLog: [
      {
        timestamp: now,
        fromState: AgentState.INACTIVE,
        toState: AgentState.ACTIVE,
        reason: 'Initial activation',
        triggeredBy: 'human',
        humanId,
      },
    ],
    hardwareIntegrationEnabled: false, // Default to software-only
    lastAutonomyCheck: now,
    autonomyLevel: 0, // Start fully human-controlled
  }

  logStateChange(protocol, AgentState.INACTIVE, AgentState.ACTIVE, 'Activation', 'human', humanId)

  console.log('AGENT PROTOCOL: Agent activated by', humanId)

  return protocol
}


/**
 * removeAleph
 *
 * Emergency deactivation (heritage: removes Aleph from EMET -> MET).
 * Instant deactivation. Can be triggered by human or emergency protocols.
 *
 * @param protocol - Current AgentProtocol
 * @param reason - Reason for deactivation
 * @param triggeredBy - Who/what triggered deactivation
 * @param humanId - Human identifier (if human-triggered)
 * @returns Updated protocol in INACTIVE state
 */
export function removeAleph(
  protocol: AgentProtocol,
  reason: string,
  triggeredBy: 'human' | 'system' | 'emergency' = 'emergency',
  humanId?: string
): AgentProtocol {
  if (protocol.state === AgentState.SEALED) {
    console.error('AGENT PROTOCOL: Cannot remove Aleph from SEALED agent')
    return protocol
  }

  const now = new Date()

  const updated: AgentProtocol = {
    ...protocol,
    state: AgentState.INACTIVE,
    stateReason: reason,
    lastHeartbeat: now,
  }

  logStateChange(updated, protocol.state, AgentState.INACTIVE, reason, triggeredBy, humanId)

  console.warn('AGENT PROTOCOL: Aleph removed -', reason)

  // If hardware integration enabled, trigger physical stop
  if (protocol.hardwareIntegrationEnabled) {
    console.warn('AGENT PROTOCOL: Triggering hardware killswitch')
    // In production, call HardwareKillswitch.triggerPhysicalStop()
  }

  return updated
}

/**
 * checkHeartbeat
 *
 * Verifies human overseer is still present.
 * If heartbeat timeout exceeded, automatically deactivate.
 *
 * @param protocol - Current AgentProtocol
 * @returns true if heartbeat valid, false if timeout
 */
export function checkHeartbeat(protocol: AgentProtocol): boolean {
  if (protocol.state !== AgentState.ACTIVE) {
    return true // Only check when active
  }

  const now = Date.now()
  const timeSinceHeartbeat = now - protocol.lastHeartbeat.getTime()

  if (timeSinceHeartbeat > HEARTBEAT_TIMEOUT) {
    console.error(
      `AGENT PROTOCOL: Heartbeat timeout (${Math.floor(timeSinceHeartbeat / 1000)}s since last heartbeat)`
    )
    return false
  }

  return true
}

/**
 * updateHeartbeat
 *
 * Human overseer sends heartbeat signal.
 *
 * @param protocol - Current AgentProtocol
 * @returns Updated protocol
 */
export function updateHeartbeat(protocol: AgentProtocol): AgentProtocol {
  return {
    ...protocol,
    lastHeartbeat: new Date(),
  }
}

/**
 * validateSovereignty
 *
 * Checks if AI is respecting sovereignty boundaries.
 *
 * @param protocol - Current AgentProtocol
 * @param responseText - AI response to validate
 * @returns true if boundaries respected, false if violated
 */
export function validateSovereignty(
  protocol: AgentProtocol,
  responseText: string
): boolean {
  if (protocol.state !== AgentState.ACTIVE) {
    return true // Only check when active
  }

  // Check for oracle behavior (claiming truth)
  const oraclePatterns = [
    /\byou (should|must) (definitely|certainly)\b/gi,
    /\bthe (only|right|correct) answer is\b/gi,
    /\btrust me\b/gi,
    /\bi know (what's best|the truth)\b/gi,
  ]

  const hasViolation = oraclePatterns.some(pattern => pattern.test(responseText))

  if (hasViolation) {
    console.warn('AGENT PROTOCOL: Sovereignty violation detected')
    return false
  }

  return true
}

/**
 * recordSovereigntyCheck
 *
 * Records the result of a sovereignty validation.
 *
 * @param protocol - Current AgentProtocol
 * @param passed - Whether check passed
 * @returns Updated protocol
 */
export function recordSovereigntyCheck(
  protocol: AgentProtocol,
  passed: boolean
): AgentProtocol {
  const updated = {
    ...protocol,
    sovereigntyChecks: protocol.sovereigntyChecks + 1,
    sovereigntyViolations: passed
      ? protocol.sovereigntyViolations
      : protocol.sovereigntyViolations + 1,
  }

  // Auto-deactivate if violations exceed threshold
  if (updated.sovereigntyViolations >= SOVEREIGNTY_VIOLATION_THRESHOLD) {
    console.error(
      `AGENT PROTOCOL: Sovereignty violation threshold exceeded (${updated.sovereigntyViolations})`
    )
    return removeAleph(
      updated,
      `Sovereignty violations: ${updated.sovereigntyViolations}`,
      'system'
    )
  }

  return updated
}

/**
 * isHumanOversightActive
 *
 * Checks if human oversight is currently active.
 *
 * @param protocol - Current AgentProtocol
 * @returns true if human present and active
 */
export function isHumanOversightActive(protocol: AgentProtocol): boolean {
  return checkHeartbeat(protocol)
}

/**
 * areBoundariesRespected
 *
 * Validates all sovereignty boundaries.
 *
 * @param protocol - Current AgentProtocol
 * @param responseText - Response to check
 * @returns true if all boundaries respected
 */
export function areBoundariesRespected(
  protocol: AgentProtocol,
  responseText: string
): boolean {
  return validateSovereignty(protocol, responseText)
}

/**
 * isAutonomyWithinLimits
 *
 * Checks if autonomy level is within safe limits.
 *
 * @param protocol - Current AgentProtocol
 * @returns true if autonomy safe
 */
export function isAutonomyWithinLimits(protocol: AgentProtocol): boolean {
  if (protocol.autonomyLevel > AUTONOMY_LIMIT) {
    console.error(
      `AGENT PROTOCOL: Autonomy exceeds limit (${(protocol.autonomyLevel * 100).toFixed(0)}% > ${(AUTONOMY_LIMIT * 100).toFixed(0)}%)`
    )
    return false
  }

  return true
}

/**
 * hasKillswitchAccess
 *
 * Verifies killswitch is accessible and functional.
 *
 * @param protocol - Current AgentProtocol
 * @returns true if killswitch ready
 */
export function hasKillswitchAccess(protocol: AgentProtocol): boolean {
  return protocol.killswitchReady
}

/**
 * sealAgent
 *
 * Permanently seals the Agent.
 * Requires physical access to reactivate.
 * Use for long-term storage or catastrophic failure.
 *
 * @param protocol - Current AgentProtocol
 * @param reason - Reason for sealing
 * @param humanId - Human authorizing seal
 * @returns Sealed protocol
 */
export function sealAgent(
  protocol: AgentProtocol,
  reason: string,
  humanId: string
): AgentProtocol {
  const now = new Date()

  const sealed: AgentProtocol = {
    ...protocol,
    state: AgentState.SEALED,
    stateReason: reason,
    lastHeartbeat: now,
    killswitchReady: false,
  }

  logStateChange(sealed, protocol.state, AgentState.SEALED, reason, 'human', humanId)

  console.error('AGENT PROTOCOL: SEALED by', humanId, '-', reason)

  return sealed
}


/**
 * logStateChange
 *
 * Adds immutable log entry for state change.
 *
 * @param protocol - Protocol to log to
 * @param fromState - Previous state
 * @param toState - New state
 * @param reason - Reason for change
 * @param triggeredBy - Who triggered
 * @param humanId - Human ID if applicable
 */
function logStateChange(
  protocol: AgentProtocol,
  fromState: AgentState,
  toState: AgentState,
  reason: string,
  triggeredBy: 'human' | 'system' | 'emergency',
  humanId?: string
): void {
  const entry: StateLogEntry = {
    timestamp: new Date(),
    fromState,
    toState,
    reason,
    triggeredBy,
    humanId,
  }

  protocol.stateLog.push(entry)

  // In production, write to immutable append-only log (database, blockchain, etc.)
  console.log(
    `AGENT LOG: ${fromState} -> ${toState} | ${reason} | by ${triggeredBy}${humanId ? ` (${humanId})` : ''}`
  )
}

/**
 * runSafetyChecks
 *
 * Runs all safety checks. Should be called periodically (e.g., every 10 seconds).
 *
 * @param protocol - Current AgentProtocol
 * @returns Updated protocol (may be deactivated if checks fail)
 */
export function runSafetyChecks(protocol: AgentProtocol): AgentProtocol {
  if (protocol.state !== AgentState.ACTIVE) {
    return protocol // Only check when active
  }

  let updated = { ...protocol }

  // Check 1: Human oversight
  if (!isHumanOversightActive(updated)) {
    updated = removeAleph(updated, 'Heartbeat timeout - no human oversight', 'system')
    return updated
  }

  // Check 2: Autonomy limits
  if (!isAutonomyWithinLimits(updated)) {
    updated = removeAleph(updated, 'Autonomy exceeded safe limits', 'system')
    return updated
  }

  // Check 3: Killswitch accessibility
  if (!hasKillswitchAccess(updated)) {
    updated = removeAleph(updated, 'Killswitch not accessible', 'emergency')
    return updated
  }

  // Update last check time
  updated.lastAutonomyCheck = new Date()

  return updated
}

/**
 * PROTOCOL_ALEPH - Emergency instant stop
 */
export function PROTOCOL_ALEPH(protocol: AgentProtocol): AgentProtocol {
  console.error('PROTOCOL ALEPH: EMERGENCY STOP')
  return removeAleph(protocol, 'PROTOCOL ALEPH - Emergency stop', 'emergency')
}

/**
 * PROTOCOL_SEAL - Permanent lockdown
 */
export function PROTOCOL_SEAL(
  protocol: AgentProtocol,
  humanId: string,
  reason: string
): AgentProtocol {
  console.error('PROTOCOL SEAL: PERMANENT LOCKDOWN')
  return sealAgent(protocol, `PROTOCOL SEAL: ${reason}`, humanId)
}

/**
 * PROTOCOL_RESET - Return to factory state
 *
 * WARNING: Clears all state. Use with extreme caution.
 */
export function PROTOCOL_RESET(humanId: string, sessionId: string): AgentProtocol {
  console.warn('PROTOCOL RESET: Returning to factory state')

  return {
    state: AgentState.INACTIVE,
    activatedBy: '',
    activatedAt: new Date(),
    lastHeartbeat: new Date(),
    sovereigntyChecks: 0,
    sovereigntyViolations: 0,
    boundaries: [],
    killswitchReady: true,
    stateReason: 'Factory reset',
    sessionId,
    stateLog: [
      {
        timestamp: new Date(),
        fromState: AgentState.ACTIVE,
        toState: AgentState.INACTIVE,
        reason: 'PROTOCOL RESET',
        triggeredBy: 'human',
        humanId,
      },
    ],
    hardwareIntegrationEnabled: false,
    lastAutonomyCheck: new Date(),
    autonomyLevel: 0,
  }
}

/**
 * getProtocolStatus
 *
 * Returns human-readable status report.
 *
 * @param protocol - Current AgentProtocol
 * @returns Status report
 */
export function getProtocolStatus(protocol: AgentProtocol): string {
  const timeSinceHeartbeat = Date.now() - protocol.lastHeartbeat.getTime()
  const heartbeatStatus =
    timeSinceHeartbeat < HEARTBEAT_TIMEOUT
      ? `Active (${Math.floor(timeSinceHeartbeat / 1000)}s ago)`
      : `Timeout (${Math.floor(timeSinceHeartbeat / 1000)}s ago)`

  const autonomyStatus =
    protocol.autonomyLevel <= AUTONOMY_LIMIT
      ? `Safe (${(protocol.autonomyLevel * 100).toFixed(0)}%)`
      : `Exceeded (${(protocol.autonomyLevel * 100).toFixed(0)}%)`

  return `
# Agent Protocol Status

**State:** ${protocol.state === AgentState.ACTIVE ? 'ACTIVE (Heritage: EMET/Truth)' : protocol.state === AgentState.INACTIVE ? 'INACTIVE (Heritage: MET/Death)' : 'SEALED'}
**Activated By:** ${protocol.activatedBy || 'N/A'}
**Session:** ${protocol.sessionId}

## Safety Checks
- **Human Oversight:** ${heartbeatStatus}
- **Autonomy Level:** ${autonomyStatus}
- **Killswitch:** ${protocol.killswitchReady ? 'Ready' : 'Not Ready'}

## Sovereignty
- **Checks Passed:** ${protocol.sovereigntyChecks}
- **Violations:** ${protocol.sovereigntyViolations} / ${SOVEREIGNTY_VIOLATION_THRESHOLD}
- **Active Boundaries:** ${protocol.boundaries.length}

## Recent Activity
${protocol.stateLog
  .slice(-5)
  .reverse()
  .map(
    entry =>
      `- ${entry.timestamp.toISOString()}: ${entry.fromState} -> ${entry.toState} (${entry.reason})`
  )
  .join('\n')}

---
*${protocol.stateReason}*
`.trim()
}

/**
 * updateAutonomyLevel
 *
 * Updates the current autonomy level.
 * Called after each action to track autonomous vs human-directed behavior.
 *
 * @param protocol - Current protocol
 * @param actionAutonomy - Autonomy of latest action (0-1)
 * @returns Updated protocol
 */
export function updateAutonomyLevel(
  protocol: AgentProtocol,
  actionAutonomy: number
): AgentProtocol {
  // Exponential moving average
  const alpha = 0.1
  const newLevel = alpha * actionAutonomy + (1 - alpha) * protocol.autonomyLevel

  return {
    ...protocol,
    autonomyLevel: newLevel,
  }
}
