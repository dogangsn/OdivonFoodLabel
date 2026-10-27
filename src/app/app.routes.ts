import { Routes } from '@angular/router';
import {
  authGuard,
  billingGuard,
  onboardingGuard,
  pendingVerificationGuard,
} from './core/auth/auth.guard';
import { PRODUCT_NAVIGATION } from './domain/domain-navigation';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/auth-page').then((m) => m.AuthPage),
    data: { mode: 'login' },
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/auth-page').then((m) => m.AuthPage),
    data: { mode: 'register' },
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/auth/forgot-password-page').then((m) => m.ForgotPasswordPage),
  },
  {
    path: 'verify-email',
    canActivate: [pendingVerificationGuard],
    loadComponent: () => import('./features/auth/verify-email-page').then((m) => m.VerifyEmailPage),
  },
  {
    path: 'legal/terms',
    loadComponent: () => import('./features/legal/legal-page').then((m) => m.LegalPage),
    data: { document: 'terms' },
  },
  {
    path: 'legal/privacy',
    loadComponent: () => import('./features/legal/legal-page').then((m) => m.LegalPage),
    data: { document: 'privacy' },
  },
  {
    path: 'onboarding',
    canActivate: [onboardingGuard],
    loadComponent: () =>
      import('./features/onboarding/onboarding-page').then((m) => m.OnboardingPage),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/app-shell').then((m) => m.AppShell),
    children: [
      {
        path: 'overview',
        loadComponent: () =>
          import('./features/workspace/food-label-page').then((m) => m.FoodLabelPage),
        data: { view: 'overview' },
      },
      ...PRODUCT_NAVIGATION.map((item) => ({
        path: item.path,
        loadComponent: () =>
          import('./features/workspace/food-label-page').then((m) => m.FoodLabelPage),
        data: { view: 'domain', section: item.key },
      })),
      {
        path: 'activity',
        loadComponent: () =>
          import('./features/activity/activity-page').then((m) => m.ActivityPage),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings-page').then((m) => m.SettingsPage),
      },
      {
        path: 'billing',
        canActivate: [billingGuard],
        loadComponent: () => import('./features/billing/billing-page').then((m) => m.BillingPage),
      },
      {
        path: 'subscription-result',
        canActivate: [billingGuard],
        loadComponent: () =>
          import('./features/billing/subscription-result-page').then(
            (m) => m.SubscriptionResultPage,
          ),
      },
      {
        path: 'subscription-required',
        loadComponent: () =>
          import('./features/billing/subscription-required-page').then(
            (m) => m.SubscriptionRequiredPage,
          ),
      },
      { path: '', pathMatch: 'full', redirectTo: 'overview' },
    ],
  },
  { path: '**', redirectTo: '' },
];
