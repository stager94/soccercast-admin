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
  created_at: string;
  updated_at: string;
}
