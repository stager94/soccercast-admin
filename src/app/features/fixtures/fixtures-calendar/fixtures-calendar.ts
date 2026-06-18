import { DatePipe } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';

import { FINISHED_STATUSES, LIVE_STATUSES, Fixture, FixtureLeague } from '../../../core/models/fixture.model';
import { FixtureService } from '../../../core/services/fixture.service';
import { FixtureStatusBadge } from '../../../shared/fixture-status-badge/fixture-status-badge';
import { LiveTimer } from '../../../shared/live-timer/live-timer';

type StatusChip = 'all' | 'live' | 'finished' | 'upcoming';

export interface FixtureGroup {
  league: FixtureLeague;
  fixtures: Fixture[];
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function today(): string {
  return toDateStr(new Date());
}

const UPCOMING_STATUSES = ['TBD', 'NS'];

@Component({
  selector: 'app-fixtures-calendar',
  imports: [DatePipe, FixtureStatusBadge, LiveTimer],
  templateUrl: './fixtures-calendar.html',
})
export class FixturesCalendar implements OnInit {
  private readonly fixtureService = inject(FixtureService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private pollingSubscription: Subscription | null = null;
  private loadSubscription: Subscription | null = null;

  readonly date = signal(today());
  readonly chip = signal<StatusChip>('all');

  // All fixtures for the day — no status filter, filtering is client-side
  readonly allFixtures = signal<Fixture[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);

  // Collapsed league ids
  readonly collapsedIds = signal<Set<number>>(new Set());

  readonly isToday = computed(() => this.date() === today());

  readonly chips: { id: StatusChip; label: string }[] = [
    { id: 'all',      label: 'All' },
    { id: 'live',     label: 'Live' },
    { id: 'finished', label: 'Finished' },
    { id: 'upcoming', label: 'Upcoming' },
  ];

  // Count per chip — derived from full dataset so all badges are always visible
  readonly chipCounts = computed<Record<StatusChip, number>>(() => {
    const all = this.allFixtures();
    return {
      all:      all.length,
      live:     all.filter(f => LIVE_STATUSES.includes(f.status)).length,
      finished: all.filter(f => FINISHED_STATUSES.includes(f.status)).length,
      upcoming: all.filter(f => UPCOMING_STATUSES.includes(f.status)).length,
    };
  });

  // Fixtures visible under the active chip
  readonly filteredFixtures = computed<Fixture[]>(() => {
    const all = this.allFixtures();
    const c = this.chip();
    if (c === 'all')      return all;
    if (c === 'live')     return all.filter(f => LIVE_STATUSES.includes(f.status));
    if (c === 'finished') return all.filter(f => FINISHED_STATUSES.includes(f.status));
    if (c === 'upcoming') return all.filter(f => UPCOMING_STATUSES.includes(f.status));
    return all;
  });

  // Group filtered fixtures by league, preserving kickoff order
  readonly groups = computed<FixtureGroup[]>(() => {
    const map = new Map<number, FixtureGroup>();
    for (const f of this.filteredFixtures()) {
      if (!f.league) continue;
      const id = f.league.id;
      if (!map.has(id)) map.set(id, { league: f.league, fixtures: [] });
      map.get(id)!.fixtures.push(f);
    }
    return Array.from(map.values());
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loadSubscription?.unsubscribe();
    this.loading.set(true);
    this.error.set(false);
    // Always fetch all statuses — filtering is done client-side
    this.loadSubscription = this.fixtureService
      .getByDate(this.date())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.allFixtures.set(res.data);
          this.collapsedIds.set(new Set()); // reset collapse on date change
          this.loading.set(false);
          this.updatePolling();
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
  }

  selectChip(chip: StatusChip): void {
    this.chip.set(chip);
    // No API call — filtering is client-side
  }

  goToday(): void {
    this.date.set(today());
    this.chip.set('all');
    this.load();
  }

  prevDay(): void {
    const d = new Date(this.date());
    d.setDate(d.getDate() - 1);
    this.date.set(toDateStr(d));
    this.load();
  }

  nextDay(): void {
    const d = new Date(this.date());
    d.setDate(d.getDate() + 1);
    this.date.set(toDateStr(d));
    this.load();
  }

  onDateChange(value: string): void {
    this.date.set(value);
    this.load();
  }

  toggleLeague(id: number): void {
    this.collapsedIds.update(set => {
      const next = new Set(set);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  isCollapsed(id: number): boolean {
    return this.collapsedIds().has(id);
  }

  isLive(f: Fixture): boolean {
    return LIVE_STATUSES.includes(f.status);
  }

  navigateToDetail(id: number): void {
    this.router.navigate(['/fixtures', id]);
  }

  chipClass(id: StatusChip): string {
    const active = this.chip() === id;
    if (id === 'live') {
      return active
        ? 'bg-red-500 text-white border-red-500'
        : 'bg-white text-gray-500 border-gray-200 hover:border-red-300 hover:text-red-500';
    }
    if (id === 'finished') {
      return active
        ? 'bg-green-500 text-white border-green-500'
        : 'bg-white text-gray-500 border-gray-200 hover:border-green-300 hover:text-green-600';
    }
    if (id === 'upcoming') {
      return active
        ? 'bg-brand-500 text-white border-brand-500'
        : 'bg-white text-gray-500 border-gray-200 hover:border-brand-300 hover:text-brand-600';
    }
    return active
      ? 'bg-gray-800 text-white border-gray-800'
      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700';
  }

  private updatePolling(): void {
    const hasLive = this.allFixtures().some(f => LIVE_STATUSES.includes(f.status));
    if (hasLive && !this.pollingSubscription) {
      this.pollingSubscription = interval(30000)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.load());
    } else if (!hasLive && this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
  }
}
