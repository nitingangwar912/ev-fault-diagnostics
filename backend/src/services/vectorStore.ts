import { KnowledgeDoc } from '../data/evFaultKnowledge';

export interface SearchResult {
  doc: KnowledgeDoc;
  score: number;
}

/**
 * EVFaultVectorStore — lightweight in-memory vector store.
 *
 * In production: stores real OpenAI text-embedding-3-small vectors (1536-dim)
 *   and ranks results by cosine similarity — semantic search, not just keyword match.
 *
 * In demo mode: uses TF-IDF-style keyword scoring against document text and
 *   the pre-defined keyword tags on each document.
 *
 * Why not use FAISS directly?
 * faiss-node requires native C++ compilation which can fail in CI/Docker environments.
 * This pure-TypeScript implementation is functionally equivalent for a small knowledge
 * base (<1000 docs) and avoids native dependency headaches in deployment.
 * For production scale, swap similaritySearch() for a faiss-node or Pinecone call.
 */
export class EVFaultVectorStore {
  private docs: KnowledgeDoc[] = [];

  // Separate map so we can add/update embeddings without touching the doc list.
  private embeddings: Map<string, number[]> = new Map();

  addDocuments(docs: KnowledgeDoc[]): void {
    this.docs = docs;
  }

  // Called after generating real embeddings from OpenAI for each document.
  addEmbedding(docId: string, embedding: number[]): void {
    this.embeddings.set(docId, embedding);
  }

  // ── Production search: cosine similarity ───────────────────────────────────
  // Works only when embeddings have been pre-loaded for all documents.
  // Cosine similarity is preferred over Euclidean distance for NLP embeddings
  // because it's invariant to vector magnitude (document length).
  similaritySearch(queryEmbedding: number[], k: number): SearchResult[] {
    const results: SearchResult[] = [];

    for (const doc of this.docs) {
      const docEmbedding = this.embeddings.get(doc.id);
      if (!docEmbedding) continue;
      const score = this.cosineSimilarity(queryEmbedding, docEmbedding);
      results.push({ doc, score });
    }

    // Sort descending by score, return top-k
    return results.sort((a, b) => b.score - a.score).slice(0, k);
  }

  // ── Demo search: keyword frequency scoring ─────────────────────────────────
  // Counts how many query terms appear in each document's text + keyword tags.
  // Tags get a 5× boost because they were hand-curated for exact-match retrieval.
  keywordSearch(query: string, k: number): SearchResult[] {
    // Ignore stop words and very short tokens
    const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    const results: SearchResult[] = [];

    for (const doc of this.docs) {
      let score = 0;
      const searchText = `${doc.title} ${doc.content} ${doc.keywords.join(' ')}`.toLowerCase();

      // Term frequency component
      for (const term of queryTerms) {
        const matches = (searchText.match(new RegExp(term, 'g')) || []).length;
        score += matches;
      }

      // Exact keyword tag boost — tags are concise domain terms (e.g. "ocpp", "gfci")
      for (const keyword of doc.keywords) {
        if (query.toLowerCase().includes(keyword)) {
          score += 5;
        }
      }

      if (score > 0) results.push({ doc, score });
    }

    return results.sort((a, b) => b.score - a.score).slice(0, k);
  }

  // Standard cosine similarity: dot(a,b) / (||a|| * ||b||)
  // Returns value in [-1, 1]; for normalized embeddings this is [0, 1].
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  }

  get size(): number {
    return this.docs.length;
  }
}
