import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { Session } from '../../../core/models/auth.model';

@Component({
  selector: 'app-sessions',
  imports: [DatePipe],
  templateUrl: './sessions.html',
})
export class Sessions implements OnInit {
  private readonly authService = inject(AuthService);

  readonly sessions = signal<Session[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly revokingId = signal<number | null>(null);

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await firstValueFrom(this.authService.getSessions());
      this.sessions.set(data);
    } catch {
      this.error.set('Failed to load sessions.');
    } finally {
      this.loading.set(false);
    }
  }

  async revoke(session: Session): Promise<void> {
    this.revokingId.set(session.id);
    try {
      await firstValueFrom(this.authService.revokeSession(session.id));
      this.sessions.update((list) => list.filter((s) => s.id !== session.id));
    } catch {
      this.error.set('Failed to revoke session.');
    } finally {
      this.revokingId.set(null);
    }
  }

  formatLastUsed(value: string | null): string {
    if (!value) return '—';
    const diff = Date.now() - new Date(value).getTime();
    const minutes = Math.floor(diff / 60_000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }
}
