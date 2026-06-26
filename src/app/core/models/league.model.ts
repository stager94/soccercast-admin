import { Country } from './country.model';
import { FixturesSummary } from './fixture.model';

export interface League {
  id: number;
  name: string;
  league_type: string;
  logo_url: string;
  enabled: boolean;
  elo_k_factor: number;
  country: Country | null;
  created_at: string;
  updated_at: string;
}

export interface LeagueSeason {
  id: number;
  start_date: string;
  end_date: string;
  current: boolean;
  fixtures_sync_disabled: boolean;
  season: { id: number; year: number };
  coverage: Record<string, unknown>;
  fixtures_summary: FixturesSummary | null;
}

export interface LeagueDetail extends League {
  league_seasons: LeagueSeason[];
}
