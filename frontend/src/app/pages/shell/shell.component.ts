import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="shell">
      <header>
        <div class="brand">Vidya Bandham</div>
        <nav>
          <!-- A tet_subscriber account has no class/students/etc., so the
               school-management nav (diary/homework/attendance/fees/
               students) stays hidden for that role — but TET Prep, Mock
               Test, and 2026 (New) are exactly what a subscriber account is
               for, so those three stay visible for everyone. -->
          <ng-container *ngIf="!auth.isSubscriberOnly()">
            <a routerLink="/diary" routerLinkActive="active">Diary</a>
            <a routerLink="/homework" routerLinkActive="active">Homework</a>
            <a routerLink="/attendance" routerLinkActive="active">Attendance</a>
            <a routerLink="/fees" routerLinkActive="active">Fees</a>
            <a *ngIf="auth.isTeacher()" routerLink="/students" routerLinkActive="active">Students</a>
          </ng-container>
          <a routerLink="/tet" routerLinkActive="active">TET Prep</a>
          <a routerLink="/mock-test" routerLinkActive="active">Mock Test</a>
          <a routerLink="/tet-2026" routerLinkActive="active" class="nav-new-flash">2026 (New)</a>
          <a routerLink="/grand-test" routerLinkActive="active">Grand Test</a>
        </nav>
        <div class="user">
          <span>{{ auth.user()?.name }}</span>
          <button (click)="auth.logout()">Log out</button>
        </div>
      </header>
      <main>
        <router-outlet></router-outlet>
      </main>
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
        color: #d9e0ea;
        text-decoration: none;
        font-size: 0.95rem;
        padding: 0.3rem 0.1rem;
        border-bottom: 2px solid transparent;
      }
      nav a.active {
        color: white;
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
        0%, 100% { color: #ff6b6b; text-shadow: 0 0 6px rgba(255, 107, 107, 0.7); }
        50% { color: #ffd166; text-shadow: 0 0 10px rgba(255, 209, 102, 0.9); }
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
    `,
  ],
})
export class ShellComponent {
  constructor(public auth: AuthService) {}
}
