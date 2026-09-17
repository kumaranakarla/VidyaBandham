import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Tet2026Paper, TetQuestion, TetService } from '../../services/tet.service';
import { AuthService } from '../../services/auth.service';
import { SubscriptionService } from '../../services/subscription.service';

// The "2026 (New)" tab. Deliberately its own component + route (see
// app.routes.ts and tet.service.ts's `list2026()`/`base2026`) rather than a
// year filter bolted onto the existing TET Prep page. Two of the twelve
// official papers (Maths & Science, both shifts) are free for everyone who's
// logged in; the other ten sit behind the ₹299/30-day subscription handled
// by subscription.service.ts + backend/src/routes/subscription.js
// (Razorpay). The backend never sends a locked paper's questions to the
// client at all — the "locked" flag here is just for showing what exists.
@Component({
  selector: 'app-tet-2026',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <h2>{{ lang === 'te' ? '2026 (కొత్తది)' : '2026 (New)' }} <span class="new-badge">{{ lang === 'te' ? 'కొత్తది' : 'NEW' }}</span></h2>
    <p class="intro" *ngIf="lang === 'en'">
      The real AP TET 2026 exam papers, with final, officially-published answer keys — sourced directly from the AP
      Department of School Education's own results portal. 12 official papers in total across SGT, Maths &amp;
      Science, Social Studies, and the Telugu/English language papers.
    </p>
    <p class="intro" *ngIf="lang === 'te'">
      వాస్తవ AP TET 2026 పరీక్షా పత్రాలు, అధికారికంగా ప్రచురించిన తుది జవాబు కీలతో సహా — నేరుగా ఆంధ్రప్రదేశ్ పాఠశాల విద్యా శాఖ ఫలితాల పోర్టల్ నుండి సేకరించబడ్డాయి. SGT, గణితం &amp; సైన్స్, సాంఘిక శాస్త్రాలు, మరియు తెలుగు/ఇంగ్లీష్ భాషా పత్రాలతో కలిపి మొత్తం 12 అధికారిక పత్రాలు ఉన్నాయి.
    </p>

    <div class="unlock-banner" *ngIf="!loading && lockedPapersCount > 0">
      <span *ngIf="isSchoolAccount">
        <strong>{{ lockedPapersCount }} more official papers</strong> — create a free account to unlock all 12.
      </span>
      <span *ngIf="!isSchoolAccount && lang === 'en'">
        <strong>{{ lockedPapersCount }} more official papers</strong> are available with a subscription.
      </span>
      <span *ngIf="!isSchoolAccount && lang === 'te'">
        <strong>మరో {{ lockedPapersCount }} అధికారిక పత్రాలు</strong> సబ్‌స్క్రిప్షన్‌తో అందుబాటులో ఉన్నాయి.
      </span>
      <button type="button" (click)="openUpgradePrompt()">
        {{ isSchoolAccount ? 'Create Account' : (lang === 'te' ? 'మొత్తం 12 పత్రాలను అన్‌లాక్ చేయండి' : 'Unlock all 12 papers') }}
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

    <div class="filter-row" *ngIf="subjects.length">
      <label>Subject</label>
      <select [(ngModel)]="selectedSubject">
        <option value="">All subjects</option>
        <option *ngFor="let s of subjects" [value]="s">{{ s }}</option>
      </select>
      <label>Paper</label>
      <select [(ngModel)]="selectedSource">
        <option value="">All papers</option>
        <option *ngFor="let p of papers" [value]="p.name">{{ p.name }}{{ p.locked ? ' 🔒' : '' }}</option>
      </select>
    </div>

    <p *ngIf="loading">Loading…</p>

    <div class="locked-notice" *ngIf="!loading && selectedPaperLocked">
      <p *ngIf="isSchoolAccount">🔒 Create an account to unlock all 12 TET 2026 papers.</p>
      <p *ngIf="!isSchoolAccount && lang === 'en'">🔒 This paper is part of the subscription. Unlock it to practice all 10 remaining official 2026 papers.</p>
      <p *ngIf="!isSchoolAccount && lang === 'te'">🔒 ఈ పత్రం సబ్‌స్క్రిప్షన్‌లో భాగం. మిగిలిన 10 అధికారిక 2026 పత్రాలను ప్రాక్టీస్ చేయడానికి దీన్ని అన్‌లాక్ చేయండి.</p>
      <button type="button" (click)="openUpgradePrompt()">
        {{ isSchoolAccount ? 'Create Account' : (lang === 'te' ? 'మొత్తం 12 పత్రాలను అన్‌లాక్ చేయండి' : 'Unlock all 12 papers') }}
      </button>
    </div>

    <p *ngIf="!loading && !selectedPaperLocked && questions.length === 0">No 2026 questions added yet.</p>

    <div class="questions" *ngIf="!selectedPaperLocked">
      <div class="q-card" *ngFor="let q of filteredQuestions">
        <div class="subject-tag">
          {{ q.subject }}
          <span class="en-only-tag" *ngIf="lang === 'te' && !q.question_te">English only</span>
          <span class="en-only-tag" *ngIf="lang === 'en' && q.subject === 'Telugu'">Telugu only</span>
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
              <h3>Unlock all 12 official 2026 papers <span class="new-badge">NEW</span></h3>
              <p>
                You get 2 papers (Maths &amp; Science) free, forever. Register and subscribe for
                <strong>₹299 / month</strong> to practice the remaining 10 papers — Paper 1 (SGT), Social Studies,
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
              <h3>Unlock all 12 official 2026 papers <span class="new-badge">NEW</span></h3>
              <p>Create an account to unlock all 12 TET 2026 papers. You'll keep these 2 free papers either way, and can subscribe for ₹299 / month to practice the remaining 10.</p>
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
      .filter-row { display: flex; align-items: center; flex-wrap: wrap; gap: 0.6rem 1rem; margin-bottom: 1.2rem; }
      .filter-row select { padding: 0.4rem 0.6rem; border-radius: 6px; border: 1px solid #ccc; max-width: 100%; }
      .locked-notice {
        background: #fbe4e2; border: 1px solid #e3a49d; border-radius: 8px; padding: 1rem 1.2rem;
        margin-bottom: 1.2rem; color: #7a2a22;
      }
      .locked-notice button {
        margin-top: 0.6rem; background: #c97c1f; color: white; border: none; border-radius: 6px;
        padding: 0.5rem 1rem; cursor: pointer; font-weight: 600;
      }
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
    `,
  ],
})
export class Tet2026Component implements OnInit {
  questions: TetQuestion[] = [];
  papers: Tet2026Paper[] = [];
  subscriptionActive = false;
  loading = true;
  selectedSubject = '';
  selectedSource = '';
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

  get subjects(): string[] {
    return Array.from(new Set(this.questions.map((q) => q.subject)));
  }

  get lockedPapersCount(): number {
    return this.papers.filter((p) => p.locked).length;
  }

  get selectedPaperLocked(): boolean {
    if (!this.selectedSource) return false;
    const paper = this.papers.find((p) => p.name === this.selectedSource);
    return !!paper?.locked;
  }

  get filteredQuestions(): TetQuestion[] {
    return this.questions.filter((q) => {
      const subjectMatch = !this.selectedSubject || q.subject === this.selectedSubject;
      const sourceMatch = !this.selectedSource || q.source === this.selectedSource;
      return subjectMatch && sourceMatch;
    });
  }

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
