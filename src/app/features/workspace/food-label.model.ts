import { FoodLabelKind, FoodLabelRecord, FoodLabelStatus, RecordDraft } from './food-label.api';

export interface KindMeta {
  readonly label: string;
  readonly icon: string;
  readonly tone: string;
  /** Form sections that make sense for this record kind. */
  readonly sections: readonly DraftSection[];
}
export type DraftSection = 'identity' | 'content' | 'nutrition' | 'review';

export const KIND_META: Record<FoodLabelKind, KindMeta> = {
  product: {
    label: 'Ürün kartı',
    icon: 'inventory_2',
    tone: 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
    sections: ['identity', 'content', 'nutrition', 'review'],
  },
  recipe: {
    label: 'Reçete',
    icon: 'menu_book',
    tone: 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
    sections: ['identity', 'content', 'nutrition', 'review'],
  },
  'allergen-review': {
    label: 'Alerjen incelemesi',
    icon: 'warning',
    tone: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    sections: ['identity', 'content', 'review'],
  },
  nutrition: {
    label: 'Besin bildirimi',
    icon: 'monitoring',
    tone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    sections: ['identity', 'nutrition', 'review'],
  },
  approval: {
    label: 'Pazar onayı',
    icon: 'verified_user',
    tone: 'bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-300',
    sections: ['identity', 'review'],
  },
};

export const KIND_OPTIONS = Object.entries(KIND_META).map(([value, meta]) => ({
  value: value as FoodLabelKind,
  ...meta,
}));

export const STATUS_META: Record<FoodLabelStatus, { label: string; badge: string; icon: string }> =
  {
    draft: { label: 'Taslak', badge: 'odv-badge-neutral', icon: 'edit_note' },
    'in-review': { label: 'İncelemede', badge: 'odv-badge-info', icon: 'pending' },
    'action-required': { label: 'Aksiyon gerekli', badge: 'odv-badge-warning', icon: 'error' },
    approved: { label: 'Onaylandı', badge: 'odv-badge-success', icon: 'check_circle' },
    rejected: { label: 'Reddedildi', badge: 'odv-badge-danger', icon: 'cancel' },
  };

export const STATUS_OPTIONS = Object.entries(STATUS_META).map(([value, meta]) => ({
  value: value as FoodLabelStatus,
  ...meta,
}));

/** The 14 allergens listed in TGK Etiketleme Yönetmeliği Ek-1 / EU 1169/2011 Annex II. */
export const REGULATED_ALLERGENS = [
  { key: 'gluten', label: 'Gluten', terms: ['gluten', 'buğday', 'arpa', 'çavdar', 'yulaf', 'kavılca', 'kamut', 'irmik', 'bulgur', 'buğday unu'] },
  { key: 'crustaceans', label: 'Kabuklular', terms: ['karides', 'yengeç', 'ıstakoz', 'kabuklu'] },
  { key: 'egg', label: 'Yumurta', terms: ['yumurta'] },
  { key: 'fish', label: 'Balık', terms: ['balık', 'somon', 'hamsi'] },
  { key: 'peanut', label: 'Yer fıstığı', terms: ['yer fıstığı', 'yerfıstığı'] },
  { key: 'soy', label: 'Soya', terms: ['soya'] },
  { key: 'milk', label: 'Süt', terms: ['süt', 'laktoz', 'peynir', 'tereyağ', 'krema', 'yoğurt', 'peyniraltı'] },
  { key: 'nuts', label: 'Sert kabuklu meyveler', terms: ['fındık', 'badem', 'ceviz', 'kaju', 'antep fıstığı', 'pekan', 'makadamya'] },
  { key: 'celery', label: 'Kereviz', terms: ['kereviz'] },
  { key: 'mustard', label: 'Hardal', terms: ['hardal'] },
  { key: 'sesame', label: 'Susam', terms: ['susam', 'tahin'] },
  { key: 'sulphites', label: 'Sülfitler', terms: ['sülfit', 'kükürt dioksit', 'e220', 'e221', 'e223', 'e224'] },
  { key: 'lupin', label: 'Acı bakla', terms: ['acı bakla', 'lupin'] },
  { key: 'molluscs', label: 'Yumuşakçalar', terms: ['midye', 'kalamar', 'ahtapot', 'istiridye'] },
] as const;

export type DueState = 'overdue' | 'soon' | 'later' | 'none';
const DAY = 86_400_000;

export function dueState(value: string | null, now = Date.now()): DueState {
  if (!value) return 'none';
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return 'none';
  if (time < now) return 'overdue';
  if (time - now <= 30 * DAY) return 'soon';
  return 'later';
}

export function daysUntil(value: string | null, now = Date.now()): number | null {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : Math.round((time - now) / DAY);
}

export function splitList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

/** Allergens that the ingredient text mentions but the declared list leaves out. */
export function undeclaredAllergens(draft: Pick<RecordDraft, 'ingredients' | 'allergensText'>) {
  const text = draft.ingredients.toLocaleLowerCase('tr-TR');
  const declared = splitList(draft.allergensText).map((item) => item.toLocaleLowerCase('tr-TR'));
  return REGULATED_ALLERGENS.filter(
    (allergen) =>
      allergen.terms.some((term) => text.includes(term)) &&
      !declared.some(
        (item) =>
          item === allergen.label.toLocaleLowerCase('tr-TR') ||
          allergen.terms.some((term) => item.includes(term)),
      ),
  );
}

export interface ChecklistItem {
  readonly label: string;
  readonly done: boolean;
}

/** Mandatory label elements we can check with the current record fields. */
export function labelChecklist(draft: RecordDraft): ChecklistItem[] {
  const sections = KIND_META[draft.kind].sections;
  const items: ChecklistItem[] = [
    { label: 'Ürün adı', done: draft.name.trim().length >= 2 },
    { label: 'Üretim yeri', done: draft.location.trim().length >= 2 },
  ];
  if (sections.includes('content')) {
    items.push(
      { label: 'Bileşen listesi', done: draft.ingredients.trim().length > 0 },
      { label: 'Alerjen beyanı', done: undeclaredAllergens(draft).length === 0 },
      { label: 'Net miktar', done: draft.netQuantity.trim().length > 0 },
    );
  }
  if (sections.includes('nutrition')) {
    items.push({
      label: 'Besin tablosu (enerji, yağ, karbonhidrat, protein, tuz)',
      done: [draft.energyKcal, draft.fatG, draft.carbohydratesG, draft.proteinG, draft.saltG].every(
        (value) => value !== null,
      ),
    });
  }
  items.push({ label: 'Hedef pazar ve dil', done: !!draft.market.trim() && !!draft.locale.trim() });
  if (draft.kind === 'approval' || draft.status === 'approved') {
    items.push(
      { label: 'Mevzuat sorumlusu', done: draft.responsibleName.trim().length >= 2 },
      { label: 'Onay kanıtı (belge referansı)', done: splitList(draft.documentRefsText).length > 0 },
    );
  }
  return items;
}

export function initials(name: string | undefined | null): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toLocaleUpperCase(
    'tr-TR',
  );
}

export function recordSubtitle(row: FoodLabelRecord): string {
  return [row.sku, row.brand].filter(Boolean).join(' · ') || 'SKU tanımlanmamış';
}
