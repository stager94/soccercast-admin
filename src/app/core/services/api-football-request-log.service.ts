import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiFootballRequestLog } from '../models/api-football-request-log.model';
import { PaginatedResponse } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class ApiFootballRequestLogService {
  private readonly http = inject(HttpClient);

  getAll(page = 1, perPage = 25): Observable<PaginatedResponse<ApiFootballRequestLog>> {
    return this.http.get<PaginatedResponse<ApiFootballRequestLog>>('/admin/api_football_request_logs', {
      params: { page, per_page: perPage },
    });
  }

  getById(id: number | string): Observable<ApiFootballRequestLog> {
    return this.http.get<ApiFootballRequestLog>(`/admin/api_football_request_logs/${id}`);
  }
}
