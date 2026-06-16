import { Component, computed, input } from '@angular/core';

import { FixtureStatistic } from '../../core/models/fixture.model';

interface StatRow {
  type: string;
  homeRaw: string;
  awayRaw: string;
  homeWidth: number;
  awayWidth: number;
}

function toNumber(v: string | number | null): number {
  if (v === null || v === undefined) return 0;
  const n = parseFloat(String(v).replace('%', ''));
  return isNaN(n) ? 0 : n;
}

function rawLabel(v: string | number | null): string {
  if (v === null || v === undefined) return '—';
  return String(v);
}

@Component({
  selector: 'app-statistics-compare',
  templateUrl: './statistics-compare.html',
})
export class StatisticsCompare {
  readonly statistics = input.required<FixtureStatistic[]>();
  readonly homeName = input.required<string>();
  readonly awayName = input.required<string>();

  readonly rows = computed<StatRow[]>(() =>
    this.statistics().map((s) => {
      const h = toNumber(s.home_value);
      const a = toNumber(s.away_value);
      const sum = h + a || 1;
      const isPct = String(s.home_value ?? '').includes('%');
      return {
        type: s.type,
        homeRaw: rawLabel(s.home_value),
        awayRaw: rawLabel(s.away_value),
        homeWidth: isPct ? h : Math.round((h / sum) * 100),
        awayWidth: isPct ? a : Math.round((a / sum) * 100),
      };
    }),
  );
}
