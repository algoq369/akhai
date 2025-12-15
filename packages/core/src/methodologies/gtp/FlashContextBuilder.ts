/**
 * Flash Context Builder
 *
 * Creates the "Flash Context Frame" - a comprehensive snapshot that's broadcast
 * to all advisors simultaneously in the GTP methodology.
 *
 * Key responsibilities:
 * - Build project state / bigger picture
 * - Assign unique roles to each advisor (prevent redundancy)
 * - Create token-optimized context
 * - Generate advisor-specific prompts
 */

import type {
  FlashContextFrame,
  AdvisorTask,
  AdvisorRole,
  QueryAnalysis,
  ModelFamily,
} from '../types.js';

/**
 * Advisor slot configuration
 */
interface AdvisorSlot {
  slot: number;
  family: ModelFamily;
}

/**
 * Role-specific focus areas
 */
const ROLE_FOCUS: Record<AdvisorRole, {
  title: string;
  description: string;
  focusAreas: string[];
  avoidTopics: string[];
}> = {
  technical: {
    title: 'Technical Analysis',
    description: 'Focus on implementation details, feasibility, and technical architecture',
    focusAreas: [
      'Implementation complexity',
      'Technical feasibility',
      'Architecture decisions',
      'Performance considerations',
      'Scalability factors',
      'Code quality implications',
      'Integration requirements',
      'Technical trade-offs',
    ],
    avoidTopics: [
      'Market analysis',
      'Business strategy',
      'Creative alternatives',
      'High-level risks',
    ],
  },
  strategic: {
    title: 'Strategic Analysis',
    description: 'Focus on market, competition, and business implications',
    focusAreas: [
      'Market trends',
      'Competitive landscape',
      'Business model viability',
      'ROI projections',
      'Growth strategies',
      'Market positioning',
      'Strategic advantages',
      'Competitive differentiation',
    ],
    avoidTopics: [
      'Implementation details',
      'Code architecture',
      'Creative brainstorming',
      'Technical risks',
    ],
  },
  creative: {
    title: 'Creative Analysis',
    description: 'Focus on unconventional ideas, edge cases, and innovative approaches',
    focusAreas: [
      'Unconventional approaches',
      'Edge cases',
      'Innovative solutions',
      'Alternative perspectives',
      'Unexpected use cases',
      'Cross-domain insights',
      'Future possibilities',
      'Contrarian viewpoints',
    ],
    avoidTopics: [
      'Standard implementations',
      'Market analysis',
      'Technical constraints',
      'Common risks',
    ],
  },
  critical: {
    title: 'Critical Analysis',
    description: 'Focus on risks, weaknesses, and potential failure points',
    focusAreas: [
      'Potential risks',
      'Weaknesses',
      'Failure scenarios',
      'Hidden costs',
      'Security concerns',
      'Compliance issues',
      'Long-term sustainability',
      'Worst-case scenarios',
    ],
    avoidTopics: [
      'Implementation steps',
      'Market opportunities',
      'Creative alternatives',
      'Technical details',
    ],
  },
};

export class FlashContextBuilder {
  private readonly version = '1.0.0';

  /**
   * Build a Flash Context Frame
   *
   * @param query - The user query
   * @param queryAnalysis - Analysis of the query
   * @param advisorSlots - Advisor slot assignments
   * @returns Complete Flash Context Frame
   */
  build(
    query: string,
    queryAnalysis: QueryAnalysis,
    advisorSlots: AdvisorSlot[]
  ): FlashContextFrame {
    console.log(`[FlashContextBuilder] Building frame for query: ${query.substring(0, 60)}...`);

    // Build project state (the bigger picture)
    const projectState = this.buildProjectState(query, queryAnalysis);

    // Assign roles and tasks to each advisor
    const advisorTasks = this.assignAdvisorTasks(query, queryAnalysis, advisorSlots);

    // Build constraints based on complexity
    const constraints = this.buildConstraints(queryAnalysis);

    const frame: FlashContextFrame = {
      version: this.version,
      query,
      projectState,
      advisorTasks,
      constraints,
      timestamp: Date.now(),
    };

    console.log(`[FlashContextBuilder] Frame built with ${advisorTasks.length} advisor tasks`);
    console.log(`[FlashContextBuilder] Roles assigned:`, advisorTasks.map(t => `Slot ${t.slot}: ${t.role}`).join(', '));

    return frame;
  }

  /**
   * Build project state / bigger picture context
   *
   * @param query - The user query
   * @param queryAnalysis - Query analysis
   * @returns Project state context
   */
  private buildProjectState(
    query: string,
    queryAnalysis: QueryAnalysis
  ): FlashContextFrame['projectState'] {
    // Determine current focus based on query type
    const currentFocus = this.determineCurrentFocus(queryAnalysis);

    // Build prior knowledge from query keywords
    const priorKnowledge = this.buildPriorKnowledge(queryAnalysis);

    // Build constraints
    const constraints = this.buildProjectConstraints(queryAnalysis);

    return {
      currentFocus,
      priorKnowledge,
      constraints,
    };
  }

  /**
   * Determine current focus from query analysis
   */
  private determineCurrentFocus(queryAnalysis: QueryAnalysis): string {
    const { queryType, complexity, requiresMultiplePerspectives } = queryAnalysis;

    const focusMap: Record<typeof queryType, string> = {
      factual: 'Providing accurate, concise factual information',
      comparative: 'Comprehensive comparison with multiple dimensions',
      procedural: 'Step-by-step guidance with clear implementation path',
      research: 'In-depth research with data points and sources',
      creative: 'Innovative brainstorming with diverse perspectives',
      analytical: 'Detailed analysis with insights and implications',
      troubleshooting: 'Root cause analysis and solution strategies',
      planning: 'Strategic planning with roadmap and milestones',
    };

    let focus = focusMap[queryType];

    if (complexity > 0.7) {
      focus += ' (high complexity - thorough analysis required)';
    }

    if (requiresMultiplePerspectives) {
      focus += ' (multiple perspectives essential)';
    }

    return focus;
  }

  /**
   * Build prior knowledge from query keywords
   */
  private buildPriorKnowledge(queryAnalysis: QueryAnalysis): string[] {
    const knowledge: string[] = [];

    // Add context based on query type
    switch (queryAnalysis.queryType) {
      case 'comparative':
        knowledge.push('Comparison requires balanced evaluation of multiple options');
        knowledge.push('Consider pros, cons, use cases, and trade-offs');
        break;
      case 'research':
        knowledge.push('Research requires data points, sources, and trends');
        knowledge.push('Include quantitative metrics where possible');
        break;
      case 'creative':
        knowledge.push('Creativity benefits from diverse perspectives');
        knowledge.push('Consider unconventional approaches');
        break;
      case 'troubleshooting':
        knowledge.push('Debugging requires systematic approach');
        knowledge.push('Consider root causes, not just symptoms');
        break;
    }

    // Add complexity-based context
    if (queryAnalysis.complexity > 0.7) {
      knowledge.push('High complexity query - thorough analysis needed');
    }

    // Compress if too many
    return this.compressPriorKnowledge(knowledge);
  }

  /**
   * Build project constraints
   */
  private buildProjectConstraints(queryAnalysis: QueryAnalysis): string[] {
    const constraints: string[] = [];

    // Time sensitivity
    if (queryAnalysis.timeSensitivity === 'high') {
      constraints.push('Prioritize speed - provide concise, actionable insights');
    }

    // Complexity-based constraints
    if (queryAnalysis.complexity < 0.3) {
      constraints.push('Simple query - avoid over-engineering');
    } else if (queryAnalysis.complexity > 0.7) {
      constraints.push('Complex query - ensure thoroughness');
    }

    // Sequential reasoning constraint
    if (queryAnalysis.requiresSequentialReasoning) {
      constraints.push('Maintain logical flow in reasoning');
    }

    return constraints;
  }

  /**
   * Compress prior knowledge for token optimization
   */
  private compressPriorKnowledge(knowledge: string[]): string[] {
    // If under 5 items, return as is
    if (knowledge.length <= 5) {
      return knowledge;
    }

    // Keep most important ones (first 5)
    return knowledge.slice(0, 5);
  }

  /**
   * Assign roles and tasks to each advisor slot
   *
   * @param query - User query
   * @param queryAnalysis - Query analysis
   * @param advisorSlots - Advisor slot assignments
   * @returns Array of advisor tasks
   */
  private assignAdvisorTasks(
    query: string,
    queryAnalysis: QueryAnalysis,
    advisorSlots: AdvisorSlot[]
  ): AdvisorTask[] {
    const roles: AdvisorRole[] = ['technical', 'strategic', 'creative', 'critical'];

    return advisorSlots.map((slot, index) => {
      const role = roles[index] || 'technical';
      const roleConfig = ROLE_FOCUS[role];

      return {
        slot: slot.slot,
        family: slot.family,
        role,
        specificFocus: this.selectRelevantFocus(roleConfig.focusAreas, queryAnalysis),
        avoidTopics: roleConfig.avoidTopics,
        instructions: this.buildRoleInstructions(role, queryAnalysis),
      };
    });
  }

  /**
   * Select relevant focus areas based on query analysis
   */
  private selectRelevantFocus(
    focusAreas: string[],
    queryAnalysis: QueryAnalysis
  ): string[] {
    // For simple queries, use fewer focus areas
    const maxFocus = queryAnalysis.complexity < 0.3 ? 3 : 5;

    return focusAreas.slice(0, maxFocus);
  }

  /**
   * Build role-specific instructions
   */
  private buildRoleInstructions(
    role: AdvisorRole,
    queryAnalysis: QueryAnalysis
  ): string {
    const baseInstructions: Record<AdvisorRole, string> = {
      technical: 'Analyze from an implementation perspective. Focus on how it works, what technologies are involved, and what challenges exist in building it.',
      strategic: 'Analyze from a business/market perspective. Focus on market trends, competitive positioning, and strategic implications.',
      creative: 'Think unconventionally. Consider edge cases, alternative approaches, and innovative solutions that others might miss.',
      critical: 'Be skeptical. Identify risks, weaknesses, potential failures, and hidden costs. What could go wrong?',
    };

    let instruction = baseInstructions[role];

    // Add complexity-specific guidance
    if (queryAnalysis.complexity > 0.7) {
      instruction += ' Given the complexity, provide thorough analysis with examples.';
    } else {
      instruction += ' Keep it concise but insightful.';
    }

    return instruction;
  }

  /**
   * Build constraints based on query complexity
   */
  private buildConstraints(queryAnalysis: QueryAnalysis): FlashContextFrame['constraints'] {
    // Determine max tokens based on complexity
    const maxTokens = queryAnalysis.complexity > 0.7 ? 2000 : 1000;

    // Determine time goal
    const timeGoal = queryAnalysis.timeSensitivity === 'high' ? 15000 : 30000;

    // Required elements based on query type
    const requiredElements: string[] = [];

    switch (queryAnalysis.queryType) {
      case 'comparative':
        requiredElements.push('Comparison table or structured format');
        requiredElements.push('Pros and cons for each option');
        break;
      case 'research':
        requiredElements.push('Data points with sources');
        requiredElements.push('Trends and insights');
        break;
      case 'procedural':
        requiredElements.push('Step-by-step instructions');
        requiredElements.push('Prerequisites and requirements');
        break;
      case 'creative':
        requiredElements.push('Multiple diverse ideas');
        requiredElements.push('Unconventional approaches');
        break;
    }

    return {
      maxTokens,
      timeGoal,
      requiredElements,
    };
  }

  /**
   * Convert Flash Context Frame to advisor-specific prompt
   *
   * @param frame - Flash context frame
   * @param slot - Advisor slot number
   * @returns Formatted prompt for this advisor
   */
  toPrompt(frame: FlashContextFrame, slot: number): string {
    const task = frame.advisorTasks.find(t => t.slot === slot);
    if (!task) {
      throw new Error(`No task found for slot ${slot}`);
    }

    const roleConfig = ROLE_FOCUS[task.role];

    const prompt = `# ${roleConfig.title}

## Your Role
${roleConfig.description}

## Query
${frame.query}

## Context
${frame.projectState.currentFocus}

${frame.projectState.priorKnowledge.length > 0 ? `### Background
${frame.projectState.priorKnowledge.map(k => `- ${k}`).join('\n')}` : ''}

${frame.projectState.constraints.length > 0 ? `### Constraints
${frame.projectState.constraints.map(c => `- ${c}`).join('\n')}` : ''}

## Your Specific Focus
${task.specificFocus.map(f => `- ${f}`).join('\n')}

## Important
${task.instructions}

**Avoid discussing:** ${task.avoidTopics.join(', ')} (other advisors cover these)

## Output Requirements
${frame.constraints.requiredElements.map(e => `- ${e}`).join('\n')}

- Maximum ${frame.constraints.maxTokens} tokens
- Target response time: ${Math.round(frame.constraints.timeGoal / 1000)}s
- End with: **Confidence: [High/Medium/Low]**

Provide your ${task.role} analysis now.`;

    return prompt;
  }
}
