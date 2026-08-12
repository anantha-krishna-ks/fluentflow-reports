import {
  attempts as allAttempts,
  students as allStudents,
  type Attempt,
  type Band,
  type Student,
} from "@/data/assessments";

export const bandLabels: Record<Band, string> = {
  excellent: "Excellent",
  "above-average": "Above average",
  "needs-improvement": "Needs improvement",
};

export function bandOf(score: number): Band {
  if (score > 75) return "excellent";
  if (score >= 50) return "above-average";
  return "needs-improvement";
}

export interface StudentRow {
  student: Student;
  attempts: number;
  fluency: number;
  pronunciation: number;
  overall: number;
  fluencyBand: Band;
  pronunciationBand: Band;
  overallBand: Band;
  lastSubmission: string;
  wordsToImprove: number;
}

function avg(nums: number[]) {
  if (!nums.length) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

export function filterAttempts(section: string, from: string, to: string): Attempt[] {
  const ids = new Set(allStudents.filter((s) => s.section === section).map((s) => s.id));
  return allAttempts.filter((a) => ids.has(a.studentId) && a.date >= from && a.date <= to);
}

export function buildStudentRows(section: string, from: string, to: string): StudentRow[] {
  const scoped = filterAttempts(section, from, to);
  const byStudent = new Map<string, Attempt[]>();
  for (const a of scoped) {
    const list = byStudent.get(a.studentId) ?? [];
    list.push(a);
    byStudent.set(a.studentId, list);
  }

  return allStudents
    .filter((s) => s.section === section)
    .map((student) => {
      const list = byStudent.get(student.id) ?? [];
      const fluency = avg(list.map((a) => a.fluency));
      const pronunciation = avg(list.map((a) => a.pronunciation));
      const overall = list.length ? Math.round((fluency + pronunciation) / 2) : 0;
      const words = new Set(list.flatMap((a) => a.words.map((w) => w.word)));
      return {
        student,
        attempts: list.length,
        fluency,
        pronunciation,
        overall,
        fluencyBand: bandOf(fluency),
        pronunciationBand: bandOf(pronunciation),
        overallBand: bandOf(overall),
        lastSubmission: list.length
          ? list.map((a) => a.date).sort().slice(-1)[0]
          : "",
        wordsToImprove: words.size,
      };
    })
    .sort((a, b) => b.overall - a.overall);
}

export interface BandCounts {
  excellent: number;
  "above-average": number;
  "needs-improvement": number;
}

export function countBands(rows: StudentRow[], metric: "fluency" | "pronunciation"): BandCounts {
  const counts: BandCounts = { excellent: 0, "above-average": 0, "needs-improvement": 0 };
  for (const r of rows.filter((r) => r.attempts > 0)) {
    counts[metric === "fluency" ? r.fluencyBand : r.pronunciationBand]++;
  }
  return counts;
}

export interface WordStat {
  word: string;
  instances: number;
  students: number;
  avgAccuracy: number;
}

export function mispronouncedWords(section: string, from: string, to: string): WordStat[] {
  const scoped = filterAttempts(section, from, to);
  const map = new Map<string, { instances: number; students: Set<string>; acc: number[] }>();
  for (const a of scoped) {
    for (const w of a.words) {
      const entry = map.get(w.word) ?? { instances: 0, students: new Set<string>(), acc: [] };
      entry.instances++;
      entry.students.add(a.studentId);
      entry.acc.push(w.accuracy);
      map.set(w.word, entry);
    }
  }
  return [...map.entries()]
    .map(([word, e]) => ({
      word,
      instances: e.instances,
      students: e.students.size,
      avgAccuracy: avg(e.acc),
    }))
    .sort((a, b) => b.instances - a.instances);
}

export interface TrendPoint {
  label: string;
  fluency: number;
  pronunciation: number;
}

export function buildTrend(section: string, from: string, to: string): TrendPoint[] {
  const scoped = filterAttempts(section, from, to);
  const buckets = new Map<string, { f: number[]; p: number[] }>();
  for (const a of scoped) {
    const key = a.date.slice(0, 7);
    const b = buckets.get(key) ?? { f: [], p: [] };
    b.f.push(a.fluency);
    b.p.push(a.pronunciation);
    buckets.set(key, b);
  }
  return [...buckets.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([key, b]) => ({
      label: new Date(`${key}-01`).toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      fluency: avg(b.f),
      pronunciation: avg(b.p),
    }));
}

export function classSummary(section: string, from: string, to: string) {
  const rows = buildStudentRows(section, from, to);
  const submitted = rows.filter((r) => r.attempts > 0);
  return {
    rows,
    total: rows.length,
    submitted: submitted.length,
    submissionRate: rows.length ? Math.round((submitted.length / rows.length) * 100) : 0,
    avgFluency: avg(submitted.map((r) => r.fluency)),
    avgPronunciation: avg(submitted.map((r) => r.pronunciation)),
    attempts: filterAttempts(section, from, to).length,
  };
}

export function studentDetail(studentId: string, from: string, to: string) {
  const student = allStudents.find((s) => s.id === studentId);
  if (!student) return null;
  const list = allAttempts
    .filter((a) => a.studentId === studentId && a.date >= from && a.date <= to)
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const wordMap = new Map<string, { count: number; acc: number[]; sentence: string }>();
  for (const a of list) {
    for (const w of a.words) {
      const e = wordMap.get(w.word) ?? { count: 0, acc: [], sentence: a.sentence };
      e.count++;
      e.acc.push(w.accuracy);
      wordMap.set(w.word, e);
    }
  }

  const fluency = avg(list.map((a) => a.fluency));
  const pronunciation = avg(list.map((a) => a.pronunciation));

  return {
    student,
    attempts: list,
    fluency,
    pronunciation,
    overall: list.length ? Math.round((fluency + pronunciation) / 2) : 0,
    words: [...wordMap.entries()]
      .map(([word, e]) => ({
        word,
        count: e.count,
        avgAccuracy: avg(e.acc),
        sentence: e.sentence,
      }))
      .sort((a, b) => b.count - a.count),
  };
}

export function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
