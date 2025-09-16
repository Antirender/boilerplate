// Compact mobile summary cards for quick weather overview
// 移动端紧凑摘要卡片，用于快速天气概览

import React from 'react';
import type { HourlyForecastItem } from '../services/forecast';
import type { WeatherAlert } from '../services/alerts';

interface CompactWeatherCardsProps {
  forecasts: HourlyForecastItem[];
  alerts: WeatherAlert[];
  cityName?: string;
}

interface QuickStatsProps {
  current: HourlyForecastItem;
  next6Hours: HourlyForecastItem[];
}

const QuickStats: React.FC<QuickStatsProps> = ({ current, next6Hours }) => {
  const maxTemp = Math.max(...next6Hours.map(h => h.apparent));
  const minTemp = Math.min(...next6Hours.map(h => h.apparent));
  const maxPrecip = Math.max(...next6Hours.map(h => h.pop));
  
  return (
    <div className="quick-stats">
      <div className="stat-card temperature-card">
        <div className="stat-icon">🌡️</div>
        <div className="stat-content">
          <div className="stat-value">{Math.round(current.apparent)}°C</div>
          <div className="stat-label">Feels Like</div>
          <div className="stat-range">{Math.round(minTemp)}° - {Math.round(maxTemp)}°</div>
        </div>
      </div>
      
      <div className="stat-card precipitation-card">
        <div className="stat-icon">🌧️</div>
        <div className="stat-content">
          <div className="stat-value">{current.pop}%</div>
          <div className="stat-label">Rain Chance</div>
          <div className="stat-range">Max {maxPrecip}% today</div>
        </div>
      </div>
      
      <div className="stat-card wind-card">
        <div className="stat-icon">💨</div>
        <div className="stat-content">
          <div className="stat-value">{Math.round(current.wind)}</div>
          <div className="stat-label">km/h Wind</div>
          <div className="stat-range">UV {Math.round(current.uv)}</div>
        </div>
      </div>
    </div>
  );
};

const CompactAlerts: React.FC<{ alerts: WeatherAlert[] }> = ({ alerts }) => {
  if (alerts.length === 0) return null;

  const firstAlert = alerts[0];
  const getSeverityColor = (severity: string): string => {
    const severityLower = severity.toLowerCase();
    if (severityLower.includes('extreme') || severityLower.includes('severe')) return 'severe';
    if (severityLower.includes('moderate')) return 'moderate';
    if (severityLower.includes('minor')) return 'minor';
    return 'unknown';
  };

  return (
    <div className={`compact-alert ${getSeverityColor(firstAlert.severity)}`}>
      <div className="alert-icon">⚠️</div>
      <div className="alert-content">
        <div className="alert-title">{firstAlert.title}</div>
        {alerts.length > 1 && (
          <div className="alert-count">+{alerts.length - 1} more alerts</div>
        )}
      </div>
    </div>
  );
};

export const CompactWeatherCards: React.FC<CompactWeatherCardsProps> = ({
  forecasts,
  alerts,
  cityName
}) => {
  if (!forecasts.length) return null;

  const current = forecasts[0];
  const next6Hours = forecasts.slice(0, 6);

  return (
    <div className="compact-weather-cards">
      <div className="compact-header">
        <h2 className="compact-city-name">{cityName}</h2>
        <div className="compact-timestamp">
          {new Date().toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>

      <CompactAlerts alerts={alerts} />
      
      <QuickStats current={current} next6Hours={next6Hours} />
      
      <div className="compact-next-hours">
        <h3>Next 6 Hours</h3>
        <div className="hour-pills">
          {next6Hours.map((hour) => {
            const time = new Date(hour.isoTime).toLocaleTimeString('en-US', {
              hour: 'numeric',
              hour12: true
            });
            
            return (
              <div key={hour.isoTime} className="hour-pill">
                <div className="pill-time">{time}</div>
                <div className="pill-temp">{Math.round(hour.apparent)}°</div>
                <div className="pill-precip">{hour.pop}%</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
