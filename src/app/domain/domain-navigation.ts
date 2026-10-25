import { PRODUCT } from './product-manifest';

export interface DomainNavigationItem {
  readonly key: string;
  readonly path: string;
  readonly icon: string;
  readonly label: string;
  readonly title: string;
  readonly description: string;
}

const NAVIGATION: Record<string, readonly DomainNavigationItem[]> = {
  fgas: [
    {
      key: 'equipment',
      path: 'equipment',
      icon: 'precision_manufacturing',
      label: 'Ekipman Envanteri',
      title: 'Ekipman Envanteri',
      description:
        'Soğutma ve iklimlendirme ekipmanlarını, gaz türlerini ve kapasite bilgilerini yönetin.',
    },
    {
      key: 'leak-checks',
      path: 'leak-checks',
      icon: 'troubleshoot',
      label: 'Sızıntı Kontrolleri',
      title: 'Sızıntı Kontrolleri',
      description: 'Yasal kontrol periyotlarını, sonuçları ve saha kanıtlarını takip edin.',
    },
    {
      key: 'gas-movements',
      path: 'gas-movements',
      icon: 'swap_horiz',
      label: 'Gaz Hareketleri',
      title: 'Gaz Hareket Defteri',
      description: 'Dolum, geri kazanım, bertaraf ve stok hareketlerini kayıt altında tutun.',
    },
    {
      key: 'technicians',
      path: 'technicians',
      icon: 'engineering',
      label: 'Teknisyenler',
      title: 'Teknisyen Yönetimi',
      description: 'Yetkinlik, sertifika ve görev atamalarını tek merkezden yönetin.',
    },
    {
      key: 'inspections',
      path: 'inspections',
      icon: 'verified',
      label: 'Denetim ve Raporlar',
      title: 'Denetim ve Raporlar',
      description: 'Denetime hazır kayıt paketleri ve uyum raporları oluşturun.',
    },
  ],
  'fire-safe': [
    {
      key: 'equipment',
      path: 'equipment',
      icon: 'fire_extinguisher',
      label: 'Yangın Ekipmanları',
      title: 'Yangın Ekipmanları',
      description: 'Söndürücü, sprinkler, alarm ve pompa sistemlerinin envanterini yönetin.',
    },
    {
      key: 'periodic-checks',
      path: 'periodic-checks',
      icon: 'fact_check',
      label: 'Periyodik Kontroller',
      title: 'Periyodik Kontroller',
      description: 'Kontrol takvimlerini, bakım görevlerini ve saha kanıtlarını takip edin.',
    },
    {
      key: 'nonconformities',
      path: 'nonconformities',
      icon: 'warning',
      label: 'Uygunsuzluklar',
      title: 'Uygunsuzluk Yönetimi',
      description: 'Riskleri, düzeltici faaliyetleri ve kapanış sürelerini yönetin.',
    },
    {
      key: 'emergency-plans',
      path: 'emergency-plans',
      icon: 'emergency',
      label: 'Acil Durum Planları',
      title: 'Acil Durum Planları',
      description: 'Tahliye planları, tatbikatlar ve görevli ekip kayıtlarını yönetin.',
    },
    {
      key: 'reports',
      path: 'reports',
      icon: 'analytics',
      label: 'Denetim ve Raporlar',
      title: 'Denetim ve Raporlar',
      description: 'Lokasyon bazlı uygunluk raporları ve denetim paketleri hazırlayın.',
    },
  ],
  'food-label': [
    {
      key: 'products',
      path: 'products',
      icon: 'inventory_2',
      label: 'Ürünler',
      title: 'Ürün Portföyü',
      description: 'Ürün kartlarını, pazarları ve etiket sürümlerini yönetin.',
    },
    {
      key: 'recipes',
      path: 'recipes',
      icon: 'menu_book',
      label: 'Reçeteler',
      title: 'Reçete Yönetimi',
      description: 'Bileşenleri, oranları ve hammadde kaynaklarını kayıt altında tutun.',
    },
    {
      key: 'allergens',
      path: 'allergens',
      icon: 'warning',
      label: 'Alerjen Kontrolü',
      title: 'Alerjen Kontrolü',
      description: 'Alerjen çapraz kontrollerini ve zorunlu vurguları doğrulayın.',
    },
    {
      key: 'nutrition',
      path: 'nutrition',
      icon: 'monitoring',
      label: 'Besin Değerleri',
      title: 'Besin Değeri Beyanı',
      description: 'Enerji ve besin değerlerini reçeteden hesaplayıp karşılaştırın.',
    },
    {
      key: 'approvals',
      path: 'approvals',
      icon: 'verified_user',
      label: 'Etiket Onayları',
      title: 'Etiket Onayları',
      description: 'Pazar bazlı zorunlu beyanları ve onay akışlarını yönetin.',
    },
  ],
};

export const PRODUCT_NAVIGATION = NAVIGATION[PRODUCT.key] ?? [];
