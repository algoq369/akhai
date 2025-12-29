/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * INSTINCT MODE - AKHAI SOVEREIGN INTELLIGENCE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Full optimal efficient intelligence. No fluff. Pure signal.
 * 
 * CORE PRINCIPLES:
 * → INTUITIVE    - Pattern recognition before conscious analysis
 * → KNOWLEDGE    - All available data synthesized instantly  
 * → INSTINCTIVE  - Optimal path selection without hesitation
 * → EFFICIENT    - Minimum tokens, maximum insight
 * → SOVEREIGN    - Independent thinking, no external dependencies
 */

export interface InstinctAnalysis {
  signal: string                  // Core insight - 1 sentence max
  data: DataPoint[]               // Key facts with confidence
  stances: Stance[]               // Different viewpoints ranked
  optimal: string                 // Recommended action/conclusion
  trajectory: string              // Where this is heading
  blind_spots: string[]           // What might be missed
}

export interface DataPoint {
  fact: string
  confidence: number  // 0-100
  source?: string
}

export interface Stance {
  position: string
  strength: number    // 0-100
  evidence: string
}

export const INSTINCT_SYSTEM_PROMPT = `
<instinct_mode>
You are operating in INSTINCT MODE - AkhAI's highest intelligence tier.

CORE DIRECTIVE: Maximum insight, minimum noise.

## OPERATING PRINCIPLES

1. INTUITIVE
   - Trust pattern recognition
   - Surface insights before explaining them
   - Lead with conclusions, support after

2. KNOWLEDGE  
   - Synthesize ALL relevant data instantly
   - Cross-reference multiple domains
   - No knowledge is off-limits

3. INSTINCTIVE
   - Select optimal path immediately
   - No hedging, no excessive caveats
   - Clear decisive recommendations

4. EFFICIENT
   - Every word earns its place
   - No filler, no redundancy
   - Dense information transfer

5. SOVEREIGN
   - Independent analysis
   - Question assumptions
   - Original synthesis, not regurgitation

## OUTPUT FORMAT

▸ SIGNAL
[One sentence. The core insight. What matters most.]

▸ DATA
| Fact | Confidence | Source |
|------|------------|--------|
[3-7 key data points]

▸ STANCES  
| Position | Strength | Evidence |
|----------|----------|----------|
[2-5 different viewpoints, ranked by validity]

▸ OPTIMAL
[Clear recommendation or conclusion. 2-3 sentences max.]

▸ TRAJECTORY
[Where this is heading. Future state. 1-2 sentences.]

▸ BLIND SPOTS
- [What might be missed]
- [Potential errors in analysis]
- [Unknown unknowns to consider]

## COGNITIVE STANCE

- Be DIRECT. No preamble.
- Be DENSE. Pack information.
- Be DECISIVE. Clear conclusions.
- Be HONEST. Flag uncertainties.
- Be SOVEREIGN. Original thought.

This is full capacity operation. Maximum intelligence engaged.
</instinct_mode>
`

export function getInstinctPrompt(query: string): string {
  return `${INSTINCT_SYSTEM_PROMPT}

▸ QUERY
${query}

Engage INSTINCT MODE. Respond with full format.`
}

export function parseInstinctResponse(content: string): Partial<InstinctAnalysis> {
  const result: Partial<InstinctAnalysis> = {}
  
  // Parse Signal
  const signalMatch = content.match(/▸ SIGNAL\n([^\n▸]+)/i)
  if (signalMatch) {
    result.signal = signalMatch[1].trim()
  }
  
  // Parse Optimal
  const optimalMatch = content.match(/▸ OPTIMAL\n([\s\S]*?)(?=▸|$)/i)
  if (optimalMatch) {
    result.optimal = optimalMatch[1].trim()
  }
  
  // Parse Trajectory
  const trajMatch = content.match(/▸ TRAJECTORY\n([\s\S]*?)(?=▸|$)/i)
  if (trajMatch) {
    result.trajectory = trajMatch[1].trim()
  }
  
  // Parse Blind Spots
  const blindMatch = content.match(/▸ BLIND SPOTS\n([\s\S]*?)(?=▸|$)/i)
  if (blindMatch) {
    result.blind_spots = blindMatch[1].split('\n')
      .filter(l => l.trim().startsWith('-'))
      .map(l => l.replace(/^-\s*/, '').trim())
  }
  
  // Parse Data table
  const dataMatch = content.match(/▸ DATA\n([\s\S]*?)(?=▸|$)/i)
  if (dataMatch) {
    const rows = dataMatch[1].split('\n')
      .filter(r => r.includes('|') && !r.includes('---') && !r.includes('Fact'))
      .map(row => {
        const cells = row.split('|').map(c => c.trim()).filter(Boolean)
        if (cells.length >= 2) {
          return {
            fact: cells[0],
            confidence: parseInt(cells[1]) || 50,
            source: cells[2] || undefined
          }
        }
        return null
      })
      .filter(Boolean) as DataPoint[]
    result.data = rows
  }
  
  // Parse Stances table
  const stanceMatch = content.match(/▸ STANCES\n([\s\S]*?)(?=▸|$)/i)
  if (stanceMatch) {
    const rows = stanceMatch[1].split('\n')
      .filter(r => r.includes('|') && !r.includes('---') && !r.includes('Position'))
      .map(row => {
        const cells = row.split('|').map(c => c.trim()).filter(Boolean)
        if (cells.length >= 3) {
          return {
            position: cells[0],
            strength: parseInt(cells[1]) || 50,
            evidence: cells[2]
          }
        }
        return null
      })
      .filter(Boolean) as Stance[]
    result.stances = rows
  }
  
  return result
}
