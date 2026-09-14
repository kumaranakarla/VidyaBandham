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
}

@Injectable({ providedIn: 'root' })
export class TetService {
  private base = `${environment.apiUrl}/tet`;
  constructor(private http: HttpClient) {}

  list() {
    return this.http.get<{ questions: TetQuestion[] }>(this.base);
  }
}
