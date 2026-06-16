import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { League, LeagueDetail as LeagueDetailModel } from '../../../core/models/league.model';
import { LeagueService } from '../../../core/services/league.service';
import { JsonViewer } from '../../../shared/json-viewer/json-viewer';

@Component({
  selector: 'app-league-detail',
  imports: [DatePipe, RouterLink, JsonViewer],
  templateUrl: './league-detail.html',
})
export class LeagueDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly leagueService = inject(LeagueService);

  readonly league = signal<LeagueDetailModel | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly toggling = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.leagueService.getById(id).subscribe({
      next: (league) => {
        this.league.set(league);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  toggleEnabled(): void {
    const current = this.league();
    if (!current || this.toggling()) return;
    this.toggling.set(true);
    this.leagueService.update(current.id, !current.enabled).subscribe({
      next: (updated: League) => {
        this.league.update((l) => (l ? { ...l, ...updated } : l));
        this.toggling.set(false);
      },
      error: () => this.toggling.set(false),
    });
  }
}
