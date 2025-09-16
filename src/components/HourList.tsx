// Hourly forecast list component for 48h weather display
// 48小时天气显示的小时预报列表组件

import React from 'react';
import type { HourlyForecastItem } from '../services/forecast';

interface HourListProps {
  forecasts: HourlyForecastItem[];
  loading?: boolean;
  cityName?: string;
}

interface HourItemProps {
  forecast: HourlyForecastItem;
}

const HourItem: React.FC<HourItemProps> = ({ forecast }) => {
  const date = new Date(forecast.isoTime);
  const time = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  
  const dayOfWeek = date.toLocaleDateString('en-US', {
    weekday: 'short'
  });
  
  const isToday = date.toDateString() === new Date().toDateString();
  const isTomorrow = date.toDateString() === new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString();
  
  let dayLabel = dayOfWeek;
  if (isToday) dayLabel = 'Today';
  else if (isTomorrow) dayLabel = 'Tomorrow';

  const hasPrecipitation = forecast.precip > 0;

  return (
    <li className="hour-item" role="listitem">
      <div className="hour-time">
        <time dateTime={forecast.isoTime} className="time-value">
          {time}
        </time>
        <span className="day-label" aria-label={`Day: ${dayLabel}`}>
          {dayLabel}
        </span>
      </div>
      
      <div className="hour-temperature">
        <span 
          className="apparent-temp"
          aria-label={`Feels like temperature: ${Math.round(forecast.apparent)} degrees Celsius`}
        >
          {Math.round(forecast.apparent)}°C
        </span>
      </div>
      
      <div className="hour-precipitation">
        <span 
          className="precipitation-probability"
          aria-label={`Precipitation probability: ${forecast.pop} percent`}
        >
          {forecast.pop}%
        </span>
        {hasPrecipitation && (
          <span 
            className="precipitation-amount"
            aria-label={`Precipitation amount: ${forecast.precip} millimeters`}
          >
            {forecast.precip}mm
          </span>
        )}
      </div>
      
      <div className="hour-extras">
        <span 
          className="wind-speed"
          aria-label={`Wind speed: ${Math.round(forecast.wind)} kilometers per hour`}
        >
          {Math.round(forecast.wind)} km/h
        </span>
        <span 
          className="uv-index"
          aria-label={`UV index: ${Math.round(forecast.uv)}`}
        >
          UV {Math.round(forecast.uv)}
        </span>
      </div>
    </li>
  );
};

export const HourList: React.FC<HourListProps> = ({
  forecasts,
  loading = false,
  cityName
}) => {
  if (loading) {
    return (
      <section className="hour-list loading" aria-live="polite">
        <div className="loading-placeholder" role="status" aria-label="Loading hourly forecast">
          <div className="spinner" aria-hidden="true"></div>
          <span>Loading 48-hour forecast...</span>
        </div>
      </section>
    );
  }

  if (!forecasts.length) {
    return (
      <section className="hour-list empty" role="region" aria-label="Hourly forecast">
        <div className="empty-message" role="status">
          <h3>No Hourly Forecast Data</h3>
          <p>Hourly forecast data is not available at this time.</p>
        </div>
      </section>
    );
  }

  const totalHours = forecasts.length;
  const displayHours = Math.min(totalHours, 48);

  return (
    <section className="hour-list" role="region" aria-label="48-hour weather forecast">
      <header className="hour-list-header">
        <h3 id="hourly-forecast-title">
          48-Hour Forecast{cityName && ` for ${cityName}`}
        </h3>
        <p className="forecast-summary" aria-describedby="hourly-forecast-title">
          Showing {displayHours} of {totalHours} available hours
        </p>
      </header>
      
      <div 
        className="hour-list-container"
        role="region"
        aria-label="Scrollable hourly forecast list"
        tabIndex={0}
      >
        <ul 
          className="hour-items"
          role="list"
          aria-label="Hourly weather data"
        >
          {forecasts.slice(0, 48).map((forecast, index) => (
            <HourItem 
              key={`${forecast.isoTime}-${index}`} 
              forecast={forecast} 
            />
          ))}
        </ul>
      </div>
      
      {totalHours > 48 && (
        <footer className="hour-list-footer">
          <p aria-live="polite">
            Additional {totalHours - 48} hours of forecast data available
          </p>
        </footer>
      )}
    </section>
  );
};
