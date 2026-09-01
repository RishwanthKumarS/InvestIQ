import type { Instrument, SignalOutput } from "../types";
import { completeJson, GroqError } from "../services/groqClient";

function computeStats(instrument: Instrument) {
  const prices = instrument.series.map((p) => p.price);
  const first = prices[0];
  const last = prices[prices.length - 1];
  const returnPct = ((last - first) / first) * 100;

  // simple momentum: short window (last 5) vs long window (all 30) average
  const shortAvg = prices.slice(-5).reduce((a, b) => a + b, 0) / 5;
  const longAvg = prices.reduce((a, b) => a + b, 0) / prices.length;
  const momentumRatio = (shortAvg - longAvg) / longAvg;

  return { returnPct: Math.round(returnPct * 100) / 100, momentumRatio: Math.round(momentumRatio * 10000) / 10000, shortAvg, longAvg };
}

const SYSTEM_PROMPT = `You are the Momentum Analyst agent in a multi-agent retail investing system.

Analyze the supplied momentum statistics and classify the stock's short-term momentum.

Respond ONLY with strict JSON matching exactly:
{"label": string, "confidence": "low"|"medium"|"high", "confidenceScore": number, "reasoning": string}

Rules:
- reasoning MUST be exactly 1 concise sentence.
- reasoning MUST include the key numeric evidence: 5-period average, 30-period average, or period return.
- Keep reasoning under 120 characters when possible and NEVER exceed 160 characters.
- Use plain, direct language suitable for a compact dashboard card.
- Do not repeat the label in the reasoning.
- Do not add caveats, introductions, conclusions, markdown, or extra text.
- Be conservative: noisy short-term data should not receive high confidence.
- confidenceScore must be between 0 and 1.`;

function fallbackLabel(stats: ReturnType<typeof computeStats>) {
  const { momentumRatio, returnPct } = stats;
  let label = "Neutral / range-bound";
  let confidence: SignalOutput["confidence"] = "low";
  if (momentumRatio > 0.01) { label = "Bullish short-term momentum"; confidence = momentumRatio > 0.025 ? "high" : "medium"; }
  else if (momentumRatio < -0.01) { label = "Bearish short-term momentum"; confidence = momentumRatio < -0.025 ? "high" : "medium"; }
  return {
    label,
    confidence,
    confidenceScore: Math.min(0.95, Math.abs(momentumRatio) * 20 + 0.2),
    reasoning: `Rule-based fallback: 5-period average is ${(momentumRatio * 100).toFixed(2)}% away from the 30-period average, with a period return of ${returnPct.toFixed(2)}%. LLM reasoning unavailable, so this label is from deterministic thresholds only.`,
  };
}

export async function runMomentumAgent(instrument: Instrument, forceDegraded = false): Promise<SignalOutput> {
  const start = performance.now();
  const stats = computeStats(instrument);

  if (forceDegraded) {
    const fb = fallbackLabel(stats);
    return { dimension: "momentum", ...fb, degraded: true, latencyMs: Math.round(performance.now() - start) };
  }

  try {
    const result = await completeJson<{ label: string; confidence: SignalOutput["confidence"]; confidenceScore: number; reasoning: string }>({
      system: SYSTEM_PROMPT,
      user: JSON.stringify({
        symbol: instrument.symbol,
        ltp: instrument.ltp,
        periodReturnPct: stats.returnPct,
        shortAvgPrice: Math.round(stats.shortAvg * 100) / 100,
        longAvgPrice: Math.round(stats.longAvg * 100) / 100,
        momentumRatioPct: Math.round(stats.momentumRatio * 10000) / 100,
      }),
    });
    return { dimension: "momentum", ...result, latencyMs: Math.round(performance.now() - start) };
  } catch (err) {
    const fb = fallbackLabel(stats);
    return {
      dimension: "momentum",
      ...fb,
      degraded: true,
      reasoning: `${fb.reasoning} (${err instanceof GroqError ? err.message : "unknown error"})`,
      latencyMs: Math.round(performance.now() - start),
    };
  }
}
