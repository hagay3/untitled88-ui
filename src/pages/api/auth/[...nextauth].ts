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
          scope: "openid email profile",
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
              scope: 'openid email profile',
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
            idToken: tokenData.id_token,
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
          token.id = user.id;
          token.name = user.name;
          token.email = user.email;
          token.picture = user.image;
          
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

          
          await handleLogin(token.id as string, token.accessToken as string, null);
          token.loginProcessed = true;
        } else {

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
          session.user.name = token.name;
          session.user.email = token.email;
          session.user.image = token.picture;
          session.user.provider = token.provider; // Attach provider to session
   
        } else {

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
    
    // Add device info to the payload
    const payloadWithDeviceInfo = {
      user_id: user_id,
      device_id: deviceInfo?.device_id || "",
      operating_system: deviceInfo?.operating_system || "unknown",
      browser: deviceInfo?.browser || "unknown",
      device_type: deviceInfo?.device_type || "desktop",
      device_name: deviceInfo?.device_name || "Unknown Device",
      ip_address: deviceInfo?.ip_address || "unknown",
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
  deviceInfo: any = null
) => {
  
  try {

    
    // Call backend API to log the user login using server-side function
    await callApiServerSide("user_login", user_id, accessToken, deviceInfo);

    
  } catch (error) {
    //
  }
};

export default NextAuth(authOptions);

