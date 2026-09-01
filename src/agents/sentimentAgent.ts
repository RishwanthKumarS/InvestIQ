import type { Instrument, SignalOutput } from "../types";
import { completeJson, GroqError } from "../services/groqClient";
import { retrieve } from "../services/retrieval";

const SYSTEM_PROMPT = `You are the Sentiment Analyst agent in a multi-agent retail investing system.

Analyze recent filings, earnings transcripts, and institutional-flow excerpts for the stock.

Respond ONLY with strict JSON matching exactly:
{"label": string, "confidence": "low"|"medium"|"high", "confidenceScore": number, "reasoning": string}

Rules:
- reasoning MUST be exactly 1 concise sentence.
- Summarize the strongest sentiment signal from the excerpts.
- Mention the relevant source id when useful, such as [D2].
- Keep reasoning under 120 characters when possible and NEVER exceed 160 characters.
- Paraphrase; never quote documents verbatim.
- If evidence conflicts or is thin, say "Mixed evidence" or "Limited evidence" briefly.
- Do not repeat the label in the reasoning.
- Do not add introductions, conclusions, caveats, markdown, or extra text.
- confidenceScore must be between 0 and 1.
- Never infer facts that are not supported by the excerpts.`;

function fallbackLabel(hasDocs: boolean) {
  return {
    label: hasDocs ? "Mixed sentiment signal" : "Sentiment feed unavailable",
    confidence: "low" as const,
    confidenceScore: 0.25,
    reasoning: hasDocs
      ? "Rule-based fallback: retrieved filings exist but LLM synthesis was unavailable, so sentiment direction could not be reliably scored — treat as inconclusive."
      : "Rule-based fallback: no relevant filings or transcripts were retrieved for this symbol in the corpus, and LLM synthesis is unavailable. Sentiment classification is withheld rather than guessed.",
  };
}

export async function runSentimentAgent(instrument: Instrument, forceDegraded = false): Promise<SignalOutput> {
  const start = performance.now();
  const chunks = retrieve(instrument.symbol, `recent sentiment outlook institutional flows management tone ${instrument.symbol}`, 3);

  if (forceDegraded || chunks.length === 0) {
    const fb = fallbackLabel(chunks.length > 0);
    return { dimension: "sentiment", ...fb, degraded: true, latencyMs: Math.round(performance.now() - start) };
  }

  try {
    const result = await completeJson<{ label: string; confidence: SignalOutput["confidence"]; confidenceScore: number; reasoning: string }>({
      system: SYSTEM_PROMPT,
      user: JSON.stringify({
        symbol: instrument.symbol,
        excerpts: chunks.map((c) => ({ id: c.docId, source: c.source, text: c.snippet })),
      }),
    });
    return { dimension: "sentiment", ...result, latencyMs: Math.round(performance.now() - start) };
  } catch (err) {
    const fb = fallbackLabel(true);
    return {
      dimension: "sentiment",
      ...fb,
      degraded: true,
      reasoning: `${fb.reasoning} (${err instanceof GroqError ? err.message : "unknown error"})`,
      latencyMs: Math.round(performance.now() - start),
    };
  }
}
