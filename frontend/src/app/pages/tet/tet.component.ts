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

    <div class="lang-toggle">
      <button [class.active]="lang === 'en'" (click)="lang = 'en'" type="button">English</button>
      <button [class.active]="lang === 'te'" (click)="lang = 'te'" type="button">తెలుగు</button>
      <span class="lang-note" *ngIf="lang === 'te'">
        English is always tested in English on the real exam, so those questions stay in English below.
      </span>
    </div>

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
    </div>

    <p *ngIf="loading">Loading…</p>
    <p *ngIf="!loading && questions.length === 0">No TET questions added yet.</p>

    <div class="questions">
      <div class="q-card" *ngFor="let q of filteredQuestions">
        <div class="subject-tag">
          <span *ngIf="q.year">{{ q.year }} · </span>{{ q.subject }}
          <span class="en-only-tag" *ngIf="lang === 'te' && !q.question_te">English only</span>
        </div>
        <div class="question-text">{{ questionText(q) }}</div>
        <div class="options">
          <button
            *ngFor="let opt of optionsFor(q); let i = index"
            [class.selected]="picked[q.id] === i + 1"
            [class.correct]="picked[q.id] && i + 1 === q.correct_option"
            [class.incorrect]="picked[q.id] === i + 1 && i + 1 !== q.correct_option"
            [disabled]="!!picked[q.id]"
            (click)="pick(q, i + 1)"
          >
            {{ opt }}
          </button>
        </div>
        <div class="answer-note" *ngIf="picked[q.id]">
          <span *ngIf="picked[q.id] === q.correct_option">Correct!</span>
          <span *ngIf="picked[q.id] !== q.correct_option">
            Not quite — the correct answer is <strong>{{ optionsFor(q)[q.correct_option - 1] }}</strong>.
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
      .options { display: flex; flex-direction: column; gap: 0.5rem; }
      .options button {
        text-align: left;
        padding: 0.55rem 0.8rem;
        border: 1px solid #ddd;
        border-radius: 6px;
        background: #fafafa;
        cursor: pointer;
        font-size: 0.95rem;
      }
      .options button:disabled { cursor: default; }
      .options button.selected { border-color: #2c4870; }
      .options button.correct { background: #dcefe1; border-color: #2f7a3d; }
      .options button.incorrect { background: #fbe4e2; border-color: #b3261e; }
      .answer-note { margin-top: 0.7rem; font-size: 0.9rem; }
      .source { margin-top: 0.6rem; font-size: 0.75rem; color: #999; }
    `,
  ],
})
export class TetComponent implements OnInit {
  questions: TetQuestion[] = [];
  loading = true;
  selectedSubject = '';
  selectedYear = '';
  picked: Record<string, number> = {};
  lang: 'en' | 'te' = 'en';

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

  // Falls back to English whenever a Telugu translation isn't available for
  // this question (English-subject questions, by design — see README).
  questionText(q: TetQuestion): string {
    return this.lang === 'te' && q.question_te ? q.question_te : q.question;
  }

  optionsFor(q: TetQuestion): string[] {
    if (this.lang === 'te' && q.option_a_te) {
      return [q.option_a_te!, q.option_b_te!, q.option_c_te!, q.option_d_te!];
    }
    return [q.option_a, q.option_b, q.option_c, q.option_d];
  }

  pick(q: TetQuestion, optionNumber: number): void {
    if (this.picked[q.id]) return;
    this.picked[q.id] = optionNumber;
  }
}
