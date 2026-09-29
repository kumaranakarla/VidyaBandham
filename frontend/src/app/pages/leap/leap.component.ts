import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { LeapAnswerResult, LeapProgressRow, LeapQuestion, LeapSubject, LeapService } from '../../services/leap.service';

// Fisher-Yates shuffle -- same algorithm as tet.js's mock-test picker,
// ported to the frontend since LEAP's Practice Test mode builds its random
// set from the already-loaded question bank rather than a fresh API call.
function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface TestResultItem {
  q: LeapQuestion;
  selected: number | null;
  isCorrect: boolean | null; // null = skipped
}

interface TestResult {
  total: number;
  correct: number;
  wrong: number;
  skipped: number;
  percent: number;
  elapsedSeconds: number;
  items: TestResultItem[];
}

type Stage =
  | 'subjects'
  | 'subject-home'
  | 'practice'
  | 'goto-picker'
  | 'goto-question'
  | 'mistakes'
  | 'test-setup'
  | 'test'
  | 'test-result';

// LEAP Q's & A's tab -- "TET 2026 Practice Set - Subject 2A" batch, 2,700
// questions across 6 subjects. Free for everyone, no paywall.
//
// Modeled on tet.pyqs.in's practice flow (a reference site the project
// owner pointed at): per-subject progress dashboard, jump to any question
// number, a "my mistakes" review, and a timed random Practice Test -- but
// bilingual throughout (the reference site is English-only), and progress
// is saved against the student's real VidyaBandham login server-side
// (leap_progress table / routes/leap.js's /progress endpoints) rather than
// only on-device, so it follows them across phone/laptop.
//
// `progress` (keyed by leap_question_id) is the single source of truth for
// "is this question answered, and was it right" -- the practice list's
// "reveal the next question" behavior, the subject dashboard's counters,
// and the mistakes list are all *derived* from it rather than tracked
// separately, so they can never drift out of sync with each other.
//
// Retrying a wrong answer is allowed in practice/mistakes/goto (per the
// project owner's call) -- `retrying` tracks which question is currently
// re-open for a new attempt after "Try again", overriding the locked/graded
// view that `progress` would otherwise produce. Practice Test mode is
// deliberately NOT retryable (it's an exam simulation, not a study aid):
// answers there are held in `testAnswers` until Submit, graded all at once,
// and only then folded into `progress` via the same saveAnswer() calls.
@Component({
  selector: 'app-leap',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h2>{{ lang === 'te' ? "LEAP ప్రశ్నలు & జవాబులు" : "LEAP Q's & A's" }}</h2>

    <div class="lang-toggle">
      <button type="button" [class.active]="lang === 'en'" (click)="lang = 'en'">English</button>
      <button type="button" [class.active]="lang === 'te'" (click)="lang = 'te'">తెలుగు</button>
    </div>

    <p *ngIf="loading">Loading…</p>

    <!-- STAGE: subjects -->
    <ng-container *ngIf="!loading && stage === 'subjects'">
      <p class="intro" *ngIf="lang === 'en'">
        Free practice questions from "TET 2026 Practice Set – Subject 2A" — 2,700 real, verbatim
        questions transcribed from genuine exam-prep papers, in English and Telugu with answers,
        across six subjects. Open to everyone, no subscription needed. Your progress is saved to
        your account, so it follows you across devices.
      </p>
      <p class="intro" *ngIf="lang === 'te'">
        "TET 2026 ప్రాక్టీస్ సెట్ – సబ్జెక్టు 2A" నుండి ఉచిత ప్రాక్టీస్ ప్రశ్నలు — ఆరు సబ్జెక్టులలో
        2,700 అసలైన ప్రశ్నలు, ఆంగ్లం మరియు తెలుగులో, జవాబులతో సహా. అందరికీ ఉచితం. మీ పురోగతి మీ
        ఖాతాలో సేవ్ అవుతుంది, కాబట్టి ఇది మీతో అన్ని పరికరాలలో కొనసాగుతుంది.
      </p>

      <div class="group-grid">
        <div class="group-card" *ngFor="let s of subjects" (click)="openSubject(s)">
          <div class="group-name">{{ s.label }}</div>
          <div class="group-meta">{{ s.total }} {{ lang === 'te' ? 'ప్రశ్నలు' : 'questions' }}</div>
          <div class="group-progress" *ngIf="answeredCountFor(s) > 0">
            {{ answeredCountFor(s) }}/{{ s.total }} {{ lang === 'te' ? 'సమాధానమిచ్చారు' : 'answered' }}
          </div>
        </div>
      </div>
    </ng-container>

    <!-- STAGE: subject-home (dashboard) -->
    <ng-container *ngIf="!loading && stage === 'subject-home' && selectedSubject">
      <button class="back-link" type="button" (click)="backToSubjects()">← {{ lang === 'te' ? 'అన్ని సబ్జెక్టులు' : 'All subjects' }}</button>
      <h3 class="stage-title">{{ selectedSubject.label }}</h3>

      <div class="dashboard-card">
        <div class="ring" [style.background]="ringGradient(subjectPercent)">
          <div class="ring-inner">{{ subjectPercent }}%</div>
        </div>
        <div class="dashboard-stats">
          <div class="dashboard-count">
            <strong>{{ subjectAnswered }}</strong> / {{ subjectQuestions.length }}
            {{ lang === 'te' ? 'సమాధానమిచ్చారు' : 'answered' }}
          </div>
          <div class="chip-row">
            <span class="chip chip-correct">✓ {{ subjectCorrect }} {{ lang === 'te' ? 'సరైనవి' : 'correct' }}</span>
            <span class="chip chip-wrong">✕ {{ subjectWrong }} {{ lang === 'te' ? 'తప్పు' : 'wrong' }}</span>
          </div>
          <button class="primary-btn" type="button" (click)="stage = 'practice'">
            ▶ {{ subjectAnswered === 0 ? (lang === 'te' ? 'ప్రాక్టీస్ ప్రారంభించండి' : 'Start practice') : (lang === 'te' ? 'ప్రాక్టీస్ కొనసాగించండి' : 'Continue practice') }}
            · Q{{ nextPracticeNumber }}
          </button>
        </div>
      </div>

      <div class="option-list">
        <div class="option-row" (click)="openGotoPicker()">
          <div class="option-icon">▦</div>
          <div>
            <div class="option-title">{{ lang === 'te' ? 'ఒక ప్రశ్నకు వెళ్ళండి' : 'Go to a question' }}</div>
            <div class="option-sub">{{ lang === 'te' ? 'ఏదైనా ప్రశ్న సంఖ్యను ఎంచుకోండి' : 'Pick any question number' }}</div>
          </div>
        </div>
        <div class="option-row" [class.disabled]="subjectWrong === 0" (click)="openMistakes()">
          <div class="option-icon">↺</div>
          <div>
            <div class="option-title">{{ lang === 'te' ? 'నా తప్పులు సమీక్షించండి' : 'Review my mistakes' }}</div>
            <div class="option-sub">
              {{ subjectWrong === 0 ? (lang === 'te' ? 'ఇప్పటివరకు తప్పులు లేవు' : 'No mistakes so far') : (subjectWrong + ' ' + (lang === 'te' ? 'తప్పుగా సమాధానమిచ్చారు' : 'answered wrongly')) }}
            </div>
          </div>
        </div>
        <div class="option-row" (click)="stage = 'test-setup'">
          <div class="option-icon">⏱</div>
          <div>
            <div class="option-title">{{ lang === 'te' ? 'ప్రాక్టీస్ టెస్ట్' : 'Practice test' }}</div>
            <div class="option-sub">{{ lang === 'te' ? 'యాదృచ్ఛిక ప్రశ్నలు, చివరిలో స్కోరు' : 'Random questions, score at the end' }}</div>
          </div>
        </div>
      </div>

      <button class="clear-link" type="button" *ngIf="subjectAnswered > 0" (click)="clearSubjectProgress()">
        {{ lang === 'te' ? 'ఈ సబ్జెక్టు జవాబులు తొలగించండి' : 'Clear answers for this subject' }}
      </button>
    </ng-container>

    <!-- STAGE: practice (accumulating sequential list) -->
    <ng-container *ngIf="!loading && stage === 'practice' && selectedSubject">
      <button class="back-link" type="button" (click)="stage = 'subject-home'">← {{ selectedSubject.label }}</button>
      <div class="progress-line">{{ subjectAnswered }} / {{ subjectQuestions.length }} {{ lang === 'te' ? 'సమాధానమిచ్చారు' : 'answered' }}</div>

      <p class="all-done-note" *ngIf="allAnsweredInSubject">
        {{ lang === 'te' ? 'ఈ సబ్జెక్టులో అన్ని ప్రశ్నలకు సమాధానమిచ్చారు. మీరు మళ్ళీ ప్రయత్నించవచ్చు.' : "You've answered every question in this subject. Feel free to retry any of them." }}
      </p>

      <div class="questions">
        <ng-container *ngFor="let q of visiblePracticeQuestions">
          <ng-container *ngTemplateOutlet="questionCard; context: { q: q, interactive: true }"></ng-container>
        </ng-container>
      </div>
    </ng-container>

    <!-- STAGE: mistakes -->
    <ng-container *ngIf="!loading && stage === 'mistakes' && selectedSubject">
      <button class="back-link" type="button" (click)="stage = 'subject-home'">← {{ selectedSubject.label }}</button>
      <h3 class="stage-title">{{ lang === 'te' ? 'నా తప్పులు' : 'My mistakes' }}</h3>

      <p *ngIf="mistakeQuestions.length === 0">{{ lang === 'te' ? 'తప్పులు లేవు — బాగా చేస్తున్నారు!' : "No mistakes — you're doing great!" }}</p>

      <div class="questions">
        <ng-container *ngFor="let q of mistakeQuestions">
          <ng-container *ngTemplateOutlet="questionCard; context: { q: q, interactive: true }"></ng-container>
        </ng-container>
      </div>
    </ng-container>

    <!-- STAGE: goto-picker -->
    <ng-container *ngIf="!loading && stage === 'goto-picker' && selectedSubject">
      <button class="back-link" type="button" (click)="stage = 'subject-home'">← {{ selectedSubject.label }}</button>
      <h3 class="stage-title">{{ lang === 'te' ? 'ఒక ప్రశ్నకు వెళ్ళండి' : 'Go to a question' }}</h3>
      <div class="legend">
        <span class="legend-item"><span class="dot dot-correct"></span>{{ lang === 'te' ? 'సరైనది' : 'Correct' }}</span>
        <span class="legend-item"><span class="dot dot-wrong"></span>{{ lang === 'te' ? 'తప్పు' : 'Wrong' }}</span>
        <span class="legend-item"><span class="dot dot-unanswered"></span>{{ lang === 'te' ? 'సమాధానం లేదు' : 'Unanswered' }}</span>
      </div>
      <div class="number-grid">
        <button
          type="button"
          class="number-btn"
          *ngFor="let q of subjectQuestions; let i = index"
          [class.num-correct]="progress[q.id]?.is_correct"
          [class.num-wrong]="progress[q.id] && !progress[q.id].is_correct"
          (click)="openGotoQuestion(i)"
        >{{ i + 1 }}</button>
      </div>
    </ng-container>

    <!-- STAGE: goto-question -->
    <ng-container *ngIf="!loading && stage === 'goto-question' && selectedSubject && gotoIndex !== null">
      <button class="back-link" type="button" (click)="stage = 'goto-picker'">← {{ lang === 'te' ? 'అన్ని ప్రశ్నలు' : 'All questions' }}</button>
      <div class="goto-nav">
        <button type="button" [disabled]="gotoIndex === 0" (click)="stepGoto(-1)">‹ {{ lang === 'te' ? 'మునుపటి' : 'Prev' }}</button>
        <span>{{ gotoIndex + 1 }} / {{ subjectQuestions.length }}</span>
        <button type="button" [disabled]="gotoIndex === subjectQuestions.length - 1" (click)="stepGoto(1)">{{ lang === 'te' ? 'తదుపరి' : 'Next' }} ›</button>
      </div>
      <div class="questions">
        <ng-container *ngTemplateOutlet="questionCard; context: { q: subjectQuestions[gotoIndex], interactive: true }"></ng-container>
      </div>
    </ng-container>

    <!-- STAGE: test-setup -->
    <ng-container *ngIf="!loading && stage === 'test-setup' && selectedSubject">
      <button class="back-link" type="button" (click)="stage = 'subject-home'">← {{ selectedSubject.label }}</button>
      <h3 class="stage-title">{{ lang === 'te' ? 'ఎన్ని ప్రశ్నలు?' : 'How many questions?' }}</h3>
      <p class="intro">{{ lang === 'te' ? 'ప్రశ్నలు యాదృచ్ఛికంగా ఎంపిక చేయబడతాయి. సమర్పించినప్పుడు జవాబులు మరియు మీ స్కోరు చూపబడతాయి.' : 'Questions are picked at random. Answers and your score are shown when you submit.' }}</p>
      <div class="count-grid">
        <button type="button" class="count-btn" *ngFor="let c of testCountOptions" [disabled]="c > subjectQuestions.length" (click)="startTest(c)">
          {{ c }}<span>{{ lang === 'te' ? 'ప్రశ్నలు' : 'questions' }}</span>
        </button>
      </div>
    </ng-container>

    <!-- STAGE: test -->
    <ng-container *ngIf="!loading && stage === 'test' && selectedSubject">
      <div class="test-header">
        <span>{{ testAnsweredCount }} / {{ testQuestions.length }} {{ lang === 'te' ? 'సమాధానమిచ్చారు' : 'answered' }}</span>
        <span class="timer">{{ formattedTimer }}</span>
      </div>

      <div class="questions">
        <div class="q-card" *ngFor="let q of testQuestions; let i = index">
          <div class="subject-tag"><span class="qnum">Q{{ i + 1 }}</span></div>
          <div class="question-text">
            {{ mainQuestion(q) }}
            <div class="question-text-te" *ngIf="subQuestion(q)">{{ subQuestion(q) }}</div>
          </div>
          <div class="options">
            <button
              *ngFor="let opt of mainOptions(q); let oi = index"
              type="button"
              [class.selected]="testAnswers[q.id] === oi + 1"
              (click)="testAnswers[q.id] = oi + 1"
            >
              <span>{{ opt }}</span>
              <span class="opt-te" *ngIf="subOptions(q)">{{ subOptions(q)![oi] }}</span>
            </button>
          </div>
        </div>
      </div>

      <button class="submit-test-btn" type="button" (click)="confirmSubmitTest()">✓ {{ lang === 'te' ? 'టెస్ట్ సమర్పించండి' : 'Submit test' }}</button>
    </ng-container>

    <!-- STAGE: test-result -->
    <ng-container *ngIf="!loading && stage === 'test-result' && testResult">
      <h3 class="stage-title">{{ lang === 'te' ? 'టెస్ట్ ఫలితం' : 'Test result' }}</h3>
      <div class="result-card">
        <div class="ring" [style.background]="ringGradient(testResult.percent)">
          <div class="ring-inner">{{ testResult.correct }}/{{ testResult.total }}</div>
        </div>
        <div class="dashboard-stats">
          <div class="dashboard-count">{{ resultHeadline }}</div>
          <div class="dashboard-count small">⏱ {{ lang === 'te' ? 'సమయం' : 'Time' }} {{ formatSeconds(testResult.elapsedSeconds) }}</div>
          <div class="chip-row">
            <span class="chip chip-correct">✓ {{ testResult.correct }} {{ lang === 'te' ? 'సరైనవి' : 'correct' }}</span>
            <span class="chip chip-wrong">✕ {{ testResult.wrong }} {{ lang === 'te' ? 'తప్పు' : 'wrong' }}</span>
            <span class="chip chip-skipped">− {{ testResult.skipped }} {{ lang === 'te' ? 'వదిలేసినవి' : 'skipped' }}</span>
          </div>
        </div>
      </div>
      <div class="result-actions">
        <button class="primary-btn" type="button" (click)="stage = 'test-setup'">↺ {{ lang === 'te' ? 'కొత్త టెస్ట్' : 'New test' }}</button>
        <button class="secondary-btn" type="button" (click)="stage = 'subject-home'">⌂ {{ lang === 'te' ? 'హోమ్' : 'Home' }}</button>
      </div>

      <div class="answers-heading">{{ lang === 'te' ? 'జవాబులు' : 'Answers' }}</div>
      <div class="questions">
        <div class="q-card" *ngFor="let item of testResult.items; let i = index" [class.deleted-card]="item.selected === null">
          <div class="subject-tag"><span class="qnum">Q{{ i + 1 }}</span></div>
          <div class="question-text">
            {{ mainQuestion(item.q) }}
            <div class="question-text-te" *ngIf="subQuestion(item.q)">{{ subQuestion(item.q) }}</div>
          </div>
          <div class="options">
            <button
              *ngFor="let opt of mainOptions(item.q); let oi = index"
              type="button"
              disabled
              [class.selected]="item.selected === oi + 1"
              [class.correct]="item.q.correct_option === oi + 1"
              [class.incorrect]="item.selected === oi + 1 && item.isCorrect === false"
            >
              <span>{{ opt }}</span>
              <span class="opt-te" *ngIf="subOptions(item.q)">{{ subOptions(item.q)![oi] }}</span>
            </button>
          </div>
          <div class="answer-note" *ngIf="item.selected === null">
            <span class="ambiguous-text">{{ lang === 'te' ? 'ఈ ప్రశ్న వదిలేయబడింది.' : 'This question was skipped.' }}</span>
          </div>
        </div>
      </div>
    </ng-container>

    <!-- Reusable question card: locked/graded once progress exists (unless retrying), interactive otherwise -->
    <ng-template #questionCard let-q="q">
      <div class="q-card">
        <div class="subject-tag"><span class="qnum" *ngIf="q.number">Q{{ q.number }}</span></div>
        <div class="question-text">
          {{ mainQuestion(q) }}
          <div class="question-text-te" *ngIf="subQuestion(q)">{{ subQuestion(q) }}</div>
        </div>
        <div class="options">
          <button
            *ngFor="let opt of mainOptions(q); let i = index"
            type="button"
            [class.selected]="isLocked(q) && progress[q.id].selected_option === i + 1"
            [class.correct]="isLocked(q) && progress[q.id].is_correct && progress[q.id].selected_option === i + 1"
            [class.incorrect]="isLocked(q) && !progress[q.id].is_correct && progress[q.id].selected_option === i + 1"
            [disabled]="isLocked(q)"
            (click)="pick(q, i + 1)"
          >
            <span>{{ opt }}</span>
            <span class="opt-te" *ngIf="subOptions(q)">{{ subOptions(q)![i] }}</span>
          </button>
        </div>
        <div class="answer-note" *ngIf="isLocked(q)">
          <span class="correct-text" *ngIf="progress[q.id].is_correct">{{ lang === 'te' ? 'సరైనది!' : 'Correct!' }}</span>
          <ng-container *ngIf="!progress[q.id].is_correct">
            <span class="incorrect-text">
              {{ lang === 'te' ? 'సరిపోలేదు — సరైన జవాబు' : 'Not quite — the answer is' }}
              <strong>{{ mainOptions(q)![q.correct_option! - 1] }}</strong>
            </span>
            <button type="button" class="try-again-link" (click)="tryAgain(q)">↺ {{ lang === 'te' ? 'మళ్ళీ ప్రయత్నించండి' : 'Try again' }}</button>
          </ng-container>
        </div>
        <div class="source-note" *ngIf="q.note">{{ q.note }}</div>
      </div>
    </ng-template>
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
      .group-progress { font-size: 0.75rem; color: #3a9d5a; margin-top: 0.2rem; font-weight: 600; }

      .back-link {
        background: none; border: none; color: #2c4870; cursor: pointer;
        font-size: 0.85rem; padding: 0; margin-bottom: 0.8rem; text-decoration: underline;
      }
      .stage-title { color: #2c4870; margin-top: 0; }

      .dashboard-card {
        background: white; border-radius: 12px; padding: 1.2rem; box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        display: flex; align-items: center; gap: 1.4rem; margin-bottom: 1.2rem; flex-wrap: wrap;
      }
      .ring {
        width: 84px; height: 84px; border-radius: 50%; display: flex; align-items: center;
        justify-content: center; flex-shrink: 0;
      }
      .ring-inner {
        width: 66px; height: 66px; border-radius: 50%; background: white; display: flex;
        align-items: center; justify-content: center; font-weight: 700; color: #2c4870; font-size: 0.95rem;
      }
      .dashboard-stats { display: flex; flex-direction: column; gap: 0.5rem; flex: 1; min-width: 200px; }
      .dashboard-count { font-size: 0.95rem; color: #333; }
      .dashboard-count.small { font-size: 0.82rem; color: #777; }
      .chip-row { display: flex; gap: 0.5rem; flex-wrap: wrap; }
      .chip { font-size: 0.75rem; font-weight: 600; padding: 0.2rem 0.6rem; border-radius: 999px; }
      .chip-correct { background: #e3f6e8; color: #2a7a45; }
      .chip-wrong { background: #fdeaea; color: #b23b3b; }
      .chip-skipped { background: #f0f0f0; color: #777; }
      .primary-btn {
        background: linear-gradient(135deg, #2c4870, #3a5a8f); color: white; border: none;
        border-radius: 8px; padding: 0.6rem 1rem; font-weight: 600; cursor: pointer; font-size: 0.9rem;
        align-self: flex-start;
      }
      .secondary-btn {
        background: white; color: #2c4870; border: 1px solid #2c4870;
        border-radius: 8px; padding: 0.6rem 1rem; font-weight: 600; cursor: pointer; font-size: 0.9rem;
      }

      .option-list { display: flex; flex-direction: column; gap: 0.6rem; margin-bottom: 1rem; }
      .option-row {
        background: white; border-radius: 10px; padding: 0.8rem 1rem; display: flex; align-items: center;
        gap: 0.8rem; cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,0.06);
      }
      .option-row.disabled { opacity: 0.55; cursor: default; }
      .option-icon { font-size: 1.3rem; color: #c97c1f; width: 1.6rem; text-align: center; flex-shrink: 0; }
      .option-title { font-weight: 600; color: #222; font-size: 0.92rem; }
      .option-sub { font-size: 0.78rem; color: #777; }

      .clear-link { background: none; border: none; color: #b23b3b; text-decoration: underline; cursor: pointer; font-size: 0.8rem; padding: 0; }

      .progress-line { font-size: 0.85rem; color: #777; margin-bottom: 0.8rem; }
      .all-done-note { color: #2a7a45; font-size: 0.85rem; margin-bottom: 0.8rem; }

      .legend { display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 0.8rem; font-size: 0.78rem; color: #666; }
      .legend-item { display: flex; align-items: center; gap: 0.3rem; }
      .dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
      .dot-correct { background: #3a9d5a; }
      .dot-wrong { background: #c94444; }
      .dot-unanswered { background: #ddd; }
      .number-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(44px, 1fr)); gap: 0.5rem; }
      .number-btn {
        padding: 0.5rem 0; border-radius: 6px; border: 1px solid #ddd; background: #fafafa;
        cursor: pointer; font-size: 0.82rem; font-weight: 600; color: #555;
      }
      .number-btn.num-correct { background: #e3f6e8; border-color: #3a9d5a; color: #2a7a45; }
      .number-btn.num-wrong { background: #fdeaea; border-color: #c94444; color: #b23b3b; }

      .goto-nav { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 0.8rem; font-size: 0.85rem; color: #555; }
      .goto-nav button { padding: 0.4rem 0.8rem; border-radius: 6px; border: 1px solid #ccc; background: white; cursor: pointer; }
      .goto-nav button:disabled { opacity: 0.4; cursor: default; }

      .count-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 0.8rem; }
      .count-btn {
        background: white; border: 1px solid #ddd; border-radius: 10px; padding: 1rem 0.5rem;
        font-size: 1.3rem; font-weight: 700; color: #2c4870; cursor: pointer; display: flex;
        flex-direction: column; gap: 0.2rem; align-items: center;
      }
      .count-btn span { font-size: 0.72rem; font-weight: 500; color: #777; }
      .count-btn:disabled { opacity: 0.4; cursor: default; }

      .test-header {
        display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem;
        font-size: 0.85rem; color: #555; position: sticky; top: 0; background: #f5f2ec;
        padding: 0.5rem 0; z-index: 1;
      }
      .timer { font-weight: 700; color: #2c4870; }
      .submit-test-btn {
        background: #3a9d5a; color: white; border: none; border-radius: 8px; padding: 0.7rem 1.4rem;
        font-weight: 700; cursor: pointer; margin-top: 1rem; font-size: 0.9rem;
      }

      .result-card {
        background: white; border-radius: 12px; padding: 1.2rem; box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        display: flex; align-items: center; gap: 1.4rem; margin-bottom: 1rem; flex-wrap: wrap;
      }
      .result-actions { display: flex; gap: 0.7rem; margin-bottom: 1.2rem; }
      .answers-heading { font-weight: 700; color: #2c4870; margin-bottom: 0.6rem; }

      .questions { display: flex; flex-direction: column; gap: 1rem; }
      .q-card {
        background: white; border-radius: 10px; padding: 1rem 1.2rem;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
      }
      .q-card.deleted-card { opacity: 0.7; background: #fafafa; }
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
      .options button.selected { border-color: #2c4870; background: #eef2f8; }
      .options button.correct { background: #e3f6e8; border-color: #3a9d5a; }
      .options button.incorrect { background: #fdeaea; border-color: #c94444; }
      .opt-te { font-size: 0.82rem; color: #666; }
      .answer-note { margin-top: 0.6rem; font-size: 0.85rem; display: flex; align-items: center; gap: 0.8rem; flex-wrap: wrap; }
      .correct-text { color: #2a7a45; font-weight: 600; }
      .incorrect-text { color: #b23b3b; }
      .ambiguous-text { color: #8a6d1a; }
      .try-again-link { background: none; border: none; color: #2c4870; text-decoration: underline; cursor: pointer; font-size: 0.85rem; padding: 0; font-weight: 600; }
      .source-note { margin-top: 0.6rem; font-size: 0.75rem; color: #999; font-style: italic; }
    `,
  ],
})
export class LeapComponent implements OnInit, OnDestroy {
  lang: 'en' | 'te' = 'en';
  loading = true;
  stage: Stage = 'subjects';

  allQuestions: LeapQuestion[] = [];
  subjects: LeapSubject[] = [];
  progress: Record<string, LeapProgressRow> = {};
  retrying: Record<string, boolean> = {};

  selectedSubject: LeapSubject | null = null;
  subjectQuestions: LeapQuestion[] = [];

  gotoIndex: number | null = null;

  testCountOptions = [10, 20, 30, 50];
  testQuestions: LeapQuestion[] = [];
  testAnswers: Record<string, number> = {};
  testResult: TestResult | null = null;
  private timerHandle: ReturnType<typeof setInterval> | null = null;
  elapsedSeconds = 0;

  constructor(private leapService: LeapService) {}

  ngOnInit() {
    forkJoin({
      list: this.leapService.list(),
      progress: this.leapService.getProgress(),
    }).subscribe({
      next: ({ list, progress }) => {
        this.allQuestions = list.questions;
        this.subjects = list.subjects;
        for (const row of progress.progress) {
          this.progress[row.leap_question_id] = row;
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  // ---------- navigation ----------

  openSubject(s: LeapSubject) {
    this.selectedSubject = s;
    this.subjectQuestions = this.allQuestions.filter((q) => q.subject === s.key).sort((a, b) => a.position - b.position);
    this.stage = 'subject-home';
  }

  backToSubjects() {
    this.stage = 'subjects';
    this.selectedSubject = null;
  }

  openGotoPicker() {
    this.stage = 'goto-picker';
  }

  openGotoQuestion(index: number) {
    this.gotoIndex = index;
    this.stage = 'goto-question';
  }

  stepGoto(delta: number) {
    if (this.gotoIndex === null) return;
    const next = this.gotoIndex + delta;
    if (next >= 0 && next < this.subjectQuestions.length) this.gotoIndex = next;
  }

  openMistakes() {
    if (this.subjectWrong === 0) return;
    this.stage = 'mistakes';
  }

  // ---------- progress-derived stats ----------

  answeredCountFor(s: LeapSubject): number {
    return this.allQuestions.filter((q) => q.subject === s.key && this.progress[q.id]).length;
  }

  get subjectAnswered(): number {
    return this.subjectQuestions.filter((q) => this.progress[q.id]).length;
  }

  get subjectCorrect(): number {
    return this.subjectQuestions.filter((q) => this.progress[q.id]?.is_correct).length;
  }

  get subjectWrong(): number {
    return this.subjectAnswered - this.subjectCorrect;
  }

  get subjectPercent(): number {
    return this.subjectQuestions.length ? Math.round((this.subjectAnswered / this.subjectQuestions.length) * 100) : 0;
  }

  private get firstUnansweredIndex(): number {
    return this.subjectQuestions.findIndex((q) => !this.progress[q.id]);
  }

  get allAnsweredInSubject(): boolean {
    return this.subjectQuestions.length > 0 && this.firstUnansweredIndex === -1;
  }

  get nextPracticeNumber(): number {
    const idx = this.firstUnansweredIndex;
    if (idx === -1) return this.subjectQuestions.length ? this.subjectQuestions[0].position : 1;
    return this.subjectQuestions[idx].position;
  }

  // Practice list reveals answered questions plus exactly one active
  // (unanswered) question at the end -- answering it reveals the next one,
  // since this getter re-derives from `progress` on every change.
  get visiblePracticeQuestions(): LeapQuestion[] {
    const idx = this.firstUnansweredIndex;
    if (idx === -1) return this.subjectQuestions;
    return this.subjectQuestions.slice(0, idx + 1);
  }

  get mistakeQuestions(): LeapQuestion[] {
    return this.subjectQuestions.filter((q) => this.progress[q.id] && !this.progress[q.id].is_correct);
  }

  ringGradient(percent: number): string {
    const deg = Math.max(0, Math.min(100, percent)) * 3.6;
    return `conic-gradient(#2c4870 ${deg}deg, #e5e5e5 0deg)`;
  }

  // ---------- answering (practice / mistakes / goto — retryable) ----------

  isLocked(q: LeapQuestion): boolean {
    return !!this.progress[q.id] && !this.retrying[q.id];
  }

  pick(q: LeapQuestion, choice: number) {
    if (this.isLocked(q)) return;
    this.leapService.saveAnswer(q.id, choice).subscribe({
      next: (res: LeapAnswerResult) => {
        this.progress[q.id] = {
          leap_question_id: q.id,
          selected_option: choice,
          is_correct: res.is_correct,
          updated_at: new Date().toISOString(),
        };
        delete this.retrying[q.id];
      },
    });
  }

  tryAgain(q: LeapQuestion) {
    this.retrying[q.id] = true;
  }

  clearSubjectProgress() {
    if (!this.selectedSubject) return;
    const ok = confirm(
      this.lang === 'te'
        ? 'ఈ సబ్జెక్టు కోసం మీ జవాబులన్నీ తొలగించాలా? దీన్ని వెనక్కి తీసుకోలేరు.'
        : "Clear all your saved answers for this subject? This can't be undone."
    );
    if (!ok) return;
    this.leapService.clearSubjectProgress(this.selectedSubject.key).subscribe({
      next: () => {
        for (const q of this.subjectQuestions) delete this.progress[q.id];
      },
    });
  }

  // ---------- practice test (timed, one-shot, no retry) ----------

  startTest(count: number) {
    if (!this.selectedSubject) return;
    const n = Math.min(count, this.subjectQuestions.length);
    this.testQuestions = shuffle(this.subjectQuestions).slice(0, n);
    this.testAnswers = {};
    this.testResult = null;
    this.elapsedSeconds = 0;
    this.stage = 'test';
    this.startTimer();
  }

  get testAnsweredCount(): number {
    return this.testQuestions.filter((q) => this.testAnswers[q.id] !== undefined).length;
  }

  private startTimer() {
    this.stopTimer();
    this.timerHandle = setInterval(() => {
      this.elapsedSeconds += 1;
    }, 1000);
  }

  private stopTimer() {
    if (this.timerHandle !== null) {
      clearInterval(this.timerHandle);
      this.timerHandle = null;
    }
  }

  get formattedTimer(): string {
    return this.formatSeconds(this.elapsedSeconds);
  }

  formatSeconds(total: number): string {
    const m = Math.floor(total / 60).toString().padStart(2, '0');
    const s = Math.floor(total % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  confirmSubmitTest() {
    const unanswered = this.testQuestions.length - this.testAnsweredCount;
    if (unanswered > 0) {
      const ok = confirm(
        this.lang === 'te'
          ? `${unanswered} ప్రశ్న(లు) సమాధానం ఇవ్వలేదు. టెస్ట్ సమర్పించాలా?`
          : `${unanswered} question(s) not answered. Submit the test?`
      );
      if (!ok) return;
    }
    this.submitTest();
  }

  private submitTest() {
    this.stopTimer();
    let correct = 0;
    let wrong = 0;
    let skipped = 0;
    const items: TestResultItem[] = [];

    for (const q of this.testQuestions) {
      const selected = this.testAnswers[q.id] ?? null;
      if (selected === null) {
        skipped += 1;
        items.push({ q, selected: null, isCorrect: null });
        continue;
      }
      const isCorrect = q.correct_option !== null && selected === q.correct_option;
      if (isCorrect) correct += 1;
      else wrong += 1;
      items.push({ q, selected, isCorrect });

      // Fold this answer into the student's persistent progress too, same
      // as an ordinary practice answer -- a question answered inside a
      // Practice Test still counts toward the subject dashboard.
      this.leapService.saveAnswer(q.id, selected).subscribe({
        next: (res: LeapAnswerResult) => {
          this.progress[q.id] = {
            leap_question_id: q.id,
            selected_option: selected,
            is_correct: res.is_correct,
            updated_at: new Date().toISOString(),
          };
        },
      });
    }

    const total = this.testQuestions.length;
    const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
    this.testResult = { total, correct, wrong, skipped, percent, elapsedSeconds: this.elapsedSeconds, items };
    this.stage = 'test-result';
  }

  get resultHeadline(): string {
    if (!this.testResult) return '';
    if (this.testResult.percent >= 80) return this.lang === 'te' ? 'అద్భుతం!' : 'Great job!';
    if (this.testResult.percent >= 50) return this.lang === 'te' ? 'బాగుంది!' : 'Good effort!';
    return this.lang === 'te' ? 'సాధన కొనసాగించండి' : 'Keep practising';
  }

  // ---------- bilingual text/option helpers ----------

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
}
