import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { ApiFootballRequestLog } from '../../../core/models/api-football-request-log.model';
import { ApiFootballRequestLogService } from '../../../core/services/api-football-request-log.service';
import { JsonViewer } from '../../../shared/json-viewer/json-viewer';

export type LogTab = 'request_headers' | 'request_body' | 'response_headers' | 'response_body';

export const LOG_TABS: { id: LogTab; label: string }[] = [
  { id: 'request_headers', label: 'Request Headers' },
  { id: 'request_body', label: 'Request Body' },
  { id: 'response_headers', label: 'Response Headers' },
  { id: 'response_body', label: 'Response Body' },
];

@Component({
  selector: 'app-api-football-log-detail',
  imports: [DatePipe, RouterLink, JsonViewer],
  templateUrl: './api-football-log-detail.html',
})
export class ApiFootballLogDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly logService = inject(ApiFootballRequestLogService);

  readonly log = signal<ApiFootballRequestLog | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly activeTab = signal<LogTab>('request_headers');

  readonly tabs = LOG_TABS;

  readonly parsedRequestBody = computed(() => this.parseBody(this.log()?.request_body ?? null));
  readonly parsedResponseBody = computed(() => this.parseBody(this.log()?.response_body ?? null));

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

  private parseBody(body: string | null): unknown {
    if (body === null) return null;
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  }
}
