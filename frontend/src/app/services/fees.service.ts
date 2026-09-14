import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface FeeRecord {
  student_id: string;
  term: string;
  amount: number;
  due_date: string;
  paid: number;
  parent_marked_paid_at: string | null;
  paid_at: string | null;
  student_name?: string;
  roll?: string;
}

@Injectable({ providedIn: 'root' })
export class FeesService {
  private base = `${environment.apiUrl}/fees`;
  constructor(private http: HttpClient) {}

  list() {
    return this.http.get<{ fees: FeeRecord[] }>(this.base);
  }

  setup(term: string, amount: number, dueDate: string) {
    return this.http.post<{ ok: boolean; count: number }>(`${this.base}/setup`, { term, amount, dueDate });
  }

  markPaid(studentId: string) {
    return this.http.post<{ ok: boolean }>(`${this.base}/${studentId}/mark-paid`, {});
  }

  confirm(studentId: string) {
    return this.http.post<{ ok: boolean }>(`${this.base}/${studentId}/confirm`, {});
  }
}
