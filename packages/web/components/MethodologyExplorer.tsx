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

const MethodologyExplorer = memo(function MethodologyExplorer({ isVisible, onClose }: { isVisible: boolean; onClose: () => void }) {
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
      onMouseEnter={() => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/3a942698-b8f2-4482-824a-ac082ba88036',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/MethodologyExplorer.tsx:280',message:'Mouse enter explorer',data:{isVisible},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'K'})}).catch(()=>{});
        // #endregion
      }}
      onMouseLeave={() => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/3a942698-b8f2-4482-824a-ac082ba88036',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/MethodologyExplorer.tsx:285',message:'Mouse leave explorer backdrop',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'M'})}).catch(()=>{});
        // #endregion
        // Close when mouse leaves the backdrop (outside circle)
        onClose()
      }}
    >
      {/* Backdrop blur */}
      <div
        data-backdrop
        className={`absolute inset-0 backdrop-blur-sm bg-relic-mist/5 transition-opacity duration-300 pointer-events-auto ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
        onMouseEnter={() => {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/3a942698-b8f2-4482-824a-ac082ba88036',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/MethodologyExplorer.tsx:300',message:'Mouse enter backdrop - closing',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'M'})}).catch(()=>{});
          // #endregion
          // Close when mouse enters backdrop (outside circle)
          onClose()
        }}
      />

      {/* Circular Menu or Detail View */}
      <div
        className={`relative pointer-events-auto transition-all duration-500 ease-in-out ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {!selectedMethod ? (
          /* Circular Navigation */
          <div 
            data-methodology-circle
            className="relative w-[450px] h-[450px]"
            onMouseEnter={() => {
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/3a942698-b8f2-4482-824a-ac082ba88036',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/MethodologyExplorer.tsx:324',message:'Mouse enter circle container',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'N'})}).catch(()=>{});
              // #endregion
            }}
            onMouseLeave={(e) => {
              // #region agent log
              try {
                const relatedTarget = e.relatedTarget as Element | null
                const isElement = relatedTarget instanceof Element
                let isMovingToDiamond = false
                if (isElement) {
                  try {
                    isMovingToDiamond = !!relatedTarget.closest('[data-diamond-logo]')
                  } catch (err) {
                    // Ignore errors from closest()
                  }
                }
                // Only log safe, serializable data (not DOM elements)
                const logData = {
                  location: 'components/MethodologyExplorer.tsx:327',
                  message: 'Mouse leave circle container',
                  data: {
                    relatedTargetTag: isElement ? relatedTarget.tagName : null,
                    isElement,
                    isMovingToDiamond,
                  },
                  timestamp: Date.now(),
                  sessionId: 'debug-session',
                  runId: 'run1',
                  hypothesisId: 'N'
                }
                fetch('http://127.0.0.1:7242/ingest/3a942698-b8f2-4482-824a-ac082ba88036',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData)}).catch(()=>{});
              } catch (err) {
                // Silently ignore instrumentation errors
              }
              // #endregion
              // Close when mouse leaves circle container (unless moving back to diamond)
              try {
                const relatedTarget = e.relatedTarget as Element | null
                const isElement = relatedTarget instanceof Element
                let isMovingToDiamond = false
                if (isElement) {
                  try {
                    isMovingToDiamond = !!relatedTarget.closest('[data-diamond-logo]')
                  } catch (err) {
                    // Ignore errors
                  }
                }
                if (!isMovingToDiamond) {
                  // Small delay to prevent flickering when moving between diamond and circle
                  setTimeout(() => {
                    try {
                      if (!isElement || !relatedTarget?.closest('[data-methodology-circle]')) {
                        onClose()
                      }
                    } catch (err) {
                      onClose()
                    }
                  }, 100)
                }
              } catch (err) {
                // If we can't determine, default to closing
                onClose()
              }
            }}
          >
            {/* Center Diamond */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="text-5xl text-relic-mist animate-pulse-slow">◊</div>
              <p className="text-[10px] uppercase tracking-widest text-relic-silver text-center mt-3">
                methodologies
              </p>
            </div>

            {/* Circular Menu Items */}
            {METHODOLOGY_DETAILS.map((method, index) => {
              const angle = (index / METHODOLOGY_DETAILS.length) * 2 * Math.PI - Math.PI / 2
              const radius = 160
              const x = Math.cos(angle) * radius
              const y = Math.sin(angle) * radius

              return (
                <button
                  key={method.id}
                  onClick={() => handleMethodClick(method.id)}
                  className="absolute group"
                  style={{
                    left: `calc(50% + ${x}px)`,
                    top: `calc(50% + ${y}px)`,
                    transform: 'translate(-50%, -50%)',
                    transition: `all 0.3s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.05}s`
                  }}
                >
                  {/* Outer ring */}
                  <div className="absolute inset-0 -m-3 rounded-full border border-relic-mist/20 group-hover:border-relic-slate/50 group-hover:scale-110 transition-all duration-300" />

                  {/* Method card */}
                  <div className="relative w-24 h-24 bg-relic-white/90 backdrop-blur-md border border-relic-mist hover:border-relic-slate/60 hover:bg-relic-ghost transition-all duration-300 flex flex-col items-center justify-center gap-1.5 group-hover:shadow-lg">
                    <div className="text-2xl text-relic-slate group-hover:text-relic-slate transition-colors">
                      {method.symbol}
                    </div>
                    <div className="text-xs font-mono text-relic-slate group-hover:font-semibold transition-all">
                      {method.name}
                    </div>
                    <div className="text-[8px] text-relic-silver text-center px-2 leading-tight">
                      {method.fullName.split(' ').slice(0, 2).join(' ')}
                    </div>
                  </div>

                  {/* Connecting line */}
                  <svg
                    className="absolute top-1/2 left-1/2 pointer-events-none"
                    style={{
                      width: Math.abs(x) * 2,
                      height: Math.abs(y) * 2,
                      transform: `translate(${x > 0 ? '-100%' : '0'}, ${y > 0 ? '-100%' : '0'})`
                    }}
                  >
                    <line
                      x1={x > 0 ? '100%' : '0'}
                      y1={y > 0 ? '100%' : '0'}
                      x2={x > 0 ? '50%' : '50%'}
                      y2={y > 0 ? '50%' : '50%'}
                      stroke="rgba(163, 163, 163, 0.15)"
                      strokeWidth="1"
                      className="group-hover:stroke-relic-slate/30 transition-all"
                    />
                  </svg>
                </button>
              )
            })}
          </div>
        ) : (
          /* Detail View */
          <div className="w-[800px] bg-relic-white/95 backdrop-blur-md border border-relic-mist shadow-2xl animate-fade-in">
            {/* Header */}
            <div className="border-b border-relic-mist/50 p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-5xl text-relic-slate">{selectedDetail?.symbol}</div>
                <div>
                  <h2 className="text-2xl font-mono text-relic-slate">{selectedDetail?.name}</h2>
                  <p className="text-sm text-relic-silver">{selectedDetail?.fullName}</p>
                </div>
              </div>
              <button
                onClick={handleBack}
                className="text-xs uppercase tracking-widest text-relic-silver hover:text-relic-slate transition-colors"
              >
                ← back
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Description */}
              <div>
                <h3 className="relic-label mb-2">Description</h3>
                <p className="text-sm text-relic-slate leading-relaxed">{selectedDetail?.description}</p>
              </div>

              {/* How It Works */}
              <div>
                <h3 className="relic-label mb-3">How It Works</h3>
                <div className="space-y-2">
                  {selectedDetail?.howItWorks.map((step, i) => (
                    <div key={i} className="flex gap-3">
                      <span className="text-xs text-relic-silver mt-0.5">{i + 1}.</span>
                      <p className="text-sm text-relic-slate flex-1">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Format */}
              <div>
                <h3 className="relic-label mb-2">Response Format</h3>
                <div className="bg-relic-ghost/50 border border-relic-mist px-4 py-3">
                  <code className="text-xs font-mono text-relic-slate">{selectedDetail?.format}</code>
                </div>
              </div>

              {/* Best For */}
              <div>
                <h3 className="relic-label mb-3">Best For</h3>
                <ul className="space-y-1.5">
                  {selectedDetail?.bestFor.map((item, i) => (
                    <li key={i} className="flex gap-2 text-sm text-relic-slate">
                      <span className="text-relic-silver">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Examples */}
              <div>
                <h3 className="relic-label mb-3">Example Queries</h3>
                <div className="space-y-2">
                  {selectedDetail?.examples.map((example, i) => (
                    <div key={i} className="bg-relic-ghost/30 border border-relic-mist px-3 py-2">
                      <p className="text-xs font-mono text-relic-slate">{example}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Metrics */}
              <div>
                <h3 className="relic-label mb-3">Performance Metrics</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-relic-ghost/30 border border-relic-mist p-3">
                    <p className="text-[10px] uppercase tracking-widest text-relic-silver mb-1">Tokens</p>
                    <p className="text-sm font-mono text-relic-slate">{selectedDetail?.metrics.tokens}</p>
                  </div>
                  <div className="bg-relic-ghost/30 border border-relic-mist p-3">
                    <p className="text-[10px] uppercase tracking-widest text-relic-silver mb-1">Latency</p>
                    <p className="text-sm font-mono text-relic-slate">{selectedDetail?.metrics.latency}</p>
                  </div>
                  <div className="bg-relic-ghost/30 border border-relic-mist p-3">
                    <p className="text-[10px] uppercase tracking-widest text-relic-silver mb-1">Est. Cost</p>
                    <p className="text-sm font-mono text-relic-slate">{selectedDetail?.metrics.cost}</p>
                  </div>
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
