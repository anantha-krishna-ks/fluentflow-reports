import { fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { TERM_END, TERM_START } from "@/data/assessments";

export const reportSearchSchema = z.object({
  section: fallback(z.string(), "grade-6-a").default("grade-6-a"),
  chapter: fallback(z.string(), "all").default("all"),
  from: fallback(z.string(), TERM_START).default(TERM_START),
  to: fallback(z.string(), TERM_END).default(TERM_END),
  band: fallback(z.string(), "all").default("all"),
  q: fallback(z.string(), "").default(""),
});

export type ReportSearch = z.infer<typeof reportSearchSchema>;
