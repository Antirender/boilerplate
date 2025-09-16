// Weather forecast service for fetching weather data
// 天气预报服务，用于获取天气数据

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
  location: {
    city: string;
    country: string;
    lat: number;
    lon: number;
  };
  summary: string;
}

export interface ForecastResponse {
  summary: WeatherSummary;
  hourly: HourlyForecast[];
  error?: string;
}

// Open-Meteo API interfaces
export interface OpenMeteoHourlyData {
  time: string[];
  temperature_2m: number[];
  apparent_temperature: number[];
  precipitation_probability: number[];
  precipitation: number[];
  wind_speed_10m: number[];
  uv_index: number[];
}

export interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  hourly_units: {
    time: string;
    temperature_2m: string;
    apparent_temperature: string;
    precipitation_probability: string;
    precipitation: string;
    wind_speed_10m: string;
    uv_index: string;
  };
  hourly: OpenMeteoHourlyData;
}

// Simplified hourly forecast item for easier consumption
export interface HourlyForecastItem {
  isoTime: string;
  temp: number;
  apparent: number;
  pop: number; // precipitation probability
  precip: number; // precipitation amount
  wind: number;
  uv: number;
}

// Custom error types for forecast API
export class ForecastError extends Error {
  public code?: string;
  
  constructor(message: string, code?: string) {
    super(message);
    this.name = 'ForecastError';
    this.code = code;
  }
}

export class ForecastNetworkError extends ForecastError {
  constructor(message: string) {
    super(message, 'NETWORK_ERROR');
    this.name = 'ForecastNetworkError';
  }
}

export class ForecastDataError extends ForecastError {
  constructor(message: string) {
    super(message, 'DATA_ERROR');
    this.name = 'ForecastDataError';
  }
}

function validateHourlyData(data: OpenMeteoHourlyData): void {
  const arrays = [
    { name: 'time', data: data.time },
    { name: 'temperature_2m', data: data.temperature_2m },
    { name: 'apparent_temperature', data: data.apparent_temperature },
    { name: 'precipitation_probability', data: data.precipitation_probability },
    { name: 'precipitation', data: data.precipitation },
    { name: 'wind_speed_10m', data: data.wind_speed_10m },
    { name: 'uv_index', data: data.uv_index }
  ];

  for (const array of arrays) {
    if (!Array.isArray(array.data)) {
      throw new ForecastDataError(`Missing or invalid ${array.name} data`);
    }
    if (array.data.length === 0) {
      throw new ForecastDataError(`Empty ${array.name} data`);
    }
  }

  // Check that all arrays have the same length
  const lengths = arrays.map(arr => arr.data.length);
  const uniqueLengths = [...new Set(lengths)];
  
  if (uniqueLengths.length > 1) {
    throw new ForecastDataError(
      `Inconsistent data lengths: ${arrays.map((arr, i) => `${arr.name}(${lengths[i]})`).join(', ')}`
    );
  }

  // We can work with less than 48 hours, but warn if significantly different
  const actualLength = lengths[0];
  if (actualLength < 24) {
    throw new ForecastDataError(`Insufficient forecast data: only ${actualLength} hours available`);
  }
}

function mapToHourlyItems(data: OpenMeteoHourlyData): HourlyForecastItem[] {
  const items: HourlyForecastItem[] = [];
  
  for (let i = 0; i < data.time.length; i++) {
    items.push({
      isoTime: data.time[i],
      temp: data.temperature_2m[i] ?? 0,
      apparent: data.apparent_temperature[i] ?? 0,
      pop: data.precipitation_probability[i] ?? 0,
      precip: data.precipitation[i] ?? 0,
      wind: data.wind_speed_10m[i] ?? 0,
      uv: data.uv_index[i] ?? 0
    });
  }
  
  return items;
}

export async function fetchForecast(lat: number, lon: number): Promise<HourlyForecastItem[]> {
  // Validate coordinates
  if (isNaN(lat) || isNaN(lon)) {
    throw new ForecastError('Invalid coordinates provided');
  }
  
  if (lat < -90 || lat > 90) {
    throw new ForecastError('Latitude must be between -90 and 90');
  }
  
  if (lon < -180 || lon > 180) {
    throw new ForecastError('Longitude must be between -180 and 180');
  }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,apparent_temperature,precipitation_probability,precipitation,wind_speed_10m,uv_index&past_hours=0&forecast_hours=48&timezone=auto`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new ForecastNetworkError(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: OpenMeteoResponse = await response.json();

    if (!data.hourly) {
      throw new ForecastDataError('No hourly data in API response');
    }

    // Validate the hourly data structure and lengths
    validateHourlyData(data.hourly);

    // Map to simplified hourly items
    const hourlyItems = mapToHourlyItems(data.hourly);

    console.log(`Fetched ${hourlyItems.length} hours of forecast data for coordinates ${lat}, ${lon}`);
    
    return hourlyItems;

  } catch (error) {
    if (error instanceof ForecastError) {
      throw error;
    }
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ForecastNetworkError('Network connection failed. Please check your internet connection.');
    }
    
    throw new ForecastNetworkError(`Failed to fetch forecast: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getForecast(lat: number, lon: number): Promise<ForecastResponse> {
  // TODO: Implement actual weather API call
  // 待实现：实际的天气 API 调用
  console.log('Getting forecast for coordinates:', lat, lon);
  return {
    summary: {
      current: {
        datetime: new Date().toISOString(),
        temperature: 0,
        feelsLike: 0,
        humidity: 0,
        windSpeed: 0,
        windDirection: 0,
        condition: { id: 0, main: '', description: '', icon: '' },
        precipitation: 0
      },
      location: { city: '', country: '', lat, lon },
      summary: ''
    },
    hourly: []
  };
}
