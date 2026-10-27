import { TestBed } from '@angular/core/testing';
import { I18nStore } from './i18n';
describe('I18nStore', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('dir');
    document.documentElement.classList.remove('rtl');
    TestBed.configureTestingModule({});
  });
  it('exposes eight languages and localized navigation', () => {
    const store = TestBed.inject(I18nStore);
    expect(store.options).toHaveLength(8);
    for (const language of store.options) {
      store.setLanguage(language.code);
      expect(store.t('nav.overview')).not.toBe('nav.overview');
      expect(store.t('nav.products')).not.toBe('nav.products');
    }
    store.setLanguage('ar');
    expect(store.t('nav.products')).toBe('المنتجات');
  });
  it('applies and removes Arabic RTL document state', () => {
    const store = TestBed.inject(I18nStore);
    store.setLanguage('ar');
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.classList.contains('rtl')).toBe(true);
    store.setLanguage('tr');
    expect(document.documentElement.dir).toBe('ltr');
    expect(document.documentElement.classList.contains('rtl')).toBe(false);
  });
});
