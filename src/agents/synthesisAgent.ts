import type { Instrument, RagOutput, SignalOutput, SynthesisOutput, UserProfile } from "../types";
import { completeJson, GroqError } from "../services/groqClient";

const SYSTEM_PROMPT = `You are the Synthesis agent in a multi-agent retail investing system.

Produce ONE personalized investment stance using the three specialist signals, grounded research, and this user's risk profile.

The same market inputs may produce different stances for different users. Personalize the call using risk tolerance, investment horizon, allocation limits, holdings, and behavioral history.

Respond ONLY with strict JSON matching exactly:
{
  "stance": "Buy"|"Hold"|"Reduce"|"Avoid",
  "confidenceScore": number,
  "summary": string,
  "citedSources": string[],
  "personalizationNote": string
}

Rules:
- summary MUST be exactly 1-2 short sentences.
- summary MUST be under 220 characters whenever possible and NEVER exceed 280 characters.
- personalizationNote MUST be exactly 1 short sentence.
- personalizationNote MUST be under 140 characters whenever possible and NEVER exceed 180 characters.
- Be decisive and concise.
- Do not repeat the stance unnecessarily.
- Do not restate all three signals.
- Mention only the strongest evidence supporting the call.
- citedSources must contain only sources actually used, such as "momentum", "volume", "sentiment", or "D3".
- Never claim higher confidence than the weakest important input supports.
- If an input is degraded, account for it without lengthy explanation.
- Do not use markdown, bullets, headings, introductions, disclaimers, or conclusions.
- confidenceScore must be between 0 and 1.
- The output is displayed in a compact dashboard widget, so brevity is mandatory.`;

export async function runSynthesisAgent(
  instrument: Instrument,
  signals: SignalOutput[],
  rag: RagOutput,
  profile: UserProfile,
): Promise<SynthesisOutput> {
  const start = performance.now();
  const anyDegraded = signals.some((s) => s.degraded) || !!rag.degraded;

  try {
    const result = await completeJson<{ stance: SynthesisOutput["stance"]; confidenceScore: number; summary: string; citedSources: string[]; personalizationNote: string }>({
      system: SYSTEM_PROMPT,
      user: JSON.stringify({
        symbol: instrument.symbol,
        ltp: instrument.ltp,
        changePct: instrument.changePct,
        signals: signals.map((s) => ({ dimension: s.dimension, label: s.label, confidence: s.confidence, confidenceScore: s.confidenceScore, degraded: !!s.degraded })),
        groundedResearch: { answer: rag.answer, sourcesUsed: rag.chunks.map((c) => c.docId), degraded: !!rag.degraded },
        userProfile: {
          riskProfile: profile.riskProfile,
          horizonMonths: profile.horizonMonths,
          maxSingleStockAllocationPct: profile.maxSingleStockAllocationPct,
          behavioralHistory: profile.history,
          currentHolding: profile.holdings.find((h) => h.symbol === instrument.symbol) ?? null,
        },
      }),
    });
    return { symbol: instrument.symbol, ...result, latencyMs: Math.round(performance.now() - start) };
  } catch (err) {
    // Deterministic fallback so the pipeline never dead-ends without an output.
    const avgConfidence = signals.reduce((s, x) => s + x.confidenceScore, 0) / signals.length;
    const bullish = signals.filter((s) => /bullish|elevated|spike/i.test(s.label)).length;
    const bearish = signals.filter((s) => /bearish|thin/i.test(s.label)).length;
    let stance: SynthesisOutput["stance"] = "Hold";
    if (bullish > bearish && profile.riskProfile !== "conservative") stance = "Buy";
    else if (bearish > bullish) stance = profile.riskProfile === "conservative" ? "Avoid" : "Reduce";

    return {
      symbol: instrument.symbol,
      stance,
      confidenceScore: Math.min(0.4, avgConfidence * 0.6),
      summary: `Rule-based fallback synthesis (LLM unavailable: ${err instanceof GroqError ? err.message : "unknown error"}). Derived from ${bullish} bullish-leaning and ${bearish} bearish-leaning signal(s) out of ${signals.length}, weighted conservatively because grounded reasoning could not be produced.`,
      citedSources: signals.map((s) => s.dimension),
      personalizationNote: `Adjusted for ${profile.riskProfile} risk profile (max ${profile.maxSingleStockAllocationPct}% single-stock allocation, ${profile.horizonMonths}-month horizon) using threshold rules only.`,
      latencyMs: Math.round(performance.now() - start),
    };
  } finally {
    void anyDegraded;
  }
}
