import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { League, LeagueDetail as LeagueDetailModel, LeagueSeason } from '../../../core/models/league.model';
import { LeagueService } from '../../../core/services/league.service';
import { FixtureSummaryBlock } from '../../../shared/fixture-summary-block/fixture-summary-block';

export interface CoverageChip {
  label: string;
  active: boolean;
}

const SYSTEM_FIELDS = new Set(['id', 'created_at', 'updated_at', 'league_season_id']);

function toLabel(key: string): string {
  return COVERAGE_LABELS[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const COVERAGE_LABELS: Record<string, string> = {
  events: 'Events',
  lineups: 'Lineups',
  statistics_fixtures: 'Fixture Stats',
  statistics_players: 'Player Stats',
  standings: 'Standings',
  players: 'Players',
  top_scorers: 'Top Scorers',
  top_assists: 'Top Assists',
  top_cards: 'Top Cards',
  injuries: 'Injuries',
  predictions: 'Predictions',
  odds: 'Odds',
};

@Component({
  selector: 'app-league-detail',
  imports: [DatePipe, RouterLink, FixtureSummaryBlock],
  templateUrl: './league-detail.html',
})
export class LeagueDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly leagueService = inject(LeagueService);

  readonly league = signal<LeagueDetailModel | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly toggling = signal(false);
  readonly togglingSeasonSyncId = signal<number | null>(null);
  readonly fittingDcId = signal<number | null>(null);
  readonly predictingDcId = signal<number | null>(null);
  readonly showPastSeasons = signal(false);
  readonly expandedPastIds = signal<Set<number>>(new Set());

  readonly sortedSeasons = computed(() => {
    const seasons = this.league()?.league_seasons ?? [];
    return [...seasons].sort((a, b) => b.season.year - a.season.year);
  });

  readonly currentSeason = computed(
    () => this.sortedSeasons().find((s) => s.current) ?? this.sortedSeasons()[0] ?? null,
  );

  readonly pastSeasons = computed(() => {
    const current = this.currentSeason();
    return this.sortedSeasons().filter((s) => s.id !== current?.id);
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.leagueService.getById(id).subscribe({
      next: (league) => {
        this.league.set(league);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  toggleEnabled(): void {
    const current = this.league();
    if (!current || this.toggling()) return;
    this.toggling.set(true);
    this.leagueService.update(current.id, { enabled: !current.enabled }).subscribe({
      next: (updated: League) => {
        this.league.update((l) => (l ? { ...l, ...updated } : l));
        this.toggling.set(false);
      },
      error: () => this.toggling.set(false),
    });
  }

  toggleFixturesSync(ls: LeagueSeason): void {
    if (this.togglingSeasonSyncId() !== null) return;
    const league = this.league();
    if (!league) return;
    this.togglingSeasonSyncId.set(ls.id);
    this.leagueService
      .updateLeagueSeason(league.id, ls.id, { fixtures_sync_disabled: !ls.fixtures_sync_disabled })
      .subscribe({
        next: (updated) => {
          this.league.update((l) => {
            if (!l) return l;
            return {
              ...l,
              league_seasons: l.league_seasons.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)),
            };
          });
          this.togglingSeasonSyncId.set(null);
        },
        error: () => this.togglingSeasonSyncId.set(null),
      });
  }

  fitDcParams(ls: LeagueSeason): void {
    const league = this.league();
    if (!league || this.fittingDcId() !== null) return;
    this.fittingDcId.set(ls.id);
    this.leagueService.fitDcParams(league.id, ls.id).subscribe({
      next: () => this.fittingDcId.set(null),
      error: () => this.fittingDcId.set(null),
    });
  }

  predictDc(ls: LeagueSeason): void {
    const league = this.league();
    if (!league || this.predictingDcId() !== null) return;
    this.predictingDcId.set(ls.id);
    this.leagueService.predictDc(league.id, ls.id).subscribe({
      next: () => this.predictingDcId.set(null),
      error: () => this.predictingDcId.set(null),
    });
  }

  toggleShowPastSeasons(): void {
    this.showPastSeasons.update((v) => !v);
  }

  togglePastSeason(id: number): void {
    const next = new Set(this.expandedPastIds());
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this.expandedPastIds.set(next);
  }

  isPastExpanded(id: number): boolean {
    return this.expandedPastIds().has(id);
  }

  seasonStatus(ls: LeagueSeason): 'current' | 'completed' | 'upcoming' {
    if (ls.current) return 'current';
    return new Date(ls.end_date) < new Date() ? 'completed' : 'upcoming';
  }

  coverageChips(coverage: Record<string, unknown>): CoverageChip[] {
    const chips: CoverageChip[] = [];
    for (const [key, value] of Object.entries(coverage)) {
      if (SYSTEM_FIELDS.has(key)) continue;
      if (key === 'fixtures' && value !== null && typeof value === 'object') {
        for (const [sub, subVal] of Object.entries(value as Record<string, unknown>)) {
          if (!SYSTEM_FIELDS.has(sub)) {
            chips.push({ label: toLabel(sub), active: Boolean(subVal) });
          }
        }
      } else {
        chips.push({ label: toLabel(key), active: Boolean(value) });
      }
    }
    return chips;
  }
}
