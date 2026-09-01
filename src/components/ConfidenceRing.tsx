// Circular confidence gauge. Ring color is interpolated on a red -> yellow -> green
// gradient relative to the score (0 = red, 0.5 = yellow, 1 = green), so color and
// fill both encode confidence at a glance without needing extra text.

const STOPS: [number, [number, number, number]][] = [
  [0, [239, 68, 68]], // red-500
  [0.5, [234, 179, 8]], // yellow-500
  [1, [34, 197, 94]], // green-500
];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function confidenceColor(score: number): string {
  const s = Math.max(0, Math.min(1, score));
  let lo = STOPS[0];
  let hi = STOPS[STOPS.length - 1];
  for (let i = 0; i < STOPS.length - 1; i++) {
    if (s >= STOPS[i][0] && s <= STOPS[i + 1][0]) {
      lo = STOPS[i];
      hi = STOPS[i + 1];
      break;
    }
  }
  const span = hi[0] - lo[0] || 1;
  const t = (s - lo[0]) / span;
  const [r, g, b] = [lerp(lo[1][0], hi[1][0], t), lerp(lo[1][1], hi[1][1], t), lerp(lo[1][2], hi[1][2], t)];
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

interface Props {
  score: number; // 0-1
  size?: number;
  strokeWidth?: number;
  label?: string; // shown centered, defaults to rounded percent
}

export function ConfidenceRing({ score, size = 44, strokeWidth = 4, label }: Props) {
  const clamped = Math.max(0, Math.min(1, score));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped);
  const color = confidenceColor(clamped);

  return (
    <div className="conf-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--line-soft)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 500ms ease, stroke 500ms ease" }}
        />
      </svg>
      <span className="conf-ring-label" style={{ color }}>
        {label ?? `${Math.round(clamped * 100)}`}
      </span>
    </div>
  );
}
