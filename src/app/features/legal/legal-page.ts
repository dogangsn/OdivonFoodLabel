import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-legal-page',
  imports: [RouterLink],
  template: `<main class="min-h-screen bg-slate-50 p-5 dark:bg-[#0b1120]">
    <article class="odv-card mx-auto max-w-4xl p-7 sm:p-11">
      <a
        routerLink="/register"
        class="inline-flex items-center gap-2 text-sm font-bold text-violet-600"
        ><span class="material-symbols-rounded directional-icon">arrow_back</span>Kayıt ekranına
        dön</a
      ><span class="mt-8 block text-xs font-black uppercase tracking-[.18em] text-violet-600"
        >ODIVON FIRESAFE</span
      >
      <h1 class="mt-3 text-3xl font-black">
        {{ privacy ? 'Gizlilik ve Veri İşleme Bildirimi' : 'SaaS Kullanım Koşulları' }}
      </h1>
      <p class="text-xs text-slate-500">Son güncelleme: 27 Ekim 2026</p>
      <div class="mt-8 space-y-7 text-sm leading-7 text-slate-600 dark:text-slate-300">
        @if (privacy) {
          <section>
            <h2 class="text-xl font-black text-slate-900 dark:text-white">
              Veri sorumluluğu ve kapsam
            </h2>
            <p>
              Odivon; kimlik, iletişim, tenant, denetim izi ve faturalama verilerini hizmetin
              güvenli sunumu için işler. Müşteri kuruluş, gıda etiketi operasyon verilerinin
              veri sorumlusudur.
            </p>
          </section>
          <section>
            <h2 class="text-xl font-black text-slate-900 dark:text-white">Saklama ve güvenlik</h2>
            <p>
              Rol tabanlı erişim, tenant izolasyonu, aktarım şifreleme, değişmez snapshot ve denetim
              kayıtları uygulanır. Yasal saklama ve silme talepleri destek kanalı üzerinden
              yürütülür.
            </p>
          </section>
          <section>
            <h2 class="text-xl font-black text-slate-900 dark:text-white">Haklar ve iletişim</h2>
            <p>
              Erişim, düzeltme, silme, kısıtlama ve itiraz talepleri destek@odivon.com adresine
              iletilebilir.
            </p>
          </section>
        } @else {
          <section>
            <h2 class="text-xl font-black text-slate-900 dark:text-white">Hizmetin kapsamı</h2>
            <p>
              Odivon FoodLabel; ürün kartı, reçete, alerjen kontrolü, besin değeri ve pazar onayı,
              denetim izi ve raporlama araçları sunan abonelik tabanlı bir yazılımdır.
            </p>
          </section>
          <section>
            <h2 class="text-xl font-black text-slate-900 dark:text-white">Abonelik ve ödeme</h2>
            <p>
              Plan, dönem ve fiyat ödeme öncesi gösterilir. Abonelik, sağlayıcının sunucu tarafında
              doğruladığı başarılı tahsilat sonrasında aktifleşir.
            </p>
          </section>
          <section>
            <h2 class="text-xl font-black text-slate-900 dark:text-white">Müşteri sorumluluğu</h2>
            <p>
              Yazılım karar desteği ve kayıt altyapısı sağlar; saha doğruluğu, mevzuata uygunluk ve
              yetkili personel kullanımı müşterinin sorumluluğundadır.
            </p>
          </section>
        }
      </div>
    </article>
  </main>`,
})
export class LegalPage {
  readonly privacy = inject(ActivatedRoute).snapshot.data['document'] === 'privacy';
}

