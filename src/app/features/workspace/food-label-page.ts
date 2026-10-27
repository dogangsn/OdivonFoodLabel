import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2';
import { PRODUCT_NAVIGATION } from '../../domain/domain-navigation';
import { PageHeader } from '../../shared/ui/page-header';
import { SlideOver } from '../../shared/ui/slide-over';
import {
  FoodLabelApi,
  FoodLabelDashboard,
  FoodLabelKind,
  FoodLabelRecord,
  RecordDraft,
} from './food-label.api';

const KINDS: Record<string, FoodLabelKind> = {
  products: 'product',
  recipes: 'recipe',
  allergens: 'allergen-review',
  nutrition: 'nutrition',
  approvals: 'approval',
};
const emptyDraft = (kind: FoodLabelKind): RecordDraft => ({
  kind,
  name: '',
  location: '',
  market: '',
  sku: '',
  brand: '',
  locale: 'tr-TR',
  netQuantity: '',
  ingredients: '',
  allergensText: '',
  claimsText: '',
  energyKcal: null,
  proteinG: null,
  carbohydratesG: null,
  fatG: null,
  saltG: null,
  responsibleName: '',
  reviewDueAt: '',
  approvedAt: '',
  notes: '',
  documentRefsText: '',
  status: 'draft',
});

@Component({
  selector: 'app-food-label-page',
  imports: [PageHeader, SlideOver, DatePipe],
  template: `
    <div class="space-y-6">
      <app-page-header
        eyebrow="GIDA ETİKETİ UYUM MERKEZİ"
        [title]="title"
        [description]="description"
      >
        <div actions class="flex flex-wrap gap-2">
          <button type="button" class="odv-btn-soft" (click)="downloadReport()">
            <span class="material-symbols-rounded">download</span>Uyum paketi
          </button>
          @if (!overview) {
            <button type="button" class="odv-btn-primary" (click)="openCreate()">
              <span class="material-symbols-rounded">add</span>Yeni kayıt
            </button>
          }
        </div>
      </app-page-header>
      @if (error()) {
        <div class="rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-700" role="alert">
          {{ error() }} <button class="ms-3 underline" (click)="load()">Tekrar dene</button>
        </div>
      }

      @if (overview) {
        <section
          class="odv-card overflow-hidden bg-gradient-to-br from-slate-950 via-violet-950 to-fuchsia-950 p-7 text-white lg:p-9"
        >
          <div class="grid gap-7 lg:grid-cols-[1.3fr_1fr] lg:items-center">
            <div>
              <span class="odv-badge-success">CANLI UYUM RADARI</span>
              <h2 class="mb-3 mt-5 text-3xl font-black">
                Her ürün, her pazar ve her etiket sürümü kontrol altında
              </h2>
              <p class="m-0 max-w-2xl text-sm leading-7 text-slate-300">
                Reçeteden besin beyanına, alerjen incelemesinden pazar onayına kadar tüm kararları
                değişmez denetim iziyle yönetin.
              </p>
            </div>
            <div class="grid grid-cols-3 gap-3 text-center">
              <div class="rounded-2xl bg-white/10 p-4">
                <strong class="block text-3xl">%{{ dashboard()?.complianceScore ?? 100 }}</strong
                ><span class="text-xs text-slate-300">Uyum</span>
              </div>
              <div class="rounded-2xl bg-white/10 p-4">
                <strong class="block text-3xl">{{ dashboard()?.dueSoon ?? 0 }}</strong
                ><span class="text-xs text-slate-300">30 gün</span>
              </div>
              <div class="rounded-2xl bg-white/10 p-4">
                <strong class="block text-3xl">{{ dashboard()?.actionRequired ?? 0 }}</strong
                ><span class="text-xs text-slate-300">Aksiyon</span>
              </div>
            </div>
          </div>
        </section>
        <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          @for (metric of metrics(); track metric.label) {
            <article class="odv-card p-5">
              <div class="flex items-center justify-between">
                <span class="text-xs font-black uppercase tracking-wider text-slate-500">{{
                  metric.label
                }}</span
                ><span class="material-symbols-rounded text-violet-600">{{ metric.icon }}</span>
              </div>
              <strong class="mt-4 block text-4xl font-black">{{ metric.value }}</strong
              ><span class="mt-2 block text-xs text-slate-500">{{ metric.note }}</span>
            </article>
          }
        </section>
      }

      <section class="odv-card overflow-hidden">
        <div
          class="flex flex-col gap-4 border-b border-slate-200 p-5 dark:border-slate-700 lg:flex-row lg:items-center lg:justify-between"
        >
          <div class="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-900">
            <button
              class="rounded-lg px-4 py-2 text-xs font-bold"
              [class.bg-white]="!archived()"
              (click)="setArchived(false)"
            >
              Aktif</button
            ><button
              class="rounded-lg px-4 py-2 text-xs font-bold"
              [class.bg-white]="archived()"
              (click)="setArchived(true)"
            >
              Arşiv
            </button>
          </div>
          <label class="relative block lg:w-96"
            ><span class="sr-only">Kayıt ara</span
            ><span
              class="material-symbols-rounded pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-slate-400"
              >search</span
            ><input
              class="odv-input ps-10"
              type="search"
              placeholder="Ürün, SKU, marka, pazar veya sorumlu ara…"
              [value]="search()"
              (input)="search.set($any($event.target).value); scheduleLoad()"
          /></label>
        </div>
        @if (loading()) {
          <div class="grid min-h-64 place-items-center">
            <span class="material-symbols-rounded animate-spin text-4xl text-violet-600"
              >progress_activity</span
            >
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full min-w-[980px]">
              <thead>
                <tr>
                  <th class="odv-th">Kayıt</th>
                  <th class="odv-th">Tür</th>
                  <th class="odv-th">Üretim yeri</th>
                  <th class="odv-th">Hedef pazar</th>
                  <th class="odv-th">İnceleme tarihi</th>
                  <th class="odv-th">Durum</th>
                  <th class="odv-th"><span class="sr-only">İşlem</span></th>
                </tr>
              </thead>
              <tbody>
                @for (row of records(); track row.id) {
                  <tr class="hover:bg-violet-50/50 dark:hover:bg-slate-800">
                    <td class="odv-td">
                      <strong class="block">{{ row.name }}</strong
                      ><span class="text-xs text-slate-500">{{
                        row.sku || row.brand || 'SKU tanımlanmamış'
                      }}</span>
                    </td>
                    <td class="odv-td">{{ kindLabel(row.kind) }}</td>
                    <td class="odv-td">{{ row.location }}</td>
                    <td class="odv-td">
                      <span class="odv-badge-info">{{
                        row.market || row.locale || 'Belirtilmedi'
                      }}</span>
                    </td>
                    <td class="odv-td">
                      {{ row.reviewDueAt ? (row.reviewDueAt | date: 'dd.MM.yyyy') : '—' }}
                    </td>
                    <td class="odv-td">
                      <span [class]="statusClass(row.status)">{{ statusLabel(row.status) }}</span>
                    </td>
                    <td class="odv-td text-end">
                      <button class="odv-icon-btn" aria-label="Kaydı aç" (click)="openEdit(row)">
                        <span class="material-symbols-rounded">edit</span>
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7" class="p-12 text-center">
                      <span class="material-symbols-rounded text-5xl text-slate-300">nutrition</span
                      ><strong class="mt-3 block">Bu görünümde kayıt yok</strong
                      ><span class="text-sm text-slate-500"
                        >İlk ürünü veya mevzuat kaydını oluşturarak uyum izini başlatın.</span
                      >
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </section>
    </div>

    <app-slide-over
      [open]="drawerOpen()"
      [wide]="true"
      [dirty]="dirty()"
      [submitting]="saving()"
      [title]="editing() ? 'Kaydı düzenle' : 'Yeni gıda etiketi kaydı'"
      eyebrow="DOĞRULANABİLİR ÜRÜN DOSYASI"
      icon="nutrition"
      submitLabel="Kaydet"
      (closed)="drawerOpen.set(false)"
      (submitted)="save()"
    >
      @if (saveError()) {
        <div class="rounded-xl bg-rose-50 p-4 text-sm font-bold text-rose-700" role="alert">
          {{ saveError() }}
        </div>
      }
      <section class="odv-card p-5">
        <h3 class="mt-0">Kimlik ve pazar bilgileri</h3>
        <div class="grid gap-4 sm:grid-cols-2">
          <label
            ><span class="field-label">Kayıt türü *</span
            ><select
              class="odv-input"
              [value]="draft().kind"
              (change)="patch('kind', $any($event.target).value)"
            >
              <option value="product">Ürün kartı</option>
              <option value="recipe">Reçete</option>
              <option value="allergen-review">Alerjen incelemesi</option>
              <option value="nutrition">Besin bildirimi</option>
              <option value="approval">Pazar onayı</option>
            </select></label
          >
          <label
            ><span class="field-label">Durum *</span
            ><select
              class="odv-input"
              [value]="draft().status"
              (change)="patch('status', $any($event.target).value)"
            >
              <option value="draft">Taslak</option>
              <option value="in-review">İncelemede</option>
              <option value="action-required">Aksiyon gerekli</option>
              <option value="approved">Onaylandı</option>
              <option value="rejected">Reddedildi</option>
            </select></label
          >
          <label class="sm:col-span-2"
            ><span class="field-label">Ürün / kayıt adı *</span
            ><input
              class="odv-input"
              [value]="draft().name"
              (input)="patch('name', $any($event.target).value)"
          /></label>
          <label
            ><span class="field-label">SKU / ürün kodu</span
            ><input
              class="odv-input"
              [value]="draft().sku"
              (input)="patch('sku', $any($event.target).value)" /></label
          ><label
            ><span class="field-label">Marka</span
            ><input
              class="odv-input"
              [value]="draft().brand"
              (input)="patch('brand', $any($event.target).value)"
          /></label>
          <label
            ><span class="field-label">Üretim yeri *</span
            ><input
              class="odv-input"
              [value]="draft().location"
              (input)="patch('location', $any($event.target).value)" /></label
          ><label
            ><span class="field-label">Hedef pazar</span
            ><input
              class="odv-input"
              placeholder="Türkiye, AB, Birleşik Krallık…"
              [value]="draft().market"
              (input)="patch('market', $any($event.target).value)"
          /></label>
          <label
            ><span class="field-label">Etiket dili / locale</span
            ><input
              class="odv-input"
              placeholder="tr-TR"
              [value]="draft().locale"
              (input)="patch('locale', $any($event.target).value)" /></label
          ><label
            ><span class="field-label">Net miktar</span
            ><input
              class="odv-input"
              placeholder="500 g"
              [value]="draft().netQuantity"
              (input)="patch('netQuantity', $any($event.target).value)"
          /></label>
        </div>
      </section>
      <section class="odv-card p-5">
        <h3 class="mt-0">İçerik, alerjen ve beyanlar</h3>
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="sm:col-span-2"
            ><span class="field-label">Bileşen listesi</span
            ><textarea
              class="odv-input min-h-28"
              placeholder="Azalan ağırlık sırasıyla tüm bileşenler…"
              [value]="draft().ingredients"
              (input)="patch('ingredients', $any($event.target).value)"
            ></textarea>
          </label>
          <label
            ><span class="field-label">Alerjenler</span
            ><input
              class="odv-input"
              placeholder="Gluten, süt, soya"
              [value]="draft().allergensText"
              (input)="patch('allergensText', $any($event.target).value)" /></label
          ><label
            ><span class="field-label">Beslenme / pazarlama beyanları</span
            ><input
              class="odv-input"
              placeholder="Yüksek protein, ilave şeker içermez"
              [value]="draft().claimsText"
              (input)="patch('claimsText', $any($event.target).value)"
          /></label>
        </div>
      </section>
      <section class="odv-card p-5">
        <h3 class="mt-0">100 g / ml için besin bildirimi</h3>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <label
            ><span class="field-label">Enerji (kcal)</span
            ><input
              class="odv-input"
              type="number"
              min="0"
              [value]="draft().energyKcal ?? ''"
              (input)="patchNumber('energyKcal', $any($event.target).value)" /></label
          ><label
            ><span class="field-label">Protein (g)</span
            ><input
              class="odv-input"
              type="number"
              min="0"
              step="0.01"
              [value]="draft().proteinG ?? ''"
              (input)="patchNumber('proteinG', $any($event.target).value)" /></label
          ><label
            ><span class="field-label">Karbonhidrat (g)</span
            ><input
              class="odv-input"
              type="number"
              min="0"
              step="0.01"
              [value]="draft().carbohydratesG ?? ''"
              (input)="patchNumber('carbohydratesG', $any($event.target).value)" /></label
          ><label
            ><span class="field-label">Yağ (g)</span
            ><input
              class="odv-input"
              type="number"
              min="0"
              step="0.01"
              [value]="draft().fatG ?? ''"
              (input)="patchNumber('fatG', $any($event.target).value)" /></label
          ><label
            ><span class="field-label">Tuz (g)</span
            ><input
              class="odv-input"
              type="number"
              min="0"
              step="0.001"
              [value]="draft().saltG ?? ''"
              (input)="patchNumber('saltG', $any($event.target).value)"
          /></label>
        </div>
      </section>
      <section class="odv-card p-5">
        <h3 class="mt-0">İnceleme, onay ve kanıt</h3>
        <div class="grid gap-4 sm:grid-cols-2">
          <label
            ><span class="field-label">Mevzuat sorumlusu</span
            ><input
              class="odv-input"
              [value]="draft().responsibleName"
              (input)="patch('responsibleName', $any($event.target).value)" /></label
          ><label
            ><span class="field-label">Sonraki inceleme</span
            ><input
              class="odv-input"
              type="datetime-local"
              [value]="draft().reviewDueAt"
              (input)="patch('reviewDueAt', $any($event.target).value)"
          /></label>
          <label
            ><span class="field-label">Onay tarihi</span
            ><input
              class="odv-input"
              type="datetime-local"
              [value]="draft().approvedAt"
              (input)="patch('approvedAt', $any($event.target).value)" /></label
          ><label
            ><span class="field-label">Belge referansları</span
            ><input
              class="odv-input"
              placeholder="SPEC-24, LAB-118, ARTWORK-v3"
              [value]="draft().documentRefsText"
              (input)="patch('documentRefsText', $any($event.target).value)"
          /></label>
          <label class="sm:col-span-2"
            ><span class="field-label">İnceleme notları ve düzeltici faaliyet</span
            ><textarea
              class="odv-input min-h-28"
              [value]="draft().notes"
              (input)="patch('notes', $any($event.target).value)"
            ></textarea>
          </label>
        </div>
      </section>
      @if (editing(); as row) {
        <div class="flex justify-between">
          <button type="button" class="odv-btn-ghost text-rose-600" (click)="toggleArchive(row)">
            {{ row.archivedAt ? 'Arşivden çıkar' : 'Arşivle' }}</button
          ><span class="text-xs text-slate-500"
            >Sürüm {{ row.version }} · değişiklikler audit kaydına işlenir</span
          >
        </div>
      }
    </app-slide-over>
  `,
  styles: `
    .field-label {
      margin-block-end: 0.25rem;
      display: block;
      font-size: 0.75rem;
      font-weight: 700;
    }
  `,
})
export class FoodLabelPage {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(FoodLabelApi);
  readonly overview = this.route.snapshot.data['view'] === 'overview';
  private readonly section = String(this.route.snapshot.data['section'] ?? '');
  readonly kind = this.overview ? null : (KINDS[this.section] ?? 'product');
  readonly domain = PRODUCT_NAVIGATION.find((item) => item.key === this.section);
  readonly title = this.overview
    ? 'FoodLabel Genel Bakış'
    : (this.domain?.title ?? 'Gıda Etiketi Kayıtları');
  readonly description = this.overview
    ? 'Ürün, reçete, alerjen, besin bildirimi ve pazar onaylarını canlı uyum verileriyle yönetin.'
    : (this.domain?.description ?? 'Pazara çıkış kararlarını kanıtlayan denetlenebilir kayıtlar.');
  readonly records = signal<FoodLabelRecord[]>([]);
  readonly dashboard = signal<FoodLabelDashboard | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly search = signal('');
  readonly archived = signal(false);
  readonly drawerOpen = signal(false);
  readonly saving = signal(false);
  readonly saveError = signal('');
  readonly editing = signal<FoodLabelRecord | null>(null);
  readonly draft = signal<RecordDraft>(emptyDraft(this.kind ?? 'product'));
  readonly dirty = signal(false);
  private timer?: ReturnType<typeof setTimeout>;
  readonly metrics = computed(() => {
    const d = this.dashboard();
    return [
      {
        label: 'Toplam kayıt',
        value: d?.total ?? 0,
        icon: 'inventory_2',
        note: 'Aktif ürün ve uyum dosyaları',
      },
      {
        label: 'Ürün kartı',
        value: d?.products ?? 0,
        icon: 'package_2',
        note: 'Pazara hazırlanan ürünler',
      },
      {
        label: 'Alerjen incelemesi',
        value: d?.allergenReviews ?? 0,
        icon: 'allergy',
        note: 'Doğrulanan risk analizleri',
      },
      {
        label: 'Onaylı kayıt',
        value: d?.approved ?? 0,
        icon: 'verified',
        note: 'Yayınlanabilir kararlar',
      },
    ];
  });
  constructor() {
    void this.load();
  }
  async load() {
    this.loading.set(true);
    this.error.set('');
    try {
      const [list, dashboard] = await Promise.all([
        this.api.list(this.kind, this.archived(), this.search()),
        this.api.dashboard(),
      ]);
      this.records.set(list.items);
      this.dashboard.set(dashboard);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Kayıtlar alınamadı.');
    } finally {
      this.loading.set(false);
    }
  }
  scheduleLoad() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.load(), 250);
  }
  setArchived(value: boolean) {
    this.archived.set(value);
    void this.load();
  }
  openCreate() {
    this.editing.set(null);
    this.draft.set(emptyDraft(this.kind ?? 'product'));
    this.dirty.set(false);
    this.saveError.set('');
    this.drawerOpen.set(true);
  }
  openEdit(row: FoodLabelRecord) {
    this.editing.set(row);
    this.draft.set({
      kind: row.kind,
      name: row.name,
      location: row.location,
      market: row.market ?? '',
      sku: row.sku ?? '',
      brand: row.brand ?? '',
      locale: row.locale ?? '',
      netQuantity: row.netQuantity ?? '',
      ingredients: row.ingredients ?? '',
      allergensText: row.allergens.join(', '),
      claimsText: row.claims.join(', '),
      energyKcal: row.energyKcal,
      proteinG: row.proteinG,
      carbohydratesG: row.carbohydratesG,
      fatG: row.fatG,
      saltG: row.saltG,
      responsibleName: row.responsibleName ?? '',
      reviewDueAt: this.localDate(row.reviewDueAt),
      approvedAt: this.localDate(row.approvedAt),
      notes: row.notes ?? '',
      documentRefsText: row.documentRefs.join(', '),
      status: row.status,
    });
    this.dirty.set(false);
    this.saveError.set('');
    this.drawerOpen.set(true);
  }
  patch<K extends keyof RecordDraft>(key: K, value: RecordDraft[K]) {
    this.draft.update((draft) => ({ ...draft, [key]: value }));
    this.dirty.set(true);
  }
  patchNumber(key: 'energyKcal' | 'proteinG' | 'carbohydratesG' | 'fatG' | 'saltG', value: string) {
    this.patch(key, value === '' ? null : Number(value));
  }
  async save() {
    const draft = this.draft();
    if (!draft.name.trim() || !draft.location.trim()) {
      this.saveError.set('Ürün / kayıt adı ve üretim yeri zorunludur.');
      return;
    }
    if (draft.status === 'approved' && (!draft.responsibleName.trim() || !draft.approvedAt)) {
      this.saveError.set('Onay için mevzuat sorumlusu ve onay tarihi zorunludur.');
      return;
    }
    this.saving.set(true);
    this.saveError.set('');
    try {
      const row = this.editing();
      if (row) await this.api.update(row.id, row.version, draft);
      else await this.api.create(draft);
      this.dirty.set(false);
      this.drawerOpen.set(false);
      await this.load();
    } catch (error) {
      this.saveError.set(error instanceof Error ? error.message : 'Kayıt kaydedilemedi.');
    } finally {
      this.saving.set(false);
    }
  }
  async toggleArchive(row: FoodLabelRecord) {
    const result = await Swal.fire({
      title: row.archivedAt ? 'Kayıt geri açılsın mı?' : 'Kayıt arşivlensin mi?',
      text: 'İşlem denetim izine kaydedilecektir.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Onayla',
      cancelButtonText: 'Vazgeç',
      customClass: { confirmButton: 'odv-btn-primary', cancelButton: 'odv-btn-ghost' },
      buttonsStyling: false,
    });
    if (!result.isConfirmed) return;
    if (row.archivedAt) await this.api.restore(row.id);
    else await this.api.archive(row.id);
    this.dirty.set(false);
    this.drawerOpen.set(false);
    await this.load();
  }
  async downloadReport() {
    try {
      const report = await this.api.report();
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `foodlabel-uyum-paketi-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Rapor oluşturulamadı.');
    }
  }
  kindLabel(kind: FoodLabelKind) {
    return (
      {
        product: 'Ürün kartı',
        recipe: 'Reçete',
        'allergen-review': 'Alerjen incelemesi',
        nutrition: 'Besin bildirimi',
        approval: 'Pazar onayı',
      } as const
    )[kind];
  }
  statusLabel(status: FoodLabelRecord['status']) {
    return (
      {
        draft: 'Taslak',
        'in-review': 'İncelemede',
        'action-required': 'Aksiyon gerekli',
        approved: 'Onaylandı',
        rejected: 'Reddedildi',
      } as const
    )[status];
  }
  statusClass(status: FoodLabelRecord['status']) {
    return status === 'action-required' || status === 'rejected'
      ? 'odv-badge-danger'
      : status === 'draft' || status === 'in-review'
        ? 'odv-badge-warning'
        : 'odv-badge-success';
  }
  private localDate(value: string | null) {
    return value ? value.slice(0, 16) : '';
  }
}
