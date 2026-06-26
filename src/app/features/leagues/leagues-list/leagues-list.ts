import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Subject, debounceTime } from 'rxjs';

import { League } from '../../../core/models/league.model';
import { PaginationMeta } from '../../../core/models/pagination.model';
import { LeagueService } from '../../../core/services/league.service';
import { CountrySelect } from '../../../shared/country-select/country-select';
import { Pagination } from '../../../shared/pagination/pagination';

type LeagueScope = 'all' | 'enabled' | 'disabled';
type LeagueType = 'all' | 'club' | 'national';

@Component({
  selector: 'app-leagues-list',
  imports: [DatePipe, RouterLink, Pagination, CountrySelect],
  templateUrl: './leagues-list.html',
})
export class LeaguesList implements OnInit {
  private readonly leagueService = inject(LeagueService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly search$ = new Subject<void>();

  readonly leagues = signal<League[]>([]);
  readonly meta = signal<PaginationMeta | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly togglingIds = signal<Set<number>>(new Set());
  readonly scope = signal<LeagueScope>('all');
  readonly leagueType = signal<LeagueType>('all');
  readonly women = signal(false);
  readonly nameQuery = signal('');
  readonly selectedCountryId = signal<number | null>(null);
  readonly syncing = signal(false);
  readonly syncThrottledUntil = signal<string | null>(null);

  ngOnInit(): void {
    this.search$.pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef)).subscribe(() =>
      this.load(1),
    );
    this.load(1);
  }

  setScope(scope: LeagueScope): void {
    this.scope.set(scope);
    this.load(1);
  }

  setLeagueType(type: LeagueType): void {
    this.leagueType.set(type);
    this.load(1);
  }

  setWomen(women: boolean): void {
    this.women.set(women);
    this.load(1);
  }

  onNameInput(value: string): void {
    this.nameQuery.set(value);
    this.search$.next();
  }

  onCountryChange(id: number | null): void {
    this.selectedCountryId.set(id);
    this.load(1);
  }

  load(page: number): void {
    this.loading.set(true);
    const enabledParam =
      this.scope() === 'enabled' ? true : this.scope() === 'disabled' ? false : undefined;
    const nationalParam =
      this.leagueType() === 'all' ? undefined : this.leagueType() === 'national';
    this.leagueService
      .getAll(
        page,
        25,
        enabledParam,
        this.nameQuery() || undefined,
        this.selectedCountryId() ?? undefined,
        nationalParam,
        this.women(),
      )
      .subscribe({
        next: (response) => {
          this.leagues.set(response.data);
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
    this.leagueService.sync().subscribe({
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

  toggleField(league: League, field: 'enabled' | 'women' | 'national'): void {
    const ids = new Set(this.togglingIds());
    ids.add(league.id);
    this.togglingIds.set(ids);

    this.leagueService.update(league.id, { [field]: !league[field] }).subscribe({
      next: (updated) => {
        this.leagues.update((list) => list.map((l) => (l.id === updated.id ? updated : l)));
        const next = new Set(this.togglingIds());
        next.delete(updated.id);
        this.togglingIds.set(next);
      },
      error: () => {
        const next = new Set(this.togglingIds());
        next.delete(league.id);
        this.togglingIds.set(next);
      },
    });
  }

  toggleEnabled(league: League): void { this.toggleField(league, 'enabled'); }

  isToggling(id: number): boolean {
    return this.togglingIds().has(id);
  }
}
