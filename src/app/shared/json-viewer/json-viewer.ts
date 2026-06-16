import { Component, OnInit, computed, input, signal } from '@angular/core';

@Component({
  selector: 'app-json-viewer',
  imports: [JsonViewer],
  templateUrl: './json-viewer.html',
  host: { style: 'display: contents' },
})
export class JsonViewer implements OnInit {
  readonly value = input.required<unknown>();
  /** Key label to display before the value. Null = root or array item (no label). */
  readonly entryKey = input<string | null>(null);
  readonly depth = input<number>(0);

  readonly collapsed = signal(false);

  ngOnInit(): void {
    if (this.depth() >= 2 && this.isCollapsible()) {
      this.collapsed.set(true);
    }
  }

  readonly isCollapsible = computed(() => {
    const v = this.value();
    return v !== null && typeof v === 'object';
  });

  readonly isEmpty = computed(() => {
    if (!this.isCollapsible()) return false;
    return this.entries().length === 0;
  });

  readonly isArray = computed(() => Array.isArray(this.value()));

  readonly entries = computed<{ key: string; value: unknown }[]>(() => {
    const v = this.value();
    if (v === null || typeof v !== 'object') return [];
    if (Array.isArray(v)) {
      return (v as unknown[]).map((item, i) => ({ key: String(i), value: item }));
    }
    return Object.entries(v as Record<string, unknown>).map(([k, val]) => ({ key: k, value: val }));
  });

  readonly valueType = computed(() => {
    const v = this.value();
    if (v === null) return 'null';
    if (Array.isArray(v)) return 'array';
    return typeof v;
  });

  readonly openBracket = computed(() => (this.isArray() ? '[' : '{'));
  readonly closeBracket = computed(() => (this.isArray() ? ']' : '}'));

  toggle(): void {
    this.collapsed.update((c) => !c);
  }
}
