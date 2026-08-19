import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";

import { BandBadge } from "@/components/report/band-badge";
import { TERM_END, TERM_START, sections } from "@/data/assessments";
import { bandOf, formatDate, studentDetail } from "@/lib/report";

const searchSchema = z.object({
  section: fallback(z.string(), "grade-6-a").default("grade-6-a"),
  from: fallback(z.string(), TERM_START).default(TERM_START),
  to: fallback(z.string(), TERM_END).default(TERM_END),
});

export const Route = createFileRoute("/students/$studentId")({
  validateSearch: zodValidator(searchSchema),
  component: StudentReport,
  head: () => ({
    meta: [
      { title: "Student Reading Report | Fluency & Pronunciation" },
      {
        name: "description",
        content:
          "Individual student reading assessment report with fluency, pronunciation scores, attempt history and words needing improvement.",
      },
      { property: "og:title", content: "Student Reading Report" },
      {
        property: "og:description",
        content:
          "Per-student fluency and pronunciation results with words that need improvement.",
      },
    ],
  }),
});

function StudentReport() {
  const { studentId } = Route.useParams();
  const { section, from, to } = Route.useSearch();
  const detail = studentDetail(studentId, from, to);

  if (!detail) throw notFound();

  const sectionLabel = sections.find((s) => s.id === detail.student.section)?.label ?? "";

  return (
    <main className="w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-10 xl:px-12">
      <Link
        to="/"
        search={{ section, from, to, band: "all", q: "" }}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to class report
      </Link>

      <header className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {detail.student.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Roll #{detail.student.rollNo} · {sectionLabel} · {formatDate(from)} – {formatDate(to)}
          </p>
        </div>
        {detail.attempts.length > 0 && <BandBadge band={bandOf(detail.overall)} />}
      </header>

      {detail.attempts.length === 0 ? (
        <p className="mt-8 rounded-xl border bg-card p-6 text-sm text-muted-foreground">
          This student has not submitted any assessment in the selected date range.
        </p>
      ) : (
        <>
          <section className="mt-6 grid gap-4 sm:grid-cols-3">
            <ScoreCard label="Fluency" value={detail.fluency} />
            <ScoreCard label="Pronunciation" value={detail.pronunciation} />
            <ScoreCard label="Overall" value={detail.overall} />
          </section>

          <section className="mt-4 rounded-xl border bg-card p-4 sm:p-5">
            <h2 className="font-semibold">Words needing improvement</h2>
            <p className="text-sm text-muted-foreground">
              Mispronounced words with occurrence count
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {detail.words.map((w) => (
                <div key={w.word} className="rounded-lg border p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-medium">{w.word}</span>
                    <span className="rounded-full bg-danger-soft px-2 py-0.5 text-xs font-medium text-danger">
                      ×{w.count}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Avg accuracy {w.avgAccuracy}%
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground italic">“{w.sentence}”</p>
                </div>
              ))}
              {detail.words.length === 0 && (
                <p className="text-sm text-muted-foreground">No problem words. Great work!</p>
              )}
            </div>
          </section>

          <section className="mt-4 rounded-xl border bg-card p-4 sm:p-5">
            <h2 className="font-semibold">Attempt history</h2>
            <ul className="mt-4 space-y-3">
              {detail.attempts.map((a) => (
                <li key={a.id} className="rounded-lg border p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <p className="text-sm">“{a.sentence}”</p>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDate(a.date)}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <Pill label="Fluency" value={a.fluency} />
                    <Pill label="Pronunciation" value={a.pronunciation} />
                    {a.words.map((w) => (
                      <span
                        key={w.word}
                        className="rounded-full bg-danger-soft px-2 py-1 text-danger"
                      >
                        {w.word} · {w.accuracy}%
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </main>
  );
}

function Pill({ label, value }: { label: string; value: number }) {
  return (
    <span className="rounded-full bg-muted px-2 py-1 text-muted-foreground">
      {label} <span className="font-semibold text-foreground tabular-nums">{value}%</span>
    </span>
  );
}

function ScoreCard({ label, value }: { label: string; value: number }) {
  const band = bandOf(value);
  const color =
    band === "excellent"
      ? "var(--success)"
      : band === "above-average"
        ? "var(--warning)"
        : "var(--danger)";

  return (
    <div className="flex items-center gap-4 rounded-xl border bg-card p-4 sm:p-5">
      <div
        className="grid size-20 shrink-0 place-items-center rounded-full"
        style={{
          background: `conic-gradient(${color} ${value * 3.6}deg, var(--muted) 0deg)`,
        }}
      >
        <div className="grid size-15 place-items-center rounded-full bg-card text-lg font-semibold tabular-nums">
          {value}%
        </div>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="mt-1">
          <BandBadge band={band} />
        </div>
      </div>
    </div>
  );
}
