import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppscQuestion, AppscPaper, AppscService } from '../../services/appsc.service';

// One (group, year, paper) grouping with its questions attached -- same
// idea as PaperSummary in tet-2026.component.ts.
interface PaperSummary extends AppscPaper {
  questions: AppscQuestion[];
}

// APPSC (Andhra Pradesh Public Service Commission) Model Papers tab.
// Deliberately its own route/component/service (see app.routes.ts,
// appsc.service.ts), the same isolation pattern used for Tet2026Component,
// so this exam body can keep growing (more groups/years/papers) without
// touching the TET routes/components or school-management tabs at all.
//
// Three stages: pick a Group card -> pick a paper within that group (or see
// "not sourced yet" if none exist) -> practice that paper's questions, no
// timer, instant right/wrong feedback per question (mirrors Tet2026Component's
// question-card UI). No paywall here yet -- pricing/access for this content
// hasn't been decided (see the project plan doc), so every logged-in account
// gets full access for now.
@Component({
  selector: 'app-appsc',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h2>{{ lang === 'te' ? 'APPSC మోడల్ పేపర్లు' : 'APPSC Model Papers' }}</h2>

    <div class="lang-toggle">
      <button type="button" [class.active]="lang === 'en'" (click)="lang = 'en'">English</button>
      <button type="button" [class.active]="lang === 'te'" (click)="lang = 'te'">తెలుగు</button>
    </div>

    <!-- STAGE 1: pick a Group -->
    <ng-container *ngIf="stage === 'groups'">
      <p class="intro" *ngIf="lang === 'en'">
        Previous-year and model question papers for APPSC (Andhra Pradesh Public Service Commission)
        recruitment exams, organized by Group, year, and subject — the same way the TET tabs are
        organized by paper and year. Real, verbatim questions transcribed from genuine exam papers,
        including officially cancelled questions and any source-document anomalies, flagged rather
        than corrected.
      </p>
      <p class="intro" *ngIf="lang === 'te'">
        APPSC (ఆంధ్రప్రదేశ్ పబ్లిక్ సర్వీస్ కమిషన్) రిక్రూట్‌మెంట్ పరీక్షల మునుపటి సంవత్సరం మరియు మోడల్
        ప్రశ్నపత్రాలు, గ్రూప్, సంవత్సరం, మరియు సబ్జెక్టు వారీగా అమర్చబడతాయి.
      </p>

      <p *ngIf="loading">Loading…</p>

      <div class="group-grid">
        <div class="group-card" *ngFor="let g of groups" (click)="chooseGroup(g)">
          <div class="group-name">{{ g.name }}</div>
          <div class="group-desc">{{ lang === 'te' ? g.descTe : g.desc }}</div>
          <div class="group-meta" *ngIf="!loading">
            {{ papersForGroup(g.name).length }}
            {{ papersForGroup(g.name).length === 1 ? 'paper' : 'papers' }} available
          </div>
        </div>
      </div>
    </ng-container>

    <!-- STAGE 2: pick a paper within the chosen group -->
    <ng-container *ngIf="stage === 'papers' && selectedGroup">
      <button class="back-link" type="button" (click)="backToGroups()">← All groups</button>
      <h3 class="stage-title">{{ selectedGroup }}</h3>

      <p *ngIf="papersForGroup(selectedGroup).length === 0" class="empty-note">
        {{ lang === 'te' ? 'ఈ గ్రూప్ కోసం పేపర్లు ఇంకా అందుబాటులో లేవు.' : 'No papers sourced for this group yet — check back soon.' }}
      </p>

      <div class="paper-list" *ngIf="papersForGroup(selectedGroup).length">
        <div class="paper-card" *ngFor="let p of papersForGroup(selectedGroup)" (click)="choosePaper(p)">
          <div class="paper-name">{{ p.paper }} ({{ p.year }})</div>
          <div class="paper-meta">{{ p.total }} questions · {{ p.subjects.length }} sections</div>
        </div>
      </div>
    </ng-container>

    <!-- STAGE 3: the selected paper's questions -->
    <ng-container *ngIf="stage === 'view' && selectedPaper">
      <button class="back-link" type="button" (click)="backToPapers()">← Choose a different paper</button>
      <h3 class="stage-title">{{ selectedPaper.group }} — {{ selectedPaper.paper }} ({{ selectedPaper.year }})</h3>

      <div class="filter-row" *ngIf="selectedPaper.subjects.length">
        <label>{{ lang === 'te' ? 'విభాగం' : 'Section' }}</label>
        <select [(ngModel)]="selectedSubject">
          <option value="">{{ lang === 'te' ? 'అన్ని విభాగాలు' : 'All sections' }}</option>
          <option *ngFor="let s of selectedPaper.subjects" [value]="s">{{ s }}</option>
        </select>
      </div>

      <p *ngIf="filteredQuestions.length === 0">No questions match this filter.</p>

      <div class="questions">
        <div class="q-card" *ngFor="let q of filteredQuestions" [class.deleted-card]="q.deleted">
          <div class="subject-tag">
            {{ q.subject }} <span class="qnum" *ngIf="q.number">Q{{ q.number }}</span>
            <span class="deleted-tag" *ngIf="q.deleted">{{ lang === 'te' ? 'రద్దు చేయబడింది' : 'Question deleted by exam board' }}</span>
          </div>
          <div class="question-text">
            {{ q.question }}
            <div class="question-text-te" *ngIf="q.question_te">{{ q.question_te }}</div>
          </div>
          <div class="options" *ngIf="!q.deleted">
            <button
              *ngFor="let opt of optionsEn(q); let i = index"
              [class.selected]="picked[q.id] === i + 1"
              [class.correct]="picked[q.id] && q.correct_option !== null && i + 1 === q.correct_option"
              [class.incorrect]="picked[q.id] === i + 1 && q.correct_option !== null && i + 1 !== q.correct_option"
              [disabled]="!!picked[q.id]"
              (click)="pick(q, i + 1)"
            >
              <span>{{ opt }}</span>
              <span class="opt-te" *ngIf="optionsTe(q)">{{ optionsTe(q)![i] }}</span>
            </button>
          </div>
          <div class="answer-note" *ngIf="picked[q.id] && q.correct_option !== null">
            <span class="correct-text" *ngIf="picked[q.id] === q.correct_option">Correct!</span>
            <span class="incorrect-text" *ngIf="picked[q.id] !== q.correct_option">
              Not quite — the correct answer is <strong>{{ optionsEn(q)[q.correct_option - 1] }}</strong><ng-container *ngIf="optionsTe(q)"> (<strong>{{ optionsTe(q)![q.correct_option - 1] }}</strong>)</ng-container>.
            </span>
          </div>
          <div class="answer-note" *ngIf="picked[q.id] && q.correct_option === null && !q.deleted">
            <span class="ambiguous-text">
              {{ lang === 'te' ? 'ఈ ప్రశ్నకు మూల పరీక్షా పత్రంలోనే రెండు జవాబులు సరైనవిగా గుర్తించబడ్డాయి — నిశ్చయమైన కీ లేదు.' : 'The source answer key marks two options as correct for this question — no single confirmed answer.' }}
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
      .group-desc { font-size: 0.85rem; color: #666; }
      .group-meta { font-size: 0.78rem; color: #c97c1f; margin-top: 0.5rem; font-weight: 600; }

      .back-link {
        background: none; border: none; color: #2c4870; cursor: pointer;
        font-size: 0.85rem; padding: 0; margin-bottom: 0.8rem; text-decoration: underline;
      }
      .stage-title { color: #2c4870; margin-top: 0; }
      .empty-note { color: #777; }

      .paper-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; }
      .paper-card {
        background: white; padding: 1rem 1.1rem; border-radius: 10px; cursor: pointer;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06); border: 1px solid transparent;
      }
      .paper-card:hover { border-color: #c97c1f; }
      .paper-name { font-weight: 700; color: #222; margin-bottom: 0.3rem; }
      .paper-meta { font-size: 0.8rem; color: #666; }

      .filter-row { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 1rem; }
      .filter-row select { padding: 0.35rem 0.6rem; border-radius: 6px; border: 1px solid #ccc; }

      .questions { display: flex; flex-direction: column; gap: 1rem; }
      .q-card {
        background: white; border-radius: 10px; padding: 1rem 1.2rem;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
      }
      .q-card.deleted-card { opacity: 0.7; background: #fafafa; }
      .subject-tag { font-size: 0.75rem; font-weight: 700; color: #c97c1f; text-transform: uppercase; margin-bottom: 0.4rem; display: flex; gap: 0.5rem; align-items: center; }
      .qnum { color: #999; font-weight: 500; text-transform: none; }
      .deleted-tag {
        background: #eee; color: #888; font-size: 0.68rem; font-weight: 600;
        padding: 0.1rem 0.5rem; border-radius: 999px; text-transform: none;
      }
      .question-text { font-weight: 600; color: #222; margin-bottom: 0.7rem; }
      .question-text-te { font-weight: 500; color: #444; margin-top: 0.3rem; }
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
      .ambiguous-text { color: #8a6d1a; }
      .source-note { margin-top: 0.6rem; font-size: 0.75rem; color: #999; font-style: italic; }
    `,
  ],
})
export class AppscComponent implements OnInit {
  lang: 'en' | 'te' = 'en';
  loading = true;
  stage: 'groups' | 'papers' | 'view' = 'groups';

  allQuestions: AppscQuestion[] = [];
  allPapers: AppscPaper[] = [];

  selectedGroup: string | null = null;
  selectedPaper: PaperSummary | null = null;
  selectedSubject = '';
  picked: Record<string, number> = {};

  groups = [
    { name: 'Group-1', desc: 'Civil service posts (e.g. Deputy Collector, DSP) — prelims + mains.', descTe: 'పౌర సేవా పోస్టులు (ఉదా. డిప్యూటీ కలెక్టర్, DSP) — ప్రిలిమ్స్ + మెయిన్స్.' },
    { name: 'Group-2', desc: 'Executive & non-executive posts across departments.', descTe: 'వివిధ శాఖలలో ఎగ్జిక్యూటివ్ & నాన్-ఎగ్జిక్యూటివ్ పోస్టులు.' },
    { name: 'Group-3', desc: 'Panchayat Secretary and related posts.', descTe: 'పంచాయతీ సెక్రటరీ మరియు సంబంధిత పోస్టులు.' },
    { name: 'Group-4', desc: 'Junior Assistant and other junior-level posts.', descTe: 'జూనియర్ అసిస్టెంట్ మరియు ఇతర జూనియర్-స్థాయి పోస్టులు.' },
  ];

  constructor(private appscService: AppscService) {}

  ngOnInit() {
    this.appscService.list().subscribe({
      next: (res) => {
        this.allQuestions = res.questions;
        this.allPapers = res.papers;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  papersForGroup(groupName: string): AppscPaper[] {
    return this.allPapers.filter((p) => p.group === groupName);
  }

  chooseGroup(g: { name: string }) {
    this.selectedGroup = g.name;
    this.stage = 'papers';
  }

  backToGroups() {
    this.stage = 'groups';
    this.selectedGroup = null;
  }

  choosePaper(p: AppscPaper) {
    const questions = this.allQuestions.filter(
      (q) => q.exam_group === p.group && q.year === p.year && q.paper === p.paper
    );
    this.selectedPaper = { ...p, questions };
    this.selectedSubject = '';
    this.picked = {};
    this.stage = 'view';
  }

  backToPapers() {
    this.stage = 'papers';
    this.selectedPaper = null;
  }

  get filteredQuestions(): AppscQuestion[] {
    if (!this.selectedPaper) return [];
    if (!this.selectedSubject) return this.selectedPaper.questions;
    return this.selectedPaper.questions.filter((q) => q.subject === this.selectedSubject);
  }

  optionsEn(q: AppscQuestion): string[] {
    return [q.option_a, q.option_b, q.option_c, q.option_d];
  }

  optionsTe(q: AppscQuestion): string[] | null {
    if (!q.option_a_te) return null;
    return [q.option_a_te, q.option_b_te || '', q.option_c_te || '', q.option_d_te || ''];
  }

  pick(q: AppscQuestion, choice: number) {
    if (this.picked[q.id]) return;
    this.picked[q.id] = choice;
  }
}
