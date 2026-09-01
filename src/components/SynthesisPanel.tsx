import type { SynthesisOutput } from "../types";
import { ConfidenceRing } from "./ConfidenceRing";

export function SynthesisPanel({ synthesis }: { synthesis: SynthesisOutput }) {
  return (
    <div className="synthesis-panel">
      <div className="stance-block">
        <ConfidenceRing score={synthesis.confidenceScore} size={64} strokeWidth={5} />
        <span className={`stance-badge ${synthesis.stance}`}>{synthesis.stance}</span>
      </div>
      <div className="synthesis-body">
        <p className="synthesis-summary">{synthesis.summary}</p>
        <div className="personalization-note">{synthesis.personalizationNote}</div>
        <div className="cited-sources">
          {synthesis.citedSources.map((s) => (
            <span className="source-chip" key={s}>
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
