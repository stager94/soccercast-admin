import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { Country } from '../models/country.model';
import { PaginatedResponse } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class CountryService {
  private readonly http = inject(HttpClient);

  getAll(page = 1, perPage = 25): Observable<PaginatedResponse<Country>> {
    return this.http.get<PaginatedResponse<Country>>('/admin/countries', {
      params: { page, per_page: perPage },
    });
  }
}
