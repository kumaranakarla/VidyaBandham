import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface SubscriptionStatus {
  active: boolean;
  currentPeriodEnd: string | null;
  amount: number;
  keyId: string;
}

export interface CreateOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

// Razorpay Checkout.js is loaded as a plain global script in index.html
// (not an npm package) — this is the shape of the `Razorpay` constructor it
// adds to `window`, just enough of it for what this app uses.
interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: { name?: string; email?: string };
  theme?: { color?: string };
  // Restricts which payment method tabs Checkout shows. Left unset,
  // Razorpay displays every method it supports (UPI, Cards, Netbanking,
  // Wallets, Pay Later, EMI) which is overwhelming for a ₹299 purchase —
  // UPI and Cards alone cover the overwhelming majority of how people in
  // India actually pay.
  method?: { netbanking?: '0' | '1'; card?: '0' | '1'; upi?: '0' | '1'; wallet?: '0' | '1'; paylater?: '0' | '1'; emi?: '0' | '1' };
  handler: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
  modal?: { ondismiss?: () => void };
}
declare const Razorpay: new (options: RazorpayCheckoutOptions) => { open: () => void };

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private base = `${environment.apiUrl}/subscription`;
  constructor(private http: HttpClient) {}

  status() {
    return this.http.get<SubscriptionStatus>(`${this.base}/status`);
  }

  createOrder() {
    return this.http.post<CreateOrderResponse>(`${this.base}/create-order`, {});
  }

  verify(payload: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
    return this.http.post<{ ok: boolean; currentPeriodEnd: string }>(`${this.base}/verify`, payload);
  }

  // Best-effort telemetry: tells the backend a payment attempt didn't make
  // it to /verify (checkout closed without paying, or the order couldn't
  // even be created), so the admin dashboard can show why people abandon
  // checkout. Never blocks or surfaces errors to the user — this is purely
  // for the app owner's own tracking.
  reportFailure(reason: 'user_cancelled' | 'order_creation_failed' | 'checkout_error', orderId?: string) {
    return this.http.post<{ ok: boolean; recorded: boolean }>(`${this.base}/report-failure`, { reason, orderId });
  }

  // Opens the Razorpay Checkout widget for one order, and resolves once the
  // payment is captured AND verified server-side (never trust the client-side
  // callback alone) or rejects if the user closes the widget without paying.
  openCheckout(
    order: CreateOrderResponse,
    user: { name: string; email?: string }
  ): Promise<{ currentPeriodEnd: string }> {
    return new Promise((resolve, reject) => {
      const rzp = new Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'Vidya Bandham — TET Prep',
        description: 'TET 2026 full access (30 days)',
        order_id: order.orderId,
        prefill: { name: user.name, email: user.email },
        theme: { color: '#2563eb' },
        method: { upi: '1', card: '1', netbanking: '0', wallet: '0', paylater: '0', emi: '0' },
        handler: (response) => {
          this.verify(response).subscribe({
            next: (res) => resolve({ currentPeriodEnd: res.currentPeriodEnd }),
            error: (err) => reject(err),
          });
        },
        modal: {
          ondismiss: () => reject(new Error('cancelled')),
        },
      });
      rzp.open();
    });
  }
}
