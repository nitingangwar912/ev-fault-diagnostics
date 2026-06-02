import OpenAI from 'openai';
import { EVFaultVectorStore } from './vectorStore';
import { EV_FAULT_KNOWLEDGE, KnowledgeDoc } from '../data/evFaultKnowledge';
import { buildSystemPrompt, buildUserPrompt, buildDemoResponse } from './promptTemplates';
import { winstonLogger } from '../middleware/logger';

// How many top documents to inject into the context window per query.
// Increasing this improves recall but uses more tokens and may dilute relevance.
const CONTEXT_WINDOW_DOCS = 3;

/**
 * RAGService — the core of the diagnostic engine.
 *
 * Pipeline:
 *  1. RETRIEVAL  — find the k most relevant documents for the user query
 *                  (cosine similarity in production, keyword scoring in demo)
 *  2. AUGMENTATION — inject retrieved docs into the LLM prompt as context
 *  3. GENERATION  — stream the LLM response token-by-token via SSE
 *
 * In DEMO_MODE the service runs fully offline — no OpenAI API key required.
 * The same retrieval pipeline runs; only the generation stage is mocked.
 */
export class RAGService {
  private vectorStore: EVFaultVectorStore;
  private openai: OpenAI | null = null;
  private isDemoMode: boolean;

  constructor() {
    // Decide mode at startup so we don't branch on every request
    this.isDemoMode = process.env.DEMO_MODE === 'true' || !process.env.OPENAI_API_KEY;
    this.vectorStore = new EVFaultVectorStore();

    if (!this.isDemoMode && process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }

    this.initKnowledgeBase();

    winstonLogger.info('RAG service initialized', {
      mode: this.isDemoMode ? 'demo' : 'production',
      documentsLoaded: this.vectorStore.size
    });
  }

  // ── Stage 0: Load knowledge base into vector store on startup ──────────────
  private initKnowledgeBase(): void {
    this.vectorStore.addDocuments(EV_FAULT_KNOWLEDGE);
    winstonLogger.info('Knowledge base loaded', { documents: EV_FAULT_KNOWLEDGE.length });
  }

  // ── Stage 1: RETRIEVAL ─────────────────────────────────────────────────────
  // Converts the query to an embedding vector then finds nearest neighbours.
  // Falls back to keyword scoring in demo mode (no API call needed).
  async retrieveContext(query: string): Promise<KnowledgeDoc[]> {
    let results;

    if (!this.isDemoMode && this.openai) {
      // Production path: use OpenAI text-embedding-3-small for semantic search.
      // This model produces 1536-dim vectors; cosine similarity finds related docs
      // even when the user doesn't use the exact fault terminology.
      const embeddingResponse = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: query
      });
      const queryEmbedding = embeddingResponse.data[0].embedding;
      results = this.vectorStore.similaritySearch(queryEmbedding, CONTEXT_WINDOW_DOCS);
    } else {
      // Demo path: BM25-inspired keyword matching — fast, zero-cost, still effective
      // because fault terminology is highly domain-specific.
      results = this.vectorStore.keywordSearch(query, CONTEXT_WINDOW_DOCS);
    }

    const docs = results.map(r => r.doc);
    winstonLogger.info('Context retrieved', {
      query: query.slice(0, 80),
      topResult: docs[0]?.metadata.faultCode ?? 'none',
      docsRetrieved: docs.length
    });

    return docs;
  }

  // ── Stage 2 & 3: AUGMENTATION + GENERATION ────────────────────────────────
  // Retrieves context first, then streams the LLM-generated response.
  // Using an AsyncGenerator lets the route handler forward tokens over SSE
  // without buffering the full response — gives users instant feedback.
  async *streamResponse(query: string): AsyncGenerator<string> {
    const retrievedDocs = await this.retrieveContext(query);

    if (!this.isDemoMode && this.openai) {
      yield* this.streamOpenAIResponse(query, retrievedDocs);
    } else {
      yield* this.streamDemoResponse(query, retrievedDocs);
    }
  }

  // Production generation: real GPT-4o-mini call with RAG-augmented prompt.
  // Temperature 0.3 keeps diagnostic advice consistent and avoids hallucination.
  private async *streamOpenAIResponse(
    query: string,
    retrievedDocs: KnowledgeDoc[]
  ): AsyncGenerator<string> {
    if (!this.openai) return;

    const stream = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: buildUserPrompt({ query, retrievedDocs }) }
      ],
      stream: true,
      temperature: 0.3,   // low temp = more deterministic diagnostic output
      max_tokens: 1024
    });

    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content;
      if (token) yield token;
    }
  }

  // Demo generation: pre-built structured response streamed char-by-char to
  // simulate real token streaming in the UI. Uses the top retrieved doc so the
  // response is still contextually relevant to the user's query.
  private async *streamDemoResponse(
    query: string,
    retrievedDocs: KnowledgeDoc[]
  ): AsyncGenerator<string> {
    const topDoc = retrievedDocs[0];

    const response = topDoc
      ? buildDemoResponse(query, topDoc)
      : `**General EV Charger Diagnostic Guidance**\n\nI couldn't find a specific fault match for your query. Please provide more details such as:\n- The fault code displayed on the charger\n- Any LED indicator patterns\n- Whether the fault is intermittent or persistent\n- The charger model and firmware version\n\nCommon starting points: check network connectivity, inspect the charging cable for damage, and review the charger management system logs for recent events.`;

    // Stream char-by-char with per-character delay to mimic LLM token cadence.
    // Newlines get a slightly longer pause to make sections feel deliberate.
    for (const char of response) {
      yield char;
      await delay(char === '\n' ? 20 : 12);
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
