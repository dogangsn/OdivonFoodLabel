import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormField, form, minLength, required, submit } from '@angular/forms/signals';
import { AuthStore } from '../../core/auth/auth-store';
import { PageHeader } from '../../shared/ui/page-header';
import { SlideOver } from '../../shared/ui/slide-over';
import {
  BillingApi,
  BillingStatus,
  BuyerDraft,
  FoodLabelEntitlements,
  PaymentRecord,
  SaasPlan,
} from './billing.api';
@Component({
  selector: 'app-billing-page',
  imports: [CurrencyPipe, DatePipe, FormField, PageHeader, SlideOver],
  template: `<div class="space-y-7">
      <app-page-header
        eyebrow="SAAS ABONELİK MERKEZİ"
        title="Plan, Kullanım ve Ödeme"
        description="Kapasitenizi izleyin, planınızı seçin ve sunucu tarafından doğrulanan güvenli ödemeleri yönetin."
      />
      @if (loading()) {
        <div class="grid min-h-80 place-items-center">
          <span class="material-symbols-rounded animate-spin text-5xl text-violet-600"
            >progress_activity</span
          >
        </div>
      } @else if (error()) {
        <div role="alert" class="odv-card p-8 text-center text-rose-600">{{ error() }}</div>
      } @else {
        <section class="grid gap-5 lg:grid-cols-[1.4fr_.6fr]">
          <article
            class="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-violet-950 to-indigo-950 p-7 text-white shadow-xl"
          >
            <div class="flex flex-wrap items-start justify-between gap-5">
              <div>
                <span
                  class="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black tracking-widest"
                  >{{ statusLabel(status()!) }}</span
                >
                <h2 class="mb-2 mt-5 text-3xl font-black">FoodLabel çalışma alanınız güvende</h2>
                <p class="m-0 max-w-2xl text-sm leading-6 text-slate-300">
                  Denetim kayıtları tenant sınırında korunur; kapasite ve gelişmiş rapor hakları
                  seçili plana göre uygulanır.
                </p>
              </div>
              <span class="material-symbols-rounded !text-6xl text-rose-300">nutrition</span>
            </div>
            <div class="mt-7 grid gap-3 sm:grid-cols-3">
              <div class="rounded-2xl bg-white/10 p-4">
                <strong class="block text-2xl"
                  >{{ entitlements()?.usage?.records ?? 0 }} /
                  {{ entitlements()?.records ?? '∞' }}</strong
                ><span class="text-xs text-slate-300">Etiket kaydı</span>
              </div>
              <div class="rounded-2xl bg-white/10 p-4">
                <strong class="block text-2xl">{{ entitlements()?.users ?? '∞' }}</strong
                ><span class="text-xs text-slate-300">Kullanıcı limiti</span>
              </div>
              <div class="rounded-2xl bg-white/10 p-4">
                <strong class="block text-2xl">{{
                  entitlements()?.advancedReports ? 'Açık' : 'Temel'
                }}</strong
                ><span class="text-xs text-slate-300">Rapor seviyesi</span>
              </div>
            </div>
          </article>
          <article class="odv-card p-6">
            <span class="text-xs font-black text-violet-600">DÖNEM DURUMU</span>
            <h3 class="mt-3 text-2xl font-black">{{ status()?.daysLeft ?? '—' }} gün</h3>
            <p class="text-sm text-slate-500">
              {{
                status()?.subscriptionEndsAt
                  ? 'Dönem bitişi: ' + (status()?.subscriptionEndsAt | date: 'dd.MM.yyyy')
                  : '14 günlük deneme dönemi'
              }}
            </p>
            <div class="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                class="h-full w-2/3 rounded-full bg-gradient-to-r from-emerald-500 to-violet-500"
              ></div>
            </div>
          </article>
        </section>
        <section>
          <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 class="m-0 text-xl font-black">Planlar</h2>
              <p class="mb-0 mt-1 text-sm text-slate-500">Yıllık ödemede iki aylık avantaj.</p>
            </div>
            <div class="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
              <button
                type="button"
                class="rounded-lg px-4 py-2 text-xs font-bold"
                [class.bg-white]="cycle() === 'monthly'"
                (click)="cycle.set('monthly')"
              >
                Aylık</button
              ><button
                type="button"
                class="rounded-lg px-4 py-2 text-xs font-bold"
                [class.bg-white]="cycle() === 'yearly'"
                (click)="cycle.set('yearly')"
              >
                Yıllık
              </button>
            </div>
          </div>
          <div class="grid gap-4 lg:grid-cols-3">
            @for (plan of plans(); track plan.id; let index = $index) {
              <article
                class="odv-card relative p-6"
                [class.ring-2]="index === 1"
                [class.ring-violet-500]="index === 1"
              >
                @if (entitlements()?.planId === plan.id) {
                  <span
                    class="absolute end-4 top-4 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black text-emerald-700"
                    >MEVCUT PLAN</span
                  >
                }
                <h3 class="m-0 text-xl font-black">{{ plan.name }}</h3>
                <p class="mt-2 text-sm text-slate-500">{{ description(plan.id) }}</p>
                <div class="my-6">
                  <strong class="text-4xl font-black">{{
                    price(plan) | currency: 'TRY' : 'symbol-narrow' : '1.0-0' : 'tr-TR'
                  }}</strong
                  ><span class="text-xs text-slate-500">
                    / {{ cycle() === 'monthly' ? 'ay' : 'yıl' }}</span
                  >
                </div>
                <ul class="mb-6 space-y-3 text-sm">
                  @for (feature of features(plan.id); track feature) {
                    <li class="flex gap-2">
                      <span class="material-symbols-rounded text-emerald-600">check_circle</span
                      >{{ feature }}
                    </li>
                  }
                </ul>
                <button
                  type="button"
                  class="w-full"
                  [class.odv-btn-primary]="index === 1"
                  [class.odv-btn-soft]="index !== 1"
                  [disabled]="auth.session()?.role !== 'owner' || !price(plan)"
                  (click)="selectPlan(plan)"
                >
                  {{
                    auth.session()?.role === 'owner'
                      ? 'Bu planı seç'
                      : 'Yalnız hesap sahibi değiştirebilir'
                  }}
                </button>
              </article>
            }
          </div>
        </section>
        <section class="odv-card overflow-hidden">
          <div class="border-b border-slate-200 p-5 dark:border-slate-800">
            <h2 class="m-0 text-xl font-black">Ödeme ve makbuz geçmişi</h2>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[760px]">
              <thead>
                <tr>
                  <th class="odv-th">Makbuz</th>
                  <th class="odv-th">Plan</th>
                  <th class="odv-th">Dönem</th>
                  <th class="odv-th">Tutar</th>
                  <th class="odv-th">Ödeme tarihi</th>
                </tr>
              </thead>
              <tbody>
                @for (payment of history(); track payment.id) {
                  <tr>
                    <td class="odv-td font-mono text-xs">{{ payment.receiptNo }}</td>
                    <td class="odv-td font-bold">{{ payment.planId }}</td>
                    <td class="odv-td">
                      {{ payment.periodStartsAt | date: 'dd.MM.yyyy' }} –
                      {{ payment.periodEndsAt | date: 'dd.MM.yyyy' }}
                    </td>
                    <td class="odv-td font-bold">
                      {{ payment.amountKurus / 100 | currency: payment.currency }}
                    </td>
                    <td class="odv-td">{{ payment.paidAt | date: 'dd.MM.yyyy HH:mm' }}</td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="p-10 text-center text-sm text-slate-500">
                      Henüz tamamlanmış ödeme yok.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      }
    </div>
    <app-slide-over
      [open]="drawerOpen()"
      [wide]="true"
      [dirty]="buyerForm().dirty()"
      [submitting]="saving()"
      title="Güvenli ödeme bilgileri"
      [description]="selectedPlan()?.name ?? ''"
      eyebrow="IYZICO GÜVENLİ ÖDEME"
      icon="credit_card"
      submitLabel="Güvenli ödemeye geç"
      (closed)="drawerOpen.set(false)"
      (submitted)="checkout()"
    >
      @if (saveError()) {
        <div role="alert" class="rounded-xl bg-rose-50 p-4 text-sm font-semibold text-rose-700">
          {{ saveError() }}
        </div>
      }
      <section class="odv-card p-5">
        <div class="grid gap-4 sm:grid-cols-2">
          <label
            ><span class="mb-1 block text-xs font-bold">Ad *</span
            ><input class="odv-input" [formField]="buyerForm.name" /></label
          ><label
            ><span class="mb-1 block text-xs font-bold">Soyad *</span
            ><input class="odv-input" [formField]="buyerForm.surname" /></label
          ><label
            ><span class="mb-1 block text-xs font-bold">T.C. kimlik no *</span
            ><input
              class="odv-input"
              inputmode="numeric"
              [formField]="buyerForm.identityNumber" /></label
          ><label
            ><span class="mb-1 block text-xs font-bold">Telefon *</span
            ><input class="odv-input" [formField]="buyerForm.gsmNumber" /></label
          ><label
            ><span class="mb-1 block text-xs font-bold">Şehir *</span
            ><input class="odv-input" [formField]="buyerForm.city" /></label
          ><label
            ><span class="mb-1 block text-xs font-bold">E-posta *</span
            ><input class="odv-input" type="email" [formField]="buyerForm.email" /></label
          ><label class="sm:col-span-2"
            ><span class="mb-1 block text-xs font-bold">Fatura adresi *</span
            ><textarea class="odv-input min-h-24" [formField]="buyerForm.address"></textarea>
          </label>
        </div></section
    ></app-slide-over>`,
})
export class BillingPage {
  readonly auth = inject(AuthStore);
  readonly plans = signal<SaasPlan[]>([]);
  readonly status = signal<BillingStatus | null>(null);
  readonly history = signal<PaymentRecord[]>([]);
  readonly entitlements = signal<FoodLabelEntitlements | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly cycle = signal<'monthly' | 'yearly'>('yearly');
  readonly drawerOpen = signal(false);
  readonly selectedPlan = signal<SaasPlan | null>(null);
  readonly saving = signal(false);
  readonly saveError = signal('');
  readonly buyer = signal<BuyerDraft>({
    name: '',
    surname: '',
    identityNumber: '',
    email: this.auth.session()?.email ?? '',
    gsmNumber: '',
    address: '',
    city: '',
    country: 'Turkey',
  });
  readonly buyerForm = form(this.buyer, (p) => {
    required(p.name);
    required(p.surname);
    required(p.identityNumber);
    minLength(p.identityNumber, 11);
    required(p.email);
    required(p.gsmNumber);
    required(p.address);
    required(p.city);
  });
  private readonly api = inject(BillingApi);
  constructor() {
    void this.load();
  }
  async load() {
    try {
      const [plans, status, history, access] = await Promise.all([
        this.api.plans(),
        this.api.status(),
        this.api.history(),
        this.api.entitlements(),
      ]);
      this.plans.set(plans);
      this.status.set(status);
      this.history.set(history);
      this.entitlements.set(access);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Abonelik verileri alınamadı.');
    } finally {
      this.loading.set(false);
    }
  }
  price(plan: SaasPlan) {
    return this.cycle() === 'monthly' ? plan.monthly : plan.yearly;
  }
  selectPlan(plan: SaasPlan) {
    this.selectedPlan.set(plan);
    this.drawerOpen.set(true);
  }
  checkout() {
    submit(this.buyerForm, async () => {
      const plan = this.selectedPlan();
      if (!plan) return;
      this.saving.set(true);
      try {
        window.location.assign(await this.api.checkout(plan.id, this.cycle(), this.buyer()));
      } catch (e) {
        this.saveError.set(e instanceof Error ? e.message : 'Ödeme başlatılamadı.');
        this.saving.set(false);
      }
    });
  }
  statusLabel(s: BillingStatus) {
    return s.inGrace
      ? 'EK SÜRE'
      : s.membershipStatus === 'active'
        ? 'AKTİF ABONELİK'
        : s.membershipStatus === 'trial'
          ? 'ÜCRETSİZ DENEME'
          : 'ERİŞİM SONA ERDİ';
  }
  description(id: string) {
    return id === 'starter'
      ? 'Tek üretim tesisli ekipler için temel etiket uyumu.'
      : id === 'pro'
        ? 'Çok tesisli operasyonlar ve gelişmiş raporlama.'
        : 'Kurumsal ölçekte sınırsız yönetişim ve destek.';
  }
  features(id: string) {
    return id === 'starter'
      ? ['100 kayıt', '3 kullanıcı', 'Temel denetim raporu']
      : id === 'pro'
        ? ['1.500 kayıt', '15 kullanıcı', 'Gelişmiş uyum raporları']
        : ['Sınırsız kayıt', 'Sınırsız kullanıcı', 'Öncelikli destek'];
  }
}
