import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { Fixture, FixtureDetail } from '../models/fixture.model';
import { PaginatedResponse } from '../models/pagination.model';

export interface FixturesFilter {
  page?: number;
  status?: string[];
  round?: string;
  date?: string;
}

@Injectable({ providedIn: 'root' })
export class FixtureService {
  private readonly http = inject(HttpClient);

  getByDate(date: string, filter: { status?: string[] } = {}): Observable<{ data: Fixture[] }> {
    const params: Record<string, string | string[]> = { date };
    if (filter.status?.length) params['status[]'] = filter.status;
    return this.http.get<{ data: Fixture[] }>('/admin/fixtures', { params });
  }

  getAll(
    leagueId: number | string,
    seasonId: number | string,
    filter: FixturesFilter = {},
  ): Observable<PaginatedResponse<Fixture>> {
    const params: Record<string, string | number | string[]> = { page: filter.page ?? 1, per_page: 25 };
    if (filter.status?.length) params['status[]'] = filter.status;
    if (filter.round) params['round'] = filter.round;
    if (filter.date) params['date'] = filter.date;
    return this.http.get<PaginatedResponse<Fixture>>(
      `/admin/leagues/${leagueId}/seasons/${seasonId}/fixtures`,
      { params },
    );
  }

  getRounds(leagueId: number | string, seasonId: number | string): Observable<{ data: string[] }> {
    return this.http.get<{ data: string[] }>(
      `/admin/leagues/${leagueId}/seasons/${seasonId}/fixtures/rounds`,
    );
  }

  getById(id: number | string): Observable<FixtureDetail> {
    return this.http.get<FixtureDetail>(`/admin/fixtures/${id}`);
  }

  retroSync(leagueId: number): Observable<void> {
    return this.http.post<void>('/admin/fixtures/retro_sync', { league_id: leagueId });
  }

  syncDetails(id: number | string): Observable<void> {
    return this.http.post<void>(`/admin/fixtures/${id}/sync_details`, {});
  }

  syncEvents(id: number | string): Observable<void> {
    return this.http.post<void>(`/admin/fixtures/${id}/sync_events`, {});
  }

  syncLineups(id: number | string): Observable<void> {
    return this.http.post<void>(`/admin/fixtures/${id}/sync_lineups`, {});
  }

  syncStatistics(id: number | string): Observable<void> {
    return this.http.post<void>(`/admin/fixtures/${id}/sync_statistics`, {});
  }

  syncPlayerStatistics(id: number | string): Observable<void> {
    return this.http.post<void>(`/admin/fixtures/${id}/sync_player_statistics`, {});
  }

  syncSeasonFixtures(leagueId: number | string, seasonId: number | string): Observable<void> {
    return this.http.post<void>(`/admin/leagues/${leagueId}/seasons/${seasonId}/sync_fixtures`, {});
  }
}
