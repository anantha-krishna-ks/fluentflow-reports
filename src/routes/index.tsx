import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowUpRight, GraduationCap, Search, Users } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BandBadge } from "@/components/report/band-badge";
import { BandBreakdown } from "@/components/report/band-breakdown";
import { ReportFilters } from "@/components/report/report-filters";
import { reportSearchSchema, type ReportSearch } from "@/lib/report-search";
import {
  buildTrend,
  classSummary,
  countBands,
  formatDate,
  mispronouncedWords,
} from "@/lib/report";
import { sections } from "@/data/assessments";

export const Route = createFileRoute("/")({
  validateSearch: zodValidator(reportSearchSchema),
  component: ClassReport,
  head: () => ({
    meta: [
      { title: "Class Reading Assessment Report | Fluency & Pronunciation" },
      {
        name: "description",
        content:
          "Teacher report for language reading assessments: class fluency and pronunciation bands, mispronounced words and per-student scores.",
      },
      { property: "og:title", content: "Class Reading Assessment Report" },
      {
        property: "og:description",
        content:
          "Track class fluency and pronunciation performance, commonly mispronounced words and student-level results.",
      },
    ],
  }),
});

const tabs = [
  { key: "all", label: "All students" },
  { key: "excellent", label: "Excellent" },
  { key: "above-average", label: "Above average" },
  { key: "needs-improvement", label: "Needs improvement" },
] as const;

function ClassReport() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/" });
  const [sort, setSort] = useState<"overall" | "fluency" | "pronunciation" | "name">("overall");

  const { section, from, to, band, q } = search;

  const summary = useMemo(() => classSummary(section, from, to), [section, from, to]);
  const words = useMemo(() => mispronouncedWords(section, from, to), [section, from, to]);
  const trend = useMemo(() => buildTrend(section, from, to), [section, from, to]);
  const fluencyCounts = useMemo(() => countBands(summary.rows, "fluency"), [summary.rows]);
  const pronCounts = useMemo(() => countBands(summary.rows, "pronunciation"), [summary.rows]);

  const counts = {
    all: summary.rows.length,
    excellent: summary.rows.filter((r) => r.attempts > 0 && r.overallBand === "excellent").length,
    "above-average": summary.rows.filter(
      (r) => r.attempts > 0 && r.overallBand === "above-average",
    ).length,
    "needs-improvement": summary.rows.filter(
      (r) => r.attempts === 0 || r.overallBand === "needs-improvement",
    ).length,
  };

  const rows = useMemo(() => {
    let list = summary.rows;
    if (band !== "all") {
      list =
        band === "needs-improvement"
          ? list.filter((r) => r.attempts === 0 || r.overallBand === "needs-improvement")
          : list.filter((r) => r.attempts > 0 && r.overallBand === band);
    }
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.student.name.toLowerCase().includes(needle) ||
          r.student.rollNo.includes(needle),
      );
    }
    return [...list].sort((a, b) =>
      sort === "name" ? a.student.name.localeCompare(b.student.name) : b[sort] - a[sort],
    );
  }, [summary.rows, band, q, sort]);

  const update = (next: Partial<ReportSearch>) =>
    navigate({ search: (prev: ReportSearch) => ({ ...prev, ...next }) });

  const sectionLabel = sections.find((s) => s.id === section)?.label ?? section;
  const maxWord = words[0]?.instances ?? 1;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <header className="mb-6">
        <p className="text-xs font-semibold tracking-widest text-primary uppercase">
          Language training · Reading assessment
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          Class performance report
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {sectionLabel} · {formatDate(from)} – {formatDate(to)}
        </p>
      </header>

      <ReportFilters
        section={section}
        from={from}
        to={to}
        onChange={(next) => update(next)}
      />

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 lg:col-span-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="size-3.5 shrink-0" />
            <span>Submitted attendance</span>
          </div>
          <p className="mt-2 text-4xl font-semibold tracking-tight tabular-nums">
            {summary.submitted}
            <span className="text-xl text-muted-foreground"> / {summary.total}</span>
          </p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${summary.submissionRate}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {summary.submissionRate}% submission rate
          </p>
        </div>

        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-4 lg:col-span-2">
          <FactCell label="Students" value={summary.total} />
          <FactCell label="Chapters" value={summary.totalChapters} />
          <FactCell label="Exercises" value={summary.totalExercises} />
          <FactCell
            label="Attempts"
            value={summary.attempts}
            hint={`avg ${Math.round(summary.attempts / (summary.total || 1))} / student`}
          />
        </div>
      </section>




      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <BandBreakdown title="Fluency" average={summary.avgFluency} counts={fluencyCounts} />
        <BandBreakdown
          title="Pronunciation"
          average={summary.avgPronunciation}
          counts={pronCounts}
        />
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-5">
        <div className="rounded-xl border bg-card p-4 sm:p-5 lg:col-span-3">
          <h2 className="font-semibold">Class trend</h2>
          <p className="text-sm text-muted-foreground">
            Average scores across the selected period
          </p>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ left: -20, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis domain={[0, 100]} stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    color: "var(--popover-foreground)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="fluency"
                  name="Fluency"
                  stroke="var(--primary)"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="pronunciation"
                  name="Pronunciation"
                  stroke="var(--warning)"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-primary" /> Fluency
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-warning" /> Pronunciation
            </span>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 sm:p-5 lg:col-span-2">
          <h2 className="font-semibold">Commonly mispronounced words</h2>
          <p className="text-sm text-muted-foreground">Instances across the class</p>
          <ul className="mt-4 space-y-2.5">
            {words.slice(0, 8).map((w) => (
              <li key={w.word}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-medium">{w.word}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {w.instances} instances · {w.students} students
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-danger"
                    style={{ width: `${(w.instances / maxWord) * 100}%` }}
                  />
                </div>
              </li>
            ))}
            {words.length === 0 && (
              <li className="text-sm text-muted-foreground">No word-level issues in this range.</li>
            )}
          </ul>
        </div>
      </section>

      <section className="mt-4 rounded-xl border bg-card">
        <div className="flex flex-col gap-3 border-b p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold">Students</h2>
            <p className="text-sm text-muted-foreground">
              {rows.length} of {summary.total} shown
            </p>
          </div>
          <div className="relative w-full lg:max-w-xs">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => update({ q: e.target.value })}
              placeholder="Search name or roll no."
              className="pl-9"
            />
          </div>
        </div>

        <div className="overflow-x-auto p-4 sm:p-5 pb-0">
          <Tabs value={band} onValueChange={(v) => update({ band: v })}>
            <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
              {tabs.map((t) => (
                <TabsTrigger key={t.key} value={t.key} className="whitespace-nowrap">
                  {t.label}
                  <span className="ml-1.5 text-xs text-muted-foreground tabular-nums">
                    {counts[t.key]}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block p-4 sm:p-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortBtn active={sort === "name"} onClick={() => setSort("name")}>
                    Student
                  </SortBtn>
                </TableHead>
                <TableHead className="text-right">Attempts</TableHead>
                <TableHead className="text-right">
                  <SortBtn active={sort === "fluency"} onClick={() => setSort("fluency")}>
                    Fluency
                  </SortBtn>
                </TableHead>
                <TableHead className="text-right">
                  <SortBtn
                    active={sort === "pronunciation"}
                    onClick={() => setSort("pronunciation")}
                  >
                    Pronunciation
                  </SortBtn>
                </TableHead>
                <TableHead className="text-right">
                  <SortBtn active={sort === "overall"} onClick={() => setSort("overall")}>
                    Overall
                  </SortBtn>
                </TableHead>
                <TableHead>Band</TableHead>
                <TableHead>Words to improve</TableHead>
                <TableHead>Last submission</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.student.id}>
                  <TableCell className="font-medium">
                    {r.student.name}
                    <span className="ml-2 text-xs text-muted-foreground">#{r.student.rollNo}</span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{r.attempts}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.attempts ? `${r.fluency}%` : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.attempts ? `${r.pronunciation}%` : "—"}
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {r.attempts ? `${r.overall}%` : "—"}
                  </TableCell>
                  <TableCell>
                    {r.attempts ? (
                      <BandBadge band={r.overallBand} />
                    ) : (
                      <span className="text-xs text-muted-foreground">Not submitted</span>
                    )}
                  </TableCell>
                  <TableCell className="tabular-nums">{r.wordsToImprove}</TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDate(r.lastSubmission)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="ghost">
                      <Link
                        to="/students/$studentId"
                        params={{ studentId: r.student.id }}
                        search={{ section, from, to }}
                      >
                        View <ArrowUpRight className="size-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile cards */}
        <div className="space-y-3 p-4 md:hidden">
          {rows.map((r) => (
            <Link
              key={r.student.id}
              to="/students/$studentId"
              params={{ studentId: r.student.id }}
              search={{ section, from, to }}
              className="block rounded-lg border p-3 transition-colors hover:bg-accent"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{r.student.name}</p>
                  <p className="text-xs text-muted-foreground">
                    #{r.student.rollNo} · {r.attempts} attempts
                  </p>
                </div>
                {r.attempts ? (
                  <BandBadge band={r.overallBand} />
                ) : (
                  <span className="text-xs text-muted-foreground">Not submitted</span>
                )}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                <Mini label="Fluency" value={r.attempts ? `${r.fluency}%` : "—"} />
                <Mini label="Pronun." value={r.attempts ? `${r.pronunciation}%` : "—"} />
                <Mini label="Words" value={String(r.wordsToImprove)} />
              </div>
            </Link>
          ))}
          {rows.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">No students match.</p>
          )}
        </div>
      </section>
    </main>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/60 px-2 py-1.5">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function SortBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 ${active ? "text-foreground font-semibold" : ""}`}
    >
      {children}
    </button>
  );
}

function MetricCell({
  label,
  value,
  hint,
  accent,
  icon,
  progress,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  accent?: boolean;
  icon?: React.ReactNode;
  progress?: number;
}) {
  return (
    <div className="flex flex-col gap-1 p-4 sm:p-5">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon ?? <GraduationCap className="size-3.5 shrink-0" />}
        <span className="truncate">{label}</span>
      </div>
      <p
        className={`text-2xl font-semibold tabular-nums sm:text-3xl ${accent ? "text-primary" : ""}`}
      >
        {value}
      </p>
      {typeof progress === "number" && (
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-muted/40 p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="truncate text-xs text-muted-foreground">{label}</span>
        <span className="text-lg font-semibold tabular-nums">{value}%</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}

