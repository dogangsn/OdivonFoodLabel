import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { PRODUCT_NAVIGATION } from '../../domain/domain-navigation';
import { PageHeader } from '../../shared/ui/page-header';
import { SlideOver } from '../../shared/ui/slide-over';
import {
  FoodLabelApi,
  FoodLabelDashboard,
  FoodLabelKind,
  FoodLabelRecord,
  FoodLabelStatus,
  RecordDraft,
} from './food-label.api';
import {
  DraftSection,
  KIND_META,
  KIND_OPTIONS,
  STATUS_META,
  STATUS_OPTIONS,
  daysUntil,
  dueState,
  recordSubtitle,
} from './food-label.model';
import { LabelPreview } from './label-preview';

const KINDS: Record<string, FoodLabelKind> = {
  products: 'product',
  recipes: 'recipe',
  allergens: 'allergen-review',
  nutrition: 'nutrition',
  approvals: 'approval',
};
const DASHBOARD_COUNT: Partial<Record<string, keyof FoodLabelDashboard>> = {
  products: 'products',
  recipes: 'recipes',
  allergens: 'allergenReviews',
  approvals: 'approvals',
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

type NutritionKey = 'energyKcal' | 'proteinG' | 'carbohydratesG' | 'fatG' | 'saltG';
const NUTRITION_FIELDS: readonly { key: NutritionKey; label: string; step: string }[] = [
  { key: 'energyKcal', label: 'Enerji (kcal)', step: '1' },
  { key: 'fatG', label: 'Yağ (g)', step: '0.01' },
  { key: 'carbohydratesG', label: 'Karbonhidrat (g)', step: '0.01' },
  { key: 'proteinG', label: 'Protein (g)', step: '0.01' },
  { key: 'saltG', label: 'Tuz (g)', step: '0.001' },
];

@Component({
  selector: 'app-food-label-page',
  imports: [PageHeader, SlideOver, DatePipe, RouterLink, LabelPreview],
  template: `
    <div class="space-y-6">
      <app-page-header
        eyebrow="Gıda etiketi uyum merkezi"
        [icon]="overview ? 'space_dashboard' : (domain?.icon ?? 'inventory_2')"
        [title]="title"
        [description]="description"
      >
        <div actions class="flex flex-wrap gap-2">
          <button type="button" class="odv-btn-outline" (click)="downloadReport()">
            <span class="material-symbols-rounded">download</span>Uyum paketi
          </button>
          <button type="button" class="odv-btn-primary" (click)="openCreate()">
            <span class="material-symbols-rounded">add</span
            >{{ overview ? 'Yeni ürün kartı' : 'Yeni kayıt' }}
          </button>
        </div>
      </app-page-header>

      @if (error()) {
        <div
          class="flex flex-wrap items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200"
          role="alert"
        >
          <span class="material-symbols-rounded">error</span>{{ error() }}
          <button type="button" class="ms-auto underline underline-offset-2" (click)="load()">
            Tekrar dene
          </button>
        </div>
      }

      @if (overview) {
        <!-- Compliance hero + module shortcuts -->
        <section class="grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_1fr]">
          <article
            class="odv-card relative overflow-hidden border-0 bg-gradient-to-br from-slate-950 via-violet-950 to-indigo-950 p-6 text-white sm:p-7"
          >
            <div
              class="pointer-events-none absolute -end-24 -top-24 size-72 rounded-full bg-violet-500/25 blur-3xl"
            ></div>
            <div class="relative flex flex-col gap-6 sm:flex-row sm:items-center">
              <div class="relative mx-auto size-36 shrink-0 sm:mx-0">
                <svg viewBox="0 0 120 120" class="size-full -rotate-90" aria-hidden="true">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="rgb(255 255 255 / .12)" stroke-width="10" />
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke="url(#odv-score)"
                    stroke-width="10"
                    stroke-linecap="round"
                    [attr.stroke-dasharray]="ring.circumference"
                    [attr.stroke-dashoffset]="ringOffset()"
                    class="transition-[stroke-dashoffset] duration-700"
                  />
                  <defs>
                    <linearGradient id="odv-score" x1="0" x2="1" y1="0" y2="1">
                      <stop offset="0%" stop-color="#a78bfa" />
                      <stop offset="100%" stop-color="#34d399" />
                    </linearGradient>
                  </defs>
                </svg>
                <div class="absolute inset-0 grid place-items-center text-center">
                  <div>
                    <strong class="block text-4xl font-black leading-none tracking-tight"
                      >%{{ score() }}</strong
                    >
                    <span class="text-[11px] font-semibold text-violet-200">uyum skoru</span>
                  </div>
                </div>
              </div>
              <div class="min-w-0 flex-1">
                <span
                  class="inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1 text-[11px] font-bold text-emerald-300"
                  ><span class="size-1.5 animate-pulse rounded-full bg-emerald-400"></span>Canlı veri</span
                >
                <h2 class="mb-2 mt-3 text-2xl font-black tracking-tight">
                  {{ scoreHeadline() }}
                </h2>
                <p class="m-0 text-sm leading-6 text-slate-300">
                  Ürün, reçete, alerjen, besin beyanı ve pazar onaylarındaki açık işler tek bakışta.
                </p>
                <div class="mt-5 grid grid-cols-3 gap-2">
                  @for (stat of heroStats(); track stat.label) {
                    <div class="rounded-xl bg-white/[.07] p-3 ring-1 ring-white/10">
                      <strong class="block text-2xl font-black leading-none">{{ stat.value }}</strong>
                      <span class="mt-1 block text-[11px] text-slate-300">{{ stat.label }}</span>
                    </div>
                  }
                </div>
              </div>
            </div>
          </article>

          <article class="odv-card p-5 sm:p-6">
            <div class="mb-4 flex items-center justify-between">
              <h2 class="odv-section-title">Modüller</h2>
              <span class="odv-kicker">Hızlı geçiş</span>
            </div>
            <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
              @for (item of modules(); track item.path) {
                <a
                  [routerLink]="'/' + item.path"
                  class="group flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-violet-200 hover:bg-violet-50/50 dark:border-slate-800 dark:hover:border-violet-900 dark:hover:bg-violet-950/30"
                >
                  <span class="grid size-10 shrink-0 place-items-center rounded-xl" [class]="item.tone"
                    ><span class="material-symbols-rounded">{{ item.icon }}</span></span
                  >
                  <span class="min-w-0 flex-1">
                    <strong class="block truncate text-sm">{{ item.label }}</strong>
                    <span class="block truncate text-[11px] text-slate-500">{{ item.hint }}</span>
                  </span>
                  <span
                    class="material-symbols-rounded directional-icon text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-violet-500"
                    >chevron_right</span
                  >
                </a>
              }
            </div>
          </article>
        </section>

        <!-- KPI cards -->
        <section class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Temel göstergeler">
          @for (metric of metrics(); track metric.label; let i = $index) {
            <article class="odv-card odv-card-hover odv-rise p-5" [style.animation-delay.ms]="i * 60">
              <div class="flex items-center justify-between">
                <span class="odv-kicker">{{ metric.label }}</span>
                <span class="grid size-10 place-items-center rounded-xl" [class]="metric.tone"
                  ><span class="material-symbols-rounded">{{ metric.icon }}</span></span
                >
              </div>
              @if (loading() && !dashboard()) {
                <div class="odv-skeleton mt-4 h-10 w-20"></div>
              } @else {
                <strong
                  class="mt-4 block text-4xl font-black leading-none tracking-tight text-slate-900 dark:text-white"
                  >{{ metric.value }}</strong
                >
              }
              <span class="mt-2 block text-xs font-medium text-slate-500 dark:text-slate-400">{{
                metric.note
              }}</span>
            </article>
          }
        </section>

        <!-- Work queues -->
        <section class="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <article class="odv-card overflow-hidden">
            <header class="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
              <div>
                <h2 class="odv-section-title">Aksiyon bekleyenler</h2>
                <p class="m-0 mt-0.5 text-xs text-slate-500">Reddedilen veya düzeltme isteyen kayıtlar</p>
              </div>
              <span class="odv-badge-warning">{{ actionQueue().length }}</span>
            </header>
            <ul class="m-0 list-none divide-y divide-slate-100 p-0 dark:divide-slate-800">
              @for (row of actionQueue().slice(0, 5); track row.id) {
                <li>
                  <button
                    type="button"
                    class="flex w-full items-center gap-3 px-5 py-3 text-start transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    (click)="openEdit(row)"
                  >
                    <span class="grid size-9 shrink-0 place-items-center rounded-lg" [class]="kindMeta[row.kind].tone"
                      ><span class="material-symbols-rounded !text-lg">{{ kindMeta[row.kind].icon }}</span></span
                    >
                    <span class="min-w-0 flex-1">
                      <strong class="block truncate text-sm">{{ row.name }}</strong>
                      <span class="block truncate text-[11px] text-slate-500">{{ kindMeta[row.kind].label }} · {{ row.location }}</span>
                    </span>
                    <span [class]="statusMeta[row.status].badge">{{ statusMeta[row.status].label }}</span>
                  </button>
                </li>
              } @empty {
                <li class="flex items-center gap-3 px-5 py-8 text-sm text-slate-500">
                  <span class="material-symbols-rounded text-emerald-500">task_alt</span>Bekleyen aksiyon yok.
                </li>
              }
            </ul>
          </article>

          <article class="odv-card overflow-hidden">
            <header class="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
              <div>
                <h2 class="odv-section-title">Yaklaşan incelemeler</h2>
                <p class="m-0 mt-0.5 text-xs text-slate-500">Süresi geçenler en üstte</p>
              </div>
              <span class="odv-badge-info">{{ reviewQueue().length }}</span>
            </header>
            <ul class="m-0 list-none divide-y divide-slate-100 p-0 dark:divide-slate-800">
              @for (row of reviewQueue().slice(0, 5); track row.id) {
                <li>
                  <button
                    type="button"
                    class="flex w-full items-center gap-3 px-5 py-3 text-start transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    (click)="openEdit(row)"
                  >
                    <span class="w-12 shrink-0 text-center">
                      <strong class="block text-lg font-black leading-none">{{ row.reviewDueAt | date: 'dd' }}</strong>
                      <span class="text-[10px] font-bold uppercase text-slate-500">{{ row.reviewDueAt | date: 'MMM' }}</span>
                    </span>
                    <span class="min-w-0 flex-1">
                      <strong class="block truncate text-sm">{{ row.name }}</strong>
                      <span class="block truncate text-[11px] text-slate-500">{{ row.responsibleName || 'Sorumlu atanmadı' }}</span>
                    </span>
                    <span [class]="dueBadge(row)">{{ dueLabel(row) }}</span>
                  </button>
                </li>
              } @empty {
                <li class="flex items-center gap-3 px-5 py-8 text-sm text-slate-500">
                  <span class="material-symbols-rounded text-slate-400">event_available</span>Planlanmış inceleme yok.
                </li>
              }
            </ul>
          </article>
        </section>
      }

      <!-- Records -->
      <section class="odv-card overflow-hidden" aria-labelledby="records-title">
        <div class="flex flex-col gap-4 border-b border-slate-100 p-5 dark:border-slate-800">
          <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div class="flex flex-wrap items-center gap-3">
              <h2 id="records-title" class="odv-section-title">
                {{ overview ? 'Son kayıtlar' : 'Kayıtlar' }}
              </h2>
              <div class="odv-segment" role="group" aria-label="Kayıt görünümü">
                <button type="button" class="odv-segment-item" [attr.aria-pressed]="!archived()" (click)="setArchived(false)">
                  <span class="material-symbols-rounded !text-base">folder_open</span>Aktif
                </button>
                <button type="button" class="odv-segment-item" [attr.aria-pressed]="archived()" (click)="setArchived(true)">
                  <span class="material-symbols-rounded !text-base">inventory</span>Arşiv
                </button>
              </div>
            </div>
            <label class="relative block lg:w-96">
              <span class="sr-only">Kayıt ara</span>
              <span class="material-symbols-rounded pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input
                class="odv-input ps-10"
                type="search"
                placeholder="Ürün, SKU, marka, pazar veya sorumlu ara…"
                [value]="search()"
                (input)="search.set($any($event.target).value); scheduleLoad()"
              />
            </label>
          </div>
          <div class="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Duruma göre filtrele">
            <button type="button" class="odv-chip" [attr.aria-pressed]="!status()" (click)="setStatus(null)">Tümü</button>
            @for (option of statusOptions; track option.value) {
              <button type="button" class="odv-chip" [attr.aria-pressed]="status() === option.value" (click)="setStatus(option.value)">
                <span class="material-symbols-rounded !text-sm">{{ option.icon }}</span>{{ option.label }}
              </button>
            }
          </div>
        </div>

        @if (loading()) {
          <div class="space-y-3 p-5" aria-busy="true" aria-label="Kayıtlar yükleniyor">
            @for (i of [1, 2, 3, 4]; track i) {
              <div class="flex items-center gap-4">
                <div class="odv-skeleton size-10 shrink-0"></div>
                <div class="flex-1 space-y-2">
                  <div class="odv-skeleton h-3 w-1/3"></div>
                  <div class="odv-skeleton h-3 w-1/5"></div>
                </div>
                <div class="odv-skeleton h-6 w-24"></div>
              </div>
            }
          </div>
        } @else if (!records().length) {
          <div class="grid place-items-center px-6 py-16 text-center">
            <span class="grid size-16 place-items-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
              <span class="material-symbols-rounded !text-3xl">{{ search() || status() ? 'search_off' : 'nutrition' }}</span>
            </span>
            <h3 class="mb-1 mt-4 text-base font-black">
              {{ search() || status() ? 'Eşleşen kayıt bulunamadı' : 'Bu görünümde kayıt yok' }}
            </h3>
            <p class="m-0 max-w-sm text-sm text-slate-500">
              {{ search() || status() ? 'Filtreleri temizleyip tekrar deneyin.' : 'İlk kaydı oluşturarak uyum izini başlatın.' }}
            </p>
            @if (search() || status()) {
              <button type="button" class="odv-btn-soft mt-5" (click)="clearFilters()">Filtreleri temizle</button>
            } @else if (!archived()) {
              <button type="button" class="odv-btn-primary mt-5" (click)="openCreate()">
                <span class="material-symbols-rounded">add</span>Yeni kayıt
              </button>
            }
          </div>
        } @else {
          <!-- Desktop table -->
          <div class="hidden overflow-x-auto md:block">
            <table class="w-full min-w-[860px] border-collapse">
              <thead>
                <tr>
                  <th class="odv-th">Kayıt</th>
                  @if (overview) {
                    <th class="odv-th">Tür</th>
                  }
                  <th class="odv-th">Üretim yeri</th>
                  <th class="odv-th">Pazar</th>
                  <th class="odv-th">İnceleme</th>
                  <th class="odv-th">Durum</th>
                  <th class="odv-th"><span class="sr-only">İşlem</span></th>
                </tr>
              </thead>
              <tbody>
                @for (row of records(); track row.id) {
                  <tr class="group cursor-pointer transition hover:bg-violet-50/40 dark:hover:bg-slate-800/40" (click)="openEdit(row)">
                    <td class="odv-td">
                      <div class="flex items-center gap-3">
                        <span class="grid size-10 shrink-0 place-items-center rounded-xl" [class]="kindMeta[row.kind].tone"
                          ><span class="material-symbols-rounded">{{ kindMeta[row.kind].icon }}</span></span
                        >
                        <span class="min-w-0">
                          <strong class="block truncate">{{ row.name }}</strong>
                          <span class="block truncate text-xs text-slate-500">{{ subtitle(row) }} · v{{ row.version }}</span>
                        </span>
                      </div>
                    </td>
                    @if (overview) {
                      <td class="odv-td text-slate-600 dark:text-slate-300">{{ kindMeta[row.kind].label }}</td>
                    }
                    <td class="odv-td text-slate-600 dark:text-slate-300">{{ row.location }}</td>
                    <td class="odv-td">
                      <span class="odv-badge-neutral">{{ row.market || row.locale || '—' }}</span>
                    </td>
                    <td class="odv-td">
                      @if (row.reviewDueAt) {
                        <span [class]="dueBadge(row)"
                          ><span class="material-symbols-rounded !text-sm">event</span>{{ row.reviewDueAt | date: 'dd.MM.yyyy' }}</span
                        >
                      } @else {
                        <span class="text-slate-400">—</span>
                      }
                    </td>
                    <td class="odv-td">
                      <span [class]="statusMeta[row.status].badge"
                        ><span class="material-symbols-rounded !text-sm">{{ statusMeta[row.status].icon }}</span>{{ statusMeta[row.status].label }}</span
                      >
                    </td>
                    <td class="odv-td text-end">
                      <button
                        type="button"
                        class="odv-icon-btn opacity-60 transition group-hover:opacity-100"
                        [attr.aria-label]="row.name + ' kaydını aç'"
                        (click)="$event.stopPropagation(); openEdit(row)"
                      >
                        <span class="material-symbols-rounded directional-icon">chevron_right</span>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Mobile cards -->
          <ul class="m-0 list-none divide-y divide-slate-100 p-0 dark:divide-slate-800 md:hidden">
            @for (row of records(); track row.id) {
              <li>
                <button type="button" class="flex w-full items-start gap-3 p-4 text-start" (click)="openEdit(row)">
                  <span class="grid size-10 shrink-0 place-items-center rounded-xl" [class]="kindMeta[row.kind].tone"
                    ><span class="material-symbols-rounded">{{ kindMeta[row.kind].icon }}</span></span
                  >
                  <span class="min-w-0 flex-1">
                    <strong class="block truncate text-sm">{{ row.name }}</strong>
                    <span class="block truncate text-xs text-slate-500">{{ row.location }} · {{ row.market || row.locale || '—' }}</span>
                    <span class="mt-2 flex flex-wrap gap-1.5">
                      <span [class]="statusMeta[row.status].badge">{{ statusMeta[row.status].label }}</span>
                      @if (row.reviewDueAt) {
                        <span [class]="dueBadge(row)">{{ row.reviewDueAt | date: 'dd.MM.yyyy' }}</span>
                      }
                    </span>
                  </span>
                </button>
              </li>
            }
          </ul>

          <footer class="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 text-xs text-slate-500 dark:border-slate-800">
            <span>{{ records().length }} kayıt gösteriliyor</span>
            @if (nextCursor()) {
              <button type="button" class="odv-btn-soft" [disabled]="loadingMore()" (click)="loadMore()">
                {{ loadingMore() ? 'Yükleniyor…' : 'Daha fazla yükle' }}
              </button>
            }
          </footer>
        }
      </section>
    </div>

    <app-slide-over
      [open]="drawerOpen()"
      size="xl"
      [dirty]="dirty()"
      [submitting]="saving()"
      [title]="editing() ? editing()!.name : 'Yeni gıda etiketi kaydı'"
      [description]="editing() ? 'Sürüm ' + editing()!.version + ' · değişiklikler denetim kaydına işlenir' : 'Formu doldurdukça etiket önizlemesi canlı güncellenir.'"
      eyebrow="Doğrulanabilir ürün dosyası"
      [icon]="kindMeta[draft().kind].icon"
      submitLabel="Kaydet"
      (closed)="drawerOpen.set(false)"
      (submitted)="save()"
    >
      <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div class="min-w-0 space-y-5">
          @if (saveError()) {
            <div class="flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200" role="alert">
              <span class="material-symbols-rounded">error</span>{{ saveError() }}
            </div>
          }

          <fieldset class="min-w-0 border-0 p-0">
            <legend class="odv-kicker mb-2">Kayıt türü</legend>
            <div class="grid grid-cols-2 gap-2 sm:grid-cols-5">
              @for (option of kindOptions; track option.value) {
                <label
                  class="flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border bg-white p-3 text-center text-[11px] font-bold transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-violet-400 dark:bg-slate-900"
                  [class]="draft().kind === option.value ? selectedKindClass : idleKindClass"
                >
                  <input type="radio" name="kind" class="sr-only" [value]="option.value" [checked]="draft().kind === option.value" (change)="patch('kind', option.value)" />
                  <span class="grid size-9 place-items-center rounded-lg" [class]="option.tone"
                    ><span class="material-symbols-rounded !text-lg">{{ option.icon }}</span></span
                  >{{ option.label }}
                </label>
              }
            </div>
          </fieldset>

          <section class="odv-card p-5">
            <h3 class="odv-section-title mb-4 flex items-center gap-2">
              <span class="material-symbols-rounded text-violet-500">badge</span>Kimlik ve pazar
            </h3>
            <div class="grid gap-4 sm:grid-cols-2">
              <label class="sm:col-span-2"
                ><span class="odv-label">Ürün / kayıt adı *</span
                ><input class="odv-input" [value]="draft().name" (input)="patch('name', $any($event.target).value)" placeholder="Örn. Fındıklı Granola 500 g"
              /></label>
              <label
                ><span class="odv-label">Durum *</span
                ><select class="odv-input" [value]="draft().status" (change)="patch('status', $any($event.target).value)">
                  @for (option of statusOptions; track option.value) {
                    <option [value]="option.value">{{ option.label }}</option>
                  }
                </select></label
              >
              <label
                ><span class="odv-label">Üretim yeri *</span
                ><input class="odv-input" [value]="draft().location" (input)="patch('location', $any($event.target).value)"
              /></label>
              <label
                ><span class="odv-label">SKU / ürün kodu</span
                ><input class="odv-input" [value]="draft().sku" (input)="patch('sku', $any($event.target).value)"
              /></label>
              <label
                ><span class="odv-label">Marka</span
                ><input class="odv-input" [value]="draft().brand" (input)="patch('brand', $any($event.target).value)"
              /></label>
              <label
                ><span class="odv-label">Hedef pazar</span
                ><input class="odv-input" placeholder="Türkiye, AB, Birleşik Krallık…" [value]="draft().market" (input)="patch('market', $any($event.target).value)"
              /></label>
              <label
                ><span class="odv-label">Etiket dili</span
                ><input class="odv-input" placeholder="tr-TR" [value]="draft().locale" (input)="patch('locale', $any($event.target).value)"
              /></label>
              @if (has('content')) {
                <label
                  ><span class="odv-label">Net miktar</span
                  ><input class="odv-input" placeholder="500 g" [value]="draft().netQuantity" (input)="patch('netQuantity', $any($event.target).value)"
                /></label>
              }
            </div>
          </section>

          @if (has('content')) {
            <section class="odv-card p-5">
              <h3 class="odv-section-title mb-4 flex items-center gap-2">
                <span class="material-symbols-rounded text-amber-500">grocery</span>İçerik, alerjen ve beyanlar
              </h3>
              <div class="grid gap-4 sm:grid-cols-2">
                <label class="sm:col-span-2"
                  ><span class="odv-label">Bileşen listesi</span
                  ><textarea class="odv-input min-h-28" placeholder="Azalan ağırlık sırasıyla tüm bileşenler…" [value]="draft().ingredients" (input)="patch('ingredients', $any($event.target).value)"></textarea>
                  <span class="odv-hint">Alerjen içeren bileşenler önizlemede otomatik koyu yazılır.</span>
                </label>
                <label
                  ><span class="odv-label">Alerjenler</span
                  ><input class="odv-input" placeholder="Gluten, süt, soya" [value]="draft().allergensText" (input)="patch('allergensText', $any($event.target).value)"
                  /><span class="odv-hint">Virgülle ayırın.</span></label
                >
                <label
                  ><span class="odv-label">Beslenme / pazarlama beyanları</span
                  ><input class="odv-input" placeholder="Yüksek protein, ilave şeker içermez" [value]="draft().claimsText" (input)="patch('claimsText', $any($event.target).value)"
                  /><span class="odv-hint">Virgülle ayırın.</span></label
                >
              </div>
            </section>
          }

          @if (has('nutrition')) {
            <section class="odv-card p-5">
              <h3 class="odv-section-title mb-4 flex items-center gap-2">
                <span class="material-symbols-rounded text-emerald-500">monitoring</span>Besin bildirimi
                <span class="odv-badge-neutral ms-auto">100 g / ml</span>
              </h3>
              <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
                @for (field of nutritionFields; track field.key) {
                  <label
                    ><span class="odv-label">{{ field.label }}</span
                    ><input class="odv-input" type="number" min="0" inputmode="decimal" [step]="field.step" [value]="draft()[field.key] ?? ''" (input)="patchNumber(field.key, $any($event.target).value)"
                  /></label>
                }
              </div>
            </section>
          }

          <section class="odv-card p-5">
            <h3 class="odv-section-title mb-4 flex items-center gap-2">
              <span class="material-symbols-rounded text-sky-500">fact_check</span>İnceleme, onay ve kanıt
            </h3>
            <div class="grid gap-4 sm:grid-cols-2">
              <label
                ><span class="odv-label">Mevzuat sorumlusu</span
                ><input class="odv-input" [value]="draft().responsibleName" (input)="patch('responsibleName', $any($event.target).value)"
              /></label>
              <label
                ><span class="odv-label">Sonraki inceleme</span
                ><input class="odv-input" type="datetime-local" [value]="draft().reviewDueAt" (input)="patch('reviewDueAt', $any($event.target).value)"
              /></label>
              <label
                ><span class="odv-label">Onay tarihi</span
                ><input class="odv-input" type="datetime-local" [value]="draft().approvedAt" (input)="patch('approvedAt', $any($event.target).value)"
              /></label>
              <label
                ><span class="odv-label">Belge referansları</span
                ><input class="odv-input" placeholder="SPEC-24, LAB-118, ARTWORK-v3" [value]="draft().documentRefsText" (input)="patch('documentRefsText', $any($event.target).value)"
              /></label>
              <label class="sm:col-span-2"
                ><span class="odv-label">İnceleme notları ve düzeltici faaliyet</span
                ><textarea class="odv-input min-h-24" [value]="draft().notes" (input)="patch('notes', $any($event.target).value)"></textarea>
              </label>
            </div>
          </section>

          @if (editing(); as row) {
            <div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-slate-300 p-4 dark:border-slate-700">
              <span class="text-xs text-slate-500">Son güncelleme {{ row.updatedAt | date: 'dd.MM.yyyy HH:mm' }}</span>
              <button type="button" class="odv-btn-ghost !min-h-9 text-rose-600 dark:text-rose-400" (click)="toggleArchive(row)">
                <span class="material-symbols-rounded">{{ row.archivedAt ? 'unarchive' : 'archive' }}</span
                >{{ row.archivedAt ? 'Arşivden çıkar' : 'Arşivle' }}
              </button>
            </div>
          }
        </div>

        <aside class="lg:sticky lg:top-0 lg:self-start">
          <app-label-preview [draft]="draft()" />
        </aside>
      </div>
    </app-slide-over>
  `,
})
export class FoodLabelPage {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(FoodLabelApi);
  readonly kindMeta = KIND_META;
  readonly kindOptions = KIND_OPTIONS;
  readonly statusMeta = STATUS_META;
  readonly statusOptions = STATUS_OPTIONS;
  readonly nutritionFields = NUTRITION_FIELDS;
  readonly ring = { circumference: 2 * Math.PI * 52 };
  readonly selectedKindClass = 'border-violet-500 ring-2 ring-violet-500/20 text-violet-700 dark:text-violet-200';
  readonly idleKindClass = 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300';

  readonly overview = this.route.snapshot.data['view'] === 'overview';
  private readonly section = String(this.route.snapshot.data['section'] ?? '');
  readonly kind = this.overview ? null : (KINDS[this.section] ?? 'product');
  readonly domain = PRODUCT_NAVIGATION.find((item) => item.key === this.section);
  readonly title = this.overview ? 'Genel Bakış' : (this.domain?.title ?? 'Gıda Etiketi Kayıtları');
  readonly description = this.overview
    ? 'Ürün, reçete, alerjen, besin bildirimi ve pazar onaylarını canlı uyum verileriyle yönetin.'
    : (this.domain?.description ?? 'Pazara çıkış kararlarını kanıtlayan denetlenebilir kayıtlar.');

  readonly records = signal<FoodLabelRecord[]>([]);
  readonly nextCursor = signal<string | null>(null);
  readonly dashboard = signal<FoodLabelDashboard | null>(null);
  readonly loading = signal(true);
  readonly loadingMore = signal(false);
  readonly error = signal('');
  readonly search = signal('');
  readonly status = signal<FoodLabelStatus | null>(null);
  readonly archived = signal(false);
  readonly drawerOpen = signal(false);
  readonly saving = signal(false);
  readonly saveError = signal('');
  readonly editing = signal<FoodLabelRecord | null>(null);
  readonly draft = signal<RecordDraft>(emptyDraft(this.kind ?? 'product'));
  readonly dirty = signal(false);
  private timer?: ReturnType<typeof setTimeout>;

  readonly score = computed(() => this.dashboard()?.complianceScore ?? 100);
  readonly ringOffset = computed(() => this.ring.circumference * (1 - this.score() / 100));
  readonly scoreHeadline = computed(() => {
    const score = this.score();
    if (score >= 90) return 'Etiketleriniz pazara hazır';
    if (score >= 70) return 'Birkaç kayıt dikkat bekliyor';
    return 'Uyum riski yüksek, aksiyon alın';
  });
  readonly heroStats = computed(() => {
    const d = this.dashboard();
    return [
      { label: '30 gün içinde', value: d?.dueSoon ?? 0 },
      { label: 'Aksiyon', value: d?.actionRequired ?? 0 },
      { label: 'Onaylı', value: d?.approved ?? 0 },
    ];
  });
  readonly metrics = computed(() => {
    const d = this.dashboard();
    return [
      { label: 'Toplam kayıt', value: d?.total ?? 0, icon: 'folder_copy', note: 'Aktif ürün ve uyum dosyaları', tone: 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300' },
      { label: 'Ürün kartı', value: d?.products ?? 0, icon: 'inventory_2', note: 'Pazara hazırlanan ürünler', tone: 'bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300' },
      { label: 'Alerjen incelemesi', value: d?.allergenReviews ?? 0, icon: 'warning', note: 'Doğrulanan risk analizleri', tone: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300' },
      { label: 'Onaylı kayıt', value: d?.approved ?? 0, icon: 'verified', note: 'Yayınlanabilir kararlar', tone: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300' },
    ];
  });
  readonly modules = computed(() => {
    const d = this.dashboard();
    return PRODUCT_NAVIGATION.map((item) => {
      const countKey = DASHBOARD_COUNT[item.key];
      const kind = KINDS[item.key];
      return {
        path: item.path,
        label: item.label,
        icon: item.icon,
        tone: kind ? KIND_META[kind].tone : '',
        hint: countKey && d ? `${d[countKey]} kayıt` : item.description,
      };
    });
  });
  readonly actionQueue = computed(() =>
    this.records().filter((row) => row.status === 'action-required' || row.status === 'rejected'),
  );
  readonly reviewQueue = computed(() =>
    this.records()
      .filter((row) => row.reviewDueAt && row.status !== 'approved')
      .sort((a, b) => a.reviewDueAt!.localeCompare(b.reviewDueAt!)),
  );

  constructor() {
    void this.load();
  }

  async load() {
    this.loading.set(true);
    this.error.set('');
    try {
      const [page, dashboard] = await Promise.all([
        this.api.list(this.kind, this.archived(), this.search(), { status: this.status() }),
        this.api.dashboard(),
      ]);
      this.records.set(page.items);
      this.nextCursor.set(page.nextCursor ?? null);
      this.dashboard.set(dashboard);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Kayıtlar alınamadı.');
    } finally {
      this.loading.set(false);
    }
  }
  async loadMore() {
    const cursor = this.nextCursor();
    if (!cursor) return;
    this.loadingMore.set(true);
    try {
      const page = await this.api.list(this.kind, this.archived(), this.search(), {
        status: this.status(),
        cursor,
      });
      this.records.update((rows) => [...rows, ...page.items]);
      this.nextCursor.set(page.nextCursor ?? null);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Kayıtlar alınamadı.');
    } finally {
      this.loadingMore.set(false);
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
  setStatus(value: FoodLabelStatus | null) {
    this.status.set(value);
    void this.load();
  }
  clearFilters() {
    this.search.set('');
    this.status.set(null);
    void this.load();
  }
  has(section: DraftSection) {
    return KIND_META[this.draft().kind].sections.includes(section);
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
  patchNumber(key: NutritionKey, value: string) {
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
      customClass: {
        popup: 'odv-swal-popup',
        confirmButton: row.archivedAt ? 'odv-swal-confirm' : 'odv-swal-danger',
        cancelButton: 'odv-swal-cancel',
      },
    });
    if (!result.isConfirmed) return;
    try {
      if (row.archivedAt) await this.api.restore(row.id);
      else await this.api.archive(row.id);
      this.dirty.set(false);
      this.drawerOpen.set(false);
      await this.load();
    } catch (error) {
      this.saveError.set(error instanceof Error ? error.message : 'İşlem tamamlanamadı.');
    }
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
  subtitle(row: FoodLabelRecord) {
    return recordSubtitle(row);
  }
  dueBadge(row: FoodLabelRecord) {
    const state = dueState(row.reviewDueAt);
    return state === 'overdue'
      ? 'odv-badge-danger'
      : state === 'soon'
        ? 'odv-badge-warning'
        : 'odv-badge-neutral';
  }
  dueLabel(row: FoodLabelRecord) {
    const days = daysUntil(row.reviewDueAt);
    if (days === null) return '—';
    if (days < 0) return `${-days} gün gecikti`;
    if (days === 0) return 'Bugün';
    return `${days} gün kaldı`;
  }
  private localDate(value: string | null) {
    return value ? value.slice(0, 16) : '';
  }
}
