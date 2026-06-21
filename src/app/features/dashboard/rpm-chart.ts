import { Component, computed, input, signal } from '@angular/core';

import { RpmSlot } from '../../core/models/api-football-request-log.model';

// SVG constants
const CPL = 32;
const CPT = 10;
const CW  = 720;
const CH  = 118;
const CPB = 24;
const SVG_W = CPL + CW;
const SVG_H = CPT + CH + CPB;

function niceMax(raw: number): number {
  if (raw === 0) return 10;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  return Math.ceil(raw / mag) * mag;
}

interface ChartPoint { x: number; y: number; slot: RpmSlot; index: number }

@Component({
  selector: 'app-rpm-chart',
  templateUrl: './rpm-chart.html',
})
export class RpmChart {
  readonly slots = input.required<RpmSlot[]>();
  readonly hoveredIndex = signal<number | null>(null);

  readonly svgW = SVG_W;
  readonly svgH = SVG_H;
  readonly cpl  = CPL;
  readonly cpt  = CPT;
  readonly cw   = CW;
  readonly ch   = CH;

  readonly maxVal = computed(() => {
    const raw = Math.max(...this.slots().map(s => s.requests), 0);
    return niceMax(raw);
  });

  readonly peak = computed(() => Math.max(...this.slots().map(s => s.requests), 0));

  readonly avg = computed(() => {
    const slots = this.slots();
    if (!slots.length) return 0;
    const total = slots.reduce((s, sl) => s + sl.requests, 0);
    return total / slots.length;
  });

  readonly chartPoints = computed<ChartPoint[]>(() => {
    const slots = this.slots();
    const max = this.maxVal();
    const N = slots.length;
    if (!N || !max) return [];
    return slots.map((slot, i) => ({
      x: CPL + (i / Math.max(N - 1, 1)) * CW,
      y: CPT + (1 - slot.requests / max) * CH,
      slot,
      index: i,
    }));
  });

  readonly linePath = computed(() => {
    const pts = this.chartPoints();
    if (!pts.length) return '';
    return 'M ' + pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ');
  });

  readonly areaPath = computed(() => {
    const pts = this.chartPoints();
    if (!pts.length) return '';
    const bottom = (CPT + CH).toFixed(1);
    return (
      `M ${pts[0].x.toFixed(1)},${bottom} ` +
      pts.map(p => `L ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') +
      ` L ${pts[pts.length - 1].x.toFixed(1)},${bottom} Z`
    );
  });

  readonly yTicks = computed(() => {
    const max = this.maxVal();
    return [0, 0.5, 1].map(frac => ({
      value: Math.round(max * frac),
      y: CPT + (1 - frac) * CH,
    }));
  });

  readonly xLabels = computed(() => {
    const slots = this.slots();
    const N = slots.length;
    if (!N) return [];
    // show a label every ~10 minutes
    const step = Math.max(1, Math.round(N / 6));
    return slots
      .map((s, i) => ({ time: s.time, x: CPL + (i / Math.max(N - 1, 1)) * CW, i }))
      .filter((_, i) => i % step === 0);
  });

  readonly hoveredPoint = computed(() => {
    const i = this.hoveredIndex();
    return i !== null ? this.chartPoints()[i] : null;
  });

  slotWidth(): number {
    const n = this.slots().length;
    return n > 0 ? CW / n : 0;
  }

  tooltipStyle(pt: ChartPoint): { left: string; right: string } {
    const pct = (pt.x / SVG_W) * 100;
    return pt.x > SVG_W / 2
      ? { left: 'auto', right: `calc(${(100 - pct).toFixed(2)}% + 10px)` }
      : { left: `calc(${pct.toFixed(2)}% + 10px)`, right: 'auto' };
  }
}
