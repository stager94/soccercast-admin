import { DatePipe, Location } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { Subscription, interval } from 'rxjs';

import { FINISHED_STATUSES, LIVE_STATUSES, FixtureDetail as FixtureDetailModel } from '../../../core/models/fixture.model';
import { FixtureService } from '../../../core/services/fixture.service';
import { EventsTimeline } from '../../../shared/events-timeline/events-timeline';
import { FixtureStatusBadge } from '../../../shared/fixture-status-badge/fixture-status-badge';
import { LineupColumns } from '../../../shared/lineup-columns/lineup-columns';
import { LiveTimer } from '../../../shared/live-timer/live-timer';
import { PlayerStatsTable } from '../../../shared/player-stats-table/player-stats-table';
import { StatisticsCompare } from '../../../shared/statistics-compare/statistics-compare';

type Tab = 'events' | 'lineups' | 'statistics' | 'player-stats';

@Component({
  selector: 'app-fixture-detail',
  imports: [DatePipe, FixtureStatusBadge, LiveTimer, EventsTimeline, LineupColumns, StatisticsCompare, PlayerStatsTable],
  templateUrl: './fixture-detail.html',
})
export class FixtureDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly fixtureService = inject(FixtureService);
  private readonly destroyRef = inject(DestroyRef);
  private pollingSubscription: Subscription | null = null;

  readonly fixture = signal<FixtureDetailModel | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly activeTab = signal<Tab>('events');

  readonly tabs: { id: Tab; label: string }[] = [
    { id: 'events', label: 'Events' },
    { id: 'lineups', label: 'Lineups' },
    { id: 'statistics', label: 'Statistics' },
    { id: 'player-stats', label: 'Player Stats' },
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.load(id);
  }

  private load(id: string): void {
    this.fixtureService
      .getById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (f) => {
          this.fixture.set(f);
          this.loading.set(false);
          this.updatePolling(id);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
  }

  private updatePolling(id: string): void {
    const f = this.fixture();
    if (!f) return;
    const isLive = LIVE_STATUSES.includes(f.status);
    if (isLive && !this.pollingSubscription) {
      this.pollingSubscription = interval(30000)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.load(id));
    } else if (!isLive && this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
  }

  goBack(): void {
    this.location.back();
  }

  setTab(tab: Tab): void {
    this.activeTab.set(tab);
  }

  isLive(): boolean {
    const f = this.fixture();
    return f ? LIVE_STATUSES.includes(f.status) : false;
  }

  hasDetails(): boolean {
    return !!this.fixture()?.details_synced_at;
  }

  scoreDisplay(): string {
    const f = this.fixture();
    if (!f) return '–';
    if (f.goals_home === null || f.goals_away === null) return '–';
    return `${f.goals_home} – ${f.goals_away}`;
  }

  htScoreDisplay(): string {
    const f = this.fixture();
    if (!f) return '';
    const { home, away } = f.score_halftime;
    if (home === null || away === null) return '';
    return `HT: ${home}–${away}`;
  }

  venueLine(): string {
    const f = this.fixture();
    if (!f) return '';
    const parts: string[] = [];
    if (f.venue) parts.push(f.venue);
    if (f.city) parts.push(f.city);
    return parts.join(', ');
  }

  hasLineups(): boolean {
    const f = this.fixture();
    return !!f && f.lineups.length === 2;
  }

  isFinished(): boolean {
    const f = this.fixture();
    return f ? FINISHED_STATUSES.includes(f.status) : false;
  }
}
