import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LeapQuestion, LeapSubject, LeapService } from '../../services/leap.service';

// LEAP Q's & A's tab -- "TET 2026 Practice Set - Subject 2A" batch, 2,700
// questions across 6 subjects (English, Biology, Physical Science,
// Mathematics, CDP, Telugu Language). Deliberately its own
// route/component/service (see app.routes.ts, leap.service.ts), the same
// isolation pattern used for AppscComponent/Tet2026Component.
//
// Two stages only: pick a subject card -> practice that subject's
// questions, no timer, instant right/wrong feedback (mirrors
// AppscComponent's question-card UI, simplified since this batch has no
// group/year/paper nesting). Free for everyone who's logged in -- no
// paywall, unlike Tet2026Component.
//
// Two of the six subjects are monolingual by nature of the source paper:
// English (question/options only, no Telugu translation printed) and
// Telugu Language (Telugu only, no English at all -- the "position" field
// is what uniquely identifies each row there, since the printed number can
// genuinely repeat). mainQuestion()/mainOptions() and
// subQuestion()/subOptions() below handle showing whichever language(s)
// are actually present for a given row, instead of assuming both exist.
@Component({
  selector: 'app-leap',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h2>{{ lang === 'te' ? 'LEAP ప్రశ్నలు & జవాబులు' : "LEAP Q's & A's" }}</h2>

    <div class="lang-toggle">
      <button type="button" [class.active]="lang === 'en'" (click)="lang = 'en'">English</button>
      <button type="button" [class.active]="lang === 'te'" (click)="lang = 'te'">తెలుగు</button>
    </div>

    <!-- STAGE 1: pick a subject -->
    <ng-container *ngIf="stage === 'subjects'">
      <p class="intro" *ngIf="lang === 'en'">
        Free practice questions from "TET 2026 Practice Set – Subject 2A" — 2,700 real, verbatim
        questions transcribed from genuine exam-prep papers, in English and Telugu with answers,
        across six subjects. Open to everyone, no subscription needed.
      </p>
      <p class="intro" *ngIf="lang === 'te'">
        "TET 2026 ప్రాక్టీస్ సెట్ – సబ్జెక్టు 2A" నుండి ఉచిత ప్రాక్టీస్ ప్రశ్నలు — ఆరు సబ్జెక్టులలో
        2,700 అసలైన ప్రశ్నలు, ఆంగ్లం మరియు తెలుగులో, జవాబులతో సహా. అందరికీ ఉచితం.
      </p>

      <p *ngIf="loading">Loading…</p>

      <div class="group-grid">
        <div class="group-card" *ngFor="let s of subjects" (click)="chooseSubject(s)">
          <div class="group-name">{{ s.label }}</div>
          <div class="group-meta">{{ s.total }} {{ lang === 'te' ? 'ప్రశ్నలు' : 'questions' }}</div>
        </div>
      </div>
    </ng-container>

    <!-- STAGE 2: the selected subject's questions -->
    <ng-container *ngIf="stage === 'view' && selectedSubject">
      <button class="back-link" type="button" (click)="backToSubjects()">← {{ lang === 'te' ? 'అన్ని సబ్జెక్టులు' : 'All subjects' }}</button>
      <h3 class="stage-title">{{ selectedSubject.label }}</h3>

      <p *ngIf="selectedQuestions.length === 0">No questions found for this subject.</p>

      <div class="questions">
        <div class="q-card" *ngFor="let q of selectedQuestions">
          <div class="subject-tag">
            <span class="qnum" *ngIf="q.number">Q{{ q.number }}</span>
          </div>
          <div class="question-text">
            {{ mainQuestion(q) }}
            <div class="question-text-te" *ngIf="subQuestion(q)">{{ subQuestion(q) }}</div>
          </div>
          <div class="options">
            <button
              *ngFor="let opt of mainOptions(q); let i = index"
              [class.selected]="picked[q.id] === i + 1"
              [class.correct]="picked[q.id] && q.correct_option !== null && i + 1 === q.correct_option"
              [class.incorrect]="picked[q.id] === i + 1 && q.correct_option !== null && i + 1 !== q.correct_option"
              [disabled]="!!picked[q.id]"
              (click)="pick(q, i + 1)"
            >
              <span>{{ opt }}</span>
              <span class="opt-te" *ngIf="subOptions(q)">{{ subOptions(q)![i] }}</span>
            </button>
          </div>
          <div class="answer-note" *ngIf="picked[q.id] && q.correct_option !== null">
            <span class="correct-text" *ngIf="picked[q.id] === q.correct_option">Correct!</span>
            <span class="incorrect-text" *ngIf="picked[q.id] !== q.correct_option">
              Not quite — the correct answer is <strong>{{ mainOptions(q)![q.correct_option - 1] }}</strong><ng-container *ngIf="subOptions(q)"> (<strong>{{ subOptions(q)![q.correct_option - 1] }}</strong>)</ng-container>.
            </span>
          </div>
          <div class="source-note" *ngIf="q.note">{{ q.note }}</div>
        </div>
      </div>
    </ng-container>
  `,
  styles: [
    `
      h2 { color: #2c4870; display: flex; align-items: center; gap: 0.6rem; }
      .lang-toggle { display: flex; align-items: center; flex-wrap: wrap; gap: 0.5rem 0.8rem; margin-bottom: 1rem; }
      .lang-toggle button {
        padding: 0.4rem 1rem; border-radius: 999px; border: 1px solid #ccc;
        background: #fafafa; cursor: pointer; font-size: 0.9rem;
      }
      .lang-toggle button.active { background: #2c4870; border-color: #2c4870; color: white; }
      .intro { color: #555; margin-top: -0.3rem; margin-bottom: 1.2rem; max-width: 65ch; }
      .group-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; }
      .group-card {
        background: white; padding: 1rem 1.1rem; border-radius: 10px; cursor: pointer;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06); border: 1px solid transparent;
        transition: box-shadow 0.15s, border-color 0.15s;
      }
      .group-card:hover { box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); border-color: #c97c1f; }
      .group-name { font-weight: 700; color: #222; margin-bottom: 0.3rem; }
      .group-meta { font-size: 0.78rem; color: #c97c1f; margin-top: 0.5rem; font-weight: 600; }

      .back-link {
        background: none; border: none; color: #2c4870; cursor: pointer;
        font-size: 0.85rem; padding: 0; margin-bottom: 0.8rem; text-decoration: underline;
      }
      .stage-title { color: #2c4870; margin-top: 0; }

      .questions { display: flex; flex-direction: column; gap: 1rem; }
      .q-card {
        background: white; border-radius: 10px; padding: 1rem 1.2rem;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
      }
      .subject-tag { font-size: 0.75rem; font-weight: 700; color: #c97c1f; text-transform: uppercase; margin-bottom: 0.4rem; display: flex; gap: 0.5rem; align-items: center; min-height: 1rem; }
      .qnum { color: #999; font-weight: 500; text-transform: none; }
      .question-text { font-weight: 600; color: #222; margin-bottom: 0.7rem; white-space: pre-line; }
      .question-text-te { font-weight: 500; color: #444; margin-top: 0.3rem; white-space: pre-line; }
      .options { display: flex; flex-direction: column; gap: 0.45rem; }
      .options button {
        text-align: left; padding: 0.55rem 0.8rem; border-radius: 8px; border: 1px solid #ddd;
        background: #fafafa; cursor: pointer; display: flex; flex-direction: column; gap: 0.15rem;
      }
      .options button:disabled { cursor: default; }
      .options button.selected { border-color: #2c4870; }
      .options button.correct { background: #e3f6e8; border-color: #3a9d5a; }
      .options button.incorrect { background: #fdeaea; border-color: #c94444; }
      .opt-te { font-size: 0.82rem; color: #666; }
      .answer-note { margin-top: 0.6rem; font-size: 0.85rem; }
      .correct-text { color: #2a7a45; font-weight: 600; }
      .incorrect-text { color: #b23b3b; }
      .source-note { margin-top: 0.6rem; font-size: 0.75rem; color: #999; font-style: italic; }
    `,
  ],
})
export class LeapComponent implements OnInit {
  lang: 'en' | 'te' = 'en';
  loading = true;
  stage: 'subjects' | 'view' = 'subjects';

  allQuestions: LeapQuestion[] = [];
  subjects: LeapSubject[] = [];

  selectedSubject: LeapSubject | null = null;
  selectedQuestions: LeapQuestion[] = [];
  picked: Record<string, number> = {};

  constructor(private leapService: LeapService) {}

  ngOnInit() {
    this.leapService.list().subscribe({
      next: (res) => {
        this.allQuestions = res.questions;
        this.subjects = res.subjects;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  chooseSubject(s: LeapSubject) {
    this.selectedSubject = s;
    this.selectedQuestions = this.allQuestions
      .filter((q) => q.subject === s.key)
      .sort((a, b) => a.position - b.position);
    this.picked = {};
    this.stage = 'view';
  }

  backToSubjects() {
    this.stage = 'subjects';
    this.selectedSubject = null;
  }

  mainQuestion(q: LeapQuestion): string | null {
    return q.question || q.question_te || null;
  }

  subQuestion(q: LeapQuestion): string | null {
    return q.question && q.question_te ? q.question_te : null;
  }

  private optionsEn(q: LeapQuestion): string[] | null {
    return q.option_a != null ? [q.option_a, q.option_b || '', q.option_c || '', q.option_d || ''] : null;
  }

  private optionsTe(q: LeapQuestion): string[] | null {
    return q.option_a_te != null
      ? [q.option_a_te, q.option_b_te || '', q.option_c_te || '', q.option_d_te || '']
      : null;
  }

  mainOptions(q: LeapQuestion): string[] | null {
    return this.optionsEn(q) || this.optionsTe(q);
  }

  subOptions(q: LeapQuestion): string[] | null {
    const en = this.optionsEn(q);
    const te = this.optionsTe(q);
    return en && te ? te : null;
  }

  pick(q: LeapQuestion, choice: number) {
    if (this.picked[q.id]) return;
    this.picked[q.id] = choice;
  }
}
