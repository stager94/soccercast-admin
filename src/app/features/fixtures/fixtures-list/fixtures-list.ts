import { DatePipe } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription, interval } from 'rxjs';

import { FINISHED_STATUSES, LIVE_STATUSES, Fixture } from '../../../core/models/fixture.model';
import { PaginationMeta } from '../../../core/models/pagination.model';
import { FixtureService } from '../../../core/services/fixture.service';
import { FixtureStatusBadge } from '../../../shared/fixture-status-badge/fixture-status-badge';
import { LiveTimer } from '../../../shared/live-timer/live-timer';
import { Pagination } from '../../../shared/pagination/pagination';

@Component({
  selector: 'app-fixtures-list',
  imports: [DatePipe, RouterLink, Pagination, FixtureStatusBadge, LiveTimer],
  templateUrl: './fixtures-list.html',
})
export class FixturesList implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fixtureService = inject(FixtureService);
  private readonly destroyRef = inject(DestroyRef);
  private pollingSubscription: Subscription | null = null;

  readonly leagueId = signal('');
  readonly seasonId = signal('');
  readonly fixtures = signal<Fixture[]>([]);
  readonly meta = signal<PaginationMeta | null>(null);
  readonly rounds = signal<string[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);

  readonly statusFilter = signal('');
  readonly roundFilter = signal('');
  readonly dateFilter = signal('');
  readonly currentPage = signal(1);

  readonly statusOptions = ['Upcoming', 'Live', 'Finished', 'Postponed'];

  readonly leagueIdNum = computed(() => Number(this.leagueId()));
  readonly seasonIdNum = computed(() => Number(this.seasonId()));

  ngOnInit(): void {
    this.leagueId.set(this.route.snapshot.paramMap.get('leagueId')!);
    this.seasonId.set(this.route.snapshot.paramMap.get('seasonId')!);

    this.fixtureService
      .getRounds(this.leagueId(), this.seasonId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (r) => this.rounds.set(r.rounds), error: () => {} });

    this.load(1);
  }

  load(page: number): void {
    this.currentPage.set(page);
    this.loading.set(true);
    this.fixtureService
      .getAll(this.leagueId(), this.seasonId(), {
        page,
        status: this.statusFilter() || undefined,
        round: this.roundFilter() || undefined,
        date: this.dateFilter() || undefined,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.fixtures.set(res.data);
          this.meta.set(res.meta);
          this.loading.set(false);
          this.updatePolling();
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
  }

  onStatusChange(value: string): void {
    this.statusFilter.set(value);
    this.load(1);
  }

  onRoundChange(value: string): void {
    this.roundFilter.set(value);
    this.load(1);
  }

  onDateChange(value: string): void {
    this.dateFilter.set(value);
    this.load(1);
  }

  reset(): void {
    this.statusFilter.set('');
    this.roundFilter.set('');
    this.dateFilter.set('');
    this.load(1);
  }

  isLive(f: Fixture): boolean {
    return LIVE_STATUSES.includes(f.status);
  }

  isFinished(f: Fixture): boolean {
    return FINISHED_STATUSES.includes(f.status);
  }

  detailsIcon(f: Fixture): '✓' | '✗' | '—' {
    if (f.details_synced_at) return '✓';
    if (this.isFinished(f)) return '✗';
    return '—';
  }

  scoreDisplay(f: Fixture): string {
    const h = f.goals_home;
    const a = f.goals_away;
    if (h === null || a === null) return '–';
    return `${h} – ${a}`;
  }

  navigateToDetail(id: number): void {
    this.router.navigate(['/fixtures', id]);
  }

  private updatePolling(): void {
    const hasLive = this.fixtures().some((f) => LIVE_STATUSES.includes(f.status));
    if (hasLive && !this.pollingSubscription) {
      this.pollingSubscription = interval(30000)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.load(this.currentPage()));
    } else if (!hasLive && this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
  }
}
