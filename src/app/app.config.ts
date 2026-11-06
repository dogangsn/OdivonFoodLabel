import { registerLocaleData } from '@angular/common';
import localeTr from '@angular/common/locales/tr';
import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideOdivonApi } from './core/api/api';

registerLocaleData(localeTr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideOdivonApi(),
    // Dates and numbers render in Turkish (e.g. "6 Kasım 2026").
    { provide: LOCALE_ID, useValue: 'tr' },
  ],
};
