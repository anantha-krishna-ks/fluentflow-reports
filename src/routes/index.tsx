import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowUpRight,
  Search,
  Users,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,

} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
  studentsForWord,
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
  const [sort, setSort] = useState<{
    key: "overall" | "fluency" | "pronunciation" | "name" | "attempts";
    dir: "asc" | "desc";
  }>({ key: "overall", dir: "desc" });
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  function handleSort(key: typeof sort.key) {
    setSort((prev) => ({
      key,
      dir: prev.key === key && prev.dir === "desc" ? "asc" : "desc",
    }));
  }

  const { section, chapter, from, to, band, q } = search;

  const summary = useMemo(() => classSummary(section, from, to, chapter), [section, from, to, chapter]);
  const words = useMemo(() => mispronouncedWords(section, from, to, chapter), [section, from, to, chapter]);
  const trend = useMemo(() => buildTrend(section, from, to, chapter), [section, from, to, chapter]);
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
    return [...list].sort((a, b) => {
      const dir = sort.dir === "asc" ? 1 : -1;
      if (sort.key === "name") {
        return dir * a.student.name.localeCompare(b.student.name);
      }
      return dir * (a[sort.key] - b[sort.key]);
    });
  }, [summary.rows, band, q, sort.key, sort.dir]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = useMemo(
    () => rows.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [rows, currentPage, pageSize],
  );

  useEffect(() => {
    setPage(1);
  }, [band, q, sort.key, sort.dir, section, chapter, from, to, pageSize]);

  const update = (next: Partial<ReportSearch>) =>
    navigate({
      search: (prev: ReportSearch) => ({ ...prev, ...next }),
      resetScroll: false,
    });

  const sectionLabel = sections.find((s) => s.id === section)?.label ?? section;
  const chapterLabel = chapter === "all" ? "All chapters" : chapter;
  const maxWord = words[0]?.instances ?? 1;

  return (
    <main className="w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-10 xl:px-12">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-widest text-primary uppercase">
            Language training · Reading assessment
          </p>
          <h1 className="mt-1 text-xl font-medium tracking-tight sm:text-2xl">
            Class performance report
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {sectionLabel} · {chapterLabel} · {formatDate(from)} – {formatDate(to)}
          </p>
        </div>
        <Button
          size="sm"
          className="self-start sm:self-auto gap-1.5 rounded-full bg-primary pl-3.5 pr-4 text-primary-foreground shadow-sm transition-all hover:shadow-md hover:brightness-105 active:scale-[0.98] print:hidden"
          onClick={() => window.print()}
        >
          <Download className="size-4" />
          <span className="text-sm font-medium">Export PDF</span>
        </Button>
      </header>


      <ReportFilters
        section={section}
        chapter={chapter}
        from={from}
        to={to}
        onChange={(next) => update(next)}
      />

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 lg:col-span-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="size-3.5 shrink-0" />
            <span>Students Submission</span>
          </div>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="text-4xl font-semibold tracking-tight tabular-nums">
              {summary.submitted}
              <span className="text-xl text-muted-foreground"> / {summary.total}</span>
            </p>
            <span className="text-sm font-medium text-primary">
              ({summary.submissionRate}% submission rate)
            </span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${summary.submissionRate}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-3 lg:col-span-2">
          <FactCell
            label="Chapters"
            value={
              <span className="text-2xl font-semibold tabular-nums">
                {summary.activeChapters}
                <span className="text-xl text-muted-foreground"> / {summary.totalChapters}</span>
              </span>
            }
          />
          <FactCell label="Exercises / Assessments" value={summary.totalExercises} />
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
          <p className="text-sm text-muted-foreground">Click a word to see students</p>
          <ul className="mt-4 space-y-2.5">
            {words.slice(0, 8).map((w) => (
              <li key={w.word}>
                <Sheet
                  open={selectedWord === w.word}
                  onOpenChange={(open) => setSelectedWord(open ? w.word : null)}
                >
                  <SheetTrigger asChild>
                    <button
                      type="button"
                      className="w-full cursor-pointer text-left hover:opacity-80"
                      aria-label={`Open students for ${w.word}`}
                    >
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
                    </button>
                  </SheetTrigger>
                  <WordStudentsSheet word={w.word} section={section} chapter={chapter} from={from} to={to} />
                </Sheet>
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
            <TabsList className="w-full justify-start overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:w-auto">
              {tabs.map((t) => (
                <TabsTrigger key={t.key} value={t.key} className="whitespace-nowrap">
                  {t.label}
                  <span className="ml-1.5 rounded-full bg-current/15 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-[inherit]/80">
                    {counts[t.key]}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Desktop table */}
        <div className="hidden px-4 pb-5 sm:px-5 md:block">
          <div className="overflow-hidden rounded-xl border">
            <div>
              <Table className="table-fixed">
                <colgroup>
                  <col style={{ width: "20%" }} />
                  <col style={{ width: "11%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "6%" }} />
                  <col style={{ width: "11%" }} />
                  <col style={{ width: "7%" }} />
                </colgroup>
                <TableHeader className="bg-secondary/80">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="py-3 text-xs font-semibold tracking-wide text-foreground uppercase">
                      <SortBtn
                        active={sort.key === "name"}
                        dir={sort.dir}
                        onClick={() => handleSort("name")}
                      >
                        Student
                      </SortBtn>
                    </TableHead>
                    <TableHead className="py-3 text-center [&_button]:justify-center text-xs font-semibold tracking-wide text-foreground uppercase">
                      <SortBtn
                        active={sort.key === "attempts"}
                        dir={sort.dir}
                        onClick={() => handleSort("attempts")}
                      >
                        Attempts
                      </SortBtn>
                    </TableHead>
                    <TableHead className="py-3 text-xs font-semibold tracking-wide text-foreground uppercase">
                      <SortBtn
                        active={sort.key === "fluency"}
                        dir={sort.dir}
                        onClick={() => handleSort("fluency")}
                      >
                        Fluency
                      </SortBtn>
                    </TableHead>
                    <TableHead className="py-3 text-xs font-semibold tracking-wide text-foreground uppercase">
                      <SortBtn
                        active={sort.key === "pronunciation"}
                        dir={sort.dir}
                        onClick={() => handleSort("pronunciation")}
                      >
                        Pronun.
                      </SortBtn>
                    </TableHead>
                    <TableHead className="py-3 text-center [&_button]:justify-center text-xs font-semibold tracking-wide text-foreground uppercase">
                      <SortBtn
                        active={sort.key === "overall"}
                        dir={sort.dir}
                        onClick={() => handleSort("overall")}
                      >
                        Overall
                      </SortBtn>
                    </TableHead>
                    <TableHead className="py-3 text-xs font-semibold tracking-wide text-foreground uppercase">
                      Band
                    </TableHead>
                    <TableHead className="text-center py-3 text-xs font-semibold tracking-wide text-foreground uppercase">
                      Words
                    </TableHead>
                    <TableHead className="py-3 text-xs font-semibold tracking-wide text-foreground uppercase">
                      Last submission
                    </TableHead>
                    <TableHead className="py-3" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRows.map((r) => (
                    <TableRow
                      key={r.student.id}
                      className="border-border/70 transition-colors hover:bg-accent/40"
                    >
                      <TableCell className="py-3">
                        <div className="flex items-center gap-3">
                          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                            {initials(r.student.name)}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-medium">{r.student.name}</span>
                            <span className="block text-xs text-muted-foreground tabular-nums">
                              Roll #{r.student.rollNo}
                            </span>
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-center tabular-nums">
                        {r.attempts ? (
                          r.attempts
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="py-3">
                        <ScoreCell value={r.attempts ? r.fluency : null} tone="bg-primary" />
                      </TableCell>
                      <TableCell className="py-3">
                        <ScoreCell value={r.attempts ? r.pronunciation : null} tone="bg-chart-2" />
                      </TableCell>
                      <TableCell className="py-3 text-center">
                        {r.attempts ? (
                          <span className="inline-flex min-w-14 justify-center rounded-full bg-secondary px-2.5 py-1 text-sm font-semibold tabular-nums">
                            {r.overall}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="py-3">
                        {r.attempts ? (
                          <BandBadge band={r.overallBand} />
                        ) : (
                          <span className="text-xs text-muted-foreground">Not submitted</span>
                        )}
                      </TableCell>
                      <TableCell className="py-3 text-center tabular-nums">
                        {r.wordsToImprove}
                      </TableCell>
                      <TableCell className="py-3 text-sm whitespace-nowrap text-muted-foreground">
                        {formatDate(r.lastSubmission)}
                      </TableCell>
                      <TableCell className="py-3 pr-3 text-right">
                        <Button asChild size="sm" variant="ghost" className="px-2">
                          <Link
                            to="/students/$studentId"
                            params={{ studentId: r.student.id }}
                            search={{ section, chapter, from, to }}
                          >
                            View <ArrowUpRight className="size-3.5 shrink-0" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {rows.length === 0 && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={9} className="py-10 text-center text-sm text-muted-foreground">
                        No students match your filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          <TablePager
            page={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            total={rows.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>


        {/* Mobile cards */}
        <div className="space-y-3 p-4 md:hidden">
          {pageRows.map((r) => (
            <Link
              key={r.student.id}
              to="/students/$studentId"
              params={{ studentId: r.student.id }}
              search={{ section, chapter, from, to }}
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
          {rows.length > 0 && (
            <TablePager
              page={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              total={rows.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          )}
        </div>
      </section>
    </main>
  );
}

function TablePager({
  page,
  totalPages,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  totalPages: number;
  pageSize: number;
  total: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (n: number) => void;
}) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="mt-4 flex flex-col items-center gap-3 border-t pt-4 sm:flex-row sm:justify-between">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Rows per page</span>
        <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
          <SelectTrigger className="h-9 w-[4.5rem]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[10, 25, 50, 100].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <p className="text-sm text-muted-foreground tabular-nums">
        {start}–{end} of {total}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="size-4" /> Prev
        </Button>
        <span className="px-2 text-sm font-medium tabular-nums">
          {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function WordStudentsSheet({
  word,
  section,
  chapter,
  from,
  to,
}: {
  word: string;
  section: string;
  chapter: string;
  from: string;
  to: string;
}) {
  const students = useMemo(() => studentsForWord(section, from, to, chapter, word), [section, from, to, chapter, word]);

  return (
    <SheetContent className="w-full sm:max-w-md">
      <SheetHeader>
        <SheetTitle className="capitalize">{word}</SheetTitle>
        <SheetDescription>
          {students.length} student{students.length === 1 ? "" : "s"} mispronounced this word
        </SheetDescription>
      </SheetHeader>
      <div className="mt-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
        {students.length === 0 ? (
          <p className="text-sm text-muted-foreground">No student data for this word.</p>
        ) : (
          <ul className="space-y-3">
            {students.map((s) => (
              <li key={s.student.id} className="flex flex-col justify-between rounded-lg border bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{s.student.name}</p>
                    <p className="text-xs text-muted-foreground">#{s.student.rollNo}</p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground tabular-nums">
                    <p>{s.instances} instance{s.instances === 1 ? "" : "s"}</p>
                    <p>{s.avgAccuracy}% avg accuracy</p>
                  </div>
                </div>
                <p className="mt-3 text-sm italic text-muted-foreground">
                  “{s.latestSentence}”
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </SheetContent>
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
  dir,
  onClick,
  children,
}: {
  active: boolean;
  dir?: "asc" | "desc";
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-1 leading-tight break-words hover:text-foreground ${active ? "text-foreground font-semibold" : "text-muted-foreground"}`}
    >
      <span className="min-w-0 whitespace-nowrap">{children}</span>
      {active ? (
        dir === "asc" ? (
          <ArrowUp className="size-3.5 shrink-0" />
        ) : (
          <ArrowDown className="size-3.5 shrink-0" />
        )
      ) : (
        <ArrowUpDown className="size-3.5 shrink-0 text-muted-foreground/50" />
      )}
    </button>
  );
}

function FactCell({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col justify-center bg-card p-5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function ScoreCell({ value, tone }: { value: number | null; tone: string }) {
  if (value === null) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-1.5 w-full max-w-24 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${value}%` }} />
      </div>
      <span className="w-9 shrink-0 text-sm font-medium tabular-nums">{value}%</span>
    </div>
  );
}
