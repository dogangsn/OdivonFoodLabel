export interface DomainNavigationItem {
  readonly key: string;
  readonly path: string;
  readonly icon: string;
  readonly label: string;
  readonly title: string;
  readonly description: string;
}

export const PRODUCT_NAVIGATION: readonly DomainNavigationItem[] = [
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
];
