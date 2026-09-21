import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface AdminStats {
  users: {
    byRole: Record<string, number>;
    newSignups: { last7Days: number; last30Days: number };
    occupationBreakdown: Record<string, number>;
    recentSignups: {
      email: string;
      name: string;
      role: string;
      occupation: string | null;
      createdAt: string;
    }[];
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
    failed: {
      total: number;
      byReason: Record<string, number>;
      recent: {
        email: string;
        name: string;
        amountRupees: number;
        reason: string;
        detail: string | null;
        createdAt: string;
      }[];
    };
  };
  hits: { last7Days: number; last30Days: number; allTime: number };
  logins: {
    email: string;
    name: string;
    role: string;
    loginCount: number;
    lastLoginAt: string | null;
    isDemo: boolean;
  }[];
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private http: HttpClient) {}

  stats() {
    return this.http.get<AdminStats>(`${environment.apiUrl}/admin/stats`);
  }
}
