import type { ReactNode } from "react";

type Section = { title: string; content: ReactNode; defaultOpen?: boolean };

/** Native <details> disclosure list with hairline dividers. */
export function ProductAccordion({ sections }: { sections: Section[] }) {
  return (
    <div className="hairline-t">
      {sections.map((s) => (
        <details key={s.title} open={s.defaultOpen} className="group hairline-b">
          <summary className="eyebrow flex cursor-pointer list-none items-center justify-between py-4 [&::-webkit-details-marker]:hidden">
            {s.title}
            <span aria-hidden className="relative size-3">
              <span className="absolute top-1/2 left-0 h-px w-3 bg-current" />
              <span className="absolute top-0 left-1/2 h-3 w-px bg-current transition-transform duration-[var(--duration-base)] group-open:scale-y-0" />
            </span>
          </summary>
          <div className="pb-5 text-muted">{s.content}</div>
        </details>
      ))}
    </div>
  );
}
