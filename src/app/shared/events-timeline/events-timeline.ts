import { Component, computed, input } from '@angular/core';

import { Fixture, FixtureEvent } from '../../core/models/fixture.model';

export type TimelineItem =
  | { kind: 'event'; event: FixtureEvent; side: 'home' | 'away' }
  | { kind: 'ht'; home: number | null; away: number | null };

@Component({
  selector: 'app-events-timeline',
  templateUrl: './events-timeline.html',
})
export class EventsTimeline {
  readonly fixture = input.required<Fixture>();
  readonly events = input.required<FixtureEvent[]>();

  readonly items = computed<TimelineItem[]>(() => {
    const fixture = this.fixture();
    const sorted = [...this.events()].sort(
      (a, b) => a.time_elapsed - b.time_elapsed || (a.time_extra ?? 0) - (b.time_extra ?? 0),
    );

    const result: TimelineItem[] = [];
    let htInserted = false;

    for (const event of sorted) {
      if (!htInserted && event.time_elapsed > 45) {
        htInserted = true;
        result.push({
          kind: 'ht',
          home: fixture.score_halftime.home,
          away: fixture.score_halftime.away,
        });
      }
      const side = event.team.id === fixture.home_team.id ? 'home' : 'away';
      result.push({ kind: 'event', event, side });
    }

    return result;
  });

  icon(event: FixtureEvent): string {
    if (event.type === 'Goal') {
      if (event.detail === 'Own Goal') return '⚽ OG';
      if (event.detail === 'Penalty') return '⚽ P';
      return '⚽';
    }
    if (event.type === 'Card') {
      if (event.detail === 'Red Card' || event.detail === 'Yellow Red Card') return '🟥';
      return '🟨';
    }
    if (event.type === 'subst') return '🔄';
    return 'VAR';
  }

  eventLabel(event: FixtureEvent): string {
    if (event.type === 'subst') {
      const out = event.player?.name ?? '?';
      const inn = event.assist?.name ?? '?';
      return `OUT ${out} → IN ${inn}`;
    }
    const parts: string[] = [];
    if (event.player) parts.push(event.player.name);
    if (event.assist && event.type === 'Goal') parts.push(`(${event.assist.name})`);
    return parts.join(' ');
  }

  timeLabel(event: FixtureEvent): string {
    return event.time_extra ? `${event.time_elapsed}+${event.time_extra}'` : `${event.time_elapsed}'`;
  }
}
