import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { email, FormField, form, required, submit } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthStore } from '../../core/auth/auth-store';

@Component({
  selector: 'app-onboarding-page',
  imports: [FormField],
  template: `<main class="min-h-screen bg-slate-50 p-5 dark:bg-[#0b1120]">
    <div class="mx-auto max-w-6xl py-6">
      <header class="mb-7 flex items-center gap-3">
        <span
          class="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-rose-500 to-violet-700 text-white"
          ><span class="material-symbols-rounded">nutrition</span></span
        >
        <div>
          <strong class="text-lg">Odivon FoodLabel</strong
          ><span class="block text-xs text-slate-500">Gıda etiketi çalışma alanı kurulumu</span>
        </div>
      </header>
      <div class="grid gap-6 lg:grid-cols-[.72fr_1.28fr]">
        <aside class="odv-card overflow-hidden p-7">
          <span class="text-xs font-black uppercase tracking-widest text-violet-600"
            >KURULUŞ PROFİLİ · 1/1</span
          >
          <h1 class="mt-3 text-3xl font-black">Pazara hazır etiket uyum temelini kurun</h1>
          <p class="text-sm leading-6 text-slate-500">
            Bu bilgiler ürün dosyaları, pazar onayları ve resmi denetim paketlerinde kullanılır.
          </p>
          <ul class="mt-7 space-y-4 text-sm">
            <li class="flex gap-3">
              <span class="material-symbols-rounded text-emerald-600">check_circle</span>Tenant
              izolasyonu ve rol tabanlı erişim
            </li>
            <li class="flex gap-3">
              <span class="material-symbols-rounded text-emerald-600">check_circle</span>Tesis bazlı
              ürün, reçete ve pazar bazlı inceleme takvimi
            </li>
            <li class="flex gap-3">
              <span class="material-symbols-rounded text-emerald-600">check_circle</span>Değişmez
              denetim izi ve kanıt paketi
            </li>
          </ul>
        </aside>
        <section class="odv-card p-7 sm:p-9">
          <h2 class="m-0 text-xl font-black">Kuruluş, üretim tesisi ve mevzuat sorumlusu</h2>
          <form class="mt-6 grid gap-4 sm:grid-cols-2" (submit)="complete($event)">
            <label class="sm:col-span-2"
              ><span class="mb-1.5 block text-xs font-bold">Ticari unvan *</span
              ><input
                class="odv-input"
                autocomplete="organization"
                [formField]="setupForm.legalName" /></label
            ><label
              ><span class="mb-1.5 block text-xs font-bold">Vergi / kayıt numarası</span
              ><input class="odv-input" [formField]="setupForm.taxNumber" /></label
            ><label
              ><span class="mb-1.5 block text-xs font-bold">Üretim tesisi *</span
              ><input class="odv-input" [formField]="setupForm.productionSite" /></label
            ><label
              ><span class="mb-1.5 block text-xs font-bold">Ülke *</span
              ><input class="odv-input" [formField]="setupForm.country" /></label
            ><label
              ><span class="mb-1.5 block text-xs font-bold">Saat dilimi *</span
              ><select class="odv-input" [formField]="setupForm.timezone">
                <option value="Europe/Istanbul">Europe/Istanbul</option>
                <option value="Europe/Berlin">Europe/Berlin</option>
                <option value="Europe/London">Europe/London</option>
              </select></label
            ><label class="sm:col-span-2"
              ><span class="mb-1.5 block text-xs font-bold">Hedef pazarlar *</span
              ><input
                class="odv-input"
                placeholder="TR, EU, UK"
                [formField]="setupForm.targetMarketsText" /></label
            ><label
              ><span class="mb-1.5 block text-xs font-bold">Mevzuat sorumlusu *</span
              ><input class="odv-input" [formField]="setupForm.regulatoryContactName" /></label
            ><label
              ><span class="mb-1.5 block text-xs font-bold">Sorumlu e-posta *</span
              ><input
                class="odv-input"
                type="email"
                [formField]="setupForm.regulatoryContactEmail" /></label
            ><label
              ><span class="mb-1.5 block text-xs font-bold">Sorumlu telefon</span
              ><input class="odv-input" [formField]="setupForm.regulatoryContactPhone"
            /></label>
            @if (error()) {
              <div
                role="alert"
                class="sm:col-span-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700"
              >
                {{ error() }}
              </div>
            }
            <div class="sm:col-span-2 mt-2">
              <button
                class="odv-btn-primary w-full justify-center sm:w-auto"
                type="submit"
                [disabled]="saving()"
              >
                {{ saving() ? 'Kuruluyor…' : 'Çalışma alanını tamamla' }}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  </main>`,
})
export class OnboardingPage {
  readonly auth = inject(AuthStore);
  readonly model = signal({
    legalName: this.auth.session()?.tenantName ?? '',
    taxNumber: '',
    productionSite: '',
    country: 'Türkiye',
    timezone: 'Europe/Istanbul',
    targetMarketsText: 'TR, EU',
    regulatoryContactName: this.auth.session()?.name ?? '',
    regulatoryContactEmail: this.auth.session()?.email ?? '',
    regulatoryContactPhone: '',
  });
  readonly setupForm = form(this.model, (p) => {
    required(p.legalName);
    required(p.productionSite);
    required(p.country);
    required(p.timezone);
    required(p.targetMarketsText);
    required(p.regulatoryContactName);
    required(p.regulatoryContactEmail);
    email(p.regulatoryContactEmail);
  });
  readonly saving = signal(false);
  readonly error = signal('');
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  complete(event: Event) {
    event.preventDefault();
    submit(this.setupForm, async () => {
      this.saving.set(true);
      this.error.set('');
      try {
        await firstValueFrom(
          this.http.post(`${environment.apiBaseUrl}/food-label/onboarding/complete`, {
            ...this.model(),
            targetMarkets: this.model()
              .targetMarketsText.split(',')
              .map((item) => item.trim())
              .filter(Boolean),
            targetMarketsText: undefined,
          }),
        );
        await this.auth.refreshProfile();
        await this.router.navigateByUrl('/overview');
      } catch (e) {
        this.error.set(e instanceof Error ? e.message : 'Kurulum tamamlanamadı.');
      } finally {
        this.saving.set(false);
      }
    });
  }
}
