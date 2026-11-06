import { Component, computed, input } from '@angular/core';
import { RecordDraft } from './food-label.api';
import {
  KIND_META,
  REGULATED_ALLERGENS,
  labelChecklist,
  splitList,
  undeclaredAllergens,
} from './food-label.model';

interface Segment {
  readonly text: string;
  readonly allergen: boolean;
}

/** Live, print-like preview of the label that the current draft would produce. */
@Component({
  selector: 'app-label-preview',
  template: `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <span class="odv-kicker">Canlı etiket önizlemesi</span>
        <span class="odv-badge-violet">{{ draft().locale || 'tr-TR' }}</span>
      </div>

      <article
        class="rounded-2xl border border-slate-300 bg-white p-5 text-slate-900 shadow-[0_12px_32px_rgba(15,23,42,.1)] [font-family:ui-sans-serif,system-ui,sans-serif]"
        aria-label="Etiket önizlemesi"
      >
        <header class="border-b-2 border-slate-900 pb-3">
          @if (draft().brand) {
            <div class="text-[10px] font-bold uppercase tracking-[.18em] text-slate-500">
              {{ draft().brand }}
            </div>
          }
          <h3 class="m-0 text-lg font-black leading-tight">
            {{ draft().name || 'Ürün adı' }}
          </h3>
          <div class="mt-1 flex items-center justify-between text-xs text-slate-600">
            <span>{{ draft().sku || 'SKU —' }}</span>
            <strong class="text-base text-slate-900">{{ draft().netQuantity || '— g' }}</strong>
          </div>
        </header>

        @if (showContent()) {
          <section class="mt-3 text-[11px] leading-[1.55]">
            <strong>İçindekiler: </strong>
            @if (segments().length) {
              @for (segment of segments(); track $index) {
                @if (segment.allergen) {
                  <strong class="font-black uppercase">{{ segment.text }}</strong>
                } @else {
                  <span>{{ segment.text }}</span>
                }
              }
            } @else {
              <span class="text-slate-400">Bileşenler azalan ağırlık sırasıyla burada görünür.</span>
            }
          </section>
          @if (allergens().length) {
            <p class="mb-0 mt-2 text-[11px]">
              <strong>Alerjen uyarısı:</strong> {{ allergens().join(', ') }} içerir.
            </p>
          }
        }

        @if (showNutrition()) {
          <table class="mt-3 w-full border-collapse text-[11px]">
            <caption class="border-y-2 border-slate-900 py-1 text-start text-xs font-black">
              Besin değerleri <span class="font-semibold">(100 g / ml)</span>
            </caption>
            <tbody>
              @for (row of nutrition(); track row.label) {
                <tr class="border-b border-slate-300">
                  <th scope="row" class="py-1 text-start font-semibold" [class.ps-3]="row.sub">
                    {{ row.label }}
                  </th>
                  <td class="py-1 text-end font-bold">{{ row.value }}</td>
                </tr>
              }
            </tbody>
          </table>
        }

        @if (claims().length) {
          <div class="mt-3 flex flex-wrap gap-1.5">
            @for (claim of claims(); track claim) {
              <span class="rounded-full border border-slate-900 px-2 py-0.5 text-[10px] font-bold">{{
                claim
              }}</span>
            }
          </div>
        }

        <footer class="mt-3 border-t border-slate-300 pt-2 text-[10px] text-slate-500">
          Üretim yeri: {{ draft().location || '—' }}
          @if (draft().market) {
            · Pazar: {{ draft().market }}
          }
        </footer>
      </article>

      @if (missingAllergens().length) {
        <div
          class="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200"
          role="status"
        >
          <span class="material-symbols-rounded !text-lg">warning</span>
          <span
            >Bileşenlerde geçiyor ama beyan edilmemiş:
            <strong>{{ missingAllergens().join(', ') }}</strong></span
          >
        </div>
      }

      <section class="odv-card p-4">
        <div class="mb-3 flex items-center justify-between">
          <span class="odv-kicker">Zorunlu alan kontrolü</span>
          <span [class]="progress() === 100 ? 'odv-badge-success' : 'odv-badge-warning'"
            >%{{ progress() }}</span
          >
        </div>
        <div class="mb-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            class="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-500 transition-all"
            [style.width.%]="progress()"
          ></div>
        </div>
        <ul class="m-0 list-none space-y-1.5 p-0">
          @for (item of checklist(); track item.label) {
            <li class="flex items-start gap-2 text-xs">
              <span
                class="material-symbols-rounded !text-base"
                [class.text-emerald-500]="item.done"
                [class.text-slate-300]="!item.done"
                aria-hidden="true"
                >{{ item.done ? 'check_circle' : 'radio_button_unchecked' }}</span
              >
              <span [class.text-slate-500]="!item.done">{{ item.label }}</span>
              <span class="sr-only">{{ item.done ? 'tamam' : 'eksik' }}</span>
            </li>
          }
        </ul>
      </section>
    </div>
  `,
})
export class LabelPreview {
  readonly draft = input.required<RecordDraft>();

  readonly showContent = computed(() => KIND_META[this.draft().kind].sections.includes('content'));
  readonly showNutrition = computed(() =>
    KIND_META[this.draft().kind].sections.includes('nutrition'),
  );
  readonly allergens = computed(() => splitList(this.draft().allergensText));
  readonly claims = computed(() => splitList(this.draft().claimsText));
  readonly missingAllergens = computed(() =>
    undeclaredAllergens(this.draft()).map((item) => item.label),
  );
  readonly checklist = computed(() => labelChecklist(this.draft()));
  readonly progress = computed(() => {
    const items = this.checklist();
    return Math.round((items.filter((item) => item.done).length / items.length) * 100);
  });

  readonly nutrition = computed(() => {
    const d = this.draft();
    const fmt = (value: number | null, unit: string) =>
      value === null ? '—' : `${value.toLocaleString('tr-TR')} ${unit}`;
    const kj = d.energyKcal === null ? null : Math.round(d.energyKcal * 4.184);
    return [
      {
        label: 'Enerji',
        value: d.energyKcal === null ? '—' : `${kj} kJ / ${d.energyKcal} kcal`,
        sub: false,
      },
      { label: 'Yağ', value: fmt(d.fatG, 'g'), sub: false },
      { label: 'Karbonhidrat', value: fmt(d.carbohydratesG, 'g'), sub: false },
      { label: 'Protein', value: fmt(d.proteinG, 'g'), sub: false },
      { label: 'Tuz', value: fmt(d.saltG, 'g'), sub: false },
    ];
  });

  /** Splits the ingredient text so allergen words can be emphasised without innerHTML. */
  readonly segments = computed<Segment[]>(() => {
    const text = this.draft().ingredients;
    if (!text.trim()) return [];
    const terms = [
      ...REGULATED_ALLERGENS.flatMap((item) => item.terms),
      ...this.allergens().map((item) => item.toLocaleLowerCase('tr-TR')),
    ]
      .filter((term) => term.length > 1)
      .sort((a, b) => b.length - a.length)
      .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const pattern = new RegExp(`(${terms.join('|')})`, 'giu');
    return text
      .split(pattern)
      .filter(Boolean)
      .map((part) => ({
        text: part,
        allergen: terms.length > 0 && new RegExp(`^(${terms.join('|')})$`, 'iu').test(part),
      }));
  });
}
