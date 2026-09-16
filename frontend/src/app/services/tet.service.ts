import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface TetQuestion {
  id: string;
  subject: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: number;
  source: string;
  year: number | null;
  // Telugu translation — only present for Child Development & Pedagogy,
  // Mathematics, and Science & EVS (English-subject questions test the
  // English language itself, so they stay English-only, same as the real
  // AP TET papers). null/undefined when not available.
  question_te?: string | null;
  option_a_te?: string | null;
  option_b_te?: string | null;
  option_c_te?: string | null;
  option_d_te?: string | null;
}

// Mock-test question as sent to the browser — no correct_option, so it
// can't be read off the network tab before the test is submitted.
export interface MockQuestion {
  id: string;
  subject: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  source: string;
  year: number | null;
  question_te?: string | null;
  option_a_te?: string | null;
  option_b_te?: string | null;
  option_c_te?: string | null;
  option_d_te?: string | null;
}

export interface MockAnswer {
  id: string;
  selected: number | null;
}

export interface MockResultItem {
  id: string;
  subject: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  selected: number | null;
  correct_option: number;
  isCorrect: boolean;
  question_te?: string | null;
  option_a_te?: string | null;
  option_b_te?: string | null;
  option_c_te?: string | null;
  option_d_te?: string | null;
}

export interface MockSubmitResponse {
  total: number;
  correct: number;
  percent: number;
  results: MockResultItem[];
}

export interface MockAttempt {
  id: string;
  year: string;
  subject: string;
  total_questions: number;
  correct_answers: number;
  score_percent: number;
  taken_at: string;
}

// One entry per official 2026 exam paper, whether or not its questions were
// actually included in this response (a locked paper's name still shows up
// here, so the UI can list it with a lock icon).
export interface Tet2026Paper {
  name: string;
  free: boolean;
  locked: boolean;
}

export interface Tet2026Response {
  questions: TetQuestion[];
  papers: Tet2026Paper[];
  subscription: { active: boolean; currentPeriodEnd: string | null };
}

@Injectable({ providedIn: 'root' })
export class TetService {
  private base = `${environment.apiUrl}/tet`;
  // Separate base URL for the "2026 (New)" tab's own backend route
  // (/api/tet-2026, see backend/src/routes/tet2026.js) — kept apart from the
  // main TET Prep/Mock Test data on purpose, since this content is planned
  // to move behind a subscription later and having its own endpoint from the
  // start means that can be added without touching anything else here.
  private base2026 = `${environment.apiUrl}/tet-2026`;
  constructor(private http: HttpClient) {}

  list() {
    return this.http.get<{ questions: TetQuestion[] }>(this.base);
  }

  list2026() {
    return this.http.get<Tet2026Response>(this.base2026);
  }

  startMock(year: string, subject: string, count: number) {
    let params = `count=${count}`;
    if (year) params += `&year=${encodeURIComponent(year)}`;
    if (subject) params += `&subject=${encodeURIComponent(subject)}`;
    return this.http.get<{ questions: MockQuestion[]; available: number }>(`${this.base}/mock/start?${params}`);
  }

  submitMock(year: string, subject: string, answers: MockAnswer[]) {
    return this.http.post<MockSubmitResponse>(`${this.base}/mock/submit`, {
      year: year || null,
      subject: subject || null,
      answers,
    });
  }

  mockHistory() {
    return this.http.get<{ attempts: MockAttempt[] }>(`${this.base}/mock/history`);
  }
}
