/**
 * Landing.ai ADE (Agentic Document Extraction) Service
 *
 * Parses documents (PDF, images) and extracts structured content.
 * Uses the Landing.ai Vision Agent API.
 */

const LANDING_AI_BASE_URL = process.env.LANDING_AI_BASE_URL || 'https://api.va.landing.ai';
const MAX_RETRIES = parseInt(process.env.PARSE_MAX_RETRIES || '3', 10);

// Supported file extensions for ADE
export const ALLOWED_EXTENSIONS = new Set([
  '.pdf', '.png', '.jpg', '.jpeg', '.tif', '.tiff', '.webp',
  '.bmp', '.gif', '.apng', '.jp2', '.pcx', '.ppm', '.psd',
  '.tga', '.icns', '.dcx', '.dds', '.dib', '.gd'
]);

export class LandingAIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public responseBody?: string
  ) {
    super(message);
    this.name = 'LandingAIError';
  }
}

export interface ParsedChunk {
  text: string;
  page?: number;
  bbox?: { x: number; y: number; width: number; height: number };
  type?: string;
  confidence?: number;
}

export interface ParsedSplit {
  page: number;
  markdown: string;
  chunks?: ParsedChunk[];
}

export interface ParseMetadata {
  pageCount?: number;
  title?: string;
  author?: string;
  creationDate?: string;
  modificationDate?: string;
  [key: string]: unknown;
}

export interface ParseResult {
  markdown: string;
  chunks: ParsedChunk[];
  splits: ParsedSplit[];
  metadata: ParseMetadata;
}

function getApiKey(): string {
  const apiKey = process.env.LANDING_AI_API_KEY;
  if (!apiKey) {
    throw new LandingAIError('LANDING_AI_API_KEY environment variable is not set');
  }
  return apiKey;
}

function isAllowedExtension(filename: string): boolean {
  const ext = filename.toLowerCase().match(/\.[^.]+$/)?.[0] || '';
  return ALLOWED_EXTENSIONS.has(ext);
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Parse a document using Landing.ai ADE API
 *
 * @param fileUrl - URL to the document (can be a file:// path or http(s) URL)
 * @param options - Parsing options
 * @returns Parsed document with markdown, chunks, splits, and metadata
 */
export async function parseDocument(
  fileUrl: string,
  options: {
    split?: 'full' | 'page';
    timeout?: number;
  } = {}
): Promise<ParseResult> {
  const apiKey = getApiKey();
  const { split = 'full', timeout = 120000 } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const body: Record<string, unknown> = {
        document_url: fileUrl,
      };

      // Only add split param if it's "page"
      if (split === 'page') {
        body.split = 'page';
      }

      const response = await fetch(`${LANDING_AI_BASE_URL}/v1/tools/agentic-document-extraction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeout),
      });

      if (!response.ok) {
        const text = await response.text();

        // Handle encrypted PDF error
        if (response.status === 422 || text.toLowerCase().includes('encrypted')) {
          throw new LandingAIError(
            'Document appears to be encrypted or password-protected',
            response.status,
            text
          );
        }

        // Retry on 5xx errors
        if (response.status >= 500 && attempt < MAX_RETRIES) {
          await sleep(Math.pow(2, attempt) * 500);
          continue;
        }

        // Retry on rate limit
        if (response.status === 429 && attempt < MAX_RETRIES) {
          const retryAfter = response.headers.get('Retry-After');
          const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : Math.pow(2, attempt) * 1000;
          await sleep(waitTime);
          continue;
        }

        throw new LandingAIError(
          `Landing.ai API error: ${response.status} ${response.statusText}`,
          response.status,
          text
        );
      }

      const data = await response.json();

      return {
        markdown: data.markdown || data.text || '',
        chunks: normalizeChunks(data.chunks || []),
        splits: normalizeSplits(data.splits || data.pages || []),
        metadata: normalizeMetadata(data.metadata || {}),
      };
    } catch (error) {
      lastError = error as Error;

      // Don't retry on non-retryable errors
      if (error instanceof LandingAIError && error.statusCode && error.statusCode < 500 && error.statusCode !== 429) {
        throw error;
      }

      if (attempt < MAX_RETRIES) {
        await sleep(Math.pow(2, attempt) * 500);
      }
    }
  }

  if (lastError) {
    throw lastError;
  }

  throw new LandingAIError('Parse failed with no error details');
}

/**
 * Parse a document from a file buffer
 */
export async function parseDocumentFromBuffer(
  buffer: Buffer,
  filename: string,
  options: {
    split?: 'full' | 'page';
    timeout?: number;
  } = {}
): Promise<ParseResult> {
  const apiKey = getApiKey();
  const { split = 'full', timeout = 120000 } = options;

  if (!isAllowedExtension(filename)) {
    throw new LandingAIError(`Unsupported file extension: ${filename}`);
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Create form data with file
      const formData = new FormData();
      const blob = new Blob([buffer], { type: getMimeType(filename) });
      formData.append('file', blob, filename);

      if (split === 'page') {
        formData.append('split', 'page');
      }

      const response = await fetch(`${LANDING_AI_BASE_URL}/v1/tools/agentic-document-extraction`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
        },
        body: formData,
        signal: AbortSignal.timeout(timeout),
      });

      if (!response.ok) {
        const text = await response.text();

        if (response.status === 422 || text.toLowerCase().includes('encrypted')) {
          throw new LandingAIError(
            'Document appears to be encrypted or password-protected',
            response.status,
            text
          );
        }

        if (response.status >= 500 && attempt < MAX_RETRIES) {
          await sleep(Math.pow(2, attempt) * 500);
          continue;
        }

        if (response.status === 429 && attempt < MAX_RETRIES) {
          const retryAfter = response.headers.get('Retry-After');
          const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : Math.pow(2, attempt) * 1000;
          await sleep(waitTime);
          continue;
        }

        throw new LandingAIError(
          `Landing.ai API error: ${response.status} ${response.statusText}`,
          response.status,
          text
        );
      }

      const data = await response.json();

      return {
        markdown: data.markdown || data.text || '',
        chunks: normalizeChunks(data.chunks || []),
        splits: normalizeSplits(data.splits || data.pages || []),
        metadata: normalizeMetadata(data.metadata || {}),
      };
    } catch (error) {
      lastError = error as Error;

      if (error instanceof LandingAIError && error.statusCode && error.statusCode < 500 && error.statusCode !== 429) {
        throw error;
      }

      if (attempt < MAX_RETRIES) {
        await sleep(Math.pow(2, attempt) * 500);
      }
    }
  }

  if (lastError) {
    throw lastError;
  }

  throw new LandingAIError('Parse failed with no error details');
}

function normalizeChunks(chunks: unknown[]): ParsedChunk[] {
  if (!Array.isArray(chunks)) return [];

  return chunks.map((chunk: unknown) => {
    const c = chunk as Record<string, unknown>;
    return {
      text: String(c.text || c.content || ''),
      page: typeof c.page === 'number' ? c.page : undefined,
      bbox: c.bbox as ParsedChunk['bbox'],
      type: typeof c.type === 'string' ? c.type : undefined,
      confidence: typeof c.confidence === 'number' ? c.confidence : undefined,
    };
  });
}

function normalizeSplits(splits: unknown[]): ParsedSplit[] {
  if (!Array.isArray(splits)) return [];

  return splits.map((split: unknown, index: number) => {
    const s = split as Record<string, unknown>;
    return {
      page: typeof s.page === 'number' ? s.page : index + 1,
      markdown: String(s.markdown || s.text || s.content || ''),
      chunks: s.chunks ? normalizeChunks(s.chunks as unknown[]) : undefined,
    };
  });
}

function normalizeMetadata(metadata: unknown): ParseMetadata {
  if (!metadata || typeof metadata !== 'object') return {};

  const m = metadata as Record<string, unknown>;
  return {
    pageCount: typeof m.page_count === 'number' ? m.page_count : (typeof m.pageCount === 'number' ? m.pageCount : undefined),
    title: typeof m.title === 'string' ? m.title : undefined,
    author: typeof m.author === 'string' ? m.author : undefined,
    creationDate: typeof m.creation_date === 'string' ? m.creation_date : undefined,
    modificationDate: typeof m.modification_date === 'string' ? m.modification_date : undefined,
    ...m,
  };
}

function getMimeType(filename: string): string {
  const ext = filename.toLowerCase().match(/\.[^.]+$/)?.[0] || '';
  const mimeTypes: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.tif': 'image/tiff',
    '.tiff': 'image/tiff',
    '.bmp': 'image/bmp',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Check if a file extension is supported
 */
export function isSupportedFile(filename: string): boolean {
  return isAllowedExtension(filename);
}

/**
 * Get the list of supported file extensions
 */
export function getSupportedExtensions(): string[] {
  return Array.from(ALLOWED_EXTENSIONS);
}
