import { TestBed } from '@angular/core/testing';
import axe from 'axe-core';
import { RecordDraft } from './food-label.api';
import { dueState, initials, labelChecklist, undeclaredAllergens } from './food-label.model';
import { LabelPreview } from './label-preview';

const draft = (patch: Partial<RecordDraft> = {}): RecordDraft => ({
  kind: 'product',
  name: 'Fındıklı Granola',
  location: 'İstanbul tesisi',
  market: 'TR',
  sku: 'GRN-001',
  brand: 'Odivon Foods',
  locale: 'tr-TR',
  netQuantity: '500 g',
  ingredients: 'Yulaf ezmesi, fındık, bal, süt tozu',
  allergensText: 'Gluten, fındık',
  claimsText: 'Yüksek lif',
  energyKcal: 410,
  proteinG: 12,
  carbohydratesG: 63,
  fatG: 11,
  saltG: 0.2,
  responsibleName: '',
  reviewDueAt: '',
  approvedAt: '',
  notes: '',
  documentRefsText: '',
  status: 'draft',
  ...patch,
});

describe('food label model', () => {
  it('finds allergens mentioned in ingredients but not declared', () => {
    expect(undeclaredAllergens(draft()).map((item) => item.key)).toEqual(['milk']);
    expect(undeclaredAllergens(draft({ allergensText: 'Gluten, fındık, süt' }))).toEqual([]);
  });

  it('classifies review dates', () => {
    const now = Date.parse('2026-11-06T00:00:00Z');
    expect(dueState('2026-11-01T00:00:00Z', now)).toBe('overdue');
    expect(dueState('2026-11-20T00:00:00Z', now)).toBe('soon');
    expect(dueState('2027-03-01T00:00:00Z', now)).toBe('later');
    expect(dueState(null, now)).toBe('none');
  });

  it('asks for approval evidence only when approving', () => {
    const labels = (d: RecordDraft) => labelChecklist(d).map((item) => item.label);
    expect(labels(draft())).not.toContain('Mevzuat sorumlusu');
    expect(labels(draft({ status: 'approved' }))).toContain('Mevzuat sorumlusu');
    expect(labels(draft({ kind: 'approval' }))).not.toContain('Bileşen listesi');
  });

  it('builds initials from a display name', () => {
    expect(initials('Doğan Yılmaz Kaya')).toBe('DK');
    expect(initials('')).toBe('?');
  });
});

describe('LabelPreview', () => {
  it('emphasises allergens and stays accessible', async () => {
    const fixture = TestBed.createComponent(LabelPreview);
    fixture.componentRef.setInput('draft', draft());
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const bold = [...root.querySelectorAll('section strong.font-black')].map((el) =>
      el.textContent?.trim().toLocaleLowerCase('tr-TR'),
    );
    expect(bold).toEqual(expect.arrayContaining(['yulaf', 'fındık', 'süt']));
    expect(root.textContent).toContain('1715 kJ / 410 kcal');
    const result = await axe.run(root, { resultTypes: ['violations'], rules: { 'color-contrast': { enabled: false } } });
    expect(result.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')).toEqual([]);
  });
});
