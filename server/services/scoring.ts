/**
 * Deterministic Scoring Service for CIS Controls Assessment
 *
 * Score Formula: (met + 0.5 × partial) / total_criteria
 * Status Thresholds:
 *   - ≥0.8 (80%) = Covered
 *   - ≥0.4 (40%) = Partial
 *   - <0.4 (40%) = Gap
 */

export type CriterionStatus = 'met' | 'partial' | 'not_met' | 'insufficient';
export type SafeguardStatus = 'covered' | 'partial' | 'gap';

export interface CriterionInput {
  status: CriterionStatus;
}

export interface SafeguardScoreResult {
  score: number;        // 0-100 integer
  status: SafeguardStatus;
  breakdown: {
    met: number;
    partial: number;
    notMet: number;
    insufficient: number;
    total: number;
  };
}

export interface AssessmentStatsResult {
  maturityScore: number;     // 0-100 integer (average of all safeguard scores)
  controlsCovered: number;   // Count of safeguards with status = 'covered'
  controlsPartial: number;   // Count of safeguards with status = 'partial'
  controlsGap: number;       // Count of safeguards with status = 'gap'
  totalControls: number;     // Total safeguard count
}

// Thresholds for status determination
const COVERED_THRESHOLD = 0.8;  // ≥80%
const PARTIAL_THRESHOLD = 0.4;  // ≥40%

/**
 * Calculate score and status for a single safeguard based on its criteria
 *
 * @param criteria Array of criteria with their status
 * @returns Score (0-100), status, and breakdown
 */
export function calculateSafeguardScore(criteria: CriterionInput[]): SafeguardScoreResult {
  if (criteria.length === 0) {
    return {
      score: 0,
      status: 'gap',
      breakdown: { met: 0, partial: 0, notMet: 0, insufficient: 0, total: 0 }
    };
  }

  // Count criteria by status
  const breakdown = {
    met: 0,
    partial: 0,
    notMet: 0,
    insufficient: 0,
    total: criteria.length
  };

  for (const criterion of criteria) {
    switch (criterion.status) {
      case 'met':
        breakdown.met++;
        break;
      case 'partial':
        breakdown.partial++;
        break;
      case 'not_met':
        breakdown.notMet++;
        break;
      case 'insufficient':
        breakdown.insufficient++;
        break;
    }
  }

  // Calculate raw score: (met + 0.5 × partial) / total
  // Note: 'not_met' and 'insufficient' both count as 0
  const rawScore = (breakdown.met + 0.5 * breakdown.partial) / breakdown.total;

  // Convert to 0-100 integer (round to nearest)
  const score = Math.round(rawScore * 100);

  // Determine status based on thresholds
  let status: SafeguardStatus;
  if (rawScore >= COVERED_THRESHOLD) {
    status = 'covered';
  } else if (rawScore >= PARTIAL_THRESHOLD) {
    status = 'partial';
  } else {
    status = 'gap';
  }

  return { score, status, breakdown };
}

/**
 * Calculate rollup statistics for an entire assessment
 *
 * @param safeguards Array of safeguards with their scores and statuses
 * @returns Assessment-level statistics
 */
export function calculateAssessmentStats(
  safeguards: Array<{ score: number; status: SafeguardStatus }>
): AssessmentStatsResult {
  if (safeguards.length === 0) {
    return {
      maturityScore: 0,
      controlsCovered: 0,
      controlsPartial: 0,
      controlsGap: 0,
      totalControls: 0
    };
  }

  let controlsCovered = 0;
  let controlsPartial = 0;
  let controlsGap = 0;
  let totalScore = 0;

  for (const safeguard of safeguards) {
    totalScore += safeguard.score;

    switch (safeguard.status) {
      case 'covered':
        controlsCovered++;
        break;
      case 'partial':
        controlsPartial++;
        break;
      case 'gap':
        controlsGap++;
        break;
    }
  }

  // Maturity score is the average of all safeguard scores
  const maturityScore = Math.round(totalScore / safeguards.length);

  return {
    maturityScore,
    controlsCovered,
    controlsPartial,
    controlsGap,
    totalControls: safeguards.length
  };
}

/**
 * Determine status from a raw score (0-1 float)
 * Exported for use in edge cases where you need status from raw score
 */
export function getStatusFromScore(rawScore: number): SafeguardStatus {
  if (rawScore >= COVERED_THRESHOLD) return 'covered';
  if (rawScore >= PARTIAL_THRESHOLD) return 'partial';
  return 'gap';
}

/**
 * Get the threshold values (exported for documentation/UI purposes)
 */
export const THRESHOLDS = {
  covered: COVERED_THRESHOLD,
  partial: PARTIAL_THRESHOLD
} as const;
