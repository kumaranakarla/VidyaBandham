import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

// Public self-signup — for TET Prep subscribers only (see auth.service.ts's
// register() and the backend's POST /api/auth/register). Teacher and parent
// accounts are still created from inside the app by a teacher, so this page
// never asks which role to sign up as; every account created here is a
// tet_subscriber.
@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="login-page">
      <form class="login-card" (ngSubmit)="submit()" novalidate>
        <h1>Vidya Bandham</h1>
        <p class="subtitle">Create a free account to practice AP TET 2026 papers.</p>

        <label>Name</label>
        <input type="text" name="name" [(ngModel)]="name" placeholder="Your name" required autofocus autocomplete="off" />

        <label>Email</label>
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

        <label>Password</label>
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
        <p class="field-error" *ngIf="passwordError">{{ passwordError }}</p>

        <button type="submit" [disabled]="loading">{{ loading ? 'Creating account…' : 'Create account' }}</button>

        <p class="error" *ngIf="error">{{ error }}</p>

        <p class="switch">Already have an account? <a routerLink="/login">Log in</a></p>
      </form>

      <p class="policy-links">
        <a routerLink="/terms">Terms &amp; Conditions</a>
        <span>·</span>
        <a routerLink="/privacy">Privacy Policy</a>
        <span>·</span>
        <a routerLink="/refund-policy">Refund &amp; Cancellation</a>
      </p>
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
      }
      .policy-links {
        margin: 1.25rem 0 0;
        text-align: center;
        font-size: 0.78rem;
        font-weight: normal;
      }
      .policy-links a {
        color: #6b8bb5;
        text-decoration: none;
      }
      .policy-links a:hover {
        text-decoration: underline;
      }
      .policy-links span {
        color: #bbb;
        margin: 0 0.35rem;
      }
      .login-card {
        background: white;
        padding: 2.5rem;
        border-radius: 12px;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
        width: 100%;
        max-width: 360px;
        font-weight: bold;
      }
      h1 { margin: 0 0 0.25rem; color: #2c4870; font-weight: bold; }
      .subtitle { margin: 0 0 1.5rem; color: #666; font-size: 0.9rem; font-weight: bold; }
      label { display: block; font-size: 0.85rem; margin: 0.75rem 0 0.25rem; color: #333; font-weight: bold; }
      input {
        width: 100%;
        padding: 0.6rem 0.7rem;
        border: 1px solid #ccc;
        border-radius: 6px;
        font-size: 1rem;
        box-sizing: border-box;
        font-weight: bold;
      }
      button {
        margin-top: 1.5rem;
        width: 100%;
        padding: 0.7rem;
        background: #c97c1f;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 1rem;
        cursor: pointer;
        font-weight: bold;
      }
      button:disabled { opacity: 0.6; cursor: default; }
      .hint { margin: 0.3rem 0 0; font-size: 0.78rem; color: #888; font-weight: 500; }
      .field-error { margin: 0.3rem 0 0; font-size: 0.8rem; color: #b3261e; font-weight: 700; }
      .error { color: #b3261e; margin-top: 1rem; font-size: 0.9rem; font-weight: bold; }
      .switch { margin-top: 1.5rem; text-align: center; font-size: 0.85rem; color: #666; font-weight: bold; }
      .switch a { color: #2c4870; }
    `,
  ],
})
export class SignupComponent {
  name = '';
  email = '';
  password = '';
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
    this.auth.register(this.name, this.email, this.password).subscribe({
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
