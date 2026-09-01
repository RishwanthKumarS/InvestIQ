import type { ReactNode } from "react";

interface Props {
  title: string;
  meta?: string;
  span?: 2;
  children: ReactNode;
}

export function Widget({ title, meta, span, children }: Props) {
  return (
    <section className={`widget ${span === 2 ? "widget-span-2" : ""}`}>
      <div className="widget-head">
        <h3 className="widget-title">{title}</h3>
        {meta && <span className="widget-meta">{meta}</span>}
      </div>
      <div className="widget-body">{children}</div>
    </section>
  );
}
