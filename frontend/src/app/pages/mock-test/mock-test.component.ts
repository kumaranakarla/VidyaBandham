import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MockAnswer,
  MockAttempt,
  MockQuestion,
  MockSubmitResponse,
  TetQuestion,
  TetService,
} from '../../services/tet.service';

type Stage = 'setup' | 'testing' | 'result';

@Component({
  selector: 'app-mock-test',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h2>Mock Test</h2>
    <p class="intro">
      Take a timed-free practice test from the TET question bank and get an instant score —
      your result is saved to your own login, so you can track how you're improving over time.
    </p>

    <!-- SETUP -->
    <div class="setup-card" *ngIf="stage === 'setup'">
      <div class="field">
        <label>Year</label>
        <select [(ngModel)]="setupYear">
          <option value="">All years</option>
          <option *ngFor="let y of years" [value]="y">{{ y }}</option>
        </select>
      </div>
      <div class="field">
        <label>Subject</label>
        <select [(ngModel)]="setupSubject">
          <option value="">All subjects</option>
          <option *ngFor="let s of subjects" [value]="s">{{ s }}</option>
        </select>
      </div>
      <div class="field">
        <label>Number of questions</label>
        <select [(ngModel)]="setupCount">
          <option [value]="10">10</option>
          <option [value]="20">20</option>
          <option [value]="30">30</option>
          <option [value]="50">50</option>
        </select>
      </div>

      <button class="start-btn" (click)="startTest()" [disabled]="starting">
        {{ starting ? 'Preparing…' : 'Start Mock Test' }}
      </button>
      <p class="setup-error" *ngIf="setupError">{{ setupError }}</p>

      <div class="history" *ngIf="history.length">
        <h3>Your past attempts</h3>
        <table>
          <thead>
            <tr><th>Date</th><th>Year</th><th>Subject</th><th>Score</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let a of history">
              <td>{{ a.taken_at | date: 'medium' }}</td>
              <td>{{ a.year }}</td>
              <td>{{ a.subject }}</td>
              <td>{{ a.correct_answers }}/{{ a.total_questions }} ({{ a.score_percent }}%)</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- TESTING -->
    <div class="testing" *ngIf="stage === 'testing'">
      <div class="progress-row">
        <span>{{ answeredCount }} of {{ questions.length }} answered</span>
      </div>

      <div class="questions">
        <div class="q-card" *ngFor="let q of questions; let i = index">
          <div class="subject-tag">
            Q{{ i + 1 }} · {{ q.subject }}
            <span class="en-only-tag" *ngIf="!q.question_te && q.subject !== 'Telugu'">English only</span>
            <span class="en-only-tag" *ngIf="q.subject === 'Telugu'">Telugu only</span>
          </div>
          <div class="question-text">
            {{ q.question }}
            <div class="question-text-te" *ngIf="q.question_te">{{ q.question_te }}</div>
          </div>
          <div class="options">
            <button
              *ngFor="let opt of optionsEnOf(q); let oi = index"
              [class.selected]="answers[q.id] === oi + 1"
              (click)="select(q.id, oi + 1)"
            >
              <span>{{ opt }}</span>
              <span class="opt-te" *ngIf="optionsTeOf(q)">{{ optionsTeOf(q)![oi] }}</span>
            </button>
          </div>
        </div>
      </div>

      <div class="submit-row">
        <button class="submit-btn" (click)="submitTest()" [disabled]="submitting" [class.submitted]="submitting">
          {{ submitting ? 'Submitted — grading…' : 'Submit Test' }}
        </button>
        <button class="cancel-btn" (click)="cancelTest()" [disabled]="submitting">Cancel</button>
      </div>
      <p class="waking-note" *ngIf="submitting && showWakingNote">
        Still working — if the server has been idle a while it can take up to a minute to wake back up. Please wait,
        don't refresh the page.
      </p>
      <div class="submit-error" *ngIf="submitError">
        <p>{{ submitError }}</p>
        <button class="retry-btn" (click)="submitTest()">Try again</button>
      </div>
    </div>

    <!-- RESULT -->
    <div class="result" *ngIf="stage === 'result' && result">
      <div class="score-card">
        <div class="score-number">{{ result.percent }}%</div>
        <div class="score-sub">{{ result.correct }} correct out of {{ result.total }}</div>
        <button class="start-btn" (click)="backToSetup()">Take another test</button>
      </div>

      <div class="answer-key">
        <h3>Answer key</h3>
        <table>
          <thead>
            <tr><th>Q#</th><th>Your answer</th><th>Correct answer</th><th>Result</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of result.results; let i = index">
              <td>{{ i + 1 }}</td>
              <td [class.key-wrong]="!r.isCorrect && r.selected">
                {{ r.selected ? optionLetter(r.selected) : '—' }}
              </td>
              <td class="key-correct">{{ optionLetter(r.correct_option) }}</td>
              <td>
                <span class="badge" [class.badge-correct]="r.isCorrect" [class.badge-wrong]="!r.isCorrect && r.selected" [class.badge-blank]="!r.selected">
                  {{ r.isCorrect ? 'Correct' : (r.selected ? 'Wrong' : 'Blank') }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="questions">
        <div class="q-card" *ngFor="let r of result.results; let i = index">
          <div class="subject-tag">
            Q{{ i + 1 }} · {{ r.subject }}
            <span class="en-only-tag" *ngIf="!r.question_te && r.subject !== 'Telugu'">English only</span>
            <span class="en-only-tag" *ngIf="r.subject === 'Telugu'">Telugu only</span>
            <span class="badge" [class.badge-correct]="r.isCorrect" [class.badge-wrong]="!r.isCorrect && r.selected" [class.badge-blank]="!r.selected">
              {{ r.isCorrect ? '✓ Correct' : (r.selected ? '✗ Wrong answer' : 'Not answered') }}
            </span>
          </div>
          <div class="question-text">
            {{ r.question }}
            <div class="question-text-te" *ngIf="r.question_te">{{ r.question_te }}</div>
          </div>
          <div class="options">
            <button
              *ngFor="let opt of optionsEnOf(r); let oi = index"
              [class.correct]="oi + 1 === r.correct_option"
              [class.incorrect]="r.selected === oi + 1 && r.selected !== r.correct_option"
              disabled
            >
              <span>{{ opt }}</span>
              <span class="opt-te" *ngIf="optionsTeOf(r)">{{ optionsTeOf(r)![oi] }}</span>
            </button>
          </div>
          <div class="answer-note answer-note-wrong" *ngIf="!r.isCorrect && r.selected">
            Your answer ({{ optionLetter(r.selected) }}) was wrong — the correct answer is
            <strong>{{ optionLetter(r.correct_option) }}</strong>, shown in green above.
          </div>
          <div class="answer-note" *ngIf="!r.isCorrect && !r.selected">
            You left this one blank — the correct answer is
            <strong>{{ optionLetter(r.correct_option) }}</strong>, shown in green above.
          </div>
          <div class="answer-note answer-note-correct" *ngIf="r.isCorrect">
            Correct answer! You picked <strong>{{ optionLetter(r.selected!) }}</strong>.
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      h2 { color: #2c4870; }
      .intro { color: #555; margin-top: -0.5rem; margin-bottom: 1.2rem; max-width: 65ch; }

      .setup-card { background: white; padding: 1.2rem; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); max-width: 420px; }
      .field { margin-bottom: 0.9rem; display: flex; flex-direction: column; gap: 0.3rem; }
      .field label { font-size: 0.85rem; color: #555; }
      .field select { padding: 0.5rem 0.6rem; border-radius: 6px; border: 1px solid #ccc; }
      .en-only-tag {
        margin-left: 0.5rem; font-size: 0.7rem; color: #888; font-weight: 500;
        border: 1px solid #ddd; border-radius: 4px; padding: 0.05rem 0.4rem;
      }
      .start-btn {
        background: #c97c1f; color: white; border: none; border-radius: 6px;
        padding: 0.6rem 1.2rem; font-size: 0.95rem; cursor: pointer; margin-top: 0.4rem;
      }
      .start-btn:disabled { opacity: 0.6; cursor: default; }
      .setup-error { color: #b3261e; margin-top: 0.6rem; font-size: 0.9rem; }

      .history { margin-top: 1.5rem; }
      .history h3 { font-size: 1rem; color: #2c4870; margin-bottom: 0.5rem; }
      .history table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
      .history th, .history td { text-align: left; padding: 0.4rem 0.5rem; border-bottom: 1px solid #eee; }

      .progress-row { margin-bottom: 1rem; font-size: 0.9rem; color: #555; }

      .questions { display: flex; flex-direction: column; gap: 1rem; }
      .q-card { background: white; padding: 1rem 1.2rem; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
      .subject-tag { display: inline-block; font-size: 0.75rem; color: #c97c1f; font-weight: 600; margin-bottom: 0.4rem; }
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
      .options button.selected { border-color: #2c4870; background: #eef2f8; }
      /* Bright, unambiguous feedback colors — matches the 2026 (New) paper page,
         replacing the earlier muted pastel greens/reds. */
      .options button.correct { background: #16a34a; border-color: #15803d; color: white; border-width: 2px; }
      .options button.correct .opt-te { color: #eafff0; }
      .options button.incorrect { background: #dc2626; border-color: #b91c1c; color: white; border-width: 2px; }
      .options button.incorrect .opt-te { color: #ffe9e9; }
      .answer-note { margin-top: 0.7rem; font-size: 0.9rem; font-weight: 700; }

      .submit-row { display: flex; gap: 0.8rem; margin-top: 1.2rem; }
      .submit-btn {
        background: #2f7a3d; color: white; border: none; border-radius: 6px;
        padding: 0.7rem 1.4rem; font-size: 0.95rem; cursor: pointer;
      }
      .submit-btn:disabled { opacity: 0.6; cursor: default; }
      .submit-btn.submitted { background: #8a8f98; }
      .cancel-btn {
        background: transparent; color: #777; border: 1px solid #ccc; border-radius: 6px;
        padding: 0.7rem 1.4rem; font-size: 0.95rem; cursor: pointer;
      }

      .waking-note { margin-top: 0.7rem; font-size: 0.85rem; color: #886a1f; max-width: 50ch; }
      .submit-error {
        margin-top: 0.8rem; background: #fbe4e2; border: 1px solid #e3a29c; border-radius: 6px;
        padding: 0.8rem 1rem; max-width: 55ch;
      }
      .submit-error p { margin: 0 0 0.6rem; color: #7a241d; font-size: 0.9rem; }
      .retry-btn {
        background: #b3261e; color: white; border: none; border-radius: 6px;
        padding: 0.45rem 1rem; font-size: 0.88rem; cursor: pointer;
      }

      .score-card {
        background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        text-align: center; margin-bottom: 1.5rem;
      }
      .score-number { font-size: 2.5rem; font-weight: 700; color: #2c4870; }
      .score-sub { color: #555; margin: 0.3rem 0 1rem; }

      .answer-key {
        background: white; padding: 1.2rem; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        margin-bottom: 1.5rem; overflow-x: auto;
      }
      .answer-key h3 { font-size: 1rem; color: #2c4870; margin: 0 0 0.7rem; }
      .answer-key table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
      .answer-key th, .answer-key td { text-align: left; padding: 0.4rem 0.6rem; border-bottom: 1px solid #eee; }
      .answer-key .key-wrong { color: #dc2626; font-weight: 700; }
      .answer-key .key-correct { color: #16a34a; font-weight: 700; }

      .badge {
        display: inline-block; margin-left: 0.6rem; font-size: 0.72rem; font-weight: 700;
        padding: 0.12rem 0.55rem; border-radius: 999px; letter-spacing: 0.02em; vertical-align: middle;
      }
      .badge-correct { background: #16a34a; color: white; }
      .badge-wrong { background: #dc2626; color: white; }
      .badge-blank { background: #eee; color: #777; }

      .answer-note-wrong { color: #dc2626; }
      .answer-note-correct { color: #16a34a; }
    `,
  ],
})
export class MockTestComponent implements OnInit {
  stage: Stage = 'setup';

  allQuestions: TetQuestion[] = [];
  years: number[] = [];
  subjects: string[] = [];

  setupYear = '';
  setupSubject = '';
  setupCount = 20;
  starting = false;
  setupError = '';

  questions: MockQuestion[] = [];
  answers: Record<string, number | null> = {};
  submitting = false;
  submitError = '';
  showWakingNote = false;
  private wakingTimer: ReturnType<typeof setTimeout> | null = null;

  result: MockSubmitResponse | null = null;
  history: MockAttempt[] = [];

  constructor(private tet: TetService) {}

  ngOnInit(): void {
    this.tet.list().subscribe({
      next: (res) => {
        this.allQuestions = res.questions;
        this.years = Array.from(new Set(res.questions.map((q) => q.year).filter((y): y is number => !!y))).sort(
          (a, b) => b - a
        );
        this.subjects = Array.from(new Set(res.questions.map((q) => q.subject)));
      },
    });
    this.loadHistory();
  }

  loadHistory(): void {
    this.tet.mockHistory().subscribe({
      next: (res) => (this.history = res.attempts),
      error: () => {},
    });
  }

  get answeredCount(): number {
    return Object.values(this.answers).filter((v) => v !== null && v !== undefined).length;
  }

  // English text/options are always shown; when a Telugu translation exists
  // it's shown alongside — not instead of — the English text, so learners
  // see both together rather than needing to toggle back and forth. Works
  // for both the live question (MockQuestion) and a graded result row,
  // since both shapes carry the same question/option(_te) fields.
  optionsEnOf(x: { option_a: string; option_b: string; option_c: string; option_d: string }): string[] {
    return [x.option_a, x.option_b, x.option_c, x.option_d];
  }

  optionsTeOf(x: {
    option_a_te?: string | null;
    option_b_te?: string | null;
    option_c_te?: string | null;
    option_d_te?: string | null;
  }): string[] | null {
    if (!x.option_a_te) return null;
    return [x.option_a_te!, x.option_b_te!, x.option_c_te!, x.option_d_te!];
  }

  optionLetter(n: number | null | undefined): string {
    return n ? ['A', 'B', 'C', 'D'][n - 1] ?? '—' : '—';
  }

  select(questionId: string, optionNumber: number): void {
    this.answers[questionId] = optionNumber;
  }

  startTest(): void {
    this.starting = true;
    this.setupError = '';
    this.tet.startMock(this.setupYear, this.setupSubject, this.setupCount).subscribe({
      next: (res) => {
        this.starting = false;
        if (!res.questions.length) {
          this.setupError = 'No questions match that year/subject combination — try a broader filter.';
          return;
        }
        this.questions = res.questions;
        this.answers = {};
        this.questions.forEach((q) => (this.answers[q.id] = null));
        this.stage = 'testing';
      },
      error: () => {
        this.starting = false;
        this.setupError = 'Could not start the test. Please try again.';
      },
    });
  }

  submitTest(): void {
    this.submitting = true;
    this.submitError = '';
    this.showWakingNote = false;
    if (this.wakingTimer) clearTimeout(this.wakingTimer);
    this.wakingTimer = setTimeout(() => (this.showWakingNote = true), 5000);

    const answers: MockAnswer[] = this.questions.map((q) => ({ id: q.id, selected: this.answers[q.id] ?? null }));
    this.tet.submitMock(this.setupYear, this.setupSubject, answers).subscribe({
      next: (res) => {
        this.submitting = false;
        this.showWakingNote = false;
        if (this.wakingTimer) clearTimeout(this.wakingTimer);
        this.result = res;
        this.stage = 'result';
        this.loadHistory();
      },
      error: () => {
        this.submitting = false;
        this.showWakingNote = false;
        if (this.wakingTimer) clearTimeout(this.wakingTimer);
        this.submitError =
          "Couldn't submit your test — the server may be waking up or your connection dropped. Your answers are still here, so it's safe to try again.";
      },
    });
  }

  cancelTest(): void {
    this.stage = 'setup';
    this.questions = [];
    this.answers = {};
  }

  backToSetup(): void {
    this.stage = 'setup';
    this.result = null;
  }
}
