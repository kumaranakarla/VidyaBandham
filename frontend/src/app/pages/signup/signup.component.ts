import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

// Public self-signup — the account created here is always a plain
// tet_subscriber (see auth.service.ts's register() and the backend's
// POST /api/auth/register); teacher/parent accounts with real class
// access are still created from inside the app. The "I am a" choice below
// is a self-reported label only (stored as `occupation`, not `role`), so
// the admin dashboard can tell who's actually signing up — a working
// teacher preparing for TET vs. a first-time aspirant. Parent is shown as
// "coming soon" until parent self-signup gets real functionality.
@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="login-page">
      <form class="login-card" (ngSubmit)="submit()" novalidate>
        <h1>Vidya Bandham</h1>
        <p class="subtitle">Create a free account to practice AP TET 2026 papers.</p>
        <p class="subtitle-te">ఉచిత ఖాతా సృష్టించి AP TET 2026 పేపర్లను ప్రాక్టీస్ చేయండి.</p>

        <label>Name <span class="label-te">(పేరు)</span></label>
        <input type="text" name="name" [(ngModel)]="name" placeholder="Your name" required autofocus autocomplete="off" />

        <label>Email <span class="label-te">(ఇమెయిల్)</span></label>
        <input
          type="email"
          name="email"
          [(ngModel)]="email"
          (ngModelChange)="onEmailChange()"
          placeholder="you@example.com"
          required
          autocomplete="off"
        />
        <p class="field-error" *ngIf="emailError">{{ emailError }}</p>

        <label>Password <span class="label-te">(పాస్‌వర్డ్)</span></label>
        <input
          type="password"
          name="password"
          [(ngModel)]="password"
          (ngModelChange)="onPasswordChange()"
          placeholder="At least 6 characters"
          required
          autocomplete="new-password"
        />
        <p class="hint">At least 6 characters — letters, numbers, or symbols are all fine.</p>
        <p class="hint-te">కనీసం 6 అక్షరాలు — అక్షరాలు, అంకెలు లేదా గుర్తులు ఏవైనా పర్వాలేదు.</p>
        <p class="field-error" *ngIf="passwordError">{{ passwordError }}</p>

        <label>I am a <span class="label-te">(నేను)</span></label>
        <div class="occupation-group">
          <label class="occupation-option">
            <input type="radio" name="occupation" value="aspirant" [(ngModel)]="occupation" />
            <span>TET Aspirant <span class="label-te">(అభ్యర్థి)</span></span>
          </label>
          <label class="occupation-option">
            <input type="radio" name="occupation" value="teacher" [(ngModel)]="occupation" />
            <span>Teacher <span class="label-te">(ఉపాధ్యాయుడు)</span></span>
          </label>
          <label class="occupation-option disabled">
            <input type="radio" name="occupation" value="parent" disabled />
            <span>Parent <span class="label-te">(తల్లిదండ్రి)</span> — coming soon</span>
          </label>
        </div>

        <button type="submit" [disabled]="loading">
          <span class="btn-en">{{ loading ? 'Creating account…' : 'Create account' }}</span>
          <span class="btn-te" *ngIf="!loading">ఖాతా సృష్టించండి</span>
        </button>

        <p class="error" *ngIf="error">{{ error }}</p>

        <p class="switch">Already have an account? <a routerLink="/login">Log in</a></p>
        <p class="switch-te">ఇప్పటికే ఖాతా ఉందా? <a routerLink="/login">లాగిన్ అవ్వండి</a></p>
      </form>

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
      .login-page {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: #f4f1ea;
        font-family: system-ui, sans-serif;
        font-weight: bold;
        padding: 0.75rem 1rem;
        box-sizing: border-box;
      }
      .contact-box {
        width: 100%;
        max-width: 480px;
        margin-top: 0.85rem;
        padding: 0.6rem 1.5rem;
        background: linear-gradient(135deg, #eaf2fb, #f5f9fd);
        border-top: 1px solid #cfe0f2;
        border-radius: 10px;
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
        max-width: 480px;
        margin-top: 0.6rem;
        padding: 0.4rem 1rem;
        background: #1f2937;
        border-radius: 10px;
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
        font-size: 0.85rem;
        font-weight: normal;
      }
      .policy-links a {
        color: #9dc0ee;
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
      .login-card {
        background: white;
        padding: 1.85rem 2rem;
        border-radius: 12px;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
        width: 100%;
        max-width: 360px;
        font-weight: bold;
      }
      h1 { margin: 0 0 0.25rem; color: #2c4870; font-weight: bold; }
      .subtitle { margin: 0; color: #666; font-size: 0.9rem; font-weight: bold; }
      .subtitle-te { margin: 0.1rem 0 1.1rem; color: #999; font-size: 0.78rem; font-weight: 500; }
      label { display: block; font-size: 0.85rem; margin: 0.7rem 0 0.25rem; color: #333; font-weight: bold; }
      .label-te { color: #999; font-weight: 500; font-size: 0.92em; }
      input[type='text'], input[type='email'], input[type='password'] {
        width: 100%;
        padding: 0.6rem 0.7rem;
        border: 1px solid #ccc;
        border-radius: 6px;
        font-size: 1rem;
        box-sizing: border-box;
        font-weight: bold;
      }
      .occupation-group {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        margin-top: 0.3rem;
      }
      .occupation-option {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0;
        font-size: 0.85rem;
        font-weight: 600;
        color: #333;
        cursor: pointer;
      }
      .occupation-option input {
        width: auto;
        margin: 0;
        cursor: pointer;
      }
      .occupation-option.disabled {
        color: #aaa;
        cursor: default;
      }
      .occupation-option.disabled input {
        cursor: default;
      }
      button {
        margin-top: 1.5rem;
        width: 100%;
        padding: 0.65rem;
        background: #c97c1f;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.1rem;
      }
      .btn-en { font-size: 1rem; }
      .btn-te { font-size: 0.75rem; font-weight: 500; opacity: 0.92; }
      button:disabled { opacity: 0.6; cursor: default; }
      .hint { margin: 0.3rem 0 0; font-size: 0.78rem; color: #888; font-weight: 500; }
      .hint-te { margin: 0.1rem 0 0; font-size: 0.72rem; color: #aaa; font-weight: 500; }
      .field-error { margin: 0.3rem 0 0; font-size: 0.8rem; color: #b3261e; font-weight: 700; }
      .error { color: #b3261e; margin-top: 1rem; font-size: 0.9rem; font-weight: bold; }
      .switch { margin-top: 1.25rem; margin-bottom: 0; text-align: center; font-size: 0.85rem; color: #666; font-weight: bold; }
      .switch-te { margin: 0.15rem 0 0; text-align: center; font-size: 0.72rem; color: #999; font-weight: 500; }
      .switch a, .switch-te a { color: #2c4870; }
    `,
  ],
})
export class SignupComponent {
  name = '';
  email = '';
  password = '';
  occupation: 'aspirant' | 'teacher' | 'parent' = 'aspirant';
  loading = false;
  error = '';
  emailError = '';
  passwordError = '';

  constructor(private auth: AuthService, private router: Router) {}

  // Kept deliberately simple, per product decision: length is the only
  // real bar (matches the backend's own minimum), no forced mix of
  // uppercase/numbers/symbols — that kind of "complex password" rule mostly
  // just frustrates people signing up for a ₹299 exam-prep app.
  private static readonly EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Fires on every keystroke (not just on submit) so someone finds out
  // their email looks wrong while they're still typing it, not after they've
  // filled in the whole form and clicked the button.
  onEmailChange(): void {
    const value = this.email.trim();
    this.emailError = value && !SignupComponent.EMAIL_PATTERN.test(value) ? 'Please enter a valid email address.' : '';
  }

  onPasswordChange(): void {
    this.passwordError = this.password && this.password.length < 6 ? 'Password must be at least 6 characters.' : '';
  }

  submit(): void {
    this.error = '';
    this.onEmailChange();
    this.onPasswordChange();
    if (!this.name || !this.email || !this.password) return;
    if (this.emailError || this.passwordError) return;

    this.loading = true;
    this.auth.register(this.name, this.email, this.password, this.occupation).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/tet-2026']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.error || 'Could not create your account. Please try again.';
      },
    });
  }
}
