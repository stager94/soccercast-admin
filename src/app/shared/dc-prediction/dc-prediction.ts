import { DatePipe, DecimalPipe, PercentPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';

import { FixtureDcPrediction } from '../../core/models/fixture.model';

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
  selector: 'app-dc-prediction',
  imports: [DatePipe, DecimalPipe, PercentPipe],
  templateUrl: './dc-prediction.html',
})
export class DcPrediction {
  readonly prediction = input.required<FixtureDcPrediction>();
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
}
