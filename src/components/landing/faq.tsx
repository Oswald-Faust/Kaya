import { Plus } from "lucide-react";

export function Faq({ questions }: { questions: { q: string; a: string }[] }) {
  return (
    <div className="divide-y divide-line border-y border-line">
      {questions.map(({ q, a }) => (
        <details key={q} className="group">
          <summary className="flex cursor-pointer list-none items-center gap-6 py-5 text-left [&::-webkit-details-marker]:hidden">
            <span className="flex-1 text-lg font-medium text-ink">{q}</span>
            <span className="grid size-8 shrink-0 place-items-center rounded-full border border-line-strong text-muted transition-transform duration-300 group-open:rotate-45 group-open:bg-ink group-open:text-white">
              <Plus className="size-4" />
            </span>
          </summary>
          <p className="max-w-2xl pr-14 pb-6 text-base leading-relaxed text-muted">{a}</p>
        </details>
      ))}
    </div>
  );
}
