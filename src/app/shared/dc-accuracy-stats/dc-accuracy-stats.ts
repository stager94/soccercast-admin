import { Component, OnChanges, SimpleChanges, inject, input, signal } from '@angular/core';

import { DcStats } from '../../core/models/league.model';
import { LeagueService } from '../../core/services/league.service';

interface MarketRow {
  label: string;
  correct: number;
  total: number;
  accuracy: number | null;
}

const MARKET_LABELS: Record<string, string> = {
  '1x2':       '1X2',
  'over_0.5':  'Over / Under 0.5',
  'over_1.5':  'Over / Under 1.5',
  'over_2.5':  'Over / Under 2.5',
  'over_3.5':  'Over / Under 3.5',
  'over_4.5':  'Over / Under 4.5',
  'btts':      'BTTS',
};

const MARKET_ORDER = ['1x2', 'over_0.5', 'over_1.5', 'over_2.5', 'over_3.5', 'over_4.5', 'btts'];

@Component({
  selector: 'app-dc-accuracy-stats',
  templateUrl: './dc-accuracy-stats.html',
})
export class DcAccuracyStats implements OnChanges {
  private readonly leagueService = inject(LeagueService);

  readonly leagueId = input.required<number>();
  readonly seasonId = input.required<number>();

  readonly stats   = signal<DcStats | null>(null);
  readonly loading = signal(false);
  readonly error   = signal(false);
  readonly open    = signal(false);

  readonly rows = signal<MarketRow[]>([]);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['seasonId']) {
      this.stats.set(null);
      this.open.set(false);
    }
  }

  toggle(): void {
    this.open.update(v => !v);
    if (this.open() && !this.stats()) {
      this.load();
    }
  }

  reload(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.leagueService.getDcStats(this.leagueId(), this.seasonId()).subscribe({
      next: (data) => {
        this.stats.set(data);
        this.rows.set(this.buildRows(data));
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  private buildRows(data: DcStats): MarketRow[] {
    return MARKET_ORDER
      .filter(key => key in data.markets)
      .map(key => ({
        label:    MARKET_LABELS[key] ?? key,
        correct:  data.markets[key].correct,
        total:    data.markets[key].total,
        accuracy: data.markets[key].accuracy,
      }));
  }

  pct(value: number | null): string {
    if (value === null) return '—';
    return (value * 100).toFixed(1) + '%';
  }

  barWidth(value: number | null): string {
    if (value === null) return '0%';
    return (value * 100).toFixed(1) + '%';
  }

  barColor(value: number | null): string {
    if (value === null) return 'bg-gray-200';
    if (value >= 0.65) return 'bg-green-500';
    if (value >= 0.50) return 'bg-yellow-400';
    return 'bg-red-400';
  }
}
