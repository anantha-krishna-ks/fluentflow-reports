export type Band = "excellent" | "above-average" | "needs-improvement";

export interface WordIssue {
  word: string;
  /** 0-100 accuracy the engine gave for this word in this attempt */
  accuracy: number;
}

export interface Attempt {
  id: string;
  studentId: string;
  date: string; // ISO yyyy-mm-dd
  sentence: string;
  chapter: string;
  fluency: number;
  pronunciation: number;
  words: WordIssue[];
}

export interface Student {
  id: string;
  name: string;
  rollNo: string;
  section: string;
}

export interface ClassSection {
  id: string;
  label: string;
  chapters: string[];
}

export const chapters = [
  "Chapter 1: The Thunderstorm",
  "Chapter 2: A Warm Meal",
  "Chapter 3: A Long Journey",
  "Chapter 4: Evening Light",
  "Chapter 5: The Library",
  "Chapter 6: A Funny Mistake",
  "Chapter 7: Mountain Weather",
  "Chapter 8: The Presentation",
];

export const sections: ClassSection[] = [
  { id: "grade-6-a", label: "Grade 6 - Section A", chapters },
  { id: "grade-6-b", label: "Grade 6 - Section B", chapters },
];

const firstNames = [
  "Aarav", "Diya", "Ishaan", "Meera", "Kabir", "Anaya", "Rohan", "Sara",
  "Vihaan", "Tara", "Arjun", "Nisha", "Dev", "Kavya", "Reyan", "Ira",
  "Neel", "Pari", "Advik", "Zoya", "Yash", "Amara", "Krish", "Leela",
];
const lastNames = [
  "Sharma", "Iyer", "Nair", "Bose", "Khan", "Reddy", "Menon", "Gupta",
  "Rao", "Verma", "Joshi", "Kapoor",
];

const sentences = [
  "The rhythm of the thunderstorm frightened the neighbouring village.",
  "She thoroughly enjoyed the vegetable soup at the restaurant.",
  "Comfortable shoes are necessary for a particularly long journey.",
  "The photographer captured a beautiful silhouette against the sky.",
  "Our library subscribes to several international science journals.",
  "He deliberately mispronounced the word to make everyone laugh.",
  "February weather in the mountains is usually quite unpredictable.",
  "The entrepreneur explained her strategy with genuine enthusiasm.",
];

const trickyWords = [
  "rhythm", "thoroughly", "comfortable", "silhouette", "library",
  "February", "entrepreneur", "particularly", "vegetable", "necessary",
  "restaurant", "unpredictable", "neighbouring", "photographer", "genuine",
];

/** deterministic PRNG so the sample report is stable across renders */
function makeRandom(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

export const TERM_START = "2026-05-04";
export const TERM_END = "2026-08-12";

function buildData() {
  const rand = makeRandom(20260812);
  const students: Student[] = [];
  const attempts: Attempt[] = [];

  const end = new Date(TERM_END);

  sections.forEach((section, sIdx) => {
    const count = sIdx === 0 ? 24 : 20;
    for (let i = 0; i < count; i++) {
      const id = `${section.id}-s${i + 1}`;
      students.push({
        id,
        name: `${firstNames[(i + sIdx * 5) % firstNames.length]} ${
          lastNames[(i * 3 + sIdx) % lastNames.length]
        }`,
        rollNo: `${sIdx + 1}${String(i + 1).padStart(2, "0")}`,
        section: section.id,
      });

      // baseline ability of the student
      const base = 38 + rand() * 55;
      const submits = rand() > 0.12; // a few never submitted
      if (!submits) continue;

      const attemptCount = 3 + Math.floor(rand() * 6);
      for (let a = 0; a < attemptCount; a++) {
        const daysAgo = Math.floor(rand() * 95);
        const d = new Date(end);
        d.setDate(d.getDate() - daysAgo);
        const drift = (a / attemptCount) * 6;
        const fluency = Math.max(18, Math.min(99, Math.round(base + drift + (rand() - 0.5) * 16)));
        const pronunciation = Math.max(
          18,
          Math.min(99, Math.round(base + drift - 3 + (rand() - 0.5) * 20)),
        );

        const sentence = sentences[Math.floor(rand() * sentences.length)]!;
        const issueCount = pronunciation > 80 ? Math.floor(rand() * 2) : 1 + Math.floor(rand() * 3);
        const words: WordIssue[] = [];
        for (let w = 0; w < issueCount; w++) {
          const word = trickyWords[Math.floor(rand() * trickyWords.length)]!;
          if (words.some((x) => x.word === word)) continue;
          words.push({ word, accuracy: Math.round(25 + rand() * 45) });
        }

        attempts.push({
          id: `${id}-a${a + 1}`,
          studentId: id,
          date: iso(d),
          sentence,
          fluency,
          pronunciation,
          words,
        });
      }
    }
  });

  attempts.sort((a, b) => (a.date < b.date ? 1 : -1));
  return { students, attempts };
}

const data = buildData();

export const students = data.students;
export const attempts = data.attempts;
