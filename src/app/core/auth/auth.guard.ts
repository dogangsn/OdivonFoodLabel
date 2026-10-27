import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from './auth-store';

export const authGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthStore);
  const router = inject(Router);
  const session = await auth.ensureSession();
  if (!session) return router.createUrlTree(['/login']);
  if (!session.emailVerified) return router.createUrlTree(['/verify-email']);
  if (!session.onboardingCompleted && state.url !== '/onboarding')
    return router.createUrlTree(['/onboarding']);
  if (
    session.membershipStatus === 'expired' &&
    !['/billing', '/subscription-result', '/subscription-required'].includes(state.url)
  )
    return router.createUrlTree(['/subscription-required']);
  return true;
};
export const onboardingGuard: CanActivateFn = async () => {
  const auth = inject(AuthStore);
  const router = inject(Router);
  const session = await auth.ensureSession();
  if (!session) return router.createUrlTree(['/login']);
  if (!session.emailVerified) return router.createUrlTree(['/verify-email']);
  return session.onboardingCompleted ? router.createUrlTree(['/overview']) : true;
};

export const billingGuard: CanActivateFn = async () => {
  const session = await inject(AuthStore).ensureSession();
  return session && (session.role === 'owner' || session.role === 'admin')
    ? true
    : inject(Router).createUrlTree(['/overview']);
};

export const pendingVerificationGuard: CanActivateFn = async () => {
  const auth = inject(AuthStore);
  const router = inject(Router);
  const session = await auth.ensureSession();
  if (!session) return router.createUrlTree(['/login']);
  return session.emailVerified ? router.createUrlTree(['/overview']) : true;
};
