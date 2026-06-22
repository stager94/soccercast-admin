import { DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';

import { ResolutionSlot, RpmSlot } from '../../core/models/api-football-request-log.model';
import { ApiFootballRequestLogService } from '../../core/services/api-football-request-log.service';
import { DashboardService, DashboardStats } from '../../core/services/dashboard.service';
import { ResolutionChart } from './resolution-chart';
import { RpmChart } from './rpm-chart';

function today(): string {
  const d = new Date();
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const RPM_WINDOWS = [15, 30, 60] as const;
type RpmWindow = typeof RPM_WINDOWS[number];

@Component({
  selector: 'app-dashboard',
  imports: [DecimalPipe, ResolutionChart, RpmChart],
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

  // Live RPM
  readonly rpmWindows = RPM_WINDOWS;
  readonly rpmWindow = signal<RpmWindow>(60);
  readonly rpmLiveSlots = signal<RpmSlot[]>([]);
  readonly rpmLiveLoading = signal(false);
  readonly rpmLiveError = signal(false);

  // Daily RPM
  readonly rpmDate = signal(today());
  readonly rpmDailySlots = signal<RpmSlot[]>([]);
  readonly rpmDailyLoading = signal(false);
  readonly rpmDailyError = signal(false);

  ngOnInit(): void {
    this.dashboardService.getStats().subscribe({
      next: (s) => { this.stats.set(s); this.statsLoading.set(false); },
      error: () => this.statsLoading.set(false),
    });
    this.loadChart();
    this.loadLiveRpm();
    this.loadDailyRpm();
  }

  loadChart(): void {
    this.chartLoading.set(true);
    this.chartError.set(false);
    this.logService.getResolutionDistribution(this.chartDate()).subscribe({
      next: (r) => { this.chartSlots.set(r.slots); this.chartLoading.set(false); },
      error: () => { this.chartError.set(true); this.chartLoading.set(false); },
    });
  }

  loadLiveRpm(): void {
    this.rpmLiveLoading.set(true);
    this.rpmLiveError.set(false);
    this.logService.getRpm(this.rpmWindow()).subscribe({
      next: (r) => { this.rpmLiveSlots.set(r.slots); this.rpmLiveLoading.set(false); },
      error: () => { this.rpmLiveError.set(true); this.rpmLiveLoading.set(false); },
    });
  }

  loadDailyRpm(): void {
    this.rpmDailyLoading.set(true);
    this.rpmDailyError.set(false);
    this.logService.getRpm(undefined, this.rpmDate()).subscribe({
      next: (r) => { this.rpmDailySlots.set(r.slots); this.rpmDailyLoading.set(false); },
      error: () => { this.rpmDailyError.set(true); this.rpmDailyLoading.set(false); },
    });
  }

  onDateChange(value: string): void {
    this.chartDate.set(value);
    this.loadChart();
  }

  onRpmWindowChange(w: RpmWindow): void {
    this.rpmWindow.set(w);
    this.loadLiveRpm();
  }

  onRpmDateChange(value: string): void {
    this.rpmDate.set(value);
    this.loadDailyRpm();
  }

  isToday(): boolean {
    return this.chartDate() === today();
  }

  isRpmToday(): boolean {
    return this.rpmDate() === today();
  }

  goToday(): void {
    this.chartDate.set(today());
    this.loadChart();
  }

  goRpmToday(): void {
    this.rpmDate.set(today());
    this.loadDailyRpm();
  }
}
