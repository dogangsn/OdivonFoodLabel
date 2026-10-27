import { Component, inject, signal } from '@angular/core';
import { FormField, form, minLength, required, submit } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthStore } from '../../core/auth/auth-store';
import { PageHeader } from '../../shared/ui/page-header';
import { SlideOver } from '../../shared/ui/slide-over';
import { RoleOption, SettingsApi, TenantUser } from './settings.api';
@Component({
  selector: 'app-settings-page',
  imports: [PageHeader, SlideOver, FormField, RouterLink],
  template: `<div class="space-y-6">
      <app-page-header
        eyebrow="TENANT YÖNETİMİ"
        title="Ekip ve Ayarlar"
        description="Hesap profilini, ekip erişimini ve rol atamalarını tenant sınırları içinde yönetin."
      >
        @if (canManage) {
          <button actions type="button" class="odv-btn-primary" (click)="openUser()">
            <span class="material-symbols-rounded">person_add</span>Ekip üyesi ekle
          </button>
        }
      </app-page-header>
      <section class="grid gap-5 lg:grid-cols-[.72fr_1.28fr]">
        <article class="odv-card p-6">
          <h2 class="m-0 text-lg font-black">Çalışma alanı</h2>
          <div class="mt-5 space-y-4 text-sm">
            <div>
              <span class="block text-xs text-slate-500">Şirket</span
              ><strong>{{ auth.session()?.tenantName }}</strong>
            </div>
            <div>
              <span class="block text-xs text-slate-500">Tenant kimliği</span
              ><code class="text-xs">{{ auth.session()?.tenantId }}</code>
            </div>
            <div>
              <span class="block text-xs text-slate-500">Üyelik durumu</span
              ><span class="odv-badge-success">{{ auth.session()?.membershipStatus }}</span>
            </div>
            <a routerLink="/billing" class="odv-btn-soft inline-flex">Abonelik ve ödeme</a>
          </div>
        </article>
        <article class="odv-card p-6">
          <h2 class="m-0 text-lg font-black">Hesabım</h2>
          <form class="mt-5 grid gap-4 sm:grid-cols-2" (submit)="saveProfile($event)">
            <label
              ><span class="mb-1.5 block text-xs font-bold">Ad soyad</span
              ><input class="odv-input" [formField]="profileForm.displayName" /></label
            ><label
              ><span class="mb-1.5 block text-xs font-bold">Telefon</span
              ><input class="odv-input" autocomplete="tel" [formField]="profileForm.phone" /></label
            ><label class="sm:col-span-2"
              ><span class="mb-1.5 block text-xs font-bold">E-posta</span
              ><input class="odv-input" disabled [value]="auth.session()?.email"
            /></label>
            <div class="sm:col-span-2">
              <button class="odv-btn-primary" type="submit" [disabled]="profileSaving()">
                Profili kaydet
              </button>
            </div>
          </form>
        </article>
      </section>
      <section class="odv-card overflow-hidden">
        <div class="border-b border-slate-200 p-5 dark:border-slate-800">
          <h2 class="m-0 text-xl font-black">Ekip erişimi</h2>
          <p class="mb-0 mt-1 text-sm text-slate-500">
            Her kullanıcı yalnız atanmış rol ve FoodLabel izinleriyle işlem yapar.
          </p>
        </div>
        @if (loading()) {
          <div class="grid min-h-52 place-items-center">
            <span class="material-symbols-rounded animate-spin text-4xl text-violet-600"
              >progress_activity</span
            >
          </div>
        } @else if (error()) {
          <div class="p-8 text-center text-sm text-rose-600">{{ error() }}</div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full min-w-[760px]">
              <thead>
                <tr>
                  <th class="odv-th">Kullanıcı</th>
                  <th class="odv-th">Rol</th>
                  <th class="odv-th">Doğrulama</th>
                  <th class="odv-th">Durum</th>
                  <th class="odv-th text-end">İşlem</th>
                </tr>
              </thead>
              <tbody>
                @for (user of users(); track user.uid) {
                  <tr>
                    <td class="odv-td">
                      <strong class="block">{{ user.displayName }}</strong
                      ><span class="text-xs text-slate-500">{{ user.email }}</span>
                    </td>
                    <td class="odv-td">
                      {{
                        user.role === 'owner' ? 'Hesap sahibi' : user.roleIds.length + ' özel rol'
                      }}
                    </td>
                    <td class="odv-td">
                      <span
                        [class]="user.emailVerified ? 'odv-badge-success' : 'odv-badge-warning'"
                        >{{ user.emailVerified ? 'Doğrulandı' : 'Bekliyor' }}</span
                      >
                    </td>
                    <td class="odv-td">
                      <span
                        [class]="
                          user.status === 'active' ? 'odv-badge-success' : 'odv-badge-neutral'
                        "
                        >{{ user.status === 'active' ? 'Aktif' : 'Pasif' }}</span
                      >
                    </td>
                    <td class="odv-td text-end">
                      @if (user.role !== 'owner' && user.status === 'active' && canManage) {
                        <button
                          type="button"
                          class="odv-btn-ghost text-rose-600"
                          (click)="deactivate(user)"
                        >
                          Erişimi kapat
                        </button>
                      }
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="p-10 text-center text-sm text-slate-500">
                      Ekip kullanıcısı bulunmuyor.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </section>
    </div>
    <app-slide-over
      [open]="drawerOpen()"
      [dirty]="userForm().dirty()"
      [submitting]="saving()"
      title="Ekip üyesi ekle"
      description="Yeni kullanıcıya geçici parola ve görev rolü atayın."
      eyebrow="ERİŞİM YÖNETİMİ"
      icon="person_add"
      submitLabel="Kullanıcı oluştur"
      (closed)="drawerOpen.set(false)"
      (submitted)="createUser()"
    >
      @if (saveError()) {
        <div role="alert" class="rounded-xl bg-rose-50 p-4 text-sm font-semibold text-rose-700">
          {{ saveError() }}
        </div>
      }
      <section class="odv-card p-5">
        <div class="grid gap-4">
          <label
            ><span class="mb-1.5 block text-xs font-bold">Ad soyad *</span
            ><input class="odv-input" [formField]="userForm.displayName" /></label
          ><label
            ><span class="mb-1.5 block text-xs font-bold">E-posta *</span
            ><input class="odv-input" type="email" [formField]="userForm.email" /></label
          ><label
            ><span class="mb-1.5 block text-xs font-bold">Geçici parola *</span
            ><input
              class="odv-input"
              type="password"
              autocomplete="new-password"
              [formField]="userForm.password" /></label
          ><label
            ><span class="mb-1.5 block text-xs font-bold">Rol *</span
            ><select class="odv-input" [formField]="userForm.roleId">
              <option value="">Rol seçin</option>
              @for (role of roles(); track role.id) {
                <option [value]="role.id">{{ role.name }}</option>
              }
            </select></label
          >
        </div>
      </section></app-slide-over
    >`,
})
export class SettingsPage {
  readonly auth = inject(AuthStore);
  readonly canManage = ['owner', 'admin'].includes(this.auth.session()?.role ?? '');
  readonly users = signal<TenantUser[]>([]);
  readonly roles = signal<RoleOption[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly drawerOpen = signal(false);
  readonly saving = signal(false);
  readonly saveError = signal('');
  readonly profileSaving = signal(false);
  readonly profile = signal({ displayName: this.auth.session()?.name ?? '', phone: '' });
  readonly profileForm = form(this.profile, (p) => required(p.displayName));
  readonly user = signal({ displayName: '', email: '', password: '', roleId: '' });
  readonly userForm = form(this.user, (p) => {
    required(p.displayName);
    required(p.email);
    required(p.password);
    minLength(p.password, 10);
    required(p.roleId);
  });
  private readonly api = inject(SettingsApi);
  constructor() {
    void this.load();
  }
  async load() {
    this.loading.set(true);
    try {
      const [users, roles] = await Promise.all([this.api.users(), this.api.roles()]);
      this.users.set(users);
      this.roles.set(roles);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Ekip bilgileri alınamadı.');
    } finally {
      this.loading.set(false);
    }
  }
  openUser() {
    this.user.set({ displayName: '', email: '', password: '', roleId: '' });
    this.drawerOpen.set(true);
  }
  createUser() {
    submit(this.userForm, async () => {
      this.saving.set(true);
      this.saveError.set('');
      try {
        await this.api.createUser({
          displayName: this.user().displayName,
          email: this.user().email,
          password: this.user().password,
          roleIds: [this.user().roleId],
        });
        this.drawerOpen.set(false);
        await this.load();
      } catch (e) {
        this.saveError.set(e instanceof Error ? e.message : 'Kullanıcı oluşturulamadı.');
      } finally {
        this.saving.set(false);
      }
    });
  }
  saveProfile(event: Event) {
    event.preventDefault();
    submit(this.profileForm, async () => {
      this.profileSaving.set(true);
      try {
        await this.api.updateMe(this.profile());
        await this.auth.refreshProfile();
        await Swal.fire({
          icon: 'success',
          title: 'Profil güncellendi',
          confirmButtonText: 'Tamam',
          buttonsStyling: false,
          customClass: { confirmButton: 'odivon-btn-primary' },
        });
      } finally {
        this.profileSaving.set(false);
      }
    });
  }
  async deactivate(user: TenantUser) {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Erişimi kapat?',
      text: `${user.displayName} artık çalışma alanına erişemeyecek.`,
      showCancelButton: true,
      confirmButtonText: 'Erişimi kapat',
      cancelButtonText: 'Vazgeç',
      buttonsStyling: false,
      customClass: { confirmButton: 'odivon-btn-danger', cancelButton: 'odivon-btn-cancel' },
    });
    if (result.isConfirmed) {
      await this.api.deactivate(user.uid);
      await this.load();
    }
  }
}

