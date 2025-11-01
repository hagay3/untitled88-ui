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
  console.log('🔄 [NextAuth] Starting token refresh...');
  console.log('🔄 [NextAuth] Token info:', {
    hasRefreshToken: !!token.refreshToken,
    refreshTokenPrefix: token.refreshToken ? `${token.refreshToken.substring(0, 20)}...` : 'none',
    accessTokenExpires: token.accessTokenExpires,
    isExpired: token.accessTokenExpires ? Date.now() > token.accessTokenExpires : 'unknown'
  });
  
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

    console.log('🔄 [NextAuth] Auth0 refresh response:', {
      status: response.status,
      ok: response.ok
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ [NextAuth] Token refresh failed:', {
        status: response.status,
        error: errorData
      });
      throw new Error(`Token refresh failed: ${response.status}`);
    }

    const refreshedTokens = await response.json();
    
    console.log('✅ [NextAuth] Token refresh successful:', {
      hasIdToken: !!refreshedTokens.id_token,
      hasAccessToken: !!refreshedTokens.access_token,
      hasRefreshToken: !!refreshedTokens.refresh_token,
      expiresIn: refreshedTokens.expires_in,
      newTokenPrefix: (refreshedTokens.id_token || refreshedTokens.access_token) ? 
        `${(refreshedTokens.id_token || refreshedTokens.access_token).substring(0, 20)}...` : 'none'
    });

    return {
      ...token,
      accessToken: refreshedTokens.id_token || refreshedTokens.access_token,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fall back to old refresh token
      accessTokenExpires: Date.now() + (refreshedTokens.expires_in * 1000),
      error: undefined,
    };
  } catch (error) {
    console.error('❌ [NextAuth] Token refresh error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.constructor.name : typeof error
    });
    
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
          console.error('Missing email or password in credentials');
          return null;
        }

        // Debug environment variables
        console.log('Auth0 Domain:', process.env.AUTH0_DOMAIN);
        console.log('Auth0 Client ID:', process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID);
        console.log('Auth0 Client Secret exists:', !!process.env.AUTH0_CLIENT_SECRET);

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
            console.error('Auth0 authentication failed:', {
              status: authResponse.status,
              statusText: authResponse.statusText,
              error: errorData
            });
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
            console.error('Failed to get user info from Auth0');
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
          console.error('Authentication error:', error);
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
      console.log('🔑 [NextAuth] JWT callback triggered:', {
        hasAccount: !!account,
        hasUser: !!user,
        hasToken: !!token,
        tokenId: token.id,
        accountProvider: account?.provider,
        isFirstLogin: !!(account && user)
      });

      try {
        // First-time login or when user is authenticated
        if (account && user) {
          console.log('🔑 [NextAuth] Processing first-time login:', {
            userId: user.id,
            userEmail: user.email,
            accountProvider: account.provider,
            hasIdToken: !!account.id_token,
            hasRefreshToken: !!account.refresh_token,
            hasUserRefreshToken: !!(user as any).refreshToken
          });
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
          
          console.log('🔑 [NextAuth] Login tokens set:', {
            hasAccessToken: !!token.accessToken,
            hasRefreshToken: !!token.refreshToken,
            accessTokenPrefix: token.accessToken ? `${token.accessToken.substring(0, 20)}...` : 'none',
            refreshTokenPrefix: token.refreshToken ? `${token.refreshToken.substring(0, 20)}...` : 'none',
            provider: token.provider,
            accessTokenExpires: token.accessTokenExpires
          });
          
          // Try to get device info from the most recent entry in global storage
          let deviceInfo = {
            device_id: "",
            operating_system: "unknown",
            browser: "unknown", 
            device_type: "desktop",
            device_name: "Unknown Device",
            ip_address: "unknown"
          };
          
          if (global.pendingDeviceIds && global.pendingDeviceIds.size > 0) {
            // Get the most recent device info (within last 5 minutes)
            const now = Date.now();
            let mostRecentEntry = null;
            let mostRecentTime = 0;
            
            for (const [, value] of global.pendingDeviceIds.entries()) {
              if (now <= value.expires && value.timestamp > mostRecentTime) {
                mostRecentEntry = value;
                mostRecentTime = value.timestamp;
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
            }
          }

          
          // Session ID is already included in the Auth0 token
          await handleLogin(user.id, account.id_token, deviceInfo);
        } else if (token.id && token.email && !token.loginProcessed) {
          console.log('🔑 [NextAuth] Processing delayed login for existing token');
          await handleLogin(token.id as string, token.accessToken as string, null);
          token.loginProcessed = true;
        } else {
          // Check if token needs refresh
          console.log('🔑 [NextAuth] Checking if token needs refresh:', {
            hasAccessTokenExpires: !!token.accessTokenExpires,
            accessTokenExpires: token.accessTokenExpires,
            currentTime: Date.now(),
            isExpired: token.accessTokenExpires ? Date.now() >= token.accessTokenExpires : 'unknown',
            hasRefreshToken: !!token.refreshToken
          });
          
          if (token.accessTokenExpires && Date.now() < token.accessTokenExpires) {
            console.log('✅ [NextAuth] Token is still valid, no refresh needed');
            return token;
          }
          
          if (!token.refreshToken) {
            console.error('❌ [NextAuth] No refresh token available');
            token.error = "RefreshAccessTokenError";
            return token;
          }
          
          console.log('🔄 [NextAuth] Token expired, attempting refresh...');
          try {
            const refreshedTokens = await refreshAccessToken(token);
            console.log('✅ [NextAuth] Token refresh completed successfully');
            return refreshedTokens;
          } catch (error) {
            console.error('❌ [NextAuth] Token refresh failed in JWT callback:', {
              error: error instanceof Error ? error.message : 'Unknown error'
            });
            token.error = "RefreshAccessTokenError";
            return token;
          }
        }
      } catch (error) {
        console.error('❌ [NextAuth] JWT callback error:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          errorType: error instanceof Error ? error.constructor.name : typeof error
        });
      }

      console.log('🔑 [NextAuth] JWT callback completed, returning token:', {
        hasId: !!token.id,
        hasAccessToken: !!token.accessToken,
        hasRefreshToken: !!token.refreshToken,
        hasError: !!token.error,
        error: token.error
      });
      
      return token;
    },
    async session({ session, token }: { session: any; token: JWT }) {
      console.log('📝 [NextAuth] Session callback triggered:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        hasToken: !!token,
        tokenId: token.id,
        tokenError: token.error
      });
      
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
          
          console.log('📝 [NextAuth] Session user populated:', {
            userId: session.user.id,
            userEmail: session.user.email,
            hasAccessToken: !!session.user.accessToken,
            hasRefreshToken: !!session.user.refreshToken,
            provider: session.user.provider,
            hasError: !!session.user.error,
            error: session.user.error
          });
        }
      } catch (error) {
        console.error('❌ [NextAuth] Session callback error:', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      
      console.log('📝 [NextAuth] Session callback completed');
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
    
    // Add device info to the payload
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
      country: deviceInfo?.country || "",
      city: deviceInfo?.city || "",
    };
    
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
    // Add user agent if available from request
    if (req && deviceInfo) {
      deviceInfo.user_agent = req.headers?.['user-agent'] || '';
    }
    
    // Call backend API to log the user login using server-side function
    await callApiServerSide("user_login", user_id, accessToken, deviceInfo);

    
  } catch (error) {
    console.error('Error in handleLogin:', error);
  }
};

export default NextAuth(authOptions);

