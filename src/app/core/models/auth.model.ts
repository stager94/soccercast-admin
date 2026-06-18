export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface Session {
  id: number;
  ip_address: string | null;
  country: string | null;
  device: string;
  created_at: string;
  last_used_at: string | null;
  is_current: boolean;
}
