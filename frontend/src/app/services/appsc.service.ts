import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

// One APPSC question as sent to the browser. correct_option is nullable
// (unlike TetQuestion) for two reasons: `deleted` questions (officially
// cancelled by the exam board -- excluded from scoring) and a small number
// of genuinely ambiguous source-scan answer keys where two options were
// boxed as correct in the original document -- see `note` and the project
// plan doc's "APPSC Model Papers feature" section for the methodology.
export interface AppscQuestion {
  id: string;
  exam_group: string;
  year: number;
  paper: string;
  subject: string;
  number: number | null;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: number | null;
  deleted: number | boolean;
  note?: string | null;
  question_te?: string | null;
  option_a_te?: string | null;
  option_b_te?: string | null;
  option_c_te?: string | null;
  option_d_te?: string | null;
}

// One entry per (group, year, paper) -- what the picker grid shows.
export interface AppscPaper {
  group: string;
  year: number;
  paper: string;
  subjects: string[];
  total: number;
}

export interface AppscResponse {
  questions: AppscQuestion[];
  papers: AppscPaper[];
}

@Injectable({ providedIn: 'root' })
export class AppscService {
  private base = `${environment.apiUrl}/appsc`;
  constructor(private http: HttpClient) {}

  list() {
    return this.http.get<AppscResponse>(this.base);
  }
}
