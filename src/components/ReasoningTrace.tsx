import type { PipelineRunResult } from "../types";

export function ReasoningTrace({ result }: { result: PipelineRunResult }) {
  const items = [
    ...result.signals.map((s) => ({
      agent: s.dimension,
      note: s.degraded ? "fell back to rule-based classification" : `classified: ${s.label}`,
      latency: s.latencyMs,
      degraded: !!s.degraded,
    })),
    {
      agent: "retrieval",
      note: result.rag.degraded
        ? "grounded synthesis unavailable, sources listed only"
        : `grounded answer from ${result.rag.chunks.length} chunk(s)`,
      latency: result.rag.latencyMs,
      degraded: !!result.rag.degraded,
    },
    {
      agent: "synthesis",
      note: `${result.synthesis.stance} · personalized for this user`,
      latency: result.synthesis.latencyMs,
      degraded: false,
    },
  ];

  return (
    <div className="trace-list">
      {items.map((item, i) => (
        <div className={`trace-item ${item.degraded ? "degraded" : ""}`} key={i}>
          <span className="trace-agent">{item.agent}</span>
          <span className="trace-note">{item.note}</span>
          <span className="trace-latency">{item.latency}ms</span>
        </div>
      ))}
    </div>
  );
}
