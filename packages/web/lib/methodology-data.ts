export interface MethodologyItem {
  id: string;
  symbol: string;
  name: string;
  tooltip: string;
  tokens: string;
  latency: string;
  cost: string;
  savings: string;
}

export interface MethodologyDetail {
  id: string;
  symbol: string;
  name: string;
  fullName: string;
  description: string;
  howItWorks: string[];
  format: string;
  bestFor: string[];
  examples: string[];
  metrics: {
    tokens: string;
    latency: string;
    cost: string;
  };
}

export const METHODOLOGIES: MethodologyItem[] = [
  {
    id: 'auto',
    symbol: '◎',
    name: 'auto',
    tooltip: 'Smart routing',
    tokens: '500-5k',
    latency: '2-30s',
    cost: 'varies',
    savings: 'varies',
  },
  {
    id: 'direct',
    symbol: '→',
    name: 'direct',
    tooltip: 'Single AI, instant',
    tokens: '200-500',
    latency: '~2s',
    cost: '$0.006',
    savings: '0%',
  },
  {
    id: 'cod',
    symbol: '⋯',
    name: 'cod',
    tooltip: 'Iterative draft',
    tokens: '~400',
    latency: '~8s',
    cost: '$0.012',
    savings: '92%',
  },
  {
    id: 'sc',
    symbol: '◇',
    name: 'sc',
    tooltip: 'Self-Consistency voting',
    tokens: '~600',
    latency: '~12s',
    cost: '$0.018',
    savings: '88%',
  },
  {
    id: 'react',
    symbol: '⟳',
    name: 'react',
    tooltip: 'Tools: search, calc',
    tokens: '2k-8k',
    latency: '~20s',
    cost: '$0.024',
    savings: '0%',
  },
  {
    id: 'pas',
    symbol: '△',
    name: 'pas',
    tooltip: 'Plan-and-Solve',
    tokens: '3k-6k',
    latency: '~15s',
    cost: '$0.018',
    savings: '+24%',
  },
  {
    id: 'tot',
    symbol: '◯',
    name: 'tot',
    tooltip: 'Tree of Thoughts',
    tokens: '8k-15k',
    latency: '~30s',
    cost: '$0.042',
    savings: '0%',
  },
];

export const METHODOLOGY_DETAILS: MethodologyDetail[] = [
  {
    id: 'auto',
    symbol: '◎',
    name: 'auto',
    fullName: 'Automatic Selection',
    description:
      'Intelligent routing system that analyzes your query and automatically selects the optimal methodology for the best results.',
    howItWorks: [
      'Analyzes query complexity and type',
      'Checks for math, step-by-step, or multi-perspective needs',
      'Routes to the most efficient methodology',
      'Optimizes for speed and accuracy',
    ],
    format: 'Varies based on selected methodology',
    bestFor: [
      'General queries when unsure which methodology to use',
      'Letting the system optimize for you',
      'Mixed query types in conversation',
    ],
    examples: [
      '"What is Bitcoin?" → routes to direct',
      '"Calculate 25 * 36" → routes to pot',
      '"Explain how to build an app step by step" → routes to cod',
    ],
    metrics: {
      tokens: '200-15k',
      latency: '2-30s',
      cost: '$0.006-$0.042',
    },
  },
  {
    id: 'direct',
    symbol: '→',
    name: 'direct',
    fullName: 'Direct Response',
    description:
      'Single AI call with immediate, comprehensive answer. The fastest and most efficient methodology for simple queries.',
    howItWorks: [
      'Send query directly to Claude Opus 4',
      'Get complete answer in one response',
      'No intermediate steps or iterations',
      'Optimized for speed and clarity',
    ],
    format: 'Clear, comprehensive, concise answer',
    bestFor: [
      'Factual questions with clear answers',
      'Simple queries under 100 characters',
      'When you need fast responses',
      'General knowledge questions',
    ],
    examples: ['"What is Bitcoin?"', '"Define blockchain"', '"Who invented Ethereum?"'],
    metrics: {
      tokens: '200-500',
      latency: '~2s',
      cost: '$0.006',
    },
  },
  {
    id: 'cod',
    symbol: '⋯',
    name: 'cod',
    fullName: 'Chain of Draft',
    description:
      'Iterative refinement process with multiple drafts, reflections, and continuous improvement until reaching the polished final answer.',
    howItWorks: [
      'Generate initial draft addressing core question',
      'Reflect on weaknesses, gaps, improvements needed',
      'Create refined second draft based on reflection',
      'Present final polished, comprehensive answer',
    ],
    format: '[DRAFT 1] → [REFLECTION] → [DRAFT 2] → [FINAL ANSWER]',
    bestFor: [
      'Step-by-step explanations',
      'Complex topics requiring thoroughness',
      'When quality matters more than speed',
      'Educational content needing clarity',
    ],
    examples: [
      '"Explain how neural networks work step by step"',
      '"How do I build a scalable web application?"',
      '"Draft a comprehensive strategy for..."',
    ],
    metrics: {
      tokens: '600-1000',
      latency: '~8s',
      cost: '$0.030',
    },
  },
  {
    id: 'sc',
    symbol: '◇',
    name: 'sc',
    fullName: 'Self-Consistency',
    description:
      'Wang et al., ICLR 2023, samples multiple reasoning paths and takes majority vote for robust answers.',
    howItWorks: [
      'Extract and buffer key facts, constraints, requirements',
      'Build reasoning chain referencing buffered context',
      'Cross-check answer against buffered information',
      'Provide validated answer with supporting reasoning',
    ],
    format: '[BUFFER] → [REASONING] → [VALIDATION] → [ANSWER]',
    bestFor: [
      'Queries with multiple constraints or requirements',
      'Complex context needing careful tracking',
      'Problems with specific conditions',
      'When accuracy is critical',
    ],
    examples: [
      '"Given budget $10k, 3 months timeline, must use TypeScript and be scalable..."',
      '"Assuming Bitcoin uses PoW and requires miner validation..."',
      '"With these requirements: real-time, authenticated, rate-limited..."',
    ],
    metrics: {
      tokens: '400-700',
      latency: '~12s',
      cost: '$0.018',
    },
  },
  {
    id: 'react',
    symbol: '⟳',
    name: 'react',
    fullName: 'Reasoning + Acting',
    description:
      'Cycles of thinking, acting (simulated search/lookup), and observing results until reaching a well-informed final answer.',
    howItWorks: [
      'Think: Analyze what information is needed',
      'Act: Describe search/lookup operation (simulated)',
      'Observe: State findings or knowledge retrieved',
      'Repeat: Continue cycles until complete',
      'Answer: Provide final response based on observations',
    ],
    format: '[THOUGHT] → [ACTION] → [OBSERVATION] → ... → [FINAL ANSWER]',
    bestFor: [
      'Research-style queries',
      'Questions requiring information lookup',
      'Latest trends or current events',
      'Multi-source information gathering',
    ],
    examples: [
      '"Search for the latest AI research trends in 2025"',
      '"Find information about recent blockchain innovations"',
      '"Look up current best practices for..."',
    ],
    metrics: {
      tokens: '500-800',
      latency: '~20s',
      cost: '$0.024',
    },
  },
  {
    id: 'pas',
    symbol: '△',
    name: 'pas',
    fullName: 'Plan-and-Solve',
    description:
      'Computational reasoning with pseudocode, step-by-step execution, and verification. Perfect for math and logical problems.',
    howItWorks: [
      'Analyze the computational/mathematical problem',
      'Write logical steps as pseudocode',
      'Execute logic step-by-step with actual values',
      'Verify calculations and logic are correct',
      'Present final result with full explanation',
    ],
    format: '[PROBLEM] → [LOGIC/PSEUDOCODE] → [EXECUTION] → [VERIFICATION] → [RESULT]',
    bestFor: [
      'Mathematical calculations',
      'Computational problems',
      'Logic puzzles',
      'Algorithmic thinking',
    ],
    examples: [
      '"Calculate compound interest on $10k at 5% for 10 years"',
      '"What is 15 * 23?"',
      '"Compute the factorial of 12"',
    ],
    metrics: {
      tokens: '400-600',
      latency: '~15s',
      cost: '$0.020',
    },
  },
  {
    id: 'tot',
    symbol: '◯',
    name: 'tot',
    fullName: 'Tree of Thoughts',
    description:
      'Yao et al., NeurIPS 2023, explores multiple reasoning branches, evaluates and prunes for optimal solutions.',
    howItWorks: [
      'Round 1: DeepSeek, Mistral, Grok analyze independently',
      "Round 2: Each AI sees others' perspectives and refines",
      'Synthesis: Claude merges insights into unified response',
      'Consensus: Balanced answer from multiple AI viewpoints',
    ],
    format: '[ROUND 1: Independent] → [ROUND 2: Cross-Pollination] → [SYNTHESIS] → [CONSENSUS]',
    bestFor: [
      'Complex decisions needing multiple perspectives',
      'Strategic analysis with different angles',
      'When you want AI debate and consensus',
      'High-stakes questions requiring thorough coverage',
    ],
    examples: [
      '"Analyze blockchain technology from multiple perspectives"',
      '"What are the pros and cons of remote work?"',
      '"Evaluate this business strategy from different angles"',
    ],
    metrics: {
      tokens: '8k-15k',
      latency: '~30s',
      cost: '$0.042',
    },
  },
];
