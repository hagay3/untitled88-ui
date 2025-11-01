import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🔄 [RefreshEndpoint] Refresh request received:', {
    method: req.method,
    userAgent: req.headers['user-agent'],
    timestamp: new Date().toISOString()
  });
  
  if (req.method !== 'POST') {
    console.log('❌ [RefreshEndpoint] Invalid method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get current session
    console.log('🔄 [RefreshEndpoint] Getting server session...');
    const session = await getServerSession(req, res, authOptions);
    
    console.log('🔄 [RefreshEndpoint] Session status:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      provider: (session?.user as any)?.provider,
      hasAccessToken: !!session?.user?.accessToken,
      hasRefreshToken: !!(session?.user as any)?.refreshToken,
      hasError: !!(session?.user as any)?.error,
      error: (session?.user as any)?.error
    });
    
    if (!session?.user) {
      console.log('❌ [RefreshEndpoint] No session found');
      return res.status(401).json({ error: 'No session found' });
    }

    // Check if there's a token error (from JWT callback)
    if ((session.user as any).error === "RefreshAccessTokenError") {
      console.log('❌ [RefreshEndpoint] JWT callback indicates refresh error');
      return res.status(401).json({ 
        error: 'Token refresh failed', 
        requiresReauth: true,
        message: 'Your session has expired. Please log in again.'
      });
    }

    // For Auth0 tokens, we need to get a fresh token
    const provider = (session.user as any).provider;
    
    console.log('🔄 [RefreshEndpoint] Processing refresh for provider:', provider);
    
    if (provider === 'email') {
      // For email/password authentication with refresh tokens
      const refreshToken = (session.user as any).refreshToken;
      
      console.log('🔄 [RefreshEndpoint] Email provider refresh:', {
        hasRefreshToken: !!refreshToken,
        refreshTokenPrefix: refreshToken ? `${refreshToken.substring(0, 20)}...` : 'none'
      });
      
      if (!refreshToken) {
        console.log('🔄 [RefreshEndpoint] No refresh token, falling back to token validation');
        // Fallback to token validation if no refresh token
        
        try {
          console.log('🔄 [RefreshEndpoint] Validating token via userinfo endpoint...');
          const userInfoResponse = await fetch(`https://${process.env.AUTH0_DOMAIN}/userinfo`, {
            headers: {
              'Authorization': `Bearer ${session.user.accessToken}`,
            }
          });
          
          console.log('🔄 [RefreshEndpoint] Userinfo response:', {
            status: userInfoResponse.status,
            ok: userInfoResponse.ok
          });

        if (userInfoResponse.ok) {
          console.log('✅ [RefreshEndpoint] Token is still valid');
          return res.status(200).json({
            success: true,
            message: 'Token is still valid',
            user: session.user
          });
        } else if (userInfoResponse.status === 401) {
          console.log('❌ [RefreshEndpoint] Token expired (401)');
          return res.status(401).json({ 
            error: 'Token expired', 
            requiresReauth: true,
            message: 'Your session has expired. Please log in again.'
          });
        } else if (userInfoResponse.status === 429) {
          console.log('⚠️ [RefreshEndpoint] Rate limit hit, assuming token is valid');
          // If we hit rate limit, assume token is still valid to avoid forcing logout
          return res.status(200).json({
            success: true,
            message: 'Token validation skipped due to rate limit',
            user: session.user
          });
        } else {
          console.log('❌ [RefreshEndpoint] Token validation failed:', userInfoResponse.status);
          return res.status(401).json({ 
            error: 'Token validation failed', 
            requiresReauth: true,
            message: 'Your session is invalid. Please log in again.'
          });
        }
        } catch (error: any) {
          console.error('❌ [RefreshEndpoint] Token validation error:', {
            error: error?.message || 'Unknown error',
            errorName: error?.name,
            errorCode: error?.code
          });
          
          // If it's a network error, don't force re-auth immediately
          if (error?.name === 'AbortError' || error?.code === 'ECONNRESET') {
            console.log('⚠️ [RefreshEndpoint] Network error, skipping validation');
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
        console.log('🔄 [RefreshEndpoint] Using refresh token to get new tokens...');
        try {
          const refreshResponse = await fetch(`https://${process.env.AUTH0_DOMAIN}/oauth/token`, {
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
          
          console.log('🔄 [RefreshEndpoint] Refresh token response:', {
            status: refreshResponse.status,
            ok: refreshResponse.ok
          });

          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            console.log('✅ [RefreshEndpoint] Tokens refreshed successfully:', {
              hasIdToken: !!refreshData.id_token,
              hasAccessToken: !!refreshData.access_token,
              hasRefreshToken: !!refreshData.refresh_token,
              expiresIn: refreshData.expires_in
            });
            
            return res.status(200).json({
              success: true,
              message: 'Tokens refreshed successfully',
              user: session.user // NextAuth will handle the token update automatically
            });
          } else {
            const errorData = await refreshResponse.json();
            console.error('❌ [RefreshEndpoint] Refresh token failed:', {
              status: refreshResponse.status,
              error: errorData
            });
            
            return res.status(401).json({ 
              error: 'Refresh token expired', 
              requiresReauth: true,
              message: 'Your session has expired. Please log in again.'
            });
          }
        } catch (error) {
          console.error('❌ [RefreshEndpoint] Refresh token error:', {
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          
          return res.status(401).json({ 
            error: 'Token refresh failed', 
            requiresReauth: true,
            message: 'Unable to refresh your session. Please log in again.'
          });
        }
      }
    } else if (provider === 'google') {
      console.log('✅ [RefreshEndpoint] Google OAuth - NextAuth handles refresh automatically');
      // For Google OAuth, the token should be refreshed by NextAuth automatically
      return res.status(200).json({
        success: true,
        message: 'Google OAuth session refreshed',
        user: session.user
      });
    } else {
      console.log('❌ [RefreshEndpoint] Unknown provider:', provider);
      return res.status(400).json({ error: 'Unknown authentication provider' });
    }

  } catch (error) {
    console.error('❌ [RefreshEndpoint] Internal server error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.constructor.name : typeof error
    });
    
    return res.status(500).json({ error: 'Internal server error' });
  }
}
