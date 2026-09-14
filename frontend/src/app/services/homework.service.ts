import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface HomeworkItem {
  id: string;
  subject: string;
  task: string;
  due: string;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class HomeworkService {
  private base = `${environment.apiUrl}/homework`;
  constructor(private http: HttpClient) {}

  list() {
    return this.http.get<{ items: HomeworkItem[] }>(this.base);
  }

  add(subject: string, task: string, due: string) {
    return this.http.post<{ item: HomeworkItem }>(this.base, { subject, task, due });
  }
}
