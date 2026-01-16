/**
 * Anthropic Claude Service for Evidence Extraction
 *
 * Uses Claude to evaluate whether RAG chunks satisfy assessment criteria.
 * Employs tool use (function calling) for structured, reliable output.
 */

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-sonnet-4-20250514';
const DEFAULT_MAX_TOKENS = 1024;

export class AnthropicError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public responseBody?: string
  ) {
    super(message);
    this.name = 'AnthropicError';
  }
}

// ============================================================================
// Types
// ============================================================================

export type CriterionStatus = 'met' | 'partial' | 'not_met' | 'insufficient';

export interface RagieChunk {
  content: string;
  score: number;
  chunk_id?: string;
  doc_id?: string;
  metadata: {
    document_id?: string;
    document_name?: string;
    page?: number | string | null;
    section_title?: string;
    [key: string]: unknown;
  };
}

export interface EvidenceResult {
  status: CriterionStatus;
  excerpt: string;
  chunkId: string | null;
  documentId: string | null;
  documentName: string | null;
  page: string | null;
  confidence: number;
  reasoning: string;
}

interface ToolInput {
  status: CriterionStatus;
  confidence: number;
  excerpt: string;
  chunk_index: number | null;
  reasoning: string;
}

// ============================================================================
// Tool Definition for Structured Output
// ============================================================================

const EVIDENCE_EVALUATION_TOOL = {
  name: 'evaluate_evidence',
  description: 'Evaluate whether the provided evidence chunks satisfy the assessment criterion. Returns a structured evaluation result.',
  input_schema: {
    type: 'object' as const,
    properties: {
      status: {
        type: 'string',
        enum: ['met', 'partial', 'not_met', 'insufficient'],
        description: `The evaluation status:
- "met": Evidence clearly and fully satisfies the criterion
- "partial": Evidence partially addresses the criterion but has gaps
- "not_met": Evidence exists but does not satisfy the criterion
- "insufficient": Not enough relevant evidence to make a determination`,
      },
      confidence: {
        type: 'number',
        minimum: 0,
        maximum: 1,
        description: 'Confidence score from 0.0 to 1.0 in the evaluation',
      },
      excerpt: {
        type: 'string',
        description: 'The most relevant excerpt from the evidence that supports the evaluation (verbatim quote, max 500 chars). Empty string if no relevant evidence.',
      },
      chunk_index: {
        type: ['integer', 'null'],
        description: 'Zero-based index of the chunk containing the best evidence, or null if no relevant evidence',
      },
      reasoning: {
        type: 'string',
        description: 'Brief explanation of why this status was assigned (1-2 sentences)',
      },
    },
    required: ['status', 'confidence', 'excerpt', 'chunk_index', 'reasoning'],
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

function getApiKey(): string {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new AnthropicError('ANTHROPIC_API_KEY environment variable is not set');
  }
  return apiKey;
}

function buildPrompt(criterionText: string, chunks: RagieChunk[]): string {
  const chunksText = chunks
    .map((chunk, index) => {
      const source = chunk.metadata.document_name || chunk.doc_id || 'Unknown';
      const page = chunk.metadata.page ? ` (Page ${chunk.metadata.page})` : '';
      return `[Chunk ${index}] Source: ${source}${page}\n${chunk.content}`;
    })
    .join('\n\n---\n\n');

  return `You are a compliance auditor evaluating whether documentary evidence satisfies a security control criterion.

## Criterion to Evaluate
${criterionText}

## Available Evidence
${chunks.length > 0 ? chunksText : '(No evidence chunks provided)'}

## Instructions
1. Carefully analyze each evidence chunk for relevance to the criterion
2. Determine if the evidence satisfies the criterion:
   - "met": Clear, documented evidence that fully addresses the criterion
   - "partial": Some evidence exists but incomplete or unclear
   - "not_met": Evidence exists but contradicts or fails to meet the criterion
   - "insufficient": No relevant evidence found in the provided chunks
3. Extract the most relevant verbatim excerpt (if any)
4. Provide brief reasoning for your evaluation

Use the evaluate_evidence tool to submit your structured evaluation.`;
}

// ============================================================================
// Main Function
// ============================================================================

/**
 * Extract and evaluate evidence from RAG chunks against a criterion
 *
 * @param criterionText - The criterion text to evaluate against
 * @param chunks - Array of RAG chunks from Ragie retrieval
 * @param options - Optional configuration
 * @returns Structured evaluation result
 */
export async function extractEvidence(
  criterionText: string,
  chunks: RagieChunk[],
  options: {
    model?: string;
    maxTokens?: number;
    timeout?: number;
  } = {}
): Promise<EvidenceResult> {
  const apiKey = getApiKey();
  const {
    model = DEFAULT_MODEL,
    maxTokens = DEFAULT_MAX_TOKENS,
    timeout = 60000,
  } = options;

  // Handle empty chunks case
  if (chunks.length === 0) {
    return {
      status: 'insufficient',
      excerpt: '',
      chunkId: null,
      documentId: null,
      documentName: null,
      page: null,
      confidence: 1.0,
      reasoning: 'No evidence chunks were provided for evaluation.',
    };
  }

  const prompt = buildPrompt(criterionText, chunks);

  const requestBody = {
    model,
    max_tokens: maxTokens,
    tools: [EVIDENCE_EVALUATION_TOOL],
    tool_choice: { type: 'tool', name: 'evaluate_evidence' },
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  };

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(timeout),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new AnthropicError(
        `Anthropic API error: ${response.status} ${response.statusText}`,
        response.status,
        text
      );
    }

    const data = await response.json();
    return parseResponse(data, chunks);
  } catch (error) {
    if (error instanceof AnthropicError) {
      throw error;
    }
    throw new AnthropicError(`Failed to call Anthropic API: ${(error as Error).message}`);
  }
}

/**
 * Parse Claude's response and extract the structured evaluation
 */
function parseResponse(
  response: {
    content?: Array<{
      type: string;
      name?: string;
      input?: ToolInput;
    }>;
    stop_reason?: string;
  },
  chunks: RagieChunk[]
): EvidenceResult {
  // Find the tool use block
  const toolUse = response.content?.find(
    (block) => block.type === 'tool_use' && block.name === 'evaluate_evidence'
  );

  if (!toolUse || !toolUse.input) {
    // Fallback if no tool use found
    return {
      status: 'insufficient',
      excerpt: '',
      chunkId: null,
      documentId: null,
      documentName: null,
      page: null,
      confidence: 0,
      reasoning: 'Failed to parse model response',
    };
  }

  const input = toolUse.input;
  const chunkIndex = input.chunk_index;

  // Get chunk metadata if a valid chunk was referenced
  let chunkId: string | null = null;
  let documentId: string | null = null;
  let documentName: string | null = null;
  let page: string | null = null;

  if (chunkIndex !== null && chunkIndex >= 0 && chunkIndex < chunks.length) {
    const chunk = chunks[chunkIndex];
    chunkId = chunk.chunk_id || null;
    documentId = chunk.metadata.document_id || chunk.doc_id || null;
    documentName = chunk.metadata.document_name || null;
    page = chunk.metadata.page != null ? String(chunk.metadata.page) : null;
  }

  return {
    status: input.status,
    excerpt: truncateExcerpt(input.excerpt || '', 500),
    chunkId,
    documentId,
    documentName,
    page,
    confidence: Math.max(0, Math.min(1, input.confidence || 0)),
    reasoning: input.reasoning || '',
  };
}

function truncateExcerpt(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Batch evaluate multiple criteria (for efficiency)
 * Processes sequentially to avoid rate limits
 */
export async function extractEvidenceBatch(
  criteria: Array<{ id: string; text: string; chunks: RagieChunk[] }>,
  options: {
    model?: string;
    maxTokens?: number;
    delayMs?: number;
    onProgress?: (completed: number, total: number) => void;
  } = {}
): Promise<Map<string, EvidenceResult>> {
  const { delayMs = 100, onProgress } = options;
  const results = new Map<string, EvidenceResult>();

  for (let i = 0; i < criteria.length; i++) {
    const criterion = criteria[i];

    try {
      const result = await extractEvidence(criterion.text, criterion.chunks, options);
      results.set(criterion.id, result);
    } catch (error) {
      // On error, mark as insufficient rather than failing entire batch
      results.set(criterion.id, {
        status: 'insufficient',
        excerpt: '',
        chunkId: null,
        documentId: null,
        documentName: null,
        page: null,
        confidence: 0,
        reasoning: `Evaluation failed: ${(error as Error).message}`,
      });
    }

    if (onProgress) {
      onProgress(i + 1, criteria.length);
    }

    // Small delay between calls to avoid rate limiting
    if (i < criteria.length - 1 && delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}
