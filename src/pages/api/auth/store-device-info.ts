import { NextApiRequest, NextApiResponse } from 'next';

// Extend global to include our device ID storage
declare global {
  var pendingDeviceIds: Map<string, {
    device_id: string;
    operating_system: string;
    browser: string;
    device_type: string;
    device_name: string;
    ip_address: string;
    timestamp: number;
    expires: number;
    user_agent: string;
    operating_system_version: string;
  }> | undefined;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const deviceInfo = req.body;
    
    // Validate required fields
    if (!deviceInfo.device_id || !deviceInfo.operating_system || !deviceInfo.browser) {
      return res.status(400).json({ error: 'Missing required device info fields' });
    }

    // Initialize global storage if it doesn't exist
    if (!global.pendingDeviceIds) {
      global.pendingDeviceIds = new Map();
    }

    // Clean up expired entries (older than 10 minutes)
    const now = Date.now();
    const tenMinutesAgo = now - (10 * 60 * 1000);
    
    for (const [key, entry] of global.pendingDeviceIds.entries()) {
      if (entry.timestamp < tenMinutesAgo) {
        global.pendingDeviceIds.delete(key);
      }
    }

    // Store device info with expiration
    const deviceKey = `${deviceInfo.device_id}_${now}`;
    const deviceEntry = {
      device_id: deviceInfo.device_id,
      operating_system: deviceInfo.operating_system,
      browser: deviceInfo.browser,
      device_type: deviceInfo.device_type || 'desktop',
      device_name: deviceInfo.device_name || 'Unknown Device',
      ip_address: deviceInfo.ip_address || 'unknown',
      user_agent: deviceInfo.user_agent || req.headers['user-agent'] || '',
      operating_system_version: deviceInfo.operating_system_version || '',
      timestamp: now,
      expires: now + (10 * 60 * 1000) // Expire in 10 minutes
    };

    global.pendingDeviceIds.set(deviceKey, deviceEntry);

    res.status(200).json({ 
      success: true, 
      message: 'Device info stored successfully',
      device_key: deviceKey,
      stored_entries: global.pendingDeviceIds.size,
      expires_at: new Date(deviceEntry.expires).toISOString()
    });

  } catch (error) {
    
    res.status(500).json({ error: 'Failed' });
  }
}
