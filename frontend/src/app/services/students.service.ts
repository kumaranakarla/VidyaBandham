import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface StudentRecord {
  id: string;
  name: string;
  roll: string;
  parent_user_id: string | null;
  parent_email: string | null;
}

@Injectable({ providedIn: 'root' })
export class StudentsService {
  private base = `${environment.apiUrl}/students`;
  constructor(private http: HttpClient) {}

  list() {
    return this.http.get<{ students: StudentRecord[] }>(this.base);
  }

  add(name: string, roll: string) {
    return this.http.post<{ student: StudentRecord }>(this.base, { name, roll });
  }

  createParentLogin(studentId: string, email: string, password: string, name: string) {
    return this.http.post<{ parent: { id: string; email: string; name: string } }>(
      `${this.base}/${studentId}/parent`,
      { email, password, name }
    );
  }
}
