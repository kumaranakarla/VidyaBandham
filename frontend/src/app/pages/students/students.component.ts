import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentRecord, StudentsService } from '../../services/students.service';

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h2>Students</h2>

    <form class="add-form" (ngSubmit)="addStudent()">
      <input [(ngModel)]="name" name="name" placeholder="Student name" required />
      <input [(ngModel)]="roll" name="roll" placeholder="Roll no." required />
      <button type="submit" [disabled]="!name.trim() || !roll.trim() || savingStudent">Add student</button>
    </form>

    <p *ngIf="loading">Loading…</p>

    <ul class="students">
      <li *ngFor="let s of students">
        <div class="row">
          <div><strong>{{ s.roll }}</strong> — {{ s.name }}</div>
          <div class="parent-info">
            <span *ngIf="s.parent_email">Parent login: {{ s.parent_email }}</span>
            <button *ngIf="!s.parent_email" (click)="openParentForm(s)">Create parent login</button>
          </div>
        </div>

        <form *ngIf="parentFormFor === s.id" class="parent-form" (ngSubmit)="createParent(s)">
          <input [(ngModel)]="parentName" name="parentName" placeholder="Parent name" />
          <input [(ngModel)]="parentEmail" name="parentEmail" type="email" placeholder="Parent email" required />
          <input [(ngModel)]="parentPassword" name="parentPassword" placeholder="Password (min 6 chars)" required />
          <button type="submit" [disabled]="savingParent">Create</button>
          <span class="error" *ngIf="parentError">{{ parentError }}</span>
        </form>
      </li>
    </ul>
  `,
  styles: [
    `
      h2 { color: #2c4870; }
      .add-form { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
      .add-form input { flex: 1; padding: 0.6rem; border-radius: 6px; border: 1px solid #ccc; }
      button { background: #c97c1f; color: white; border: none; border-radius: 6px; padding: 0.5rem 1rem; cursor: pointer; }
      button:disabled { opacity: 0.6; cursor: default; }
      .students { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.75rem; }
      .students li { background: white; padding: 0.9rem 1.1rem; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
      .row { display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; }
      .parent-info { font-size: 0.85rem; color: #555; }
      .parent-form { display: flex; gap: 0.5rem; margin-top: 0.7rem; flex-wrap: wrap; }
      .parent-form input { flex: 1; min-width: 140px; padding: 0.5rem; border-radius: 6px; border: 1px solid #ccc; }
      .error { color: #b3261e; font-size: 0.82rem; }
    `,
  ],
})
export class StudentsComponent implements OnInit {
  students: StudentRecord[] = [];
  loading = true;
  name = '';
  roll = '';
  savingStudent = false;

  parentFormFor: string | null = null;
  parentName = '';
  parentEmail = '';
  parentPassword = '';
  savingParent = false;
  parentError = '';

  constructor(private studentsSvc: StudentsService) {}

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading = true;
    this.studentsSvc.list().subscribe({
      next: (res) => {
        this.students = res.students;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  addStudent(): void {
    if (!this.name.trim() || !this.roll.trim()) return;
    this.savingStudent = true;
    this.studentsSvc.add(this.name.trim(), this.roll.trim()).subscribe({
      next: () => {
        this.name = '';
        this.roll = '';
        this.savingStudent = false;
        this.refresh();
      },
      error: () => (this.savingStudent = false),
    });
  }

  openParentForm(s: StudentRecord): void {
    this.parentFormFor = s.id;
    this.parentName = '';
    this.parentEmail = '';
    this.parentPassword = '';
    this.parentError = '';
  }

  createParent(s: StudentRecord): void {
    if (!this.parentEmail.trim() || this.parentPassword.length < 6) {
      this.parentError = 'Enter an email and a password of at least 6 characters.';
      return;
    }
    this.savingParent = true;
    this.parentError = '';
    this.studentsSvc.createParentLogin(s.id, this.parentEmail.trim(), this.parentPassword, this.parentName.trim()).subscribe({
      next: () => {
        this.savingParent = false;
        this.parentFormFor = null;
        this.refresh();
      },
      error: (err) => {
        this.savingParent = false;
        this.parentError = err?.error?.error || 'Could not create parent login.';
      },
    });
  }
}
