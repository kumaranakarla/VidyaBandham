# Vidya Bandham — Node.js + Angular

A simple school app: class diary, homework, attendance, fees, and TET exam
prep, with separate views for teachers and parents. No cloud accounts, no
external console — everything runs on your own computer.

## What's inside

- `backend/` — Node.js + Express API, with a local SQLite database file
  (created automatically, no setup needed — uses Node's own built-in `node:sqlite`,
  so there's nothing to compile or install beyond `npm install`). Login is handled
  with your own email/password accounts (not Firebase) — a teacher can create
  parent logins right from the app.
- `frontend/` — Angular web app (works in any browser, desktop or mobile).

## Requirements

- Node.js **22.5 or newer** (anything reasonably recent works — if you can run
  `node -v` and it's not an old version, you're fine). You don't need to install
  a C++ compiler or Visual Studio Build Tools for this project.

## Running it (two terminals)

### 1. Backend

```
cd backend
npm install
npm run seed      # creates the database with demo data
npm start
```

This starts the API at `http://localhost:4000`. Leave this terminal running.

### 2. Frontend

In a **second** terminal:

```
cd frontend
npm install
npx ng serve
```

Then open **http://localhost:4300** in your browser.

## Demo logins

The seed script creates one class ("Class 6-B") with 4 students and these accounts:

- **Teacher:** `teacher@vb` / `teacher123`
- **Parent** (linked to student Aarav Mehta): `parent@vb` / `parent123`

As the teacher you can:
- Post diary notes and homework
- Mark daily attendance for the class
- Set up fees for the whole class and confirm payments
- Add new students and create a parent login for each one (no console needed —
  it's a button in the Students tab)

As the parent you can:
- Read diary notes and homework
- See your child's attendance
- See fee status and mark "I've paid"

Both teacher and parent logins also see a **TET Prep** tab, a **Mock Test**
tab, and a **2026 (New)** tab (see below).

## TET Prep tab

A practice-question tab for the TET (Teacher Eligibility Test) — useful for
teachers using the app and for anyone in the family preparing for the exam.
It's visible to both teacher and parent logins, filterable by **year** and by
**subject**, and each question reveals whether your pick was correct after
you answer.

Note: this tab (and Mock Test) covers years **2018, 2022, and 2024** —
2026 has its own dedicated tab, see "2026 (New) tab" below.

## 2026 (New) tab

The real AP TET 2026 exam papers — the newest and largest addition to the
question bank — get their own tab instead of just another year in TET
Prep's year filter. Right now it has 296 questions (Paper 2A, Maths &
Science, both August 2026 shifts); more official 2026 papers will be added
here as they're processed (see "About the 2026 questions" further down for
where they came from and how the answers were verified). It works the same
way as TET Prep — subject filter, English/Telugu toggle, instant right/wrong
feedback — plus a "Paper" filter so you can isolate one shift if you want.

**Why a separate tab instead of a year filter:** this is deliberately its
own frontend route (`/tet-2026`, `Tet2026Component`) and its own backend
endpoint (`/api/tet-2026`, `backend/src/routes/tet2026.js`), completely
apart from the `tet`/`mock-test` routes and the main `/api/tet` endpoint.
The plan is for this specific content (the newest, most in-demand exam
year) to eventually sit behind a paid subscription, while the rest of the
app — diary, homework, attendance, fees, and the older TET years — stays
free. Keeping it as its own route and its own API endpoint from day one
means a login/subscription check can be added later in exactly one place
(the route's `canActivate` on the frontend, and the route's mount line in
`backend/src/server.js` on the backend) without touching or risking
anything else in the app. **No subscription or payment logic exists yet** —
today the tab just requires being logged in, same as everything else.

### English / Telugu toggle

Both TET Prep and Mock Test have an English/తెలుగు switch at the top. It
follows the same rule the real AP TET exam does: every content subject —
Child Development & Pedagogy, Mathematics, Science & EVS, Physical Science,
Biology, and Social Studies — is available in both languages, so both
English-medium and Telugu-medium teachers can use the same question bank.
Only the English-subject questions stay English-only, since translating
"choose the correct synonym" into Telugu would change what's being tested.
A question with no Telugu version is marked "English only" so it's clear
why it didn't switch. The Telugu text for these subjects is my own
translation of the same verified English questions (using standard Telugu
terminology from educational psychology and the AP TET syllabus) — not a
separately-sourced official Telugu paper, so treat it as a translation aid
rather than a second independent source. The app pulls in the "Noto Sans
Telugu" web font so the script renders correctly even if a visitor's own
device doesn't have a Telugu font installed.

**The Telugu subject is different from the toggle above.** Just like
"English" is a real English-language exam paper (grammar, vocabulary,
literature) that only exists in English, "Telugu" is a real
**Telugu-language exam paper** (grammar, vocabulary, idioms, poetry and
folk-riddle comprehension, literary trivia) that only exists in Telugu —
it is not a translation of anything, and it stays in Telugu even when
you're in English mode (marked "Telugu only", the mirror image of the
"English only" tag). See "About the Telugu-language subject" below for
where it came from.

### A quick word on TET itself

The Teacher Eligibility Test was introduced nationally by the Government of
India in 2011 (following the Right to Education Act, 2009), and Andhra
Pradesh has run its own AP TET since around that time, most recently in
2022, 2024, 2025, and with a 2026 cycle announced. It's a mandatory
qualifying exam for teaching posts, held in two papers (Paper 1 for
classes 1–5, Paper 2 for classes 6–8).

### About the question bank

The set now covers **four real exam years — 2018, 2022, 2024, and 2026 —
621 questions in total**, spanning Child Development & Pedagogy, English,
Telugu, Mathematics, Science & EVS, Physical Science, Biology, and Social
Studies. Every question and its 4 options are transcribed from genuine,
officially published AP TET papers — nothing is invented. Each question in
the app shows its source paper and year, and the year filter defaults to
newest-first.

| Year | Paper | Questions |
|---|---|---|
| 2026 | Paper 2A (Maths & Science), 13th August 2026 Shift 1 | 148 |
| 2026 | Paper 2A (Maths & Science), 12th August 2026 Shift 2 | 148 |
| 2018 | Paper 1, June 2018 (two shifts) | 47 |
| 2018 | Paper 1 (Language I — Telugu), 12 June 2018 | 30 |
| 2018 | Paper 2A (Social Studies), 14 June 2018 | 60 |
| 2018 | Paper 2A (Maths & Science), 17 June 2018 | 51 |
| 2022 | Paper 2A, August 2022 | 53 |
| 2024 | Paper 2A, March 2024 | 5 |
| 2024 | Paper 1A (Set 1), 2024 | 79 |

The 2018 Paper 2A batch (classes 6–8 specialization papers, found via
`docs.aglasem.com`) is what added **Physical Science**, **Biology**, and
**Social Studies** as their own subjects — these are the harder, more
specific classes-6–8 versions of what Science & EVS covers at the
classes-1–5 level. It also added 27 more Mathematics questions at that same
higher level. This batch had its own official answer key cleanly embedded
in the same document, so those answers are a direct read of it — I still
independently spot-checked a large sample (all the computable Math ones by
redoing the arithmetic, plus well-known facts for the rest) before
including them, and dropped a couple of Math questions and one trivia
question whose stated answer didn't hold up under my own check.

The 2024 Paper 1A batch was found via a link the user shared from the AP
Commissioner of School Education's own site (`cse.ap.gov.in`), which pointed
to a compiled previous-papers document. That document's answer key was much
cleaner than the earlier 2022/2024 ones — most of those answers are a direct
read of it — but every question was still independently spot-checked before
being included (grammar, arithmetic, or well-known facts), and a handful of
math questions that didn't recompute to the stated answer were left out
rather than included anyway.

**A transparency note on correctness.** The 2018 batch came from a source
that had the official answer key cleanly embedded, so those answers are a
direct copy of the exam's own key. For 2022 and 2024, I could only find the
genuine question papers (confirmed authentic from their official headers)
freely and directly readable — the actual answer-key scans for those were
either unavailable or too garbled by OCR to trust as-is (two separate
extraction attempts on the same 2022 key gave different digits for the same
questions, and a couple of those digits were flatly wrong by ordinary
grammar rules). Rather than risk copying a misread answer into an app meant
to help people study, I worked out the correct option myself for every 2022
and 2024 question — using standard English grammar rules for the language
questions, and well-established, textbook facts for the pedagogy questions
(Mendel as the father of genetics, Thorndike's *Animal Intelligence*,
Maslow's hierarchy of needs, and similar). Questions where I wasn't
confident in an independently-checkable answer (a handful of opinion-based
or very AP-scheme-specific items) were left out entirely rather than guessed.
So: every question and option you see is real and unedited from the actual
exam paper; for 2022/2024 specifically, the marked correct answer is my own
verified determination rather than a copy of an official key scan.

If you (or anyone else) can get hold of a clean, readable official AP TET
answer key PDF for 2022 or 2024 — or a question paper + key for another year
like 2012, 2015, 2017, 2019, or 2025 — and share it with me, I can cross-check
or add it properly. The `year`/`paper` fields and the seeding pattern in
`backend/src/seed.js` are already set up for it — just follow the same
structure (real question, complete 4-option set, a correct answer you can
actually stand behind, tagged with its year and paper).

**About the Telugu-language subject.** The AP TET Paper 1 (June 2018) has
five sections: Child Development & Pedagogy (Q1–30), **Telugu — Language I
(Q31–60)**, English — Language II (Q61–90, already in the app as the
"English" subject), Mathematics (Q91–120), and EVS/Science (Q121–150). The
Telugu section had never been added, even though its English counterpart
was already in the app — an inconsistency a user flagged after noticing
"English literature questions and answers" but no Telugu equivalent.

The obstacle was the same one noted here previously for other years: the
source PDF's Telugu-script text does not extract as machine-readable
Unicode — not via automated fetching, and not even via a browser's own
accessibility/text-extraction layer — while rendering perfectly fine as an
image on-screen. That turned out to be a text-*extraction* gap, not a
rendering failure, so the fix was to read it the way a person would: each
page was opened as its actual scanned image, the browser viewport sized to
fit the page so nothing was cropped, and the Telugu text transcribed
directly by eye (magnifying small or ambiguous words as a cropped,
upscaled close-up where needed). All 30 questions were transcribed this
way and then checked against the exam's own official answer key (printed
on the same document, page 61) — every single one matched the key's stated
correct option with no inconsistencies, which is strong evidence the
transcription is accurate. Nothing here is guessed or invented; it's a
real published exam section, just read by vision instead of by text
extraction because that was the only reliable way to get correct Telugu
characters out of this source.

This subject intentionally has no English translation (`question_te` is
not set) — it's a language-and-literature paper, like "English" is, so
there's nothing meaningful to translate. It always displays in Telugu
script, tagged "Telugu only" when you're browsing in English mode, mirroring
how English-subject questions are tagged "English only" in Telugu mode.

**About the 2026 questions.** AP TET held a real 2026 cycle (exams in
August 2026), and the official government portal, `tet2dsc.apcfss.in`,
publishes each candidate's response sheet as a PDF with the full question
paper plus a color-coded answer key baked in — every option is labeled
green (correct) or red (incorrect) right on the page. These are two such
official PDFs: **Paper 2A (Maths & Science)**, one from the 13th August
2026 Shift 1 session and one from the 12th August 2026 Shift 2 session,
each a full 150-question paper covering Child Development & Pedagogy,
Telugu (Language I), English (Language II), Mathematics, Physical Science,
and Biology.

Getting the correct answers out was fully automatic and 100% reliable:
the PDF's question *text* is embedded as an image (not extractable), but
the small "Options :" summary block below each question is real,
machine-readable text, and the correct option's color is a real, readable
text-color attribute on that block — so a script read every PDF page,
found each question's Options block, and recorded which option number was
colored green. This was verified against the visible coloring by eye
during transcription for every question, with zero contradictions found
across all 296 questions kept.

The question and option *text* itself was still transcribed by vision —
each page opened as its rendered image and read directly, the same
approach used for the 2018 Telugu paper above — since that's the only
reliable way to get the actual wording (and, for CDP/Mathematics/Physical
Science/Biology, the Telugu translation shown alongside it) out of this
PDF format. Telugu and English (Language I/II) questions are
language-and-literature papers like the existing "Telugu" and "English"
subjects, so they stay in one language only, tagged accordingly.

4 questions (2 per shift) were officially cancelled by the exam board
itself — the PDF marks these with a blue note reading "discrepancy is
found in question/answer, full marks awarded to all candidates" and
leaves the options uncolored — and were left out of the question bank
entirely, since there's no single correct answer to mark.

There are 8 more official 2026 PDFs already on hand (Paper 1/SGT across
four shifts, Paper 2A Language-Telugu variant across two shifts, Paper 2
Social Studies, and Paper 2B Special Education), plus more the user may
still send — these haven't been processed yet but would follow the exact
same verified pipeline.

## Mock Test tab

Where TET Prep is for browsing questions at your own pace, the **Mock Test**
tab is for testing yourself: pick a year, a subject, and how many questions
you want (10/20/30/50), and it puts together a random set from the question
bank. Options are chosen so you can't just look up the answer — the correct
option is never sent to the browser until after you submit.

Once you submit, you get an instant score (e.g. "16/20 — 80%") plus a full
review showing every question with the correct answer highlighted in green
and, if you got it wrong, your own pick highlighted in red.

**No separate signup needed.** The tab uses the same teacher/parent login
you already have for the rest of the app — there's no new "register for
mock test" step. Every attempt is saved against your account (score, date,
and the year/subject you picked), and the setup screen shows your past
attempts so you can see whether you're improving over time. This is stored
server-side in a new `tet_mock_attempts` table, so it survives across
devices as long as you're signed in with the same login.

## Notes

- The database is a single file: `backend/vidyabandham.db`. Running `npm run seed`
  wipes and recreates it with fresh demo data — useful if you want to start
  over, and **necessary any time you pull an update that changes the TET
  question bank** (a new subject, new questions, a Telugu translation fix,
  and so on). The server only auto-seeds when the database is completely
  empty (`seedIfEmpty()` in `backend/src/seed.js`, which exists so a free
  host that wipes its disk on every restart doesn't come back up locked
  out) — once your database has any data in it at all, pulling new code
  alone does **not** update the questions already stored there. If you add
  a new TET subject or question set and it doesn't show up in the app,
  re-running `npm run seed` (locally) — or triggering an equivalent reseed
  on your deployed backend — is almost always the fix.
- To use this for a real class, just add real students and create real parent
  logins from the Students tab, then delete the two demo accounts if you like.
- The backend needs no internet connection and no third-party account —
  everything lives in that one database file on your computer.
- When you start the server or run the seed script you'll see a one-line
  `ExperimentalWarning: SQLite is an experimental feature...` — that's just
  Node telling you its built-in SQLite support is newer than most Node
  features. It's safe to ignore; nothing is broken.
- The browser tab icon is a graduation cap (`frontend/public/favicon.ico`,
  navy with the app's orange accent) instead of the Angular framework's
  default icon.

## Putting it online (Netlify + Render, both free)

This gets you a real public URL you can share, using GitHub + Netlify (frontend)
+ Render (backend) — all free.

**Important limitation:** Render's free tier doesn't keep a local file like our
database between restarts — the backend "sleeps" after 15 minutes of no
traffic and loses whatever was in `vidyabandham.db` when it wakes back up. The
app seeds itself back to the same demo data automatically on a fresh start
(see `seedIfEmpty()` in `backend/src/seed.js`), so it's always usable — but
that's fine for showing someone the app, not for a real class actually relying
on the data staying put. If that's the goal, say so and we'll swap the database
for a small free hosted one instead (a quick change, not a rebuild).

### 1. Push this project to GitHub
```
cd vidyabandham
git init
git add .
git commit -m "Vidya Bandham: Node.js + Angular"
```
Then create a new empty repository on GitHub (no README/license — just the
bare repo), copy the URL it gives you, and run:
```
git remote add origin <the-URL-GitHub-gave-you>
git branch -M main
git push -u origin main
```

### 2. Backend on Render
1. On [render.com](https://render.com), **New +** → **Blueprint** (preferred —
   reads `render.yaml` automatically) or **Web Service**, and connect your
   GitHub repo.
2. Render should pick up the `render.yaml` in this project and pre-fill
   everything (root directory `backend`, build command `npm install`, start
   command `npm start`, a random `JWT_SECRET` generated for you, free plan).
   If it doesn't offer that, set those fields manually and make sure the
   Instance Type is **Free**.
3. Deploy. Once it's live, copy the URL Render gives you (something like
   `https://vidyabandham-backend-xxxx.onrender.com`, or a custom name if you
   set one during setup).

### 3. Frontend on Netlify
1. Open `frontend/src/environments/environment.prod.ts` and replace the
   placeholder with your real Render URL, e.g.:
   ```ts
   export const environment = {
     apiUrl: 'https://vidyabandham-backend-xxxx.onrender.com/api',
   };
   ```
2. Commit and push that change:
   ```
   git add frontend/src/environments/environment.prod.ts
   git commit -m "Point frontend at deployed backend"
   git push
   ```
3. On [netlify.com](https://netlify.com), **Add new site** → **Import an
   existing project** → connect the same GitHub repo. Netlify should read the
   `netlify.toml` in this project and fill in the build settings automatically
   (base directory `frontend`, publish directory `dist/frontend/browser`).
4. Deploy. Netlify gives you a random public URL like
   `https://random-words-xxxxxx.netlify.app` at first — see below to change it.

From then on, any `git push` to the repo redeploys both sides automatically.

### Renaming the Netlify URL
Netlify assigns a random subdomain by default. To make it say "vidyabandham"
instead: open your site on Netlify → **Site configuration** → **General** →
**Site details**, find **Site name** (or "Change site name"), and enter
something like `vidyabandham` — if that exact name is free on Netlify's
`.netlify.app` domain, your URL becomes `https://vidyabandham.netlify.app`.
If it's taken, try a variant like `vidyabandham-app` or `vidyabandham-school`.
This doesn't require a rebuild — it takes effect immediately.
