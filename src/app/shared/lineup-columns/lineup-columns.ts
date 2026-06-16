import { Component, input } from '@angular/core';

import { FixtureLineupTeam } from '../../core/models/fixture.model';

@Component({
  selector: 'app-lineup-columns',
  templateUrl: './lineup-columns.html',
})
export class LineupColumns {
  readonly home = input.required<FixtureLineupTeam>();
  readonly away = input.required<FixtureLineupTeam>();

  readonly maxLen = (a: unknown[], b: unknown[]) => Math.max(a.length, b.length);

  range(n: number): number[] {
    return Array.from({ length: n }, (_, i) => i);
  }
}
