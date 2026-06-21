export type LogResolution = 'ok' | 'requests' | 'rateLimit' | 'plan' | string;

export interface ResolutionSlot {
  time: string;
  ok: number;
  rateLimit: number;
  requests: number;
  [key: string]: number | string;
}

export interface ResolutionDistribution {
  date: string;
  slots: ResolutionSlot[];
}

export interface RpmSlot {
  time: string;
  requests: number;
}

export interface RpmResponse {
  window_minutes: number;
  start_time: string;
  end_time: string;
  slots: RpmSlot[];
}

export interface ApiFootballRequestLog {
  id: number;
  http_method: string;
  url: string;
  request_headers: Record<string, unknown>;
  request_body: string | null;
  response_status: number;
  response_headers: Record<string, unknown>;
  response_body: string | null;
  duration_ms: number;
  resolution: LogResolution;
  resolution_message: string | null;
  created_at: string;
  updated_at: string;
}
