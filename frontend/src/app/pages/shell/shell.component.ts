import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="shell">
      <div class="notice-overlay" *ngIf="showNotice">
        <div class="notice-card">
          <div class="notice-head">
            <button class="notice-close" type="button" aria-label="Close" (click)="dismissNotice()">✕</button>
            <h3>Important Notice</h3>
            <div class="notice-sub">ANDHRA PRADESH TEACHER ELIGIBILITY TEST</div>
          </div>
          <div class="notice-body">
            <div class="notice-row">
              <span class="notice-icon">📄</span>
              <div class="notice-text">
                <div class="notice-title-row">
                  <span class="notice-title">Latest Updates</span>
                  <span class="notice-badge">NEW</span>
                </div>
                <p class="notice-msg">
                  New official AP TET 2026 papers have been added for practice under the
                  <strong>2026 TET (New)</strong> and <strong>Grand Test</strong> tabs.
                </p>
                <p class="notice-msg notice-msg-te">
                  ప్రాక్టీస్ కోసం కొత్త అధికారిక AP TET 2026 పేపర్లు <strong>2026 TET (New)</strong> మరియు
                  <strong>Grand Test</strong> ట్యాబ్‌లలో జోడించబడ్డాయి.
                </p>
              </div>
            </div>
            <button class="notice-ok" type="button" (click)="dismissNotice()">Got it</button>
          </div>
        </div>
      </div>
      <header>
        <div class="brand">Vidya Bandham</div>
        <nav>
          <!-- Shown for every role, including tet_subscriber accounts —
               even though a subscriber account has no class/students/etc.
               attached, so Diary/Homework/Attendance/Fees will just load
               empty for it, keeping the full nav visible was requested
               over hiding these for that role. -->
          <a routerLink="/diary" routerLinkActive="active">Diary</a>
          <a routerLink="/homework" routerLinkActive="active">Homework</a>
          <a routerLink="/attendance" routerLinkActive="active">Attendance</a>
          <a routerLink="/fees" routerLinkActive="active">Fees</a>
          <a *ngIf="auth.isTeacher()" routerLink="/students" routerLinkActive="active">Students</a>
          <a routerLink="/tet" routerLinkActive="active">TET Previous Papers</a>
          <a routerLink="/mock-test" routerLinkActive="active">MockTest(TET)</a>
          <a routerLink="/tet-2026" routerLinkActive="active" class="nav-new-flash">2026 TET (New)</a>
          <!-- Hidden for now: "2026 TET (New)" already gives the same real-exam
               experience (they share GrandTestComponent), so a separate Grand Test
               tab is redundant. Route/component are left in place to bring this
               back later if needed. -->
          <!-- <a routerLink="/grand-test" routerLinkActive="active">Grand Test</a> -->
        </nav>
        <div class="user">
          <span>{{ auth.user()?.name }}</span>
          <button (click)="auth.logout()">Log out</button>
        </div>
      </header>
      <main>
        <router-outlet></router-outlet>
      </main>

      <div class="contact-box">
        <p class="contact-title">📞 For any queries or support, contact us</p>
        <p class="contact-line">
          Email: <a href="mailto:support@vidyabandham.com">support&#64;vidyabandham.com</a>
        </p>
        <p class="contact-line">Phone: 8884099770&nbsp;&nbsp;|&nbsp;&nbsp;9030523776</p>
      </div>

      <footer class="site-footer">
        <p class="policy-links">
          <a routerLink="/terms">Terms &amp; Conditions</a>
          <span>·</span>
          <a routerLink="/privacy">Privacy Policy</a>
          <span>·</span>
          <a routerLink="/refund-policy">Refund &amp; Cancellation</a>
        </p>
        <p>A product of <strong>KK Innovations</strong>, by Karuna Kumar</p>
      </footer>
    </div>
  `,
  styles: [
    `
      .shell {
        min-height: 100vh;
        background: #f4f1ea;
        font-family: system-ui, sans-serif, 'Noto Sans Telugu';
      }
      header {
        background: #2c4870;
        color: white;
        display: flex;
        align-items: center;
        gap: 1.5rem;
        padding: 0.8rem 1.5rem;
        flex-wrap: wrap;
      }
      .brand {
        font-weight: 700;
        font-size: 1.2rem;
      }
      nav {
        display: flex;
        gap: 1rem;
        flex: 1;
        flex-wrap: wrap;
      }
      nav a {
        color: #ffcf7f;
        text-decoration: none;
        font-weight: 700;
        font-size: 0.95rem;
        padding: 0.3rem 0.1rem;
        border-bottom: 2px solid transparent;
      }
      nav a.active {
        color: #ffffff;
        border-bottom-color: #c97c1f;
      }
      /* Draws the eye to the new 2026 papers without being a literal
         on/off blink (bad for readability/accessibility) — a soft pulsing
         glow in a bright, attention-getting color instead. Stops pulsing
         once the tab is the active page, since it's already been noticed. */
      nav a.nav-new-flash:not(.active) {
        animation: nav-new-pulse 1.6s ease-in-out infinite;
        border-radius: 4px;
      }
      @keyframes nav-new-pulse {
        0%, 100% { color: #dc2626; text-shadow: 0 0 6px rgba(220, 38, 38, 0.7); }
        50% { color: #ff6b6b; text-shadow: 0 0 10px rgba(255, 107, 107, 0.9); }
      }
      .user {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-size: 0.9rem;
      }
      .user button {
        background: transparent;
        border: 1px solid rgba(255, 255, 255, 0.5);
        color: white;
        padding: 0.35rem 0.7rem;
        border-radius: 6px;
        cursor: pointer;
      }
      main {
        max-width: 800px;
        margin: 0 auto;
        padding: 1.5rem 1rem 3rem;
      }

      /* Bottom-of-page contact strip + credit footer, ported from the
         login/signup pages so it's visible everywhere after logging in
         too, not just before — same markup/styling as login.component.ts. */
      .contact-box {
        width: 100%;
        padding: 0.7rem 1.5rem;
        background: linear-gradient(135deg, #eaf2fb, #f5f9fd);
        border-top: 1px solid #cfe0f2;
        text-align: center;
        box-sizing: border-box;
      }
      .contact-title {
        margin: 0 0 0.4rem;
        color: #2c4870;
        font-size: 0.85rem;
        font-weight: bold;
      }
      .contact-line {
        margin: 0.15rem 0;
        color: #45607e;
        font-size: 0.8rem;
        font-weight: 600;
      }
      .contact-line a {
        color: #2c4870;
        text-decoration: none;
      }
      .contact-line a:hover {
        text-decoration: underline;
      }
      .site-footer {
        width: 100%;
        padding: 0.5rem 1rem;
        background: #1f2937;
        color: #cbd5e1;
        text-align: center;
        font-size: 0.75rem;
        box-sizing: border-box;
      }
      .site-footer p {
        margin: 0;
        font-weight: 600;
      }
      .policy-links {
        margin: 0 0 0.4rem;
        font-size: 0.78rem;
      }
      .policy-links a {
        color: #6b8bb5;
        text-decoration: none;
      }
      .policy-links a:hover {
        text-decoration: underline;
      }
      .policy-links span {
        color: #ccc;
        margin: 0 0.35rem;
      }
      .site-footer strong {
        color: #ffffff;
      }

      .notice-overlay {
        position: fixed;
        inset: 0;
        background: rgba(20, 20, 20, 0.55);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100;
        padding: 1rem;
      }
      .notice-card {
        background: white;
        border-radius: 14px;
        max-width: 480px;
        width: 100%;
        overflow: hidden;
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
      }
      .notice-head {
        position: relative;
        background: linear-gradient(135deg, #f7941d, #f26522);
        color: #1a1a1a;
        text-align: center;
        padding: 1.4rem 1rem 1.1rem;
      }
      .notice-head h3 {
        margin: 0;
        font-size: 1.4rem;
        font-weight: 800;
      }
      .notice-sub {
        margin-top: 0.3rem;
        font-size: 0.8rem;
        font-weight: 700;
        letter-spacing: 0.03em;
        color: #1d3fae;
      }
      .notice-close {
        position: absolute;
        top: 0.7rem;
        right: 0.7rem;
        width: 2rem;
        height: 2rem;
        border-radius: 50%;
        border: none;
        background: white;
        color: #333;
        font-size: 0.9rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .notice-body {
        padding: 1.2rem 1.3rem 1.4rem;
      }
      .notice-row {
        display: flex;
        gap: 0.8rem;
        align-items: flex-start;
        background: #eef7fc;
        border: 1px solid #d7ecf7;
        border-radius: 10px;
        padding: 0.9rem 1rem;
      }
      .notice-icon {
        font-size: 1.4rem;
        flex-shrink: 0;
      }
      .notice-text {
        flex: 1;
        min-width: 0;
      }
      .notice-title-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
      }
      .notice-title {
        font-weight: 800;
        color: #1d3fae;
        font-size: 1.05rem;
      }
      .notice-badge {
        background: #dc2626;
        color: #ffe066;
        font-size: 0.7rem;
        font-weight: 800;
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
        transform: rotate(-4deg);
        flex-shrink: 0;
      }
      .notice-msg {
        margin: 0.5rem 0 0;
        color: #e2622a;
        font-weight: 600;
        font-size: 0.92rem;
        line-height: 1.4;
      }
      .notice-msg-te {
        color: #c97c1f;
        font-size: 0.88rem;
      }
      .notice-ok {
        display: block;
        margin: 1.1rem auto 0;
        background: #2c4870;
        color: white;
        border: none;
        padding: 0.55rem 1.6rem;
        border-radius: 8px;
        font-weight: 700;
        cursor: pointer;
      }
    `,
  ],
})
export class ShellComponent implements OnInit {
  private static readonly NOTICE_ID = 'ap-tet-2026-papers-added';

  showNotice = false;

  constructor(public auth: AuthService) {}

  ngOnInit(): void {
    const user = this.auth.user();
    if (!user) return;
    const key = `vb-notice-${ShellComponent.NOTICE_ID}-${user.id}`;
    try {
      if (!localStorage.getItem(key)) {
        this.showNotice = true;
      }
    } catch {
      // localStorage unavailable — just skip showing the one-time notice.
    }
  }

  dismissNotice(): void {
    this.showNotice = false;
    const user = this.auth.user();
    if (!user) return;
    const key = `vb-notice-${ShellComponent.NOTICE_ID}-${user.id}`;
    try {
      localStorage.setItem(key, '1');
    } catch {
      // Ignore — worst case the notice reappears next login.
    }
  }
}
