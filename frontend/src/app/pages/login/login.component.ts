import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="login-page">
      <div class="login-center">
        <div class="login-card already-in-card" *ngIf="loggedInUser as u; else loginFormTpl">
          <h1>Vidya Bandham</h1>
          <p class="subtitle">You're already signed in.</p>
          <p class="already-in-text">
            Signed in as <strong>{{ u.name }}</strong> ({{ roleLabel(u.role) }}).
          </p>
          <p class="already-in-text-te">
            మీరు ఇప్పటికే <strong>{{ u.name }}</strong> ({{ roleLabel(u.role) }})గా సైన్ ఇన్ అయ్యారు.
          </p>
          <button type="button" (click)="continueToDashboard()">Continue to dashboard</button>
          <p class="signin-hint">
            Not you? <a href="javascript:void(0)" (click)="signOut()">Sign out</a> to use a different account.
          </p>
        </div>
        <ng-template #loginFormTpl>
        <form class="login-card" (ngSubmit)="submit()">
          <div class="login-primary">
            <h1>Vidya Bandham</h1>
            <p class="subtitle">School diary, attendance, homework &amp; fees — all in one place.</p>

            <label>Email</label>
            <input type="email" name="email" [(ngModel)]="email" placeholder="you@example.com" required autofocus />

            <label>Password</label>
            <input type="password" name="password" [(ngModel)]="password" placeholder="Password" required />

            <button type="submit" [disabled]="loading">{{ loading ? 'Signing in…' : 'Sign in' }}</button>

            <p class="signin-hint">New here? <a routerLink="/signup">Create Free Account</a></p>
            <p class="signin-hint-te">కొత్తవారా? <a routerLink="/signup">ఉచిత ఖాతా సృష్టించండి</a></p>

            <p class="error" *ngIf="error">{{ error }}</p>
            <p class="error-te" *ngIf="errorTe">{{ errorTe }}</p>
          </div>

          <div class="login-secondary">
            <div class="cta-banner">
              <p class="cta-title">📝 Preparing for AP TET 2026?</p>
              <p class="cta-title-te">2026 APTET కోసం సిద్ధమవుతున్నారా?</p>
              <p class="cta-text">Create your free account and start practicing 2 official papers right away — no payment needed.</p>
              <p class="cta-text-te">మీ ఉచిత ఖాతాను సృష్టించి, చెల్లింపు అవసరం లేకుండా వెంటనే 2 అధికారిక పేపర్లను ప్రాక్టీస్ చేయడం ప్రారంభించండి.</p>
              <a routerLink="/signup" class="cta-button">
                <span class="cta-button-en">Create Free Account →</span>
                <span class="cta-button-te">ఉచిత ఖాతా సృష్టించండి →</span>
              </a>
            </div>
          </div>
        </form>
        </ng-template>
      </div>

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
        /* Layered radial glows (brand blue + orange) over a soft diagonal
           gradient, plus a very faint tiled pattern of school icons (book,
           pencil, graduation cap, apple) drawn as an inline SVG data URI —
           no external image file needed. Opacity is baked into the SVG
           itself (0.065) so it reads as a subtle texture, not clutter,
           and the white login card stays the clear focal point. */
        background:
          radial-gradient(circle at 15% 20%, rgba(44, 72, 112, 0.16), transparent 45%),
          radial-gradient(circle at 85% 80%, rgba(201, 124, 31, 0.18), transparent 45%),
          url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%27320%27%20height%3D%27320%27%20viewBox%3D%270%200%20320%20320%27%3E%0A%20%20%3Cg%20fill%3D%27none%27%20stroke%3D%27%232c4870%27%20stroke-width%3D%272.2%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%20opacity%3D%270.065%27%3E%0A%20%20%20%20%3Cg%20transform%3D%27translate%2830%2C40%29%20rotate%28-6%29%27%3E%0A%20%20%20%20%20%20%3Cpath%20d%3D%27M0%200%20Q16%20-9%2032%200%20L32%2020%20Q16%2011%200%2020%20Z%27%2F%3E%0A%20%20%20%20%20%20%3Cpath%20d%3D%27M32%200%20Q48%20-9%2064%200%20L64%2020%20Q48%2011%2032%2020%20Z%27%2F%3E%0A%20%20%20%20%20%20%3Cpath%20d%3D%27M32%200%20L32%2020%27%2F%3E%0A%20%20%20%20%3C%2Fg%3E%0A%20%20%20%20%3Cg%20transform%3D%27translate%28200%2C20%29%20rotate%2818%29%27%3E%0A%20%20%20%20%20%20%3Cpath%20d%3D%27M0%200%20L34%2034%20L28%2040%20L-6%206%20Z%27%2F%3E%0A%20%20%20%20%20%20%3Cpath%20d%3D%27M28%2040%20L20%2048%20L14%2042%20Z%27%20fill%3D%27%232c4870%27%2F%3E%0A%20%20%20%20%3C%2Fg%3E%0A%20%20%20%20%3Cg%20transform%3D%27translate%2840%2C190%29%20rotate%284%29%27%3E%0A%20%20%20%20%20%20%3Cpath%20d%3D%27M0%200%20L28%20-12%20L56%200%20L28%2012%20Z%27%2F%3E%0A%20%20%20%20%20%20%3Cpath%20d%3D%27M28%2012%20L28%2030%27%2F%3E%0A%20%20%20%20%20%20%3Ccircle%20cx%3D%2728%27%20cy%3D%2733%27%20r%3D%272.5%27%20fill%3D%27%232c4870%27%2F%3E%0A%20%20%20%20%20%20%3Cpath%20d%3D%27M0%204%20L0%2020%20Q28%2032%2056%2020%20L56%204%27%2F%3E%0A%20%20%20%20%3C%2Fg%3E%0A%20%20%20%20%3Cg%20transform%3D%27translate%28230%2C210%29%27%3E%0A%20%20%20%20%20%20%3Ccircle%20cx%3D%2716%27%20cy%3D%2716%27%20r%3D%2716%27%2F%3E%0A%20%20%20%20%20%20%3Cpath%20d%3D%27M16%200%20Q18%20-8%2026%20-8%27%2F%3E%0A%20%20%20%20%20%20%3Cpath%20d%3D%27M26%20-8%20Q32%20-8%2032%20-2%27%2F%3E%0A%20%20%20%20%3C%2Fg%3E%0A%20%20%3C%2Fg%3E%0A%3C%2Fsvg%3E")
            repeat,
          linear-gradient(135deg, #eef1f6 0%, #f4f1ea 55%, #fdf2e3 100%);
        background-size: auto, auto, 320px 320px, auto;
        font-family: system-ui, sans-serif;
        font-weight: bold;
      }
      .login-center {
        flex: 1 1 auto;
        display: flex;
        /* No align-items:center here - that's the cross-axis (vertical)
           centering for this row-direction flex, and centering an
           overflowing child that way clips it symmetrically off both
           edges, in every browser, with no reliable way to scroll back to
           the clipped part. .login-card below uses margin:auto instead,
           which centers the same way when it fits but safely collapses to
           a normal, fully-scrollable top-aligned box the moment it's
           taller than the available space. */
        justify-content: center;
        padding: 0.75rem 1.5rem;
        box-sizing: border-box;
        width: 100%;
      }
      .login-card {
        background: white;
        padding: 2rem;
        border-radius: 14px;
        box-shadow: 0 12px 40px rgba(44, 72, 112, 0.14), 0 2px 8px rgba(0, 0, 0, 0.06);
        margin: auto 0;
        width: 100%;
        max-width: 360px;
        font-weight: bold;
        box-sizing: border-box;
      }
      /* On phones/narrow screens, .login-primary and .login-secondary just
         stack as normal block elements (no extra CSS needed) — the same
         single-column layout as before. From tablet width up, there's
         enough room to put the login form and the TET-2026 promo +
         demo-logins side by side instead of one long scroll, so the card
         widens and switches to a two-column flex row. */
      @media (min-width: 860px) {
        /* Scoped to the <form> specifically (not the plain .already-in-card
           div below) - .login-card also matches the "already signed in"
           card, which has no .login-primary/.login-secondary children, so
           turning IT into a flex row at this width just scattered its
           heading/text/button sideways into one cramped line, in every
           browser, not just one. */
        form.login-card {
          max-width: 780px;
          display: flex;
          align-items: flex-start;
          gap: 2.5rem;
        }
        .login-primary {
          flex: 1 1 0;
          min-width: 0;
        }
        .login-secondary {
          flex: 1 1 0;
          min-width: 0;
          padding-left: 2.5rem;
          border-left: 1px solid #eee;
        }
        /* Both sit at the top of the same cta-banner/demo styling, but
           without the form's own top margin pushing them down unevenly. */
        .login-secondary .cta-banner {
          margin-top: 0;
        }
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
      .error-te {
        color: #b3261e;
        margin-top: 0.2rem;
        font-size: 0.8rem;
        font-weight: 600;
      }
      .signin-hint {
        margin: 0.6rem 0 0;
        text-align: center;
        font-size: 0.9rem;
        color: #4a6690;
      }
      .signin-hint a {
        color: #2c4870;
        font-weight: bold;
        text-decoration: none;
      }
      .signin-hint a:hover {
        text-decoration: underline;
      }
      .signin-hint .or-word,
      .signin-hint-te .or-word {
        color: #4a6690;
        font-weight: bold;
        margin: 0 0.3em;
      }
      .signin-hint-te {
        margin: 0.15rem 0 0;
        text-align: center;
        font-size: 0.78rem;
        color: #888;
      }
      .signin-hint-te a {
        color: #4a6690;
        font-weight: 600;
        text-decoration: none;
      }
      .signin-hint-te a:hover {
        text-decoration: underline;
      }
      .already-in-text {
        margin: 0.75rem 0 0;
        color: #333;
        font-size: 0.95rem;
      }
      .already-in-text-te {
        margin: 0.25rem 0 0;
        color: #888;
        font-size: 0.8rem;
        font-weight: 500;
      }
      .already-in-card .signin-hint {
        margin-top: 1rem;
      }
      .cta-banner {
        margin-top: 1.5rem;
        padding: 1.1rem 1.1rem 1.2rem;
        background: linear-gradient(135deg, #fff4e6, #fffaf2);
        border: 1px solid #f0c98a;
        border-radius: 10px;
        text-align: center;
      }
      .cta-title {
        margin: 0 0 0.15rem;
        color: #6b4a1a;
        font-size: 0.95rem;
        font-weight: bold;
      }
      .cta-title-te {
        margin: 0 0 0.35rem;
        color: #8a6a3a;
        font-size: 0.85rem;
        font-weight: 600;
      }
      .cta-text {
        margin: 0 0 0.2rem;
        color: #8a6a3a;
        font-size: 0.8rem;
        font-weight: 500;
        line-height: 1.35;
      }
      .cta-text-te {
        margin: 0 0 0.9rem;
        color: #9c7f52;
        font-size: 0.78rem;
        font-weight: 500;
        line-height: 1.35;
      }
      .cta-button {
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        gap: 0.15rem;
        background: #c97c1f;
        color: white;
        padding: 0.55rem 1.3rem;
        border-radius: 999px;
        text-decoration: none;
        letter-spacing: 0.01em;
      }
      .cta-button-en {
        font-size: 0.85rem;
        font-weight: bold;
      }
      .cta-button-te {
        font-size: 0.72rem;
        font-weight: 500;
        opacity: 0.92;
      }
      .cta-button:hover {
        background: #b56c15;
      }
      /* Bottom-of-page contact strip + credit footer, styled after the
         official AP TET site's "For any queries" box + designed-by bar. */
      .contact-box {
        width: 100%;
        padding: 0.5rem 1.5rem;
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
        padding: 0.35rem 1rem;
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
    `,
  ],
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;
  error = '';
  errorTe = '';

  private static readonly ERROR_TRANSLATIONS: Record<string, string> = {
    'Email and password are required.': 'ఇమెయిల్, పాస్‌వర్డ్ రెండూ అవసరం.',
    'Could not sign in. Check the email and password and try again.':
      'సైన్ ఇన్ చేయలేకపోయాము. ఇమెయిల్, పాస్‌వర్డ్ సరిచూసి మళ్లీ ప్రయత్నించండి.',
    'Could not sign in. Please try again.': 'సైన్ ఇన్ చేయలేకపోయాము. దయచేసి మళ్లీ ప్రయత్నించండి.',
    'Something went wrong on the server.': 'సర్వర్‌లో ఏదో సమస్య వచ్చింది.',
  };

  private setError(message: string): void {
    this.error = message;
    this.errorTe = LoginComponent.ERROR_TRANSLATIONS[message] || '';
  }

  constructor(private auth: AuthService, private router: Router) {}

  // A signal read, so the template swaps between the "already signed in"
  // card and the login form the moment auth.user() changes (e.g. right
  // after signOut() below) without needing a route change.
  get loggedInUser() {
    return this.auth.user();
  }

  private landingPathFor(role: string): string {
    return role === 'admin' ? '/admin' : role === 'tet_subscriber' ? '/tet-2026' : '/diary';
  }

  roleLabel(role: string): string {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'teacher':
        return 'Teacher';
      case 'parent':
        return 'Parent';
      case 'tet_subscriber':
        return 'TET Prep';
      default:
        return role;
    }
  }

  continueToDashboard(): void {
    const u = this.loggedInUser;
    if (!u) return;
    this.router.navigate([this.landingPathFor(u.role)]);
  }

  signOut(): void {
    this.auth.logout('/login');
  }

  submit(): void {
    if (!this.email || !this.password) return;
    this.loading = true;
    this.setError('');
    this.auth.login(this.email, this.password).subscribe({
      next: (res) => {
        this.loading = false;
        this.router.navigate([this.landingPathFor(res.user.role)]);
      },
      error: (err) => {
        this.loading = false;
        this.setError(err?.error?.error || 'Could not sign in. Please try again.');
      },
    });
  }
}
