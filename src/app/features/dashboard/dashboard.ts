import { DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';

import { ResolutionSlot } from '../../core/models/api-football-request-log.model';
import { ApiFootballRequestLogService } from '../../core/services/api-football-request-log.service';
import { DashboardService, DashboardStats } from '../../core/services/dashboard.service';
import { ResolutionChart } from './resolution-chart';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

@Component({
  selector: 'app-dashboard',
  imports: [DecimalPipe, ResolutionChart],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly logService = inject(ApiFootballRequestLogService);

  readonly stats = signal<DashboardStats | null>(null);
  readonly statsLoading = signal(true);

  readonly chartDate = signal(today());
  readonly chartSlots = signal<ResolutionSlot[]>([]);
  readonly chartLoading = signal(false);
  readonly chartError = signal(false);

  ngOnInit(): void {
    this.dashboardService.getStats().subscribe({
      next: (s) => { this.stats.set(s); this.statsLoading.set(false); },
      error: () => this.statsLoading.set(false),
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
