/**
 * Device Detection Utilities
 * 
 * Captures device information for audit logging.
 */

export interface DeviceInfo {
  browser: string;
  browserVersion: string;
  os: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  screenResolution: string;
  userAgent: string;
}

export interface LocationInfo {
  ip?: string;
  country?: string;
  city?: string;
  region?: string;
  timezone?: string;
}

/**
 * Get device information from browser
 */
export function getDeviceInfo(): DeviceInfo {
  const userAgent = navigator.userAgent;
  
  // Detect browser
  let browser = 'Unknown';
  let browserVersion = '';
  
  if (userAgent.indexOf('Firefox') > -1) {
    browser = 'Firefox';
    browserVersion = userAgent.match(/Firefox\/(\d+\.\d+)/)?.[1] || '';
  } else if (userAgent.indexOf('Chrome') > -1) {
    browser = 'Chrome';
    browserVersion = userAgent.match(/Chrome\/(\d+\.\d+)/)?.[1] || '';
  } else if (userAgent.indexOf('Safari') > -1) {
    browser = 'Safari';
    browserVersion = userAgent.match(/Version\/(\d+\.\d+)/)?.[1] || '';
  } else if (userAgent.indexOf('Edge') > -1) {
    browser = 'Edge';
    browserVersion = userAgent.match(/Edge\/(\d+\.\d+)/)?.[1] || '';
  }
  
  // Detect OS
  let os = 'Unknown';
  
  if (userAgent.indexOf('Win') > -1) os = 'Windows';
  else if (userAgent.indexOf('Mac') > -1) os = 'MacOS';
  else if (userAgent.indexOf('Linux') > -1) os = 'Linux';
  else if (userAgent.indexOf('Android') > -1) os = 'Android';
  else if (userAgent.indexOf('iOS') > -1) os = 'iOS';
  
  // Detect device type
  let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  
  if (/Mobile|Android|iPhone/i.test(userAgent)) {
    deviceType = 'mobile';
  } else if (/iPad|Tablet/i.test(userAgent)) {
    deviceType = 'tablet';
  }
  
  // Get screen resolution
  const screenResolution = `${window.screen.width}x${window.screen.height}`;
  
  return {
    browser,
    browserVersion,
    os,
    deviceType,
    screenResolution,
    userAgent
  };
}

/**
 * Get location information from IP address
 * Uses a free IP geolocation API
 */
export async function getLocationFromIP(): Promise<LocationInfo> {
  try {
    // Use ipapi.co free API (no key required, 1000 requests/day)
    const response = await fetch('https://ipapi.co/json/', {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch location');
    }
    
    const data = await response.json();
    
    return {
      ip: data.ip,
      country: data.country_name,
      city: data.city,
      region: data.region,
      timezone: data.timezone
    };
  } catch (error) {
    console.error('[DeviceDetection] Failed to get location:', error);
    // Return empty object on error - don't break the app
    return {};
  }
}
