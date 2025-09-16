// Geocoding service for converting city names to coordinates
// 地理编码服务，用于将城市名称转换为坐标

export interface GeocodeResult {
  city: string;
  country: string;
  lat: number;
  lon: number;
}

export interface GeocodeResponse {
  results: GeocodeResult[];
  error?: string;
}

export interface CityResult {
  name: string;
  lat: number;
  lon: number;
}

// Custom error types for geocoding
export class GeocodeError extends Error {
  public code?: string;
  
  constructor(message: string, code?: string) {
    super(message);
    this.name = 'GeocodeError';
    this.code = code;
  }
}

export class NetworkError extends GeocodeError {
  constructor(message: string) {
    super(message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

export class NotFoundError extends GeocodeError {
  constructor(query: string) {
    super(`No results found for "${query}"`, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends GeocodeError {
  constructor() {
    super('Rate limit exceeded. Please try again later.', 'RATE_LIMIT');
    this.name = 'RateLimitError';
  }
}

// Nominatim API response interface
interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    country?: string;
    country_code?: string;
  };
}

// Rate limiting helper
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests (Nominatim policy)

async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastRequestTime = Date.now();
}

export async function geocodeCity(query: string): Promise<CityResult> {
  if (!query.trim()) {
    throw new GeocodeError('Query cannot be empty');
  }

  // Apply rate limiting
  await waitForRateLimit();

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1&accept-language=en`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Weather-App/1.0 (Educational Project)'
      }
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new RateLimitError();
      }
      throw new NetworkError(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: NominatimResult[] = await response.json();
    
    if (!data || data.length === 0) {
      throw new NotFoundError(query);
    }

    const result = data[0];
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);

    if (isNaN(lat) || isNaN(lon)) {
      throw new GeocodeError('Invalid coordinates in API response');
    }

    // Extract readable city name from address or display_name
    let name = result.display_name;
    if (result.address) {
      const { city, town, village, county, state, country } = result.address;
      const cityName = city || town || village || county;
      if (cityName && state && country) {
        name = `${cityName}, ${state}, ${country}`;
      } else if (cityName && country) {
        name = `${cityName}, ${country}`;
      }
    }

    return {
      name,
      lat,
      lon
    };

  } catch (error) {
    if (error instanceof GeocodeError) {
      throw error;
    }
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new NetworkError('Network connection failed. Please check your internet connection.');
    }
    
    throw new NetworkError(`Failed to geocode location: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function searchCities(query: string): Promise<GeocodeResponse> {
  try {
    const result = await geocodeCity(query);
    return {
      results: [{
        city: result.name,
        country: '', // Will be parsed from name
        lat: result.lat,
        lon: result.lon
      }]
    };
  } catch (error) {
    return {
      results: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

export async function getCurrentLocation(): Promise<GeocodeResult | null> {
  // TODO: Implement GPS location detection
  // 待实现：GPS 位置检测
  return null;
}
