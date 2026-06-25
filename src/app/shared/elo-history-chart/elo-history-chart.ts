import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';

import { EloHistoryPoint } from '../../core/models/team.model';

// SVG layout constants
const PAD_L = 38;
const PAD_T = 12;
const PAD_B = 20;
const CW = 720;
const CH = 200;
const SVG_W = PAD_L + CW + 10;
const SVG_H = PAD_T + CH + PAD_B;

interface ChartPoint {
  x: number;
  y: number;
  index: number;
  point: EloHistoryPoint;
}

function niceBounds(min: number, max: number): { lo: number; hi: number } {
  if (min === max) return { lo: min - 20, hi: max + 20 };
  const pad = (max - min) * 0.1;
  return { lo: Math.floor((min - pad) / 10) * 10, hi: Math.ceil((max + pad) / 10) * 10 };
}

@Component({
  selector: 'app-elo-history-chart',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './elo-history-chart.html',
})
export class EloHistoryChart {
  readonly points = input.required<EloHistoryPoint[]>();
  readonly hoveredIndex = signal<number | null>(null);

  readonly padL = PAD_L;
  readonly padT = PAD_T;
  readonly cw = CW;
  readonly ch = CH;
  readonly svgW = SVG_W;
  readonly svgH = SVG_H;

  private readonly bounds = computed(() => {
    const values = this.points().map((p) => p.elo_after);
    if (values.length === 0) return { lo: 0, hi: 0 };
    return niceBounds(Math.min(...values), Math.max(...values));
  });

  readonly chartPoints = computed<ChartPoint[]>(() => {
    const pts = this.points();
    const { lo, hi } = this.bounds();
    const span = hi - lo || 1;
    const n = pts.length;
    return pts.map((point, index) => {
      const x = n === 1 ? PAD_L + CW / 2 : PAD_L + (index / (n - 1)) * CW;
      const y = PAD_T + (1 - (point.elo_after - lo) / span) * CH;
      return { x, y, index, point };
    });
  });

  readonly linePath = computed(() => {
    const cps = this.chartPoints();
    if (cps.length === 0) return '';
    return cps.map((cp, i) => `${i === 0 ? 'M' : 'L'}${cp.x.toFixed(1)},${cp.y.toFixed(1)}`).join(' ');
  });

  readonly areaPath = computed(() => {
    const cps = this.chartPoints();
    if (cps.length === 0) return '';
    const base = PAD_T + CH;
    const line = cps.map((cp) => `L${cp.x.toFixed(1)},${cp.y.toFixed(1)}`).join(' ');
    return `M${cps[0].x.toFixed(1)},${base} ${line} L${cps[cps.length - 1].x.toFixed(1)},${base} Z`;
  });

  readonly yTicks = computed(() => {
    const { lo, hi } = this.bounds();
    const steps = 4;
    return Array.from({ length: steps + 1 }, (_, i) => {
      const value = lo + ((hi - lo) * i) / steps;
      const y = PAD_T + (1 - i / steps) * CH;
      return { value: Math.round(value), y };
    });
  });

  readonly slotWidth = computed(() => {
    const n = this.points().length;
    return n <= 1 ? CW : CW / (n - 1);
  });

  readonly hoveredPoint = computed<ChartPoint | null>(() => {
    const i = this.hoveredIndex();
    if (i === null) return null;
    return this.chartPoints()[i] ?? null;
  });

  tooltipStyle(cp: ChartPoint): { left: string; right: string } {
    const ratio = cp.x / SVG_W;
    return ratio > 0.6
      ? { left: 'auto', right: `${(1 - ratio) * 100}%` }
      : { left: `${ratio * 100}%`, right: 'auto' };
  }

  resultColor(result: string | null): string {
    if (result === 'W') return '#16a34a';
    if (result === 'L') return '#dc2626';
    return '#6b7280';
  }
}
