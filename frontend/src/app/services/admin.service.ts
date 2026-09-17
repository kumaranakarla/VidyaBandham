import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface AdminStats {
  users: {
    byRole: Record<string, number>;
    newSignups: { last7Days: number; last30Days: number };
  };
  subscriptions: {
    active: number;
    totalPaid: number;
    totalRevenueRupees: number;
    recent: {
      email: string;
      name: string;
      amountRupees: number;
      currentPeriodEnd: string | null;
      paidAt: string;
    }[];
  };
  hits: { last7Days: number; last30Days: number; allTime: number };
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private http: HttpClient) {}

  stats() {
    return this.http.get<AdminStats>(`${environment.apiUrl}/admin/stats`);
  }
}
