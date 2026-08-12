# Language Assessment Report (Teacher View)

A responsive teacher-facing report page for reading-aloud assessments, scored on Fluency and Pronunciation.

## Scope of this first build

Front-end only, driven by realistic sample data (one class section, ~24 students). No database yet — once the layout and metrics are approved, wiring it to Lovable Cloud is a follow-up step.

## Pages

### 1. Class report (`/`)
- **Header bar**: class/section selector, date-range filter (from/to date pickers with quick presets: last 7 days, last 30 days, this term). All metrics below recompute from the selected range.
- **Summary tiles**: total students in section, total who submitted the assessment, submission rate, class average Fluency %, class average Pronunciation %.
- **Performance breakdown**: two grouped cards (Fluency, Pronunciation), each showing counts and share of students in three bands:
  - Excellent — above 75%
  - Above average — 50% to 75%
  - Needs improvement — below 50%
  Rendered as a horizontal stacked bar plus labelled counts.
- **Trend chart**: class average Fluency and Pronunciation over the selected date range.
- **Commonly mispronounced words**: ranked table of words with the number of instances across the class, number of distinct students affected, and a severity chip. Top words also shown as chips for quick scanning.
- **Student list**: sortable, searchable table — student name, attempts, Fluency %, Pronunciation %, overall band chip, last submission date, and a "View report" action. Tabs filter the list: All / Excellent / Above average / Needs improvement, each showing its count.

### 2. Student report (`/students/$studentId`)
- Student header with overall bands and submission count for the selected range.
- Fluency and Pronunciation scores with progress rings.
- Per-sentence attempt list: the sentence read, fluency and pronunciation score, date.
- Words needing improvement for that student, with occurrence count and the sentence context.
- Back link that preserves the active date filter.

## Responsiveness
- Mobile: single column, summary tiles in a 2-up grid, student table collapses to stacked cards, filters in a collapsible bar.
- Tablet: two-column tiles and side-by-side band cards.
- Desktop: full multi-column dashboard grid with the student table full width.

## Design direction
Calm academic dashboard — light neutral surfaces, one teal/indigo primary, warm amber for "above average" and muted coral for "needs improvement", green for "excellent". Clear typographic hierarchy, generous card spacing, no heavy chrome. All colors added as semantic tokens in `src/styles.css` (light and dark).

## Technical notes
- Routes: `src/routes/index.tsx` (class report), `src/routes/students/$studentId.tsx`.
- Date range and active band tab held in URL search params (`validateSearch` + `fallback`) so filters survive navigation and are shareable.
- Sample data in `src/data/assessments.ts` with typed models (`Student`, `Attempt`, `WordIssue`) plus pure helpers for banding, aggregation and word frequency in `src/lib/report.ts` — these swap straight onto real data later.
- Charts via Recharts; tables and tabs via existing shadcn components; date filter via the shadcn date picker.
- Per-route `head()` metadata with unique titles/descriptions.
