import type { Instrument, RagOutput } from "../types";
import { completeJson, GroqError } from "../services/groqClient";
import { retrieve } from "../services/retrieval";

const SYSTEM_PROMPT = `You are a concise financial research agent.

Answer the question using ONLY the provided excerpts.

Return ONLY valid JSON in exactly this format:
{"answer":"..."}

Requirements:
- Answer in 1 or 2 short sentences.
- Keep the answer under 300 characters.
- Cite supporting documents using [D1], [D2], etc.
- If the excerpts do not contain enough information, say so briefly.
- Do not invent facts.
- Do not use markdown.
- Do not include any text outside the JSON object.`;

export async function runRagAgent(instrument: Instrument, question: string, forceDegraded = false): Promise<RagOutput> {
  const start = performance.now();
  const chunks = retrieve(instrument.symbol, question, 3);

  if (forceDegraded) {
    return {
      query: question,
      chunks,
      answer: "Document retrieval feed is temporarily unavailable. No grounded answer can be produced right now — showing signal-agent outputs only until the corpus connection is restored.",
      degraded: true,
      latencyMs: Math.round(performance.now() - start),
    };
  }

  if (chunks.length === 0) {
    return {
      query: question,
      chunks,
      answer: "No relevant filings, transcripts, or disclosures were found for this symbol in the corpus. Declining to answer rather than fabricating a citation.",
      degraded: true,
      latencyMs: Math.round(performance.now() - start),
    };
  }

  try {
    const result = await completeJson<{ answer: string }>({
      system: SYSTEM_PROMPT,
      user: JSON.stringify({
        question,
        excerpts: chunks.map((c) => ({ id: c.docId, title: c.title, source: c.source, text: c.snippet })),
      }),
    });
    return { query: question, chunks, answer: result.answer, latencyMs: Math.round(performance.now() - start) };
  } catch (err) {
    return {
      query: question,
      chunks,
      answer: `Grounded synthesis unavailable (${err instanceof GroqError ? err.message : "unknown error"}). Retrieved sources are still listed below for manual review.`,
      degraded: true,
      latencyMs: Math.round(performance.now() - start),
    };
  }
}
