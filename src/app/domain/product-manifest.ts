export interface ProductManifest {
  readonly key: string;
  readonly name: string;
  readonly categoryKey: string;
  readonly taglineKey: string;
  readonly promiseKey: string;
  readonly apiNamespace: string;
  readonly accent: string;
}
export const PRODUCT: ProductManifest = {
  key: 'food-label',
  name: 'OdivonFoodLabel',
  categoryKey: 'product.category',
  taglineKey: 'product.tagline',
  promiseKey: 'product.promise',
  apiNamespace: '/api/v1/food-label',
  accent: '#7c3aed',
};
