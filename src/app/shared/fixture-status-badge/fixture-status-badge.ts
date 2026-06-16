import { Component, computed, input } from '@angular/core';

import { FINISHED_STATUSES, LIVE_STATUSES, FixtureStatus } from '../../core/models/fixture.model';

@Component({
  selector: 'app-fixture-status-badge',
  template: `
    @switch (category()) {
      @case ('live') {
        <span class="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-600">
          <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500"></span>
          {{ status() }}
        </span>
      }
      @case ('finished') {
        <span class="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
          <span class="h-1.5 w-1.5 rounded-full bg-green-500"></span>
          {{ label() }}
        </span>
      }
      @case ('postponed') {
        <span class="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-600">
          ⚠ {{ status() }}
        </span>
      }
      @default {
        <span class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
          <span class="h-1.5 w-1.5 rounded-full bg-gray-400"></span>
          {{ status() }}
        </span>
      }
    }
  `,
})
export class FixtureStatusBadge {
  readonly status = input.required<FixtureStatus>();

  readonly category = computed(() => {
    const s = this.status();
    if (LIVE_STATUSES.includes(s)) return 'live';
    if (FINISHED_STATUSES.includes(s)) return 'finished';
    if (['PST', 'CANC', 'ABD'].includes(s)) return 'postponed';
    return 'upcoming';
  });

  readonly label = computed(() => {
    const s = this.status();
    if (s === 'AET') return 'FT (AET)';
    if (s === 'PEN') return 'FT (PEN)';
    return s;
  });
}
