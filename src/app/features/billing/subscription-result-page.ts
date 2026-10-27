import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BillingApi } from './billing.api';
@Component({
  selector: 'app-subscription-result-page',
  imports: [RouterLink],
  template: `<div class="mx-auto max-w-2xl py-10">
    <section class="odv-card p-8 text-center sm:p-11" aria-live="polite">
      @if (loading()) {
        <span class="material-symbols-rounded animate-spin !text-5xl text-violet-600"
          >progress_activity</span
        >
        <h1 class="mt-5 text-2xl font-black">Ödeme doğrulanıyor</h1>
      } @else if (state() === 'succeeded') {
        <span
          class="mx-auto grid size-16 place-items-center rounded-3xl bg-emerald-100 text-emerald-700"
          ><span class="material-symbols-rounded !text-4xl">check_circle</span></span
        >
        <h1 class="mt-5 text-3xl font-black">Aboneliğiniz aktif</h1>
        <p class="text-sm text-slate-500">
          Ödeme sunucu tarafında doğrulandı ve dönem tenant hesabınıza işlendi.
        </p>
        <a class="odv-btn-primary mt-5" routerLink="/billing">Aboneliğe dön</a>
      } @else {
        <span class="mx-auto grid size-16 place-items-center rounded-3xl bg-rose-100 text-rose-700"
          ><span class="material-symbols-rounded !text-4xl">error</span></span
        >
        <h1 class="mt-5 text-3xl font-black">Ödeme tamamlanamadı</h1>
        <p class="text-sm text-slate-500">
          Doğrulanmış tahsilat alınmadı. Yeni bir ödeme oturumu başlatabilirsiniz.
        </p>
        <a class="odv-btn-primary mt-5" routerLink="/billing">Planlara dön</a>
      }
    </section>
  </div>`,
})
export class SubscriptionResultPage {
  readonly loading = signal(true);
  readonly state = signal('pending');
  private readonly api = inject(BillingApi);
  private readonly route = inject(ActivatedRoute);
  constructor() {
    void this.check();
  }
  private async check() {
    const id = this.route.snapshot.queryParamMap.get('paymentSession');
    if (!id) {
      this.state.set(
        this.route.snapshot.queryParamMap.get('payment') === 'succeeded' ? 'succeeded' : 'failed',
      );
      this.loading.set(false);
      return;
    }
    try {
      let session = await this.api.session(id);
      if (session.status === 'pending') session = { ...session, ...(await this.api.reconcile(id)) };
      this.state.set(session.status);
    } catch {
      this.state.set('failed');
    } finally {
      this.loading.set(false);
    }
  }
}

