'use client'

import { useState, useEffect, useRef, useMemo, memo } from 'react'

interface MethodologyDetail {
  id: string
  symbol: string
  name: string
  fullName: string
  description: string
  howItWorks: string[]
  format: string
  bestFor: string[]
  examples: string[]
  metrics: {
    tokens: string
    latency: string
    cost: string
  }
}

const METHODOLOGY_DETAILS: MethodologyDetail[] = [
  {
    id: 'auto',
    symbol: '◎',
    name: 'auto',
    fullName: 'Automatic Selection',
    description: 'Intelligent routing system that analyzes your query and automatically selects the optimal methodology for the best results.',
    howItWorks: [
      'Analyzes query complexity and type',
      'Checks for math, step-by-step, or multi-perspective needs',
      'Routes to the most efficient methodology',
      'Optimizes for speed and accuracy'
    ],
    format: 'Varies based on selected methodology',
    bestFor: [
      'General queries when unsure which methodology to use',
      'Letting the system optimize for you',
      'Mixed query types in conversation'
    ],
    examples: [
      '"What is Bitcoin?" → routes to direct',
      '"Calculate 25 * 36" → routes to pot',
      '"Explain how to build an app step by step" → routes to cod'
    ],
    metrics: {
      tokens: '200-15k',
      latency: '2-30s',
      cost: '$0.006-$0.042'
    }
  },
  {
    id: 'direct',
    symbol: '→',
    name: 'direct',
    fullName: 'Direct Response',
    description: 'Single AI call with immediate, comprehensive answer. The fastest and most efficient methodology for simple queries.',
    howItWorks: [
      'Send query directly to Claude Opus 4',
      'Get complete answer in one response',
      'No intermediate steps or iterations',
      'Optimized for speed and clarity'
    ],
    format: 'Clear, comprehensive, concise answer',
    bestFor: [
      'Factual questions with clear answers',
      'Simple queries under 100 characters',
      'When you need fast responses',
      'General knowledge questions'
    ],
    examples: [
      '"What is Bitcoin?"',
      '"Define blockchain"',
      '"Who invented Ethereum?"'
    ],
    metrics: {
      tokens: '200-500',
      latency: '~2s',
      cost: '$0.006'
    }
  },
  {
    id: 'cod',
    symbol: '⋯',
    name: 'cod',
    fullName: 'Chain of Draft',
    description: 'Iterative refinement process with multiple drafts, reflections, and continuous improvement until reaching the polished final answer.',
    howItWorks: [
      'Generate initial draft addressing core question',
      'Reflect on weaknesses, gaps, improvements needed',
      'Create refined second draft based on reflection',
      'Present final polished, comprehensive answer'
    ],
    format: '[DRAFT 1] → [REFLECTION] → [DRAFT 2] → [FINAL ANSWER]',
    bestFor: [
      'Step-by-step explanations',
      'Complex topics requiring thoroughness',
      'When quality matters more than speed',
      'Educational content needing clarity'
    ],
    examples: [
      '"Explain how neural networks work step by step"',
      '"How do I build a scalable web application?"',
      '"Draft a comprehensive strategy for..."'
    ],
    metrics: {
      tokens: '600-1000',
      latency: '~8s',
      cost: '$0.030'
    }
  },
  {
    id: 'bot',
    symbol: '◇',
    name: 'bot',
    fullName: 'Buffer of Thoughts',
    description: 'Maintains a context buffer of key facts, constraints, and requirements while reasoning step-by-step and validating against the buffer.',
    howItWorks: [
      'Extract and buffer key facts, constraints, requirements',
      'Build reasoning chain referencing buffered context',
      'Cross-check answer against buffered information',
      'Provide validated answer with supporting reasoning'
    ],
    format: '[BUFFER] → [REASONING] → [VALIDATION] → [ANSWER]',
    bestFor: [
      'Queries with multiple constraints or requirements',
      'Complex context needing careful tracking',
      'Problems with specific conditions',
      'When accuracy is critical'
    ],
    examples: [
      '"Given budget $10k, 3 months timeline, must use TypeScript and be scalable..."',
      '"Assuming Bitcoin uses PoW and requires miner validation..."',
      '"With these requirements: real-time, authenticated, rate-limited..."'
    ],
    metrics: {
      tokens: '400-700',
      latency: '~12s',
      cost: '$0.018'
    }
  },
  {
    id: 'react',
    symbol: '⟳',
    name: 'react',
    fullName: 'Reasoning + Acting',
    description: 'Cycles of thinking, acting (simulated search/lookup), and observing results until reaching a well-informed final answer.',
    howItWorks: [
      'Think: Analyze what information is needed',
      'Act: Describe search/lookup operation (simulated)',
      'Observe: State findings or knowledge retrieved',
      'Repeat: Continue cycles until complete',
      'Answer: Provide final response based on observations'
    ],
    format: '[THOUGHT] → [ACTION] → [OBSERVATION] → ... → [FINAL ANSWER]',
    bestFor: [
      'Research-style queries',
      'Questions requiring information lookup',
      'Latest trends or current events',
      'Multi-source information gathering'
    ],
    examples: [
      '"Search for the latest AI research trends in 2025"',
      '"Find information about recent blockchain innovations"',
      '"Look up current best practices for..."'
    ],
    metrics: {
      tokens: '500-800',
      latency: '~20s',
      cost: '$0.024'
    }
  },
  {
    id: 'pot',
    symbol: '△',
    name: 'pot',
    fullName: 'Program of Thought',
    description: 'Computational reasoning with pseudocode, step-by-step execution, and verification. Perfect for math and logical problems.',
    howItWorks: [
      'Analyze the computational/mathematical problem',
      'Write logical steps as pseudocode',
      'Execute logic step-by-step with actual values',
      'Verify calculations and logic are correct',
      'Present final result with full explanation'
    ],
    format: '[PROBLEM] → [LOGIC/PSEUDOCODE] → [EXECUTION] → [VERIFICATION] → [RESULT]',
    bestFor: [
      'Mathematical calculations',
      'Computational problems',
      'Logic puzzles',
      'Algorithmic thinking'
    ],
    examples: [
      '"Calculate compound interest on $10k at 5% for 10 years"',
      '"What is 15 * 23?"',
      '"Compute the factorial of 12"'
    ],
    metrics: {
      tokens: '400-600',
      latency: '~15s',
      cost: '$0.020'
    }
  },
  {
    id: 'gtp',
    symbol: '◯',
    name: 'gtp',
    fullName: 'Generative Thought Process',
    description: 'Multi-perspective analysis from technical, strategic, and critical angles, synthesized into a balanced consensus answer.',
    howItWorks: [
      'Technical Perspective: Implementation and practical analysis',
      'Strategic Perspective: Broader implications and approaches',
      'Critical Perspective: Identify issues and limitations',
      'Synthesis: Combine insights from all perspectives',
      'Consensus: Provide balanced, well-rounded answer'
    ],
    format: '[TECHNICAL] → [STRATEGIC] → [CRITICAL] → [SYNTHESIS] → [CONSENSUS]',
    bestFor: [
      'Multi-perspective analysis needed',
      'Complex strategic decisions',
      'When you want comprehensive coverage',
      'Balancing different viewpoints'
    ],
    examples: [
      '"Analyze blockchain technology from multiple perspectives"',
      '"Provide a consensus view on AI safety"',
      '"Evaluate this technology from different angles"'
    ],
    metrics: {
      tokens: '700-1200',
      latency: '~30s',
      cost: '$0.042'
    }
  }
]

interface MethodologyExplorerProps {
  isVisible: boolean
  onClose: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

const MethodologyExplorer = memo(function MethodologyExplorer({ 
  isVisible, 
  onClose,
  onMouseEnter,
  onMouseLeave 
}: MethodologyExplorerProps) {
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const explorerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true)
    } else {
      // Delay resetting animation to allow exit animation
      const timer = setTimeout(() => {
        setIsAnimating(false)
        setSelectedMethod(null)
      }, 300) // Match transition duration
      return () => clearTimeout(timer)
    }
  }, [isVisible])

  // useMemo MUST be called before any conditional returns (Rules of Hooks)
  const selectedDetail = useMemo(() => 
    METHODOLOGY_DETAILS.find(m => m.id === selectedMethod),
    [selectedMethod]
  )

  // Early return AFTER all hooks are called (Rules of Hooks)
  if (!isVisible && !isAnimating) return null

  const handleMethodClick = (id: string) => {
    setSelectedMethod(id)
  }

  const handleBack = () => {
    setSelectedMethod(null)
  }

  const handleAnimationEnd = () => {
    if (!isVisible) {
      setIsAnimating(false)
    }
  }

  return (
    <div
      ref={explorerRef}
      data-methodology-explorer
      className={`fixed inset-0 z-50 flex items-center justify-center pointer-events-none transition-opacity duration-300 ease-in-out ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onAnimationEnd={handleAnimationEnd}
    >
      {/* Backdrop blur - only close on click, not hover */}
      <div
        data-backdrop
        className={`absolute inset-0 backdrop-blur-sm bg-relic-mist/5 transition-opacity duration-300 pointer-events-auto ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Horizontal Menu or Detail View */}
      <div
        className={`relative pointer-events-auto transition-all duration-500 ease-in-out ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {!selectedMethod ? (
          /* Horizontal Navigation */
          <div 
            data-methodology-circle
            className="flex flex-row items-center gap-2 p-4 bg-relic-white/95 backdrop-blur-md border border-relic-mist shadow-xl"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
          >
            {/* Horizontal Menu Items */}
            {METHODOLOGY_DETAILS.map((method, index) => (
              <button
                key={method.id}
                onClick={() => handleMethodClick(method.id)}
                className="group flex flex-col items-center justify-center w-20 h-20 bg-relic-ghost/30 border border-relic-mist hover:border-relic-slate/60 hover:bg-relic-ghost transition-all duration-300 hover:shadow-md"
                style={{
                  animationDelay: `${index * 0.05}s`
                }}
              >
                <div className="text-xl text-relic-slate group-hover:scale-110 transition-transform">
                  {method.symbol}
                </div>
                <div className="text-[10px] font-mono text-relic-slate mt-1">
                  {method.name}
                </div>
              </button>
            ))}
          </div>
        ) : (
          /* Detail View - Ultra Minimal */
          <div className="w-[160px] bg-relic-white/95 dark:bg-relic-void/95 backdrop-blur-md border border-relic-mist dark:border-relic-slate/30 shadow-2xl animate-fade-in">
            {/* Header - Micro */}
            <div className="border-b border-relic-mist/30 dark:border-relic-slate/20 px-1.5 py-1 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <div className="text-sm text-relic-slate dark:text-white">{selectedDetail?.symbol}</div>
                <h2 className="text-[10px] font-mono text-relic-slate dark:text-white">{selectedDetail?.name}</h2>
              </div>
              <button onClick={handleBack} className="text-[8px] text-relic-silver dark:text-relic-ghost hover:text-relic-slate dark:hover:text-white">✕</button>
            </div>

            {/* Content - Data Only */}
            <div className="px-1.5 py-1 space-y-1">
              {/* Single step */}
              <p className="text-[6px] text-relic-slate dark:text-relic-ghost leading-tight">{selectedDetail?.howItWorks[0]}</p>

              {/* Metrics - Ultra compact */}
              <div className="pt-0.5 border-t border-relic-mist/20 dark:border-relic-slate/10 space-y-0.5">
                <div className="flex justify-between">
                  <span className="text-[6px] text-relic-silver dark:text-relic-ghost">tkn</span>
                  <span className="text-[6px] font-mono text-relic-slate dark:text-white">{selectedDetail?.metrics.tokens}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[6px] text-relic-silver dark:text-relic-ghost">lat</span>
                  <span className="text-[6px] font-mono text-relic-slate dark:text-white">{selectedDetail?.metrics.latency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[6px] text-relic-silver dark:text-relic-ghost">$</span>
                  <span className="text-[6px] font-mono text-relic-slate dark:text-white">{selectedDetail?.metrics.cost}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

export default MethodologyExplorer
