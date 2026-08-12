import { cn } from "@/lib/utils";
import { bandLabels } from "@/lib/report";
import type { Band } from "@/data/assessments";

const styles: Record<Band, string> = {
  excellent: "bg-success-soft text-success ring-success/30",
  "above-average": "bg-warning-soft text-warning-foreground ring-warning/40",
  "needs-improvement": "bg-danger-soft text-danger ring-danger/30",
};

export function BandBadge({ band, className }: { band: Band; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap",
        styles[band],
        className,
      )}
    >
      {bandLabels[band]}
    </span>
  );
}

export const bandBarColor: Record<Band, string> = {
  excellent: "bg-success",
  "above-average": "bg-warning",
  "needs-improvement": "bg-danger",
};

export const bandTextColor: Record<Band, string> = {
  excellent: "text-success",
  "above-average": "text-warning-foreground",
  "needs-improvement": "text-danger",
};
