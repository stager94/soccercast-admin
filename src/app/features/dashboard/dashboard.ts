import { DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';

import { ResolutionSlot, RpmSlot } from '../../core/models/api-football-request-log.model';
import { ApiFootballRequestLogService } from '../../core/services/api-football-request-log.service';
import { DashboardService, DashboardStats } from '../../core/services/dashboard.service';
import { ResolutionChart } from './resolution-chart';
import { RpmChart } from './rpm-chart';

function today(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const RPM_WINDOWS = [15, 30, 60] as const;
type RpmWindow = typeof RPM_WINDOWS[number];
type RpmMode = 'live' | 'daily';

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

  readonly rpmWindows = RPM_WINDOWS;
  readonly rpmWindow = signal<RpmWindow>(60);
  readonly rpmMode = signal<RpmMode>('live');
  readonly rpmDate = signal(today());
  readonly rpmSlots = signal<RpmSlot[]>([]);
  readonly rpmLoading = signal(false);
  readonly rpmError = signal(false);

  ngOnInit(): void {
    this.dashboardService.getStats().subscribe({
      next: (s) => { this.stats.set(s); this.statsLoading.set(false); },
      error: () => this.statsLoading.set(false),
    });
    this.loadChart();
    this.loadRpm();
  }

  loadChart(): void {
    this.chartLoading.set(true);
    this.chartError.set(false);
    this.logService.getResolutionDistribution(this.chartDate()).subscribe({
      next: (r) => { this.chartSlots.set(r.slots); this.chartLoading.set(false); },
      error: () => { this.chartError.set(true); this.chartLoading.set(false); },
    });
  }

  loadRpm(): void {
    this.rpmLoading.set(true);
    this.rpmError.set(false);
    const isDaily = this.rpmMode() === 'daily';
    this.logService.getRpm(
      isDaily ? undefined : this.rpmWindow(),
      isDaily ? this.rpmDate() : undefined,
    ).subscribe({
      next: (r) => { this.rpmSlots.set(r.slots); this.rpmLoading.set(false); },
      error: () => { this.rpmError.set(true); this.rpmLoading.set(false); },
    });
  }

  onDateChange(value: string): void {
    this.chartDate.set(value);
    this.loadChart();
  }

  onRpmWindowChange(w: RpmWindow): void {
    this.rpmWindow.set(w);
    this.loadRpm();
  }

  onRpmModeChange(mode: RpmMode): void {
    this.rpmMode.set(mode);
    this.loadRpm();
  }

  onRpmDateChange(value: string): void {
    this.rpmDate.set(value);
    this.loadRpm();
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
    this.loadRpm();
  }
}
