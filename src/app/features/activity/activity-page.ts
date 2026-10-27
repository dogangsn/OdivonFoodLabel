import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PageHeader } from '../../shared/ui/page-header';
interface Audit {
  id: string;
  event: string;
  entity: string;
  entityId: string;
  version: number;
  actorId: string;
  createdAt: string;
}
@Component({
  selector: 'app-activity-page',
  imports: [PageHeader, DatePipe],
  template: `<div class="space-y-6">
    <app-page-header
      eyebrow="DEĞİŞMEZ DENETİM İZİ"
      title="Aktivite Günlüğü"
      description="Ekipman, kontrol, uygunsuzluk ve acil durum kayıtlarındaki tüm kritik değişiklikler."
    />
    <section class="odv-card overflow-hidden">
      @if (loading()) {
        <div class="grid min-h-64 place-items-center">
          <span class="material-symbols-rounded animate-spin text-4xl text-violet-600"
            >progress_activity</span
          >
        </div>
      } @else if (error()) {
        <div role="alert" class="p-10 text-center text-sm text-rose-600">{{ error() }}</div>
      } @else {
        <div class="divide-y divide-slate-100 dark:divide-slate-800">
          @for (item of items(); track item.id) {
            <article class="grid gap-4 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center">
              <span class="grid size-11 place-items-center rounded-xl bg-violet-50 text-violet-700"
                ><span class="material-symbols-rounded">{{ icon(item.event) }}</span></span
              >
              <div>
                <strong class="block text-sm">{{ label(item.event) }}</strong
                ><span class="mt-1 block font-mono text-[11px] text-slate-500"
                  >{{ item.entity }} / {{ item.entityId }} · sürüm {{ item.version }}</span
                >
              </div>
              <div class="text-start sm:text-end">
                <time class="block text-xs font-bold">{{
                  item.createdAt | date: 'dd.MM.yyyy HH:mm'
                }}</time
                ><span class="text-[11px] text-slate-400">Kullanıcı: {{ item.actorId }}</span>
              </div>
            </article>
          } @empty {
            <div class="p-12 text-center text-sm text-slate-500">
              Henüz denetim olayı bulunmuyor.
            </div>
          }
        </div>
      }
    </section>
  </div>`,
})
export class ActivityPage {
  readonly items = signal<Audit[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  private readonly http = inject(HttpClient);
  constructor() {
    void this.load();
  }
  async load() {
    try {
      const response = await firstValueFrom(
        this.http.get<{ data: Audit[] }>(`${environment.apiBaseUrl}/food-label/audit?limit=100`),
      );
      this.items.set(response.data);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Aktivite günlüğü alınamadı.');
    } finally {
      this.loading.set(false);
    }
  }
  label(e: string) {
    return e.endsWith('.created')
      ? 'Yeni kayıt oluşturuldu'
      : e.endsWith('.updated')
        ? 'Kayıt güncellendi'
        : e.endsWith('.archived')
          ? 'Kayıt arşivlendi'
          : e.endsWith('.restored')
            ? 'Kayıt geri yüklendi'
            : e;
  }
  icon(e: string) {
    return e.endsWith('.created')
      ? 'add_circle'
      : e.endsWith('.updated')
        ? 'edit_note'
        : e.endsWith('.archived')
          ? 'archive'
          : 'restore';
  }
}

