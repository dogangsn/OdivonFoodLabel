import { Injectable, Pipe, PipeTransform, computed, inject, signal } from '@angular/core';
export type SupportedLang = 'tr' | 'en' | 'de' | 'fr' | 'es' | 'it' | 'nl' | 'ar';
export interface LanguageOption {
  readonly code: SupportedLang;
  readonly nativeName: string;
  readonly flag: string;
  readonly dir: 'ltr' | 'rtl';
}
export const LANGUAGES: readonly LanguageOption[] = [
  { code: 'tr', nativeName: 'Türkçe', flag: '🇹🇷', dir: 'ltr' },
  { code: 'en', nativeName: 'English', flag: '🇬🇧', dir: 'ltr' },
  { code: 'de', nativeName: 'Deutsch', flag: '🇩🇪', dir: 'ltr' },
  { code: 'fr', nativeName: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { code: 'es', nativeName: 'Español', flag: '🇪🇸', dir: 'ltr' },
  { code: 'it', nativeName: 'Italiano', flag: '🇮🇹', dir: 'ltr' },
  { code: 'nl', nativeName: 'Nederlands', flag: '🇳🇱', dir: 'ltr' },
  { code: 'ar', nativeName: 'العربية', flag: '🇦🇪', dir: 'rtl' },
];
const TR: Record<string, string> = {
  'nav.overview': 'Genel Bakış',
  'nav.products': 'Ürünler',
  'nav.recipes': 'Reçeteler',
  'nav.allergens': 'Alerjen Kontrolü',
  'nav.nutrition': 'Besin Değerleri',
  'nav.approvals': 'Etiket Onayları',
  'nav.activity': 'Aktiviteler',
  'nav.billing': 'Abonelik',
  'nav.settings': 'Ayarlar',
  'common.search': 'Ad, kod veya açıklama ara…',
  'common.new': 'Yeni Kayıt',
  'common.active': 'Aktif',
  'common.archive': 'Arşiv',
  'common.save': 'Kaydet',
  'common.cancel': 'Vazgeç',
  'dashboard.live': 'Canlı Uyum Radarı',
  'dashboard.online': 'Çevrimiçi',
  'dashboard.health': 'Sistem Durumu',
  'dashboard.capacity': 'Tamamlanma',
  'dashboard.today': 'Bugünkü İşlem',
  'product.category': 'Gıda etiketi ve mevzuat uygunluğu',
  'product.tagline': 'Her etiket doğru, izlenebilir ve pazara hazır.',
  'product.promise':
    'İçerik, alerjen, besin değeri ve zorunlu beyan kontrollerini ürün yaşam döngüsü boyunca tek akışta yönetin.',
  'metric.total': 'Takip edilen varlık',
  'metric.totalNote': '32 lokasyonda',
  'metric.active': 'Uyum skoru',
  'metric.activeNote': 'Aktif ekipman filosu',
  'metric.pending': 'Yaklaşan kontrol',
  'metric.pendingNote': 'Önümüzdeki 30 gün',
  'metric.score': 'Açık işlem',
  'metric.scoreNote': 'Teknisyen bekliyor',
  'module.title': 'Ürün Modülleri',
  'module.subtitle': 'Kontrollü fazlarla gelişen operasyon çalışma alanı',
  'module.one': 'Ürün reçeteleri',
  'module.oneDesc': 'Cihaz, lokasyon, gaz türü ve kapasite kaydı',
  'module.two': 'Alerjen kontrolü',
  'module.twoDesc': 'Periyot, görev, sonuç ve kanıt takibi',
  'module.three': 'Besin beyanı',
  'module.threeDesc': 'Dolum, geri kazanım ve stok hareketleri',
  'module.four': 'Etiket onayı',
  'module.fourDesc': 'Müşteri ve ekipman bazlı dışa aktarım',
  'table.name': 'Kayıt',
  'table.status': 'Durum',
  'empty.title': 'Henüz kayıt yok',
  'empty.body': 'İlk kaydı oluşturarak iş akışını başlatın.',
  'update.title': 'Uygulama güncellemesi hazır',
  'update.body': 'Güvenli biçimde en güncel sürüme geçin.',
  'update.action': 'Şimdi Güncelle',
  'drawer.title': 'Yeni Kayıt Oluştur',
  'drawer.name': 'Kayıt adı',
};
const EN: Record<string, string> = {
  'nav.overview': 'Overview',
  'nav.products': 'Products',
  'nav.recipes': 'Recipes',
  'nav.allergens': 'Allergen Control',
  'nav.nutrition': 'Nutrition',
  'nav.approvals': 'Label Approvals',
  'nav.activity': 'Activity',
  'nav.billing': 'Subscription',
  'nav.settings': 'Settings',
  'common.search': 'Search by name, code or description…',
  'common.new': 'New Record',
  'common.active': 'Active',
  'common.archive': 'Archive',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'dashboard.live': 'Live Compliance Radar',
  'dashboard.online': 'Online',
  'dashboard.health': 'System Status',
  'dashboard.capacity': 'Completion',
  'dashboard.today': 'Today',
  'module.title': 'Product Modules',
  'module.subtitle': 'An operational workspace evolving in controlled phases',
  'table.name': 'Record',
  'table.status': 'Status',
  'empty.title': 'No records yet',
  'empty.body': 'Create the first record to begin.',
  'update.title': 'Application update ready',
  'update.body': 'Move safely to the latest version.',
  'update.action': 'Update Now',
  'drawer.title': 'Create New Record',
  'drawer.name': 'Record name',
};
const NAV_TRANSLATIONS: Record<Exclude<SupportedLang, 'tr' | 'en'>, Record<string, string>> = {
  de: {
    'nav.overview': 'Übersicht',
    'nav.products': 'Produkte',
    'nav.recipes': 'Rezepturen',
    'nav.allergens': 'Allergenkontrolle',
    'nav.nutrition': 'Nährwerte',
    'nav.approvals': 'Etikettenfreigaben',
    'nav.activity': 'Aktivitäten',
    'nav.billing': 'Abonnement',
    'nav.settings': 'Einstellungen',
  },
  fr: {
    'nav.overview': 'Vue d’ensemble',
    'nav.products': 'Produits',
    'nav.recipes': 'Recettes',
    'nav.allergens': 'Contrôle des allergènes',
    'nav.nutrition': 'Valeurs nutritionnelles',
    'nav.approvals': 'Approbations d’étiquettes',
    'nav.activity': 'Activité',
    'nav.billing': 'Abonnement',
    'nav.settings': 'Paramètres',
  },
  es: {
    'nav.overview': 'Resumen',
    'nav.products': 'Productos',
    'nav.recipes': 'Recetas',
    'nav.allergens': 'Control de alérgenos',
    'nav.nutrition': 'Nutrición',
    'nav.approvals': 'Aprobaciones de etiquetas',
    'nav.activity': 'Actividad',
    'nav.billing': 'Suscripción',
    'nav.settings': 'Configuración',
  },
  it: {
    'nav.overview': 'Panoramica',
    'nav.products': 'Prodotti',
    'nav.recipes': 'Ricette',
    'nav.allergens': 'Controllo allergeni',
    'nav.nutrition': 'Valori nutrizionali',
    'nav.approvals': 'Approvazioni etichette',
    'nav.activity': 'Attività',
    'nav.billing': 'Abbonamento',
    'nav.settings': 'Impostazioni',
  },
  nl: {
    'nav.overview': 'Overzicht',
    'nav.products': 'Producten',
    'nav.recipes': 'Recepturen',
    'nav.allergens': 'Allergenencontrole',
    'nav.nutrition': 'Voedingswaarden',
    'nav.approvals': 'Etiketgoedkeuringen',
    'nav.activity': 'Activiteit',
    'nav.billing': 'Abonnement',
    'nav.settings': 'Instellingen',
  },
  ar: {
    'nav.overview': 'نظرة عامة',
    'nav.products': 'المنتجات',
    'nav.recipes': 'الوصفات',
    'nav.allergens': 'مراقبة مسببات الحساسية',
    'nav.nutrition': 'القيم الغذائية',
    'nav.approvals': 'اعتمادات الملصقات',
    'nav.activity': 'النشاط',
    'nav.billing': 'الاشتراك',
    'nav.settings': 'الإعدادات',
  },
};
const DICTS: Record<SupportedLang, Record<string, string>> = {
  tr: TR,
  en: EN,
  de: NAV_TRANSLATIONS.de,
  fr: NAV_TRANSLATIONS.fr,
  es: NAV_TRANSLATIONS.es,
  it: NAV_TRANSLATIONS.it,
  nl: NAV_TRANSLATIONS.nl,
  ar: NAV_TRANSLATIONS.ar,
};
@Injectable({ providedIn: 'root' })
export class I18nStore {
  readonly currentLang = signal<SupportedLang>(this.initial());
  readonly options = LANGUAGES;
  readonly active = computed(
    () => LANGUAGES.find((x) => x.code === this.currentLang()) ?? LANGUAGES[0],
  );
  constructor() {
    queueMicrotask(() => this.applyDocumentState());
  }
  setLanguage(lang: SupportedLang): void {
    this.currentLang.set(lang);
    localStorage.setItem('odivon:preferred_lang', lang);
    this.applyDocumentState();
  }
  t(key: string): string {
    return DICTS[this.currentLang()][key] ?? TR[key] ?? key;
  }
  private initial(): SupportedLang {
    const value = localStorage.getItem('odivon:preferred_lang') as SupportedLang | null;
    return LANGUAGES.some((x) => x.code === value) ? value! : 'tr';
  }
  private applyDocumentState() {
    document.documentElement.lang = this.currentLang();
    document.documentElement.dir = this.active().dir;
    document.documentElement.classList.toggle('rtl', this.active().dir === 'rtl');
  }
}
@Pipe({ name: 't', pure: false })
export class TranslatePipe implements PipeTransform {
  private readonly i18n = inject(I18nStore);
  transform(key: string): string {
    this.i18n.currentLang();
    return this.i18n.t(key);
  }
}
