import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthStore } from '../core/auth/auth-store';
import { I18nStore, SupportedLang, TranslatePipe } from '../core/i18n/i18n';
import { PRODUCT_NAVIGATION } from '../domain/domain-navigation';
import { PRODUCT } from '../domain/product-manifest';
import { initials } from '../features/workspace/food-label.model';

interface MenuItem {
  readonly path: string;
  readonly icon: string;
  readonly label: string;
}
interface MenuGroup {
  readonly label: string;
  readonly items: readonly MenuItem[];
}

const THEME_KEY = 'odivon:theme';

@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, TranslatePipe],
  template: `
    <div class="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0b1120] dark:text-slate-100">
      <a
        href="#main"
        class="odv-btn-primary sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[80]"
        >İçeriğe geç</a
      >
      @if (mobileOpen()) {
        <button
          type="button"
          class="odv-fade-in fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-[2px] lg:hidden"
          aria-label="Menüyü kapat"
          (click)="mobileOpen.set(false)"
        ></button>
      }
      <aside
        class="fixed inset-y-0 start-0 z-40 flex w-72 flex-col border-e border-slate-200/80 bg-white transition-transform duration-200 dark:border-slate-800 dark:bg-slate-900 lg:translate-x-0"
        [class.-translate-x-full]="!mobileOpen() && !rtl()"
        [class.translate-x-full]="!mobileOpen() && rtl()"
        aria-label="Kenar menüsü"
      >
        <div class="flex h-16 items-center justify-between px-5">
          <a routerLink="/overview" class="flex items-center gap-3" (click)="mobileOpen.set(false)">
            <span
              class="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-md shadow-violet-500/25"
            >
              <span class="material-symbols-rounded !text-[20px]">nutrition</span>
            </span>
            <span class="leading-tight">
              <strong class="block text-[15px] font-extrabold tracking-tight">Odivon</strong>
              <span class="block text-[11px] font-semibold text-slate-500">FoodLabel</span>
            </span>
          </a>
          <button
            type="button"
            class="odv-icon-btn lg:hidden"
            (click)="mobileOpen.set(false)"
            aria-label="Menüyü kapat"
          >
            <span class="material-symbols-rounded">close</span>
          </button>
        </div>

        <nav aria-label="Ana menü" class="custom-scroll flex-1 overflow-y-auto px-3 pb-4">
          @for (group of menu; track group.label) {
            <div class="mt-4 first:mt-2">
              <div class="odv-kicker px-3 pb-2 !text-[10px]">{{ group.label | t }}</div>
              <ul class="m-0 list-none space-y-0.5 p-0">
                @for (item of group.items; track item.path) {
                  <li>
                    <a
                      [routerLink]="item.path"
                      routerLinkActive="!bg-violet-50 !text-violet-700 dark:!bg-violet-500/10 dark:!text-violet-200 [&>.nav-icon]:!text-violet-600 dark:[&>.nav-icon]:!text-violet-300"
                      #rla="routerLinkActive"
                      [attr.aria-current]="rla.isActive ? 'page' : null"
                      class="group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-white"
                      (click)="mobileOpen.set(false)"
                    >
                      @if (rla.isActive) {
                        <span
                          class="absolute inset-y-2 start-0 w-1 rounded-e-full bg-violet-500"
                          aria-hidden="true"
                        ></span>
                      }
                      <span class="nav-icon material-symbols-rounded text-slate-400 transition group-hover:text-slate-600 dark:group-hover:text-slate-200">{{
                        item.icon
                      }}</span>
                      {{ item.label | t }}
                    </a>
                  </li>
                }
              </ul>
            </div>
          }
        </nav>

        <div class="border-t border-slate-100 p-3 dark:border-slate-800">
          <div class="flex items-center gap-3 rounded-xl p-2">
            <span
              class="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 text-xs font-black text-violet-700 dark:from-violet-500/20 dark:to-indigo-500/20 dark:text-violet-200"
              aria-hidden="true"
              >{{ userInitials() }}</span
            >
            <div class="min-w-0 flex-1">
              <strong class="block truncate text-xs">{{ auth.session()?.name }}</strong>
              <span class="block truncate text-[11px] text-slate-500">{{
                auth.session()?.tenantName || auth.session()?.email
              }}</span>
            </div>
            <button
              type="button"
              class="odv-icon-btn shrink-0"
              (click)="logout()"
              aria-label="Güvenli çıkış"
              title="Güvenli çıkış"
            >
              <span class="material-symbols-rounded directional-icon">logout</span>
            </button>
          </div>
        </div>
      </aside>

      <div class="lg:ms-72">
        <header
          class="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur-xl dark:border-slate-800 dark:bg-[#0b1120]/80 sm:px-6 lg:px-8"
        >
          <div class="flex min-w-0 items-center gap-3">
            <button
              class="odv-icon-btn lg:hidden"
              type="button"
              (click)="mobileOpen.set(true)"
              aria-label="Menüyü aç"
            >
              <span class="material-symbols-rounded">menu</span>
            </button>
            <nav aria-label="Konum" class="flex min-w-0 items-center gap-1.5 text-sm">
              <span class="hidden font-semibold text-slate-400 sm:inline">{{ product.name }}</span>
              <span class="material-symbols-rounded directional-icon hidden !text-base text-slate-300 sm:inline">chevron_right</span>
              <strong class="truncate font-bold">{{ currentLabel() | t }}</strong>
            </nav>
          </div>
          <div class="flex items-center gap-1.5">
            <label class="sr-only" for="language">Dil</label>
            <select
              id="language"
              class="odv-input !w-auto !rounded-lg !py-1.5 !text-xs"
              [value]="i18n.currentLang()"
              (change)="setLanguage($any($event.target).value)"
            >
              @for (language of i18n.options; track language.code) {
                <option [value]="language.code">{{ language.flag }} {{ language.nativeName }}</option>
              }
            </select>
            <button
              type="button"
              class="odv-icon-btn"
              (click)="toggleTheme()"
              [attr.aria-label]="dark() ? 'Açık temaya geç' : 'Koyu temaya geç'"
              [attr.aria-pressed]="dark()"
            >
              <span class="material-symbols-rounded">{{ dark() ? 'light_mode' : 'dark_mode' }}</span>
            </button>
          </div>
        </header>
        <main id="main" class="mx-auto max-w-[1440px] p-4 sm:p-6 lg:p-8"><router-outlet /></main>
      </div>
    </div>
  `,
})
export class AppShell {
  readonly product = PRODUCT;
  readonly auth = inject(AuthStore);
  readonly i18n = inject(I18nStore);
  private readonly router = inject(Router);
  readonly mobileOpen = signal(false);
  readonly dark = signal(this.initialTheme());
  readonly rtl = computed(() => this.i18n.options.find((l) => l.code === this.i18n.currentLang())?.dir === 'rtl');
  readonly userInitials = computed(() => initials(this.auth.session()?.name));

  readonly menu: readonly MenuGroup[] = [
    {
      label: 'nav.groupWorkspace',
      items: [
        { path: '/overview', icon: 'space_dashboard', label: 'nav.overview' },
        ...this.domainItems(['products', 'recipes']),
      ],
    },
    {
      label: 'nav.groupCompliance',
      items: [
        ...this.domainItems(['allergens', 'nutrition', 'approvals']),
        { path: '/activity', icon: 'history', label: 'nav.audit' },
      ],
    },
    {
      label: 'nav.groupAccount',
      items: [
        { path: '/settings', icon: 'settings', label: 'nav.settings' },
        ...(this.canManageBilling()
          ? [{ path: '/billing', icon: 'credit_card', label: 'nav.billing' }]
          : []),
      ],
    },
  ];
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );
  readonly currentLabel = computed(() => {
    const path = this.url().split(/[?#]/)[0];
    const item = this.menu.flatMap((group) => group.items).find((entry) => entry.path === path);
    return item?.label ?? 'nav.overview';
  });

  constructor() {
    document.documentElement.classList.toggle('dark', this.dark());
    this.i18n.setLanguage(this.i18n.currentLang());
  }
  setLanguage(value: string): void {
    this.i18n.setLanguage(value as SupportedLang);
  }
  toggleTheme(): void {
    this.dark.update((v) => !v);
    document.documentElement.classList.toggle('dark', this.dark());
    try {
      localStorage.setItem(THEME_KEY, this.dark() ? 'dark' : 'light');
    } catch {
      /* storage unavailable: keep the in-memory choice */
    }
  }
  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
  private domainItems(keys: readonly string[]): MenuItem[] {
    return PRODUCT_NAVIGATION.filter((item) => keys.includes(item.key)).map((item) => ({
      path: `/${item.path}`,
      icon: item.icon,
      label: `nav.${item.key}`,
    }));
  }
  private canManageBilling(): boolean {
    const role = this.auth.session()?.role;
    return role === 'owner' || role === 'admin';
  }
  private initialTheme(): boolean {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved) return saved === 'dark';
    } catch {
      /* ignore */
    }
    return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches;
  }
}
