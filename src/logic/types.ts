// Shared TypeScript types for the weather application
// 天气应用的共享 TypeScript 类型定义

// Hour type based on HourlyForecastItem from forecast service
export interface Hour {
  isoTime: string;
  temp: number;
  apparent: number;
  pop: number; // precipitation probability
  precip: number; // precipitation amount
  wind: number;
  uv: number;
}

export interface Location {
  city: string;
  country: string;
  lat: number;
  lon: number;
}

export interface WeatherCondition {
  id: number;
  main: string;
  description: string;
  icon: string;
}

export interface HourlyForecast {
  datetime: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  condition: WeatherCondition;
  precipitation: number;
}

export interface WeatherSummary {
  current: HourlyForecast;
  location: Location;
  summary: string;
}

export interface AppState {
  currentLocation: Location | null;
  weatherSummary: WeatherSummary | null;
  hourlyForecast: HourlyForecast[];
  loading: boolean;
  error: string | null;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface UIState {
  loadingState: LoadingState;
  errorMessage?: string;
}
