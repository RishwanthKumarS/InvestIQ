import type { SignalOutput } from "../types";
import { ConfidenceRing } from "./ConfidenceRing";

const DIM_TITLES: Record<SignalOutput["dimension"], string> = {
  momentum: "Momentum",
  volume: "Volume",
  sentiment: "Sentiment",
};

export function SignalCard({ signal }: { signal: SignalOutput }) {
  return (
    <div className={`signal-card ${signal.dimension}`}>
      <div className="signal-top">
        <span className="signal-dim">{DIM_TITLES[signal.dimension]}</span>
        <ConfidenceRing score={signal.confidenceScore} size={36} strokeWidth={3.5} />
      </div>
      <div className="signal-label">{signal.label}</div>
      <div className="signal-reasoning">{signal.reasoning}</div>
      {signal.degraded && <div className="degraded-flag">Fallback mode · {signal.latencyMs}ms</div>}
    </div>
  );
}
