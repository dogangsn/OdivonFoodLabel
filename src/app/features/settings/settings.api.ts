import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { apiErrorDetails } from '../../core/api/api-error';
interface Envelope<T> {
  data: T;
}
export interface TenantUser {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  roleIds: string[];
  status: 'active' | 'inactive';
  emailVerified: boolean;
}
export interface RoleOption {
  id: string;
  name: string;
}
@Injectable({ providedIn: 'root' })
export class SettingsApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/identity`;
  users() {
    return this.request(this.http.get<Envelope<TenantUser[]>>(`${this.base}/users`));
  }
  roles() {
    return this.request(this.http.get<Envelope<RoleOption[]>>(`${this.base}/roles/lookup`));
  }
  createUser(input: { email: string; displayName: string; password: string; roleIds: string[] }) {
    return this.request(this.http.post<Envelope<TenantUser>>(`${this.base}/users`, input));
  }
  updateMe(input: { displayName: string; phone: string }) {
    return this.request(this.http.patch<Envelope<unknown>>(`${this.base}/me`, input));
  }
  deactivate(uid: string) {
    return this.request(
      this.http.delete<Envelope<{ uid: string }>>(`${this.base}/users/${encodeURIComponent(uid)}`),
    );
  }
  private async request<T>(source: Observable<Envelope<T>>): Promise<T> {
    try {
      return (await firstValueFrom(source)).data;
    } catch (error) {
      if (error instanceof HttpErrorResponse)
        throw new Error(apiErrorDetails(error, 'Ayar işlemi tamamlanamadı.').message);
      throw error;
    }
  }
}

