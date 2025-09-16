// Summary card component for current weather display
// 当前天气显示的摘要卡片组件

import React, { useState, useEffect } from 'react';
import type { HourlyForecastItem } from '../services/forecast';
import type { Hour } from '../logic/types';
import { sliceNextHours } from '../logic/rules';
import { fetchAlerts, type WeatherAlert } from '../services/alerts';

interface SummaryCardProps {
  forecasts: HourlyForecastItem[];
  cityName?: string;
  loading?: boolean;
  coordinates?: { lat: number; lon: number };
}

// Convert HourlyForecastItem to Hour type
// 将HourlyForecastItem转换为Hour类型
function convertToHours(forecasts: HourlyForecastItem[]): Hour[] {
  return forecasts.map(forecast => ({
    isoTime: forecast.isoTime,
    temp: forecast.temp,
    apparent: forecast.apparent,
    pop: forecast.pop,
    precip: forecast.precip,
    wind: forecast.wind,
    uv: forecast.uv,
  }));
}

// Alert Badge Component
// 警报徽章组件
interface AlertBadgeProps {
  alerts: WeatherAlert[];
}

const AlertBadge: React.FC<AlertBadgeProps> = ({ alerts }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (alerts.length === 0) return null;

  const firstAlert = alerts[0];
  const hasMultipleAlerts = alerts.length > 1;

  const getSeverityColor = (severity: string): string => {
    const severityLower = severity.toLowerCase();
    if (severityLower.includes('extreme') || severityLower.includes('severe')) return 'alert-severe';
    if (severityLower.includes('moderate')) return 'alert-moderate';
    if (severityLower.includes('minor')) return 'alert-minor';
    return 'alert-unknown';
  };

  const formatDateTime = (isoString: string): string => {
    try {
      return new Date(isoString).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Unknown time';
    }
  };

  return (
    <div className={`alert-badge ${getSeverityColor(firstAlert.severity)}`} role="alert">
      <div className="alert-header" onClick={() => hasMultipleAlerts && setIsExpanded(!isExpanded)}>
        <div className="alert-info">
          <span className="alert-title">{firstAlert.title}</span>
          <span className="alert-severity">{firstAlert.severity}</span>
        </div>
        {hasMultipleAlerts && (
          <div className="alert-count">
            <span>{alerts.length} alerts</span>
            <button 
              className="expand-button"
              aria-label={isExpanded ? "Collapse alerts" : "Expand alerts"}
              aria-expanded={isExpanded}
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          </div>
        )}
      </div>
      
      {isExpanded && hasMultipleAlerts && (
        <div className="alert-details">
          {alerts.map((alert, index) => (
            <div key={index} className="alert-item">
              <h4 className="alert-item-title">{alert.title}</h4>
              <p className="alert-item-severity">Severity: {alert.severity}</p>
              <p className="alert-item-description">{alert.description}</p>
              <div className="alert-item-times">
                <span>Effective: {formatDateTime(alert.effective)}</span>
                <span>Expires: {formatDateTime(alert.expires)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const SummaryCard: React.FC<SummaryCardProps> = ({
  forecasts,
  cityName,
  loading = false,
  coordinates
}) => {
  // State for weather alerts
  // 天气警报状态
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);

  // Fetch alerts when coordinates change
  // 当坐标改变时获取警报
  useEffect(() => {
    if (coordinates && !loading) {
      fetchAlerts(coordinates.lat, coordinates.lon)
        .then(setAlerts)
        .catch((error) => {
          console.warn('Failed to fetch alerts:', error);
          setAlerts([]); // Set empty array on error / 错误时设置空数组
        });
    }
  }, [coordinates, loading]);

  if (loading) {
    return (
      <section className="summary-card loading" role="region" aria-label="Weather summary">
        <div className="loading-placeholder" role="status" aria-label="Loading weather summary">
          <div className="spinner" aria-hidden="true"></div>
          <span>Loading weather summary...</span>
        </div>
      </section>
    );
  }

  if (!forecasts.length) {
    return (
      <section className="summary-card empty" role="region" aria-label="Weather summary">
        <div className="empty-message" role="status">
          <h2>No Weather Data</h2>
          <p>Weather summary is not available at this time.</p>
        </div>
      </section>
    );
  }

  const hours = convertToHours(forecasts);
  const { hours: nextSixHours, stats } = sliceNextHours(hours, 6);
  
  if (nextSixHours.length === 0) {
    return (
      <section className="summary-card empty" role="region" aria-label="Weather summary">
        <div className="empty-message" role="status">
          <h2>Insufficient Data</h2>
          <p>Not enough forecast data to generate summary.</p>
        </div>
      </section>
    );
  }

  const current = forecasts[0];
  const startTime = new Date(nextSixHours[0].isoTime);
  const endTime = new Date(nextSixHours[nextSixHours.length - 1].isoTime);
  
  const timeRange = `${startTime.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false 
  })} - ${endTime.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false 
  })}`;

  const tempRange = stats.minApparent === stats.maxApparent 
    ? `${Math.round(stats.minApparent)}°C`
    : `${Math.round(stats.minApparent)}°C - ${Math.round(stats.maxApparent)}°C`;

  return (
    <section className="summary-card" role="region" aria-label="6-hour weather summary">
      <header className="summary-header">
        <h2 id="summary-title">
          Weather Summary{cityName && ` for ${cityName}`}
        </h2>
        <p className="summary-timeframe" aria-describedby="summary-title">
          Next 6 hours ({timeRange})
        </p>
      </header>
      
      {/* Weather Alerts Badge - 天气警报徽章 */}
      <AlertBadge alerts={alerts} />
      
      <div className="summary-content">
        <div className="current-conditions" role="group" aria-label="Current conditions">
          <h3 className="section-title">Current</h3>
          <div className="current-grid">
            <div className="current-item">
              <span className="label">Temperature</span>
              <span 
                className="value temperature-value"
                aria-label={`Current temperature: ${Math.round(current.temp)} degrees Celsius`}
              >
                {Math.round(current.temp)}°C
              </span>
            </div>
            
            <div className="current-item">
              <span className="label">Feels Like</span>
              <span 
                className="value feels-like-value"
                aria-label={`Feels like temperature: ${Math.round(current.apparent)} degrees Celsius`}
              >
                {Math.round(current.apparent)}°C
              </span>
            </div>
            
            <div className="current-item">
              <span className="label">Rain Chance</span>
              <span 
                className="value precipitation-value"
                aria-label={`Precipitation probability: ${current.pop} percent`}
              >
                {current.pop}%
              </span>
            </div>
            
            <div className="current-item">
              <span className="label">Wind</span>
              <span 
                className="value wind-value"
                aria-label={`Wind speed: ${Math.round(current.wind)} kilometers per hour`}
              >
                {Math.round(current.wind)} km/h
              </span>
            </div>
          </div>
        </div>

        <div className="six-hour-outlook" role="group" aria-label="6-hour outlook">
          <h3 className="section-title">6-Hour Outlook</h3>
          <div className="outlook-grid">
            <div className="outlook-item">
              <span className="label">Temperature Range</span>
              <span 
                className="value temp-range-value"
                aria-label={`Temperature range: ${tempRange}`}
              >
                {tempRange}
              </span>
            </div>
            
            <div className="outlook-item">
              <span className="label">Average Feels Like</span>
              <span 
                className="value feels-like-value"
                aria-label={`Average apparent temperature: ${Math.round(stats.avgApparent)} degrees Celsius`}
              >
                {Math.round(stats.avgApparent)}°C
              </span>
            </div>
            
            <div className="outlook-item">
              <span className="label">Max Rain Chance</span>
              <span 
                className="value max-precip-value"
                aria-label={`Maximum precipitation probability: ${stats.maxPOP} percent`}
              >
                {stats.maxPOP}%
              </span>
            </div>
            
            <div className="outlook-item">
              <span className="label">Total Precipitation</span>
              <span 
                className="value precipitation-value"
                aria-label={`Total precipitation: ${stats.sumPrecip.toFixed(1)} millimeters`}
              >
                {stats.sumPrecip.toFixed(1)}mm
              </span>
            </div>
            
            <div className="outlook-item">
              <span className="label">Max Wind Speed</span>
              <span 
                className="value wind-value"
                aria-label={`Maximum wind speed: ${Math.round(stats.maxWind)} kilometers per hour`}
              >
                {Math.round(stats.maxWind)} km/h
              </span>
            </div>
            
            <div className="outlook-item">
              <span className="label">Max UV Index</span>
              <span 
                className="value uv-value"
                aria-label={`Maximum UV index: ${Math.round(stats.maxUV)}`}
              >
                {Math.round(stats.maxUV)}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <footer className="summary-footer">
        <p className="data-note" aria-live="polite">
          Based on {forecasts.length} hours of forecast data
        </p>
      </footer>
    </section>
  );
};
