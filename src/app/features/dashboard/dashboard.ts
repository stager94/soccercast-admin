import { Component, OnInit, inject, signal } from '@angular/core';

import { ResolutionSlot } from '../../core/models/api-football-request-log.model';
import { ApiFootballRequestLogService } from '../../core/services/api-football-request-log.service';
import { CountryService } from '../../core/services/country.service';
import { ResolutionChart } from './resolution-chart';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

@Component({
  selector: 'app-dashboard',
  imports: [ResolutionChart],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  private readonly countryService = inject(CountryService);
  private readonly logService = inject(ApiFootballRequestLogService);

  readonly countriesCount = signal<number | null>(null);

  readonly chartDate = signal(today());
  readonly chartSlots = signal<ResolutionSlot[]>([]);
  readonly chartLoading = signal(false);
  readonly chartError = signal(false);


  ngOnInit(): void {
    this.countryService.getAll(1, 1).subscribe({
      next: (r) => this.countriesCount.set(r.meta.total_count),
      error: () => this.countriesCount.set(null),
    });
    this.loadChart();
  }

  loadChart(): void {
    this.chartLoading.set(true);
    this.chartError.set(false);
    this.logService.getResolutionDistribution(this.chartDate()).subscribe({
      next: (r) => { this.chartSlots.set(r.slots); this.chartLoading.set(false); },
      error: () => { this.chartError.set(true); this.chartLoading.set(false); },
    });
  }

  onDateChange(value: string): void {
    this.chartDate.set(value);
    this.loadChart();
  }

  isToday(): boolean {
    return this.chartDate() === today();
  }

  goToday(): void {
    this.chartDate.set(today());
    this.loadChart();
  }
}
