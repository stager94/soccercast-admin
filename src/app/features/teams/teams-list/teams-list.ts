import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Subject, debounceTime } from 'rxjs';

import { PaginationMeta } from '../../../core/models/pagination.model';
import { TeamListItem } from '../../../core/models/team.model';
import { TeamService } from '../../../core/services/team.service';
import { Pagination } from '../../../shared/pagination/pagination';

type TeamScope = 'all' | 'club' | 'national';

@Component({
  selector: 'app-teams-list',
  imports: [DecimalPipe, RouterLink, Pagination],
  templateUrl: './teams-list.html',
})
export class TeamsList implements OnInit {
  private readonly teamService = inject(TeamService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly search$ = new Subject<void>();

  readonly teams = signal<TeamListItem[]>([]);
  readonly meta = signal<PaginationMeta | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly nameQuery = signal('');
  readonly scope = signal<TeamScope>('club');
  readonly women = signal(false);
  readonly ageGroup = signal<string | null | undefined>(undefined);
  readonly ageGroups = signal<string[]>([]);

  ngOnInit(): void {
    this.search$
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.load(1));
    this.teamService.getAgeGroups().subscribe((groups) => this.ageGroups.set(groups));
    this.load(1);
  }

  onNameInput(value: string): void {
    this.nameQuery.set(value);
    this.search$.next();
  }

  setScope(scope: TeamScope): void {
    this.scope.set(scope);
    this.load(1);
  }

  setWomen(women: boolean): void {
    this.women.set(women);
    this.load(1);
  }

  setAgeGroup(value: string): void {
    // '' => no age_group filter (undefined); 'nil' => age_group IS NULL; otherwise exact match
    if (value === '') {
      this.ageGroup.set(undefined);
    } else if (value === 'nil') {
      this.ageGroup.set(null);
    } else {
      this.ageGroup.set(value);
    }
    this.load(1);
  }

  // Global rank across all pages (leaderboard is ordered by elo desc server-side).
  rank(index: number): number {
    const meta = this.meta();
    const page = meta?.page ?? 1;
    const perPage = meta?.per_page ?? 25;
    return (page - 1) * perPage + index + 1;
  }

  load(page: number): void {
    this.loading.set(true);
    const national = this.scope() === 'all' ? undefined : this.scope() === 'national';
    const ageGroup = this.ageGroup();
    this.teamService.getAll({
      page,
      name: this.nameQuery() || undefined,
      national,
      women: this.women(),
      ...(ageGroup !== undefined ? { age_group: ageGroup } : {}),
    }).subscribe({
      next: (response) => {
        this.teams.set(response.data);
        this.meta.set(response.meta);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }
}
