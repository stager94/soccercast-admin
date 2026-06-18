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
  private livePolling: Subscription | null = null;

  readonly date = signal(today());
  readonly chip = signal<StatusChip>('all');

  // Date-scoped dataset (all statuses for the day)
  readonly allFixtures = signal<Fixture[]>([]);
  readonly dateLoading = signal(true);

  // Global live dataset (no date constraint) — always current
  readonly liveFixtures = signal<Fixture[]>([]);
  readonly liveLoading = signal(true);

  readonly error = signal(false);

  // First-load skeleton: show while the relevant dataset is loading
  readonly loading = computed(() =>
    this.chip() === 'live' ? this.liveLoading() : this.dateLoading()
  );

  readonly collapsedIds = signal<Set<number>>(new Set());
  readonly isToday = computed(() => this.date() === today());

  readonly chips: { id: StatusChip; label: string }[] = [
    { id: 'all',      label: 'All' },
    { id: 'live',     label: 'Live' },
    { id: 'finished', label: 'Finished' },
    { id: 'upcoming', label: 'Upcoming' },
  ];

  // Counts: live uses the global signal, others use the date-based signal
  readonly chipCounts = computed<Record<StatusChip, number>>(() => {
    const all = this.allFixtures();
    return {
      all:      all.length,
      live:     this.liveFixtures().length,
      finished: all.filter(f => FINISHED_STATUSES.includes(f.status)).length,
      upcoming: all.filter(f => UPCOMING_STATUSES.includes(f.status as string)).length,
    };
  });

  // Fixtures to display — live chip uses its own global source
  readonly filteredFixtures = computed<Fixture[]>(() => {
    const c = this.chip();
    if (c === 'live')     return this.liveFixtures();
    const all = this.allFixtures();
    if (c === 'all')      return all;
    if (c === 'finished') return all.filter(f => FINISHED_STATUSES.includes(f.status));
    if (c === 'upcoming') return all.filter(f => UPCOMING_STATUSES.includes(f.status as string));
    return all;
  });

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
    this.loadDate();
    this.loadLive();
    this.startLivePolling();
  }

  // Load all fixtures for the selected date (all statuses)
  loadDate(): void {
    this.dateLoading.set(true);
    this.error.set(false);
    this.fixtureService
      .getByDate(this.date())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => { this.allFixtures.set(res.data); this.dateLoading.set(false); },
        error: () => { this.error.set(true); this.dateLoading.set(false); },
      });
  }

  // Load all globally live fixtures (no date constraint)
  loadLive(): void {
    this.fixtureService
      .getLive()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => { this.liveFixtures.set(res.data); this.liveLoading.set(false); },
        error: () => this.liveLoading.set(false),
      });
  }

  private startLivePolling(): void {
    this.livePolling = interval(30000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadLive());
  }

  selectChip(chip: StatusChip): void {
    this.chip.set(chip);
    // No reload needed — both datasets are always current
  }

  goToday(): void {
    this.date.set(today());
    this.chip.set('all');
    this.collapsedIds.set(new Set());
    this.loadDate();
  }

  prevDay(): void {
    const d = new Date(this.date());
    d.setDate(d.getDate() - 1);
    this.date.set(toDateStr(d));
    this.collapsedIds.set(new Set());
    this.loadDate();
  }

  nextDay(): void {
    const d = new Date(this.date());
    d.setDate(d.getDate() + 1);
    this.date.set(toDateStr(d));
    this.collapsedIds.set(new Set());
    this.loadDate();
  }

  onDateChange(value: string): void {
    this.date.set(value);
    this.collapsedIds.set(new Set());
    this.loadDate();
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
}
