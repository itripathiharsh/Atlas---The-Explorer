export interface User {
  id: number;
  username: string;
  email: string;
  avatar_url: string | null;
  level: number;
  xp: number;
  is_admin: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface CityPct {
  name: string;
  display_name: string;
  pct: number;
  center_lat?: number;
  center_lng?: number;
}

export interface WorldPin {
  id: number;
  name: string;
  category: string;
  lat: number;
  lng: number;
  recommendation_count: number;
}

export interface Stats {
  level: number;
  xp: number;
  next_level_xp: number;
  cells_unlocked: number;
  cities_explored: number;
  discoveries_visited: number;
  recommendations_made: number;
  discoveries_created: number;
  per_city: CityPct[];
  world_pct: number;
}

export interface Achievement {
  code: string;
  name: string;
  description: string;
  earned_at: string | null;
}

export interface UnlockedCell {
  h3: string;
  boundary: [number, number][];
}

export interface PingResponse {
  accepted: number;
  rejected: { lat: number; lng: number; reasons: string[] }[];
  unlocked: UnlockedCell[];
  xp_awarded: number;
  xp: number;
  level: number;
  level_up: boolean;
  new_achievements: { code: string; name: string; description: string }[];
}

export interface Discovery {
  id: number;
  name: string;
  category: string;
  description: string;
  lat: number;
  lng: number;
  distance_m: number | null;
  visit_count: number;
  recommendation_count: number;
  score_pct: number | null;
  visited_by_me: boolean;
  recommended_by_me: boolean;
  created_by_me: boolean;
  photos: string[];
}

export interface MapSummary {
  cities: CityPct[];
  world_pct: number;
}

export interface GeoFC {
  type: "FeatureCollection";
  features: {
    type: "Feature";
    geometry: { type: "Polygon"; coordinates: [number, number][][] };
    properties: { h3: string };
  }[];
}

export interface ApiConfig {
  gps_dev_mode: boolean;
  max_accuracy_m: number;
  visit_radius_m: number;
  create_radius_m: number;
}
