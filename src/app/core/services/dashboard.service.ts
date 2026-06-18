import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface DashboardStats {
  countries: number;
  leagues: number;
  seasons: number;
  league_seasons: number;
  league_seasons_without_fixtures: number;
  fixtures: number;
  live_fixtures: number;
  venues: number;
  teams: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>('/admin/stats');
  }
}
