import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import Swal from 'sweetalert2';
import { SlideOver } from './slide-over';

@Component({
  imports: [SlideOver],
  template: `<button id="opener" (click)="open.set(true)">Aç</button
    ><app-slide-over [open]="open()" [dirty]="dirty()" title="Test" (closed)="open.set(false)"
      ><input /><button type="button">Son</button></app-slide-over
    >`,
})
class Host {
  readonly open = signal(false);
  readonly dirty = signal(false);
}

describe('SlideOver', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
  });
  it('restores focus to its opener', async () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const opener = fixture.nativeElement.querySelector('#opener') as HTMLButtonElement;
    opener.focus();
    opener.click();
    fixture.detectChanges();
    await fixture.whenStable();
    (fixture.nativeElement.querySelector('[aria-label="Kapat"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.activeElement).toBe(opener);
  });
  it('keeps a dirty drawer open when exit is cancelled', async () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.open.set(true);
    fixture.componentInstance.dirty.set(true);
    fixture.detectChanges();
    vi.spyOn(Swal, 'fire').mockResolvedValue({ isConfirmed: false } as never);
    (fixture.nativeElement.querySelector('[aria-label="Kapat"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(fixture.componentInstance.open()).toBe(true);
  });
});

