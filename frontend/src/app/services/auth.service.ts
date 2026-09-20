import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { User } from '../models/user.model';

const TOKEN_KEY = 'vidyabandham_token';
const USER_KEY = 'vidyabandham_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  user = signal<User | null>(this.readStoredUser());

  constructor(private http: HttpClient, private router: Router) {}

  private readStoredUser(): User | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  login(email: string, password: string): Observable<{ token: string; user: User }> {
    return this.http
      .post<{ token: string; user: User }>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap((res) => {
          localStorage.setItem(TOKEN_KEY, res.token);
          localStorage.setItem(USER_KEY, JSON.stringify(res.user));
          this.user.set(res.user);
        })
      );
  }

  // Public self-signup, for TET Prep subscribers only — teacher/parent
  // accounts are still created from inside the app, not through this.
  register(name: string, email: string, password: string): Observable<{ token: string; user: User }> {
    return this.http
      .post<{ token: string; user: User }>(`${environment.apiUrl}/auth/register`, { name, email, password })
      .pipe(
        tap((res) => {
          localStorage.setItem(TOKEN_KEY, res.token);
          localStorage.setItem(USER_KEY, JSON.stringify(res.user));
          this.user.set(res.user);
        })
      );
  }

  // redirectTo lets a caller send the user somewhere other than /login after
  // signing out — e.g. a demo teacher/parent account clicking "Create
  // Account" from the TET 2026 paywall gets logged out straight into /signup
  // instead of landing back on the login page first.
  logout(redirectTo: string = '/login'): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.user.set(null);
    this.router.navigate([redirectTo]);
  }

  isTeacher(): boolean {
    return this.user()?.role === 'teacher';
  }

  // A tet_subscriber account has no class/students/diary/etc. — it exists
  // only to practice TET 2026 papers, so the rest of the app's nav should
  // stay out of its way.
  isSubscriberOnly(): boolean {
    return this.user()?.role === 'tet_subscriber';
  }

  // Lets a signed-in user (used from the admin dashboard, but works for any
  // role) change their own password without shell/database access.
  changePassword(currentPassword: string, newPassword: string): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${environment.apiUrl}/auth/change-password`, {
      currentPassword,
      newPassword,
    });
  }
}
