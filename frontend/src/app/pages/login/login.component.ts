import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-page">
      <form class="login-card" (ngSubmit)="submit()">
        <h1>Vidya Bandham</h1>
        <p class="subtitle">School diary, attendance, homework &amp; fees — all in one place.</p>

        <label>Email</label>
        <input type="email" name="email" [(ngModel)]="email" placeholder="you@example.com" required autofocus />

        <label>Password</label>
        <input type="password" name="password" [(ngModel)]="password" placeholder="Password" required />

        <button type="submit" [disabled]="loading">{{ loading ? 'Signing in…' : 'Sign in' }}</button>

        <p class="error" *ngIf="error">{{ error }}</p>

        <div class="demo">
          <p class="demo-title"><strong>Demo logins</strong></p>

          <p class="demo-role">Teacher login</p>
          <p>Username: teacher&#64;vb</p>
          <p>Password: teacher123</p>

          <p class="demo-role">Parent login</p>
          <p>Username: parent&#64;vb</p>
          <p>Password: parent123</p>
        </div>
      </form>
    </div>
  `,
  styles: [
    `
      .login-page {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f4f1ea;
        font-family: system-ui, sans-serif;
        font-weight: bold;
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
      h1 {
        margin: 0 0 0.25rem;
        color: #2c4870;
        font-weight: bold;
      }
      .subtitle {
        margin: 0 0 1.5rem;
        color: #666;
        font-size: 0.9rem;
        font-weight: bold;
      }
      label {
        display: block;
        font-size: 0.85rem;
        margin: 0.75rem 0 0.25rem;
        color: #333;
        font-weight: bold;
      }
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
      button:disabled {
        opacity: 0.6;
        cursor: default;
      }
      .error {
        color: #b3261e;
        margin-top: 1rem;
        font-size: 0.9rem;
        font-weight: bold;
      }
      .demo {
        margin-top: 1.5rem;
        padding-top: 1rem;
        border-top: 1px solid #eee;
        font-size: 0.8rem;
        color: #777;
        font-weight: bold;
      }
      .demo p {
        margin: 0.2rem 0;
        font-weight: bold;
      }
      .demo-title {
        margin-bottom: 0.5rem !important;
      }
      .demo-role {
        margin-top: 0.7rem !important;
        color: #2c4870;
        font-weight: bold;
      }
    `,
  ],
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;
  error = '';

  constructor(private auth: AuthService, private router: Router) {}

  submit(): void {
    if (!this.email || !this.password) return;
    this.loading = true;
    this.error = '';
    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/diary']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.error || 'Could not sign in. Please try again.';
      },
    });
  }
}
