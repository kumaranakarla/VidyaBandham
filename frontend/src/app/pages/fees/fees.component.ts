import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { FeeRecord, FeesService } from '../../services/fees.service';

@Component({
  selector: 'app-fees',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h2>Fees</h2>

    <form *ngIf="auth.isTeacher()" class="setup-form" (ngSubmit)="setup()">
      <input [(ngModel)]="term" name="term" placeholder="Term (e.g. Term 2)" required />
      <input [(ngModel)]="amount" name="amount" type="number" placeholder="Amount" required />
      <input [(ngModel)]="dueDate" name="dueDate" placeholder="Due date (e.g. 30 Sep)" required />
      <button type="submit" [disabled]="setting">Set for whole class</button>
    </form>

    <p *ngIf="loading">Loading…</p>
    <p *ngIf="!loading && fees.length === 0">No fee records yet.</p>

    <table *ngIf="auth.isTeacher() && fees.length">
      <thead>
        <tr><th>Roll</th><th>Name</th><th>Term</th><th>Amount</th><th>Due</th><th>Status</th><th></th></tr>
      </thead>
      <tbody>
        <tr *ngFor="let f of fees">
          <td>{{ f.roll }}</td>
          <td>{{ f.student_name }}</td>
          <td>{{ f.term }}</td>
          <td>₹{{ f.amount }}</td>
          <td>{{ f.due_date }}</td>
          <td>
            <span *ngIf="f.paid" class="badge paid">Paid</span>
            <span *ngIf="!f.paid && f.parent_marked_paid_at" class="badge pending">Marked by parent</span>
            <span *ngIf="!f.paid && !f.parent_marked_paid_at" class="badge unpaid">Unpaid</span>
          </td>
          <td>
            <button *ngIf="!f.paid" (click)="confirm(f)">Confirm received</button>
          </td>
        </tr>
      </tbody>
    </table>

    <ng-container *ngIf="!auth.isTeacher()">
      <div class="fee-card" *ngFor="let f of fees">
        <div class="row"><span>Term</span><strong>{{ f.term }}</strong></div>
        <div class="row"><span>Amount</span><strong>₹{{ f.amount }}</strong></div>
        <div class="row"><span>Due date</span><strong>{{ f.due_date }}</strong></div>
        <div class="row"><span>Status</span>
          <strong *ngIf="f.paid">Paid</strong>
          <strong *ngIf="!f.paid && f.parent_marked_paid_at">Waiting for school to confirm</strong>
          <strong *ngIf="!f.paid && !f.parent_marked_paid_at">Unpaid</strong>
        </div>
        <button *ngIf="!f.paid && !f.parent_marked_paid_at" (click)="markPaid(f)">I've paid this</button>
      </div>
    </ng-container>
  `,
  styles: [
    `
      h2 { color: #2c4870; }
      .setup-form { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
      .setup-form input { flex: 1; min-width: 120px; padding: 0.6rem; border-radius: 6px; border: 1px solid #ccc; }
      button { background: #c97c1f; color: white; border: none; border-radius: 6px; padding: 0.5rem 1rem; cursor: pointer; }
      button:disabled { opacity: 0.6; cursor: default; }
      table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
      th, td { text-align: left; padding: 0.6rem 0.8rem; border-bottom: 1px solid #eee; font-size: 0.92rem; }
      th { background: #ede7db; color: #444; font-size: 0.82rem; }
      .badge { padding: 0.2rem 0.6rem; border-radius: 10px; font-size: 0.78rem; }
      .badge.paid { background: #dcefe1; color: #2f7a3d; }
      .badge.pending { background: #fdf1da; color: #b3400f; }
      .badge.unpaid { background: #fbe4e2; color: #b3261e; }
      .fee-card { background: white; padding: 1.2rem; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); max-width: 360px; }
      .fee-card .row { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
      .fee-card button { margin-top: 0.8rem; width: 100%; }
    `,
  ],
})
export class FeesComponent implements OnInit {
  fees: FeeRecord[] = [];
  loading = true;
  setting = false;
  term = '';
  amount: number | null = null;
  dueDate = '';

  constructor(public auth: AuthService, private feesSvc: FeesService) {}

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading = true;
    this.feesSvc.list().subscribe({
      next: (res) => {
        this.fees = res.fees;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  setup(): void {
    if (!this.term || !this.amount || !this.dueDate) return;
    this.setting = true;
    this.feesSvc.setup(this.term, this.amount, this.dueDate).subscribe({
      next: () => {
        this.setting = false;
        this.term = '';
        this.amount = null;
        this.dueDate = '';
        this.refresh();
      },
      error: () => (this.setting = false),
    });
  }

  markPaid(f: FeeRecord): void {
    this.feesSvc.markPaid(f.student_id).subscribe({ next: () => this.refresh() });
  }

  confirm(f: FeeRecord): void {
    this.feesSvc.confirm(f.student_id).subscribe({ next: () => this.refresh() });
  }
}
