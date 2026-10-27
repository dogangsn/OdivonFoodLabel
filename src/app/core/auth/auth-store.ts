import { Injectable, computed, inject, signal } from '@angular/core';
import { FirebaseIdentity } from './firebase-identity';
import { IdentityApi, IdentityProfile } from './identity-api';

export interface AppSession {
  readonly name: string;
  readonly email: string;
  readonly tenantId: string;
  readonly tenantName: string;
  readonly emailVerified: boolean;
  readonly role: 'owner' | 'admin' | 'user';
  readonly membershipStatus: string;
  readonly trialEndsAt: string | null;
  readonly subscriptionEndsAt: string | null;
  readonly inGrace: boolean;
  readonly onboardingCompleted: boolean;
}
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly identity = inject(FirebaseIdentity);
  private readonly api = inject(IdentityApi);
  private readonly storageKey = 'odivon:food-label:session';
  readonly session = signal<AppSession | null>(this.restore());
  readonly isAuthenticated = computed(() => this.session() !== null);
  private hydration?: Promise<AppSession | null>;
  async signIn(email: string, password: string) {
    const user = await this.identity.signIn(email, password);
    this.persist(this.toSession(await this.api.me(), user.displayName || email.split('@')[0]));
  }
  async register(name: string, company: string, email: string, password: string) {
    await this.api.register({ name, company, email, password });
    const user = await this.identity.signIn(email, password);
    this.persist(this.toSession(await this.api.me(), user.displayName || name));
  }
  ensureSession() {
    return (this.hydration ??= this.hydrate());
  }
  resetPassword(email: string) {
    return this.identity.resetPassword(email);
  }
  async resendVerification() {
    const email = this.session()?.email;
    if (!email) throw new Error('Oturum bulunamadı.');
    await this.api.resendVerification(email);
  }
  async refreshProfile() {
    const user = await this.identity.refreshUser();
    if (!user) return null;
    const session = this.toSession(
      await this.api.me(),
      user.displayName || user.email || 'Kullanıcı',
    );
    this.persist(session);
    return session;
  }
  async refreshVerification(): Promise<boolean> {
    const session = await this.refreshProfile();
    return session?.emailVerified ?? false;
  }
  logout() {
    void this.identity.logout();
    this.clear();
  }
  private async hydrate() {
    try {
      await this.identity.initialize();
      const user = this.identity.user();
      if (!user) {
        this.clear();
        return null;
      }
      const session = this.toSession(
        await this.api.me(),
        user.displayName || user.email || 'Kullanıcı',
      );
      this.persist(session);
      return session;
    } catch {
      this.clear();
      return null;
    }
  }
  private toSession(profile: IdentityProfile, name: string): AppSession {
    return {
      name: profile.displayName || name,
      email: profile.email,
      tenantId: profile.tenantId,
      tenantName: profile.tenant.name,
      emailVerified: profile.emailVerified,
      role: profile.role,
      membershipStatus: profile.membershipStatus,
      trialEndsAt: profile.trialEndsAt,
      subscriptionEndsAt: profile.tenant.subscriptionEndsAt,
      inGrace: profile.tenant.inGrace,
      onboardingCompleted: profile.onboardingCompleted,
    };
  }
  private persist(session: AppSession) {
    localStorage.setItem(this.storageKey, JSON.stringify(session));
    this.session.set(session);
  }
  private restore(): AppSession | null {
    try {
      return JSON.parse(localStorage.getItem(this.storageKey) ?? 'null') as AppSession | null;
    } catch {
      return null;
    }
  }
  private clear() {
    localStorage.removeItem(this.storageKey);
    this.session.set(null);
  }
}
