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

// One row of the logged-in student's saved progress on a single question --
// always their LATEST attempt (a retry overwrites the previous one, it
// doesn't add a second row). See leap_progress's comment in db.js.
export interface LeapProgressRow {
  leap_question_id: string;
  selected_option: number;
  is_correct: number | boolean;
  updated_at: string;
}

export interface LeapProgressResponse {
  progress: LeapProgressRow[];
}

export interface LeapAnswerResult {
  is_correct: boolean;
  correct_option: number | null;
}

@Injectable({ providedIn: 'root' })
export class LeapService {
  private base = `${environment.apiUrl}/leap`;
  constructor(private http: HttpClient) {}

  list() {
    return this.http.get<LeapResponse>(this.base);
  }

  // The student's saved progress across every LEAP question they've
  // attempted (all subjects at once, same as list() loading everything up
  // front) -- powers the per-subject dashboard, "Review my mistakes", and
  // resuming practice where they left off.
  getProgress() {
    return this.http.get<LeapProgressResponse>(`${this.base}/progress`);
  }

  // Records (or, on a retry, overwrites) the student's answer to one
  // question. Graded server-side -- the response's is_correct/correct_option
  // is the source of truth, not anything computed locally.
  saveAnswer(leapQuestionId: string, selectedOption: number) {
    return this.http.post<LeapAnswerResult>(`${this.base}/progress`, {
      leap_question_id: leapQuestionId,
      selected_option: selectedOption,
    });
  }

  // "Clear answers for this subject" -- wipes saved progress for just one
  // subject so the student can start it over.
  clearSubjectProgress(subjectKey: string) {
    return this.http.delete<{ ok: boolean }>(`${this.base}/progress/${encodeURIComponent(subjectKey)}`);
  }
}
