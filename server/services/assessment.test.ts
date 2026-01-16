import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  runAssessment,
  getAssessmentRunStatus,
  cancelAssessment,
  resetAssessment,
  AssessmentError,
} from './assessment';

// Mock dependencies
vi.mock('../storage', () => ({
  storage: {
    getAssessment: vi.fn(),
    updateAssessment: vi.fn(),
    getSafeguardsByAssessment: vi.fn(),
    getCriteriaBySafeguard: vi.fn(),
    updateCriterion: vi.fn(),
    updateSafeguard: vi.fn(),
    getFindingsByAssessment: vi.fn(),
    createFinding: vi.fn(),
  },
}));

vi.mock('./ragie', () => ({
  search: vi.fn(),
}));

vi.mock('./anthropic', () => ({
  extractEvidence: vi.fn(),
}));

import { storage } from '../storage';
import { search } from './ragie';
import { extractEvidence } from './anthropic';

const mockStorage = storage as {
  getAssessment: ReturnType<typeof vi.fn>;
  updateAssessment: ReturnType<typeof vi.fn>;
  getSafeguardsByAssessment: ReturnType<typeof vi.fn>;
  getCriteriaBySafeguard: ReturnType<typeof vi.fn>;
  updateCriterion: ReturnType<typeof vi.fn>;
  updateSafeguard: ReturnType<typeof vi.fn>;
  getFindingsByAssessment: ReturnType<typeof vi.fn>;
  createFinding: ReturnType<typeof vi.fn>;
};

const mockSearch = search as ReturnType<typeof vi.fn>;
const mockExtractEvidence = extractEvidence as ReturnType<typeof vi.fn>;

describe('assessment', () => {
  beforeEach(() => {
    vi.resetAllMocks();

    // Default mock implementations
    mockStorage.updateAssessment.mockResolvedValue({});
    mockStorage.updateCriterion.mockResolvedValue({});
    mockStorage.updateSafeguard.mockResolvedValue({});
    mockStorage.getFindingsByAssessment.mockResolvedValue([]);
    mockStorage.createFinding.mockResolvedValue({});
  });

  describe('runAssessment', () => {
    const mockAssessment = {
      id: 'assessment-1',
      companyId: 'company-1',
      name: 'Test Assessment',
      runStatus: 'idle',
      runProgress: 0,
    };

    const mockSafeguards = [
      {
        id: 'safeguard-1',
        cisId: '1.1',
        name: 'Asset Inventory',
        assessmentId: 'assessment-1',
      },
      {
        id: 'safeguard-2',
        cisId: '1.2',
        name: 'Address Unauthorized Assets',
        assessmentId: 'assessment-1',
      },
    ];

    const mockCriteria = [
      { id: 'criterion-1', safeguardId: 'safeguard-1', text: 'Criterion 1' },
      { id: 'criterion-2', safeguardId: 'safeguard-1', text: 'Criterion 2' },
    ];

    it('throws error when assessment not found', async () => {
      mockStorage.getAssessment.mockResolvedValue(undefined);

      await expect(runAssessment('nonexistent')).rejects.toThrow(
        'Assessment not found'
      );
    });

    it('throws error when assessment is already running', async () => {
      mockStorage.getAssessment.mockResolvedValue({
        ...mockAssessment,
        runStatus: 'running',
      });

      await expect(runAssessment('assessment-1')).rejects.toThrow(
        'Assessment is already running'
      );
    });

    it('throws error when no safeguards found', async () => {
      mockStorage.getAssessment.mockResolvedValue(mockAssessment);
      mockStorage.getSafeguardsByAssessment.mockResolvedValue([]);

      await expect(runAssessment('assessment-1')).rejects.toThrow(
        'No safeguards found'
      );

      // Should mark as failed
      expect(mockStorage.updateAssessment).toHaveBeenCalledWith(
        'assessment-1',
        expect.objectContaining({ runStatus: 'failed' })
      );
    });

    it('processes safeguards and criteria successfully', async () => {
      mockStorage.getAssessment.mockResolvedValue(mockAssessment);
      mockStorage.getSafeguardsByAssessment.mockResolvedValue(mockSafeguards);
      mockStorage.getCriteriaBySafeguard.mockResolvedValue(mockCriteria);

      mockSearch.mockResolvedValue([
        {
          content: 'Evidence content',
          score: 0.9,
          chunk_id: 'chunk-1',
          metadata: { document_id: 'doc-1', document_name: 'test.pdf' },
        },
      ]);

      mockExtractEvidence.mockResolvedValue({
        status: 'met',
        excerpt: 'Evidence excerpt',
        chunkId: 'chunk-1',
        documentId: 'doc-1',
        documentName: 'test.pdf',
        page: '5',
        confidence: 0.9,
        reasoning: 'Evidence found',
      });

      const result = await runAssessment('assessment-1');

      expect(result.status).toBe('completed');
      expect(result.safeguardsProcessed).toBe(2);
      expect(result.errors).toHaveLength(0);

      // Should have searched for each criterion
      expect(mockSearch).toHaveBeenCalled();

      // Should have evaluated each criterion
      expect(mockExtractEvidence).toHaveBeenCalled();

      // Should have updated criteria
      expect(mockStorage.updateCriterion).toHaveBeenCalled();

      // Should have updated safeguards with scores
      expect(mockStorage.updateSafeguard).toHaveBeenCalled();

      // Should have updated assessment stats
      expect(mockStorage.updateAssessment).toHaveBeenCalledWith(
        'assessment-1',
        expect.objectContaining({
          runStatus: 'completed',
          runProgress: 100,
        })
      );
    });

    it('calculates correct scores based on criteria status', async () => {
      mockStorage.getAssessment.mockResolvedValue(mockAssessment);
      mockStorage.getSafeguardsByAssessment.mockResolvedValue([mockSafeguards[0]]);
      mockStorage.getCriteriaBySafeguard.mockResolvedValue(mockCriteria);
      mockSearch.mockResolvedValue([]);

      // First criterion: met, second: partial
      mockExtractEvidence
        .mockResolvedValueOnce({
          status: 'met',
          excerpt: 'Evidence 1',
          chunkId: null,
          documentId: null,
          documentName: null,
          page: null,
          confidence: 0.9,
          reasoning: 'Met',
        })
        .mockResolvedValueOnce({
          status: 'partial',
          excerpt: 'Evidence 2',
          chunkId: null,
          documentId: null,
          documentName: null,
          page: null,
          confidence: 0.7,
          reasoning: 'Partial',
        });

      await runAssessment('assessment-1');

      // Score should be (1 + 0.5) / 2 = 0.75 = 75%
      // Status should be 'partial' (75% >= 40%, < 80%)
      expect(mockStorage.updateSafeguard).toHaveBeenCalledWith(
        'safeguard-1',
        expect.objectContaining({
          score: 75,
          status: 'partial',
        })
      );
    });

    it('handles Ragie search errors gracefully', async () => {
      mockStorage.getAssessment.mockResolvedValue(mockAssessment);
      mockStorage.getSafeguardsByAssessment.mockResolvedValue([mockSafeguards[0]]);
      mockStorage.getCriteriaBySafeguard.mockResolvedValue([mockCriteria[0]]);

      mockSearch.mockRejectedValue(new Error('Ragie error'));
      mockExtractEvidence.mockResolvedValue({
        status: 'insufficient',
        excerpt: '',
        chunkId: null,
        documentId: null,
        documentName: null,
        page: null,
        confidence: 0,
        reasoning: 'No evidence',
      });

      const result = await runAssessment('assessment-1');

      // Should complete despite Ragie error
      expect(result.status).toBe('completed');
    });

    it('handles Anthropic errors gracefully', async () => {
      mockStorage.getAssessment.mockResolvedValue(mockAssessment);
      mockStorage.getSafeguardsByAssessment.mockResolvedValue([mockSafeguards[0]]);
      mockStorage.getCriteriaBySafeguard.mockResolvedValue([mockCriteria[0]]);

      mockSearch.mockResolvedValue([]);
      mockExtractEvidence.mockRejectedValue(new Error('Anthropic error'));

      const result = await runAssessment('assessment-1');

      // Should complete despite Anthropic error
      expect(result.status).toBe('completed');

      // Criterion should be marked as insufficient
      expect(mockStorage.updateCriterion).toHaveBeenCalledWith(
        'criterion-1',
        expect.objectContaining({ status: 'insufficient' })
      );
    });

    it('generates findings for gaps', async () => {
      mockStorage.getAssessment.mockResolvedValue(mockAssessment);
      mockStorage.getSafeguardsByAssessment.mockResolvedValue([mockSafeguards[0]]);
      mockStorage.getCriteriaBySafeguard.mockResolvedValue([mockCriteria[0]]);
      mockSearch.mockResolvedValue([]);

      mockExtractEvidence.mockResolvedValue({
        status: 'not_met',
        excerpt: '',
        chunkId: null,
        documentId: null,
        documentName: null,
        page: null,
        confidence: 0.8,
        reasoning: 'No evidence',
      });

      await runAssessment('assessment-1');

      // Should create a finding for the gap
      expect(mockStorage.createFinding).toHaveBeenCalledWith(
        expect.objectContaining({
          assessmentId: 'assessment-1',
          cisId: '1.1',
          severity: 'high',
          status: 'open',
        })
      );
    });

    it('generates findings for partial controls', async () => {
      mockStorage.getAssessment.mockResolvedValue(mockAssessment);
      mockStorage.getSafeguardsByAssessment.mockResolvedValue([mockSafeguards[0]]);
      mockStorage.getCriteriaBySafeguard.mockResolvedValue(mockCriteria);
      mockSearch.mockResolvedValue([]);

      // Mix of met and not_met = partial safeguard
      mockExtractEvidence
        .mockResolvedValueOnce({
          status: 'met',
          excerpt: 'Evidence',
          chunkId: null,
          documentId: null,
          documentName: null,
          page: null,
          confidence: 0.9,
          reasoning: 'Met',
        })
        .mockResolvedValueOnce({
          status: 'not_met',
          excerpt: '',
          chunkId: null,
          documentId: null,
          documentName: null,
          page: null,
          confidence: 0.8,
          reasoning: 'Not met',
        });

      await runAssessment('assessment-1');

      // Should create a finding for partial
      expect(mockStorage.createFinding).toHaveBeenCalledWith(
        expect.objectContaining({
          cisId: '1.1',
          severity: 'medium',
        })
      );
    });

    it('does not duplicate existing findings', async () => {
      mockStorage.getAssessment.mockResolvedValue(mockAssessment);
      mockStorage.getSafeguardsByAssessment.mockResolvedValue([mockSafeguards[0]]);
      mockStorage.getCriteriaBySafeguard.mockResolvedValue([mockCriteria[0]]);
      mockSearch.mockResolvedValue([]);

      mockExtractEvidence.mockResolvedValue({
        status: 'not_met',
        excerpt: '',
        chunkId: null,
        documentId: null,
        documentName: null,
        page: null,
        confidence: 0.8,
        reasoning: 'Not met',
      });

      // Existing finding for this control
      mockStorage.getFindingsByAssessment.mockResolvedValue([
        { cisId: '1.1', title: 'Existing finding' },
      ]);

      await runAssessment('assessment-1');

      // Should not create duplicate finding
      expect(mockStorage.createFinding).not.toHaveBeenCalled();
    });

    it('calls onProgress callback', async () => {
      mockStorage.getAssessment.mockResolvedValue(mockAssessment);
      mockStorage.getSafeguardsByAssessment.mockResolvedValue([mockSafeguards[0]]);
      mockStorage.getCriteriaBySafeguard.mockResolvedValue([mockCriteria[0]]);
      mockSearch.mockResolvedValue([]);
      mockExtractEvidence.mockResolvedValue({
        status: 'met',
        excerpt: '',
        chunkId: null,
        documentId: null,
        documentName: null,
        page: null,
        confidence: 0.9,
        reasoning: 'Met',
      });

      const onProgress = vi.fn();
      await runAssessment('assessment-1', { onProgress });

      expect(onProgress).toHaveBeenCalled();

      // Should have been called with starting phase
      expect(onProgress).toHaveBeenCalledWith(
        expect.objectContaining({ phase: 'starting' })
      );

      // Should have been called with completed phase
      expect(onProgress).toHaveBeenCalledWith(
        expect.objectContaining({ phase: 'completed', percentComplete: 100 })
      );
    });

    it('uses provided companyId over assessment companyId', async () => {
      mockStorage.getAssessment.mockResolvedValue(mockAssessment);
      mockStorage.getSafeguardsByAssessment.mockResolvedValue([mockSafeguards[0]]);
      mockStorage.getCriteriaBySafeguard.mockResolvedValue([mockCriteria[0]]);
      mockSearch.mockResolvedValue([]);
      mockExtractEvidence.mockResolvedValue({
        status: 'met',
        excerpt: '',
        chunkId: null,
        documentId: null,
        documentName: null,
        page: null,
        confidence: 0.9,
        reasoning: 'Met',
      });

      await runAssessment('assessment-1', { companyId: 'override-company' });

      // Search should use overridden company ID
      expect(mockSearch).toHaveBeenCalledWith(
        expect.any(String),
        'override-company',
        expect.any(Object)
      );
    });

    it('returns completed_with_errors when safeguard processing fails', async () => {
      mockStorage.getAssessment.mockResolvedValue(mockAssessment);
      mockStorage.getSafeguardsByAssessment.mockResolvedValue(mockSafeguards);

      // First safeguard succeeds
      mockStorage.getCriteriaBySafeguard
        .mockResolvedValueOnce([mockCriteria[0]])
        // Second safeguard fails at the getCriteriaBySafeguard level
        .mockRejectedValueOnce(new Error('Database error'));

      mockSearch.mockResolvedValue([]);

      mockExtractEvidence.mockResolvedValue({
        status: 'met',
        excerpt: '',
        chunkId: null,
        documentId: null,
        documentName: null,
        page: null,
        confidence: 0.9,
        reasoning: 'Met',
      });

      const result = await runAssessment('assessment-1');

      expect(result.status).toBe('completed_with_errors');
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('1.2'); // The failed safeguard
    });
  });

  describe('getAssessmentRunStatus', () => {
    it('returns null for nonexistent assessment', async () => {
      mockStorage.getAssessment.mockResolvedValue(undefined);

      const result = await getAssessmentRunStatus('nonexistent');
      expect(result).toBeNull();
    });

    it('returns status for existing assessment', async () => {
      const startedAt = new Date();
      mockStorage.getAssessment.mockResolvedValue({
        id: 'assessment-1',
        runStatus: 'running',
        runProgress: 50,
        runStartedAt: startedAt,
        runCompletedAt: null,
        runError: null,
      });

      const result = await getAssessmentRunStatus('assessment-1');

      expect(result).toEqual({
        status: 'running',
        progress: 50,
        startedAt,
        completedAt: null,
        error: null,
      });
    });
  });

  describe('cancelAssessment', () => {
    it('returns false for nonexistent assessment', async () => {
      mockStorage.getAssessment.mockResolvedValue(undefined);

      const result = await cancelAssessment('nonexistent');
      expect(result).toBe(false);
    });

    it('returns false for non-running assessment', async () => {
      mockStorage.getAssessment.mockResolvedValue({
        id: 'assessment-1',
        runStatus: 'idle',
      });

      const result = await cancelAssessment('assessment-1');
      expect(result).toBe(false);
    });

    it('cancels running assessment', async () => {
      mockStorage.getAssessment.mockResolvedValue({
        id: 'assessment-1',
        runStatus: 'running',
      });

      const result = await cancelAssessment('assessment-1');

      expect(result).toBe(true);
      expect(mockStorage.updateAssessment).toHaveBeenCalledWith(
        'assessment-1',
        expect.objectContaining({
          runStatus: 'failed',
          runError: 'Cancelled by user',
        })
      );
    });
  });

  describe('resetAssessment', () => {
    it('returns false for nonexistent assessment', async () => {
      mockStorage.getAssessment.mockResolvedValue(undefined);

      const result = await resetAssessment('nonexistent');
      expect(result).toBe(false);
    });

    it('returns false for running assessment', async () => {
      mockStorage.getAssessment.mockResolvedValue({
        id: 'assessment-1',
        runStatus: 'running',
      });

      const result = await resetAssessment('assessment-1');
      expect(result).toBe(false);
    });

    it('resets completed assessment', async () => {
      mockStorage.getAssessment.mockResolvedValue({
        id: 'assessment-1',
        runStatus: 'completed',
      });

      const result = await resetAssessment('assessment-1');

      expect(result).toBe(true);
      expect(mockStorage.updateAssessment).toHaveBeenCalledWith(
        'assessment-1',
        expect.objectContaining({
          runStatus: 'idle',
          runProgress: 0,
          runStartedAt: null,
          runCompletedAt: null,
          runError: null,
        })
      );
    });
  });

  describe('AssessmentError', () => {
    it('includes code', () => {
      const error = new AssessmentError('Test error', 'TEST_CODE');

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('AssessmentError');
    });
  });
});
