import { Component, computed, input, signal } from '@angular/core';

import { ResolutionSlot } from '../../core/models/api-football-request-log.model';

const RESOLUTION_KEYS = ['ok', 'rateLimit', 'requests', 'plan'] as const;

const COLORS: Record<string, string> = {
  ok: '#22c55e',
  rateLimit: '#f97316',
  requests: '#ef4444',
  plan: '#a855f7',
};

const LABELS: Record<string, string> = {
  ok: 'OK',
  rateLimit: 'Rate limit',
  requests: 'Daily limit',
  plan: 'Plan',
};

// SVG area chart constants
const CPL = 32;   // padding left (y labels)
const CPT = 10;   // padding top
const CW  = 720;  // chart width  — wider → better native aspect ratio, no text distortion
const CH  = 118;  // chart height
const CPB = 24;   // padding bottom (x labels)
const SVG_W = CPL + CW;
const SVG_H = CPT + CH + CPB;

function niceMax(raw: number): number {
  if (raw === 0) return 10;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  return Math.ceil(raw / mag) * mag;
}

interface Stat { key: string; label: string; color: string; count: number; pct: number }
interface ChartPoint { x: number; y: number; total: number; slot: ResolutionSlot; index: number }

@Component({
  selector: 'app-resolution-chart',
  templateUrl: './resolution-chart.html',
})
export class ResolutionChart {
  readonly slots = input.required<ResolutionSlot[]>();
  readonly hoveredIndex = signal<number | null>(null);

  // expose SVG constants to template
  readonly svgW = SVG_W;
  readonly svgH = SVG_H;
  readonly cpl = CPL;
  readonly cpt = CPT;
  readonly cw  = CW;
  readonly ch  = CH;

  readonly grand = computed(() =>
    this.slots().reduce(
      (s, slot) => s + RESOLUTION_KEYS.reduce((ss, k) => ss + ((slot[k] as number) ?? 0), 0),
      0,
    ),
  );

  readonly stats = computed<Stat[]>(() => {
    const slots = this.slots();
    const grand = this.grand();
    return RESOLUTION_KEYS.map((key) => {
      const count = slots.reduce((s, slot) => s + ((slot[key] as number) ?? 0), 0);
      return {
        key,
        label: LABELS[key],
        color: COLORS[key],
        count,
        pct: grand > 0 ? (count / grand) * 100 : 0,
      };
    }).filter(s => s.count > 0);
  });

  readonly maxTotal = computed(() => {
    const raw = Math.max(
      ...this.slots().map((s) =>
        RESOLUTION_KEYS.reduce((sum, k) => sum + ((s[k] as number) ?? 0), 0),
      ),
      0,
    );
    return niceMax(raw);
  });

  readonly chartPoints = computed<ChartPoint[]>(() => {
    const slots = this.slots();
    const max = this.maxTotal();
    const N = slots.length;
    if (N === 0 || max === 0) return [];
    return slots.map((slot, i) => {
      const total = RESOLUTION_KEYS.reduce((s, k) => s + ((slot[k] as number) ?? 0), 0);
      const x = CPL + (i / Math.max(N - 1, 1)) * CW;
      const y = CPT + (1 - total / max) * CH;
      return { x, y, total, slot, index: i };
    });
  });

  readonly errorLinePath = computed(() => {
    const slots = this.slots();
    const max = this.maxTotal();
    const N = slots.length;
    if (N === 0 || max === 0) return '';
    return (
      'M ' +
      slots
        .map((slot, i) => {
          const err = RESOLUTION_KEYS.filter((k) => k !== 'ok').reduce(
            (s, k) => s + ((slot[k] as number) ?? 0),
            0,
          );
          const x = CPL + (i / Math.max(N - 1, 1)) * CW;
          const y = CPT + (1 - err / max) * CH;
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(' L ')
    );
  });

  readonly linePath = computed(() => {
    const pts = this.chartPoints();
    if (!pts.length) return '';
    return 'M ' + pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ');
  });

  readonly areaPath = computed(() => {
    const pts = this.chartPoints();
    if (!pts.length) return '';
    const bottom = (CPT + CH).toFixed(1);
    return (
      `M ${pts[0].x.toFixed(1)},${bottom} ` +
      pts.map((p) => `L ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') +
      ` L ${pts[pts.length - 1].x.toFixed(1)},${bottom} Z`
    );
  });

  readonly yTicks = computed(() => {
    const max = this.maxTotal();
    return [0, 0.5, 1].map((frac) => ({
      value: Math.round(max * frac),
      y: CPT + (1 - frac) * CH,
    }));
  });

  readonly xLabels = computed(() => {
    const slots = this.slots();
    const N = slots.length;
    if (!N) return [];
    return slots
      .map((s, i) => ({
        time: s.time,
        x: CPL + (i / Math.max(N - 1, 1)) * CW,
        i,
      }))
      .filter((_, i) => i % 6 === 0);
  });

  readonly hoveredPoint = computed(() => {
    const i = this.hoveredIndex();
    return i !== null ? this.chartPoints()[i] : null;
  });

  slotWidth(): number {
    const n = this.slots().length;
    return n > 0 ? CW / n : 0;
  }

  colorOf(key: string): string { return COLORS[key] ?? '#94a3b8'; }
  labelOf(key: string): string { return LABELS[key] ?? key; }

  tooltipAnchor(pt: ChartPoint): { left: string; right: string } {
    const offsetRight = pt.x > SVG_W / 2;
    return offsetRight
      ? { left: `${(pt.x - 8).toFixed(1)}px`, right: 'auto' }
      : { left: `${(pt.x + 8).toFixed(1)}px`, right: 'auto' };
  }

  tooltipTransform(pt: ChartPoint): string {
    return pt.x > SVG_W / 2 ? 'translateX(-100%)' : 'translateX(0)';
  }
}
