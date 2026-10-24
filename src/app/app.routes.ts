import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

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
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/app-shell').then((m) => m.AppShell),
    children: [
      {
        path: 'overview',
        loadComponent: () =>
          import('./features/workspace/workspace-page').then((m) => m.WorkspacePage),
        data: { view: 'overview' },
      },
      {
        path: 'modules',
        loadComponent: () =>
          import('./features/workspace/workspace-page').then((m) => m.WorkspacePage),
        data: { view: 'modules' },
      },
      {
        path: 'activity',
        loadComponent: () =>
          import('./features/workspace/workspace-page').then((m) => m.WorkspacePage),
        data: { view: 'activity' },
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/workspace/workspace-page').then((m) => m.WorkspacePage),
        data: { view: 'settings' },
      },
      { path: '', pathMatch: 'full', redirectTo: 'overview' },
    ],
  },
  { path: '**', redirectTo: '' },
];
