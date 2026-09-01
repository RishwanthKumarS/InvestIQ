import { DOCUMENT_CORPUS, getDocsForSymbol, type CorpusDoc } from "../data/documentCorpus";
import type { RetrievedChunk } from "../types";

// A lightweight TF-IDF cosine scorer standing in for a vector database.
// Swap this module for a real embeddings + ANN index (pgvector / Qdrant /
// Pinecone) without touching the agent layer — the contract (query in,
// scored chunks out) stays the same.

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9%.\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

function buildIdf(docs: CorpusDoc[]): Map<string, number> {
  const df = new Map<string, number>();
  for (const doc of docs) {
    const seen = new Set(tokenize(doc.text));
    for (const term of seen) df.set(term, (df.get(term) ?? 0) + 1);
  }
  const idf = new Map<string, number>();
  for (const [term, count] of df) {
    idf.set(term, Math.log((docs.length + 1) / (count + 0.5)) + 1);
  }
  return idf;
}

function tfidfVector(tokens: string[], idf: Map<string, number>): Map<string, number> {
  const tf = new Map<string, number>();
  for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
  const vec = new Map<string, number>();
  for (const [term, freq] of tf) {
    vec.set(term, (freq / tokens.length) * (idf.get(term) ?? 1));
  }
  return vec;
}

function cosine(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (const v of a.values()) na += v * v;
  for (const v of b.values()) nb += v * v;
  for (const [term, va] of a) {
    const vb = b.get(term);
    if (vb) dot += va * vb;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/** Retrieve the top-k semantically relevant chunks for a symbol given a query. */
export function retrieve(symbol: string, query: string, k = 3): RetrievedChunk[] {
  const scoped = getDocsForSymbol(symbol);
  const pool = scoped.length > 0 ? scoped : DOCUMENT_CORPUS;
  const idf = buildIdf(pool);
  const qVec = tfidfVector(tokenize(query), idf);

  const scored = pool.map((doc) => {
    const dVec = tfidfVector(tokenize(doc.text), idf);
    return { doc, score: cosine(qVec, dVec) };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, k).map(({ doc, score }) => ({
    docId: doc.id,
    title: doc.title,
    source: `${doc.source} · ${doc.date}`,
    snippet: doc.text,
    score: Math.round(score * 1000) / 1000,
  }));
}
