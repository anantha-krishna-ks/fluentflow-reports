import { bandBarColor } from "./band-badge";
import type { BandCounts } from "@/lib/report";
import type { Band } from "@/data/assessments";

const order: Band[] = ["excellent", "above-average", "needs-improvement"];
const labels: Record<Band, string> = {
  excellent: "Excellent (>75%)",
  "above-average": "Above average (50–75%)",
  "needs-improvement": "Needs improvement (<50%)",
};

export function BandBreakdown({
  title,
  average,
  counts,
}: {
  title: string;
  average: number;
  counts: BandCounts;
}) {
  const total = order.reduce((sum, b) => sum + counts[b], 0) || 1;

  return (
    <div className="flex h-full flex-col rounded-xl border bg-card p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-semibold text-card-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">
          Class avg <span className="font-semibold text-foreground">{average}%</span>
        </p>
      </div>

      <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-muted">
        {order.map((b) => (
          <div
            key={b}
            className={bandBarColor[b]}
            style={{ width: `${(counts[b] / total) * 100}%` }}
          />
        ))}
      </div>

      <dl className="mt-3 grid flex-1 grid-cols-1 content-start gap-2 sm:grid-cols-3">
        {order.map((b) => (
          <div key={b} className="rounded-lg bg-muted/50 px-3 py-2">
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={`size-2 shrink-0 rounded-full ${bandBarColor[b]}`} />
              <span className="truncate">{labels[b]}</span>
            </dt>
            <dd className="mt-0.5 text-xl font-semibold tabular-nums">{counts[b]}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
