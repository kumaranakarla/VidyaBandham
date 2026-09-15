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
        <label>Language</label>
        <div class="lang-toggle">
          <button type="button" [class.active]="lang === 'en'" (click)="lang = 'en'">English</button>
          <button type="button" [class.active]="lang === 'te'" (click)="lang = 'te'">తెలుగు</button>
        </div>
        <span class="lang-note" *ngIf="lang === 'te'">
          English-subject questions always stay in English, same as the real exam.
        </span>
        <span class="lang-note" *ngIf="lang === 'en'">
          Telugu-subject questions (language & literature) always stay in Telugu, same as the real exam.
        </span>
      </div>
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
            <span class="en-only-tag" *ngIf="lang === 'te' && !q.question_te">English only</span>
            <span class="en-only-tag" *ngIf="lang === 'en' && q.subject === 'Telugu'">Telugu only</span>
          </div>
          <div class="question-text">{{ questionText(q) }}</div>
          <div class="options">
            <button
              *ngFor="let opt of optionsFor(q); let oi = index"
              [class.selected]="answers[q.id] === oi + 1"
              (click)="select(q.id, oi + 1)"
            >
              {{ opt }}
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
            <span class="en-only-tag" *ngIf="lang === 'te' && !r.question_te">English only</span>
            <span class="en-only-tag" *ngIf="lang === 'en' && r.subject === 'Telugu'">Telugu only</span>
            <span class="badge" [class.badge-correct]="r.isCorrect" [class.badge-wrong]="!r.isCorrect && r.selected" [class.badge-blank]="!r.selected">
              {{ r.isCorrect ? '✓ Correct' : (r.selected ? '✗ Wrong answer' : 'Not answered') }}
            </span>
          </div>
          <div class="question-text">{{ questionTextResult(r) }}</div>
          <div class="options">
            <button
              *ngFor="let opt of optionsForResult(r); let oi = index"
              [class.correct]="oi + 1 === r.correct_option"
              [class.incorrect]="r.selected === oi + 1 && r.selected !== r.correct_option"
              disabled
            >
              {{ opt }}
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
      .lang-toggle { display: flex; gap: 0.5rem; }
      .lang-toggle button {
        padding: 0.4rem 1rem; border-radius: 999px; border: 1px solid #ccc;
        background: #fafafa; cursor: pointer; font-size: 0.9rem;
      }
      .lang-toggle button.active { background: #2c4870; border-color: #2c4870; color: white; }
      .lang-note { font-size: 0.78rem; color: #888; }
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
      .options { display: flex; flex-direction: column; gap: 0.5rem; }
      .options button {
        text-align: left; padding: 0.55rem 0.8rem; border: 1px solid #ddd; border-radius: 6px;
        background: #fafafa; cursor: pointer; font-size: 0.95rem;
      }
      .options button:disabled { cursor: default; }
      .options button.selected { border-color: #2c4870; background: #eef2f8; }
      .options button.correct { background: #dcefe1; border-color: #2f7a3d; }
      .options button.incorrect { background: #fbe4e2; border-color: #b3261e; }
      .answer-note { margin-top: 0.7rem; font-size: 0.9rem; color: #b3261e; }

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
      .answer-key .key-wrong { color: #b3261e; font-weight: 600; }
      .answer-key .key-correct { color: #2f7a3d; font-weight: 600; }

      .badge {
        display: inline-block; margin-left: 0.6rem; font-size: 0.72rem; font-weight: 700;
        padding: 0.12rem 0.55rem; border-radius: 999px; letter-spacing: 0.02em; vertical-align: middle;
      }
      .badge-correct { background: #dcefe1; color: #2f7a3d; }
      .badge-wrong { background: #fbe4e2; color: #b3261e; }
      .badge-blank { background: #eee; color: #777; }

      .answer-note-wrong { color: #b3261e; }
      .answer-note-correct { color: #2f7a3d; }
    `,
  ],
})
export class MockTestComponent implements OnInit {
  stage: Stage = 'setup';

  allQuestions: TetQuestion[] = [];
  years: number[] = [];
  subjects: string[] = [];
  lang: 'en' | 'te' = 'en';

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

  questionText(q: MockQuestion): string {
    return this.lang === 'te' && q.question_te ? q.question_te : q.question;
  }

  optionsFor(q: MockQuestion): string[] {
    if (this.lang === 'te' && q.option_a_te) {
      return [q.option_a_te!, q.option_b_te!, q.option_c_te!, q.option_d_te!];
    }
    return [q.option_a, q.option_b, q.option_c, q.option_d];
  }

  questionTextResult(r: MockSubmitResponse['results'][number]): string {
    return this.lang === 'te' && r.question_te ? r.question_te : r.question;
  }

  optionsForResult(r: MockSubmitResponse['results'][number]): string[] {
    if (this.lang === 'te' && r.option_a_te) {
      return [r.option_a_te!, r.option_b_te!, r.option_c_te!, r.option_d_te!];
    }
    return [r.option_a, r.option_b, r.option_c, r.option_d];
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
