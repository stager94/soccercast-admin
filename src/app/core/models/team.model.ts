export interface TeamListItem {
  id: number;
  name: string;
  logo_url: string | null;
  elo_rating: number;
  national: boolean;
}

export interface TeamOpponent {
  id: number;
  name: string;
  logo_url: string | null;
}

export type EloResult = 'W' | 'D' | 'L' | null;

export interface EloHistoryPoint {
  fixture_id: number;
  date: string | null;
  side: 'home' | 'away';
  opponent: TeamOpponent;
  goals_for: number | null;
  goals_against: number | null;
  result: EloResult;
  elo_before: number;
  elo_after: number;
  delta: number;
}

export interface TeamLeagueRef {
  id: number;
  name: string;
  logo_url: string | null;
  priority: number;
  country: {
    name: string | null;
    flag_url: string | null;
  };
}

export interface TeamAttackDefenceRating {
  attack_rating: number;
  defence_rating: number;
  games_played: number;
  goals_scored: number;
  goals_conceded: number;
  avg_scored: number;
  avg_conceded: number;
}

export interface TeamDcParameters {
  alpha: number;
  beta: number;
  gamma: number;
  rho: number;
  converged: boolean;
  fixtures_used: number;
  computed_at: string;
}

export interface TeamLeagueRating {
  league_season_id: number;
  season: number | null;
  league: TeamLeagueRef;
  rating: TeamAttackDefenceRating | null;
  dc: TeamDcParameters | null;
}

export interface TeamDetail {
  id: number;
  name: string;
  logo_url: string | null;
  national: boolean;
  elo_rating: number;
  elo_first_match_at: string | null;
  elo_history: EloHistoryPoint[];
  league_ratings: TeamLeagueRating[];
}
