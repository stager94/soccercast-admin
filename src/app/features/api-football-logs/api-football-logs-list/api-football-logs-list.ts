import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ApiFootballRequestLog } from '../../../core/models/api-football-request-log.model';
import { PaginationMeta } from '../../../core/models/pagination.model';
import { ApiFootballRequestLogService } from '../../../core/services/api-football-request-log.service';
import { Pagination } from '../../../shared/pagination/pagination';

@Component({
  selector: 'app-api-football-logs-list',
  imports: [DatePipe, RouterLink, Pagination],
  templateUrl: './api-football-logs-list.html',
})
export class ApiFootballLogsList implements OnInit {
  private readonly logService = inject(ApiFootballRequestLogService);

  readonly logs = signal<ApiFootballRequestLog[]>([]);
  readonly meta = signal<PaginationMeta | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);

  ngOnInit(): void {
    this.load(1);
  }

  load(page: number): void {
    this.loading.set(true);
    this.logService.getAll(page).subscribe({
      next: (response) => {
        this.logs.set(response.data);
        this.meta.set(response.meta);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  statusClass(status: number): string {
    if (status >= 200 && status < 300) {
      return 'bg-green-50 text-green-600';
    }
    if (status >= 400) {
      return 'bg-red-50 text-red-600';
    }
    return 'bg-gray-100 text-gray-600';
  }
}
