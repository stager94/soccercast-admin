import { Component, computed, input } from '@angular/core';

import { FixtureLineupPlayer, FixtureLineupTeam } from '../../core/models/fixture.model';

interface PlayerOnPitch {
  player: FixtureLineupPlayer;
  x: number;
  y: number;
}

@Component({
  selector: 'app-lineup-columns',
  templateUrl: './lineup-columns.html',
})
export class LineupColumns {
  readonly home = input.required<FixtureLineupTeam>();
  readonly away = input.required<FixtureLineupTeam>();

  readonly homePlayers = computed(() => this.positionPlayers(this.home().start_xi, 'home'));
  readonly awayPlayers = computed(() => this.positionPlayers(this.away().start_xi, 'away'));

  private parseGrid(grid: string | null): { row: number; col: number } | null {
    if (!grid) return null;
    const parts = grid.split(':').map(Number);
    if (parts.length !== 2 || parts.some(isNaN)) return null;
    return { row: parts[0], col: parts[1] };
  }

  private positionPlayers(players: FixtureLineupPlayer[], side: 'home' | 'away'): PlayerOnPitch[] {
    const withGrid = players
      .map(p => ({ player: p, grid: this.parseGrid(p.grid) }))
      .filter((p): p is { player: FixtureLineupPlayer; grid: { row: number; col: number } } => p.grid !== null);

    if (!withGrid.length) return [];

    const maxRow = Math.max(...withGrid.map(p => p.grid.row));
    const byRow = new Map<number, typeof withGrid>();
    for (const p of withGrid) {
      if (!byRow.has(p.grid.row)) byRow.set(p.grid.row, []);
      byRow.get(p.grid.row)!.push(p);
    }

    const result: PlayerOnPitch[] = [];
    for (const [row, rowPlayers] of byRow.entries()) {
      const rowFrac = (row - 1) / Math.max(maxRow - 1, 1);
      // Home: GK at 8%, forwards at 43%. Away: GK at 92%, forwards at 57%.
      const x = side === 'home' ? 8 + rowFrac * 35 : 92 - rowFrac * 35;

      rowPlayers.sort((a, b) => a.grid.col - b.grid.col);
      const n = rowPlayers.length;
      // margin shrinks as more players fill the line so extremes reach the touchline
      const margin = n === 1 ? 50 : n === 2 ? 30 : n === 3 ? 20 : Math.max(10, 24 - n * 4);
      for (let i = 0; i < n; i++) {
        const yFrac = n === 1 ? 0.5 : i / (n - 1);
        result.push({ player: rowPlayers[i].player, x, y: margin + yFrac * (100 - 2 * margin) });
      }
    }
    return result;
  }

  shortName(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length <= 1) return name;
    return parts[0][0] + '. ' + parts.slice(1).join(' ');
  }

  maxLen(a: unknown[], b: unknown[]): number {
    return Math.max(a.length, b.length);
  }

  range(n: number): number[] {
    return Array.from({ length: n }, (_, i) => i);
  }
}
