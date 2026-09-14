import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface DiaryEntry {
  id: string;
  who: string;
  note: string;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class DiaryService {
  private base = `${environment.apiUrl}/diary`;
  constructor(private http: HttpClient) {}

  list() {
    return this.http.get<{ entries: DiaryEntry[] }>(this.base);
  }

  add(note: string) {
    return this.http.post<{ entry: DiaryEntry }>(this.base, { note });
  }
}
