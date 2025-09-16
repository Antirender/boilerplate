// 48-hour forecast chart component with line chart visualization
// 48小时预报图表组件，带有折线图可视化

import React, { useState, useMemo } from 'react';
import type { HourlyForecastItem } from '../services/forecast';

interface ForecastChartProps {
  forecasts: HourlyForecastItem[];
  loading?: boolean;
  cityName?: string;
}

interface ChartPoint {
  x: number;
  y: number;
  temp: number;
  pop: number;
  time: string;
  dayLabel: string;
  forecast: HourlyForecastItem;
}

interface ChartDimensions {
  width: number;
  height: number;
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

// Detailed hourly data component for expandable section
// 可展开部分的详细小时数据组件
const HourlyDetails: React.FC<{ forecasts: HourlyForecastItem[] }> = ({ forecasts }) => {
  return (
    <div className="hourly-details">
      <div className="details-grid">
        {forecasts.slice(0, 48).map((forecast, index) => {
          const date = new Date(forecast.isoTime);
          const time = date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });
          
          const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
          const isToday = date.toDateString() === new Date().toDateString();
          const isTomorrow = date.toDateString() === new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString();
          
          let dayLabel = dayOfWeek;
          if (isToday) dayLabel = 'Today';
          else if (isTomorrow) dayLabel = 'Tomorrow';

          return (
            <div key={`${forecast.isoTime}-${index}`} className="detail-item">
              <div className="detail-time">
                <span className="time">{time}</span>
                <span className="day">{dayLabel}</span>
              </div>
              <div className="detail-weather">
                <div className="temp-details">
                  <span className="temp">{Math.round(forecast.temp)}°C</span>
                  <span className="feels-like">Feels {Math.round(forecast.apparent)}°C</span>
                </div>
                <div className="precip-details">
                  <span className="pop">{forecast.pop}% rain</span>
                  {forecast.precip > 0 && (
                    <span className="amount">{forecast.precip.toFixed(1)}mm</span>
                  )}
                </div>
                <div className="other-details">
                  <span className="wind">{Math.round(forecast.wind)} km/h</span>
                  <span className="uv">UV {Math.round(forecast.uv)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ForecastChart: React.FC<ForecastChartProps> = ({
  forecasts,
  loading = false,
  cityName
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<ChartPoint | null>(null);

  // Chart configuration
  // 图表配置
  const chartDimensions: ChartDimensions = {
    width: 800,
    height: 300,
    padding: {
      top: 40,
      right: 60,
      bottom: 60,
      left: 60
    }
  };

  // Prepare chart data
  // 准备图表数据
  const chartData = useMemo(() => {
    if (!forecasts.length) return { points: [], tempRange: [0, 30], popRange: [0, 100] };

    const displayHours = forecasts.slice(0, 48);
    const tempValues = displayHours.map(f => f.apparent);

    const tempMin = Math.min(...tempValues);
    const tempMax = Math.max(...tempValues);
    const tempRange = [tempMin - 2, tempMax + 2];
    const popRange = [0, 100];

    const chartWidth = chartDimensions.width - chartDimensions.padding.left - chartDimensions.padding.right;
    const chartHeight = chartDimensions.height - chartDimensions.padding.top - chartDimensions.padding.bottom;

    const points: ChartPoint[] = displayHours.map((forecast, index) => {
      const date = new Date(forecast.isoTime);
      const time = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
      const isToday = date.toDateString() === new Date().toDateString();
      const isTomorrow = date.toDateString() === new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString();
      
      let dayLabel = dayOfWeek;
      if (isToday) dayLabel = 'Today';
      else if (isTomorrow) dayLabel = 'Tomorrow';

      const x = chartDimensions.padding.left + (index / (displayHours.length - 1)) * chartWidth;
      const tempY = chartDimensions.padding.top + 
        (1 - (forecast.apparent - tempRange[0]) / (tempRange[1] - tempRange[0])) * (chartHeight * 0.7);
      
      return {
        x,
        y: tempY,
        temp: forecast.apparent,
        pop: forecast.pop,
        time,
        dayLabel,
        forecast
      };
    });

    return { points, tempRange, popRange };
  }, [forecasts, chartDimensions]);

  // Generate SVG path for temperature line
  // 生成温度线的SVG路径
  const temperaturePath = useMemo(() => {
    if (chartData.points.length < 2) return '';
    
    const pathData = chartData.points.map((point, index) => {
      return `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`;
    }).join(' ');
    
    return pathData;
  }, [chartData]);

  // Generate precipitation bars data
  // 生成降水条数据
  const precipitationBars = useMemo(() => {
    const chartHeight = chartDimensions.height - chartDimensions.padding.top - chartDimensions.padding.bottom;
    const barWidth = 8;
    
    return chartData.points.map((point) => {
      const barHeight = (point.pop / 100) * (chartHeight * 0.25);
      const barY = chartDimensions.height - chartDimensions.padding.bottom - barHeight;
      
      return {
        x: point.x - barWidth / 2,
        y: barY,
        width: barWidth,
        height: barHeight,
        opacity: point.pop / 100
      };
    });
  }, [chartData, chartDimensions]);

  if (loading) {
    return (
      <section className="forecast-chart loading" role="region" aria-label="48-hour forecast chart">
        <div className="loading-placeholder" role="status" aria-label="Loading forecast chart">
          <div className="spinner" aria-hidden="true"></div>
          <span>Loading 48-hour forecast chart...</span>
        </div>
      </section>
    );
  }

  if (!forecasts.length) {
    return (
      <section className="forecast-chart empty" role="region" aria-label="48-hour forecast chart">
        <div className="empty-message" role="status">
          <h3>No Forecast Chart Data</h3>
          <p>Chart data is not available at this time.</p>
        </div>
      </section>
    );
  }

  const totalHours = forecasts.length;
  const displayHours = Math.min(totalHours, 48);

  return (
    <section className="forecast-chart" role="region" aria-label="48-hour weather forecast chart">
      <header className="chart-header">
        <h3 id="forecast-chart-title">
          48-Hour Forecast Chart{cityName && ` for ${cityName}`}
        </h3>
        <p className="chart-description" aria-describedby="forecast-chart-title">
          Temperature trend (line) and precipitation probability (bars) for {displayHours} hours
        </p>
      </header>

      <div className="chart-container">
        <svg
          width="100%"
          height={chartDimensions.height}
          viewBox={`0 0 ${chartDimensions.width} ${chartDimensions.height}`}
          className="forecast-svg"
          role="img"
          aria-label="Temperature and precipitation forecast chart"
        >
          {/* Background grid */}
          <defs>
            <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Precipitation bars */}
          {precipitationBars.map((bar, index) => (
            <rect
              key={`precip-${index}`}
              x={bar.x}
              y={bar.y}
              width={bar.width}
              height={bar.height}
              fill="#3b82f6"
              opacity={Math.max(0.2, bar.opacity)}
              className="precip-bar"
            />
          ))}

          {/* Temperature line */}
          <path
            d={temperaturePath}
            fill="none"
            stroke="#ef4444"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="temp-line"
          />

          {/* Temperature points */}
          {chartData.points.map((point, index) => (
            <circle
              key={`temp-point-${index}`}
              cx={point.x}
              cy={point.y}
              r="4"
              fill="#ef4444"
              stroke="white"
              strokeWidth="2"
              className="temp-point"
              onMouseEnter={() => setHoveredPoint(point)}
              onMouseLeave={() => setHoveredPoint(null)}
              style={{ cursor: 'pointer' }}
            />
          ))}

          {/* Time labels */}
          {chartData.points
            .filter((_, index) => index % 6 === 0) // Show every 6th hour
            .map((point, index) => (
              <g key={`time-label-${index}`}>
                <text
                  x={point.x}
                  y={chartDimensions.height - chartDimensions.padding.bottom + 20}
                  textAnchor="middle"
                  className="time-label"
                  fontSize="12"
                  fill="#666"
                >
                  {point.time}
                </text>
                <text
                  x={point.x}
                  y={chartDimensions.height - chartDimensions.padding.bottom + 35}
                  textAnchor="middle"
                  className="day-label"
                  fontSize="10"
                  fill="#999"
                >
                  {point.dayLabel}
                </text>
              </g>
            ))}

          {/* Y-axis labels */}
          <text
            x={chartDimensions.padding.left - 10}
            y={chartDimensions.padding.top - 10}
            textAnchor="end"
            className="axis-label"
            fontSize="12"
            fill="#666"
          >
            Temperature (°C)
          </text>
          <text
            x={chartDimensions.width - chartDimensions.padding.right + 10}
            y={chartDimensions.padding.top - 10}
            textAnchor="start"
            className="axis-label"
            fontSize="12"
            fill="#666"
          >
            Rain % (bars)
          </text>
        </svg>

        {/* Hover tooltip */}
        {hoveredPoint && (
          <div
            className="chart-tooltip"
            style={{
              position: 'absolute',
              left: `${(hoveredPoint.x / chartDimensions.width) * 100}%`,
              top: `${(hoveredPoint.y / chartDimensions.height) * 100}%`,
              transform: 'translate(-50%, -100%)',
              pointerEvents: 'none'
            }}
          >
            <div className="tooltip-content">
              <div className="tooltip-time">{hoveredPoint.time} - {hoveredPoint.dayLabel}</div>
              <div className="tooltip-temp">{Math.round(hoveredPoint.temp)}°C feels like</div>
              <div className="tooltip-pop">{hoveredPoint.pop}% rain chance</div>
            </div>
          </div>
        )}
      </div>

      {/* Toggle detailed view */}
      <div className="chart-controls">
        <button
          className="details-toggle"
          onClick={() => setShowDetails(!showDetails)}
          aria-expanded={showDetails}
          aria-controls="hourly-details"
        >
          {showDetails ? '▲ Hide' : '▼ Show'} Detailed Hourly Data
        </button>
      </div>

      {/* Expandable detailed hourly data */}
      {showDetails && (
        <div id="hourly-details" className="details-section">
          <h4>Detailed Hourly Information</h4>
          <HourlyDetails forecasts={forecasts} />
        </div>
      )}

      {totalHours > 48 && (
        <footer className="chart-footer">
          <p aria-live="polite">
            Chart shows first 48 hours. Additional {totalHours - 48} hours available in detailed view.
          </p>
        </footer>
      )}
    </section>
  );
};