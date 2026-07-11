import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, lastValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { AuthUser, UserRow } from '../models/api.models';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly base = environment.apiBaseUrl;

  // Reactive state via signals
  private _user = signal<AuthUser | null>(null);
  private _status = signal<AuthStatus>('loading');

  readonly user = this._user.asReadonly();
  readonly status = this._status.asReadonly();
  readonly isAuthenticated = computed(() => this._status() === 'authenticated');

  constructor(private http: HttpClient) {
    this.checkSession();
  }

  private async checkSession(): Promise<void> {
    try {
      const res = await lastValueFrom(
        this.http.get<{ success: boolean; users?: UserRow[] }>(`${this.base}/user`, {
          withCredentials: true,
        })
      );
      if (res.success && res.users && res.users.length > 0) {
        const u = res.users[0];
        this._user.set({ id: u.id, username: u.username, email: u.email, role: u.role });
        this._status.set('authenticated');
      } else {
        this._status.set('unauthenticated');
      }
    } catch {
      this._status.set('unauthenticated');
    }
  }

  async login(email: string, password: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await lastValueFrom(
        this.http.post<{ success: boolean; message?: string }>(
          `${this.base}/auth/login`,
          { email, password },
          { withCredentials: true }
        )
      );
      if (res.success) {
        await this.checkSession();
      }
      return res;
    } catch (err: unknown) {
      const e = err as { error?: { message?: string } };
      return { success: false, message: e?.error?.message ?? 'Login failed.' };
    }
  }

  async signup(username: string, email: string, password: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await lastValueFrom(
        this.http.post<{ success: boolean; message?: string }>(
          `${this.base}/auth/signup`,
          { username, email, password },
          { withCredentials: true }
        )
      );
      return res;
    } catch (err: unknown) {
      const e = err as { error?: { message?: string } };
      return { success: false, message: e?.error?.message ?? 'Signup failed.' };
    }
  }

  logout(): void {
    this._user.set(null);
    this._status.set('unauthenticated');
  }

  clearUser(): void {
    this.logout();
  }
}
