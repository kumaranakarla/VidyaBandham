import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, AdminStats } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';

// A deliberately plain, single-page dashboard — the app owner's own curiosity
// view, not a product feature. No charts, no filters, no pagination: just
// the handful of numbers that answer "is anyone using this / paying for it".
@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-page">
      <header>
        <div class="brand">Vidya Bandham — Admin</div>
        <button (click)="auth.logout()">Log out</button>
      </header>

      <main>
        <p *ngIf="loading">Loading…</p>
        <p class="error" *ngIf="error">{{ error }}</p>

        <div class="grid" *ngIf="stats">
          <div class="card">
            <div class="label">Total members</div>
            <div class="value">{{ totalMembers }}</div>
            <div class="breakdown">
              <span *ngFor="let r of roleEntries">{{ r[0] }}: {{ r[1] }}</span>
            </div>
          </div>

          <div class="card">
            <div class="label">New signups</div>
            <div class="value">{{ stats.users.newSignups.last7Days }} <span class="unit">/ 7 days</span></div>
            <div class="breakdown"><span>{{ stats.users.newSignups.last30Days }} in the last 30 days</span></div>
          </div>

          <div class="card">
            <div class="label">Active subscriptions</div>
            <div class="value">{{ stats.subscriptions.active }}</div>
            <div class="breakdown"><span>{{ stats.subscriptions.totalPaid }} paid subscriptions all-time</span></div>
          </div>

          <div class="card">
            <div class="label">Total revenue</div>
            <div class="value">₹{{ stats.subscriptions.totalRevenueRupees }}</div>
            <div class="breakdown"><span>From all-time paid subscriptions</span></div>
          </div>

          <div class="card">
            <div class="label">Failed payment attempts</div>
            <div class="value">{{ stats.subscriptions.failed.total }}</div>
            <div class="breakdown">
              <span *ngFor="let r of failedReasonEntries">{{ reasonLabel(r[0]) }}: {{ r[1] }}</span>
            </div>
          </div>

          <div class="card">
            <div class="label">Site hits</div>
            <div class="value">{{ stats.hits.last7Days }} <span class="unit">/ 7 days</span></div>
            <div class="breakdown">
              <span>{{ stats.hits.last30Days }} in 30 days</span>
              <span>{{ stats.hits.allTime }} all-time</span>
            </div>
          </div>
        </div>

        <div class="recent" *ngIf="stats && stats.subscriptions.recent.length">
          <h2>Recent paid subscribers</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Amount</th>
                <th>Paid at</th>
                <th>Access until</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let r of stats.subscriptions.recent">
                <td>{{ r.name }}</td>
                <td>{{ r.email }}</td>
                <td>₹{{ r.amountRupees }}</td>
                <td>{{ r.paidAt | date: 'medium' }}</td>
                <td>{{ r.currentPeriodEnd | date: 'medium' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p *ngIf="stats && !stats.subscriptions.recent.length" class="empty">No paid subscriptions yet.</p>

        <div class="recent" *ngIf="stats && stats.subscriptions.failed.recent.length">
          <h2>Recent failed payment attempts</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Amount</th>
                <th>Reason</th>
                <th>Detail</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let r of stats.subscriptions.failed.recent">
                <td>{{ r.name }}</td>
                <td>{{ r.email }}</td>
                <td>₹{{ r.amountRupees }}</td>
                <td>{{ reasonLabel(r.reason) }}</td>
                <td class="detail-cell">{{ r.detail || '—' }}</td>
                <td>{{ r.createdAt | date: 'medium' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p *ngIf="stats && !stats.subscriptions.failed.recent.length" class="empty">No failed payment attempts yet.</p>

        <div class="recent" *ngIf="stats && stats.logins.length">
          <h2>Login activity</h2>
          <table>
            <thead>
              <tr>
                <th>Account</th>
                <th>Role</th>
                <th>Times logged in</th>
                <th>Last login</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let l of stats.logins" [class.demo-row]="l.isDemo">
                <td>
                  {{ l.email }}
                  <span class="demo-tag" *ngIf="l.isDemo">demo</span>
                </td>
                <td>{{ l.role }}</td>
                <td>{{ l.loginCount }}</td>
                <td>{{ l.lastLoginAt ? (l.lastLoginAt | date: 'medium') : 'never' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  `,
  styles: [
    `
      .admin-page {
        min-height: 100vh;
        background: #f4f1ea;
        font-family: system-ui, sans-serif;
      }
      header {
        background: #2c4870;
        color: white;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.8rem 1.5rem;
      }
      .brand { font-weight: 700; font-size: 1.15rem; }
      header button {
        background: transparent;
        border: 1px solid rgba(255, 255, 255, 0.5);
        color: white;
        padding: 0.35rem 0.7rem;
        border-radius: 6px;
        cursor: pointer;
      }
      main {
        max-width: 900px;
        margin: 0 auto;
        padding: 1.5rem 1rem 3rem;
      }
      .error { color: #b3261e; }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;
      }
      .card {
        background: white;
        border-radius: 10px;
        padding: 1rem 1.1rem;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
      }
      .label { font-size: 0.8rem; color: #777; margin-bottom: 0.3rem; }
      .value { font-size: 1.6rem; font-weight: 700; color: #2c4870; }
      .value .unit { font-size: 0.85rem; font-weight: 500; color: #999; }
      .breakdown { margin-top: 0.5rem; font-size: 0.78rem; color: #888; display: flex; flex-direction: column; gap: 0.15rem; }
      .recent h2 { color: #2c4870; font-size: 1.1rem; margin-bottom: 0.6rem; }
      table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; }
      th, td { text-align: left; padding: 0.55rem 0.7rem; font-size: 0.85rem; border-bottom: 1px solid #eee; }
      th { color: #777; font-weight: 600; background: #faf8f4; }
      .empty { color: #888; font-size: 0.9rem; }
      .detail-cell { color: #666; max-width: 260px; }
      .recent + .recent { margin-top: 2rem; }
      .demo-row { background: #fff9ef; }
      .demo-tag {
        display: inline-block;
        margin-left: 0.4rem;
        padding: 0.1rem 0.45rem;
        background: #f0c98a;
        color: #6b4a1a;
        border-radius: 999px;
        font-size: 0.68rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.02em;
      }
    `,
  ],
})
export class AdminComponent implements OnInit {
  stats: AdminStats | null = null;
  loading = true;
  error = '';

  constructor(private admin: AdminService, public auth: AuthService) {}

  ngOnInit(): void {
    this.admin.stats().subscribe({
      next: (res) => {
        this.stats = res;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.error || 'Could not load admin stats.';
      },
    });
  }

  get totalMembers(): number {
    if (!this.stats) return 0;
    return Object.values(this.stats.users.byRole).reduce((a, b) => a + b, 0);
  }

  get roleEntries(): [string, number][] {
    return this.stats ? Object.entries(this.stats.users.byRole) : [];
  }

  get failedReasonEntries(): [string, number][] {
    return this.stats ? Object.entries(this.stats.subscriptions.failed.byReason) : [];
  }

  reasonLabel(reason: string): string {
    switch (reason) {
      case 'user_cancelled':
        return 'Cancelled at checkout';
      case 'signature_mismatch':
        return 'Verification failed';
      case 'order_creation_failed':
        return 'Could not start payment';
      case 'checkout_error':
        return 'Checkout error';
      case 'payment_failed':
        return 'Payment declined';
      default:
        return 'Unknown';
    }
  }
}
