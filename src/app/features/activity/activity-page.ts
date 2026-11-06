import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
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
const EVENT_META: Record<string, { label: string; icon: string; tone: string }> = {
  created: { label: 'Yeni kayıt oluşturuldu', icon: 'add', tone: 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300' },
  updated: { label: 'Kayıt güncellendi', icon: 'edit', tone: 'bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300' },
  archived: { label: 'Kayıt arşivlendi', icon: 'archive', tone: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300' },
  restored: { label: 'Kayıt geri yüklendi', icon: 'unarchive', tone: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300' },
};
@Component({
  selector: 'app-activity-page',
  imports: [PageHeader, DatePipe],
  template: `<div class="space-y-6">
    <app-page-header
      eyebrow="Değişmez denetim izi"
      icon="history"
      title="Denetim İzi"
      description="Ürün, reçete, alerjen, besin ve onay kayıtlarındaki tüm değişiklikler sürüm numarasıyla saklanır."
    />
    <section class="odv-card overflow-hidden">
      @if (loading()) {
        <div class="space-y-4 p-6" aria-busy="true">
          @for (i of [1, 2, 3, 4, 5]; track i) {
            <div class="flex items-center gap-4">
              <div class="odv-skeleton size-10 shrink-0 !rounded-full"></div>
              <div class="flex-1 space-y-2"><div class="odv-skeleton h-3 w-1/3"></div><div class="odv-skeleton h-3 w-1/4"></div></div>
            </div>
          }
        </div>
      } @else if (error()) {
        <div role="alert" class="p-10 text-center text-sm font-semibold text-rose-600">{{ error() }}</div>
      } @else {
        <ol class="relative m-0 list-none p-6 ps-6">
          @for (group of groups(); track group.day) {
            <li class="mb-2 mt-4 first:mt-0">
              <span class="odv-kicker">{{ group.day | date: 'd MMMM y, EEEE' }}</span>
            </li>
            @for (item of group.items; track item.id) {
              <li class="relative flex gap-4 pb-5 ps-1 last:pb-2">
                <span class="absolute bottom-0 start-[1.45rem] top-11 w-px bg-slate-200 dark:bg-slate-800" aria-hidden="true"></span>
                <span class="relative z-10 grid size-10 shrink-0 place-items-center rounded-full ring-4 ring-white dark:ring-slate-900" [class]="meta(item.event).tone">
                  <span class="material-symbols-rounded !text-lg">{{ meta(item.event).icon }}</span>
                </span>
                <div class="min-w-0 flex-1 pt-1">
                  <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <strong class="text-sm">{{ meta(item.event).label }}</strong>
                    <span class="odv-badge-neutral">v{{ item.version }}</span>
                    <time class="ms-auto text-xs font-semibold text-slate-500">{{ item.createdAt | date: 'HH:mm' }}</time>
                  </div>
                  <span class="mt-1 block truncate font-mono text-[11px] text-slate-400">Kayıt {{ item.entityId }} · kullanıcı {{ item.actorId }}</span>
                </div>
              </li>
            }
          } @empty {
            <li class="py-12 text-center text-sm text-slate-500">Henüz denetim olayı bulunmuyor.</li>
          }
        </ol>
      }
    </section>
  </div>`,
})
export class ActivityPage {
  readonly items = signal<Audit[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly groups = computed(() => {
    const map = new Map<string, Audit[]>();
    for (const item of this.items()) {
      const day = item.createdAt.slice(0, 10);
      map.set(day, [...(map.get(day) ?? []), item]);
    }
    return [...map.entries()].map(([day, items]) => ({ day, items }));
  });
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
  meta(event: string) {
    const key = event.split('.').pop() ?? '';
    return (
      EVENT_META[key] ?? {
        label: event,
        icon: 'radio_button_checked',
        tone: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
      }
    );
  }
}
