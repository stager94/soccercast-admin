import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';

import { LoginResponse, Session } from '../models/auth.model';

type BroadcastMsg =
  | { type: 'token_refreshed'; access_token: string }
  | { type: 'refresh_failed' }
  | { type: 'logout' };

const REFRESH_LOCK_KEY = 'auth_refresh_lock';
const REFRESH_LOCK_TTL = 10_000; // ms

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private accessToken: string | null = null;
  private refreshInProgress: Promise<boolean> | null = null;
  private readonly channel = new BroadcastChannel('auth');

  readonly isAuthenticated = signal(false);

  constructor() {
    this.channel.onmessage = ({ data }: MessageEvent<BroadcastMsg>) => {
      if (data.type === 'token_refreshed') {
        this.accessToken = data.access_token;
        this.isAuthenticated.set(true);
      } else if (data.type === 'refresh_failed' || data.type === 'logout') {
        this.accessToken = null;
        this.isAuthenticated.set(false);
      }
    };
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  clearAccessToken(): void {
    this.accessToken = null;
    this.isAuthenticated.set(false);
  }

  async login(email: string, password: string): Promise<void> {
    const response = await firstValueFrom(
      this.http.post<LoginResponse>('/admin/auth/login', { email, password }, { withCredentials: true }),
    );
    this.accessToken = response.access_token;
    this.isAuthenticated.set(true);
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.http.delete('/admin/auth/logout', { withCredentials: true }));
    } finally {
      this.accessToken = null;
      this.isAuthenticated.set(false);
      this.channel.postMessage({ type: 'logout' } satisfies BroadcastMsg);
    }
  }

  restoreSession(): Promise<boolean> {
    return this.refresh();
  }

  refresh(): Promise<boolean> {
    if (!this.refreshInProgress) {
      this.refreshInProgress = this._doRefreshWithLock().finally(() => {
        this.refreshInProgress = null;
      });
    }
    return this.refreshInProgress;
  }

  getSessions(): Observable<Session[]> {
    return this.http.get<Session[]>('/admin/auth/sessions');
  }

  revokeSession(id: number): Observable<void> {
    return this.http.delete<void>(`/admin/auth/sessions/${id}/revoke`);
  }

  private _acquireLock(): boolean {
    const existing = localStorage.getItem(REFRESH_LOCK_KEY);
    if (existing) {
      const lockedAt = Number(existing);
      if (Date.now() - lockedAt < REFRESH_LOCK_TTL) return false;
    }
    localStorage.setItem(REFRESH_LOCK_KEY, String(Date.now()));
    return true;
  }

  private _releaseLock(): void {
    localStorage.removeItem(REFRESH_LOCK_KEY);
  }

  private _waitForBroadcast(): Promise<boolean> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        this.channel.removeEventListener('message', handler);
        resolve(false);
      }, REFRESH_LOCK_TTL);

      const handler = ({ data }: MessageEvent<BroadcastMsg>) => {
        if (data.type === 'token_refreshed') {
          clearTimeout(timeout);
          this.channel.removeEventListener('message', handler);
          this.accessToken = data.access_token;
          this.isAuthenticated.set(true);
          resolve(true);
        } else if (data.type === 'refresh_failed') {
          clearTimeout(timeout);
          this.channel.removeEventListener('message', handler);
          resolve(false);
        }
      };

      this.channel.addEventListener('message', handler);
    });
  }

  private async _doRefreshWithLock(): Promise<boolean> {
    if (!this._acquireLock()) {
      // Another tab is refreshing — wait for it to broadcast the result
      return this._waitForBroadcast();
    }

    try {
      return await this._doRefresh();
    } finally {
      this._releaseLock();
    }
  }

  private async _doRefresh(): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.http.post<LoginResponse>('/admin/auth/refresh', null, { withCredentials: true }),
      );
      this.accessToken = response.access_token;
      this.isAuthenticated.set(true);
      this.channel.postMessage({ type: 'token_refreshed', access_token: response.access_token } satisfies BroadcastMsg);
      return true;
    } catch {
      this.accessToken = null;
      this.isAuthenticated.set(false);
      this.channel.postMessage({ type: 'refresh_failed' } satisfies BroadcastMsg);
      return false;
    }
  }
}
