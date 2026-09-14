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
npm run seed      # creates the database with demo data (only need to run this once)
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

- **Teacher:** `teacher@vb.local` / `teacher123`
- **Parent** (linked to student Aarav Mehta): `parent@vb.local` / `parent123`

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

Both teacher and parent logins also see a **TET Prep** tab and a **Mock Test**
tab (see below).

## TET Prep tab

A practice-question tab for the TET (Teacher Eligibility Test) — useful for
teachers using the app and for anyone in the family preparing for the exam.
It's visible to both teacher and parent logins, filterable by **year** and by
**subject**, and each question reveals whether your pick was correct after
you answer.

### A quick word on TET itself

The Teacher Eligibility Test was introduced nationally by the Government of
India in 2011 (following the Right to Education Act, 2009), and Andhra
Pradesh has run its own AP TET since around that time, most recently in
2022, 2024, 2025, and with a 2026 cycle announced. It's a mandatory
qualifying exam for teaching posts, held in two papers (Paper 1 for
classes 1–5, Paper 2 for classes 6–8).

### About the question bank

The set now covers **three real exam years — 2018, 2022, and 2024 — 184
questions in total**, spanning Child Development & Pedagogy, English,
Mathematics, and Science & EVS. Every question and its 4 options are
transcribed from genuine, officially published AP TET papers — nothing is
invented. Each question in the app shows its source paper and year, and the
year filter defaults to newest-first.

| Year | Paper | Questions |
|---|---|---|
| 2018 | Paper 1, June 2018 (two shifts) | 47 |
| 2022 | Paper 2A, August 2022 | 53 |
| 2024 | Paper 2A, March 2024 | 5 |
| 2024 | Paper 1A (Set 1), 2024 | 79 |

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
  again wipes and recreates it with fresh demo data — useful if you want to
  start over.
- To use this for a real class, just add real students and create real parent
  logins from the Students tab, then delete the two demo accounts if you like.
- The backend needs no internet connection and no third-party account —
  everything lives in that one database file on your computer.
- When you start the server or run the seed script you'll see a one-line
  `ExperimentalWarning: SQLite is an experimental feature...` — that's just
  Node telling you its built-in SQLite support is newer than most Node
  features. It's safe to ignore; nothing is broken.

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
