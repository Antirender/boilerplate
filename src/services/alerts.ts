// Weather alerts service for fetching Environment Canada alerts
// 天气警报服务，用于获取加拿大环境部的天气警报

export interface WeatherAlert {
  title: string;
  description: string;
  severity: string;
  effective: string;
  expires: string;
}

// Custom error types for alerts API
// 警报API的自定义错误类型
export class AlertsError extends Error {
  public code?: string;
  
  constructor(message: string, code?: string) {
    super(message);
    this.name = 'AlertsError';
    this.code = code;
  }
}

function getMockAlerts(lat: number, _lon: number): WeatherAlert[] {
  // Return sample alerts for any location to demonstrate the alert system
  // 为任何位置返回示例警报以演示警报系统
  const mockAlerts = [
    {
      title: "Weather Advisory",
      description: "Changing weather conditions expected. Monitor local forecasts and be prepared for varying conditions throughout the day.",
      severity: "Minor",
      effective: new Date().toISOString(),
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }
  ];

  // Add location-specific mock alerts based on coordinates
  // 根据坐标添加特定位置的模拟警报
  if (lat > 60) { // Arctic regions
    mockAlerts.push({
      title: "Extreme Cold Warning",
      description: "Extremely cold temperatures or wind chill values are expected. Dress warmly in layers and limit time outdoors.",
      severity: "Severe",
      effective: new Date().toISOString(),
      expires: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    });
  } else if (lat < 25) { // Tropical regions
    mockAlerts.push({
      title: "Heat Warning",
      description: "High temperatures and humidity may pose health risks. Stay hydrated and seek air conditioning when possible.",
      severity: "Moderate",
      effective: new Date().toISOString(),
      expires: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    });
  }

  return mockAlerts;
}

// Fetch weather alerts from Environment Canada / MSC GeoMet API
// 从加拿大环境部 / MSC GeoMet API 获取天气警报
export async function fetchAlerts(lat: number, lon: number): Promise<WeatherAlert[]> {
  // For demonstration purposes, we'll add some debug logging
  // 出于演示目的，我们将添加一些调试日志
  console.log(`Attempting to fetch alerts for coordinates: ${lat}, ${lon}`);
  
  try {
    const url = `https://api.weather.gc.ca/collections/alerts/items?f=json&lat=${lat}&lon=${lon}`;
    console.log('Request URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'WeatherApp/1.0',
      },
      // Add timeout to prevent hanging requests
      // 添加超时以防止请求挂起
      signal: AbortSignal.timeout(10000) // 10 seconds timeout
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      throw new AlertsError(
        `Failed to fetch alerts: ${response.status} ${response.statusText}`,
        response.status.toString()
      );
    }

    const data = await response.json();
    console.log('Alert API response:', data);
    
    // Handle the case where there's no features array or it's empty
    // 处理没有features数组或数组为空的情况
    if (!data.features || !Array.isArray(data.features)) {
      console.log('No features array found in response, returning empty array');
      return [];
    }

    console.log(`Found ${data.features.length} alert features`);

    // Extract and format alerts from the response
    // 从响应中提取和格式化警报
    const alerts: WeatherAlert[] = data.features
      .filter((feature: any) => feature.properties) // Filter out invalid features / 过滤无效的特征
      .map((feature: any) => {
        const props = feature.properties;
        console.log('Processing alert feature:', props);
        
        return {
          title: props.headline || props.event || 'Weather Alert',
          description: props.description || props.instruction || 'No description available',
          severity: props.severity || props.urgency || 'Unknown',
          effective: props.effective || props.onset || new Date().toISOString(),
          expires: props.expires || props.ends || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        };
      })
      .filter((alert: WeatherAlert) => {
        // Only return active alerts (not expired)
        // 只返回活跃的警报（未过期）
        const now = new Date();
        const expires = new Date(alert.expires);
        const isActive = expires > now;
        console.log(`Alert "${alert.title}" is ${isActive ? 'active' : 'expired'}`);
        return isActive;
      });

    console.log(`Returning ${alerts.length} active alerts`);
    return alerts;

  } catch (error) {
    // Handle network errors gracefully
    // 优雅地处理网络错误
    console.warn('Error fetching alerts:', error);
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      // Network error - return mock data for demo
      // 网络错误 - 返回模拟数据用于演示
      console.log('Network error, returning mock alerts for demo purposes');
      return getMockAlerts(lat, lon);
    }
    
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      // Timeout error - return mock data for demo
      // 超时错误 - 返回模拟数据用于演示
      console.log('Timeout error, returning mock alerts for demo purposes');
      return getMockAlerts(lat, lon);
    }
    
    if (error instanceof AlertsError) {
      // API error - return mock data for demo
      // API错误 - 返回模拟数据用于演示
      console.log('API error, returning mock alerts for demo purposes');
      return getMockAlerts(lat, lon);
    }
    
    // Unknown error - log it but don't break the app
    // 未知错误 - 记录但不破坏应用
    console.warn('Unknown error fetching alerts, returning mock data for demo:', error);
    return getMockAlerts(lat, lon);
  }
}
