import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { DcStats, League, LeagueDetail, LeagueSeason } from '../models/league.model';
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
    national?: boolean,
    women?: boolean,
  ): Observable<PaginatedResponse<League>> {
    const params: Record<string, string | number | boolean> = { page, per_page: perPage };
    if (enabled !== undefined) params['enabled'] = enabled;
    if (name) params['name'] = name;
    if (countryId !== undefined) params['country'] = countryId;
    if (national !== undefined) params['national'] = national;
    if (women !== undefined) params['women'] = women;
    return this.http.get<PaginatedResponse<League>>('/admin/leagues', { params });
  }

  getById(id: string | number): Observable<LeagueDetail> {
    return this.http.get<LeagueDetail>(`/admin/leagues/${id}`);
  }

  update(id: number, data: Partial<Pick<League, 'enabled' | 'women' | 'national'>>): Observable<League> {
    return this.http.patch<League>(`/admin/leagues/${id}`, { league: data });
  }

  updateLeagueSeason(
    leagueId: number,
    seasonId: number,
    data: Partial<Pick<LeagueSeason, 'fixtures_sync_disabled'>>,
  ): Observable<LeagueSeason> {
    return this.http.patch<LeagueSeason>(`/admin/leagues/${leagueId}/seasons/${seasonId}`, {
      league_season: data,
    });
  }

  fitDcParams(leagueId: number, seasonId: number): Observable<void> {
    return this.http.post<void>(`/admin/leagues/${leagueId}/seasons/${seasonId}/fit_dc_params`, null);
  }

  predictDc(leagueId: number, seasonId: number): Observable<void> {
    return this.http.post<void>(`/admin/leagues/${leagueId}/seasons/${seasonId}/predict_dc`, null);
  }

  backtestDc(leagueId: number, seasonId: number): Observable<void> {
    return this.http.post<void>(`/admin/leagues/${leagueId}/seasons/${seasonId}/backtest_dc`, null);
  }

  getDcStats(leagueId: number, seasonId: number): Observable<DcStats> {
    return this.http.get<DcStats>(`/admin/leagues/${leagueId}/seasons/${seasonId}/dc_stats`);
  }

  sync(): Observable<void> {
    return this.http.post<void>('/admin/leagues/sync', null);
  }
}
