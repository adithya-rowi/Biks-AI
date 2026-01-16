import { describe, it, expect } from 'vitest';
import {
  calculateSafeguardScore,
  calculateAssessmentStats,
  getStatusFromScore,
  THRESHOLDS,
  type CriterionInput,
  type SafeguardStatus,
} from './scoring';

describe('scoring', () => {
  describe('calculateSafeguardScore', () => {
    describe('threshold boundaries', () => {
      it('returns "covered" status when score >= 80%', () => {
        // 4 met out of 5 = 80% exactly
        const criteria: CriterionInput[] = [
          { status: 'met' },
          { status: 'met' },
          { status: 'met' },
          { status: 'met' },
          { status: 'not_met' },
        ];
        const result = calculateSafeguardScore(criteria);
        expect(result.score).toBe(80);
        expect(result.status).toBe('covered');
      });

      it('returns "partial" status when score >= 40% and < 80%', () => {
        // 2 met out of 5 = 40% exactly
        const criteria: CriterionInput[] = [
          { status: 'met' },
          { status: 'met' },
          { status: 'not_met' },
          { status: 'not_met' },
          { status: 'not_met' },
        ];
        const result = calculateSafeguardScore(criteria);
        expect(result.score).toBe(40);
        expect(result.status).toBe('partial');
      });

      it('returns "gap" status when score < 40%', () => {
        // 1 met out of 5 = 20%
        const criteria: CriterionInput[] = [
          { status: 'met' },
          { status: 'not_met' },
          { status: 'not_met' },
          { status: 'not_met' },
          { status: 'not_met' },
        ];
        const result = calculateSafeguardScore(criteria);
        expect(result.score).toBe(20);
        expect(result.status).toBe('gap');
      });

      it('returns "gap" at 39% (just below partial threshold)', () => {
        // Need to construct a case that rounds to 39
        // 39/100 = 0.39 raw
        // With 100 criteria: 39 met = 39%
        const criteria: CriterionInput[] = Array(39).fill({ status: 'met' as const })
          .concat(Array(61).fill({ status: 'not_met' as const }));
        const result = calculateSafeguardScore(criteria);
        expect(result.score).toBe(39);
        expect(result.status).toBe('gap');
      });

      it('returns "partial" at 79% (just below covered threshold)', () => {
        // 79 met out of 100 = 79%
        const criteria: CriterionInput[] = Array(79).fill({ status: 'met' as const })
          .concat(Array(21).fill({ status: 'not_met' as const }));
        const result = calculateSafeguardScore(criteria);
        expect(result.score).toBe(79);
        expect(result.status).toBe('partial');
      });
    });

    describe('score formula: (met + 0.5 × partial) / total', () => {
      it('calculates correctly with all met', () => {
        const criteria: CriterionInput[] = [
          { status: 'met' },
          { status: 'met' },
          { status: 'met' },
          { status: 'met' },
        ];
        const result = calculateSafeguardScore(criteria);
        expect(result.score).toBe(100);
        expect(result.status).toBe('covered');
        expect(result.breakdown.met).toBe(4);
      });

      it('calculates correctly with all not_met', () => {
        const criteria: CriterionInput[] = [
          { status: 'not_met' },
          { status: 'not_met' },
          { status: 'not_met' },
        ];
        const result = calculateSafeguardScore(criteria);
        expect(result.score).toBe(0);
        expect(result.status).toBe('gap');
        expect(result.breakdown.notMet).toBe(3);
      });

      it('calculates partial as 0.5 weight', () => {
        // 2 partial out of 4 = (0 + 0.5*2) / 4 = 1/4 = 0.25 = 25%
        const criteria: CriterionInput[] = [
          { status: 'partial' },
          { status: 'partial' },
          { status: 'not_met' },
          { status: 'not_met' },
        ];
        const result = calculateSafeguardScore(criteria);
        expect(result.score).toBe(25);
        expect(result.status).toBe('gap');
        expect(result.breakdown.partial).toBe(2);
      });

      it('calculates mixed met and partial correctly', () => {
        // 2 met + 2 partial out of 4 = (2 + 0.5*2) / 4 = 3/4 = 0.75 = 75%
        const criteria: CriterionInput[] = [
          { status: 'met' },
          { status: 'met' },
          { status: 'partial' },
          { status: 'partial' },
        ];
        const result = calculateSafeguardScore(criteria);
        expect(result.score).toBe(75);
        expect(result.status).toBe('partial');
      });

      it('treats insufficient same as not_met (0 weight)', () => {
        // 1 met + 1 insufficient out of 2 = 1/2 = 50%
        const criteria: CriterionInput[] = [
          { status: 'met' },
          { status: 'insufficient' },
        ];
        const result = calculateSafeguardScore(criteria);
        expect(result.score).toBe(50);
        expect(result.status).toBe('partial');
        expect(result.breakdown.insufficient).toBe(1);
      });

      it('calculates complex mix correctly', () => {
        // 3 met + 2 partial + 1 not_met + 1 insufficient = 7 total
        // Score = (3 + 0.5*2) / 7 = 4 / 7 = 0.571... = 57%
        const criteria: CriterionInput[] = [
          { status: 'met' },
          { status: 'met' },
          { status: 'met' },
          { status: 'partial' },
          { status: 'partial' },
          { status: 'not_met' },
          { status: 'insufficient' },
        ];
        const result = calculateSafeguardScore(criteria);
        expect(result.score).toBe(57); // rounds from 57.14
        expect(result.status).toBe('partial');
        expect(result.breakdown).toEqual({
          met: 3,
          partial: 2,
          notMet: 1,
          insufficient: 1,
          total: 7,
        });
      });
    });

    describe('edge cases', () => {
      it('returns gap with 0 score for empty criteria array', () => {
        const result = calculateSafeguardScore([]);
        expect(result.score).toBe(0);
        expect(result.status).toBe('gap');
        expect(result.breakdown.total).toBe(0);
      });

      it('handles single criterion met', () => {
        const result = calculateSafeguardScore([{ status: 'met' }]);
        expect(result.score).toBe(100);
        expect(result.status).toBe('covered');
      });

      it('handles single criterion partial', () => {
        const result = calculateSafeguardScore([{ status: 'partial' }]);
        expect(result.score).toBe(50);
        expect(result.status).toBe('partial');
      });

      it('handles single criterion not_met', () => {
        const result = calculateSafeguardScore([{ status: 'not_met' }]);
        expect(result.score).toBe(0);
        expect(result.status).toBe('gap');
      });

      it('rounds correctly (57.14 -> 57, not 57.0 or 58)', () => {
        // 4/7 = 0.5714... should round to 57
        const criteria: CriterionInput[] = [
          { status: 'met' },
          { status: 'met' },
          { status: 'met' },
          { status: 'met' },
          { status: 'not_met' },
          { status: 'not_met' },
          { status: 'not_met' },
        ];
        const result = calculateSafeguardScore(criteria);
        expect(result.score).toBe(57);
      });

      it('rounds 0.5 up (standard rounding)', () => {
        // Need a case where raw score ends in .5 after *100
        // 1.5/3 = 0.5 -> 50%
        const criteria: CriterionInput[] = [
          { status: 'met' },
          { status: 'partial' },
          { status: 'not_met' },
        ];
        const result = calculateSafeguardScore(criteria);
        expect(result.score).toBe(50);
      });
    });
  });

  describe('calculateAssessmentStats', () => {
    it('calculates correct counts for mixed statuses', () => {
      const safeguards: Array<{ score: number; status: SafeguardStatus }> = [
        { score: 90, status: 'covered' },
        { score: 85, status: 'covered' },
        { score: 60, status: 'partial' },
        { score: 50, status: 'partial' },
        { score: 30, status: 'gap' },
        { score: 10, status: 'gap' },
      ];
      const result = calculateAssessmentStats(safeguards);
      expect(result.controlsCovered).toBe(2);
      expect(result.controlsPartial).toBe(2);
      expect(result.controlsGap).toBe(2);
      expect(result.totalControls).toBe(6);
    });

    it('calculates maturity score as average of all scores', () => {
      const safeguards: Array<{ score: number; status: SafeguardStatus }> = [
        { score: 100, status: 'covered' },
        { score: 80, status: 'covered' },
        { score: 60, status: 'partial' },
        { score: 40, status: 'partial' },
        { score: 20, status: 'gap' },
      ];
      // Average = (100+80+60+40+20)/5 = 300/5 = 60
      const result = calculateAssessmentStats(safeguards);
      expect(result.maturityScore).toBe(60);
    });

    it('rounds maturity score correctly', () => {
      const safeguards: Array<{ score: number; status: SafeguardStatus }> = [
        { score: 33, status: 'gap' },
        { score: 33, status: 'gap' },
        { score: 34, status: 'gap' },
      ];
      // Average = 100/3 = 33.33... rounds to 33
      const result = calculateAssessmentStats(safeguards);
      expect(result.maturityScore).toBe(33);
    });

    it('returns zeros for empty safeguards array', () => {
      const result = calculateAssessmentStats([]);
      expect(result).toEqual({
        maturityScore: 0,
        controlsCovered: 0,
        controlsPartial: 0,
        controlsGap: 0,
        totalControls: 0,
      });
    });

    it('handles all covered', () => {
      const safeguards: Array<{ score: number; status: SafeguardStatus }> = [
        { score: 100, status: 'covered' },
        { score: 90, status: 'covered' },
        { score: 85, status: 'covered' },
      ];
      const result = calculateAssessmentStats(safeguards);
      expect(result.controlsCovered).toBe(3);
      expect(result.controlsPartial).toBe(0);
      expect(result.controlsGap).toBe(0);
      expect(result.maturityScore).toBe(92); // (100+90+85)/3 = 91.67 rounds to 92
    });

    it('handles all gaps', () => {
      const safeguards: Array<{ score: number; status: SafeguardStatus }> = [
        { score: 10, status: 'gap' },
        { score: 20, status: 'gap' },
        { score: 30, status: 'gap' },
      ];
      const result = calculateAssessmentStats(safeguards);
      expect(result.controlsCovered).toBe(0);
      expect(result.controlsPartial).toBe(0);
      expect(result.controlsGap).toBe(3);
      expect(result.maturityScore).toBe(20);
    });

    it('handles CIS IG1 scenario (56 safeguards)', () => {
      // Simulate a realistic CIS IG1 assessment
      const safeguards: Array<{ score: number; status: SafeguardStatus }> = [
        ...Array(20).fill({ score: 90, status: 'covered' as const }),
        ...Array(15).fill({ score: 60, status: 'partial' as const }),
        ...Array(21).fill({ score: 20, status: 'gap' as const }),
      ];
      const result = calculateAssessmentStats(safeguards);
      expect(result.totalControls).toBe(56);
      expect(result.controlsCovered).toBe(20);
      expect(result.controlsPartial).toBe(15);
      expect(result.controlsGap).toBe(21);
      // Maturity = (20*90 + 15*60 + 21*20) / 56 = (1800+900+420)/56 = 3120/56 = 55.71 -> 56
      expect(result.maturityScore).toBe(56);
    });
  });

  describe('getStatusFromScore', () => {
    it('returns covered for score >= 0.8', () => {
      expect(getStatusFromScore(0.8)).toBe('covered');
      expect(getStatusFromScore(1.0)).toBe('covered');
      expect(getStatusFromScore(0.95)).toBe('covered');
    });

    it('returns partial for score >= 0.4 and < 0.8', () => {
      expect(getStatusFromScore(0.4)).toBe('partial');
      expect(getStatusFromScore(0.79)).toBe('partial');
      expect(getStatusFromScore(0.5)).toBe('partial');
    });

    it('returns gap for score < 0.4', () => {
      expect(getStatusFromScore(0.39)).toBe('gap');
      expect(getStatusFromScore(0)).toBe('gap');
      expect(getStatusFromScore(0.1)).toBe('gap');
    });
  });

  describe('THRESHOLDS constant', () => {
    it('exports correct threshold values', () => {
      expect(THRESHOLDS.covered).toBe(0.8);
      expect(THRESHOLDS.partial).toBe(0.4);
    });
  });
});
