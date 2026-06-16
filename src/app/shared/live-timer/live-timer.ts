import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-live-timer',
  template: `<span class="font-mono text-xs font-semibold text-red-600">{{ display() }}</span>`,
})
export class LiveTimer {
  readonly elapsed = input<number | null>(null);
  readonly extra = input<number | null>(null);

  readonly display = computed(() => {
    const e = this.elapsed();
    if (e === null) return '';
    const x = this.extra();
    return x ? `${e}'+${x}` : `${e}'`;
  });
}
