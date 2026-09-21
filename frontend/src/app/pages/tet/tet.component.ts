import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TetQuestion, TetService } from '../../services/tet.service';

@Component({
  selector: 'app-tet',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h2>TET Prep</h2>
    <p class="intro">
      Practice questions from a real, previously published TET (Teacher Eligibility Test) paper —
      useful whether you're a teacher here or preparing for the exam yourself.
    </p>

    <div class="filter-row" *ngIf="subjects.length">
      <label>Year</label>
      <select [(ngModel)]="selectedYear">
        <option value="">All years</option>
        <option *ngFor="let y of years" [value]="y">{{ y }}</option>
      </select>
      <label>Subject</label>
      <select [(ngModel)]="selectedSubject">
        <option value="">All subjects</option>
        <option *ngFor="let s of subjects" [value]="s">{{ s }}</option>
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

    <p *ngIf="loading">Loading…</p>
    <p *ngIf="!loading && questions.length === 0">No TET questions added yet.</p>

    <div class="questions">
      <div class="q-card" *ngFor="let q of filteredQuestions">
        <div class="subject-tag">
          <span *ngIf="q.year">{{ q.year }} · </span>{{ q.subject }}
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
  `,
  styles: [
    `
      h2 { color: #2c4870; }
      .intro { color: #555; margin-top: -0.5rem; margin-bottom: 1.2rem; max-width: 60ch; }
      .filter-row { display: flex; align-items: center; flex-wrap: wrap; gap: 0.6rem 1rem; margin-bottom: 1.2rem; }
      .filter-row select { padding: 0.4rem 0.6rem; border-radius: 6px; border: 1px solid #ccc; }
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
      /* Bright, unambiguous feedback colors — matches the 2026 (New) paper and Mock Test pages. */
      .options button.correct { background: #16a34a; border-color: #15803d; color: white; border-width: 2px; }
      .options button.correct .opt-te { color: #eafff0; }
      .options button.incorrect { background: #dc2626; border-color: #b91c1c; color: white; border-width: 2px; }
      .options button.incorrect .opt-te { color: #ffe9e9; }
      .answer-note { margin-top: 0.7rem; font-size: 0.9rem; font-weight: 700; }
      .answer-note .correct-text { color: #16a34a; }
      .answer-note .incorrect-text { color: #dc2626; }
      .source { margin-top: 0.6rem; font-size: 0.75rem; color: #999; }

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
         button above (printPaper() -> window.print()). Hides the intro
         copy and the year/subject filter row (including the button
         itself) so only the actual question-and-answer cards print —
         whatever is currently shown, whether that's every year (the
         unfiltered landing view) or one selected year/subject. Matching
         rules in shell.component.ts hide the app header/nav/footer. */
      @media print {
        .intro, .filter-row {
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
export class TetComponent implements OnInit {
  // Feature flag for the Download/Print (PDF) button — turned off for now
  // at the owner's request while the mobile "save as PDF" flow (especially
  // on iOS Safari, which has no direct "Save as PDF" destination) gets
  // reconsidered. The button, printPaper(), and the @media print rules are
  // all still here — flip this back to true to bring it back.
  showDownloadOption = false;
  questions: TetQuestion[] = [];
  loading = true;
  selectedSubject = '';
  selectedYear = '';
  picked: Record<string, number> = {};

  constructor(private tet: TetService) {}

  ngOnInit(): void {
    this.loading = true;
    this.tet.list().subscribe({
      next: (res) => {
        this.questions = res.questions;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  get subjects(): string[] {
    return Array.from(new Set(this.questions.map((q) => q.subject)));
  }

  // Newest year first, so a growing question bank surfaces the latest exam by default.
  get years(): number[] {
    return Array.from(new Set(this.questions.map((q) => q.year).filter((y): y is number => !!y))).sort(
      (a, b) => b - a
    );
  }

  get filteredQuestions(): TetQuestion[] {
    return this.questions.filter((q) => {
      const subjectMatch = !this.selectedSubject || q.subject === this.selectedSubject;
      const yearMatch = !this.selectedYear || String(q.year) === String(this.selectedYear);
      return subjectMatch && yearMatch;
    });
  }

  // English options are always shown; when a Telugu translation exists it's
  // shown alongside — not instead of — the English text, so learners see
  // both together rather than needing to toggle back and forth.
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

  // Same "Save as PDF"-friendly approach as GrandTestComponent.printPaper():
  // stamp the tab title with what's currently shown (year + subject filter)
  // plus a to-the-second timestamp before printing, so the browser's
  // "Save as PDF" dialog pre-fills a unique, meaningful filename instead of
  // a generic one that has to be retyped by hand every time — then restore
  // the original title once the print dialog closes.
  printPaper(): void {
    const originalTitle = document.title;
    const yearLabel = this.selectedYear ? String(this.selectedYear) : 'AllYears';
    const subjectLabel = (this.selectedSubject || 'AllSubjects').replace(/[^\w-]+/g, '_');
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    document.title = `VidyaBandham_TET_${yearLabel}_${subjectLabel}_${stamp}`;
    const restoreTitle = () => {
      document.title = originalTitle;
      window.removeEventListener('afterprint', restoreTitle);
    };
    window.addEventListener('afterprint', restoreTitle);
    window.print();
  }
}
