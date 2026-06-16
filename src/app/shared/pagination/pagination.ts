import { Component, computed, input, output } from '@angular/core';

import { PaginationMeta } from '../../core/models/pagination.model';

@Component({
  selector: 'app-pagination',
  imports: [],
  templateUrl: './pagination.html',
})
export class Pagination {
  readonly meta = input.required<PaginationMeta>();
  readonly pageChange = output<number>();

  readonly rangeStart = computed(() => {
    const meta = this.meta();
    return meta.total_count === 0 ? 0 : (meta.page - 1) * meta.per_page + 1;
  });

  readonly rangeEnd = computed(() => {
    const meta = this.meta();
    return Math.min(meta.page * meta.per_page, meta.total_count);
  });

  readonly pages = computed<(number | '…')[]>(() => {
    const { page, total_pages } = this.meta();

    if (total_pages <= 7) {
      return Array.from({ length: total_pages }, (_, i) => i + 1);
    }

    const candidates = new Set<number>([1, total_pages, page - 1, page, page + 1]);
    const sorted = [...candidates].filter((p) => p >= 1 && p <= total_pages).sort((a, b) => a - b);

    const result: (number | '…')[] = [];
    let previous = 0;
    for (const p of sorted) {
      if (previous && p - previous > 1) {
        result.push('…');
      }
      result.push(p);
      previous = p;
    }
    return result;
  });

  goTo(page: number): void {
    const meta = this.meta();
    if (page < 1 || page > meta.total_pages || page === meta.page) {
      return;
    }
    this.pageChange.emit(page);
  }
}
