export type FixtureStatus =
  | 'NS' | '1H' | 'HT' | '2H' | 'ET' | 'BT' | 'P'
  | 'SUSP' | 'INT' | 'FT' | 'AET' | 'PEN' | 'PST'
  | 'CANC' | 'ABD' | 'AWD' | 'WO' | 'LIVE';

export const LIVE_STATUSES: FixtureStatus[] = ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'SUSP', 'INT', 'LIVE'];
export const FINISHED_STATUSES: FixtureStatus[] = ['FT', 'AET', 'PEN', 'AWD', 'WO'];

export const STATUS_FILTER_MAP: Record<string, FixtureStatus[]> = {
  Upcoming: ['NS'],
  Live: LIVE_STATUSES,
  Finished: FINISHED_STATUSES,
  Postponed: ['PST'],
};
export const STATUS_FILTER_OPTIONS = Object.keys(STATUS_FILTER_MAP);

export interface FixtureTeam {
  id: number;
  name: string;
  logo_url: string | null;
}

export interface FixtureScoreData {
  home: number | null;
  away: number | null;
}

export interface FixturesSummary {
  total: number;
  finished: number;
  live: number;
  upcoming: number;
}

export interface Fixture {
  id: number;
  date: string;
  round: string;
  status: FixtureStatus;
  status_elapsed: number | null;
  status_extra: number | null;
  goals_home: number | null;
  goals_away: number | null;
  home_team: FixtureTeam;
  away_team: FixtureTeam;
  score_halftime: FixtureScoreData;
  score_fulltime: FixtureScoreData;
  score_extratime: FixtureScoreData;
  score_penalty: FixtureScoreData;
  events_synced_at: string | null;
  lineups_synced_at: string | null;
  statistics_synced_at: string | null;
  player_statistics_synced_at: string | null;
}

export interface FixtureEvent {
  id: number;
  time_elapsed: number;
  time_extra: number | null;
  team: FixtureTeam;
  player: { id: number; name: string } | null;
  assist: { id: number; name: string } | null;
  type: 'Goal' | 'Card' | 'subst' | 'Var';
  detail: string;
  comments: string | null;
}

export interface FixtureLineupPlayer {
  id: number;
  name: string;
  number: number;
  position: string;
  grid: string | null;
  captain: boolean;
}

export interface FixtureLineupTeam {
  team: FixtureTeam;
  formation: string | null;
  coach: string | null;
  start_xi: FixtureLineupPlayer[];
  substitutes: FixtureLineupPlayer[];
}

export interface FixtureStatistic {
  type: string;
  home_value: string | number | null;
  away_value: string | number | null;
}

export interface FixturePlayerStat {
  player: { id: number; name: string };
  position: string;
  minutes: number | null;
  rating: string | null;
  goals: number | null;
  assists: number | null;
  shots_total: number | null;
  shots_on: number | null;
  passes_total: number | null;
  passes_accuracy: number | null;
  dribbles_attempts: number | null;
  dribbles_success: number | null;
  fouls_committed: number | null;
  yellow_cards: number;
  red_cards: number;
}

export interface FixturePlayerStatsTeam {
  team: FixtureTeam;
  players: FixturePlayerStat[];
}

export interface FixtureDetail extends Fixture {
  venue: string | null;
  city: string | null;
  referee: string | null;
  events: FixtureEvent[];
  lineups: FixtureLineupTeam[];
  statistics: FixtureStatistic[];
  player_stats: FixturePlayerStatsTeam[];
}
