import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { apiErrorDetails } from '../api/api-error';

interface Envelope<T> {
  readonly data: T;
}
export interface IdentityProfile {
  readonly tenantId: string;
  readonly email: string;
  readonly displayName: string | null;
  readonly role: 'owner' | 'admin' | 'user';
  readonly emailVerified: boolean;
  readonly membershipStatus: string;
  readonly trialEndsAt: string | null;
  readonly onboardingCompleted: boolean;
  readonly tenant: {
    readonly name: string;
    readonly subscriptionEndsAt: string | null;
    readonly inGrace: boolean;
  };
}

@Injectable({ providedIn: 'root' })
export class IdentityApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/identity`;
  register(input: { name: string; company: string; email: string; password: string }) {
    return this.request(
      this.http.post<Envelope<unknown>>(`${this.base}/register`, {
        email: input.email.trim().toLowerCase(),
        password: input.password,
        tenantName: input.company.trim(),
        displayName: input.name.trim(),
        module: 'food-label',
      }),
    ).then(() => undefined);
  }
  me() {
    return this.request(this.http.get<Envelope<IdentityProfile>>(`${this.base}/me`));
  }
  resendVerification(email: string) {
    return this.request(
      this.http.post<Envelope<unknown>>(`${this.base}/resend-verification`, { email }),
    ).then(() => undefined);
  }
  private async request<T>(source: Observable<Envelope<T>>): Promise<T> {
    try {
      return (await firstValueFrom(source)).data;
    } catch (error) {
      if (error instanceof HttpErrorResponse)
        throw new Error(apiErrorDetails(error, 'İşlem tamamlanamadı.').message);
      throw error;
    }
  }
}

