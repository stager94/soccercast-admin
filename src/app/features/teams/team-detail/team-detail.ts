import { DatePipe, DecimalPipe, Location } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { EloHistoryPoint, TeamDetail as TeamDetailModel } from '../../../core/models/team.model';
import { TeamService } from '../../../core/services/team.service';
import { EloHistoryChart } from '../../../shared/elo-history-chart/elo-history-chart';

@Component({
  selector: 'app-team-detail',
  imports: [DatePipe, DecimalPipe, RouterLink, EloHistoryChart],
  templateUrl: './team-detail.html',
})
export class TeamDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly teamService = inject(TeamService);

  readonly team = signal<TeamDetailModel | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);

  // Most-recent matches first for the table beneath the chart.
  readonly recentMatches = computed<EloHistoryPoint[]>(() =>
    [...(this.team()?.elo_history ?? [])].reverse(),
  );

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.load(id);
  }

  load(id: string): void {
    this.loading.set(true);
    this.error.set(false);
    this.teamService.getById(id).subscribe({
      next: (team) => {
        this.team.set(team);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  goBack(): void {
    this.location.back();
  }

  resultClass(result: string | null): string {
    if (result === 'W') return 'bg-green-50 text-green-600';
    if (result === 'L') return 'bg-red-50 text-red-600';
    return 'bg-gray-100 text-gray-600';
  }
}
