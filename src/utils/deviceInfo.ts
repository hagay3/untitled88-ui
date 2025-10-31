import { getOrGenerateDeviceId, getFriendlyDeviceName, getOS, getBrowserName } from './actions';
import { getDeviceType } from './mobileDetection';

export interface DeviceInfo {
  device_id: string;
  operating_system: string;
  browser: string;
  device_type: string;
  device_name: string;
  ip_address?: string;
}

/**
 * Collect comprehensive device information from the browser
 */
export const collectDeviceInfo = async (userName?: string): Promise<DeviceInfo> => {
  if (typeof window === 'undefined') {
    // SSR fallback
    return {
      device_id: '',
      operating_system: 'unknown',
      browser: 'unknown',
      device_type: 'desktop',
      device_name: 'Unknown Device',
    };
  }

  const device_id = await getOrGenerateDeviceId();
  const operating_system = getOS();
  const browser = getBrowserName();
  const device_type = getDeviceType();
  const device_name = getFriendlyDeviceName(userName);

  return {
    device_id,
    operating_system,
    browser,
    device_type,
    device_name,
  };
};

/**
 * Send device information to the backend for storage before login
 */
export const storeDeviceInfo = async (deviceInfo: DeviceInfo): Promise<boolean> => {
  try {
    const response = await fetch('/api/auth/device-info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deviceInfo),
    });

    if (!response.ok) {
      console.error('Failed to store device info:', response.statusText);
      return false;
    }

    await response.json();
    return true;
  } catch (error) {
    console.error('Error storing device info:', error);
    return false;
  }
};

/**
 * Collect and store device information before login
 * This should be called on login page load or before authentication
 */
export const prepareDeviceInfoForLogin = async (userName?: string): Promise<DeviceInfo> => {
  const deviceInfo = await collectDeviceInfo(userName);
  
  // Store device info for the login process
  await storeDeviceInfo(deviceInfo);
  
  return deviceInfo;
};
