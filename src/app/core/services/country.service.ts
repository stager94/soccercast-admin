import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { Country } from '../models/country.model';
import { PaginatedResponse } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class CountryService {
  private readonly http = inject(HttpClient);

  getAll(
    page = 1,
    perPage = 25,
    enabled?: boolean,
    name?: string,
  ): Observable<PaginatedResponse<Country>> {
    const params: Record<string, string | number | boolean> = { page, per_page: perPage };
    if (enabled !== undefined) params['enabled'] = enabled;
    if (name) params['name'] = name;
    return this.http.get<PaginatedResponse<Country>>('/admin/countries', { params });
  }

  update(id: number, enabled: boolean): Observable<Country> {
    return this.http.patch<Country>(`/admin/countries/${id}`, { country: { enabled } });
  }

  sync(): Observable<void> {
    return this.http.post<void>('/admin/countries/sync', null);
  }
}
