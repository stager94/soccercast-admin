import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { Season } from '../models/season.model';
import { PaginatedResponse } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class SeasonService {
  private readonly http = inject(HttpClient);

  getAll(page = 1, perPage = 25): Observable<PaginatedResponse<Season>> {
    return this.http.get<PaginatedResponse<Season>>('/admin/seasons', {
      params: { page, per_page: perPage },
    });
  }

  update(id: number, enabled: boolean): Observable<Season> {
    return this.http.patch<Season>(`/admin/seasons/${id}`, { season: { enabled } });
  }

  sync(): Observable<void> {
    return this.http.post<void>('/admin/seasons/sync', null);
  }
}
