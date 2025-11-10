import { createRemoteJWKSet, jwtVerify } from 'jose';
import { Session } from 'next-auth';
import { apiClient } from './apiClient';

// get user ip address
export const getIpAddress = async (user_id: string): Promise<string> => {
  try {
    const response = await fetch("/api/get-ip");
    const data = await response.json();
    return data.ip;
  } catch (error) {
    sendError(user_id, "getIpAddress failed", error);
    return "0.0.0.0"; // Default value if IP cannot be retrieved
  }
};

// Modernized API call function with automatic session refresh
export const callApi = async (
  endpoint: string,
  data: any,
  method: string = "POST",
  extraHeaders?: any,
  returnJson: boolean = false
): Promise<any> => {
  try {
    // Use the secure API client for automatic session refresh
    const response = await apiClient.fetchWithAuth(endpoint, {
      method: method,
      headers: extraHeaders,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      return null;
    } else {
      if(returnJson) {
        return await response.json();
      } else {
        return await response.text();
      }
    }
  } catch (error) {
    return null;
  }
};

// get os
export const getOS = () => {
  const userAgent = window.navigator.userAgent.toLowerCase();
  if (userAgent.indexOf("win") > -1) return "windows";
  if (userAgent.indexOf("mac") > -1) return "mac";
  if (userAgent.indexOf("linux") > -1) return "linux";
  return "unknown";
};


export const getBrowserName = (): string => {
  const userAgent = navigator.userAgent.toLowerCase();

  if (userAgent.includes("chrome")) return "chrome";
  if (userAgent.includes("firefox")) return "firefox";
  if (userAgent.includes("safari")) return "safari";
  if (userAgent.includes("msie") || userAgent.includes("trident"))
    return "explorer";
  if (userAgent.includes("edge")) return "edge";

  return "unknown";
};


async function isUrlAlive(url: string, method: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: method });
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Reusable error logging function
export const sendError = async (user_id: string, message: string, error?: any): Promise<void> => {
  try {
    
    if(user_id == undefined || user_id == null || user_id == "unknown" || user_id == "unknown_user" || user_id == "") {
      user_id = localStorage.getItem("user_id_storage") || "unknown";
    }

    await callApi("send_error", { 
      user_id,
      message, 
      error: error ? String(error) : undefined 
    });
  } catch (err) {
    // Silent error - don't log errors about logging errors
  }
};

export const logUserActionGeneric: (actionName: string, actionType: string, session: Session | null, actionStatus?: ("success" | "failure"), failureReason?: string) => Promise<void> = async (
  actionName: string,
  actionType: string,
  session: Session | null,
  actionStatus: "success" | "failure" = "success",
  failureReason?: string,
) => {

  const user_id = session?.user?.id || "unknown_user"; // Get user ID from session
  
  if(user_id !== "unknown_user" && user_id !== "unknown" && user_id !== "") {
    localStorage.setItem("user_id_storage", user_id);
  }

  const data = {
    user_id,
    action_name: actionName,
    action_type: actionType,
    ip_address: await getIpAddress(session?.user?.id || ""),
    action_status: actionStatus,
    failure_reason: failureReason || null,
  };

  try {
    await callApi("user_action", data);
  } catch (error) {
    //
  }
};

export async function verifyToken(token: string): Promise<boolean> {
  const auth0Domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN;
  const clientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID;

  const jwksUri = `https://${auth0Domain}/.well-known/jwks.json`;
  const issuer = `https://${auth0Domain}/`;

  const isAlive = await isUrlAlive(jwksUri, "HEAD");
  if (!isAlive) {
    return true;
  }

  try {
    const JWKS = createRemoteJWKSet(new URL(jwksUri));

    await jwtVerify(token, JWKS, {
      issuer,
      audience: clientId,
    });

    return true;
  } catch (error) {
    callApi("send_error_invalid", { message: "Token verification failed", token: token, error: String(error) });
    return false;
  }
}


//generate unique Device ID, based on the computer that im using
//its not random it should be the same across the same computer
export const getOrGenerateDeviceId = async (): Promise<string> => {
  if (typeof window === 'undefined') return ''; // SSR-safe

  const existing = localStorage.getItem('device_id');
  if (existing) return existing;

  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    navigator.hardwareConcurrency?.toString() || '',
    screen.width + 'x' + screen.height,
  ].join('|');

  const encoder = new TextEncoder();
  const data = encoder.encode(fingerprint);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  const deviceId = hashHex.slice(0, 16); // 64-bit ID

  localStorage.setItem('device_id', deviceId);
  return deviceId;
};


//get friendly device name like "John's laptop"
export const getFriendlyDeviceName = (userName?: string): string => {
  const os = getOS();
  const deviceName = os === 'unknown' ? 'Laptop' : os.charAt(0).toUpperCase() + os.slice(1);

  if (userName) {
    return `${userName}'s ${deviceName}`;
  }
  
  return `${deviceName}`;
};

