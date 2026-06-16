import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';

import { Country } from '../../../core/models/country.model';
import { PaginationMeta } from '../../../core/models/pagination.model';
import { CountryService } from '../../../core/services/country.service';
import { Pagination } from '../../../shared/pagination/pagination';

@Component({
  selector: 'app-countries-list',
  imports: [DatePipe, Pagination],
  templateUrl: './countries-list.html',
})
export class CountriesList implements OnInit {
  private readonly countryService = inject(CountryService);

  readonly countries = signal<Country[]>([]);
  readonly meta = signal<PaginationMeta | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);

  ngOnInit(): void {
    this.load(1);
  }

  load(page: number): void {
    this.loading.set(true);
    this.countryService.getAll(page).subscribe({
      next: (response) => {
        this.countries.set(response.data);
        this.meta.set(response.meta);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }
}
