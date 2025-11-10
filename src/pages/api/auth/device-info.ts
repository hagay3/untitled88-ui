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
    const {
      device_id,
      operating_system,
      browser,
      device_type,
      device_name,
    } = req.body;

    // Validate required fields
    if (!device_id) {
      return res.status(400).json({ error: 'Device ID is required' });
    }

    // Get IP from various headers (support for proxies/load balancers)
    const forwarded = req.headers['x-forwarded-for'];
    const ip_address = forwarded 
      ? (typeof forwarded === 'string' ? forwarded.split(',')[0] : forwarded[0])
      : req.socket.remoteAddress || '0.0.0.0';

    // Initialize global storage if it doesn't exist
    if (!global.pendingDeviceIds) {
      global.pendingDeviceIds = new Map();
    }

    // Clean up expired entries (older than 10 minutes)
    const now = Date.now();
    const tenMinutesAgo = now - (10 * 60 * 1000);
    
    for (const [key, value] of global.pendingDeviceIds.entries()) {
      if (value.timestamp < tenMinutesAgo) {
        global.pendingDeviceIds.delete(key);
      }
    }

    // Store device info with expiration (5 minutes from now)
    const deviceInfo = {
      device_id: device_id || '',
      operating_system: operating_system || 'unknown',
      browser: browser || 'unknown',
      device_type: device_type || 'desktop',
      device_name: device_name || 'Unknown Device',
      ip_address: ip_address || 'unknown',
      timestamp: now,
      expires: now + (5 * 60 * 1000), // 5 minutes
      user_agent: '',
      operating_system_version: ''
    };

    // Use device_id as key to allow updates for the same device
    global.pendingDeviceIds.set(device_id, deviceInfo);

    res.status(200).json({ 
      success: true, 
      message: 'Device information stored successfully',
      stored_until: new Date(deviceInfo.expires).toISOString()
    });

  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
