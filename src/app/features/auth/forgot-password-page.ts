import { Component, inject, signal } from '@angular/core';
import { email, FormField, form, required, submit } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../core/auth/auth-store';

@Component({
  selector: 'app-forgot-password-page',
  imports: [FormField, RouterLink],
  template: `<main class="grid min-h-screen place-items-center bg-slate-50 p-5 dark:bg-[#0b1120]">
    <section class="odv-card w-full max-w-md p-8 sm:p-10" aria-labelledby="reset-title">
      <a
        routerLink="/login"
        class="mb-7 inline-flex items-center gap-2 text-sm font-bold text-violet-600"
        ><span class="material-symbols-rounded directional-icon">arrow_back</span>Girişe dön</a
      >
      <span
        class="grid size-14 place-items-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"
        ><span class="material-symbols-rounded !text-3xl">lock_reset</span></span
      >
      <h1 id="reset-title" class="mb-2 mt-5 text-3xl font-black">Şifrenizi sıfırlayın</h1>
      <p class="mb-6 text-sm leading-6 text-slate-500">
        Hesabınızla eşleşen adrese tek kullanımlık, güvenli bir sıfırlama bağlantısı gönderilir.
      </p>
      @if (sent()) {
        <div role="status" class="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">
          Bağlantı gönderildi. Gelen kutunuzu ve spam klasörünü kontrol edin.
        </div>
      } @else {
        <form class="space-y-4" (submit)="send($event)">
          <label class="block"
            ><span class="mb-1.5 block text-xs font-bold">E-posta adresi</span
            ><input
              class="odv-input"
              type="email"
              autocomplete="email"
              [formField]="resetForm.email"
          /></label>
          @if (error()) {
            <div role="alert" class="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700">
              {{ error() }}
            </div>
          }
          <button class="odv-btn-primary w-full justify-center" type="submit" [disabled]="busy()">
            {{ busy() ? 'Gönderiliyor…' : 'Sıfırlama bağlantısı gönder' }}
          </button>
        </form>
      }
    </section>
  </main>`,
})
export class ForgotPasswordPage {
  readonly model = signal({ email: '' });
  readonly resetForm = form(this.model, (p) => {
    required(p.email);
    email(p.email);
  });
  readonly busy = signal(false);
  readonly sent = signal(false);
  readonly error = signal('');
  private readonly auth = inject(AuthStore);
  send(event: Event): void {
    event.preventDefault();
    submit(this.resetForm, async () => {
      this.busy.set(true);
      this.error.set('');
      try {
        await this.auth.resetPassword(this.model().email);
        this.sent.set(true);
      } catch {
        this.error.set('Bağlantı gönderilemedi. Adresi kontrol edip tekrar deneyin.');
      } finally {
        this.busy.set(false);
      }
    });
  }
}

