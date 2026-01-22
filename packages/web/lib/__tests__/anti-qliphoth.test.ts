import { describe, it, expect } from 'vitest'
import {
  detectQliphoth,
  purifyResponse,
  hasExcessiveCertainty,
  lacksVerifiableGrounding,
  hasInformationOverload,
  hasSuperficialDepth,
  hasArrogantTone,
} from '../anti-qliphoth'

describe('Anti-Qliphoth Detection System', () => {
  describe('hasExcessiveCertainty', () => {
    it('detects absolute certainty language', () => {
      const text = 'This is absolutely certain and definitely true without any doubt whatsoever.'
      expect(hasExcessiveCertainty(text)).toBe(true)
    })

    it('accepts balanced language', () => {
      const text = 'This approach might work in most cases, though there are exceptions.'
      expect(hasExcessiveCertainty(text)).toBe(false)
    })

    it('detects guarantee language', () => {
      const text = 'I guarantee this will work perfectly every single time.'
      expect(hasExcessiveCertainty(text)).toBe(true)
    })
  })

  describe('lacksVerifiableGrounding', () => {
    it('detects lack of specific evidence', () => {
      const text = 'Studies have shown that this is true. Research indicates positive results.'
      expect(lacksVerifiableGrounding(text)).toBe(true)
    })

    it('accepts well-grounded claims', () => {
      const text = 'According to Smith et al. (2023), the results show a 45% improvement.'
      expect(lacksVerifiableGrounding(text)).toBe(false)
    })

    it('detects vague attributions', () => {
      const text = 'Experts say this is the best approach. Many people believe this works.'
      expect(lacksVerifiableGrounding(text)).toBe(true)
    })
  })

  describe('hasInformationOverload', () => {
    it('detects excessive lists', () => {
      const text = 'Here are the benefits: 1. Benefit one 2. Benefit two 3. Benefit three 4. Benefit four 5. Benefit five 6. Benefit six 7. Benefit seven 8. Benefit eight'
      expect(hasInformationOverload(text)).toBe(true)
    })

    it('accepts reasonable information density', () => {
      const text = 'The main benefits are improved performance, better user experience, and lower costs.'
      expect(hasInformationOverload(text)).toBe(false)
    })

    it('detects keyword stuffing', () => {
      const text = 'AI machine learning artificial intelligence neural networks deep learning best practices optimization performance scalability efficiency productivity innovation technology'
      expect(hasInformationOverload(text)).toBe(true)
    })
  })

  describe('hasSuperficialDepth', () => {
    it('detects generic buzzwords', () => {
      const text = 'This innovative solution leverages cutting-edge technology to optimize workflows and drive results.'
      expect(hasSuperficialDepth(text)).toBe(true)
    })

    it('accepts specific technical content', () => {
      const text = 'The algorithm uses a binary search tree with O(log n) time complexity for lookups.'
      expect(hasSuperficialDepth(text)).toBe(false)
    })

    it('detects marketing-speak', () => {
      const text = 'Revolutionary game-changing paradigm shift with synergistic best-in-class solutions.'
      expect(hasSuperficialDepth(text)).toBe(true)
    })
  })

  describe('hasArrogantTone', () => {
    it('detects dismissive language', () => {
      const text = 'Obviously, anyone who knows anything would understand this. It\'s simple.'
      expect(hasArrogantTone(text)).toBe(true)
    })

    it('accepts humble, helpful tone', () => {
      const text = 'This might be a useful approach. Let me know if you need clarification.'
      expect(hasArrogantTone(text)).toBe(false)
    })

    it('detects condescension', () => {
      const text = 'Let me explain this in simple terms since you clearly don\'t get it.'
      expect(hasArrogantTone(text)).toBe(true)
    })
  })

  describe('detectQliphoth', () => {
    it('detects Nahemoth (excessive certainty)', () => {
      const response = 'This is absolutely, definitely, certainly, undoubtedly the only correct answer.'
      const risk = detectQliphoth(response)
      expect(risk.detected).toBe(true)
      expect(risk.shell).toBe('Nahemoth')
      expect(risk.severity).toBeGreaterThan(0)
    })

    it('detects Sathariel (jargon concealment)', () => {
      const response = 'Studies show that experts agree research indicates common knowledge suggests...'
      const risk = detectQliphoth(response)
      expect(risk.detected).toBe(true)
      expect(risk.shell).toBe('Sathariel')
    })

    it('detects Chaigidel (information overload)', () => {
      const response = '1. First point 2. Second point 3. Third point 4. Fourth point 5. Fifth point 6. Sixth point 7. Seventh point 8. Eighth point'
      const risk = detectQliphoth(response)
      expect(risk.detected).toBe(true)
      expect(risk.shell).toBe('Chaigidel')
    })

    it('detects Ghagiel (superficial depth)', () => {
      const response = 'This revolutionary innovative cutting-edge solution synergizes best-in-class paradigms.'
      const risk = detectQliphoth(response)
      expect(risk.detected).toBe(true)
      expect(risk.shell).toBe('Ghagiel')
    })

    it('detects Samael (arrogant superiority)', () => {
      const response = 'Obviously, anyone with basic knowledge would understand this simple concept.'
      const risk = detectQliphoth(response)
      expect(risk.detected).toBe(true)
      expect(risk.shell).toBe('Samael')
    })

    it('passes clean, well-grounded responses', () => {
      const response = 'According to recent research (Smith 2023), approximately 65% of users reported improved outcomes when using this approach. The method involves three main steps: data collection, analysis, and implementation.'
      const risk = detectQliphoth(response)
      expect(risk.detected).toBe(false)
      expect(risk.severity).toBe(0)
    })

    it('calculates severity correctly', () => {
      const response = 'This is absolutely certain and definitely true without any doubt whatsoever.'
      const risk = detectQliphoth(response)
      expect(risk.severity).toBeGreaterThanOrEqual(0)
      expect(risk.severity).toBeLessThanOrEqual(1)
    })
  })

  describe('purifyResponse', () => {
    it('returns original response when no risk detected', () => {
      const response = 'This is a clean, well-grounded response.'
      const risk = detectQliphoth(response)
      const purified = purifyResponse(response, risk)
      expect(purified).toBe(response)
    })

    it('purifies response when risk detected', () => {
      const response = 'This is absolutely certain without any doubt.'
      const risk = detectQliphoth(response)
      const purified = purifyResponse(response, risk)

      // Should contain purification markers
      expect(purified).toContain('⚠')
      expect(purified).toBeDefined()
      expect(purified.length).toBeGreaterThan(0)
    })
  })
})
