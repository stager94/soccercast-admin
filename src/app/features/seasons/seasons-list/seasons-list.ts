import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';

import { Season } from '../../../core/models/season.model';
import { PaginationMeta } from '../../../core/models/pagination.model';
import { SeasonService } from '../../../core/services/season.service';
import { Pagination } from '../../../shared/pagination/pagination';

@Component({
  selector: 'app-seasons-list',
  imports: [DatePipe, Pagination],
  templateUrl: './seasons-list.html',
})
export class SeasonsList implements OnInit {
  private readonly seasonService = inject(SeasonService);

  readonly seasons = signal<Season[]>([]);
  readonly meta = signal<PaginationMeta | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly togglingIds = signal<Set<number>>(new Set());
  readonly syncing = signal(false);
  readonly syncThrottledUntil = signal<string | null>(null);

  ngOnInit(): void {
    this.load(1);
  }

  load(page: number): void {
    this.loading.set(true);
    this.seasonService.getAll(page).subscribe({
      next: (response) => {
        this.seasons.set(response.data);
        this.meta.set(response.meta);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  triggerSync(): void {
    this.syncing.set(true);
    this.syncThrottledUntil.set(null);
    this.seasonService.sync().subscribe({
      next: () => {
        this.syncing.set(false);
        this.load(1);
      },
      error: (err: HttpErrorResponse) => {
        this.syncing.set(false);
        if (err.status === 429) {
          this.syncThrottledUntil.set(err.error?.available_at ?? null);
        }
      },
    });
  }

  toggleEnabled(season: Season): void {
    const ids = new Set(this.togglingIds());
    ids.add(season.id);
    this.togglingIds.set(ids);

    this.seasonService.update(season.id, !season.enabled).subscribe({
      next: (updated) => {
        this.seasons.update((list) => list.map((s) => (s.id === updated.id ? updated : s)));
        const next = new Set(this.togglingIds());
        next.delete(updated.id);
        this.togglingIds.set(next);
      },
      error: () => {
        const next = new Set(this.togglingIds());
        next.delete(season.id);
        this.togglingIds.set(next);
      },
    });
  }

  isToggling(id: number): boolean {
    return this.togglingIds().has(id);
  }
}
