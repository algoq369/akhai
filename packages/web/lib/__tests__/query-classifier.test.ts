import { describe, it, expect } from 'vitest'
import { classifyQueryIntent, type QueryIntent } from '../query-classifier'

describe('Query Classifier', () => {
  describe('classifyQueryIntent', () => {
    it('classifies factual queries', () => {
      const queries = [
        'What is the capital of France?',
        'When did World War II end?',
        'How many planets are in the solar system?',
      ]

      queries.forEach(query => {
        const result = classifyQueryIntent(query)
        expect(result.type).toBe('factual')
        expect(result.confidence).toBeGreaterThan(0)
        expect(result.confidence).toBeLessThanOrEqual(1)
      })
    })

    it('classifies analytical queries', () => {
      const queries = [
        'Why did the Roman Empire fall?',
        'How does machine learning differ from traditional programming?',
        'What are the implications of quantum computing?',
      ]

      queries.forEach(query => {
        const result = classifyQueryIntent(query)
        expect(result.type).toBe('analytical')
        expect(result.confidence).toBeGreaterThan(0)
      })
    })

    it('classifies creative queries', () => {
      const queries = [
        'Write a poem about artificial intelligence',
        'Create a story about a time traveler',
        'Generate a metaphor for consciousness',
      ]

      queries.forEach(query => {
        const result = classifyQueryIntent(query)
        expect(result.type).toBe('creative')
        expect(result.confidence).toBeGreaterThan(0)
      })
    })

    it('classifies procedural queries', () => {
      const queries = [
        'How do I install Node.js?',
        'Steps to create a React component',
        'Tutorial for building a REST API',
      ]

      queries.forEach(query => {
        const result = classifyQueryIntent(query)
        expect(result.type).toBe('procedural')
        expect(result.confidence).toBeGreaterThan(0)
      })
    })

    it('classifies conversational queries', () => {
      const queries = [
        'Hello, how are you?',
        'What do you think about this idea?',
        'Can you help me understand this better?',
      ]

      queries.forEach(query => {
        const result = classifyQueryIntent(query)
        expect(result.type).toBe('conversational')
        expect(result.confidence).toBeGreaterThan(0)
      })
    })

    it('returns valid QueryIntent structure', () => {
      const query = 'What is machine learning?'
      const result = classifyQueryIntent(query)

      expect(result).toHaveProperty('type')
      expect(result).toHaveProperty('confidence')
      expect(result).toHaveProperty('reasoning')
      expect(result).toHaveProperty('complexity')
      expect(result).toHaveProperty('requiresTools')
      expect(result).toHaveProperty('suggestedMethodology')
    })

    it('estimates complexity correctly', () => {
      const simple = 'What is 2 + 2?'
      const complex = 'Explain the philosophical implications of quantum entanglement on the nature of reality and causality'

      const simpleResult = classifyQueryIntent(simple)
      const complexResult = classifyQueryIntent(complex)

      expect(simpleResult.complexity).toBeLessThan(complexResult.complexity)
    })

    it('suggests appropriate methodologies', () => {
      const query = 'Step by step, explain how photosynthesis works'
      const result = classifyQueryIntent(query)

      expect(result.suggestedMethodology).toBeDefined()
      expect(['direct', 'cod', 'bot', 'react', 'pot', 'gtp', 'auto']).toContain(result.suggestedMethodology)
    })

    it('detects when tools are required', () => {
      const queries = [
        { query: 'Calculate 157 * 342', expectsTools: true },
        { query: 'What is the current price of Bitcoin?', expectsTools: true },
        { query: 'Who wrote Romeo and Juliet?', expectsTools: false },
      ]

      queries.forEach(({ query, expectsTools }) => {
        const result = classifyQueryIntent(query)
        expect(result.requiresTools).toBe(expectsTools)
      })
    })

    it('provides reasoning for classification', () => {
      const query = 'Why is the sky blue?'
      const result = classifyQueryIntent(query)

      expect(result.reasoning).toBeDefined()
      expect(result.reasoning.length).toBeGreaterThan(0)
      expect(typeof result.reasoning).toBe('string')
    })

    it('handles empty or very short queries', () => {
      const queries = ['', 'a', 'ok']

      queries.forEach(query => {
        const result = classifyQueryIntent(query)
        expect(result.type).toBeDefined()
        expect(result.confidence).toBeGreaterThanOrEqual(0)
        expect(result.confidence).toBeLessThanOrEqual(1)
      })
    })

    it('handles very long queries', () => {
      const query = 'A'.repeat(10000)
      const result = classifyQueryIntent(query)

      expect(result.type).toBeDefined()
      expect(result.confidence).toBeGreaterThanOrEqual(0)
    })

    it('maintains confidence scores between 0 and 1', () => {
      const queries = [
        'What is AI?',
        'How do neural networks work?',
        'Write a haiku about data',
        'Steps to deploy on Vercel',
        'Hello there',
      ]

      queries.forEach(query => {
        const result = classifyQueryIntent(query)
        expect(result.confidence).toBeGreaterThanOrEqual(0)
        expect(result.confidence).toBeLessThanOrEqual(1)
      })
    })
  })
})
