import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Tet2026Paper, TetQuestion, TetService } from '../../services/tet.service';
import { AuthService } from '../../services/auth.service';
import { SubscriptionService } from '../../services/subscription.service';

// One official 2026 paper, grouped from the flat questions list the backend
// sends — mirrors GrandTestComponent's PaperSummary so the two "pick a
// paper" screens look and behave the same way.
interface PaperSummary {
  name: string;
  free: boolean;
  locked: boolean;
  questions: TetQuestion[];
  total: number;
}

// The "2026 (New)" tab. Deliberately its own component + route (see
// app.routes.ts and tet.service.ts's `list2026()`/`base2026`) rather than a
// year filter bolted onto the existing TET Prep page. Two of the twelve
// official papers (Maths & Science, both shifts) are free for everyone who's
// logged in; the other ten sit behind the ₹199/30-day subscription handled
// by subscription.service.ts + backend/src/routes/subscription.js
// (Razorpay). The backend never sends a locked paper's questions to the
// client at all — the "locked" flag here is just for showing what exists.
//
// Shows every official paper as a picker grid first (same look as the
// Grand Test / MockTest paper picker, which is the design that was already
// liked) — pick one, see just that paper's questions with instant
// right/wrong feedback per question, no timer or setup screen. The timed,
// full-exam-conditions run lives under MockTest(TET) instead.
@Component({
  selector: 'app-tet-2026',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <h2>{{ lang === 'te' ? '2026 (కొత్తది)' : '2026 (New)' }} <span class="new-badge">{{ lang === 'te' ? 'కొత్తది' : 'NEW' }}</span></h2>

    <ng-container *ngIf="stage === 'select'">
      <p class="intro" *ngIf="lang === 'en'">
        The real AP TET 2026 exam papers, with final, officially-published answer keys — sourced directly from the AP
        Department of School Education's own results portal. {{ officialPapersCount }} official papers in total across SGT, Maths &amp;
        Science, Social Studies, and the Telugu/English language papers. Pick a paper below to practice it — no
        timer, instant right/wrong feedback on every question.
      </p>
      <p class="intro" *ngIf="lang === 'te'">
        వాస్తవ AP TET 2026 పరీక్షా పత్రాలు, అధికారికంగా ప్రచురించిన తుది జవాబు కీలతో సహా — నేరుగా ఆంధ్రప్రదేశ్ పాఠశాల విద్యా శాఖ ఫలితాల పోర్టల్ నుండి సేకరించబడ్డాయి. SGT, గణితం &amp; సైన్స్, సాంఘిక శాస్త్రాలు, మరియు తెలుగు/ఇంగ్లీష్ భాషా పత్రాలతో కలిపి మొత్తం {{ officialPapersCount }} అధికారిక పత్రాలు ఉన్నాయి. ప్రాక్టీస్ చేయడానికి దిగువన ఒక పేపర్‌ను ఎంచుకోండి — టైమర్ ఉండదు, ప్రతి ప్రశ్నకు తక్షణ సరైన/తప్పు అభిప్రాయం లభిస్తుంది.
      </p>

      <div class="unlock-banner" *ngIf="!loading && lockedPapersCount > 0">
        <span *ngIf="isSchoolAccount">
          <strong>{{ lockedPapersCount }} more official papers</strong> — create a free account to unlock all {{ officialPapersCount }}.
        </span>
        <span *ngIf="!isSchoolAccount && lang === 'en'">
          <strong>{{ lockedPapersCount }} more official papers</strong> are available with a subscription.
        </span>
        <span *ngIf="!isSchoolAccount && lang === 'te'">
          <strong>మరో {{ lockedPapersCount }} అధికారిక పత్రాలు</strong> సబ్‌స్క్రిప్షన్‌తో అందుబాటులో ఉన్నాయి.
        </span>
        <button type="button" (click)="openUpgradePrompt()">
          {{ isSchoolAccount ? 'Create Account' : (lang === 'te' ? ('మొత్తం ' + officialPapersCount + ' పత్రాలను అన్‌లాక్ చేయండి') : ('Unlock all ' + officialPapersCount + ' papers')) }}
        </button>
      </div>

      <div class="lang-toggle">
        <button [class.active]="lang === 'en'" (click)="lang = 'en'" type="button">English</button>
        <button [class.active]="lang === 'te'" (click)="lang = 'te'" type="button">తెలుగు</button>
        <span class="lang-note" *ngIf="lang === 'te'">
          ఆంగ్లం ఎల్లప్పుడూ వాస్తవ పరీక్షలో ఆంగ్లంలోనే పరీక్షించబడుతుంది, కాబట్టి ఆ ప్రశ్నలు దిగువన ఆంగ్లంలోనే ఉంటాయి.
        </span>
        <span class="lang-note" *ngIf="lang === 'en'">
          Telugu is a language & literature paper tested only in Telugu on the real exam, so those questions stay in
          Telugu below.
        </span>
      </div>

      <p *ngIf="loading">Loading…</p>
      <p *ngIf="!loading && paperSummaries.length === 0">No 2026 questions added yet.</p>

      <!-- SELECT: pick which official 2026 paper to practice -->
      <div class="paper-list" *ngIf="!loading && paperSummaries.length">
        <div
          class="paper-card"
          *ngFor="let p of paperSummaries; let i = index"
          [class.locked-card]="p.locked"
          (click)="choosePaper(p)"
        >
          <div class="paper-card-head">
            <span class="paper-num">Paper {{ i + 1 }}</span>
            <span class="lock-badge" *ngIf="p.locked">🔒</span>
          </div>
          <div class="paper-name">{{ p.name }}</div>
          <div class="paper-meta" *ngIf="!p.locked">{{ p.total }} questions</div>
          <div class="paper-meta locked-meta" *ngIf="p.locked">Subscribe to unlock this paper</div>
        </div>
      </div>
    </ng-container>

    <!-- VIEW: the selected paper's questions, no timer, instant feedback -->
    <ng-container *ngIf="stage === 'view' && selectedPaper">
      <button class="back-link" type="button" (click)="backToSelect()">← Choose a different paper</button>

      <div class="filter-row" *ngIf="subjectsForSelected.length">
        <label>Subject</label>
        <select [(ngModel)]="selectedSubject">
          <option value="">All subjects</option>
          <option *ngFor="let s of subjectsForSelected" [value]="s">{{ s }}</option>
        </select>
        <button
          class="print-btn"
          type="button"
          (click)="printPaper()"
          title="Download as PDF / Print"
          *ngIf="showDownloadOption && filteredQuestions.length"
        >
          <span class="print-icon" aria-hidden="true">🖨️</span>
          <span class="print-label">
            <span class="btn-en">Download / Print (PDF)</span>
            <span class="btn-te">డౌన్‌లోడ్ / ప్రింట్ (PDF)</span>
          </span>
        </button>
      </div>

      <p *ngIf="filteredQuestions.length === 0">No questions match this filter.</p>

      <div class="questions">
        <div class="q-card" *ngFor="let q of filteredQuestions">
          <div class="subject-tag">
            {{ q.subject }}
            <span class="en-only-tag" *ngIf="!q.question_te && q.subject !== 'Telugu'">English only</span>
            <span class="en-only-tag" *ngIf="q.subject === 'Telugu'">Telugu only</span>
          </div>
          <div class="question-text">
            {{ q.question }}
            <div class="question-text-te" *ngIf="q.question_te">{{ q.question_te }}</div>
          </div>
          <div class="options">
            <button
              *ngFor="let opt of optionsEn(q); let i = index"
              [class.selected]="picked[q.id] === i + 1"
              [class.correct]="picked[q.id] && i + 1 === q.correct_option"
              [class.incorrect]="picked[q.id] === i + 1 && i + 1 !== q.correct_option"
              [disabled]="!!picked[q.id]"
              (click)="pick(q, i + 1)"
            >
              <span>{{ opt }}</span>
              <span class="opt-te" *ngIf="optionsTe(q)">{{ optionsTe(q)![i] }}</span>
            </button>
          </div>
          <div class="answer-note" *ngIf="picked[q.id]">
            <span class="correct-text" *ngIf="picked[q.id] === q.correct_option">Correct!</span>
            <span class="incorrect-text" *ngIf="picked[q.id] !== q.correct_option">
              Not quite — the correct answer is <strong>{{ optionsEn(q)[q.correct_option - 1] }}</strong><ng-container *ngIf="optionsTe(q)"> (<strong>{{ optionsTe(q)![q.correct_option - 1] }}</strong>)</ng-container>.
            </span>
          </div>
          <div class="source" *ngIf="q.source">Source: {{ q.source }}</div>
        </div>
      </div>
    </ng-container>

    <!-- Paywall popup: styled like the app's other "Important Notice" style
         announcements, so it reads as an in-app notice rather than a
         disruptive ad. -->
    <div class="paywall-overlay" *ngIf="showPaywall" (click)="closePaywall()">
      <div class="paywall-modal" (click)="$event.stopPropagation()">
        <div class="paywall-header">
          <div>
            <h2>Important Notice</h2>
            <p class="paywall-subtitle">ANDHRA PRADESH TEACHER ELIGIBILITY TEST</p>
          </div>
          <button class="close-btn" type="button" (click)="closePaywall()" aria-label="Close">✕</button>
        </div>
        <div class="paywall-body">
          <div class="notice-box">
            <div class="notice-icon">🔒</div>
            <div class="notice-text">
              <h3>Unlock all {{ officialPapersCount }} official 2026 papers <span class="new-badge">NEW</span></h3>
              <p>
                You get {{ freePapersCount }} papers (Maths &amp; Science) free, forever. Register and subscribe for
                <strong>₹199 / month</strong> to practice the remaining {{ lockedPapersCount }} papers — Paper 1 (SGT), Social Studies,
                and the Telugu &amp; English language papers.
              </p>
            </div>
          </div>

          <div class="paywall-actions" *ngIf="!auth.user()">
            <a routerLink="/signup" class="btn-primary" (click)="closePaywall()">Register free</a>
            <a routerLink="/login" class="btn-secondary" (click)="closePaywall()">Log in</a>
          </div>
          <div class="paywall-actions" *ngIf="auth.user() && !subscriptionActive">
            <button type="button" class="btn-primary" (click)="subscribe()" [disabled]="payingNow">
              {{ payingNow ? 'Opening payment…' : 'Subscribe — ₹199 / month' }}
            </button>
          </div>
          <p class="paywall-note" *ngIf="auth.user() && !subscriptionActive">
            Signed in as {{ auth.user()?.name }}. Payment is handled securely by Razorpay.
          </p>
          <p class="paywall-error" *ngIf="paywallError">{{ paywallError }}</p>
        </div>
      </div>
    </div>

    <!-- Simple, friendly prompt for demo (teacher/parent) accounts — no
         Razorpay involved at all, since a demo account can't subscribe as
         itself; it has to register its own account first. -->
    <div class="paywall-overlay" *ngIf="showCreateAccountPrompt" (click)="closeCreateAccountPrompt()">
      <div class="paywall-modal" (click)="$event.stopPropagation()">
        <div class="paywall-header">
          <div>
            <h2>Create an Account</h2>
            <p class="paywall-subtitle">ANDHRA PRADESH TEACHER ELIGIBILITY TEST</p>
          </div>
          <button class="close-btn" type="button" (click)="closeCreateAccountPrompt()" aria-label="Close">✕</button>
        </div>
        <div class="paywall-body">
          <div class="notice-box">
            <div class="notice-icon">🔒</div>
            <div class="notice-text">
              <h3>Unlock all {{ officialPapersCount }} official 2026 papers <span class="new-badge">NEW</span></h3>
              <p>Create an account to unlock all {{ officialPapersCount }} TET 2026 papers. You'll keep these {{ freePapersCount }} free papers either way, and can subscribe for ₹199 / month to practice the remaining {{ lockedPapersCount }}.</p>
            </div>
          </div>
          <div class="paywall-actions">
            <button type="button" class="btn-primary" (click)="goCreateAccount()">Create Account</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      h2 { color: #2c4870; display: flex; align-items: center; gap: 0.6rem; }
      .new-badge {
        background: #c97c1f; color: white; font-size: 0.65rem; font-weight: 700;
        letter-spacing: 0.04em; padding: 0.15rem 0.5rem; border-radius: 999px; vertical-align: middle;
      }
      .intro { color: #555; margin-top: -0.5rem; margin-bottom: 1.2rem; max-width: 65ch; }
      .unlock-banner {
        display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.6rem;
        background: linear-gradient(90deg, #fff4e6, #fff);
        border: 1px solid #f0c98a;
        border-radius: 8px;
        padding: 0.7rem 1rem;
        margin-bottom: 1.2rem;
        font-size: 0.9rem;
        color: #6b4a1a;
      }
      .unlock-banner button {
        background: #c97c1f; color: white; border: none; border-radius: 6px;
        padding: 0.45rem 0.9rem; cursor: pointer; font-weight: 600; font-size: 0.85rem;
      }
      .lang-toggle { display: flex; align-items: center; flex-wrap: wrap; gap: 0.5rem 0.8rem; margin-bottom: 1rem; }
      .lang-toggle button {
        padding: 0.4rem 1rem;
        border-radius: 999px;
        border: 1px solid #ccc;
        background: #fafafa;
        cursor: pointer;
        font-size: 0.9rem;
      }
      .lang-toggle button.active { background: #2c4870; border-color: #2c4870; color: white; }
      .lang-note { font-size: 0.8rem; color: #888; }

      /* Paper picker grid — same look as the Grand Test / MockTest paper
         picker (grand-test.component.ts's .paper-list/.paper-card), so
         the two "choose a paper" screens in the app feel like one design. */
      .paper-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; }
      .paper-card {
        background: white; padding: 1rem 1.1rem; border-radius: 10px; box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        cursor: pointer; border: 1px solid transparent; transition: border-color 0.15s;
      }
      .paper-card:hover { border-color: #2c4870; }
      .paper-card.locked-card { opacity: 0.75; }
      .paper-card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.4rem; }
      .paper-num { font-size: 0.75rem; font-weight: 700; color: #c97c1f; letter-spacing: 0.03em; }
      .lock-badge { font-size: 0.9rem; }
      .paper-name { font-weight: 600; color: #222; margin-bottom: 0.4rem; }
      .paper-meta { font-size: 0.82rem; color: #666; }
      .paper-meta.locked-meta { color: #b3261e; }

      .back-link { background: none; border: none; color: #2c4870; cursor: pointer; font-size: 0.85rem; padding: 0; margin-bottom: 0.8rem; }

      .filter-row { display: flex; align-items: center; flex-wrap: wrap; gap: 0.6rem 1rem; margin-bottom: 1.2rem; }
      .filter-row select { padding: 0.4rem 0.6rem; border-radius: 6px; border: 1px solid #ccc; max-width: 100%; }
      .questions { display: flex; flex-direction: column; gap: 1rem; }
      .q-card { background: white; padding: 1rem 1.2rem; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
      .subject-tag { display: inline-block; font-size: 0.75rem; color: #c97c1f; font-weight: 600; margin-bottom: 0.4rem; }
      .en-only-tag {
        margin-left: 0.5rem;
        font-size: 0.7rem;
        color: #888;
        font-weight: 500;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 0.05rem 0.4rem;
      }
      .question-text { font-weight: 600; color: #222; margin-bottom: 0.7rem; }
      .question-text-te { font-weight: 600; color: #444; margin-top: 0.35rem; font-size: 0.95em; }
      .options { display: flex; flex-direction: column; gap: 0.5rem; }
      .options button {
        text-align: left;
        padding: 0.55rem 0.8rem;
        border: 1px solid #ddd;
        border-radius: 6px;
        background: #fafafa;
        cursor: pointer;
        font-size: 0.95rem;
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
      }
      .options button .opt-te { color: #555; font-size: 0.9em; }
      .options button:disabled { cursor: default; }
      .options button.selected { border-color: #2c4870; }
      /* Bright, unambiguous feedback colors — easy to spot at a glance,
         rather than the earlier muted pastel greens/reds. */
      .options button.correct {
        background: #16a34a;
        border-color: #15803d;
        color: white;
      }
      .options button.correct .opt-te { color: #eafff0; }
      .options button.incorrect {
        background: #dc2626;
        border-color: #b91c1c;
        color: white;
      }
      .options button.incorrect .opt-te { color: #ffe9e9; }
      .answer-note { margin-top: 0.7rem; font-size: 0.9rem; font-weight: 700; }
      .answer-note .correct-text { color: #16a34a; }
      .answer-note .incorrect-text { color: #dc2626; }
      .source { margin-top: 0.6rem; font-size: 0.75rem; color: #999; }

      /* Paywall popup */
      .paywall-overlay {
        position: fixed; inset: 0; background: rgba(20, 20, 20, 0.55);
        display: flex; align-items: center; justify-content: center;
        padding: 1rem; z-index: 1000;
      }
      .paywall-modal {
        background: white; border-radius: 14px; overflow: hidden;
        width: 100%; max-width: 480px; box-shadow: 0 12px 40px rgba(0,0,0,0.25);
      }
      .paywall-header {
        background: linear-gradient(90deg, #f7931e, #e8632c);
        padding: 1.4rem 1.5rem;
        display: flex; align-items: flex-start; justify-content: space-between;
        gap: 1rem;
      }
      .paywall-header h2 { color: #1a1a1a; margin: 0; font-size: 1.35rem; }
      .paywall-subtitle { margin: 0.2rem 0 0; color: #1f3a8f; font-weight: 700; font-size: 0.8rem; letter-spacing: 0.02em; }
      .close-btn {
        background: white; border: none; border-radius: 999px; width: 2rem; height: 2rem;
        flex-shrink: 0; cursor: pointer; font-size: 1rem; color: #333;
        display: flex; align-items: center; justify-content: center;
      }
      .paywall-body { padding: 1.4rem 1.5rem 1.6rem; }
      .notice-box {
        display: flex; gap: 0.8rem; background: #eef6fd; border: 1px solid #cfe6f7;
        border-radius: 10px; padding: 1rem 1.1rem; margin-bottom: 1.2rem;
      }
      .notice-icon { font-size: 1.4rem; line-height: 1; }
      .notice-text h3 { margin: 0 0 0.4rem; color: #14306b; font-size: 1rem; display: flex; align-items: center; gap: 0.5rem; }
      .notice-text p { margin: 0; color: #333; font-size: 0.9rem; line-height: 1.4; }
      .paywall-actions { display: flex; gap: 0.7rem; flex-wrap: wrap; }
      .btn-primary, .btn-secondary {
        flex: 1; text-align: center; padding: 0.65rem 1rem; border-radius: 8px; font-weight: 700;
        font-size: 0.9rem; cursor: pointer; border: none; text-decoration: none; min-width: 140px;
      }
      .btn-primary { background: #2563eb; color: white; }
      .btn-primary:disabled { opacity: 0.6; cursor: default; }
      .btn-secondary { background: #eef1f6; color: #2c4870; }
      .paywall-note { margin: 0.8rem 0 0; font-size: 0.78rem; color: #777; text-align: center; }
      .paywall-error { margin: 0.8rem 0 0; font-size: 0.85rem; color: #b3261e; text-align: center; }

      /* Mobile-first: full-width and centered by default so it's a big,
         comfortable tap target on a phone; from 640px up it shrinks back
         to a compact button pushed to the right of the filter row. */
      .print-btn {
        background: #2c4870; color: white; border: none; border-radius: 6px;
        padding: 0.7rem 1.1rem; font-size: 0.9rem; font-weight: 700; cursor: pointer;
        display: flex; align-items: center; justify-content: center; gap: 0.5rem;
        width: 100%;
      }
      @media (min-width: 640px) {
        .print-btn { width: auto; margin-left: auto; }
      }
      .print-btn .print-icon { font-size: 1.05rem; line-height: 1; }
      .print-btn .print-label { display: flex; flex-direction: column; align-items: flex-start; line-height: 1.2; }
      .print-btn .btn-te { font-size: 0.72em; font-weight: 500; opacity: 0.85; }

      /* Print / "Save as PDF" support, triggered by the Download/Print
         button above (printPaper() -> window.print()). Hides everything
         on this page that's only useful on-screen — the intro copy, the
         unlock banner, the language toggle, the paper picker grid, the
         back link, the subject filter row (including the button itself),
         and any open paywall popup — so only the actual question-and-
         answer cards print. Matching rules in shell.component.ts hide the
         app header/nav/footer. */
      @media print {
        h2, .intro, .unlock-banner, .lang-toggle, .paper-list, .back-link,
        .filter-row, .paywall-overlay {
          display: none !important;
        }
        .q-card {
          box-shadow: none !important;
          border: 1px solid #ccc;
          break-inside: avoid;
          page-break-inside: avoid;
        }
        .options button.correct, .options button.incorrect {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          color-adjust: exact;
        }
        .options button { cursor: default; }
      }
    `,
  ],
})
export class Tet2026Component implements OnInit {
  // Feature flag for the Download/Print (PDF) button — turned off for now
  // at the owner's request while the mobile "save as PDF" flow (especially
  // on iOS Safari, which has no direct "Save as PDF" destination) gets
  // reconsidered. The button, printPaper(), and the @media print rules are
  // all still here — flip this back to true to bring it back.
  showDownloadOption = false;
  stage: 'select' | 'view' = 'select';
  questions: TetQuestion[] = [];
  papers: Tet2026Paper[] = [];
  paperSummaries: PaperSummary[] = [];
  selectedPaper: PaperSummary | null = null;
  subscriptionActive = false;
  loading = true;
  selectedSubject = '';
  picked: Record<string, number> = {};
  lang: 'en' | 'te' = 'en';

  showPaywall = false;
  showCreateAccountPrompt = false;
  payingNow = false;
  paywallError = '';

  constructor(
    private tet: TetService,
    public auth: AuthService,
    private subscription: SubscriptionService
  ) {}

  ngOnInit(): void {
    this.load(true);
  }

  private load(autoOpenPaywall: boolean): void {
    this.loading = true;
    this.tet.list2026().subscribe({
      next: (res) => {
        this.questions = res.questions;
        this.papers = res.papers;
        this.subscriptionActive = res.subscription.active;

        const bySource = new Map<string, TetQuestion[]>();
        for (const q of res.questions) {
          if (!bySource.has(q.source)) bySource.set(q.source, []);
          bySource.get(q.source)!.push(q);
        }
        this.paperSummaries = res.papers
          .map((p) => {
            const qs = bySource.get(p.name) || [];
            return { name: p.name, free: p.free, locked: p.locked, questions: qs, total: qs.length };
          })
          // Free/unlocked papers first, so they're the ones people see and
          // try right away instead of being buried after the locked ones —
          // same ordering as the Grand Test / MockTest paper picker.
          .sort((a, b) => Number(a.locked) - Number(b.locked));

        // If a paper was already open (e.g. this reload came from
        // subscribe() unlocking new papers), refresh it in place so its
        // question list picks up anything newly unlocked.
        if (this.selectedPaper) {
          const refreshed = this.paperSummaries.find((p) => p.name === this.selectedPaper!.name);
          if (refreshed) this.selectedPaper = refreshed;
        }

        this.loading = false;
        // Nudge once per page load if there's paid content the user can't
        // see yet — but don't fight them if they already dismissed it. Skip
        // this for demo (teacher/parent) accounts: they can't subscribe as
        // themselves, so popping the Razorpay-flavoured notice on every
        // visit would just be confusing. They still get the simpler
        // "create an account" prompt, but only if they go looking for a
        // locked paper.
        if (autoOpenPaywall && this.lockedPapersCount > 0 && !this.subscriptionActive && !this.isSchoolAccount) {
          this.showPaywall = true;
        }
      },
      error: () => (this.loading = false),
    });
  }

  // Demo teacher/parent accounts get the 2 free papers forever, but can
  // never subscribe as themselves — the paywall UI steers them toward
  // creating their own account instead of showing them Razorpay at all.
  get isSchoolAccount(): boolean {
    const role = this.auth.user()?.role;
    return role === 'teacher' || role === 'parent';
  }

  get lockedPapersCount(): number {
    return this.papers.filter((p) => p.locked).length;
  }

  // Total official AP TET 2026 exam papers (SGT / Maths & Science / Social
  // Studies / Language papers) — deliberately excludes the separate
  // "practice question bank" papers (Mathematics/English/CDP/Telugu/APMF
  // Mathematics 2A etc.), which are always free and not part of this
  // "official papers" framing. Computed from whatever the backend actually
  // returns rather than hardcoded, so this stays correct as more official
  // papers are added later without needing a matching UI text change.
  get officialPapersCount(): number {
    return this.papers.filter((p) => p.name.startsWith('AP TET')).length;
  }

  get freePapersCount(): number {
    return this.officialPapersCount - this.lockedPapersCount;
  }

  get subjectsForSelected(): string[] {
    if (!this.selectedPaper) return [];
    return Array.from(new Set(this.selectedPaper.questions.map((q) => q.subject)));
  }

  get filteredQuestions(): TetQuestion[] {
    if (!this.selectedPaper) return [];
    return this.selectedPaper.questions.filter(
      (q) => !this.selectedSubject || q.subject === this.selectedSubject
    );
  }

  choosePaper(p: PaperSummary): void {
    if (p.locked) {
      this.openUpgradePrompt();
      return;
    }
    this.selectedPaper = p;
    this.selectedSubject = '';
    this.stage = 'view';
  }

  backToSelect(): void {
    this.stage = 'select';
    this.selectedPaper = null;
    this.selectedSubject = '';
  }

  // English options are always shown (this already holds the paper's only
  // language for the English/Telugu literature papers, since those never
  // get a translation column populated). When a Telugu translation exists,
  // it's shown alongside — not instead of — the English text, so learners
  // see both together rather than needing to toggle back and forth.
  optionsEn(q: TetQuestion): string[] {
    return [q.option_a, q.option_b, q.option_c, q.option_d];
  }

  optionsTe(q: TetQuestion): string[] | null {
    if (!q.option_a_te) return null;
    return [q.option_a_te!, q.option_b_te!, q.option_c_te!, q.option_d_te!];
  }

  pick(q: TetQuestion, optionNumber: number): void {
    if (this.picked[q.id]) return;
    this.picked[q.id] = optionNumber;
  }

  // Same "Save as PDF"-friendly approach as the other TET pages: stamp the
  // tab title with what's currently shown (selected paper + subject
  // filter) plus a to-the-second timestamp before printing, so the
  // browser's "Save as PDF" dialog pre-fills a unique, meaningful filename
  // instead of a generic one that has to be retyped by hand every time —
  // then restore the original title once the print dialog closes.
  printPaper(): void {
    const originalTitle = document.title;
    const paperLabel = (this.selectedPaper?.name || 'AllPapers').replace(/[^\w-]+/g, '_');
    const subjectLabel = (this.selectedSubject || 'AllSubjects').replace(/[^\w-]+/g, '_');
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    document.title = `VidyaBandham_2026_${paperLabel}_${subjectLabel}_${stamp}`;
    const restoreTitle = () => {
      document.title = originalTitle;
      window.removeEventListener('afterprint', restoreTitle);
    };
    window.addEventListener('afterprint', restoreTitle);
    window.print();
  }

  // Single entry point used by every "unlock" button on the page. Demo
  // accounts get the simple create-account prompt; everyone else gets the
  // existing Razorpay-flavoured paywall.
  openUpgradePrompt(): void {
    if (this.isSchoolAccount) {
      this.showCreateAccountPrompt = true;
    } else {
      this.openPaywall();
    }
  }

  openPaywall(): void {
    this.paywallError = '';
    this.showPaywall = true;
  }

  closePaywall(): void {
    this.showPaywall = false;
  }

  closeCreateAccountPrompt(): void {
    this.showCreateAccountPrompt = false;
  }

  // Logs the demo account out and sends them straight to the signup page —
  // they need their own account to ever unlock the rest of the papers.
  goCreateAccount(): void {
    this.auth.logout('/signup');
  }

  subscribe(): void {
    this.paywallError = '';
    this.payingNow = true;
    this.subscription.createOrder().subscribe({
      next: (order) => {
        const user = this.auth.user();
        this.subscription
          .openCheckout(order, { name: user?.name || '' })
          .then(() => {
            this.payingNow = false;
            this.showPaywall = false;
            this.load(false); // refresh so the unlocked papers show up immediately
          })
          .catch((err) => {
            this.payingNow = false;
            if (err?.message !== 'cancelled') {
              this.paywallError = 'Payment could not be completed. Please try again.';
            }
          });
      },
      error: () => {
        this.payingNow = false;
        this.paywallError = 'Could not start the payment. Please try again in a moment.';
      },
    });
  }
}
