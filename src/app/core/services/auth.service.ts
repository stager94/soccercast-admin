import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';

import { LoginResponse, Session } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private accessToken: string | null = null;
  private refreshInProgress: Promise<boolean> | null = null;

  readonly isAuthenticated = signal(false);

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
    }
  }

  restoreSession(): Promise<boolean> {
    return this.refresh();
  }

  refresh(): Promise<boolean> {
    if (!this.refreshInProgress) {
      this.refreshInProgress = this._doRefresh().finally(() => {
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

  private async _doRefresh(): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.http.post<LoginResponse>('/admin/auth/refresh', null, { withCredentials: true }),
      );
      this.accessToken = response.access_token;
      this.isAuthenticated.set(true);
      return true;
    } catch {
      this.accessToken = null;
      this.isAuthenticated.set(false);
      return false;
    }
  }
}
