import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

// One LEAP question as sent to the browser. Mirrors AppscQuestion's shape
// (see appsc.service.ts) but keyed by (subject, position) instead of
// (exam_group, year, paper, number) -- this batch has no group/year/paper
// nesting, just 6 flat subjects. `position` is the row's stable identity
// (sequential, unique per subject); `number` is only the printed label and
// can genuinely repeat within a subject (see leap-data.js).
export interface LeapQuestion {
  id: string;
  subject: string;
  subject_label: string;
  position: number;
  number: number | null;
  question: string | null;
  option_a: string | null;
  option_b: string | null;
  option_c: string | null;
  option_d: string | null;
  correct_option: number | null;
  deleted: number | boolean;
  note?: string | null;
  question_te?: string | null;
  option_a_te?: string | null;
  option_b_te?: string | null;
  option_c_te?: string | null;
  option_d_te?: string | null;
}

// One entry per subject -- what the picker grid shows.
export interface LeapSubject {
  key: string;
  label: string;
  total: number;
}

export interface LeapResponse {
  questions: LeapQuestion[];
  subjects: LeapSubject[];
}

@Injectable({ providedIn: 'root' })
export class LeapService {
  private base = `${environment.apiUrl}/leap`;
  constructor(private http: HttpClient) {}

  list() {
    return this.http.get<LeapResponse>(this.base);
  }
}
