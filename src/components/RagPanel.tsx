import type { RagOutput } from "../types";

export function RagPanel({ rag }: { rag: RagOutput }) {
  return (
    <div className="rag-panel">
      <div className="rag-question">Query: “{rag.query}”</div>
      <div className="rag-answer">{rag.answer}</div>
      <div className="chunk-list">
        {rag.chunks.map((c) => (
          <div className="chunk-row" key={c.docId}>
            <span className="chunk-id">[{c.docId}]</span>
            <span>
              <div className="chunk-title">{c.title}</div>
              <div className="chunk-source">{c.source}</div>
            </span>
            <span className="chunk-score">match {c.score.toFixed(2)}</span>
          </div>
        ))}
        {rag.chunks.length === 0 && <div className="chunk-source">No documents retrieved for this query.</div>}
      </div>
    </div>
  );
}
