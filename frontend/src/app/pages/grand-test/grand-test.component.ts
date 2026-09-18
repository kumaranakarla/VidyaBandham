import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TetQuestion, TetService } from '../../services/tet.service';
import { AuthService } from '../../services/auth.service';
import { SubscriptionService } from '../../services/subscription.service';

type Stage = 'select' | 'setup' | 'testing' | 'result';

// A full official AP TET 2026 paper, packaged as one timed "Grand Test" —
// real exam conditions (correct subject-wise mix, a 2 hr 30 min clock) but
// with the instant right/wrong feedback the "2026 (New)" tab already gives
// per question, rather than withholding the score until the end. Reuses the
// exact same /api/tet-2026 data and paywall as Tet2026Component (see that
// file) — this is just a different way of taking the same 12 papers.
interface PaperSummary {
  name: string;
  free: boolean;
  locked: boolean;
  questions: TetQuestion[];
  subjects: { subject: string; count: number }[];
  total: number;
}

const TIME_LIMIT_SECONDS = 150 * 60; // 2 hrs 30 min, same as the real exam

@Component({
  selector: 'app-grand-test',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <h2>Grand Test <span class="new-badge">FULL EXAM</span></h2>
    <p class="intro">
      Take a complete official AP TET 2026 paper under real exam conditions — the correct subject-wise
      question mix, a real 2 hr 30 min clock, and instant right/wrong feedback on every question.
    </p>

    <p *ngIf="loading">Loading…</p>

    <!-- SELECT: pick which official paper to attempt -->
    <div class="paper-list" *ngIf="!loading && stage === 'select'">
      <div
        class="paper-card"
        *ngFor="let p of paperSummaries; let i = index"
        [class.locked-card]="p.locked"
        (click)="choosePaper(p, i)"
      >
        <div class="paper-card-head">
          <span class="paper-num">Grand Test {{ i + 1 }}</span>
          <span class="lock-badge" *ngIf="p.locked">🔒</span>
        </div>
        <div class="paper-name">{{ p.name }}</div>
        <div class="paper-meta" *ngIf="!p.locked">{{ p.total }} questions · 2 hrs 30 min</div>
        <div class="paper-meta locked-meta" *ngIf="p.locked">Subscribe to unlock this paper</div>
      </div>
    </div>

    <!-- SETUP: real-exam-style summary before starting -->
    <div class="setup-card" *ngIf="stage === 'setup' && selectedPaper">
      <button class="back-link" type="button" *ngIf="!skipToFirstAvailable" (click)="backToSelect()">← Choose a different paper</button>
      <h3>{{ selectedPaper.name }}</h3>
      <div class="field">
        <label>Enter your name</label>
        <input type="text" [(ngModel)]="candidateName" placeholder="Enter your name" />
      </div>
      <table class="breakdown-table">
        <tbody>
          <tr *ngFor="let row of selectedPaper.subjects">
            <td>{{ row.subject }}</td>
            <td>{{ row.count }}</td>
          </tr>
          <tr class="total-row">
            <td>Total</td>
            <td>{{ selectedPaper.total }}</td>
          </tr>
          <tr>
            <td>Time Limit</td>
            <td>2 hrs 30 min</td>
          </tr>
        </tbody>
      </table>
      <button class="start-btn" (click)="startGrandTest()">Start Grand Test {{ selectedIndex + 1 }}</button>
      <p class="setup-note">
        Answer feedback shows immediately after each question. A few items are flagged where the
        source answer key was unclear — please verify those independently.
      </p>
    </div>

    <!-- TESTING: timed, with instant per-question feedback -->
    <div class="testing" *ngIf="stage === 'testing' && selectedPaper">
      <div class="timer-bar" [class.timer-warning]="timeLeftSeconds < 300">
        <span class="timer-label">Time Left</span>
        <span class="timer-value">{{ timeLeftDisplay }}</span>
        <span class="progress-label">{{ answeredCount }} of {{ selectedPaper.total }} answered</span>
        <button class="finish-btn" (click)="finishGrandTest()">Finish Grand Test</button>
      </div>

      <div class="questions">
        <div class="q-card" *ngFor="let q of selectedPaper.questions; let qi = index">
          <div class="subject-tag">
            Q{{ qi + 1 }} · {{ q.subject }}
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
        </div>
      </div>

      <button class="finish-btn-bottom" (click)="finishGrandTest()">Finish Grand Test</button>
    </div>

    <!-- RESULT -->
    <div class="result" *ngIf="stage === 'result'">
      <div class="score-card">
        <div class="score-number">{{ scoreSummary.percent }}%</div>
        <div class="score-sub">{{ scoreSummary.correct }} correct out of {{ scoreSummary.total }}</div>
      </div>
      <div class="subject-breakdown">
        <h3>Subject-wise score</h3>
        <table>
          <thead>
            <tr><th>Subject</th><th>Correct</th><th>Total</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let s of scoreSummary.bySubject">
              <td>{{ s.subject }}</td>
              <td>{{ s.correct }}</td>
              <td>{{ s.total }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="result-actions">
        <button class="start-btn" (click)="retakeSamePaper()">Retake this Grand Test</button>
        <button class="cancel-btn" *ngIf="!skipToFirstAvailable" (click)="chooseAnother()">Choose another paper</button>
      </div>
    </div>

    <!-- Paywall popup — identical pattern to the 2026 (New) page -->
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
              <h3>Unlock all 12 Grand Tests <span class="new-badge">NEW</span></h3>
              <p>
                2 papers (Maths &amp; Science) are free, forever. Subscribe for
                <strong>₹299 / month</strong> to take the remaining 10 as full Grand Tests too.
              </p>
            </div>
          </div>
          <div class="paywall-actions" *ngIf="!auth.user()">
            <a routerLink="/signup" class="btn-primary" (click)="closePaywall()">Register free</a>
            <a routerLink="/login" class="btn-secondary" (click)="closePaywall()">Log in</a>
          </div>
          <div class="paywall-actions" *ngIf="auth.user() && !subscriptionActive">
            <button type="button" class="btn-primary" (click)="subscribe()" [disabled]="payingNow">
              {{ payingNow ? 'Opening payment…' : 'Subscribe — ₹299 / month' }}
            </button>
          </div>
          <p class="paywall-note" *ngIf="auth.user() && !subscriptionActive">
            Signed in as {{ auth.user()?.name }}. Payment is handled securely by Razorpay.
          </p>
          <p class="paywall-error" *ngIf="paywallError">{{ paywallError }}</p>
        </div>
      </div>
    </div>

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
              <h3>Unlock all 12 Grand Tests <span class="new-badge">NEW</span></h3>
              <p>Create an account to unlock all 12 papers as Grand Tests. You'll keep 2 free papers either way, and can subscribe for ₹299 / month to unlock the rest.</p>
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

      .setup-card { background: white; padding: 1.4rem 1.5rem; border-radius: 10px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); max-width: 480px; }
      .back-link { background: none; border: none; color: #2c4870; cursor: pointer; font-size: 0.85rem; padding: 0; margin-bottom: 0.8rem; }
      .setup-card h3 { margin: 0 0 1rem; color: #2c4870; }
      .field { margin-bottom: 1rem; display: flex; flex-direction: column; gap: 0.3rem; }
      .field label { font-size: 0.85rem; color: #555; }
      .field input { padding: 0.55rem 0.7rem; border-radius: 6px; border: 1px solid #ccc; font-size: 0.95rem; }
      .breakdown-table { width: 100%; border-collapse: collapse; margin-bottom: 1.2rem; font-size: 0.92rem; }
      .breakdown-table td { padding: 0.45rem 0.2rem; border-bottom: 1px solid #eee; color: #333; }
      .breakdown-table td:last-child { text-align: right; font-weight: 600; }
      .breakdown-table .total-row td { font-weight: 700; color: #2c4870; border-top: 2px solid #ddd; border-bottom: none; }
      .start-btn {
        background: #c97c1f; color: white; border: none; border-radius: 6px;
        padding: 0.7rem 1.3rem; font-size: 0.98rem; font-weight: 700; cursor: pointer; width: 100%;
      }
      .setup-note { font-size: 0.78rem; color: #888; margin-top: 0.9rem; line-height: 1.4; }

      .timer-bar {
        position: sticky; top: 0; z-index: 10;
        display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;
        background: #2c4870; color: white; padding: 0.7rem 1rem; border-radius: 8px; margin-bottom: 1rem;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      }
      .timer-bar.timer-warning { background: #b3261e; }
      .timer-label { font-size: 0.75rem; opacity: 0.85; }
      .timer-value { font-size: 1.3rem; font-weight: 700; font-variant-numeric: tabular-nums; }
      .progress-label { font-size: 0.82rem; opacity: 0.9; margin-left: auto; }
      .finish-btn, .finish-btn-bottom {
        background: white; color: #2c4870; border: none; border-radius: 6px;
        padding: 0.45rem 0.9rem; font-weight: 700; font-size: 0.85rem; cursor: pointer;
      }
      .finish-btn-bottom { margin-top: 1.2rem; padding: 0.7rem 1.4rem; font-size: 0.95rem; }

      .questions { display: flex; flex-direction: column; gap: 1rem; }
      .q-card { background: white; padding: 1rem 1.2rem; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
      .subject-tag { display: inline-block; font-size: 0.75rem; color: #c97c1f; font-weight: 600; margin-bottom: 0.4rem; }
      .en-only-tag {
        margin-left: 0.5rem; font-size: 0.7rem; color: #888; font-weight: 500;
        border: 1px solid #ddd; border-radius: 4px; padding: 0.05rem 0.4rem;
      }
      .question-text { font-weight: 600; color: #222; margin-bottom: 0.7rem; }
      .question-text-te { font-weight: 600; color: #444; margin-top: 0.35rem; font-size: 0.95em; }
      .options { display: flex; flex-direction: column; gap: 0.5rem; }
      .options button {
        text-align: left; padding: 0.55rem 0.8rem; border: 1px solid #ddd; border-radius: 6px;
        background: #fafafa; cursor: pointer; font-size: 0.95rem;
        display: flex; flex-direction: column; gap: 0.15rem;
      }
      .options button .opt-te { color: #555; font-size: 0.9em; }
      .options button:disabled { cursor: default; }
      .options button.selected { border-color: #2c4870; }
      .options button.correct { background: #16a34a; border-color: #15803d; color: white; border-width: 2px; }
      .options button.correct .opt-te { color: #eafff0; }
      .options button.incorrect { background: #dc2626; border-color: #b91c1c; color: white; border-width: 2px; }
      .options button.incorrect .opt-te { color: #ffe9e9; }
      .answer-note { margin-top: 0.7rem; font-size: 0.9rem; font-weight: 700; }
      .answer-note .correct-text { color: #16a34a; }
      .answer-note .incorrect-text { color: #dc2626; }

      .score-card {
        background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        text-align: center; margin-bottom: 1.5rem;
      }
      .score-number { font-size: 2.5rem; font-weight: 700; color: #2c4870; }
      .score-sub { color: #555; margin: 0.3rem 0 1rem; }
      .subject-breakdown {
        background: white; padding: 1.2rem; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        margin-bottom: 1.5rem; overflow-x: auto;
      }
      .subject-breakdown h3 { font-size: 1rem; color: #2c4870; margin: 0 0 0.7rem; }
      .subject-breakdown table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
      .subject-breakdown th, .subject-breakdown td { text-align: left; padding: 0.4rem 0.6rem; border-bottom: 1px solid #eee; }
      .result-actions { display: flex; gap: 0.8rem; flex-wrap: wrap; }
      .result-actions .start-btn { width: auto; }
      .cancel-btn {
        background: transparent; color: #777; border: 1px solid #ccc; border-radius: 6px;
        padding: 0.7rem 1.4rem; font-size: 0.95rem; cursor: pointer;
      }

      /* Paywall popup — copied from the 2026 (New) page for a consistent look */
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
    `,
  ],
})
export class GrandTestComponent implements OnInit, OnDestroy {
  stage: Stage = 'select';
  loading = true;

  paperSummaries: PaperSummary[] = [];
  selectedPaper: PaperSummary | null = null;
  selectedIndex = 0;
  candidateName = '';

  picked: Record<string, number> = {};
  timeLeftSeconds = TIME_LIMIT_SECONDS;
  private timerHandle: ReturnType<typeof setInterval> | null = null;

  // /mock-test and /grand-test are two routes pointing at this same
  // component (see app.routes.ts). /grand-test always shows the full
  // 12-paper picker; /mock-test skips straight to the setup screen for
  // the first paper that isn't locked, so Mock Test stays a one-click
  // "take a test now" entry point rather than a picker.
  // Not private: the setup-screen template reads it to hide the
  // "Choose a different paper" link when Mock Test skipped the picker —
  // that link would otherwise be the only way back to the very list
  // Mock Test is supposed to bypass.
  skipToFirstAvailable = false;
  subscriptionActive = false;
  showPaywall = false;
  showCreateAccountPrompt = false;
  payingNow = false;
  paywallError = '';

  constructor(
    private tet: TetService,
    public auth: AuthService,
    private subscription: SubscriptionService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Left blank on purpose (not pre-filled from the logged-in account) —
    // matches the reference exam-format screen, where the candidate
    // types their own name in rather than seeing it already filled in.
    this.skipToFirstAvailable = this.route.snapshot.routeConfig?.path === 'mock-test';
    this.load();
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  private load(): void {
    this.loading = true;
    this.tet.list2026().subscribe({
      next: (res) => {
        this.subscriptionActive = res.subscription.active;
        const bySource = new Map<string, TetQuestion[]>();
        for (const q of res.questions) {
          if (!bySource.has(q.source)) bySource.set(q.source, []);
          bySource.get(q.source)!.push(q);
        }
        this.paperSummaries = res.papers.map((p) => {
          const qs = bySource.get(p.name) || [];
          const subjCounts = new Map<string, number>();
          for (const q of qs) subjCounts.set(q.subject, (subjCounts.get(q.subject) || 0) + 1);
          return {
            name: p.name,
            free: p.free,
            locked: p.locked,
            questions: qs,
            subjects: Array.from(subjCounts.entries()).map(([subject, count]) => ({ subject, count })),
            total: qs.length,
          };
        });
        this.loading = false;

        if (this.skipToFirstAvailable && this.stage === 'select') {
          const index = this.paperSummaries.findIndex((p) => !p.locked);
          if (index !== -1) {
            this.choosePaper(this.paperSummaries[index], index);
          }
        }
      },
      error: () => (this.loading = false),
    });
  }

  choosePaper(p: PaperSummary, i: number): void {
    if (p.locked) {
      this.openUpgradePrompt();
      return;
    }
    this.selectedPaper = p;
    this.selectedIndex = i;
    this.stage = 'setup';
  }

  backToSelect(): void {
    this.stage = 'select';
    this.selectedPaper = null;
  }

  startGrandTest(): void {
    if (!this.selectedPaper) return;
    this.picked = {};
    this.timeLeftSeconds = TIME_LIMIT_SECONDS;
    this.stage = 'testing';
    this.startTimer();
  }

  private startTimer(): void {
    this.stopTimer();
    this.timerHandle = setInterval(() => {
      this.timeLeftSeconds--;
      if (this.timeLeftSeconds <= 0) {
        this.timeLeftSeconds = 0;
        this.finishGrandTest();
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerHandle) {
      clearInterval(this.timerHandle);
      this.timerHandle = null;
    }
  }

  get timeLeftDisplay(): string {
    const h = Math.floor(this.timeLeftSeconds / 3600);
    const m = Math.floor((this.timeLeftSeconds % 3600) / 60);
    const s = this.timeLeftSeconds % 60;
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  get answeredCount(): number {
    return Object.keys(this.picked).length;
  }

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

  finishGrandTest(): void {
    this.stopTimer();
    this.stage = 'result';
  }

  get scoreSummary(): { correct: number; total: number; percent: number; bySubject: { subject: string; correct: number; total: number }[] } {
    if (!this.selectedPaper) return { correct: 0, total: 0, percent: 0, bySubject: [] };
    const qs = this.selectedPaper.questions;
    let correct = 0;
    const subjMap = new Map<string, { correct: number; total: number }>();
    for (const q of qs) {
      const entry = subjMap.get(q.subject) || { correct: 0, total: 0 };
      entry.total++;
      if (this.picked[q.id] === q.correct_option) {
        correct++;
        entry.correct++;
      }
      subjMap.set(q.subject, entry);
    }
    const total = qs.length;
    return {
      correct,
      total,
      percent: total ? Math.round((correct / total) * 100) : 0,
      bySubject: Array.from(subjMap.entries()).map(([subject, v]) => ({ subject, ...v })),
    };
  }

  retakeSamePaper(): void {
    this.startGrandTest();
  }

  chooseAnother(): void {
    this.stage = 'select';
    this.selectedPaper = null;
  }

  get isSchoolAccount(): boolean {
    const role = this.auth.user()?.role;
    return role === 'teacher' || role === 'parent';
  }

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
            this.load();
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
