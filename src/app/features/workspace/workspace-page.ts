import { Component, computed, inject, signal } from '@angular/core';
import { FormField, form, required } from '@angular/forms/signals';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../../environments/environment';
import { TranslatePipe } from '../../core/i18n/i18n';
import { PRODUCT_NAVIGATION } from '../../domain/domain-navigation';
import { PRODUCT } from '../../domain/product-manifest';
import { PageHeader } from '../../shared/ui/page-header';
import { SlideOver } from '../../shared/ui/slide-over';

interface RecordRow {
  id: number;
  name: string;
  code: string;
  location: string;
  status: 'active' | 'pending';
  updated: string;
  archived: boolean;
}

@Component({
  selector: 'app-workspace-page',
  imports: [PageHeader, SlideOver, FormField, TranslatePipe],
  template: `
    @if (view === 'overview') {
      <div class="space-y-6">
        <app-page-header
          eyebrow="Operasyon Merkezi"
          [title]="product.name + ' Genel Bakış'"
          description="Kritik kayıtları, yaklaşan kontrolleri ve ekip performansını tek merkezden yönetin."
          ><button actions type="button" class="odv-btn-primary" (click)="drawerOpen.set(true)">
            <span class="material-symbols-rounded">add</span>Yeni kayıt
          </button></app-page-header
        >
        <section
          class="odv-card overflow-hidden bg-gradient-to-br from-slate-950 via-violet-950 to-blue-950 p-6 text-white lg:p-8"
        >
          <div class="grid gap-8 lg:grid-cols-[1.35fr_1fr] lg:items-center">
            <div>
              <div
                class="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300"
              >
                <span class="size-2 animate-pulse rounded-full bg-emerald-400"></span>CANLI UYUM
                RADARI
              </div>
              <h2 class="m-0 text-2xl font-black">Operasyonlar kontrol altında</h2>
              <p class="max-w-2xl text-sm leading-6 text-slate-300">
                Tüm iş akışları MainAPI ile senkronize; kritik operasyonlar anlık takip ediliyor.
              </p>
            </div>
            <div class="grid grid-cols-3 gap-3 text-center">
              <div class="rounded-2xl bg-white/10 p-4">
                <strong class="block text-2xl">98%</strong
                ><span class="text-xs text-slate-300">Sistem</span>
              </div>
              <div class="rounded-2xl bg-white/10 p-4">
                <strong class="block text-2xl">76%</strong
                ><span class="text-xs text-slate-300">Tamamlanma</span>
              </div>
              <div class="rounded-2xl bg-white/10 p-4">
                <strong class="block text-2xl">42</strong
                ><span class="text-xs text-slate-300">Bugün</span>
              </div>
            </div>
          </div>
        </section>
        <section aria-label="Temel göstergeler" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          @for (metric of product.metrics; track metric.labelKey; let first = $first) {
            <article
              class="odv-card p-5"
              [class.!bg-gradient-to-br]="first"
              [class.!from-violet-600]="first"
              [class.!to-indigo-700]="first"
              [class.!text-white]="first"
            >
              <div class="mb-4 flex items-center justify-between">
                <span
                  class="text-xs font-extrabold uppercase tracking-wider"
                  [class.text-slate-500]="!first"
                  >{{ metric.labelKey | t }}</span
                ><span class="material-symbols-rounded" [class.text-violet-600]="!first"
                  >monitoring</span
                >
              </div>
              <strong class="block text-4xl font-black">{{ metric.value }}</strong
              ><span class="mt-2 block text-xs" [class.text-slate-500]="!first">{{
                metric.noteKey | t
              }}</span>
            </article>
          }
        </section>
        <section class="odv-card overflow-hidden">
          <div
            class="flex flex-col gap-4 border-b border-slate-200 p-5 dark:border-slate-700 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <h2 class="m-0 text-xl font-black">Operasyon kayıtları</h2>
              <div class="mt-3 inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-900">
                <button
                  type="button"
                  class="rounded-lg px-3 py-2 text-xs font-bold"
                  [class.bg-white]="!archived()"
                  [class.shadow-sm]="!archived()"
                  (click)="archived.set(false)"
                >
                  Aktif {{ activeCount() }}</button
                ><button
                  type="button"
                  class="rounded-lg px-3 py-2 text-xs font-bold"
                  [class.bg-white]="archived()"
                  [class.shadow-sm]="archived()"
                  (click)="archived.set(true)"
                >
                  Arşiv {{ archivedCount() }}
                </button>
              </div>
            </div>
            <label class="relative block md:w-80"
              ><span class="sr-only">Kayıtlarda ara</span
              ><span
                class="material-symbols-rounded pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-slate-400"
                >search</span
              ><input
                class="odv-input ps-10"
                type="search"
                placeholder="Ad, kod veya lokasyon ara…"
                [value]="search()"
                (input)="search.set($any($event.target).value)"
            /></label>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[720px]">
              <thead>
                <tr>
                  <th class="odv-th">Kayıt</th>
                  <th class="odv-th">Kod</th>
                  <th class="odv-th">Lokasyon</th>
                  <th class="odv-th">Durum</th>
                  <th class="odv-th">Güncellendi</th>
                  <th class="odv-th"><span class="sr-only">İşlem</span></th>
                </tr>
              </thead>
              <tbody>
                @for (row of filtered(); track row.id) {
                  <tr class="hover:bg-violet-50/40 dark:hover:bg-slate-800">
                    <td class="odv-td font-bold">{{ row.name }}</td>
                    <td class="odv-td font-mono text-xs text-slate-500">{{ row.code }}</td>
                    <td class="odv-td text-slate-500">{{ row.location }}</td>
                    <td class="odv-td">
                      <span
                        [class]="
                          row.status === 'active' ? 'odv-badge-success' : 'odv-badge-warning'
                        "
                        >{{ row.status === 'active' ? 'Aktif' : 'Aksiyon gerekli' }}</span
                      >
                    </td>
                    <td class="odv-td text-slate-500">{{ row.updated }}</td>
                    <td class="odv-td text-end">
                      <button class="odv-icon-btn" type="button" aria-label="Kaydı aç">
                        <span class="material-symbols-rounded directional-icon">arrow_forward</span>
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6" class="p-12 text-center text-sm text-slate-500">
                      Bu filtrede kayıt bulunamadı.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      </div>
    } @else if (view === 'domain') {
      <div class="space-y-6">
        <app-page-header
          [eyebrow]="product.name"
          [title]="domain.title"
          [description]="domain.description"
        >
          <button actions type="button" class="odv-btn-primary" (click)="drawerOpen.set(true)">
            <span class="material-symbols-rounded">add</span>Yeni kayıt
          </button>
        </app-page-header>
        <section class="grid gap-4 sm:grid-cols-3" aria-label="İş alanı özeti">
          <article class="odv-card p-5">
            <span class="text-xs font-extrabold uppercase tracking-wider text-slate-500"
              >Toplam kayıt</span
            >
            <strong class="mt-3 block text-3xl font-black">{{ 24 + domainIndex }}</strong>
            <span class="mt-1 block text-xs text-slate-500">Bu iş alanındaki güncel kayıtlar</span>
          </article>
          <article class="odv-card p-5">
            <span class="text-xs font-extrabold uppercase tracking-wider text-slate-500"
              >Aksiyon gerekli</span
            >
            <strong class="mt-3 block text-3xl font-black text-amber-600">{{
              2 + domainIndex
            }}</strong>
            <span class="mt-1 block text-xs text-slate-500">Son tarihi yaklaşan işlemler</span>
          </article>
          <article class="odv-card p-5">
            <span class="text-xs font-extrabold uppercase tracking-wider text-slate-500"
              >Tamamlanma</span
            >
            <strong class="mt-3 block text-3xl font-black text-emerald-600"
              >%{{ 94 - domainIndex }}</strong
            >
            <span class="mt-1 block text-xs text-slate-500">Güncel uygunluk oranı</span>
          </article>
        </section>
        <section class="odv-card overflow-hidden">
          <div
            class="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-700 sm:flex-row sm:items-center"
          >
            <label class="relative flex-1">
              <span class="sr-only">{{ domain.title }} kayıtlarında ara</span>
              <span
                class="material-symbols-rounded pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-slate-400"
                >search</span
              >
              <input
                class="odv-input ps-10"
                type="search"
                [placeholder]="domain.title + ' içinde ara…'"
                [value]="search()"
                (input)="search.set($any($event.target).value)"
              />
            </label>
            <select class="odv-input !w-auto" aria-label="Durum filtresi">
              <option>Tüm durumlar</option>
              <option>Aktif</option>
              <option>Aksiyon gerekli</option>
            </select>
          </div>
          <div class="overflow-x-auto custom-scroll">
            <table class="w-full min-w-[720px]">
              <thead>
                <tr>
                  <th class="odv-th">{{ domain.title }}</th>
                  <th class="odv-th">Referans</th>
                  <th class="odv-th">Lokasyon</th>
                  <th class="odv-th">Durum</th>
                  <th class="odv-th">Son işlem</th>
                  <th class="odv-th"><span class="sr-only">İşlem</span></th>
                </tr>
              </thead>
              <tbody>
                @for (row of domainRows(); track row.id; let index = $index) {
                  <tr class="hover:bg-violet-50/40 dark:hover:bg-slate-800">
                    <td class="odv-td">
                      <div class="flex items-center gap-3">
                        <span
                          class="grid size-9 place-items-center rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"
                          ><span class="material-symbols-rounded">{{ domain.icon }}</span></span
                        ><strong>{{ row.name }}</strong>
                      </div>
                    </td>
                    <td class="odv-td font-mono text-xs text-slate-500">{{ row.code }}</td>
                    <td class="odv-td text-slate-500">{{ row.location }}</td>
                    <td class="odv-td">
                      <span
                        [class]="
                          row.status === 'active' ? 'odv-badge-success' : 'odv-badge-warning'
                        "
                        >{{ row.status === 'active' ? 'Aktif' : 'Aksiyon gerekli' }}</span
                      >
                    </td>
                    <td class="odv-td text-slate-500">{{ row.updated }}</td>
                    <td class="odv-td text-end">
                      <button
                        type="button"
                        class="odv-btn-soft"
                        (click)="selectedModule.set(index)"
                      >
                        Detayı aç
                      </button>
                    </td>
                  </tr>
                  @if (selectedModule() === index) {
                    <tr>
                      <td
                        colspan="6"
                        class="bg-violet-50/50 px-6 py-4 text-sm text-slate-600 dark:bg-violet-500/5 dark:text-slate-300"
                      >
                        <strong>{{ row.name }}</strong> kaydının görevleri, belgeleri ve denetim izi
                        MainAPI üzerinden bu alanda yönetilir.
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
          <footer
            class="border-t border-slate-200 p-4 text-xs text-slate-500 dark:border-slate-700"
          >
            Toplam <strong>{{ domainRows().length }}</strong> kayıt gösteriliyor.
          </footer>
        </section>
      </div>
    } @else if (view === 'activity') {
      <div class="space-y-6">
        <app-page-header
          eyebrow="Denetim İzi"
          title="Aktiviteler"
          description="Ekip ve sistem tarafından gerçekleştirilen son işlemler."
        />
        <section class="odv-card p-6">
          <div class="space-y-1">
            @for (item of activities; track item.time) {
              <article
                class="grid grid-cols-[auto_1fr_auto] gap-4 border-b border-slate-100 py-5 last:border-0 dark:border-slate-700"
              >
                <span
                  class="grid size-10 place-items-center rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"
                  ><span class="material-symbols-rounded">{{ item.icon }}</span></span
                >
                <div>
                  <strong class="block text-sm">{{ item.title }}</strong>
                  <p class="mb-0 mt-1 text-xs text-slate-500">{{ item.detail }}</p>
                </div>
                <time class="text-xs font-semibold text-slate-400">{{ item.time }}</time>
              </article>
            }
          </div>
        </section>
      </div>
    } @else {
      <div class="space-y-6">
        <app-page-header
          eyebrow="Yapılandırma"
          title="Ayarlar"
          description="Çalışma alanı, bildirim ve entegrasyon tercihlerini yönetin."
        />
        <div class="grid gap-5 xl:grid-cols-[1fr_.8fr]">
          <section class="odv-card p-6">
            <h2 class="mt-0 text-lg font-black">Çalışma alanı</h2>
            <div class="grid gap-4 sm:grid-cols-2">
              <label
                ><span class="mb-1.5 block text-xs font-bold">Şirket adı</span
                ><input class="odv-input" value="Odivon Demo İşletmesi" /></label
              ><label
                ><span class="mb-1.5 block text-xs font-bold">Varsayılan bölge</span
                ><select class="odv-input">
                  <option>Türkiye</option>
                  <option>Avrupa Birliği</option>
                </select></label
              ><label class="sm:col-span-2"
                ><span class="mb-1.5 block text-xs font-bold">API adresi</span
                ><input class="odv-input font-mono text-xs" [value]="apiBaseUrl" readonly
              /></label>
            </div>
            <button type="button" class="odv-btn-primary mt-5" (click)="saved.set(true)">
              <span class="material-symbols-rounded">save</span>Ayarları kaydet
            </button>
            @if (saved()) {
              <span class="ms-3 text-xs font-bold text-emerald-600">Değişiklikler kaydedildi.</span>
            }
          </section>
          <section class="odv-card p-6">
            <h2 class="mt-0 text-lg font-black">Bildirimler</h2>
            @for (option of notificationOptions; track option.label) {
              <label
                class="flex items-center justify-between border-b border-slate-100 py-4 last:border-0 dark:border-slate-700"
                ><span
                  ><strong class="block text-sm">{{ option.label }}</strong
                  ><small class="text-slate-500">{{ option.note }}</small></span
                ><input type="checkbox" class="size-5 accent-violet-600" [checked]="option.enabled"
              /></label>
            }
          </section>
        </div>
      </div>
    }
    <app-slide-over
      [open]="drawerOpen()"
      [dirty]="!!draftModel().name"
      title="Yeni operasyon kaydı"
      (closed)="drawerOpen.set(false)"
      (submitted)="save()"
      ><div class="space-y-4">
        <label class="block"
          ><span class="mb-1.5 block text-xs font-bold">Kayıt adı</span
          ><input class="odv-input" [formField]="draftForm.name" autocomplete="off" /></label
        ><label class="block"
          ><span class="mb-1.5 block text-xs font-bold">Lokasyon</span
          ><input class="odv-input" [formField]="draftForm.location" autocomplete="off"
        /></label></div
    ></app-slide-over>
  `,
})
export class WorkspacePage {
  private readonly route = inject(ActivatedRoute);
  readonly product = PRODUCT;
  readonly view = this.route.snapshot.data['view'] as
    'overview' | 'domain' | 'activity' | 'settings';
  readonly section = this.route.snapshot.data['section'] as string;
  readonly domain =
    PRODUCT_NAVIGATION.find((item) => item.key === this.section) ?? PRODUCT_NAVIGATION[0];
  readonly domainIndex = Math.max(
    0,
    PRODUCT_NAVIGATION.findIndex((item) => item.key === this.section),
  );
  readonly apiBaseUrl = environment.apiBaseUrl;
  readonly search = signal('');
  readonly archived = signal(false);
  readonly drawerOpen = signal(false);
  readonly selectedModule = signal(-1);
  readonly saved = signal(false);
  readonly draftModel = signal({ name: '', location: '' });
  readonly draftForm = form(this.draftModel, (p) => required(p.name));
  readonly rows = signal<RecordRow[]>(this.seedRows());
  readonly domainRows = computed(() => this.filtered().filter((row) => !row.archived));
  readonly activeCount = computed(() => this.rows().filter((r) => !r.archived).length);
  readonly archivedCount = computed(() => this.rows().filter((r) => r.archived).length);
  readonly filtered = computed(() => {
    const q = this.search().trim().toLocaleLowerCase('tr');
    return this.rows().filter(
      (r) =>
        r.archived === this.archived() &&
        (!q || `${r.name} ${r.code} ${r.location}`.toLocaleLowerCase('tr').includes(q)),
    );
  });
  readonly activities = [
    {
      icon: 'fact_check',
      title: 'Kontrol kaydı tamamlandı',
      detail: 'Saha ekibi kanıt dosyalarını yükledi.',
      time: '10 dk önce',
    },
    {
      icon: 'person_add',
      title: 'Yeni ekip üyesi davet edildi',
      detail: 'Kalite yöneticisi rolü atandı.',
      time: '1 saat önce',
    },
    {
      icon: 'warning',
      title: 'Yaklaşan kontrol uyarısı',
      detail: '3 kayıt için son tarih 7 gün içinde.',
      time: '3 saat önce',
    },
    {
      icon: 'sync',
      title: 'MainAPI senkronizasyonu',
      detail: 'Tüm kayıtlar başarıyla eşitlendi.',
      time: 'Bugün 08:42',
    },
  ];
  readonly notificationOptions = [
    { label: 'Kritik uyarılar', note: 'Yüksek öncelikli riskleri anında bildir', enabled: true },
    { label: 'Haftalık özet', note: 'Her pazartesi operasyon özeti gönder', enabled: true },
    { label: 'Ürün güncellemeleri', note: 'Yeni özellik ve sürüm notları', enabled: false },
  ];
  save(): void {
    const value = this.draftModel();
    if (!value.name.trim()) return;
    this.rows.update((rows) => [
      {
        id: Date.now(),
        name: value.name,
        code: `ODV-${rows.length + 101}`,
        location: value.location || 'Yeni Lokasyon',
        status: 'pending',
        updated: new Date().toLocaleDateString('tr-TR'),
        archived: false,
      },
      ...rows,
    ]);
    this.draftModel.set({ name: '', location: '' });
    this.drawerOpen.set(false);
  }
  private seedRows(): RecordRow[] {
    const names =
      PRODUCT.key === 'fgas'
        ? [
            'Merkez Chiller Sistemi',
            'Rooftop Klima RT-24',
            'Soğuk Oda Ünitesi',
            'Eski Kompresör Hattı',
          ]
        : PRODUCT.key === 'fire-safe'
          ? [
              'Merkez Sprinkler Hattı',
              'B Blok Yangın Paneli',
              'Acil Çıkış Bölgesi',
              'Eski Pompa İstasyonu',
            ]
          : [
              'Organik Granola 350 g',
              'Bademli Protein Bar',
              'Çilekli Yoğurt 200 g',
              'Arşiv Etiket Şablonu',
            ];
    return names.map((name, index) => ({
      id: index + 1,
      name,
      code: `${PRODUCT.key.toUpperCase()}-${1001 + index}`,
      location: ['İstanbul / Merkez', 'Ankara / Fabrika', 'İzmir / Depo', 'Bursa / Arşiv'][index],
      status: index === 1 ? 'pending' : 'active',
      updated: ['25.10.2026', '24.10.2026', '22.10.2026', '12.09.2026'][index],
      archived: index === 3,
    }));
  }
}
