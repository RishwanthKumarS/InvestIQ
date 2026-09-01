import { useCallback, useState } from "react";
import type { Instrument, PipelineRunResult, UserProfile } from "../types";
import { runMomentumAgent } from "../agents/momentumAgent";
import { runVolumeAgent } from "../agents/volumeAgent";
import { runSentimentAgent } from "../agents/sentimentAgent";
import { runRagAgent } from "../agents/ragAgent";
import { runSynthesisAgent } from "../agents/synthesisAgent";
import { computeConcentrationScore, getSessionId, logMetrics } from "../services/logger";

export interface DegradedFlags {
  momentum: boolean;
  volume: boolean;
  sentiment: boolean;
  rag: boolean;
}

export const NO_DEGRADATION: DegradedFlags = { momentum: false, volume: false, sentiment: false, rag: false };

export function useAgentPipeline() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<PipelineRunResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (
      instrument: Instrument,
      profile: UserProfile,
      currentPrices: Record<string, number>,
      degradedFlags: DegradedFlags = NO_DEGRADATION,
    ) => {
      setRunning(true);
      setError(null);
      const pipelineStart = performance.now();

      try {
        // Three specialist agents dispatched in parallel, each with a defined
        // role and a structured output contract consumed by the synthesis layer.
        const [momentum, volume, sentiment] = await Promise.all([
          runMomentumAgent(instrument, degradedFlags.momentum),
          runVolumeAgent(instrument, degradedFlags.volume),
          runSentimentAgent(instrument, degradedFlags.sentiment),
        ]);

        const rag = await runRagAgent(
          instrument,
          `What do recent filings and disclosures say about ${instrument.symbol}'s near-term outlook?`,
          degradedFlags.rag,
        );

        const signals = [momentum, volume, sentiment];
        const synthesis = await runSynthesisAgent(instrument, signals, rag, profile);

        const degradedEvents = signals.filter((s) => s.degraded).length + (rag.degraded ? 1 : 0);
        const avgSignalConfidence =
          Math.round((signals.reduce((s, x) => s + x.confidenceScore, 0) / signals.length) * 1000) / 1000;
        const concentration = computeConcentrationScore(profile.holdings, currentPrices);

        const metrics = {
          sessionId: getSessionId(),
          symbol: instrument.symbol,
          timestamp: Date.now(),
          agentLatencyMs: Math.round(performance.now() - pipelineStart),
          avgSignalConfidence,
          portfolioConcentrationScore: concentration,
          degradedEvents,
        };
        logMetrics(metrics);

        const runResult: PipelineRunResult = {
          symbol: instrument.symbol,
          timestamp: Date.now(),
          signals,
          rag,
          synthesis,
          metrics,
          degraded: degradedEvents > 0,
          degradedReason: degradedEvents > 0 ? `${degradedEvents} agent(s) fell back to rule-based output` : undefined,
        };
        setResult(runResult);
        return runResult;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown pipeline error";
        setError(message);
        throw err;
      } finally {
        setRunning(false);
      }
    },
    [],
  );

  return { run, running, result, error };
}
