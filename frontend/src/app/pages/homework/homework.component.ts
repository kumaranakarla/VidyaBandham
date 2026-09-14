import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { HomeworkItem, HomeworkService } from '../../services/homework.service';

@Component({
  selector: 'app-homework',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h2>Homework</h2>

    <form *ngIf="auth.isTeacher()" class="add-form" (ngSubmit)="add()">
      <input [(ngModel)]="subject" name="subject" placeholder="Subject" required />
      <input [(ngModel)]="task" name="task" placeholder="Task" required />
      <input [(ngModel)]="due" name="due" placeholder="Due (e.g. Due tomorrow)" />
      <button type="submit" [disabled]="!subject.trim() || !task.trim() || saving">Add</button>
    </form>

    <p *ngIf="loading">Loading…</p>
    <p *ngIf="!loading && items.length === 0">No homework posted yet.</p>

    <ul class="items">
      <li *ngFor="let h of items">
        <div class="subject">{{ h.subject }}</div>
        <div class="task">{{ h.task }}</div>
        <div class="due">{{ h.due }}</div>
      </li>
    </ul>
  `,
  styles: [
    `
      h2 { color: #2c4870; }
      .add-form { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
      input { flex: 1; min-width: 120px; padding: 0.6rem; border-radius: 6px; border: 1px solid #ccc; }
      button { background: #c97c1f; color: white; border: none; border-radius: 6px; padding: 0 1.2rem; cursor: pointer; }
      button:disabled { opacity: 0.6; cursor: default; }
      .items { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.75rem; }
      .items li { background: white; padding: 0.9rem 1.1rem; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
      .subject { font-weight: 600; color: #2c4870; }
      .task { margin: 0.2rem 0; }
      .due { font-size: 0.82rem; color: #b3400f; }
    `,
  ],
})
export class HomeworkComponent implements OnInit {
  items: HomeworkItem[] = [];
  loading = true;
  saving = false;
  subject = '';
  task = '';
  due = '';

  constructor(public auth: AuthService, private homework: HomeworkService) {}

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading = true;
    this.homework.list().subscribe({
      next: (res) => {
        this.items = res.items;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  add(): void {
    if (!this.subject.trim() || !this.task.trim()) return;
    this.saving = true;
    this.homework.add(this.subject.trim(), this.task.trim(), this.due.trim()).subscribe({
      next: () => {
        this.subject = '';
        this.task = '';
        this.due = '';
        this.saving = false;
        this.refresh();
      },
      error: () => (this.saving = false),
    });
  }
}
