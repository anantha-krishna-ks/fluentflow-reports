import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { TERM_END, TERM_START, chapterOptions, sections } from "@/data/assessments";

interface Props {
  section: string;
  chapter: string;
  from: string;
  to: string;
  onChange: (next: { section?: string; chapter?: string; from?: string; to?: string }) => void;
}

const presets = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
];

function shift(days: number) {
  const end = new Date(TERM_END);
  const start = new Date(TERM_END);
  start.setDate(start.getDate() - days);
  return { from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) };
}

export function ReportFilters({ section, chapter, from, to, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 sm:p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-1 rounded-lg border bg-muted/30 p-1">
          <Select value={section} onValueChange={(v) => onChange({ section: v })}>
            <SelectTrigger className="w-full min-w-[10rem] border-0 bg-transparent shadow-none hover:bg-muted/50 sm:w-[11rem]">
              <SelectValue placeholder="Section" />
            </SelectTrigger>
            <SelectContent>
              {sections.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="hidden h-8 w-px bg-border sm:block" />

          <Select value={chapter} onValueChange={(v) => onChange({ chapter: v })}>
            <SelectTrigger
              className={cn(
                "w-full min-w-[10rem] border-0 bg-transparent shadow-none hover:bg-muted/50 sm:w-[11rem]",
                chapter !== "all" && "text-foreground",
              )}
            >
              <BookOpen className="mr-1.5 size-4 shrink-0 text-muted-foreground" />
              <SelectValue placeholder="Chapter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All chapters</SelectItem>
              {chapterOptions.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <DateButton
            value={from}
            label="From"
            onSelect={(d) => onChange({ from: d })}
          />
          <span className="text-sm text-muted-foreground">to</span>
          <DateButton value={to} label="To" onSelect={(d) => onChange({ to: d })} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <Button
            key={p.label}
            size="sm"
            variant="outline"
            onClick={() => onChange(shift(p.days))}
          >
            {p.label}
          </Button>
        ))}
        <Button
          size="sm"
          variant="outline"
          onClick={() => onChange({ from: TERM_START, to: TERM_END })}
        >
          This term
        </Button>
      </div>
    </div>
  );
}

function DateButton({
  value,
  label,
  onSelect,
}: {
  value: string;
  label: string;
  onSelect: (d: string) => void;
}) {
  const date = value ? new Date(value) : undefined;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("min-w-[9.5rem] justify-start text-left font-normal")}
        >
          <CalendarIcon className="mr-1 size-4 text-muted-foreground" />
          <span className="sr-only">{label}</span>
          {date ? format(date, "d MMM yyyy") : label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => d && onSelect(d.toISOString().slice(0, 10))}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}
