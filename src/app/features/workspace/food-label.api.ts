import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { apiErrorDetails } from '../../core/api/api-error';

interface Envelope<T> {
  readonly data: T;
}
export type FoodLabelKind = 'product' | 'recipe' | 'allergen-review' | 'nutrition' | 'approval';
export type FoodLabelStatus = 'draft' | 'in-review' | 'action-required' | 'approved' | 'rejected';
export interface FoodLabelRecord {
  readonly id: string;
  readonly kind: FoodLabelKind;
  readonly name: string;
  readonly location: string;
  readonly market: string | null;
  readonly sku: string | null;
  readonly brand: string | null;
  readonly locale: string | null;
  readonly netQuantity: string | null;
  readonly ingredients: string | null;
  readonly allergens: string[];
  readonly claims: string[];
  readonly energyKcal: number | null;
  readonly proteinG: number | null;
  readonly carbohydratesG: number | null;
  readonly fatG: number | null;
  readonly saltG: number | null;
  readonly responsibleName: string | null;
  readonly reviewDueAt: string | null;
  readonly approvedAt: string | null;
  readonly notes: string | null;
  readonly documentRefs: string[];
  readonly status: FoodLabelStatus;
  readonly version: number;
  readonly updatedAt: string;
  readonly archivedAt: string | null;
}
export interface FoodLabelDashboard {
  readonly total: number;
  readonly products: number;
  readonly recipes: number;
  readonly allergenReviews: number;
  readonly approvals: number;
  readonly approved: number;
  readonly dueSoon: number;
  readonly actionRequired: number;
  readonly complianceScore: number;
}
export interface RecordDraft {
  kind: FoodLabelKind;
  name: string;
  location: string;
  market: string;
  sku: string;
  brand: string;
  locale: string;
  netQuantity: string;
  ingredients: string;
  allergensText: string;
  claimsText: string;
  energyKcal: number | null;
  proteinG: number | null;
  carbohydratesG: number | null;
  fatG: number | null;
  saltG: number | null;
  responsibleName: string;
  reviewDueAt: string;
  approvedAt: string;
  notes: string;
  documentRefsText: string;
  status: FoodLabelStatus;
}
@Injectable({ providedIn: 'root' })
export class FoodLabelApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/food-label`;
  list(kind: FoodLabelKind | null, archived: boolean, search: string) {
    let params = new HttpParams().set('archived', archived).set('limit', 100);
    if (kind) params = params.set('kind', kind);
    if (search.trim()) params = params.set('search', search.trim());
    return this.request(
      this.http.get<Envelope<{ items: FoodLabelRecord[] }>>(`${this.base}/records`, { params }),
    );
  }
  dashboard() {
    return this.request(this.http.get<Envelope<FoodLabelDashboard>>(`${this.base}/dashboard`));
  }
  create(draft: RecordDraft) {
    return this.request(
      this.http.post<Envelope<FoodLabelRecord>>(`${this.base}/records`, this.payload(draft)),
    );
  }
  update(id: string, version: number, draft: RecordDraft) {
    return this.request(
      this.http.patch<Envelope<FoodLabelRecord>>(`${this.base}/records/${encodeURIComponent(id)}`, {
        ...this.payload(draft),
        expectedVersion: version,
      }),
    );
  }
  archive(id: string) {
    return this.request(
      this.http.delete<Envelope<FoodLabelRecord>>(`${this.base}/records/${encodeURIComponent(id)}`),
    );
  }
  restore(id: string) {
    return this.request(
      this.http.post<Envelope<FoodLabelRecord>>(
        `${this.base}/records/${encodeURIComponent(id)}/restore`,
        {},
      ),
    );
  }
  report() {
    return this.request(this.http.get<Envelope<unknown>>(`${this.base}/reports/compliance`));
  }
  private payload(draft: RecordDraft) {
    return {
      ...draft,
      market: draft.market || undefined,
      sku: draft.sku || undefined,
      brand: draft.brand || undefined,
      locale: draft.locale || undefined,
      netQuantity: draft.netQuantity || undefined,
      ingredients: draft.ingredients || undefined,
      allergens: draft.allergensText
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      claims: draft.claimsText
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      responsibleName: draft.responsibleName || undefined,
      reviewDueAt: draft.reviewDueAt || undefined,
      approvedAt: draft.approvedAt || undefined,
      notes: draft.notes || undefined,
      documentRefs: draft.documentRefsText
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      documentRefsText: undefined,
      allergensText: undefined,
      claimsText: undefined,
    };
  }
  private async request<T>(source: Observable<Envelope<T>>): Promise<T> {
    try {
      return (await firstValueFrom(source)).data;
    } catch (error) {
      if (error instanceof HttpErrorResponse)
        throw new Error(apiErrorDetails(error, 'MainAPI isteği tamamlanamadı.').message);
      throw error;
    }
  }
}
