import { Component, computed, input } from '@angular/core';

import { FixturePlayerStat, FixturePlayerStatsTeam } from '../../core/models/fixture.model';

@Component({
  selector: 'app-player-stats-table',
  templateUrl: './player-stats-table.html',
})
export class PlayerStatsTable {
  readonly teams = input.required<FixturePlayerStatsTeam[]>();

  ratingClass(rating: string | null): string {
    if (!rating) return 'text-gray-400';
    const n = parseFloat(rating);
    if (n >= 8.0) return 'font-semibold text-green-600';
    if (n >= 7.0) return 'font-semibold text-amber-500';
    return 'text-gray-500';
  }

  dribbles(p: FixturePlayerStat): string {
    if (p.dribbles_attempts === null && p.dribbles_success === null) return '—';
    return `${p.dribbles_success ?? 0}/${p.dribbles_attempts ?? 0}`;
  }

  val(n: number | null): string {
    return n === null ? '—' : String(n);
  }
}
