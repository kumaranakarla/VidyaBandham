# Sampark — Node.js + Angular

A simple school app: class diary, homework, attendance, and fees, with separate
views for teachers and parents. No cloud accounts, no external console —
everything runs on your own computer.

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

- **Teacher:** `teacher@sampark.local` / `teacher123`
- **Parent** (linked to student Aarav Mehta): `parent@sampark.local` / `parent123`

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

## Notes

- The database is a single file: `backend/sampark.db`. Running `npm run seed`
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
traffic and loses whatever was in `sampark.db` when it wakes back up (it
re-seeds to the same demo data, since that's what runs when the server
starts fresh). That's fine for showing someone the app. It is **not** fine
for a real class actually relying on the data staying put — if that's the
goal, say so and we'll swap the database for a small free hosted one first
(a quick change, not a rebuild).

### 1. Push this project to GitHub
```
cd sampark-nodejs-angular
git init
git add .
git commit -m "Sampark: Node.js + Angular"
```
Then create a new empty repository on GitHub (no README/license — just the
bare repo), copy the URL it gives you, and run:
```
git remote add origin <the-URL-GitHub-gave-you>
git branch -M main
git push -u origin main
```

### 2. Backend on Render
1. On [render.com](https://render.com), **New +** → **Web Service** → connect
   your new GitHub repo.
2. Render should pick up the `render.yaml` in this project automatically and
   pre-fill everything (root directory `backend`, build command `npm install`,
   start command `npm start`, a random `JWT_SECRET` generated for you). If it
   doesn't offer that, set those fields manually.
3. Deploy. Once it's live, copy the URL Render gives you (something like
   `https://sampark-backend-xxxx.onrender.com`).

### 3. Frontend on Netlify
1. Open `frontend/src/environments/environment.prod.ts` and replace the
   placeholder with your real Render URL, e.g.:
   ```ts
   export const environment = {
     apiUrl: 'https://sampark-backend-xxxx.onrender.com/api',
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
   `netlify.toml` in this project and fill in the build settings automatically.
4. Deploy. Netlify gives you a public URL like `https://something.netlify.app`
   — that's the link to share.

From then on, any `git push` to the repo redeploys both sides automatically.
