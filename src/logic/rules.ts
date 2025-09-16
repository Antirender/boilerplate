// Weather rules and logic for generating summaries
// 天气规则和逻辑，用于生成摘要


import type { HourlyForecast, Hour } from './types';
// --- Apparent temperature helpers ---
// Compute fallback apparent temperature if missing, using heat index or wind chill if appropriate
// All formulas use SI units (°C, %RH, m/s)

/**
 * Compute the apparent temperature for a given hour.
 * If apparent is present, return it. Otherwise, use heat index or wind chill as appropriate.
 * @param temp Air temperature (°C)
 * @param humidity Relative humidity (%)
 * @param wind Wind speed (m/s)
 * @param apparent Optional apparent temperature (°C)
 */
export function computeApparentTemperature({ temp, humidity, wind, apparent }: { temp: number; humidity: number; wind: number; apparent?: number }): number {
  if (typeof apparent === 'number' && !isNaN(apparent)) return apparent;
  // Heat Index (Steadman's formula, °C, valid for T >= 27°C, RH >= 40%)
  if (temp >= 27 && humidity >= 40) {
    // Rothfusz regression (simplified for °C)
    const hi = -8.784695 + 1.61139411 * temp + 2.338549 * humidity
      - 0.14611605 * temp * humidity - 0.012308094 * temp * temp
      - 0.016424828 * humidity * humidity + 0.002211732 * temp * temp * humidity
      + 0.00072546 * temp * humidity * humidity - 0.000003582 * temp * temp * humidity * humidity;
    return Math.round(hi * 10) / 10;
  }
  // Wind Chill (Environment Canada, valid for T <= 10°C, wind >= 4.8 m/s)
  if (temp <= 10 && wind >= 4.8) {
    const wc = 13.12 + 0.6215 * temp - 11.37 * Math.pow(wind, 0.16) + 0.3965 * temp * Math.pow(wind, 0.16);
    return Math.round(wc * 10) / 10;
  }
  // Otherwise, return air temperature
  return Math.round(temp * 10) / 10;
}

// --- Timezone-aware helpers ---
/**
 * Simple timezone handling - for now just use local time
 * In the future, can be enhanced with proper timezone libraries
 */
export function toLocalTime(isoTime: string, _tz?: string) {
  // For now, simply convert to local time
  // Can be enhanced later with proper timezone handling
  return new Date(isoTime);
}

/**
 * Compute stats for a window of hours, using fallback apparent temperature if needed.
 * All values are rounded for UI display.
 */
export function computeStats(hours: Hour[], _tz?: string) {
  if (!hours.length) {
    return {
      minApparent: 0,
      maxApparent: 0,
      avgApparent: 0,
      maxPOP: 0,
      sumPrecip: 0,
      maxUV: 0,
      maxWind: 0,
    };
  }
  // Use fallback apparent temperature if missing
  const apparentTemps = hours.map(h => computeApparentTemperature({
    temp: h.temp ?? h.apparent,
    humidity: (h as any).humidity ?? 50, // fallback if not present
    wind: h.wind,
    apparent: h.apparent
  }));
  const precipProbs = hours.map(h => h.pop);
  const precipAmounts = hours.map(h => h.precip);
  const uvValues = hours.map(h => h.uv);
  const windSpeeds = hours.map(h => h.wind);

  return {
    minApparent: Math.round(Math.min(...apparentTemps)),
    maxApparent: Math.round(Math.max(...apparentTemps)),
    avgApparent: Math.round(apparentTemps.reduce((sum, t) => sum + t, 0) / apparentTemps.length),
    maxPOP: Math.round(Math.max(...precipProbs)),
    sumPrecip: Math.round(precipAmounts.reduce((sum, p) => sum + p, 0) * 10) / 10,
    maxUV: Math.round(Math.max(...uvValues)),
    maxWind: Math.round(Math.max(...windSpeeds)),
  };
}

// New structured advice interface
export interface WeatherAdvice {
  badges: string[];
  text: string;
}

/**
 * Build user-friendly guidance based on weather conditions for the next hours
 * @param nextHours Array of Hour objects representing upcoming weather
 * @returns Structured advice with badges and summary text
 */
export function buildAdvice(nextHours: Hour[]): WeatherAdvice {
  if (!nextHours.length) {
    return {
      badges: [],
      text: "No weather data available for guidance."
    };
  }

  const badges: string[] = [];
  const stats = computeStats(nextHours.slice(0, 6)); // Focus on next 6 hours for summary
  const next3Hours = nextHours.slice(0, 3); // Check first 3 hours for precipitation
  
  // Calculate precipitation probability and total for next 3 hours
  const max3HourPOP = Math.max(...next3Hours.map(h => h.pop));
  const total3HourPrecip = next3Hours.reduce((sum, h) => sum + h.precip, 0);

  // Check thresholds and add badges
  if (max3HourPOP >= 60 && total3HourPrecip >= 0.2) {
    badges.push("Umbrella recommended");
  }

  if (stats.maxUV >= 6) {
    badges.push("Sunscreen recommended");
  }

  if (stats.maxWind >= 10) {
    badges.push("Wind caution");
  }

  if (stats.avgApparent > 25) {
    badges.push("Heat comfort tips");
  }

  if (stats.avgApparent < 0) {
    badges.push("Layered clothing recommended");
  }

  // Generate summary text
  let text = "Weather conditions for the next 6 hours: ";
  
  if (stats.avgApparent < 0) {
    text += "very cold temperatures with possible wind chill effects";
  } else if (stats.avgApparent > 25) {
    text += "warm to hot conditions with elevated comfort concerns";
  } else if (stats.avgApparent >= 15) {
    text += "pleasant temperatures suitable for most outdoor activities";
  } else {
    text += "cool conditions requiring appropriate clothing";
  }

  if (max3HourPOP >= 60) {
    text += ", with rain likely in the next 3 hours";
  } else if (max3HourPOP >= 30) {
    text += ", with possible precipitation";
  }

  if (stats.maxWind >= 10) {
    text += ", and notable wind activity";
  }

  if (stats.maxUV >= 6) {
    text += ", with elevated UV exposure";
  }

  text += ".";

  return {
    badges,
    text
  };
}

export interface WeatherRule {
  condition: (forecast: HourlyForecast) => boolean;
  message: string;
  priority: number;
}

export interface HourlyStats {
  minApparent: number;
  maxApparent: number;
  avgApparent: number;
  maxPOP: number;
  sumPrecip: number;
  maxUV: number;
  maxWind: number;
}

export interface OutfitAdvice {
  id: string;
  category: 'clothing' | 'accessories' | 'safety' | 'comfort';
  message: string;
  icon: string;
  severity: 'low' | 'medium' | 'high';
  color: string;
}

// Slice the next n hours and calculate basic stats
export function sliceNextHours(hours: Hour[], n: number = 6): { hours: Hour[]; stats: HourlyStats } {
  const nextHours = hours.slice(0, n);
  
  if (nextHours.length === 0) {
    return {
      hours: [],
      stats: {
        minApparent: 0,
        maxApparent: 0,
        avgApparent: 0,
        maxPOP: 0,
        sumPrecip: 0,
        maxUV: 0,
        maxWind: 0,
      }
    };
  }

  const apparentTemps = nextHours.map(h => h.apparent);
  const precipProbs = nextHours.map(h => h.pop);
  const precipAmounts = nextHours.map(h => h.precip);
  const uvValues = nextHours.map(h => h.uv);
  const windSpeeds = nextHours.map(h => h.wind);

  const stats: HourlyStats = {
    minApparent: Math.min(...apparentTemps),
    maxApparent: Math.max(...apparentTemps),
    avgApparent: apparentTemps.reduce((sum, temp) => sum + temp, 0) / apparentTemps.length,
    maxPOP: Math.max(...precipProbs),
    sumPrecip: precipAmounts.reduce((sum, precip) => sum + precip, 0),
    maxUV: Math.max(...uvValues),
    maxWind: Math.max(...windSpeeds),
  };

  return { hours: nextHours, stats };
}

// Weather summary generation rules
// 天气摘要生成规则
export const weatherRules: WeatherRule[] = [
  // TODO: Add weather interpretation rules
  // 待添加：天气解释规则
];

// Generate outfit and safety advice based on weather conditions
export function generateOutfitAdvice(stats: HourlyStats): OutfitAdvice[] {
  const advice: OutfitAdvice[] = [];

  // Temperature-based clothing advice
  if (stats.minApparent <= 0) {
    advice.push({
      id: 'heavy-coat',
      category: 'clothing',
      message: 'Wear a heavy winter coat, gloves, and warm hat. It feels freezing cold!',
      icon: '🧥',
      severity: 'high',
      color: '#1e40af'
    });
  } else if (stats.minApparent <= 10) {
    advice.push({
      id: 'warm-layers',
      category: 'clothing',
      message: 'Dress in warm layers with a jacket. It\'s quite chilly out there.',
      icon: '🧥',
      severity: 'medium',
      color: '#3b82f6'
    });
  } else if (stats.maxApparent >= 30) {
    advice.push({
      id: 'light-clothing',
      category: 'clothing',
      message: 'Wear light, breathable clothing. It\'s going to be hot!',
      icon: '👕',
      severity: 'medium',
      color: '#f59e0b'
    });
  } else if (stats.maxApparent >= 25) {
    advice.push({
      id: 'comfortable-clothing',
      category: 'clothing',
      message: 'Dress comfortably in light layers. Perfect weather for being outside!',
      icon: '👕',
      severity: 'low',
      color: '#10b981'
    });
  }

  // Temperature range advice
  if ((stats.maxApparent - stats.minApparent) > 15) {
    advice.push({
      id: 'layered-clothing',
      category: 'clothing',
      message: 'Temperature will vary a lot - dress in layers you can add or remove.',
      icon: '🔄',
      severity: 'medium',
      color: '#8b5cf6'
    });
  }

  // Precipitation advice
  if (stats.maxPOP >= 70 || stats.sumPrecip > 2) {
    advice.push({
      id: 'umbrella-rain',
      category: 'accessories',
      message: 'Bring an umbrella or waterproof jacket. Rain is very likely!',
      icon: '☔',
      severity: 'high',
      color: '#3b82f6'
    });
  } else if (stats.maxPOP >= 40 || stats.sumPrecip > 0.5) {
    advice.push({
      id: 'umbrella-maybe',
      category: 'accessories',
      message: 'Consider bringing an umbrella - there\'s a chance of rain.',
      icon: '🌦️',
      severity: 'medium',
      color: '#6b7280'
    });
  }

  // UV protection advice
  if (stats.maxUV >= 8) {
    advice.push({
      id: 'sunscreen-high',
      category: 'safety',
      message: 'Apply SPF 30+ sunscreen and wear sunglasses. UV levels are very high!',
      icon: '☀️',
      severity: 'high',
      color: '#f59e0b'
    });
  } else if (stats.maxUV >= 6) {
    advice.push({
      id: 'sunscreen-medium',
      category: 'safety',
      message: 'Don\'t forget sunscreen and a hat. UV levels are moderate to high.',
      icon: '🧴',
      severity: 'medium',
      color: '#f59e0b'
    });
  } else if (stats.maxUV >= 3) {
    advice.push({
      id: 'sunglasses',
      category: 'comfort',
      message: 'Sunglasses recommended for comfort in bright conditions.',
      icon: '🕶️',
      severity: 'low',
      color: '#10b981'
    });
  }

  // Wind advice
  if (stats.maxWind >= 50) {
    advice.push({
      id: 'wind-warning',
      category: 'safety',
      message: 'Very windy conditions! Secure loose items and be careful outdoors.',
      icon: '💨',
      severity: 'high',
      color: '#dc2626'
    });
  } else if (stats.maxWind >= 30) {
    advice.push({
      id: 'wind-caution',
      category: 'comfort',
      message: 'It\'s quite windy - consider a windbreaker or secure hat.',
      icon: '🌬️',
      severity: 'medium',
      color: '#f59e0b'
    });
  }

  // General comfort advice
  if (stats.avgApparent >= 20 && stats.avgApparent <= 25 && stats.maxPOP < 30 && stats.maxWind < 20) {
    advice.push({
      id: 'perfect-weather',
      category: 'comfort',
      message: 'Perfect weather for outdoor activities! Enjoy your time outside.',
      icon: '🌟',
      severity: 'low',
      color: '#10b981'
    });
  }

  return advice;
}

export function generateSummary(current: HourlyForecast, hourly: HourlyForecast[]): string {
  // TODO: Implement rule-based summary generation
  // 待实现：基于规则的摘要生成
  console.log('Generating summary for:', current, hourly);
  return 'Weather summary will be generated here';
}

export function analyzeWeatherTrend(forecasts: HourlyForecast[]): {
  trend: 'improving' | 'worsening' | 'stable';
  description: string;
} {
  // TODO: Implement weather trend analysis
  // 待实现：天气趋势分析
  console.log('Analyzing trend for:', forecasts);
  return {
    trend: 'stable',
    description: 'Weather trend analysis will be implemented here'
  };
}
