/**
 * Assessment Orchestration Service
 *
 * Coordinates the full AI-powered assessment workflow:
 * 1. For each safeguard's criteria, query Ragie for evidence
 * 2. Use Anthropic to evaluate evidence against criteria
 * 3. Calculate scores using deterministic scoring
 * 4. Update assessment stats and generate findings
 */

import { storage } from '../storage';
import { search, type ScoredChunk } from './ragie';
import { extractEvidence, type EvidenceResult, type RagieChunk } from './anthropic';
import {
  calculateSafeguardScore,
  calculateAssessmentStats,
  type CriterionStatus,
  type SafeguardStatus,
} from './scoring';
import type { Assessment, Safeguard, Criterion, InsertFinding } from '@shared/schema';
import { DEFAULT_COMPANY_ID } from '@shared/schema';

// ============================================================================
// Types
// ============================================================================

export class AssessmentError extends Error {
  constructor(
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'AssessmentError';
  }
}

export interface AssessmentRunResult {
  assessmentId: string;
  status: 'completed' | 'completed_with_errors' | 'failed';
  safeguardsProcessed: number;
  criteriaProcessed: number;
  criteriaWithEvidence: number;
  errors: string[];
  duration: number;
  stats: {
    maturityScore: number;
    controlsCovered: number;
    controlsPartial: number;
    controlsGap: number;
  };
}

export interface ProgressCallback {
  (progress: {
    phase: 'starting' | 'processing' | 'finalizing' | 'completed';
    safeguardIndex: number;
    safeguardTotal: number;
    criterionIndex: number;
    criterionTotal: number;
    currentSafeguard?: string;
    percentComplete: number;
  }): void;
}

interface ProcessedCriterion {
  id: string;
  status: CriterionStatus;
  hadEvidence: boolean;
}

interface ProcessedSafeguard {
  id: string;
  cisId: string;
  name: string;
  score: number;
  status: SafeguardStatus;
  criteria: ProcessedCriterion[];
}

// ============================================================================
// Configuration
// ============================================================================

const RAGIE_TOP_K = 10;
const RAGIE_MAX_PER_DOC = 4;

// ============================================================================
// Main Orchestrator
// ============================================================================

/**
 * Run a full AI-powered assessment
 *
 * This is the main entry point for executing an assessment.
 * It processes all safeguards and their criteria, querying Ragie
 * for evidence and using Anthropic to evaluate.
 */
export async function runAssessment(
  assessmentId: string,
  options: {
    onProgress?: ProgressCallback;
    companyId?: string;
  } = {}
): Promise<AssessmentRunResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  const { onProgress, companyId: providedCompanyId } = options;

  // Get assessment
  const assessment = await storage.getAssessment(assessmentId);
  if (!assessment) {
    throw new AssessmentError(`Assessment not found: ${assessmentId}`, 'NOT_FOUND');
  }

  // Use provided companyId or fall back to assessment's companyId or default
  const companyId = providedCompanyId || assessment.companyId || DEFAULT_COMPANY_ID;

  // Check if already running
  if (assessment.runStatus === 'running') {
    throw new AssessmentError('Assessment is already running', 'ALREADY_RUNNING');
  }

  // Mark as running
  await storage.updateAssessment(assessmentId, {
    runStatus: 'running',
    runProgress: 0,
    runStartedAt: new Date(),
    runError: null,
  } as Partial<Assessment>);

  try {
    // Get all safeguards for this assessment
    const safeguardList = await storage.getSafeguardsByAssessment(assessmentId);

    if (safeguardList.length === 0) {
      throw new AssessmentError('No safeguards found for assessment', 'NO_SAFEGUARDS');
    }

    // Notify starting
    if (onProgress) {
      onProgress({
        phase: 'starting',
        safeguardIndex: 0,
        safeguardTotal: safeguardList.length,
        criterionIndex: 0,
        criterionTotal: 0,
        percentComplete: 0,
      });
    }

    // Process each safeguard
    const processedSafeguards: ProcessedSafeguard[] = [];
    let totalCriteriaProcessed = 0;
    let totalCriteriaWithEvidence = 0;

    for (let sIdx = 0; sIdx < safeguardList.length; sIdx++) {
      const safeguard = safeguardList[sIdx];

      try {
        const result = await processSafeguard(safeguard, companyId, {
          onProgress: onProgress
            ? (criterionIndex, criterionTotal) => {
                const baseProgress = (sIdx / safeguardList.length) * 100;
                const safeguardProgress =
                  (criterionIndex / Math.max(criterionTotal, 1)) *
                  (100 / safeguardList.length);

                onProgress({
                  phase: 'processing',
                  safeguardIndex: sIdx + 1,
                  safeguardTotal: safeguardList.length,
                  criterionIndex,
                  criterionTotal,
                  currentSafeguard: `${safeguard.cisId}: ${safeguard.name}`,
                  percentComplete: Math.round(baseProgress + safeguardProgress),
                });
              }
            : undefined,
        });

        processedSafeguards.push(result);
        totalCriteriaProcessed += result.criteria.length;
        totalCriteriaWithEvidence += result.criteria.filter((c) => c.hadEvidence).length;
      } catch (error) {
        const errorMsg = `Failed to process safeguard ${safeguard.cisId}: ${(error as Error).message}`;
        errors.push(errorMsg);
        console.error(errorMsg);

        // Mark safeguard as gap on failure
        processedSafeguards.push({
          id: safeguard.id,
          cisId: safeguard.cisId,
          name: safeguard.name,
          score: 0,
          status: 'gap',
          criteria: [],
        });
      }

      // Update progress
      const progress = Math.round(((sIdx + 1) / safeguardList.length) * 100);
      await storage.updateAssessment(assessmentId, {
        runProgress: progress,
      } as Partial<Assessment>);
    }

    // Calculate assessment stats
    const stats = calculateAssessmentStats(
      processedSafeguards.map((s) => ({ score: s.score, status: s.status }))
    );

    // Generate findings for gaps
    if (onProgress) {
      onProgress({
        phase: 'finalizing',
        safeguardIndex: safeguardList.length,
        safeguardTotal: safeguardList.length,
        criterionIndex: 0,
        criterionTotal: 0,
        percentComplete: 95,
      });
    }

    await generateFindings(assessmentId, companyId, processedSafeguards);

    // Update assessment with final stats
    const finalStatus = errors.length > 0 ? 'completed_with_errors' : 'completed';
    await storage.updateAssessment(assessmentId, {
      runStatus: 'completed',
      runProgress: 100,
      runCompletedAt: new Date(),
      runError: errors.length > 0 ? errors.join('; ') : null,
      maturityScore: stats.maturityScore,
      controlsCovered: stats.controlsCovered,
      controlsPartial: stats.controlsPartial,
      controlsGap: stats.controlsGap,
      status: 'completed',
    } as Partial<Assessment>);

    if (onProgress) {
      onProgress({
        phase: 'completed',
        safeguardIndex: safeguardList.length,
        safeguardTotal: safeguardList.length,
        criterionIndex: totalCriteriaProcessed,
        criterionTotal: totalCriteriaProcessed,
        percentComplete: 100,
      });
    }

    return {
      assessmentId,
      status: errors.length > 0 ? 'completed_with_errors' : 'completed',
      safeguardsProcessed: processedSafeguards.length,
      criteriaProcessed: totalCriteriaProcessed,
      criteriaWithEvidence: totalCriteriaWithEvidence,
      errors,
      duration: Date.now() - startTime,
      stats,
    };
  } catch (error) {
    // Mark as failed
    await storage.updateAssessment(assessmentId, {
      runStatus: 'failed',
      runError: (error as Error).message,
      runCompletedAt: new Date(),
    } as Partial<Assessment>);

    throw error;
  }
}

// ============================================================================
// Safeguard Processing
// ============================================================================

async function processSafeguard(
  safeguard: Safeguard,
  companyId: string,
  options: {
    onProgress?: (criterionIndex: number, criterionTotal: number) => void;
  } = {}
): Promise<ProcessedSafeguard> {
  const { onProgress } = options;

  // Get criteria for this safeguard
  const criteriaList = await storage.getCriteriaBySafeguard(safeguard.id);

  const processedCriteria: ProcessedCriterion[] = [];

  for (let cIdx = 0; cIdx < criteriaList.length; cIdx++) {
    const criterion = criteriaList[cIdx];

    if (onProgress) {
      onProgress(cIdx + 1, criteriaList.length);
    }

    try {
      const result = await processCriterion(criterion, safeguard, companyId);
      processedCriteria.push(result);
    } catch (error) {
      console.error(
        `Failed to process criterion ${criterion.id}: ${(error as Error).message}`
      );

      // Mark as insufficient on error, don't fail the whole safeguard
      await storage.updateCriterion(criterion.id, {
        status: 'insufficient',
      });

      processedCriteria.push({
        id: criterion.id,
        status: 'insufficient',
        hadEvidence: false,
      });
    }
  }

  // Calculate safeguard score
  const scoreResult = calculateSafeguardScore(
    processedCriteria.map((c) => ({ status: c.status }))
  );

  // Update safeguard with score
  await storage.updateSafeguard(safeguard.id, {
    score: scoreResult.score,
    status: scoreResult.status,
  });

  return {
    id: safeguard.id,
    cisId: safeguard.cisId,
    name: safeguard.name,
    score: scoreResult.score,
    status: scoreResult.status,
    criteria: processedCriteria,
  };
}

// ============================================================================
// Criterion Processing
// ============================================================================

async function processCriterion(
  criterion: Criterion,
  safeguard: Safeguard,
  companyId: string
): Promise<ProcessedCriterion> {
  // Build search query combining safeguard context and criterion text
  const searchQuery = `${safeguard.name}: ${criterion.text}`;

  // Query Ragie for relevant chunks
  let chunks: ScoredChunk[] = [];
  try {
    chunks = await search(searchQuery, companyId, {
      topK: RAGIE_TOP_K,
      maxChunksPerDocument: RAGIE_MAX_PER_DOC,
      rerank: true,
    });
  } catch (error) {
    console.error(`Ragie search failed for criterion ${criterion.id}: ${(error as Error).message}`);
    // Continue with empty chunks - will result in 'insufficient' status
  }

  // Convert to RagieChunk format for Anthropic
  const ragieChunks: RagieChunk[] = chunks.map((chunk) => ({
    content: chunk.content,
    score: chunk.score,
    chunk_id: chunk.chunk_id,
    doc_id: chunk.doc_id,
    metadata: chunk.metadata,
  }));

  // Evaluate with Anthropic
  let evidence: EvidenceResult;
  try {
    evidence = await extractEvidence(criterion.text, ragieChunks);
  } catch (error) {
    console.error(
      `Anthropic evaluation failed for criterion ${criterion.id}: ${(error as Error).message}`
    );

    // Default to insufficient on API error
    evidence = {
      status: 'insufficient',
      excerpt: '',
      chunkId: null,
      documentId: null,
      documentName: null,
      page: null,
      confidence: 0,
      reasoning: `Evaluation failed: ${(error as Error).message}`,
    };
  }

  // Update criterion with evaluation results
  await storage.updateCriterion(criterion.id, {
    status: evidence.status,
    citationDocumentId: evidence.documentId,
    citationPage: evidence.page,
    citationExcerpt: evidence.excerpt,
    ragieChunkId: evidence.chunkId,
  });

  return {
    id: criterion.id,
    status: evidence.status,
    hadEvidence: evidence.status !== 'insufficient' && evidence.excerpt.length > 0,
  };
}

// ============================================================================
// Findings Generation
// ============================================================================

async function generateFindings(
  assessmentId: string,
  companyId: string,
  safeguards: ProcessedSafeguard[]
): Promise<void> {
  // Get existing findings to avoid duplicates
  const existingFindings = await storage.getFindingsByAssessment(assessmentId);
  const existingCisIds = new Set(existingFindings.map((f) => f.cisId));

  // Generate findings for gaps and partial controls
  for (const safeguard of safeguards) {
    // Skip if finding already exists for this control
    if (existingCisIds.has(safeguard.cisId)) {
      continue;
    }

    // Only generate findings for gaps
    if (safeguard.status === 'gap') {
      const finding: InsertFinding = {
        companyId,
        assessmentId,
        cisId: safeguard.cisId,
        title: `Gap: ${safeguard.name}`,
        severity: 'high',
        impact: `Control ${safeguard.cisId} is not implemented. This creates a security gap that could be exploited.`,
        recommendation: `Implement ${safeguard.name} according to CIS Controls v8 guidance. Review the criterion requirements and gather appropriate evidence.`,
        status: 'open',
      };

      await storage.createFinding(finding);
    } else if (safeguard.status === 'partial') {
      const finding: InsertFinding = {
        companyId,
        assessmentId,
        cisId: safeguard.cisId,
        title: `Partial: ${safeguard.name}`,
        severity: 'medium',
        impact: `Control ${safeguard.cisId} is partially implemented. Some requirements are not fully addressed.`,
        recommendation: `Review the specific criteria that are not met or partially met for ${safeguard.name}. Address the gaps to achieve full compliance.`,
        status: 'open',
      };

      await storage.createFinding(finding);
    }
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the current status of an assessment run
 */
export async function getAssessmentRunStatus(assessmentId: string): Promise<{
  status: string;
  progress: number;
  startedAt: Date | null;
  completedAt: Date | null;
  error: string | null;
} | null> {
  const assessment = await storage.getAssessment(assessmentId);
  if (!assessment) return null;

  return {
    status: assessment.runStatus,
    progress: assessment.runProgress,
    startedAt: assessment.runStartedAt,
    completedAt: assessment.runCompletedAt,
    error: assessment.runError,
  };
}

/**
 * Cancel a running assessment
 */
export async function cancelAssessment(assessmentId: string): Promise<boolean> {
  const assessment = await storage.getAssessment(assessmentId);
  if (!assessment || assessment.runStatus !== 'running') {
    return false;
  }

  await storage.updateAssessment(assessmentId, {
    runStatus: 'failed',
    runError: 'Cancelled by user',
    runCompletedAt: new Date(),
  } as Partial<Assessment>);

  return true;
}

/**
 * Reset assessment to allow re-running
 */
export async function resetAssessment(assessmentId: string): Promise<boolean> {
  const assessment = await storage.getAssessment(assessmentId);
  if (!assessment) {
    return false;
  }

  // Don't reset if currently running
  if (assessment.runStatus === 'running') {
    return false;
  }

  await storage.updateAssessment(assessmentId, {
    runStatus: 'idle',
    runProgress: 0,
    runStartedAt: null,
    runCompletedAt: null,
    runError: null,
  } as Partial<Assessment>);

  return true;
}
