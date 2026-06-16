import { Country } from './country.model';

export interface League {
  id: number;
  name: string;
  league_type: string;
  logo_url: string;
  enabled: boolean;
  country: Country | null;
  created_at: string;
  updated_at: string;
}

export interface LeagueSeason {
  id: number;
  start_date: string;
  end_date: string;
  current: boolean;
  season: { id: number; year: number };
  coverage: Record<string, unknown>;
}

export interface LeagueDetail extends League {
  league_seasons: LeagueSeason[];
}
