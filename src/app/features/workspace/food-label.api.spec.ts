import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { FoodLabelApi, RecordDraft } from './food-label.api';
describe('FoodLabelApi', () => {
  let api: FoodLabelApi;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(FoodLabelApi);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('forwards record kind, archive and search filters', async () => {
    const result = api.list('product', false, 'granola');
    const request = http.expectOne(
      (r) =>
        r.url === `${environment.apiBaseUrl}/food-label/records` &&
        r.params.get('kind') === 'product' &&
        r.params.get('archived') === 'false' &&
        r.params.get('search') === 'granola',
    );
    request.flush({ data: { items: [] } });
    await expect(result).resolves.toEqual({ items: [] });
  });
  it('sends optimistic version and normalized evidence on update', async () => {
    const draft: RecordDraft = {
      kind: 'recipe',
      name: 'Kakaolu granola',
      location: 'İstanbul tesisi',
      market: 'AB',
      sku: 'GRN-001',
      brand: 'Odivon Foods',
      locale: 'de-DE',
      netQuantity: '500 g',
      ingredients: 'Yulaf, kakao, bal',
      allergensText: 'Gluten, süt',
      claimsText: 'Yüksek lif',
      energyKcal: 410,
      proteinG: 12,
      carbohydratesG: 63,
      fatG: 11,
      saltG: 0.25,
      responsibleName: 'Mevzuat Ekibi',
      reviewDueAt: '',
      approvedAt: '',
      notes: '',
      documentRefsText: 'doc-1, doc-2',
      status: 'in-review',
    };
    const result = api.update('r-1', 3, draft);
    const request = http.expectOne(`${environment.apiBaseUrl}/food-label/records/r-1`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body.expectedVersion).toBe(3);
    expect(request.request.body.documentRefs).toEqual(['doc-1', 'doc-2']);
    expect(request.request.body.allergens).toEqual(['Gluten', 'süt']);
    expect(request.request.body.claims).toEqual(['Yüksek lif']);
    request.flush({ data: { id: 'r-1' } });
    expect((await result).id).toBe('r-1');
  });
});
