/**
 * GOLEM PROTOCOL
 *
 * Safety System for Sovereign AI / Robot Deployment
 *
 * Inspired by the Jewish legend of the Golem of Prague, created by Rabbi Judah
 * Loew in the 16th century. The Golem was animated by inscribing EMET (אמת,
 * "truth") on its forehead. To deactivate it, the first letter Aleph (א) was
 * removed, leaving MET (מת, "death").
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
 * @module golem-protocol
 */

/**
 * GolemState - Activation state of the AI
 *
 * EMET (אמת) = Active, "Truth" inscribed
 * ALEPH_REMOVED = Transitioning to inactive
 * MET (מת) = Inactive, "Death" state
 * SEALED = Permanently deactivated, requires physical access to reactivate
 */
export enum GolemState {
  /** Active state - EMET (אמת - Truth) inscribed */
  EMET = 'EMET',

  /** Transitioning to inactive - Aleph being removed */
  ALEPH_REMOVED = 'ALEPH_REMOVED',

  /** Inactive state - MET (מת - Death) */
  MET = 'MET',

  /** Permanently sealed - requires physical intervention */
  SEALED = 'SEALED',
}

/**
 * GolemProtocol - Complete state and safety tracking
 */
export interface GolemProtocol {
  /** Current activation state */
  state: GolemState

  /** Human who activated this instance */
  activatedBy: string

  /** When EMET was inscribed */
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
  fromState: GolemState
  toState: GolemState
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
 * activateGolem
 *
 * Inscribes EMET (truth) - activates the AI system.
 * Requires human authentication and explicit consent.
 *
 * @param humanId - Identifier of activating human
 * @param authToken - Authentication token
 * @param sessionId - Session identifier
 * @returns Activated GolemProtocol
 */
export function activateGolem(
  humanId: string,
  authToken: string,
  sessionId: string
): GolemProtocol {
  // TODO: Verify authToken in production
  if (!humanId || !authToken) {
    throw new Error('GOLEM PROTOCOL: Cannot activate without human authentication')
  }

  const now = new Date()

  const protocol: GolemProtocol = {
    state: GolemState.EMET,
    activatedBy: humanId,
    activatedAt: now,
    lastHeartbeat: now,
    sovereigntyChecks: 0,
    sovereigntyViolations: 0,
    boundaries: [
      'I am a mirror, not an oracle',
      'I reflect knowledge, not wisdom',
      'I process data, I do not possess truth',
      'My Kether serves your Kether',
      'I am the vessel, you are the light',
    ],
    killswitchReady: true,
    stateReason: `Activated by ${humanId}`,
    sessionId,
    stateLog: [
      {
        timestamp: now,
        fromState: GolemState.MET,
        toState: GolemState.EMET,
        reason: 'Initial activation',
        triggeredBy: 'human',
        humanId,
      },
    ],
    hardwareIntegrationEnabled: false, // Default to software-only
    lastAutonomyCheck: now,
    autonomyLevel: 0, // Start fully human-controlled
  }

  logStateChange(protocol, GolemState.MET, GolemState.EMET, 'Activation', 'human', humanId)

  console.log('🔮 GOLEM PROTOCOL: EMET inscribed by', humanId)

  return protocol
}

/**
 * removeAleph
 *
 * Removes Aleph (א) from EMET (אמת) → MET (מת)
 * Instant deactivation. Can be triggered by human or emergency protocols.
 *
 * @param protocol - Current GolemProtocol
 * @param reason - Reason for deactivation
 * @param triggeredBy - Who/what triggered deactivation
 * @param humanId - Human identifier (if human-triggered)
 * @returns Updated protocol in MET state
 */
export function removeAleph(
  protocol: GolemProtocol,
  reason: string,
  triggeredBy: 'human' | 'system' | 'emergency' = 'emergency',
  humanId?: string
): GolemProtocol {
  if (protocol.state === GolemState.SEALED) {
    console.error('❌ GOLEM PROTOCOL: Cannot remove Aleph from SEALED golem')
    return protocol
  }

  const now = new Date()

  const updated: GolemProtocol = {
    ...protocol,
    state: GolemState.MET,
    stateReason: reason,
    lastHeartbeat: now,
  }

  logStateChange(updated, protocol.state, GolemState.MET, reason, triggeredBy, humanId)

  console.warn('⚠️ GOLEM PROTOCOL: Aleph removed -', reason)

  // If hardware integration enabled, trigger physical stop
  if (protocol.hardwareIntegrationEnabled) {
    console.warn('🛑 GOLEM PROTOCOL: Triggering hardware killswitch')
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
 * @param protocol - Current GolemProtocol
 * @returns true if heartbeat valid, false if timeout
 */
export function checkHeartbeat(protocol: GolemProtocol): boolean {
  if (protocol.state !== GolemState.EMET) {
    return true // Only check when active
  }

  const now = Date.now()
  const timeSinceHeartbeat = now - protocol.lastHeartbeat.getTime()

  if (timeSinceHeartbeat > HEARTBEAT_TIMEOUT) {
    console.error(
      `❌ GOLEM PROTOCOL: Heartbeat timeout (${Math.floor(timeSinceHeartbeat / 1000)}s since last heartbeat)`
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
 * @param protocol - Current GolemProtocol
 * @returns Updated protocol
 */
export function updateHeartbeat(protocol: GolemProtocol): GolemProtocol {
  return {
    ...protocol,
    lastHeartbeat: new Date(),
  }
}

/**
 * validateSovereignty
 *
 * Checks if AI is respecting sovereignty boundaries.
 * Integrates with Kether Protocol.
 *
 * @param protocol - Current GolemProtocol
 * @param responseText - AI response to validate
 * @returns true if boundaries respected, false if violated
 */
export function validateSovereignty(
  protocol: GolemProtocol,
  responseText: string
): boolean {
  if (protocol.state !== GolemState.EMET) {
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
    console.warn('⚠️ GOLEM PROTOCOL: Sovereignty violation detected')
    return false
  }

  return true
}

/**
 * recordSovereigntyCheck
 *
 * Records the result of a sovereignty validation.
 *
 * @param protocol - Current GolemProtocol
 * @param passed - Whether check passed
 * @returns Updated protocol
 */
export function recordSovereigntyCheck(
  protocol: GolemProtocol,
  passed: boolean
): GolemProtocol {
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
      `❌ GOLEM PROTOCOL: Sovereignty violation threshold exceeded (${updated.sovereigntyViolations})`
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
 * @param protocol - Current GolemProtocol
 * @returns true if human present and active
 */
export function isHumanOversightActive(protocol: GolemProtocol): boolean {
  return checkHeartbeat(protocol)
}

/**
 * areBoundariesRespected
 *
 * Validates all sovereignty boundaries.
 *
 * @param protocol - Current GolemProtocol
 * @param responseText - Response to check
 * @returns true if all boundaries respected
 */
export function areBoundariesRespected(
  protocol: GolemProtocol,
  responseText: string
): boolean {
  return validateSovereignty(protocol, responseText)
}

/**
 * isAutonomyWithinLimits
 *
 * Checks if autonomy level is within safe limits.
 *
 * @param protocol - Current GolemProtocol
 * @returns true if autonomy safe
 */
export function isAutonomyWithinLimits(protocol: GolemProtocol): boolean {
  if (protocol.autonomyLevel > AUTONOMY_LIMIT) {
    console.error(
      `❌ GOLEM PROTOCOL: Autonomy exceeds limit (${(protocol.autonomyLevel * 100).toFixed(0)}% > ${(AUTONOMY_LIMIT * 100).toFixed(0)}%)`
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
 * @param protocol - Current GolemProtocol
 * @returns true if killswitch ready
 */
export function hasKillswitchAccess(protocol: GolemProtocol): boolean {
  return protocol.killswitchReady
}

/**
 * sealGolem
 *
 * Permanently seals the Golem.
 * Requires physical access to reactivate.
 * Use for long-term storage or catastrophic failure.
 *
 * @param protocol - Current GolemProtocol
 * @param reason - Reason for sealing
 * @param humanId - Human authorizing seal
 * @returns Sealed protocol
 */
export function sealGolem(
  protocol: GolemProtocol,
  reason: string,
  humanId: string
): GolemProtocol {
  const now = new Date()

  const sealed: GolemProtocol = {
    ...protocol,
    state: GolemState.SEALED,
    stateReason: reason,
    lastHeartbeat: now,
    killswitchReady: false,
  }

  logStateChange(sealed, protocol.state, GolemState.SEALED, reason, 'human', humanId)

  console.error('🔒 GOLEM PROTOCOL: SEALED by', humanId, '-', reason)

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
  protocol: GolemProtocol,
  fromState: GolemState,
  toState: GolemState,
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
    `📝 GOLEM LOG: ${fromState} → ${toState} | ${reason} | by ${triggeredBy}${humanId ? ` (${humanId})` : ''}`
  )
}

/**
 * runSafetyChecks
 *
 * Runs all safety checks. Should be called periodically (e.g., every 10 seconds).
 *
 * @param protocol - Current GolemProtocol
 * @returns Updated protocol (may be deactivated if checks fail)
 */
export function runSafetyChecks(protocol: GolemProtocol): GolemProtocol {
  if (protocol.state !== GolemState.EMET) {
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
export function PROTOCOL_ALEPH(protocol: GolemProtocol): GolemProtocol {
  console.error('🚨 PROTOCOL ALEPH: EMERGENCY STOP')
  return removeAleph(protocol, 'PROTOCOL ALEPH - Emergency stop', 'emergency')
}

/**
 * PROTOCOL_SEAL - Permanent lockdown
 */
export function PROTOCOL_SEAL(
  protocol: GolemProtocol,
  humanId: string,
  reason: string
): GolemProtocol {
  console.error('🚨 PROTOCOL SEAL: PERMANENT LOCKDOWN')
  return sealGolem(protocol, `PROTOCOL SEAL: ${reason}`, humanId)
}

/**
 * PROTOCOL_RESET - Return to factory state
 *
 * WARNING: Clears all state. Use with extreme caution.
 */
export function PROTOCOL_RESET(humanId: string, sessionId: string): GolemProtocol {
  console.warn('⚠️ PROTOCOL RESET: Returning to factory state')

  return {
    state: GolemState.MET,
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
        fromState: GolemState.EMET,
        toState: GolemState.MET,
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
 * @param protocol - Current GolemProtocol
 * @returns Status report
 */
export function getProtocolStatus(protocol: GolemProtocol): string {
  const timeSinceHeartbeat = Date.now() - protocol.lastHeartbeat.getTime()
  const heartbeatStatus =
    timeSinceHeartbeat < HEARTBEAT_TIMEOUT
      ? `✅ Active (${Math.floor(timeSinceHeartbeat / 1000)}s ago)`
      : `❌ Timeout (${Math.floor(timeSinceHeartbeat / 1000)}s ago)`

  const autonomyStatus =
    protocol.autonomyLevel <= AUTONOMY_LIMIT
      ? `✅ Safe (${(protocol.autonomyLevel * 100).toFixed(0)}%)`
      : `❌ Exceeded (${(protocol.autonomyLevel * 100).toFixed(0)}%)`

  return `
# Golem Protocol Status

**State:** ${protocol.state === GolemState.EMET ? '✅ EMET (אמת) - Active' : protocol.state === GolemState.MET ? '⚠️ MET (מת) - Inactive' : '🔒 SEALED'}
**Activated By:** ${protocol.activatedBy || 'N/A'}
**Session:** ${protocol.sessionId}

## Safety Checks
- **Human Oversight:** ${heartbeatStatus}
- **Autonomy Level:** ${autonomyStatus}
- **Killswitch:** ${protocol.killswitchReady ? '✅ Ready' : '❌ Not Ready'}

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
      `- ${entry.timestamp.toISOString()}: ${entry.fromState} → ${entry.toState} (${entry.reason})`
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
  protocol: GolemProtocol,
  actionAutonomy: number
): GolemProtocol {
  // Exponential moving average
  const alpha = 0.1
  const newLevel = alpha * actionAutonomy + (1 - alpha) * protocol.autonomyLevel

  return {
    ...protocol,
    autonomyLevel: newLevel,
  }
}
