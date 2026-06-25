import { DatePipe, DecimalPipe, PercentPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';

import { FixtureXgPrediction } from '../../core/models/fixture.model';

interface ProbRow {
  label: string;
  prob: number | null;
}

interface TotalsRow {
  line: string;
  over: number;
  under: number;
}

@Component({
  selector: 'app-xg-prediction',
  imports: [DatePipe, DecimalPipe, PercentPipe],
  templateUrl: './xg-prediction.html',
})
export class XgPrediction {
  readonly prediction = input.required<FixtureXgPrediction>();
  readonly homeName = input.required<string>();
  readonly awayName = input.required<string>();

  readonly resultRows = computed<ProbRow[]>(() => {
    const p = this.prediction();
    return [
      { label: `${this.homeName()} win`, prob: p.result.home },
      { label: 'Draw', prob: p.result.draw },
      { label: `${this.awayName()} win`, prob: p.result.away },
    ];
  });

  readonly totalsRows = computed<TotalsRow[]>(() => {
    const totals = this.prediction().markets?.totals ?? {};
    return Object.keys(totals)
      .sort((a, b) => parseFloat(a) - parseFloat(b))
      .map((line) => ({ line, over: totals[line].over, under: totals[line].under }));
  });

  confidenceClass(): string {
    switch (this.prediction().confidence.label) {
      case 'high':
        return 'bg-green-100 text-green-700';
      case 'medium':
        return 'bg-amber-100 text-amber-700';
      case 'low':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-500';
    }
  }

  // Width (%) for the home portion of a two-way probability bar.
  homeShare(home: number | null, away: number | null): number {
    const h = home ?? 0;
    const a = away ?? 0;
    const sum = h + a;
    return sum > 0 ? Math.round((h / sum) * 100) : 50;
  }
}
