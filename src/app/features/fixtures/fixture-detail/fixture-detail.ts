import { DatePipe, Location } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { Subscription, interval, timer } from 'rxjs';

import { ApiFootballRequestLog, FINISHED_STATUSES, LIVE_STATUSES, FixtureDetail as FixtureDetailModel } from '../../../core/models/fixture.model';
import { FixtureService } from '../../../core/services/fixture.service';
import { EventsTimeline } from '../../../shared/events-timeline/events-timeline';
import { FixtureStatusBadge } from '../../../shared/fixture-status-badge/fixture-status-badge';
import { LineupColumns } from '../../../shared/lineup-columns/lineup-columns';
import { LiveTimer } from '../../../shared/live-timer/live-timer';
import { PlayerStatsTable } from '../../../shared/player-stats-table/player-stats-table';
import { StatisticsCompare } from '../../../shared/statistics-compare/statistics-compare';

type Tab = 'events' | 'lineups' | 'statistics' | 'player-stats' | 'api-logs';
type SyncType = 'all' | 'events' | 'lineups' | 'statistics' | 'player_stats';

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
  readonly syncingType = signal<SyncType | null>(null);
  readonly syncDoneType = signal<SyncType | null>(null);

  readonly apiLogs = signal<ApiFootballRequestLog[]>([]);
  readonly apiLogsLoading = signal(false);
  readonly expandedLogId = signal<number | null>(null);

  readonly tabs: { id: Tab; label: string }[] = [
    { id: 'events', label: 'Events' },
    { id: 'lineups', label: 'Lineups' },
    { id: 'statistics', label: 'Statistics' },
    { id: 'player-stats', label: 'Player Stats' },
    { id: 'api-logs', label: 'API Logs' },
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

  sync(type: SyncType): void {
    const f = this.fixture();
    if (!f || this.syncingType()) return;
    this.syncingType.set(type);

    const obs$ = type === 'events' ? this.fixtureService.syncEvents(f.id)
      : type === 'lineups' ? this.fixtureService.syncLineups(f.id)
      : type === 'statistics' ? this.fixtureService.syncStatistics(f.id)
      : type === 'player_stats' ? this.fixtureService.syncPlayerStatistics(f.id)
      : this.fixtureService.syncDetails(f.id);

    obs$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.syncingType.set(null);
        this.syncDoneType.set(type);
        timer(2500).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
          this.syncDoneType.set(null);
          this.load(String(f.id));
        });
      },
      error: () => this.syncingType.set(null),
    });
  }

  showSync(type: SyncType): boolean {
    const f = this.fixture();
    if (!f) return false;
    if (type === 'lineups') return f.status === 'NS' || (this.isFinished() && !this.hasLineups());
    return this.isFinished();
  }

  syncLabel(type: SyncType): string {
    if (this.syncingType() === type) return 'Syncing…';
    if (this.syncDoneType() === type) return '✓ Queued';
    return type === 'all' ? 'Sync All' : 'Sync';
  }

  goBack(): void {
    this.location.back();
  }

  setTab(tab: Tab): void {
    this.activeTab.set(tab);
    if (tab === 'api-logs' && this.apiLogs().length === 0 && !this.apiLogsLoading()) {
      this.loadApiLogs();
    }
  }

  loadApiLogs(): void {
    const f = this.fixture();
    if (!f) return;
    this.apiLogsLoading.set(true);
    this.fixtureService
      .getApiLogs(f.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (logs) => {
          this.apiLogs.set(logs);
          this.apiLogsLoading.set(false);
        },
        error: () => this.apiLogsLoading.set(false),
      });
  }

  toggleLog(id: number): void {
    this.expandedLogId.set(this.expandedLogId() === id ? null : id);
  }

  logStatusClass(log: ApiFootballRequestLog): string {
    const s = log.response_status;
    if (!s) return 'text-gray-400';
    if (s >= 200 && s < 300) return log.resolution === 'ok' ? 'text-green-600' : 'text-amber-600';
    return 'text-red-500';
  }

  formatJson(raw: string | null | Record<string, unknown>): string {
    if (!raw) return '';
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return JSON.stringify(parsed, null, 2);
    } catch {
      return String(raw);
    }
  }

  urlPath(url: string): string {
    try {
      const u = new URL(url);
      return u.pathname + u.search;
    } catch {
      return url;
    }
  }

  isLive(): boolean {
    const f = this.fixture();
    return f ? LIVE_STATUSES.includes(f.status) : false;
  }

  syncCells(): { label: string; synced_at: string | null; unavailable?: boolean }[] {
    const f = this.fixture();
    if (!f) return [];
    return [
      { label: 'Events',     synced_at: f.events_synced_at,            unavailable: !f.coverage.events },
      { label: 'Lineups',    synced_at: f.lineups_synced_at,           unavailable: !f.coverage.lineups },
      { label: 'Statistics', synced_at: f.statistics_synced_at,        unavailable: !f.coverage.statistics_fixtures },
      { label: 'Players',    synced_at: f.player_statistics_synced_at, unavailable: !f.coverage.statistics_players },
    ];
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
