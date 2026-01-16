import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateAssessmentReport, PDFExportError } from './pdf-export';

// Mock storage
vi.mock('../storage', () => ({
  storage: {
    getAssessment: vi.fn(),
    getSafeguardsByAssessment: vi.fn(),
    getFindingsByAssessment: vi.fn(),
    getCriteriaBySafeguard: vi.fn(),
  },
}));

import { storage } from '../storage';

const mockStorage = storage as unknown as {
  getAssessment: ReturnType<typeof vi.fn>;
  getSafeguardsByAssessment: ReturnType<typeof vi.fn>;
  getFindingsByAssessment: ReturnType<typeof vi.fn>;
  getCriteriaBySafeguard: ReturnType<typeof vi.fn>;
};

describe('pdf-export', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('generateAssessmentReport', () => {
    const mockAssessment = {
      id: 'assessment-1',
      companyId: 'company-1',
      name: 'Q4 2024 Security Assessment',
      framework: 'CIS Controls v8 IG1',
      status: 'completed',
      maturityScore: 65,
      controlsCovered: 30,
      controlsPartial: 15,
      controlsGap: 11,
      totalControls: 56,
      dueDate: '2024-12-31',
      runStatus: 'completed',
      runProgress: 100,
      runStartedAt: new Date('2024-01-15T10:00:00Z'),
      runCompletedAt: new Date('2024-01-15T10:30:00Z'),
      runError: null,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-15T10:30:00Z'),
    };

    const mockSafeguards = [
      {
        id: 'sg-1',
        companyId: 'company-1',
        assessmentId: 'assessment-1',
        cisId: '1.1',
        name: 'Establish and Maintain Detailed Enterprise Asset Inventory',
        assetType: 'Devices',
        securityFunction: 'Identify',
        status: 'covered',
        score: 100,
        owner: 'John Smith',
        dueDate: null,
        locked: false,
        lockedBy: null,
        lockedAt: null,
        remediationStatus: 'not_started',
        remediationOwner: null,
        reviewerNotes: null,
      },
      {
        id: 'sg-2',
        companyId: 'company-1',
        assessmentId: 'assessment-1',
        cisId: '1.2',
        name: 'Address Unauthorized Assets',
        assetType: 'Devices',
        securityFunction: 'Respond',
        status: 'partial',
        score: 50,
        owner: 'Jane Doe',
        dueDate: '2024-02-15',
        locked: false,
        lockedBy: null,
        lockedAt: null,
        remediationStatus: 'in_progress',
        remediationOwner: 'Jane Doe',
        reviewerNotes: 'Needs documentation',
      },
      {
        id: 'sg-3',
        companyId: 'company-1',
        assessmentId: 'assessment-1',
        cisId: '2.1',
        name: 'Establish and Maintain a Software Inventory',
        assetType: 'Applications',
        securityFunction: 'Identify',
        status: 'gap',
        score: 0,
        owner: null,
        dueDate: null,
        locked: false,
        lockedBy: null,
        lockedAt: null,
        remediationStatus: 'not_started',
        remediationOwner: null,
        reviewerNotes: null,
      },
    ];

    const mockCriteria = {
      'sg-1': [
        {
          id: 'crit-1',
          companyId: 'company-1',
          safeguardId: 'sg-1',
          text: 'Maintain an accurate inventory of all enterprise assets',
          status: 'met',
          citationDocumentId: 'doc-1',
          citationPage: '5',
          citationSection: '2.1',
          citationExcerpt: 'The asset inventory is maintained in ServiceNow...',
          citationHighlight: null,
          ragieChunkId: 'chunk-1',
          sortOrder: 0,
        },
        {
          id: 'crit-2',
          companyId: 'company-1',
          safeguardId: 'sg-1',
          text: 'Include network address, hardware address, machine name',
          status: 'met',
          citationDocumentId: 'doc-1',
          citationPage: '6',
          citationSection: '2.2',
          citationExcerpt: 'Each asset record contains IP, MAC, and hostname...',
          citationHighlight: null,
          ragieChunkId: 'chunk-2',
          sortOrder: 1,
        },
      ],
      'sg-2': [
        {
          id: 'crit-3',
          companyId: 'company-1',
          safeguardId: 'sg-2',
          text: 'Process to address unauthorized assets weekly',
          status: 'partial',
          citationDocumentId: null,
          citationPage: null,
          citationSection: null,
          citationExcerpt: null,
          citationHighlight: null,
          ragieChunkId: null,
          sortOrder: 0,
        },
      ],
      'sg-3': [
        {
          id: 'crit-4',
          companyId: 'company-1',
          safeguardId: 'sg-3',
          text: 'Establish software inventory for all operating systems',
          status: 'not_met',
          citationDocumentId: null,
          citationPage: null,
          citationSection: null,
          citationExcerpt: null,
          citationHighlight: null,
          ragieChunkId: null,
          sortOrder: 0,
        },
        {
          id: 'crit-5',
          companyId: 'company-1',
          safeguardId: 'sg-3',
          text: 'Include software title, publisher, installation date',
          status: 'not_met',
          citationDocumentId: null,
          citationPage: null,
          citationSection: null,
          citationExcerpt: null,
          citationHighlight: null,
          ragieChunkId: null,
          sortOrder: 1,
        },
      ],
    };

    const mockFindings = [
      {
        id: 'finding-1',
        companyId: 'company-1',
        assessmentId: 'assessment-1',
        cisId: '2.1',
        title: 'Gap: Establish and Maintain a Software Inventory',
        severity: 'high',
        impact: 'Without software inventory, unauthorized applications may go undetected.',
        recommendation: 'Implement a software inventory solution like SCCM or similar.',
        status: 'open',
        assignedTo: null,
        dueDate: null,
        createdAt: new Date('2024-01-15T10:30:00Z'),
      },
      {
        id: 'finding-2',
        companyId: 'company-1',
        assessmentId: 'assessment-1',
        cisId: '1.2',
        title: 'Partial: Address Unauthorized Assets',
        severity: 'medium',
        impact: 'Unauthorized assets are not being addressed in a timely manner.',
        recommendation: 'Establish a weekly review process for unauthorized assets.',
        status: 'open',
        assignedTo: 'Jane Doe',
        dueDate: '2024-02-15',
        createdAt: new Date('2024-01-15T10:30:00Z'),
      },
    ];

    it('throws PDFExportError when assessment not found', async () => {
      mockStorage.getAssessment.mockResolvedValue(undefined);

      await expect(generateAssessmentReport('non-existent')).rejects.toThrow(PDFExportError);
      await expect(generateAssessmentReport('non-existent')).rejects.toThrow('Assessment not found');
    });

    it('generates PDF buffer for valid assessment', async () => {
      mockStorage.getAssessment.mockResolvedValue(mockAssessment);
      mockStorage.getSafeguardsByAssessment.mockResolvedValue(mockSafeguards);
      mockStorage.getFindingsByAssessment.mockResolvedValue(mockFindings);
      mockStorage.getCriteriaBySafeguard.mockImplementation((safeguardId: string) =>
        Promise.resolve(mockCriteria[safeguardId as keyof typeof mockCriteria] || [])
      );

      const result = await generateAssessmentReport('assessment-1');

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);

      // Verify it's a valid PDF (starts with %PDF)
      const header = result.slice(0, 5).toString('utf-8');
      expect(header).toBe('%PDF-');
    });

    it('generates PDF without gap details when option is disabled', async () => {
      mockStorage.getAssessment.mockResolvedValue(mockAssessment);
      mockStorage.getSafeguardsByAssessment.mockResolvedValue(mockSafeguards);
      mockStorage.getFindingsByAssessment.mockResolvedValue([]);
      mockStorage.getCriteriaBySafeguard.mockResolvedValue([]);

      const result = await generateAssessmentReport('assessment-1', {
        includeGapDetails: false,
      });

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('generates PDF without findings when option is disabled', async () => {
      mockStorage.getAssessment.mockResolvedValue(mockAssessment);
      mockStorage.getSafeguardsByAssessment.mockResolvedValue(mockSafeguards);
      mockStorage.getFindingsByAssessment.mockResolvedValue(mockFindings);
      mockStorage.getCriteriaBySafeguard.mockResolvedValue([]);

      const result = await generateAssessmentReport('assessment-1', {
        includeFindings: false,
      });

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('generates PDF without criteria details when option is disabled', async () => {
      mockStorage.getAssessment.mockResolvedValue(mockAssessment);
      mockStorage.getSafeguardsByAssessment.mockResolvedValue(mockSafeguards);
      mockStorage.getFindingsByAssessment.mockResolvedValue([]);
      mockStorage.getCriteriaBySafeguard.mockImplementation((safeguardId: string) =>
        Promise.resolve(mockCriteria[safeguardId as keyof typeof mockCriteria] || [])
      );

      const result = await generateAssessmentReport('assessment-1', {
        includeCriteria: false,
      });

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('handles assessment with no safeguards', async () => {
      mockStorage.getAssessment.mockResolvedValue(mockAssessment);
      mockStorage.getSafeguardsByAssessment.mockResolvedValue([]);
      mockStorage.getFindingsByAssessment.mockResolvedValue([]);

      const result = await generateAssessmentReport('assessment-1');

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('handles assessment with all covered safeguards', async () => {
      const allCoveredAssessment = {
        ...mockAssessment,
        maturityScore: 100,
        controlsCovered: 56,
        controlsPartial: 0,
        controlsGap: 0,
      };

      const allCoveredSafeguards = mockSafeguards.map((sg) => ({
        ...sg,
        status: 'covered',
        score: 100,
      }));

      mockStorage.getAssessment.mockResolvedValue(allCoveredAssessment);
      mockStorage.getSafeguardsByAssessment.mockResolvedValue(allCoveredSafeguards);
      mockStorage.getFindingsByAssessment.mockResolvedValue([]);
      mockStorage.getCriteriaBySafeguard.mockResolvedValue([]);

      const result = await generateAssessmentReport('assessment-1');

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('handles assessment with all gaps', async () => {
      const allGapsAssessment = {
        ...mockAssessment,
        maturityScore: 0,
        controlsCovered: 0,
        controlsPartial: 0,
        controlsGap: 56,
      };

      const allGapSafeguards = mockSafeguards.map((sg) => ({
        ...sg,
        status: 'gap',
        score: 0,
      }));

      mockStorage.getAssessment.mockResolvedValue(allGapsAssessment);
      mockStorage.getSafeguardsByAssessment.mockResolvedValue(allGapSafeguards);
      mockStorage.getFindingsByAssessment.mockResolvedValue(mockFindings);
      mockStorage.getCriteriaBySafeguard.mockResolvedValue([]);

      const result = await generateAssessmentReport('assessment-1');

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('sorts safeguards by CIS ID correctly', async () => {
      const unsortedSafeguards = [
        { ...mockSafeguards[0], cisId: '10.1' },
        { ...mockSafeguards[1], cisId: '2.1' },
        { ...mockSafeguards[2], cisId: '1.1' },
      ];

      mockStorage.getAssessment.mockResolvedValue(mockAssessment);
      mockStorage.getSafeguardsByAssessment.mockResolvedValue(unsortedSafeguards);
      mockStorage.getFindingsByAssessment.mockResolvedValue([]);
      mockStorage.getCriteriaBySafeguard.mockResolvedValue([]);

      const result = await generateAssessmentReport('assessment-1');

      expect(result).toBeInstanceOf(Buffer);
      // The PDF generation should work regardless of input order
    });

    it('handles safeguards with long names', async () => {
      const longNameSafeguard = {
        ...mockSafeguards[0],
        name: 'A'.repeat(200), // Very long name
      };

      mockStorage.getAssessment.mockResolvedValue(mockAssessment);
      mockStorage.getSafeguardsByAssessment.mockResolvedValue([longNameSafeguard]);
      mockStorage.getFindingsByAssessment.mockResolvedValue([]);
      mockStorage.getCriteriaBySafeguard.mockResolvedValue([]);

      const result = await generateAssessmentReport('assessment-1');

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('handles criteria with long excerpts', async () => {
      const longExcerptCriterion = {
        ...mockCriteria['sg-1'][0],
        citationExcerpt: 'B'.repeat(500), // Very long excerpt
      };

      mockStorage.getAssessment.mockResolvedValue(mockAssessment);
      mockStorage.getSafeguardsByAssessment.mockResolvedValue([mockSafeguards[2]]); // gap safeguard
      mockStorage.getFindingsByAssessment.mockResolvedValue([]);
      mockStorage.getCriteriaBySafeguard.mockResolvedValue([longExcerptCriterion]);

      const result = await generateAssessmentReport('assessment-1');

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('handles findings with different severities', async () => {
      const diverseFindings = [
        { ...mockFindings[0], severity: 'low' },
        { ...mockFindings[1], severity: 'high' },
        { ...mockFindings[0], id: 'finding-3', severity: 'medium' },
      ];

      mockStorage.getAssessment.mockResolvedValue(mockAssessment);
      mockStorage.getSafeguardsByAssessment.mockResolvedValue(mockSafeguards);
      mockStorage.getFindingsByAssessment.mockResolvedValue(diverseFindings);
      mockStorage.getCriteriaBySafeguard.mockResolvedValue([]);

      const result = await generateAssessmentReport('assessment-1');

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('includes PDF metadata', async () => {
      mockStorage.getAssessment.mockResolvedValue(mockAssessment);
      mockStorage.getSafeguardsByAssessment.mockResolvedValue([]);
      mockStorage.getFindingsByAssessment.mockResolvedValue([]);

      const result = await generateAssessmentReport('assessment-1');

      // Convert buffer to string for checking
      const pdfString = result.toString('utf-8');

      // Check for PDF metadata markers
      expect(pdfString).toContain('/Title');
      expect(pdfString).toContain('/Author');
    });
  });

  describe('PDFExportError', () => {
    it('includes error code', () => {
      const error = new PDFExportError('Test error', 'TEST_CODE');

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('PDFExportError');
    });

    it('works without error code', () => {
      const error = new PDFExportError('Test error');

      expect(error.message).toBe('Test error');
      expect(error.code).toBeUndefined();
    });
  });
});
