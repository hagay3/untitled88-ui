import NextAuth, { NextAuthOptions } from "next-auth";
import Auth0Provider from "next-auth/providers/auth0";
import CredentialsProvider from "next-auth/providers/credentials";
import { JWT } from "next-auth/jwt";
import * as process from "process";

// Extend the JWT type to include our custom properties
declare module "next-auth/jwt" {
  interface JWT {
    loginProcessed?: boolean;
    provider?: string;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    error?: string;
  }
}

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
  }> | undefined;
}

/**
 * Refresh an Auth0 access token using the refresh token
 */
async function refreshAccessToken(token: JWT): Promise<JWT> {

  
  try {
    const response = await fetch(`https://${process.env.AUTH0_DOMAIN}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        client_id: process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID,
        client_secret: process.env.AUTH0_CLIENT_SECRET,
        refresh_token: token.refreshToken,
      }),
    });

   

    if (!response.ok) {
      //
    }

    const refreshedTokens = await response.json();


    return {
      ...token,
      accessToken: refreshedTokens.id_token || refreshedTokens.access_token,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fall back to old refresh token
      accessTokenExpires: Date.now() + (refreshedTokens.expires_in * 1000),
      error: undefined,
    };
  } catch (error) {
 
    
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    // Auth0 Provider - for Google OAuth
    Auth0Provider({
      id: "auth0",
      name: "Google",
      clientId: process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID!,
      clientSecret: process.env.AUTH0_CLIENT_SECRET!,
      issuer: process.env.AUTH0_ISSUER!,
      authorization: {
        params: {
          prompt: "login",
          connection: "google-oauth2",
          scope: "openid email profile offline_access",
          // audience: process.env.AUTH0_AUDIENCE, // Optional - only needed for backend API calls
        },
      },
      httpOptions: {
        timeout: 100000,
      },
    }),
    // Credentials Provider - for custom email/password authentication
    CredentialsProvider({
      id: "credentials",
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Debug environment variables

        try {
          // Authenticate with Auth0's Resource Owner Password Grant
          const authResponse = await fetch(`https://${process.env.AUTH0_DOMAIN}/oauth/token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              grant_type: 'http://auth0.com/oauth/grant-type/password-realm',
              username: credentials.email,
              password: credentials.password,
              realm: 'Username-Password-Authentication',
              client_id: process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID,
              client_secret: process.env.AUTH0_CLIENT_SECRET,
              scope: 'openid email profile offline_access',
            }),
          });

          if (!authResponse.ok) {
            const errorData = await authResponse.json();
            return null;
          }

          const tokenData = await authResponse.json();
          
          // Get user info from Auth0
          const userResponse = await fetch(`https://${process.env.AUTH0_DOMAIN}/userinfo`, {
            headers: {
              'Authorization': `Bearer ${tokenData.access_token}`,
            },
          });

          if (!userResponse.ok) {
            return null;
          }

          const userData = await userResponse.json();

          // Return user object that NextAuth expects
          return {
            id: userData.sub,
            email: userData.email,
            name: userData.name || userData.email,
            image: userData.picture,
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            idToken: tokenData.id_token,
            expiresAt: tokenData.expires_in ? Date.now() + (tokenData.expires_in * 1000) : undefined,
          };
        } catch (error) {
          return null;
        }
      }
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: Number(process.env.NEXT_PUBLIC_USER_SESSION_TTL_MINUTES) * 60,
  },
  jwt: {
    maxAge: Number(process.env.NEXT_PUBLIC_USER_SESSION_TTL_MINUTES) * 60,
  },
  callbacks: {
    async jwt({
      token,
      user,
      account,
    }: {
      token: JWT;
      user: any;
      account: any;
    }) {


      try {
        // First-time login or when user is authenticated
        if (account && user) {
   
          token.accessToken = account.id_token; // Use account.id_token as the accessToken
          token.refreshToken = account.refresh_token || (user as any).refreshToken;
          token.id = user.id;
          token.name = user.name;
          token.email = user.email;
          token.picture = user.image;
          token.accessTokenExpires = account.expires_at ? account.expires_at * 1000 : 
                                     (user as any).expiresAt || 
                                     Date.now() + (60 * 60 * 1000); // 1 hour default
          
          // Determine provider based on the account provider
          if (account.provider === "auth0") {
            token.provider = "google";
          } else if (account.provider === "credentials") {
            token.provider = "email";
            // For credentials provider, we get tokens directly from the user object
            token.accessToken = user.accessToken || account.access_token;
          } else {
            token.provider = account.provider || "unknown";
          }
          
          token.loginProcessed = true; // Mark that we've processed the login
          

          
          // Try to get device info from the most recent entry in global storage
          let deviceInfo = {
            device_id: "",
            operating_system: "unknown",
            browser: "unknown", 
            device_type: "desktop",
            device_name: "Unknown Device",
            ip_address: "unknown"
          };
          
          // FIRST: Try to retrieve stored device info before making API calls
          console.log(`🔍 [NextAuth JWT] Starting device info retrieval for user: ${user.id}`);
          console.log(`📊 [NextAuth JWT] Global storage exists: ${!!global.pendingDeviceIds}`);
          console.log(`📊 [NextAuth JWT] Storage size: ${global.pendingDeviceIds?.size || 0}`);
          
          if (global.pendingDeviceIds && global.pendingDeviceIds.size > 0) {
            // Get the most recent device info (within last 10 minutes)
            const now = Date.now();
            let mostRecentEntry = null;
            let mostRecentTime = 0;
            
            console.log(`🔍 Checking ${global.pendingDeviceIds.size} stored device entries...`);
            
            for (const [key, entry] of global.pendingDeviceIds.entries()) {
              console.log(`📱 Device entry: ${key}`);
              console.log(`   - expires: ${entry.expires > now} (${new Date(entry.expires).toISOString()})`);
              console.log(`   - age: ${(now - entry.timestamp) / 1000}s`);
              console.log(`   - device_name: ${entry.device_name}`);
              console.log(`   - operating_system: ${entry.operating_system}`);
              console.log(`   - browser: ${entry.browser}`);
              
              if (now <= entry.expires && entry.timestamp > mostRecentTime) {
                mostRecentEntry = entry;
                mostRecentTime = entry.timestamp;
                console.log(`   ✅ This is the most recent valid entry so far`);
              } else {
                console.log(`   ❌ Entry expired or older than current best`);
              }
            }
            
            if (mostRecentEntry) {
              deviceInfo = {
                device_id: mostRecentEntry.device_id,
                operating_system: mostRecentEntry.operating_system,
                browser: mostRecentEntry.browser,
                device_type: mostRecentEntry.device_type,
                device_name: mostRecentEntry.device_name,
                ip_address: mostRecentEntry.ip_address
              };
              
              console.log(`✅ [NextAuth JWT] Retrieved stored device info:`);
              console.log(`   - device_name: ${deviceInfo.device_name}`);
              console.log(`   - operating_system: ${deviceInfo.operating_system}`);
              console.log(`   - browser: ${deviceInfo.browser}`);
              console.log(`   - device_id: ${deviceInfo.device_id}`);
              
              // Clean up old entries
              const cutoffTime = now - 600000; // 10 minutes ago
              for (const [key, entry] of global.pendingDeviceIds.entries()) {
                if (entry.timestamp < cutoffTime) {
                  global.pendingDeviceIds.delete(key);
                  console.log(`🧹 Cleaned up expired entry: ${key}`);
                }
              }
            } else {
              console.log('⚠️ [NextAuth JWT] No valid device info found in storage');
              console.log('📊 [NextAuth JWT] All entries were either expired or invalid');
            }
          } else {
            console.log('⚠️ [NextAuth JWT] No device info storage available or storage is empty');
          }
          
          // SECOND: Call subscribe_user API with retrieved device info
          console.log(`🚀 [NextAuth JWT] Calling subscribe_user API with device info:`);
          console.log(`   - user_id: ${user.id}`);
          console.log(`   - device_name: ${deviceInfo.device_name}`);
          console.log(`   - operating_system: ${deviceInfo.operating_system}`);
          console.log(`   - browser: ${deviceInfo.browser}`);
          console.log(`   - device_id: ${deviceInfo.device_id}`);
          
          try {
            await callApiServerSide("subscribe_user", user.id, token.accessToken, deviceInfo, "POST");
            console.log(`✅ [NextAuth JWT] subscribe_user API call completed`);
          } catch (error) {
            // Don't fail login if subscribe_user fails, just log it
            console.error('❌ [NextAuth JWT] Failed to call subscribe_user:', error);
          }

          
          // subscribe_user already handles user registration and login tracking
          // No need to call handleLogin separately
        } else if (token.id && token.email && !token.loginProcessed) {
          // Call subscribe_user for existing sessions too
          try {
            await callApiServerSide("subscribe_user", token.id as string, token.accessToken as string, {}, "POST");
          } catch (error) {
            // Don't fail login if subscribe_user fails, just log it
          }
          token.loginProcessed = true;
        } else {
          // Check if token needs refresh
     
          
          if (token.accessTokenExpires && Date.now() < token.accessTokenExpires) {
            return token;
          }
          
          if (!token.refreshToken) {
            token.error = "RefreshAccessTokenError";
            return token;
          }
          
          try {
            const refreshedTokens = await refreshAccessToken(token);
            return refreshedTokens;
          } catch (error) {
           
            token.error = "RefreshAccessTokenError";
            return token;
          }
        }
      } catch (error) {
     
      }

  
      
      return token;
    },
    async session({ session, token }: { session: any; token: JWT }) {
     
      
      try {
        if (session.user) {
          session.user.id = token.id;
          session.user.accessToken = token.accessToken; // Attach accessToken to session
          session.user.refreshToken = token.refreshToken; // Attach refreshToken to session
          session.user.name = token.name;
          session.user.email = token.email;
          session.user.image = token.picture;
          session.user.provider = token.provider; // Attach provider to session
          session.user.error = token.error; // Attach any token errors
          
       
        }
      } catch (error) {
        
      }
      
      return session;
    },
  },
};



// Server-side API call function for NextAuth callbacks
const callApiServerSide = async (
  endpoint: string,
  user_id: string,
  accessToken: string,
  deviceInfo: any = null,
  method: string = "POST"
): Promise<any> => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
    
    console.log(`🔧 [callApiServerSide] Preparing ${endpoint} API call:`);
    console.log(`   - user_id: ${user_id}`);
    console.log(`   - deviceInfo received:`, deviceInfo);
    
    // Add device info to the payload with proper fallbacks
    const payloadWithDeviceInfo = {
      user_id: user_id,
      device_id: deviceInfo?.device_id || "",
      operating_system: deviceInfo?.operating_system || "unknown",
      browser: deviceInfo?.browser || "unknown", 
      device_type: deviceInfo?.device_type || "desktop",
      device_name: deviceInfo?.device_name || "Unknown Device",
      ip_address: deviceInfo?.ip_address || "unknown",
      user_agent: deviceInfo?.user_agent || "",
      operating_system_version: deviceInfo?.operating_system_version || "",
    };
    
    console.log(`📦 [callApiServerSide] Final payload:`, payloadWithDeviceInfo);
    
    const response = await fetch(`${baseUrl}/api/${endpoint}`, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
      body: payloadWithDeviceInfo ? JSON.stringify(payloadWithDeviceInfo) : undefined,
    });

    if (!response.ok) {
      return null;
    } else {
      return await response.text();
    }
  } catch (error) {
    return null;
  }
};

// Handle user login and send data to backend
const handleLogin = async (
  user_id: string,
  accessToken: string,
  deviceInfo: any = null,
  req?: any
) => {
  
  try {
    // If no deviceInfo provided, try to get it from stored device info
    let finalDeviceInfo = deviceInfo;
    
    if (!finalDeviceInfo) {
      // Try to get device info from the global storage (set by client-side)
      if (global.pendingDeviceIds && global.pendingDeviceIds.size > 0) {
        const now = Date.now();
        let mostRecentEntry = null;
        let mostRecentTime = 0;

        for (const [, entry] of global.pendingDeviceIds.entries()) {
          if (now <= entry.expires && entry.timestamp > mostRecentTime) {
            mostRecentEntry = entry;
            mostRecentTime = entry.timestamp;
          }
        }

        if (mostRecentEntry) {
          finalDeviceInfo = {
            device_id: mostRecentEntry.device_id,
            operating_system: mostRecentEntry.operating_system,
            browser: mostRecentEntry.browser,
            device_type: mostRecentEntry.device_type,
            device_name: mostRecentEntry.device_name,
            ip_address: mostRecentEntry.ip_address,
            user_agent: req?.headers?.['user-agent'] || '',
            operating_system_version: mostRecentEntry.operating_system_version || ''
          };
        }
      }
      
      // Fallback device info if nothing is available
      if (!finalDeviceInfo) {
        finalDeviceInfo = {
          device_id: `fallback_${Date.now()}`,
          operating_system: 'unknown',
          browser: 'unknown',
          device_type: 'desktop',
          device_name: 'Unknown Device',
          ip_address: 'unknown',
          user_agent: req?.headers?.['user-agent'] || '',
          operating_system_version: ''
        };
      }
    }
    
    // Add user agent if available from request
    if (req && finalDeviceInfo) {
      finalDeviceInfo.user_agent = req.headers?.['user-agent'] || finalDeviceInfo.user_agent || '';
    }
    
    // Call backend API to log the user login using server-side function
    await callApiServerSide("user_login", user_id, accessToken, finalDeviceInfo, "POST");

    
  } catch (error) {
  }
};

export default NextAuth(authOptions);

