/**
 * Ragie.ai RAG (Retrieval Augmented Generation) Client
 *
 * Handles document indexing and semantic retrieval using Ragie.ai.
 * Uses partition-based multi-tenancy where partition = company_id.
 */

const RAGIE_BASE_URL = process.env.RAGIE_BASE_URL || 'https://api.ragie.ai';
const DEFAULT_TOP_K = 24;
const DEFAULT_MAX_PER_DOC = 6;
const DEFAULT_RERANK = true;
const DEFAULT_TIMEOUT = 60000;

// Document statuses that indicate readiness
const READY_STATES = new Set(['indexed', 'summary_indexed', 'ready']);

export class RagieError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public responseBody?: string
  ) {
    super(message);
    this.name = 'RagieError';
  }
}

// ============================================================================
// Types
// ============================================================================

export interface DocumentMetadata {
  [key: string]: unknown;
}

export interface RagieDocument {
  id: string;
  name?: string;
  status: string;
  metadata?: DocumentMetadata;
  external_id?: string;
  partition?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ChunkMetadata {
  document_id?: string;
  document_name?: string;
  doc_type?: string;
  section_title?: string;
  page?: number | string | null;
  filename?: string;
  title?: string;
  lang?: string;
  [key: string]: unknown;
}

export interface ScoredChunk {
  content: string;
  score: number;
  metadata: ChunkMetadata;
  chunk_id?: string;
  doc_id?: string;
}

export interface RetrievalResult {
  scored_chunks: ScoredChunk[];
  query?: string;
}

export interface ListDocumentsResult {
  items: RagieDocument[];
  pagination?: {
    next_cursor?: string;
    has_more?: boolean;
  };
}

export interface CreateDocumentOptions {
  content: string;
  filename: string;
  metadata: DocumentMetadata;
  partition: string;
  externalId?: string;
  name?: string;
  mode?: string | Record<string, unknown>;
}

export interface RetrieveOptions {
  query: string;
  partition: string;
  topK?: number;
  maxChunksPerDocument?: number;
  rerank?: boolean;
  filter?: Record<string, unknown>;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getApiKey(): string {
  const apiKey = process.env.RAGIE_API_KEY;
  if (!apiKey) {
    throw new RagieError('RAGIE_API_KEY environment variable is not set');
  }
  return apiKey;
}

function truncate(s: string, n: number = 600): string {
  return s.length <= n ? s : s.slice(0, n) + '…';
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Compute partition name from company ID
 * Partitions are lowercase alphanumeric with hyphens
 */
export function computePartition(companyId: string): string {
  return companyId.toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
}

/**
 * Sanitize filename for use as document name
 */
export function sanitizeFilename(name: string): string {
  let sanitized = name.trim().replace(/\//g, '__');
  sanitized = sanitized.replace(/[^a-zA-Z0-9_.-]+/g, '_');
  return sanitized || 'document';
}

// ============================================================================
// Ragie Client Class
// ============================================================================

export class RagieClient {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;

  constructor(options: { apiKey?: string; baseUrl?: string; timeout?: number } = {}) {
    this.apiKey = options.apiKey || getApiKey();
    this.baseUrl = (options.baseUrl || RAGIE_BASE_URL).replace(/\/$/, '');
    this.timeout = options.timeout || DEFAULT_TIMEOUT;
  }

  private async request<T>(
    method: string,
    path: string,
    options: {
      body?: unknown;
      headers?: Record<string, string>;
      params?: Record<string, string | number>;
      retries?: number;
    } = {}
  ): Promise<T> {
    const { body, headers = {}, params, retries = 3 } = options;

    let url = `${this.baseUrl}${path}`;
    if (params) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        searchParams.set(key, String(value));
      }
      url += `?${searchParams.toString()}`;
    }

    const requestHeaders: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Accept': 'application/json',
      ...headers,
    };

    if (body && !(body instanceof FormData)) {
      requestHeaders['Content-Type'] = 'application/json';
    }

    let lastResponse: Response | null = null;
    const backoff = 750;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, {
          method,
          headers: requestHeaders,
          body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
          signal: AbortSignal.timeout(this.timeout),
        });

        lastResponse = response;

        // Handle rate limiting
        if (response.status === 429) {
          if (attempt < retries) {
            const retryAfter = response.headers.get('Retry-After');
            const waitTime = retryAfter && /^\d+$/.test(retryAfter)
              ? parseInt(retryAfter, 10) * 1000
              : backoff * attempt;
            await sleep(waitTime);
            continue;
          }
        }

        // Retry on 5xx errors
        if (response.status >= 500) {
          if (attempt < retries) {
            await sleep(backoff * attempt);
            continue;
          }
        }

        if (!response.ok) {
          const text = await response.text();
          throw new RagieError(
            `Ragie API error: ${response.status} ${response.statusText}`,
            response.status,
            truncate(text)
          );
        }

        return await response.json() as T;
      } catch (error) {
        if (error instanceof RagieError) {
          throw error;
        }
        if (attempt === retries) {
          throw new RagieError(`Request failed after ${retries} attempts: ${(error as Error).message}`);
        }
        await sleep(backoff * attempt);
      }
    }

    throw new RagieError(`Request failed after ${retries} attempts`);
  }

  // ==========================================================================
  // Document Operations
  // ==========================================================================

  /**
   * Create a document in Ragie using partition mode
   * Content should be markdown text
   */
  async createDocument(options: CreateDocumentOptions): Promise<RagieDocument> {
    const { content, filename, metadata, partition, externalId, name, mode = 'fast' } = options;

    // Ensure filename ends with .md for markdown content
    const normalizedFilename = filename.toLowerCase().endsWith('.md')
      ? filename
      : `${filename}.md`;

    // Create form data
    const formData = new FormData();
    const blob = new Blob([content], { type: 'text/markdown' });
    formData.append('file', blob, normalizedFilename);
    formData.append('metadata', JSON.stringify(metadata));
    formData.append('mode', typeof mode === 'object' ? JSON.stringify(mode) : mode);
    formData.append('partition', partition);

    if (externalId) {
      formData.append('external_id', externalId);
    }
    if (name) {
      formData.append('name', name);
    }

    return this.request<RagieDocument>('POST', '/documents', {
      body: formData,
      retries: 4,
    });
  }

  /**
   * Get a document by ID
   */
  async getDocument(documentId: string): Promise<RagieDocument> {
    return this.request<RagieDocument>('GET', `/documents/${documentId}`);
  }

  /**
   * Delete a document by ID
   */
  async deleteDocument(documentId: string): Promise<void> {
    await this.request<unknown>('DELETE', `/documents/${documentId}`);
  }

  /**
   * List documents with optional filtering
   */
  async listDocuments(options: {
    partition?: string;
    filter?: Record<string, unknown>;
    pageSize?: number;
    cursor?: string;
  } = {}): Promise<ListDocumentsResult> {
    const { partition, filter, pageSize = 100, cursor } = options;

    const params: Record<string, string | number> = { page_size: pageSize };
    if (cursor) params.cursor = cursor;
    if (filter) params.filter = JSON.stringify(filter);

    const headers: Record<string, string> = {};
    if (partition) headers.partition = partition;

    return this.request<ListDocumentsResult>('GET', '/documents', { params, headers });
  }

  /**
   * Wait for a document to be indexed and ready
   */
  async waitUntilReady(
    documentId: string,
    options: { timeoutMs?: number; intervalMs?: number } = {}
  ): Promise<RagieDocument> {
    const { timeoutMs = 120000, intervalMs = 1000 } = options;
    const start = Date.now();

    while (true) {
      const doc = await this.getDocument(documentId);
      const status = (doc.status || '').toLowerCase();

      if (READY_STATES.has(status)) {
        return doc;
      }

      if (Date.now() - start > timeoutMs) {
        throw new RagieError(
          `Timeout waiting for document ${documentId} to be ready (status: ${doc.status})`
        );
      }

      await sleep(intervalMs);
    }
  }

  // ==========================================================================
  // Retrieval Operations
  // ==========================================================================

  /**
   * Retrieve relevant chunks for a query
   */
  async retrieve(options: RetrieveOptions): Promise<ScoredChunk[]> {
    const {
      query,
      partition,
      topK = DEFAULT_TOP_K,
      maxChunksPerDocument = DEFAULT_MAX_PER_DOC,
      rerank = DEFAULT_RERANK,
      filter,
    } = options;

    const payload: Record<string, unknown> = {
      query,
      top_k: topK,
      max_chunks_per_document: maxChunksPerDocument,
      rerank,
      partition, // partition goes in payload for /retrievals endpoint
    };

    if (filter) {
      payload.filter = filter;
    }

    const result = await this.request<{ scored_chunks?: unknown[]; chunks?: unknown[] }>(
      'POST',
      '/retrievals',
      { body: payload }
    );

    const chunks = result.scored_chunks || result.chunks || [];
    return normalizeChunks(chunks);
  }

  /**
   * Get all chunks for a specific document
   */
  async getDocumentChunks(
    documentId: string,
    options: { partition?: string; pageSize?: number } = {}
  ): Promise<ScoredChunk[]> {
    const { partition, pageSize = 100 } = options;
    const allChunks: unknown[] = [];
    let cursor: string | undefined;

    const headers: Record<string, string> = {};
    if (partition) headers.partition = partition;

    while (true) {
      const params: Record<string, string | number> = { page_size: pageSize };
      if (cursor) params.cursor = cursor;

      const result = await this.request<{
        chunks?: unknown[];
        pagination?: { next_cursor?: string };
      }>('GET', `/documents/${documentId}/chunks`, { params, headers });

      const items = result.chunks || [];
      allChunks.push(...items);

      cursor = result.pagination?.next_cursor;
      if (!cursor) break;
    }

    return normalizeChunks(allChunks, documentId);
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Search documents using RAG retrieval
 * This is the main function for querying indexed documents
 */
export async function search(
  query: string,
  companyId: string,
  options: {
    topK?: number;
    maxChunksPerDocument?: number;
    rerank?: boolean;
    filter?: Record<string, unknown>;
  } = {}
): Promise<ScoredChunk[]> {
  const client = new RagieClient();
  const partition = computePartition(companyId);

  return client.retrieve({
    query,
    partition,
    topK: options.topK || DEFAULT_TOP_K,
    maxChunksPerDocument: options.maxChunksPerDocument || DEFAULT_MAX_PER_DOC,
    rerank: options.rerank ?? DEFAULT_RERANK,
    filter: options.filter,
  });
}

/**
 * Index a document in Ragie
 */
export async function indexDocument(
  companyId: string,
  documentId: string,
  content: string,
  metadata: DocumentMetadata & { filename: string }
): Promise<RagieDocument> {
  const client = new RagieClient();
  const partition = computePartition(companyId);

  const doc = await client.createDocument({
    content,
    filename: sanitizeFilename(metadata.filename),
    metadata: {
      ...metadata,
      document_id: documentId,
      company_id: companyId,
    },
    partition,
    externalId: documentId,
    name: metadata.filename,
  });

  // Wait for indexing to complete
  return client.waitUntilReady(doc.id);
}

/**
 * Delete a document from Ragie
 */
export async function deleteDocument(ragieDocumentId: string): Promise<void> {
  const client = new RagieClient();
  await client.deleteDocument(ragieDocumentId);
}

/**
 * List documents for a company
 */
export async function listDocuments(
  companyId: string,
  options: { pageSize?: number; cursor?: string } = {}
): Promise<ListDocumentsResult> {
  const client = new RagieClient();
  const partition = computePartition(companyId);

  return client.listDocuments({
    partition,
    pageSize: options.pageSize,
    cursor: options.cursor,
  });
}

/**
 * Get document status
 */
export async function getDocumentStatus(ragieDocumentId: string): Promise<RagieDocument> {
  const client = new RagieClient();
  return client.getDocument(ragieDocumentId);
}

// ============================================================================
// Internal Helpers
// ============================================================================

function normalizeChunks(chunks: unknown[], fallbackDocId?: string): ScoredChunk[] {
  if (!Array.isArray(chunks)) return [];

  return chunks.map((chunk) => {
    const ch = chunk as Record<string, unknown>;
    const md = (ch.metadata as Record<string, unknown>) || {};

    return {
      content: String(ch.text || ch.content || ''),
      score: typeof ch.score === 'number' ? ch.score : 0,
      chunk_id: typeof ch.id === 'string' ? ch.id : (typeof ch.chunk_id === 'string' ? ch.chunk_id : undefined),
      doc_id: String(md.document_id || md.doc_id || fallbackDocId || ''),
      metadata: {
        document_id: String(md.document_id || md.doc_id || fallbackDocId || ''),
        document_name: String(md.filename || md.title || ch.doc_title || ch.title || ''),
        doc_type: String(md.doc_type || ''),
        section_title: String(md.section_title || ''),
        page: md.page ?? ch.page ?? ch.page_number ?? null,
        filename: String(md.filename || ''),
        title: String(md.title || ''),
        lang: String(md.lang || md.language || ''),
      },
    };
  });
}
