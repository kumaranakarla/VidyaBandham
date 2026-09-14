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
        <div class="subject-tag">{{ q.subject }}</div>
        <div class="question-text">{{ q.question }}</div>
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
      .filter-row { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 1.2rem; }
      .filter-row select { padding: 0.4rem 0.6rem; border-radius: 6px; border: 1px solid #ccc; }
      .questions { display: flex; flex-direction: column; gap: 1rem; }
      .q-card { background: white; padding: 1rem 1.2rem; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
      .subject-tag { display: inline-block; font-size: 0.75rem; color: #c97c1f; font-weight: 600; margin-bottom: 0.4rem; }
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

  get filteredQuestions(): TetQuestion[] {
    if (!this.selectedSubject) return this.questions;
    return this.questions.filter((q) => q.subject === this.selectedSubject);
  }

  optionsFor(q: TetQuestion): string[] {
    return [q.option_a, q.option_b, q.option_c, q.option_d];
  }

  pick(q: TetQuestion, optionNumber: number): void {
    if (this.picked[q.id]) return;
    this.picked[q.id] = optionNumber;
  }
}
