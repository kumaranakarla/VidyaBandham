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
Prep's year filter. It now has **1,786 questions across 12 official exam
papers** (Paper 1/SGT, Paper 2A Maths & Science, Paper 2A Social Studies,
Paper 2A Language-Telugu, and Paper 2A Language-English, spanning multiple
shifts/dates in August 2026) — see "About the 2026 questions" further down
for where they came from and how the answers were verified. It works the
same way as TET Prep — subject filter, English/Telugu toggle, instant
right/wrong feedback — plus a "Paper" filter so you can isolate one shift
if you want.

**Why a separate tab instead of a year filter:** this is deliberately its
own frontend route (`/tet-2026`, `Tet2026Component`) and its own backend
endpoint (`/api/tet-2026`, `backend/src/routes/tet2026.js`), completely
apart from the `tet`/`mock-test` routes and the main `/api/tet` endpoint.
Keeping it as its own route and its own API endpoint from day one is what
let the paywall below get added without touching or risking anything else
in the app — diary, homework, attendance, fees, and the older TET years
all stay free and untouched.

**This tab is now partly a paid subscription.** 2 of the 12 papers (Paper
2A Maths & Science, both shifts) are free forever for any logged-in
account. The other 10 papers require an active subscription — see
"Subscription & payments (Razorpay)" below for the full design. A locked
paper's name and shift still show up in the "Paper" filter (with a 🔒), so
it's clear what exists, but its actual questions are never sent to the
browser until the subscription check passes server-side.

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
2,111 questions in total**, spanning Child Development & Pedagogy, English,
Telugu, Mathematics, Science & EVS, Physical Science, Biology, and Social
Studies. Every question and its 4 options are transcribed from genuine,
officially published AP TET papers — nothing is invented. Each question in
the app shows its source paper and year, and the year filter defaults to
newest-first.

| Year | Paper | Questions |
|---|---|---|
| 2026 | Paper 2A (Social Studies), 10th August 2026 Shift 2 | 150 |
| 2026 | Paper 2A (Social Studies), 11th August 2026 Shift 2 | 150 |
| 2026 | Paper 2A (Language - English), 16th August 2026 Shift 2 | 150 |
| 2026 | Paper 1 (SGT), 8th August 2026 Shift 1 | 149 |
| 2026 | Paper 1 (SGT), 9th August 2026 Shift 1 | 149 |
| 2026 | Paper 1 (SGT), 9th August 2026 Shift 2 | 149 |
| 2026 | Paper 2A (Social Studies), 11th August 2026 Shift 1 | 149 |
| 2026 | Paper 2A (Language - Telugu), 5th August 2026 Shift 2 | 149 |
| 2026 | Paper 1 (SGT), 6th August 2026 Shift 2 | 148 |
| 2026 | Paper 2A (Maths & Science), 13th August 2026 Shift 1 | 148 |
| 2026 | Paper 2A (Maths & Science), 12th August 2026 Shift 2 | 148 |
| 2026 | Paper 2A (Maths & Science), 14th August 2026 Shift 2 | 147 |
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
green (correct) or red (incorrect) right on the page. The question bank now
includes **12 such official response-sheet PDFs**, covering five distinct
AP TET 2026 paper types:

- **Paper 1 (SGT)** — classes 1–5, four shifts (6th, 8th, 9th ×2 August).
  Sections: Child Development & Pedagogy, Telugu (Language I), English
  (Language II), Mathematics, and Science & EVS (150 questions each,
  covering the primary-classes syllabus rather than the harder Paper 2
  version of these subjects).
- **Paper 2A (Maths & Science)** — classes 6–8, three shifts (12th, 13th,
  14th August). Sections: CDP, Telugu, English, Mathematics, Physical
  Science, and Biology.
- **Paper 2A (Social Studies)** — classes 6–8, three shifts (10th, 11th ×2
  August). Sections: CDP, Telugu, English, and Social Studies (a double-size,
  60-question section covering History/Geography/Civics content and
  methodology together).
- **Paper 2A (Language - Telugu)** — the Telugu-medium language specialist
  ("pandit") paper, one shift (5th August). Sections: CDP, then Telugu
  appears twice — once as the 30-question Language I paper and again as a
  60-question Content + Methodology block — both tagged as the "Telugu"
  subject in this app (90 Telugu questions total from this one paper) —
  plus English (Language II).
- **Paper 2A (Language - English) — the English-medium language specialist
  paper**, one shift (16th August). This PDF's official answer key is
  unusual: it prints the correct-answer block for *all seven* optional
  Language-I scripts a candidate could have picked (Telugu, Urdu, Hindi,
  Kannada, Oriya, Tamil, Sanskrit — 210 questions total for that section
  alone), since it's a master key rather than one candidate's response
  sheet. Since this app only supports Telugu and English, only the Telugu
  Language-I block (30 questions) was kept and the other six language
  blocks (180 questions) were deliberately left out — they don't correspond
  to any subject this app has. Its Child Development & Pedagogy section
  also turned out to be printed in English only (no Telugu translation
  anywhere in that section, unlike every other 2026 paper), so those 30
  questions are tagged "English only" the way the pure-English-subject
  questions are, rather than force-fitting a translation that doesn't exist
  in the source.

One duplicate upload (`...SS TELUGU 11th Aug 2026 Shift 1 Set B`, uploaded
twice with different filenames) was detected by comparing file checksums
and only processed once.

Getting the correct answers out was fully automatic and 100% reliable:
the PDF's question *text* is embedded as an image (not extractable), but
the small "Options :" summary block below each question is real,
machine-readable text, and the correct option's color is a real, readable
text-color attribute on that block — so a script read every PDF page,
found each question's Options block, and recorded which option number was
colored green. This was verified against the visible coloring by eye
during transcription for every question, with only a small handful of
flagged edge cases (a few officially-acknowledged "either answer accepted"
ambiguity notes, kept as the ground-truth answer with a note) across all
1,786 questions kept.

The question and option *text* itself was still transcribed by vision —
each page opened as its rendered image and read directly, the same
approach used for the 2018 Telugu paper above — since that's the only
reliable way to get the actual wording (and, where the paper shows one, the
Telugu translation alongside it) out of this PDF format. Telugu and English
questions in the language-specialist sections are language-and-literature
content like the existing "Telugu" and "English" subjects, so they stay in
one language only, tagged accordingly.

A total of 10 questions across these 12 papers were officially cancelled
by the exam board itself — the PDF marks these with a blue note reading
"discrepancy is found in question/answer, full marks awarded to all
candidates" and leaves the options uncolored — and were left out of the
question bank entirely, since there's no single correct answer to mark.

## Subscription & payments (Razorpay)

The 2026 (New) tab's 10 non-free papers are gated behind a ₹299 / 30-day
(1 month) subscription, paid through [Razorpay](https://razorpay.com). This is a
separate, public self-signup flow — it does **not** reuse the
teacher/parent accounts a teacher creates from inside the app.

**New pieces:**

- A third user role, `tet_subscriber`, created via `POST /api/auth/register`
  (public signup — no teacher/admin involved) and the `/signup` page. A
  `tet_subscriber` account has no class and none of the school-management
  nav links (Diary/Homework/Attendance/Fees/Students/TET Prep/Mock Test) —
  it exists purely to practice TET 2026 papers.
- A `subscriptions` table (`backend/src/db.js`): one row per Razorpay
  order/payment. A subscription is "active" when its latest `paid` row's
  `current_period_end` is still in the future. **Renewal is manual** — a
  lapsed subscriber pays again for another 30 days; there's no
  auto-recurring billing (Razorpay's Subscriptions API isn't used, just
  one-off Orders).
- `backend/src/routes/subscription.js` — `GET /status`, `POST
  /create-order`, `POST /verify`. `/verify` recomputes the HMAC-SHA256
  signature Razorpay hands back server-side before marking a subscription
  paid; the client's own "payment succeeded" callback is never trusted on
  its own.
- `backend/src/routes/tet2026.js` filters the questions it returns based on
  the caller's subscription status — a locked paper's questions never leave
  the server for a non-subscriber.
- The frontend's `SubscriptionService` opens Razorpay's Checkout.js widget
  (loaded globally in `frontend/src/index.html`, not an npm package, per
  Razorpay's own integration docs) and shows an "Important Notice"-styled
  popup on the 2026 (New) tab prompting registration/login/payment.

**Setting up Razorpay keys:** sign up for a free Razorpay account, grab your
**test-mode** Key ID and Key Secret from the Razorpay dashboard, and put
them in `backend/.env`:

```
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
```

Without real keys, the app still runs — `create-order` just fails with a
clear error instead of crashing (there's a non-functional placeholder
fallback so local dev doesn't require signing up for Razorpay just to work
on unrelated parts of the app). **Swap the test keys for live keys only
when ready to accept real payments** — nothing in the code changes, only
the environment variables on Render.

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
4. For the TET 2026 subscription/paywall to actually accept payments, add
   `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` under the service's
   **Environment** tab (see "Subscription & payments (Razorpay)" above) —
   test-mode keys to start, live keys once you're ready to accept real
   payments.

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
