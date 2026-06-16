import { Component, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { FixturesSummary } from '../../core/models/fixture.model';
import { FixtureService } from '../../core/services/fixture.service';

@Component({
  selector: 'app-fixture-summary-block',
  imports: [RouterLink],
  templateUrl: './fixture-summary-block.html',
})
export class FixtureSummaryBlock {
  private readonly fixtureService = inject(FixtureService);

  readonly summary = input.required<FixturesSummary>();
  readonly leagueId = input.required<number>();
  readonly seasonId = input.required<number>();

  readonly syncing = signal(false);
  readonly syncDone = signal(false);

  retrySync(): void {
    if (this.syncing()) return;
    this.syncing.set(true);
    this.syncDone.set(false);
    this.fixtureService.retroSync(this.leagueId()).subscribe({
      next: () => {
        this.syncing.set(false);
        this.syncDone.set(true);
      },
      error: () => this.syncing.set(false),
    });
  }
}
