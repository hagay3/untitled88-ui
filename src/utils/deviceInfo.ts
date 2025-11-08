/**
 * Device Information Utility
 * Captures and manages device information for authentication tracking
 */

export interface DeviceInfo {
  device_id: string;
  operating_system: string;
  browser: string;
  device_type: string;
  device_name: string;
  ip_address: string;
  user_agent: string;
  operating_system_version: string;
  timestamp: number;
}

/**
 * Generate a unique device ID based on browser characteristics
 */
function generateDeviceId(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx!.textBaseline = 'top';
  ctx!.font = '14px Arial';
  ctx!.fillText('Device fingerprint', 2, 2);
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    canvas.toDataURL()
  ].join('|');
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
}

/**
 * Detect operating system from user agent
 * Normalizes OS names to: mac/windows/linux/ios/android/unknown
 */
function getOperatingSystem(): { os: string; version: string } {
  const userAgent = navigator.userAgent;
  
  if (userAgent.includes('Windows NT 10.0')) return { os: 'windows', version: '10' };
  if (userAgent.includes('Windows NT 6.3')) return { os: 'windows', version: '8.1' };
  if (userAgent.includes('Windows NT 6.2')) return { os: 'windows', version: '8' };
  if (userAgent.includes('Windows NT 6.1')) return { os: 'windows', version: '7' };
  if (userAgent.includes('Windows')) return { os: 'windows', version: 'Unknown' };
  
  if (userAgent.includes('Mac OS X')) {
    const match = userAgent.match(/Mac OS X (\d+[._]\d+[._]\d+)/);
    const version = match ? match[1].replace(/_/g, '.') : 'Unknown';
    return { os: 'mac', version };
  }
  
  if (userAgent.includes('Linux')) return { os: 'linux', version: 'Unknown' };
  if (userAgent.includes('Android')) {
    const match = userAgent.match(/Android (\d+[.\d]*)/);
    const version = match ? match[1] : 'Unknown';
    return { os: 'android', version };
  }
  if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    const match = userAgent.match(/OS (\d+[_\d]*)/);
    const version = match ? match[1].replace(/_/g, '.') : 'Unknown';
    return { os: 'ios', version };
  }
  
  return { os: 'unknown', version: 'Unknown' };
}

/**
 * Detect browser from user agent
 * Normalizes browser names to lowercase
 */
function getBrowser(): string {
  const userAgent = navigator.userAgent;
  
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'chrome';
  if (userAgent.includes('Firefox')) return 'firefox';
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'safari';
  if (userAgent.includes('Edg')) return 'edge';
  if (userAgent.includes('Opera')) return 'opera';
  
  return 'unknown';
}

/**
 * Detect device type
 */
function getDeviceType(): string {
  const userAgent = navigator.userAgent;
  
  if (/tablet|ipad/i.test(userAgent)) return 'tablet';
  if (/mobile|android|iphone/i.test(userAgent)) return 'mobile';
  return 'desktop';
}

/**
 * Generate device name
 */
function getDeviceName(): string {
  const os = getOperatingSystem();
  const browser = getBrowser();
  const deviceType = getDeviceType();
  
  return `${os.os} ${deviceType} (${browser})`;
}

/**
 * Get IP address (using a public API)
 */
async function getIpAddress(): Promise<string> {
  try {
    const response = await fetch('https://ipapi.co/ip/', { timeout: 5000 });
    const ip = await response.text();
    return ip.trim() || 'unknown';
  } catch (error) {
    return 'unknown';
  }
}

/**
 * Capture complete device information
 */
export async function captureDeviceInfo(): Promise<DeviceInfo> {
  const os = getOperatingSystem();
  const ipAddress = await getIpAddress();
  
  const deviceInfo: DeviceInfo = {
    device_id: generateDeviceId(),
    operating_system: os.os,
    operating_system_version: os.version,
    browser: getBrowser(),
    device_type: getDeviceType(),
    device_name: getDeviceName(),
    ip_address: ipAddress,
    user_agent: navigator.userAgent,
    timestamp: Date.now()
  };
  
  return deviceInfo;
}

/**
 * Store device info in localStorage before authentication
 */
export async function storeDeviceInfoForAuth(): Promise<void> {
  try {
    const deviceInfo = await captureDeviceInfo();
    localStorage.setItem('auth_device_info', JSON.stringify(deviceInfo));
    localStorage.setItem('auth_device_info_timestamp', Date.now().toString());
  } catch (error) {
    console.error('Failed to store device info:', error);
  }
}

/**
 * Retrieve device info from localStorage during authentication
 */
export function getStoredDeviceInfo(): DeviceInfo | null {
  try {
    const stored = localStorage.getItem('auth_device_info');
    const timestamp = localStorage.getItem('auth_device_info_timestamp');
    
    if (!stored || !timestamp) return null;
    
    // Check if stored info is less than 10 minutes old
    const age = Date.now() - parseInt(timestamp);
    if (age > 10 * 60 * 1000) { // 10 minutes
      localStorage.removeItem('auth_device_info');
      localStorage.removeItem('auth_device_info_timestamp');
      return null;
    }
    
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to retrieve device info:', error);
    return null;
  }
}

/**
 * Clear stored device info after successful authentication
 */
export function clearStoredDeviceInfo(): void {
  localStorage.removeItem('auth_device_info');
  localStorage.removeItem('auth_device_info_timestamp');
}

/**
 * Prepare device info for login (legacy function name for compatibility)
 * This captures device info and stores it on the server for NextAuth callback
 */
export async function prepareDeviceInfoForLogin(): Promise<void> {
  try {
    const deviceInfo = await captureDeviceInfo();
    
    // Store device info on server for NextAuth callback
    await fetch('/api/auth/store-device-info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deviceInfo),
    });
    
    console.log('📱 Device info prepared for login:', deviceInfo.device_name);
  } catch (error) {
    console.warn('Failed to prepare device info for login:', error);
    // Don't throw error - login should continue even if device info fails
  }
}