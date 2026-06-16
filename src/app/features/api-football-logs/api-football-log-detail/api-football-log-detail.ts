import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { ApiFootballRequestLog } from '../../../core/models/api-football-request-log.model';
import { ApiFootballRequestLogService } from '../../../core/services/api-football-request-log.service';

@Component({
  selector: 'app-api-football-log-detail',
  imports: [DatePipe, RouterLink],
  templateUrl: './api-football-log-detail.html',
})
export class ApiFootballLogDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly logService = inject(ApiFootballRequestLogService);

  readonly log = signal<ApiFootballRequestLog | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;

    this.logService.getById(id).subscribe({
      next: (log) => {
        this.log.set(log);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  formatJson(value: unknown): string {
    if (value == null) {
      return '—';
    }

    if (typeof value === 'string') {
      try {
        return JSON.stringify(JSON.parse(value), null, 2);
      } catch {
        return value;
      }
    }

    return JSON.stringify(value, null, 2);
  }
}
