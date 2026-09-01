import type { Instrument } from "../types";
import type { DegradedFlags } from "../hooks/useAgentPipeline";

interface Props {
  instrument: Instrument;
  running: boolean;
  degradedFlags: DegradedFlags;
  onToggleDegraded: (key: keyof DegradedFlags) => void;
  onRun: () => void;
}

const TOGGLE_LABELS: {
  key: keyof DegradedFlags;
  label: string;
  title: string;
}[] = [
  {
    key: "momentum",
    label: "Price",
    title: "Simulate the price feed failing",
  },
  {
    key: "volume",
    label: "Volume",
    title: "Simulate the volume feed failing",
  },
  {
    key: "sentiment",
    label: "Sentiment",
    title: "Simulate the sentiment feed failing",
  },
  {
    key: "rag",
    label: "Filings",
    title: "Simulate the filings corpus failing",
  },
];

export function InstrumentHeader({
  instrument,
  running,
  degradedFlags,
  onToggleDegraded,
  onRun,
}: Props) {
  return (
    <div className="instrument-header">
      <div className="instrument-info">
        <div className="instrument-name">
          {instrument.name}
        </div>

        <div className="instrument-meta">
          {instrument.symbol} · {instrument.sector} · vol{" "}
          {instrument.currentVolume.toLocaleString("en-IN")} vs avg{" "}
          {instrument.avgVolume.toLocaleString("en-IN")}
        </div>
      </div>

      <div className="instrument-price">
        <div className="instrument-ltp mono">
          ₹{instrument.ltp.toFixed(2)}
        </div>

        <div
          className={`instrument-change ${
            instrument.changePct >= 0 ? "up" : "down"
          }`}
        >
          {instrument.changePct >= 0 ? "+" : ""}
          {instrument.changePct.toFixed(2)}% today
        </div>
      </div>

      <div className="run-controls">
        <div className="degrade-toggles">
          {TOGGLE_LABELS.map(({ key, label, title }) => (
            <button
              key={key}
              className={`toggle-chip ${
                degradedFlags[key] ? "on" : ""
              }`}
              onClick={() => onToggleDegraded(key)}
              title={title}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          className="btn primary"
          onClick={onRun}
          disabled={running}
        >
          {running ? "Running…" : "Run pipeline"}
        </button>
      </div>
    </div>
  );
}