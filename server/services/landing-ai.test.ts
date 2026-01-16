import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  parseDocument,
  parseDocumentFromBuffer,
  isSupportedFile,
  getSupportedExtensions,
  ALLOWED_EXTENSIONS,
  LandingAIError,
} from './landing-ai';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('landing-ai', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Set API key for tests
    process.env.LANDING_AI_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    delete process.env.LANDING_AI_API_KEY;
  });

  describe('isSupportedFile', () => {
    it('returns true for PDF files', () => {
      expect(isSupportedFile('document.pdf')).toBe(true);
      expect(isSupportedFile('document.PDF')).toBe(true);
      expect(isSupportedFile('path/to/document.pdf')).toBe(true);
    });

    it('returns true for image files', () => {
      expect(isSupportedFile('image.png')).toBe(true);
      expect(isSupportedFile('image.jpg')).toBe(true);
      expect(isSupportedFile('image.jpeg')).toBe(true);
      expect(isSupportedFile('image.tiff')).toBe(true);
      expect(isSupportedFile('image.webp')).toBe(true);
    });

    it('returns false for unsupported files', () => {
      expect(isSupportedFile('document.docx')).toBe(false);
      expect(isSupportedFile('document.txt')).toBe(false);
      expect(isSupportedFile('document.xlsx')).toBe(false);
      expect(isSupportedFile('script.js')).toBe(false);
    });

    it('returns false for files without extension', () => {
      expect(isSupportedFile('document')).toBe(false);
    });
  });

  describe('getSupportedExtensions', () => {
    it('returns array of supported extensions', () => {
      const extensions = getSupportedExtensions();
      expect(Array.isArray(extensions)).toBe(true);
      expect(extensions).toContain('.pdf');
      expect(extensions).toContain('.png');
      expect(extensions).toContain('.jpg');
    });

    it('matches ALLOWED_EXTENSIONS set', () => {
      const extensions = getSupportedExtensions();
      expect(extensions.length).toBe(ALLOWED_EXTENSIONS.size);
      extensions.forEach(ext => {
        expect(ALLOWED_EXTENSIONS.has(ext)).toBe(true);
      });
    });
  });

  describe('parseDocument', () => {
    it('throws error when API key is not set', async () => {
      delete process.env.LANDING_AI_API_KEY;

      await expect(parseDocument('https://example.com/doc.pdf')).rejects.toThrow(
        'LANDING_AI_API_KEY environment variable is not set'
      );
    });

    it('calls API with correct parameters for full document', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          markdown: '# Test Document',
          chunks: [{ text: 'Test chunk', page: 1 }],
          splits: [],
          metadata: { pageCount: 1 },
        }),
      });

      const result = await parseDocument('https://example.com/doc.pdf');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/v1/tools/agentic-document-extraction');
      expect(options.method).toBe('POST');
      expect(options.headers['Authorization']).toBe('Bearer test-api-key');

      const body = JSON.parse(options.body);
      expect(body.document_url).toBe('https://example.com/doc.pdf');
      expect(body.split).toBeUndefined(); // full mode doesn't send split param
    });

    it('calls API with split parameter for page mode', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          markdown: '# Page 1',
          chunks: [],
          splits: [{ page: 1, markdown: '# Page 1' }],
          metadata: {},
        }),
      });

      await parseDocument('https://example.com/doc.pdf', { split: 'page' });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.split).toBe('page');
    });

    it('returns normalized result', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          markdown: '# Test Document\n\nSome content',
          chunks: [
            { text: 'Chunk 1', page: 1, confidence: 0.95 },
            { content: 'Chunk 2', page: 2 }, // alternate field name
          ],
          splits: [
            { page: 1, markdown: '# Page 1' },
            { page: 2, text: 'Page 2 content' }, // alternate field name
          ],
          metadata: {
            page_count: 2,
            title: 'Test Doc',
          },
        }),
      });

      const result = await parseDocument('https://example.com/doc.pdf');

      expect(result.markdown).toBe('# Test Document\n\nSome content');
      expect(result.chunks).toHaveLength(2);
      expect(result.chunks[0].text).toBe('Chunk 1');
      expect(result.chunks[0].page).toBe(1);
      expect(result.chunks[1].text).toBe('Chunk 2');
      expect(result.splits).toHaveLength(2);
      expect(result.splits[0].page).toBe(1);
      expect(result.splits[1].markdown).toBe('Page 2 content');
      expect(result.metadata.pageCount).toBe(2);
      expect(result.metadata.title).toBe('Test Doc');
    });

    it('handles encrypted PDF error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        statusText: 'Unprocessable Entity',
        text: async () => 'Document is encrypted',
      });

      await expect(parseDocument('https://example.com/encrypted.pdf')).rejects.toThrow(
        'Document appears to be encrypted or password-protected'
      );
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
          json: async () => ({
            markdown: '# Success',
            chunks: [],
            splits: [],
            metadata: {},
          }),
        });

      const result = await parseDocument('https://example.com/doc.pdf');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.markdown).toBe('# Success');
    });

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
          json: async () => ({
            markdown: '# Success',
            chunks: [],
            splits: [],
            metadata: {},
          }),
        });

      const result = await parseDocument('https://example.com/doc.pdf');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.markdown).toBe('# Success');
    });

    it('handles empty response gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const result = await parseDocument('https://example.com/doc.pdf');

      expect(result.markdown).toBe('');
      expect(result.chunks).toEqual([]);
      expect(result.splits).toEqual([]);
      expect(result.metadata).toEqual({});
    });
  });

  describe('parseDocumentFromBuffer', () => {
    it('throws error for unsupported file extension', async () => {
      const buffer = Buffer.from('test content');

      await expect(parseDocumentFromBuffer(buffer, 'document.docx')).rejects.toThrow(
        'Unsupported file extension: document.docx'
      );
    });

    it('sends file as FormData', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          markdown: '# Parsed from buffer',
          chunks: [],
          splits: [],
          metadata: {},
        }),
      });

      const buffer = Buffer.from('%PDF-1.4 test content');
      await parseDocumentFromBuffer(buffer, 'document.pdf');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [, options] = mockFetch.mock.calls[0];
      expect(options.body).toBeInstanceOf(FormData);
    });
  });

  describe('LandingAIError', () => {
    it('includes status code and response body', () => {
      const error = new LandingAIError('Test error', 422, 'Response body');

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(422);
      expect(error.responseBody).toBe('Response body');
      expect(error.name).toBe('LandingAIError');
    });
  });
});
