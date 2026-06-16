import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { League, LeagueDetail } from '../models/league.model';
import { PaginatedResponse } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class LeagueService {
  private readonly http = inject(HttpClient);

  getAll(
    page = 1,
    perPage = 25,
    enabled?: boolean,
    name?: string,
    countryId?: number,
  ): Observable<PaginatedResponse<League>> {
    const params: Record<string, string | number | boolean> = { page, per_page: perPage };
    if (enabled !== undefined) params['enabled'] = enabled;
    if (name) params['name'] = name;
    if (countryId !== undefined) params['country'] = countryId;
    return this.http.get<PaginatedResponse<League>>('/admin/leagues', { params });
  }

  getById(id: string | number): Observable<LeagueDetail> {
    return this.http.get<LeagueDetail>(`/admin/leagues/${id}`);
  }

  update(id: number, enabled: boolean): Observable<League> {
    return this.http.patch<League>(`/admin/leagues/${id}`, { league: { enabled } });
  }

  sync(): Observable<void> {
    return this.http.post<void>('/admin/leagues/sync', null);
  }
}
