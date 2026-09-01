import type { PerformanceMetricSet } from "../types";

export function PerformanceLog({ entries }: { entries: PerformanceMetricSet[] }) {
  if (entries.length === 0) {
    return <div className="perf-empty">No pipeline runs logged yet this session.</div>;
  }

  return (
    <table className="perf-table">
      <thead>
        <tr>
          <th>Time</th>
          <th>Symbol</th>
          <th>Latency</th>
          <th>Avg signal confidence</th>
          <th>Portfolio concentration</th>
          <th>Degraded events</th>
        </tr>
      </thead>
      <tbody>
        {[...entries].reverse().map((e, i) => (
          <tr key={`${e.timestamp}-${i}`}>
            <td>{new Date(e.timestamp).toLocaleTimeString("en-IN")}</td>
            <td>{e.symbol}</td>
            <td>{e.agentLatencyMs}ms</td>
            <td>{Math.round(e.avgSignalConfidence * 100)}%</td>
            <td>{Math.round(e.portfolioConcentrationScore * 100)}%</td>
            <td className={e.degradedEvents > 0 ? "down" : "up"}>{e.degradedEvents}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
