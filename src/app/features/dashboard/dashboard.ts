import { Component, OnInit, inject, signal } from '@angular/core';

import { CountryService } from '../../core/services/country.service';

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  private readonly countryService = inject(CountryService);

  readonly countriesCount = signal<number | null>(null);

  ngOnInit(): void {
    this.countryService.getAll(1, 1).subscribe({
      next: (response) => this.countriesCount.set(response.meta.total_count),
      error: () => this.countriesCount.set(null),
    });
  }
}
