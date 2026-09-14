import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { AttendanceService, ParentAttendance, RosterEntry, TeacherAttendance } from '../../services/attendance.service';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h2>Attendance</h2>

    <div class="date-row">
      <label>Date</label>
      <input type="date" [(ngModel)]="date" (ngModelChange)="refresh()" />
    </div>

    <p *ngIf="loading">Loading…</p>

    <ng-container *ngIf="!loading && auth.isTeacher()">
      <table>
        <thead>
          <tr><th>Roll</th><th>Name</th><th>Present</th></tr>
        </thead>
        <tbody>
          <tr *ngFor="let s of roster">
            <td>{{ s.roll }}</td>
            <td>{{ s.name }}</td>
            <td>
              <button
                [class.present]="s.present"
                [class.absent]="!s.present"
                (click)="toggle(s)"
              >
                {{ s.present ? 'Present' : 'Absent' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </ng-container>

    <ng-container *ngIf="!loading && !auth.isTeacher()">
      <div class="status-card" *ngIf="parentStatus !== null">
        Your child was <strong>{{ parentStatus ? 'present' : 'absent' }}</strong> on {{ date }}.
      </div>
      <div class="status-card" *ngIf="parentStatus === null">
        Attendance for {{ date }} hasn't been marked yet.
      </div>
    </ng-container>
  `,
  styles: [
    `
      h2 { color: #2c4870; }
      .date-row { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 1.2rem; }
      .date-row input { padding: 0.4rem 0.6rem; border-radius: 6px; border: 1px solid #ccc; }
      table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
      th, td { text-align: left; padding: 0.7rem 1rem; border-bottom: 1px solid #eee; }
      th { background: #ede7db; color: #444; font-size: 0.85rem; }
      button.present { background: #2f7a3d; color: white; border: none; padding: 0.35rem 0.8rem; border-radius: 6px; cursor: pointer; }
      button.absent { background: #b3261e; color: white; border: none; padding: 0.35rem 0.8rem; border-radius: 6px; cursor: pointer; }
      .status-card { background: white; padding: 1.2rem; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
    `,
  ],
})
export class AttendanceComponent implements OnInit {
  date = new Date().toISOString().slice(0, 10);
  loading = true;
  roster: RosterEntry[] = [];
  parentStatus: boolean | null = null;

  constructor(public auth: AuthService, private attendance: AttendanceService) {}

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading = true;
    this.attendance.get(this.date).subscribe({
      next: (res) => {
        if (this.auth.isTeacher()) {
          this.roster = (res as TeacherAttendance).roster;
        } else {
          this.parentStatus = (res as ParentAttendance).present;
        }
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  toggle(s: RosterEntry): void {
    const next = !s.present;
    s.present = next; // optimistic update
    this.attendance.setPresent(this.date, s.id, next).subscribe({
      error: () => {
        s.present = !next; // revert on failure
      },
    });
  }
}
