import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { PaginatedResponse } from '../models/pagination.model';
import { TeamDetail, TeamListItem } from '../models/team.model';

export interface TeamsFilter {
  page?: number;
  per_page?: number;
  name?: string;
  national?: boolean;
  women?: boolean;
}

@Injectable({ providedIn: 'root' })
export class TeamService {
  private readonly http = inject(HttpClient);

  getAll(filter: TeamsFilter = {}): Observable<PaginatedResponse<TeamListItem>> {
    const params: Record<string, string | number> = {
      page: filter.page ?? 1,
      per_page: filter.per_page ?? 25,
    };
    if (filter.name) params['name'] = filter.name;
    if (filter.national !== undefined) params['national'] = String(filter.national);
    if (filter.women !== undefined) params['women'] = String(filter.women);
    return this.http.get<PaginatedResponse<TeamListItem>>('/admin/teams', { params });
  }

  getById(id: number | string): Observable<TeamDetail> {
    return this.http.get<TeamDetail>(`/admin/teams/${id}`);
  }
}
