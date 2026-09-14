import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { DiaryEntry, DiaryService } from '../../services/diary.service';

@Component({
  selector: 'app-diary',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h2>Class Diary</h2>

    <form *ngIf="auth.isTeacher()" class="add-form" (ngSubmit)="add()">
      <textarea [(ngModel)]="note" name="note" rows="2" placeholder="Write a note for parents…" required></textarea>
      <button type="submit" [disabled]="!note.trim() || saving">Post</button>
    </form>

    <p *ngIf="loading">Loading…</p>
    <p *ngIf="!loading && entries.length === 0">No diary entries yet.</p>

    <ul class="entries">
      <li *ngFor="let e of entries">
        <div class="meta">{{ e.who }} · {{ e.created_at | date: 'medium' }}</div>
        <div class="note">{{ e.note }}</div>
      </li>
    </ul>
  `,
  styles: [
    `
      h2 { color: #2c4870; }
      .add-form { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
      textarea { flex: 1; padding: 0.6rem; border-radius: 6px; border: 1px solid #ccc; font-family: inherit; resize: vertical; }
      button { background: #c97c1f; color: white; border: none; border-radius: 6px; padding: 0 1.2rem; cursor: pointer; }
      button:disabled { opacity: 0.6; cursor: default; }
      .entries { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.75rem; }
      .entries li { background: white; padding: 0.9rem 1.1rem; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
      .meta { font-size: 0.78rem; color: #888; margin-bottom: 0.3rem; }
      .note { color: #222; }
    `,
  ],
})
export class DiaryComponent implements OnInit {
  entries: DiaryEntry[] = [];
  loading = true;
  saving = false;
  note = '';

  constructor(public auth: AuthService, private diary: DiaryService) {}

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading = true;
    this.diary.list().subscribe({
      next: (res) => {
        this.entries = res.entries;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  add(): void {
    if (!this.note.trim()) return;
    this.saving = true;
    this.diary.add(this.note.trim()).subscribe({
      next: () => {
        this.note = '';
        this.saving = false;
        this.refresh();
      },
      error: () => (this.saving = false),
    });
  }
}
