import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface RosterEntry {
  id: string;
  name: string;
  roll: string;
  present: boolean;
}

export interface TeacherAttendance {
  date: string;
  roster: RosterEntry[];
}

export interface ParentAttendance {
  date: string;
  present: boolean | null;
}

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private base = `${environment.apiUrl}/attendance`;
  constructor(private http: HttpClient) {}

  get(date?: string) {
    const params: Record<string, string> = date ? { date } : {};
    return this.http.get<TeacherAttendance | ParentAttendance>(this.base, { params });
  }

  setPresent(date: string, studentId: string, present: boolean) {
    return this.http.post<{ ok: boolean }>(`${this.base}/${date}/${studentId}`, { present });
  }
}
