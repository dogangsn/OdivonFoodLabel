import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { apiErrorDetails } from '../../core/api/api-error';
interface Envelope<T> {
  data: T;
}
export interface SaasPlan {
  id: string;
  name: string;
  monthly: number | null;
  yearly: number | null;
}
export interface BillingStatus {
  membershipStatus: 'trial' | 'active' | 'expired' | 'grace';
  subscriptionEndsAt: string | null;
  graceEndsAt: string | null;
  inGrace: boolean;
  graceDays: number;
  daysLeft: number | null;
}
export interface PaymentRecord {
  id: string;
  receiptNo: string;
  planId: string;
  billingCycle: 'monthly' | 'yearly';
  amountKurus: number;
  currency: 'TRY';
  mode: 'sandbox' | 'live';
  periodStartsAt: string;
  periodEndsAt: string;
  paidAt: string;
}
export interface FoodLabelEntitlements {
  planId: 'starter' | 'pro' | 'enterprise';
  records: number | null;
  users: number | null;
  advancedReports: boolean;
  usage: { records: number };
}
export interface BuyerDraft {
  name: string;
  surname: string;
  identityNumber: string;
  email: string;
  gsmNumber: string;
  address: string;
  city: string;
  country: string;
}
@Injectable({ providedIn: 'root' })
export class BillingApi {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;
  plans() {
    return this.request(
      this.http.get<Envelope<SaasPlan[]>>(`${this.base}/payments/saas-plans/catalog`),
    );
  }
  status() {
    return this.request(this.http.get<Envelope<BillingStatus>>(`${this.base}/saas-billing/status`));
  }
  history() {
    return this.request(
      this.http.get<Envelope<PaymentRecord[]>>(`${this.base}/saas-billing/payments`),
    );
  }
  entitlements() {
    return this.request(
      this.http.get<Envelope<FoodLabelEntitlements>>(`${this.base}/food-label/entitlements`),
    );
  }
  async checkout(planId: string, billingCycle: 'monthly' | 'yearly', buyer: BuyerDraft) {
    const order = await this.request(
      this.http.post<Envelope<{ id: string }>>(`${this.base}/payments/saas-orders`, {
        planId,
        billingCycle,
      }),
    );
    const session = await this.request(
      this.http.post<Envelope<{ paymentPageUrl: string | null }>>(
        `${this.base}/payments/checkout`,
        { ...buyer, source: 'saas_subscription', sourceId: order.id },
      ),
    );
    if (!session.paymentPageUrl) throw new Error('Güvenli ödeme sayfası oluşturulamadı.');
    return session.paymentPageUrl;
  }
  session(id: string) {
    return this.request(
      this.http.get<Envelope<{ status: string; amountKurus: number; currency: string }>>(
        `${this.base}/payments/sessions/${encodeURIComponent(id)}`,
      ),
    );
  }
  reconcile(id: string) {
    return this.request(
      this.http.post<Envelope<{ status: string }>>(
        `${this.base}/payments/sessions/${encodeURIComponent(id)}/reconcile`,
        {},
      ),
    );
  }
  private async request<T>(source: Observable<Envelope<T>>): Promise<T> {
    try {
      return (await firstValueFrom(source)).data;
    } catch (error) {
      if (error instanceof HttpErrorResponse)
        throw new Error(apiErrorDetails(error, 'Abonelik servisine ulaşılamadı.').message);
      throw error;
    }
  }
}

