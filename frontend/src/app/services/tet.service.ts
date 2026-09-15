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

@Injectable({ providedIn: 'root' })
export class TetService {
  private base = `${environment.apiUrl}/tet`;
  constructor(private http: HttpClient) {}

  list() {
    return this.http.get<{ questions: TetQuestion[] }>(this.base);
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
