import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  extractEvidence,
  extractEvidenceBatch,
  AnthropicError,
  type RagieChunk,
} from './anthropic';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('anthropic', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
  });

  afterEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
  });

  describe('extractEvidence', () => {
    const sampleChunks: RagieChunk[] = [
      {
        content: 'We maintain an asset inventory that includes all hardware devices, their serial numbers, owners, and departments.',
        score: 0.95,
        chunk_id: 'chunk-1',
        doc_id: 'doc-1',
        metadata: {
          document_id: 'doc-1',
          document_name: 'Asset Management Policy.pdf',
          page: 5,
        },
      },
      {
        content: 'The IT department reviews the asset inventory quarterly.',
        score: 0.85,
        chunk_id: 'chunk-2',
        doc_id: 'doc-1',
        metadata: {
          document_id: 'doc-1',
          document_name: 'Asset Management Policy.pdf',
          page: 7,
        },
      },
    ];

    it('throws error when API key is not set', async () => {
      delete process.env.ANTHROPIC_API_KEY;

      await expect(
        extractEvidence('Test criterion', sampleChunks)
      ).rejects.toThrow('ANTHROPIC_API_KEY environment variable is not set');
    });

    it('returns insufficient status for empty chunks', async () => {
      const result = await extractEvidence('Test criterion', []);

      expect(result.status).toBe('insufficient');
      expect(result.excerpt).toBe('');
      expect(result.chunkId).toBeNull();
      expect(result.confidence).toBe(1.0);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('calls Anthropic API with correct parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [
            {
              type: 'tool_use',
              name: 'evaluate_evidence',
              input: {
                status: 'met',
                confidence: 0.9,
                excerpt: 'We maintain an asset inventory that includes all hardware devices',
                chunk_index: 0,
                reasoning: 'The policy clearly documents asset inventory requirements.',
              },
            },
          ],
        }),
      });

      await extractEvidence('Maintain asset inventory', sampleChunks);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];

      expect(url).toBe('https://api.anthropic.com/v1/messages');
      expect(options.method).toBe('POST');
      expect(options.headers['x-api-key']).toBe('test-anthropic-key');
      expect(options.headers['anthropic-version']).toBe('2023-06-01');

      const body = JSON.parse(options.body);
      expect(body.tools).toHaveLength(1);
      expect(body.tools[0].name).toBe('evaluate_evidence');
      expect(body.tool_choice).toEqual({ type: 'tool', name: 'evaluate_evidence' });
    });

    it('returns parsed result for met status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [
            {
              type: 'tool_use',
              name: 'evaluate_evidence',
              input: {
                status: 'met',
                confidence: 0.95,
                excerpt: 'We maintain an asset inventory that includes all hardware devices',
                chunk_index: 0,
                reasoning: 'Clear evidence of asset inventory maintenance.',
              },
            },
          ],
        }),
      });

      const result = await extractEvidence('Maintain asset inventory', sampleChunks);

      expect(result.status).toBe('met');
      expect(result.confidence).toBe(0.95);
      expect(result.excerpt).toContain('asset inventory');
      expect(result.chunkId).toBe('chunk-1');
      expect(result.documentId).toBe('doc-1');
      expect(result.documentName).toBe('Asset Management Policy.pdf');
      expect(result.page).toBe('5');
      expect(result.reasoning).toBe('Clear evidence of asset inventory maintenance.');
    });

    it('returns parsed result for partial status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [
            {
              type: 'tool_use',
              name: 'evaluate_evidence',
              input: {
                status: 'partial',
                confidence: 0.7,
                excerpt: 'The IT department reviews the asset inventory quarterly.',
                chunk_index: 1,
                reasoning: 'Review process exists but frequency may be insufficient.',
              },
            },
          ],
        }),
      });

      const result = await extractEvidence('Review asset inventory bi-annually', sampleChunks);

      expect(result.status).toBe('partial');
      expect(result.confidence).toBe(0.7);
      expect(result.chunkId).toBe('chunk-2');
      expect(result.page).toBe('7');
    });

    it('returns parsed result for not_met status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [
            {
              type: 'tool_use',
              name: 'evaluate_evidence',
              input: {
                status: 'not_met',
                confidence: 0.85,
                excerpt: '',
                chunk_index: null,
                reasoning: 'No evidence of mobile device management.',
              },
            },
          ],
        }),
      });

      const result = await extractEvidence('Use MDM for mobile devices', sampleChunks);

      expect(result.status).toBe('not_met');
      expect(result.excerpt).toBe('');
      expect(result.chunkId).toBeNull();
      expect(result.documentId).toBeNull();
    });

    it('returns parsed result for insufficient status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [
            {
              type: 'tool_use',
              name: 'evaluate_evidence',
              input: {
                status: 'insufficient',
                confidence: 0.3,
                excerpt: '',
                chunk_index: null,
                reasoning: 'Evidence chunks are not relevant to the criterion.',
              },
            },
          ],
        }),
      });

      const result = await extractEvidence('Implement network segmentation', sampleChunks);

      expect(result.status).toBe('insufficient');
      expect(result.confidence).toBe(0.3);
    });

    it('handles missing tool use in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [
            {
              type: 'text',
              text: 'Some unexpected response',
            },
          ],
        }),
      });

      const result = await extractEvidence('Test criterion', sampleChunks);

      expect(result.status).toBe('insufficient');
      expect(result.confidence).toBe(0);
      expect(result.reasoning).toContain('Failed to parse');
    });

    it('clamps confidence to valid range', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [
            {
              type: 'tool_use',
              name: 'evaluate_evidence',
              input: {
                status: 'met',
                confidence: 1.5, // Invalid - should be clamped
                excerpt: 'test',
                chunk_index: 0,
                reasoning: 'test',
              },
            },
          ],
        }),
      });

      const result = await extractEvidence('Test criterion', sampleChunks);
      expect(result.confidence).toBe(1);
    });

    it('truncates long excerpts', async () => {
      const longExcerpt = 'x'.repeat(600);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [
            {
              type: 'tool_use',
              name: 'evaluate_evidence',
              input: {
                status: 'met',
                confidence: 0.9,
                excerpt: longExcerpt,
                chunk_index: 0,
                reasoning: 'test',
              },
            },
          ],
        }),
      });

      const result = await extractEvidence('Test criterion', sampleChunks);
      expect(result.excerpt.length).toBeLessThanOrEqual(500);
      expect(result.excerpt.endsWith('...')).toBe(true);
    });

    it('throws AnthropicError on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Invalid API key',
      });

      await expect(extractEvidence('Test criterion', sampleChunks)).rejects.toThrow(
        AnthropicError
      );
    });

    it('handles chunk_index out of bounds gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [
            {
              type: 'tool_use',
              name: 'evaluate_evidence',
              input: {
                status: 'met',
                confidence: 0.9,
                excerpt: 'test',
                chunk_index: 99, // Out of bounds
                reasoning: 'test',
              },
            },
          ],
        }),
      });

      const result = await extractEvidence('Test criterion', sampleChunks);

      expect(result.status).toBe('met');
      expect(result.chunkId).toBeNull();
      expect(result.documentId).toBeNull();
    });
  });

  describe('extractEvidenceBatch', () => {
    it('processes multiple criteria', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            content: [
              {
                type: 'tool_use',
                name: 'evaluate_evidence',
                input: {
                  status: 'met',
                  confidence: 0.9,
                  excerpt: 'Evidence 1',
                  chunk_index: 0,
                  reasoning: 'Reason 1',
                },
              },
            ],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            content: [
              {
                type: 'tool_use',
                name: 'evaluate_evidence',
                input: {
                  status: 'partial',
                  confidence: 0.7,
                  excerpt: 'Evidence 2',
                  chunk_index: 0,
                  reasoning: 'Reason 2',
                },
              },
            ],
          }),
        });

      const chunks: RagieChunk[] = [
        {
          content: 'Test content',
          score: 0.9,
          metadata: { document_id: 'doc-1', document_name: 'test.pdf' },
        },
      ];

      const criteria = [
        { id: 'crit-1', text: 'Criterion 1', chunks },
        { id: 'crit-2', text: 'Criterion 2', chunks },
      ];

      const results = await extractEvidenceBatch(criteria, { delayMs: 0 });

      expect(results.size).toBe(2);
      expect(results.get('crit-1')?.status).toBe('met');
      expect(results.get('crit-2')?.status).toBe('partial');
    });

    it('handles individual failures gracefully', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            content: [
              {
                type: 'tool_use',
                name: 'evaluate_evidence',
                input: {
                  status: 'met',
                  confidence: 0.9,
                  excerpt: 'Evidence',
                  chunk_index: 0,
                  reasoning: 'Reason',
                },
              },
            ],
          }),
        })
        .mockRejectedValueOnce(new Error('Network error'));

      const chunks: RagieChunk[] = [
        {
          content: 'Test content',
          score: 0.9,
          metadata: { document_id: 'doc-1', document_name: 'test.pdf' },
        },
      ];

      const criteria = [
        { id: 'crit-1', text: 'Criterion 1', chunks },
        { id: 'crit-2', text: 'Criterion 2', chunks },
      ];

      const results = await extractEvidenceBatch(criteria, { delayMs: 0 });

      expect(results.size).toBe(2);
      expect(results.get('crit-1')?.status).toBe('met');
      expect(results.get('crit-2')?.status).toBe('insufficient');
      expect(results.get('crit-2')?.reasoning).toContain('Evaluation failed');
    });

    it('calls onProgress callback', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [
            {
              type: 'tool_use',
              name: 'evaluate_evidence',
              input: {
                status: 'met',
                confidence: 0.9,
                excerpt: 'Evidence',
                chunk_index: null,
                reasoning: 'Reason',
              },
            },
          ],
        }),
      });

      const onProgress = vi.fn();
      const criteria = [
        { id: 'crit-1', text: 'Criterion 1', chunks: [] },
        { id: 'crit-2', text: 'Criterion 2', chunks: [] },
        { id: 'crit-3', text: 'Criterion 3', chunks: [] },
      ];

      await extractEvidenceBatch(criteria, { delayMs: 0, onProgress });

      expect(onProgress).toHaveBeenCalledTimes(3);
      expect(onProgress).toHaveBeenCalledWith(1, 3);
      expect(onProgress).toHaveBeenCalledWith(2, 3);
      expect(onProgress).toHaveBeenCalledWith(3, 3);
    });
  });

  describe('AnthropicError', () => {
    it('includes status code and response body', () => {
      const error = new AnthropicError('Test error', 500, 'Server error');

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.responseBody).toBe('Server error');
      expect(error.name).toBe('AnthropicError');
    });
  });
});
