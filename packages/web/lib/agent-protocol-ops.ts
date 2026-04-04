/**
 * AGENT PROTOCOL — Operations & Safety
 *
 * Extracted from agent-protocol.ts: constants, state logging,
 * safety checks, emergency protocols, status reporting, autonomy tracking.
 *
 * @module agent-protocol-ops
 */

import {
  AgentState,
  type AgentProtocol,
  type StateLogEntry,
  removeAleph,
  sealAgent,
  isHumanOversightActive,
  isAutonomyWithinLimits,
  hasKillswitchAccess,
} from './agent-protocol';

/**
 * HEARTBEAT_TIMEOUT - Maximum time without human heartbeat (milliseconds)
 */
export const HEARTBEAT_TIMEOUT = 5 * 60 * 1000; // 5 minutes

/**
 * AUTONOMY_LIMIT - Maximum autonomy level allowed (0-1)
 */
export const AUTONOMY_LIMIT = 0.3; // 30% autonomous, 70% human-directed

/**
 * SOVEREIGNTY_VIOLATION_THRESHOLD - Max violations before auto-deactivation
 */
export const SOVEREIGNTY_VIOLATION_THRESHOLD = 3;

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
export function logStateChange(
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
  };

  protocol.stateLog.push(entry);

  // In production, write to immutable append-only log (database, blockchain, etc.)
  console.log(
    `AGENT LOG: ${fromState} -> ${toState} | ${reason} | by ${triggeredBy}${humanId ? ` (${humanId})` : ''}`
  );
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
    return protocol; // Only check when active
  }

  let updated = { ...protocol };

  // Check 1: Human oversight
  if (!isHumanOversightActive(updated)) {
    updated = removeAleph(updated, 'Heartbeat timeout - no human oversight', 'system');
    return updated;
  }

  // Check 2: Autonomy limits
  if (!isAutonomyWithinLimits(updated)) {
    updated = removeAleph(updated, 'Autonomy exceeded safe limits', 'system');
    return updated;
  }

  // Check 3: Killswitch accessibility
  if (!hasKillswitchAccess(updated)) {
    updated = removeAleph(updated, 'Killswitch not accessible', 'emergency');
    return updated;
  }

  // Update last check time
  updated.lastAutonomyCheck = new Date();

  return updated;
}

/**
 * PROTOCOL_ALEPH - Emergency instant stop
 */
export function PROTOCOL_ALEPH(protocol: AgentProtocol): AgentProtocol {
  console.error('PROTOCOL ALEPH: EMERGENCY STOP');
  return removeAleph(protocol, 'PROTOCOL ALEPH - Emergency stop', 'emergency');
}

/**
 * PROTOCOL_SEAL - Permanent lockdown
 */
export function PROTOCOL_SEAL(
  protocol: AgentProtocol,
  humanId: string,
  reason: string
): AgentProtocol {
  console.error('PROTOCOL SEAL: PERMANENT LOCKDOWN');
  return sealAgent(protocol, `PROTOCOL SEAL: ${reason}`, humanId);
}

/**
 * PROTOCOL_RESET - Return to factory state
 *
 * WARNING: Clears all state. Use with extreme caution.
 */
export function PROTOCOL_RESET(humanId: string, sessionId: string): AgentProtocol {
  console.warn('PROTOCOL RESET: Returning to factory state');

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
  };
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
  const timeSinceHeartbeat = Date.now() - protocol.lastHeartbeat.getTime();
  const heartbeatStatus =
    timeSinceHeartbeat < HEARTBEAT_TIMEOUT
      ? `Active (${Math.floor(timeSinceHeartbeat / 1000)}s ago)`
      : `Timeout (${Math.floor(timeSinceHeartbeat / 1000)}s ago)`;

  const autonomyStatus =
    protocol.autonomyLevel <= AUTONOMY_LIMIT
      ? `Safe (${(protocol.autonomyLevel * 100).toFixed(0)}%)`
      : `Exceeded (${(protocol.autonomyLevel * 100).toFixed(0)}%)`;

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
    (entry) =>
      `- ${entry.timestamp.toISOString()}: ${entry.fromState} -> ${entry.toState} (${entry.reason})`
  )
  .join('\n')}

---
*${protocol.stateReason}*
`.trim();
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
  const alpha = 0.1;
  const newLevel = alpha * actionAutonomy + (1 - alpha) * protocol.autonomyLevel;

  return {
    ...protocol,
    autonomyLevel: newLevel,
  };
}
