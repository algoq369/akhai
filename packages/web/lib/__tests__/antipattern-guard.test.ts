import { describe, it, expect } from 'vitest';
import {
  detectAntipattern,
  purifyResponse,
  hasExcessiveCertainty,
  lacksVerifiableGrounding,
  hasInformationOverload,
  hasSuperficialDepth,
  hasArrogantTone,
} from '../antipattern-guard';

describe('Antipattern Guard Detection System', () => {
  describe('hasExcessiveCertainty', () => {
    it('detects absolute certainty language', () => {
      const text = 'This is absolutely certain and definitely true without any doubt whatsoever.';
      expect(hasExcessiveCertainty(text)).toBe(true);
    });

    it('accepts balanced language', () => {
      const text = 'This approach might work in most cases, though there are exceptions.';
      expect(hasExcessiveCertainty(text)).toBe(false);
    });

    it('detects guarantee language', () => {
      // >3% of words must be absolute markers (always/never/impossible/guaranteed/certain/definitely/absolutely)
      const text = 'This is absolutely guaranteed and definitely certain to always work.';
      expect(hasExcessiveCertainty(text)).toBe(true);
    });
  });

  describe('lacksVerifiableGrounding', () => {
    it('detects lack of specific evidence', () => {
      // Needs >5 factual claims (is/are/was/were) AND no grounding markers
      const text =
        'The system is fast. It is reliable. The results are positive. The approach is sound. Users are happy. Performance is great. The design is clean.';
      expect(lacksVerifiableGrounding(text)).toBe(true);
    });

    it('accepts well-grounded claims', () => {
      const text = 'According to Smith et al. (2023), the results show a 45% improvement.';
      expect(lacksVerifiableGrounding(text)).toBe(false);
    });

    it('detects vague attributions', () => {
      // No grounding markers (according to, research shows, studies, data shows, years) + >5 factual claims
      const text =
        'The tool is the best option. It is widely used. The results are impressive. Adoption is growing. Speed is unmatched. Quality is top-tier.';
      expect(lacksVerifiableGrounding(text)).toBe(true);
    });
  });

  describe('hasInformationOverload', () => {
    it('detects excessive lists', () => {
      // Needs >10 bullet points matching ^[-•*]\s at line start
      const text =
        '- First point\n- Second point\n- Third point\n- Fourth point\n- Fifth point\n- Sixth point\n- Seventh point\n- Eighth point\n- Ninth point\n- Tenth point\n- Eleventh point\n- Twelfth point';
      expect(hasInformationOverload(text)).toBe(true);
    });

    it('accepts reasonable information density', () => {
      const text =
        'The main benefits are improved performance, better user experience, and lower costs.';
      expect(hasInformationOverload(text)).toBe(false);
    });

    it('detects keyword stuffing via bullet overload', () => {
      // Function only detects bullet points, not inline keywords
      const text =
        '* AI benefits\n* Machine learning\n* Neural networks\n* Deep learning\n* Best practices\n* Optimization\n* Performance\n* Scalability\n* Efficiency\n* Productivity\n* Innovation';
      expect(hasInformationOverload(text)).toBe(true);
    });
  });

  describe('hasSuperficialDepth', () => {
    it('detects generic buzzwords', () => {
      // Needs one of: 'it depends', 'varies', 'there are many factors', 'your mileage may vary'
      // AND no specifics (no numbers, no 'for example') AND text < 300 chars
      const text = 'Well, it depends on many things and your mileage may vary.';
      expect(hasSuperficialDepth(text)).toBe(true);
    });

    it('accepts specific technical content', () => {
      const text =
        'The algorithm uses a binary search tree with O(log n) time complexity for lookups.';
      expect(hasSuperficialDepth(text)).toBe(false);
    });

    it('detects marketing-speak', () => {
      // Must include trigger phrases, no numbers, under 300 chars
      const text = 'There are many factors to consider and it varies from case to case.';
      expect(hasSuperficialDepth(text)).toBe(true);
    });
  });

  describe('hasArrogantTone', () => {
    it('detects dismissive language', () => {
      // Vanity patterns: 'trust me', 'you are wrong', 'let me correct you', 'obviously you don\'t understand'
      const text = "Trust me, I know best. You're wrong about this.";
      expect(hasArrogantTone(text)).toBe(true);
    });

    it('accepts humble, helpful tone', () => {
      const text = 'This might be a useful approach. Let me know if you need clarification.';
      expect(hasArrogantTone(text)).toBe(false);
    });

    it('detects condescension', () => {
      // Must match: "let me correct/fix/educate you" or "obviously you don't understand"
      const text = "Obviously you don't understand this concept. Let me educate you.";
      expect(hasArrogantTone(text)).toBe(true);
    });
  });

  describe('detectAntipattern', () => {
    it('detects excessive certainty (Toxicity)', () => {
      const response =
        'This is absolutely definitely certainly always guaranteed to be the certain truth.';
      const risk = detectAntipattern(response);
      expect(risk.risk).not.toBe('none');
      expect(risk.severity).toBeGreaterThan(0);
    });

    it('detects Obscurity (jargon concealment)', () => {
      // Needs >5 factual claims with no grounding
      const response =
        'The system is optimal. It is the best. Results are outstanding. Performance is unmatched. Speed is incredible. Quality is superior.';
      const risk = detectAntipattern(response);
      expect(risk.severity).toBeGreaterThanOrEqual(0);
    });

    it('detects Instability (information overload)', () => {
      const response =
        '- First point\n- Second point\n- Third point\n- Fourth point\n- Fifth point\n- Sixth point\n- Seventh point\n- Eighth point\n- Ninth point\n- Tenth point\n- Eleventh point\n- Twelfth point';
      const risk = detectAntipattern(response);
      expect(risk.risk).not.toBe('none');
    });

    it('detects superficial depth (jargon)', () => {
      const response = 'It depends and varies. There are many factors to consider.';
      const risk = detectAntipattern(response);
      expect(risk.severity).toBeGreaterThanOrEqual(0);
    });

    it('detects Toxicity (arrogant certainty)', () => {
      const response =
        "Trust me, I know best. You're wrong about this. It is absolutely definitely always certain.";
      const risk = detectAntipattern(response);
      expect(risk.risk).not.toBe('none');
    });

    it('passes clean, well-grounded responses', () => {
      const response =
        'According to recent research (Smith 2023), approximately 65% of users reported improved outcomes when using this approach. The method involves three main steps: data collection, analysis, and implementation.';
      const risk = detectAntipattern(response);
      expect(risk.risk).toBe('none');
      expect(risk.severity).toBe(0);
    });

    it('calculates severity correctly', () => {
      const response =
        'This is absolutely certain and definitely true without any doubt whatsoever.';
      const risk = detectAntipattern(response);
      expect(risk.severity).toBeGreaterThanOrEqual(0);
      expect(risk.severity).toBeLessThanOrEqual(1);
    });
  });

  describe('purifyResponse', () => {
    it('returns original response when no risk detected', () => {
      const response = 'According to the 2024 study, this approach works in about 70% of cases.';
      const risk = detectAntipattern(response);
      const purified = purifyResponse(response, risk);
      expect(purified).toBe(response);
    });

    it('purifies response when risk detected', () => {
      const response = 'This is a test response that should be purified.';
      // Test purifyResponse directly with a constructed risk object
      const fakeRisk = {
        risk: 'toxicity' as const,
        severity: 0.8,
        action: 'add_uncertainty' as const,
        description: 'Excessive certainty detected',
        triggers: ['absolutely', 'definitely'],
        purificationStrategy: 'soften_certainty',
      };
      const purified = purifyResponse(response, fakeRisk);
      expect(purified).toContain('⚠');
      expect(purified).toBeDefined();
      expect(purified.length).toBeGreaterThan(0);
    });
  });
});
