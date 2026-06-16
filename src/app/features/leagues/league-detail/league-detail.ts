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
    this.leagueService.update(current.id, !current.enabled).subscribe({
      next: (updated: League) => {
        this.league.update((l) => (l ? { ...l, ...updated } : l));
        this.toggling.set(false);
      },
      error: () => this.toggling.set(false),
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
