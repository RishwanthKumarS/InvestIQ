import type { SectorSlice } from "../services/logger";

// Distinct, theme-consistent colors, one per sector slice, in the order sectors are given.
const PALETTE = ["#7c8cff", "#33d6a6", "#e3a72b", "#f0665a", "#b39ef3", "#38bdf8"];

interface Props {
  sectors: SectorSlice[];
  size?: number;
  strokeWidth?: number;
}

export function SectorRing({ sectors, size = 108, strokeWidth = 13 }: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;

  return (
    <div className="sector-ring-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="sector-ring-svg">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--line-soft)" strokeWidth={strokeWidth} />
        {sectors.map((slice, i) => {
          const dash = Math.max(0, circumference * slice.pct - 2);
          const offset = circumference * (1 - cumulative);
          cumulative += slice.pct;
          return (
            <circle
              key={slice.sector}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={PALETTE[i % PALETTE.length]}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          );
        })}
      </svg>
      <div className="sector-legend">
        {sectors.length === 0 && <span className="sector-legend-empty">No holdings</span>}
        {sectors.map((slice, i) => (
          <div className="sector-legend-row" key={slice.sector}>
            <span className="sector-dot" style={{ background: PALETTE[i % PALETTE.length] }} />
            <span className="sector-legend-label">{slice.sector}</span>
            <span className="sector-legend-pct mono">{Math.round(slice.pct * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
