import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get current session
    const session = await getServerSession(req, res, authOptions);
    
    
    if (!session?.user) {
      return res.status(401).json({ error: 'No session found' });
    }

    // Check if there's a token error (from JWT callback)
    if ((session.user as any).error === "RefreshAccessTokenError") {
      return res.status(401).json({ 
        error: 'Token refresh failed', 
        requiresReauth: true,
        message: 'Your session has expired. Please log in again.'
      });
    }

    // For Auth0 tokens, we need to get a fresh token
    const provider = (session.user as any).provider;
    
    
    if (provider === 'email') {
      // For email/password authentication with refresh tokens
      const refreshToken = (session.user as any).refreshToken;
      
      
      if (!refreshToken) {
        // Fallback to token validation if no refresh token
        
        try {
          const userInfoResponse = await fetch(`https://${process.env.NEXT_PUBLIC_AUTH0_DOMAIN}/userinfo`, {
            headers: {
              'Authorization': `Bearer ${session.user.accessToken}`,
            }
          });
          

        if (userInfoResponse.ok) {
          return res.status(200).json({
            success: true,
            message: 'Token is still valid',
            user: session.user
          });
        } else if (userInfoResponse.status === 401) {
          return res.status(401).json({ 
            error: 'Token expired', 
            requiresReauth: true,
            message: 'Your session has expired. Please log in again.'
          });
        } else if (userInfoResponse.status === 429) {
          // If we hit rate limit, assume token is still valid to avoid forcing logout
          return res.status(200).json({
            success: true,
            message: 'Token validation skipped due to rate limit',
            user: session.user
          });
        } else {
          return res.status(401).json({ 
            error: 'Token validation failed', 
            requiresReauth: true,
            message: 'Your session is invalid. Please log in again.'
          });
        }
        } catch (error: any) {
          
          // If it's a network error, don't force re-auth immediately
          if (error?.name === 'AbortError' || error?.code === 'ECONNRESET') {
            return res.status(200).json({
              success: true,
              message: 'Token validation skipped due to network error',
              user: session.user
            });
          }
        
          return res.status(401).json({ 
            error: 'Token validation failed', 
            requiresReauth: true,
            message: 'Unable to validate your session. Please log in again.'
          });
        }
      } else {
        // We have a refresh token, use it to get new tokens
        try {
          const refreshResponse = await fetch(`https://${process.env.NEXT_PUBLIC_AUTH0_DOMAIN}/oauth/token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              grant_type: 'refresh_token',
              client_id: process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID,
              client_secret: process.env.AUTH0_CLIENT_SECRET,
              refresh_token: refreshToken,
            }),
          });
          

          if (refreshResponse.ok) {
            await refreshResponse.json(); // Consume the response
            
            return res.status(200).json({
              success: true,
              message: 'Tokens refreshed successfully',
              user: session.user // NextAuth will handle the token update automatically
            });
          } else {
            await refreshResponse.json(); // Consume the error response
            
            return res.status(401).json({ 
              error: 'Refresh token expired', 
              requiresReauth: true,
              message: 'Your session has expired. Please log in again.'
            });
          }
        } catch (error) {
          
          return res.status(401).json({ 
            error: 'Token refresh failed', 
            requiresReauth: true,
            message: 'Unable to refresh your session. Please log in again.'
          });
        }
      }
    } else if (provider === 'google') {
      // For Google OAuth, the token should be refreshed by NextAuth automatically
      return res.status(200).json({
        success: true,
        message: 'Google OAuth session refreshed',
        user: session.user
      });
    } else {
      return res.status(400).json({ error: 'Unknown authentication provider' });
    }

  } catch (error) {
    
    return res.status(500).json({ error: 'Internal server error' });
  }
}
