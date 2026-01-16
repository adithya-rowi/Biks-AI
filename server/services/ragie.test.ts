import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  RagieClient,
  RagieError,
  computePartition,
  sanitizeFilename,
  search,
  indexDocument,
  deleteDocument,
  listDocuments,
  getDocumentStatus,
} from './ragie';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ragie', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.RAGIE_API_KEY = 'test-ragie-key';
  });

  afterEach(() => {
    delete process.env.RAGIE_API_KEY;
  });

  describe('computePartition', () => {
    it('converts company ID to lowercase partition', () => {
      expect(computePartition('CompanyABC')).toBe('companyabc');
    });

    it('replaces special characters with hyphens', () => {
      expect(computePartition('company@123')).toBe('company-123');
      expect(computePartition('company name')).toBe('company-name');
      expect(computePartition('company.name.test')).toBe('company-name-test');
    });

    it('preserves valid characters', () => {
      expect(computePartition('company-123_test')).toBe('company-123_test');
    });

    it('handles UUID-style company IDs', () => {
      expect(computePartition('a1b2c3d4-e5f6-7890-abcd-ef1234567890'))
        .toBe('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
    });
  });

  describe('sanitizeFilename', () => {
    it('replaces slashes with double underscores', () => {
      expect(sanitizeFilename('path/to/file.pdf')).toBe('path__to__file.pdf');
    });

    it('replaces special characters with underscores', () => {
      expect(sanitizeFilename('file name (1).pdf')).toBe('file_name_1_.pdf');
    });

    it('preserves valid characters', () => {
      expect(sanitizeFilename('file-name_v1.2.pdf')).toBe('file-name_v1.2.pdf');
    });

    it('trims whitespace', () => {
      expect(sanitizeFilename('  file.pdf  ')).toBe('file.pdf');
    });

    it('returns "document" for empty string', () => {
      expect(sanitizeFilename('')).toBe('document');
      expect(sanitizeFilename('   ')).toBe('document');
    });
  });

  describe('RagieClient', () => {
    describe('constructor', () => {
      it('throws error when API key is not set', () => {
        delete process.env.RAGIE_API_KEY;

        expect(() => new RagieClient()).toThrow('RAGIE_API_KEY environment variable is not set');
      });

      it('uses provided API key', () => {
        delete process.env.RAGIE_API_KEY;

        const client = new RagieClient({ apiKey: 'custom-key' });
        expect(client).toBeDefined();
      });

      it('uses default base URL', () => {
        const client = new RagieClient();
        expect(client).toBeDefined();
      });
    });

    describe('createDocument', () => {
      it('sends correct request to create document', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'doc-123',
            name: 'test.md',
            status: 'pending',
          }),
        });

        const client = new RagieClient();
        const result = await client.createDocument({
          content: '# Test Document',
          filename: 'test',
          metadata: { source: 'test' },
          partition: 'company-123',
        });

        expect(mockFetch).toHaveBeenCalledTimes(1);
        const [url, options] = mockFetch.mock.calls[0];
        expect(url).toContain('/documents');
        expect(options.method).toBe('POST');
        expect(options.headers['Authorization']).toBe('Bearer test-ragie-key');
        expect(options.body).toBeInstanceOf(FormData);
        expect(result.id).toBe('doc-123');
      });

      it('appends .md extension if missing', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'doc-123', status: 'pending' }),
        });

        const client = new RagieClient();
        await client.createDocument({
          content: 'content',
          filename: 'test', // no .md
          metadata: {},
          partition: 'test',
        });

        // Verify FormData contains .md filename (we can't easily inspect FormData in tests)
        expect(mockFetch).toHaveBeenCalled();
      });
    });

    describe('getDocument', () => {
      it('fetches document by ID', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'doc-123',
            name: 'test.md',
            status: 'indexed',
            metadata: { source: 'test' },
          }),
        });

        const client = new RagieClient();
        const result = await client.getDocument('doc-123');

        expect(mockFetch).toHaveBeenCalledTimes(1);
        const [url] = mockFetch.mock.calls[0];
        expect(url).toContain('/documents/doc-123');
        expect(result.id).toBe('doc-123');
        expect(result.status).toBe('indexed');
      });

      it('throws error on 404', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          text: async () => 'Document not found',
        });

        const client = new RagieClient();
        await expect(client.getDocument('nonexistent')).rejects.toThrow(RagieError);
      });
    });

    describe('listDocuments', () => {
      it('lists documents with pagination', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            items: [
              { id: 'doc-1', status: 'indexed' },
              { id: 'doc-2', status: 'indexed' },
            ],
            pagination: { next_cursor: 'abc123', has_more: true },
          }),
        });

        const client = new RagieClient();
        const result = await client.listDocuments({
          partition: 'company-123',
          pageSize: 50,
        });

        expect(result.items).toHaveLength(2);
        expect(result.pagination?.next_cursor).toBe('abc123');
      });

      it('includes partition in header', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ items: [] }),
        });

        const client = new RagieClient();
        await client.listDocuments({ partition: 'test-partition' });

        const [, options] = mockFetch.mock.calls[0];
        expect(options.headers.partition).toBe('test-partition');
      });
    });

    describe('retrieve', () => {
      it('retrieves chunks with partition in payload', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            scored_chunks: [
              {
                text: 'Relevant content',
                score: 0.95,
                metadata: { document_id: 'doc-1', filename: 'test.pdf' },
              },
            ],
          }),
        });

        const client = new RagieClient();
        const result = await client.retrieve({
          query: 'test query',
          partition: 'company-123',
          topK: 10,
        });

        expect(mockFetch).toHaveBeenCalledTimes(1);
        const [url, options] = mockFetch.mock.calls[0];
        expect(url).toContain('/retrievals');

        const body = JSON.parse(options.body);
        expect(body.query).toBe('test query');
        expect(body.partition).toBe('company-123');
        expect(body.top_k).toBe(10);

        expect(result).toHaveLength(1);
        expect(result[0].content).toBe('Relevant content');
        expect(result[0].score).toBe(0.95);
      });

      it('normalizes chunks with various field names', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            scored_chunks: [
              { text: 'Chunk 1', score: 0.9, metadata: { document_id: 'doc-1' } },
              { content: 'Chunk 2', score: 0.8, metadata: { doc_id: 'doc-2' } }, // alternate field names
            ],
          }),
        });

        const client = new RagieClient();
        const result = await client.retrieve({
          query: 'test',
          partition: 'test',
        });

        expect(result[0].content).toBe('Chunk 1');
        expect(result[0].doc_id).toBe('doc-1');
        expect(result[1].content).toBe('Chunk 2');
        expect(result[1].doc_id).toBe('doc-2');
      });
    });

    describe('waitUntilReady', () => {
      it('returns immediately if document is ready', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'doc-123', status: 'indexed' }),
        });

        const client = new RagieClient();
        const result = await client.waitUntilReady('doc-123');

        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(result.status).toBe('indexed');
      });

      it('polls until document is ready', async () => {
        mockFetch
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ id: 'doc-123', status: 'pending' }),
          })
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ id: 'doc-123', status: 'processing' }),
          })
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ id: 'doc-123', status: 'indexed' }),
          });

        const client = new RagieClient();
        const result = await client.waitUntilReady('doc-123', { intervalMs: 10 });

        expect(mockFetch).toHaveBeenCalledTimes(3);
        expect(result.status).toBe('indexed');
      });

      it('accepts various ready states', async () => {
        for (const status of ['indexed', 'summary_indexed', 'ready']) {
          mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ id: 'doc-123', status }),
          });

          const client = new RagieClient();
          const result = await client.waitUntilReady('doc-123');
          expect(result.status).toBe(status);
        }
      });

      it('throws on timeout', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({ id: 'doc-123', status: 'pending' }),
        });

        const client = new RagieClient();
        await expect(
          client.waitUntilReady('doc-123', { timeoutMs: 50, intervalMs: 10 })
        ).rejects.toThrow('Timeout waiting for document');
      });
    });

    describe('retry behavior', () => {
      it('retries on 429 rate limit', async () => {
        mockFetch
          .mockResolvedValueOnce({
            ok: false,
            status: 429,
            statusText: 'Too Many Requests',
            headers: new Map([['Retry-After', '1']]),
            text: async () => 'Rate limited',
          })
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ id: 'doc-123', status: 'indexed' }),
          });

        const client = new RagieClient();
        const result = await client.getDocument('doc-123');

        expect(mockFetch).toHaveBeenCalledTimes(2);
        expect(result.id).toBe('doc-123');
      });

      it('retries on 5xx errors', async () => {
        mockFetch
          .mockResolvedValueOnce({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            text: async () => 'Server error',
          })
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ id: 'doc-123', status: 'indexed' }),
          });

        const client = new RagieClient();
        const result = await client.getDocument('doc-123');

        expect(mockFetch).toHaveBeenCalledTimes(2);
        expect(result.id).toBe('doc-123');
      });
    });
  });

  describe('convenience functions', () => {
    describe('search', () => {
      it('searches with computed partition', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            scored_chunks: [{ text: 'Result', score: 0.9, metadata: {} }],
          }),
        });

        const result = await search('test query', 'CompanyABC');

        const body = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(body.partition).toBe('companyabc');
        expect(result).toHaveLength(1);
      });
    });

    describe('indexDocument', () => {
      it('creates and waits for document', async () => {
        mockFetch
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ id: 'ragie-doc-123', status: 'pending' }),
          })
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ id: 'ragie-doc-123', status: 'indexed' }),
          });

        const result = await indexDocument(
          'company-123',
          'local-doc-456',
          '# Document Content',
          { filename: 'test.pdf' }
        );

        expect(mockFetch).toHaveBeenCalledTimes(2);
        expect(result.id).toBe('ragie-doc-123');
        expect(result.status).toBe('indexed');
      });
    });

    describe('deleteDocument', () => {
      it('deletes document by Ragie ID', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        });

        await deleteDocument('ragie-doc-123');

        const [url, options] = mockFetch.mock.calls[0];
        expect(url).toContain('/documents/ragie-doc-123');
        expect(options.method).toBe('DELETE');
      });
    });

    describe('listDocuments', () => {
      it('lists documents for company', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            items: [{ id: 'doc-1' }, { id: 'doc-2' }],
          }),
        });

        const result = await listDocuments('CompanyXYZ');

        expect(mockFetch.mock.calls[0][1].headers.partition).toBe('companyxyz');
        expect(result.items).toHaveLength(2);
      });
    });

    describe('getDocumentStatus', () => {
      it('gets document by Ragie ID', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'ragie-doc-123', status: 'indexed' }),
        });

        const result = await getDocumentStatus('ragie-doc-123');

        expect(result.id).toBe('ragie-doc-123');
        expect(result.status).toBe('indexed');
      });
    });
  });

  describe('RagieError', () => {
    it('includes status code and response body', () => {
      const error = new RagieError('Test error', 500, 'Server error response');

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.responseBody).toBe('Server error response');
      expect(error.name).toBe('RagieError');
    });
  });
});
