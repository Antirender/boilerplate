import { useState, useEffect } from 'react';
import './App.css';
import { SearchBar } from './components/SearchBar';
import { SummaryCard } from './components/SummaryCard';
import AdvicePanel from './components/AdvicePanel';
import { ForecastChart } from './components/ForecastChart';
import { CompactWeatherCards } from './components/CompactWeatherCards';
import { LoadingState, ErrorState, EmptyState } from './components/State';
import OutfitAdvice from './components/OutfitAdvice';
import { geocodeCity, GeocodeError } from './services/geocode';
import { fetchForecast, ForecastError, type HourlyForecastItem } from './services/forecast';
import { fetchAlerts, type WeatherAlert } from './services/alerts';
import { buildAdvice, sliceNextHours } from './logic/rules';
import type { Hour } from './logic/types';

interface CityData {
  name: string;
  lat: number;
  lon: number;
}

interface AppState {
  city: CityData | null;
  hours: HourlyForecastItem[];
  alerts: WeatherAlert[];
  status: 'idle' | 'loading' | 'error' | 'ready';
  error?: string;
}

function App() {
  const [appState, setAppState] = useState<AppState>({
    city: null,
    hours: [],
    alerts: [],
    status: 'idle',
    error: undefined
  });

  // Auto-load Oakville on first mount
  // 应用启动时自动加载Oakville天气
  useEffect(() => {
    const loadDefaultCity = async () => {
      setAppState(prev => ({ ...prev, status: 'loading' }));
      
      try {
        const result = await geocodeCity('Oakville, Ontario, Canada');
        const forecast = await fetchForecast(result.lat, result.lon);
        const alerts = await fetchAlerts(result.lat, result.lon);
        
        setAppState({
          city: result,
          hours: forecast,
          alerts: alerts,
          status: 'ready',
          error: undefined
        });
      } catch (error) {
        const errorMessage = error instanceof GeocodeError || error instanceof ForecastError
          ? error.message 
          : 'Failed to load default weather data';
          
        setAppState(prev => ({
          ...prev,
          status: 'error',
          error: errorMessage
        }));
      }
    };

    loadDefaultCity();
  }, []);

  const handleSearchResult = async (cityResult: CityData) => {
    setAppState(prev => ({ 
      ...prev, 
      city: cityResult,
      status: 'loading',
      error: undefined 
    }));

    try {
      const forecast = await fetchForecast(cityResult.lat, cityResult.lon);
      const alerts = await fetchAlerts(cityResult.lat, cityResult.lon);
      
      setAppState(prev => ({
        ...prev,
        hours: forecast,
        alerts: alerts,
        status: 'ready'
      }));
    } catch (error) {
      const errorMessage = error instanceof ForecastError
        ? error.message 
        : 'Failed to fetch weather data';
        
      setAppState(prev => ({
        ...prev,
        status: 'error',
        error: errorMessage
      }));
    }
  };

  const handleSearchError = (error: string) => {
    setAppState(prev => ({
      ...prev,
      status: 'error',
      error
    }));
  };

  const handleSearchLoading = (loading: boolean) => {
    if (loading) {
      setAppState(prev => ({ 
        ...prev, 
        status: 'loading',
        error: undefined 
      }));
    }
  };

  const handleRetry = () => {
    setAppState(prev => ({
      ...prev,
      status: 'idle',
      error: undefined
    }));
  };

  // Convert forecasts to Hours and compute advice for next 6 hours
  const getAdviceData = () => {
    if (appState.hours.length === 0) {
      return { badges: [], text: '' };
    }

    const hours: Hour[] = appState.hours.map(forecast => ({
      isoTime: forecast.isoTime,
      temp: forecast.temp,
      apparent: forecast.apparent,
      pop: forecast.pop,
      precip: forecast.precip,
      wind: forecast.wind,
      uv: forecast.uv,
    }));

    const { hours: nextSixHours } = sliceNextHours(hours, 6);
    return buildAdvice(nextSixHours);
  };

  // Temporary component to display forecast items
  const ForecastDisplay = () => {
    if (appState.hours.length === 0) {
      return (
        <EmptyState
          title="No Forecast Data"
          message="Search for a city to see the 48-hour weather forecast"
          actionLabel="Try Toronto"
          onAction={() => handleSearchResult({ name: 'Toronto, Ontario, Canada', lat: 43.6532, lon: -79.3832 })}
        />
      );
    }

    return (
      <ForecastChart 
        forecasts={appState.hours}
        loading={false}
        cityName={appState.city?.name}
      />
    );
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Weather Forecast</h1>
        <SearchBar 
          onResult={handleSearchResult}
          onError={handleSearchError}
          onLoading={handleSearchLoading}
          placeholder="Search for a city (e.g., Toronto, London, Tokyo)"
          disabled={appState.status === 'loading'}
        />
      </header>

      <main className="app-main">
        {appState.status === 'error' ? (
          <ErrorState 
            message={appState.error || 'An unknown error occurred'}
            onRetry={handleRetry}
          />
        ) : appState.status === 'loading' ? (
          <LoadingState message="Loading weather data..." />
        ) : (
          <>
            {/* Mobile-first compact view */}
            <div className="mobile-weather-view">
              <CompactWeatherCards 
                forecasts={appState.hours}
                alerts={appState.alerts}
                cityName={appState.city?.name}
              />
              
              {/* Weather Guidance Panel for mobile */}
              {appState.hours.length > 0 && (
                <AdvicePanel {...getAdviceData()} />
              )}
              
              {/* Outfit Advice for mobile */}
              {appState.hours.length > 0 && (
                <OutfitAdvice hours={appState.hours} />
              )}
            </div>

            {/* Desktop layout with sidebar and main content */}
            <div className="desktop-weather-layout">
              <aside className="weather-sidebar">
                {appState.city && (
                  <div className="city-header">
                    <h2>{appState.city.name}</h2>
                    <p>Coordinates: {appState.city.lat.toFixed(4)}, {appState.city.lon.toFixed(4)}</p>
                  </div>
                )}
                
                <SummaryCard 
                  forecasts={appState.hours}
                  cityName={appState.city?.name}
                  loading={false}
                  coordinates={appState.city ? { lat: appState.city.lat, lon: appState.city.lon } : undefined}
                />
                
                {/* Weather Guidance Panel for desktop */}
                {appState.hours.length > 0 && (
                  <AdvicePanel {...getAdviceData()} />
                )}
                
                {/* Outfit Advice for desktop sidebar */}
                {appState.hours.length > 0 && (
                  <OutfitAdvice hours={appState.hours} />
                )}
              </aside>

              <section className="weather-main-content">
                <ForecastDisplay />
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
