import type { Instrument, SignalOutput } from "../types";
import { completeJson, GroqError } from "../services/groqClient";

function computeStats(instrument: Instrument) {
  const ratio = instrument.currentVolume / instrument.avgVolume;
  return { ratio: Math.round(ratio * 1000) / 1000 };
}

const SYSTEM_PROMPT = `You are the Volume Anomaly Analyst agent in a multi-agent retail investing system.

Analyze today's volume relative to the 30-day average.

Respond ONLY with strict JSON matching exactly:
{"label": string, "confidence": "low"|"medium"|"high", "confidenceScore": number, "reasoning": string}

Rules:
- reasoning MUST be exactly 1 concise sentence.
- reasoning MUST explicitly state the volume ratio.
- Keep reasoning under 100 characters when possible and NEVER exceed 140 characters.
- Use plain, direct language suitable for a compact dashboard card.
- Do not repeat the label in the reasoning.
- Do not add caveats, introductions, conclusions, markdown, or extra text.
- Around 1.0x is normal; >1.5x is elevated; >2.5x is extreme; <0.6x is unusually thin.
- Extreme volume may be event-driven or anomalous, so do not automatically interpret it as bullish or bearish.
- confidenceScore must be between 0 and 1.`;

function fallbackLabel(stats: ReturnType<typeof computeStats>) {
  const { ratio } = stats;
  let label = "Normal trading activity";
  let confidence: SignalOutput["confidence"] = "medium";
  if (ratio > 2.5) { label = "Extreme volume spike"; confidence = "high"; }
  else if (ratio > 1.5) { label = "Elevated volume"; confidence = "medium"; }
  else if (ratio < 0.6) { label = "Unusually thin liquidity"; confidence = "medium"; }
  return {
    label,
    confidence,
    confidenceScore: Math.min(0.95, Math.abs(ratio - 1) * 0.5 + 0.35),
    reasoning: `Rule-based fallback: current volume is ${ratio.toFixed(2)}x the 30-day average. LLM reasoning unavailable, so this label is from deterministic thresholds only.`,
  };
}

export async function runVolumeAgent(instrument: Instrument, forceDegraded = false): Promise<SignalOutput> {
  const start = performance.now();
  const stats = computeStats(instrument);

  if (forceDegraded) {
    const fb = fallbackLabel(stats);
    return { dimension: "volume", ...fb, degraded: true, latencyMs: Math.round(performance.now() - start) };
  }

  try {
    const result = await completeJson<{ label: string; confidence: SignalOutput["confidence"]; confidenceScore: number; reasoning: string }>({
      system: SYSTEM_PROMPT,
      user: JSON.stringify({
        symbol: instrument.symbol,
        currentVolume: instrument.currentVolume,
        avgVolume30d: instrument.avgVolume,
        volumeRatio: stats.ratio,
      }),
    });
    return { dimension: "volume", ...result, latencyMs: Math.round(performance.now() - start) };
  } catch (err) {
    const fb = fallbackLabel(stats);
    return {
      dimension: "volume",
      ...fb,
      degraded: true,
      reasoning: `${fb.reasoning} (${err instanceof GroqError ? err.message : "unknown error"})`,
      latencyMs: Math.round(performance.now() - start),
    };
  }
}
