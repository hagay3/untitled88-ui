import { getSession, signOut } from "next-auth/react";

/**
 * Show a confirmation dialog before signing out
 * @param callbackUrl - URL to redirect to after signout
 */
const showSignOutDialog = (callbackUrl: string = "/login"): Promise<void> => {
  return new Promise((resolve) => {
    // Create modal backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'fixed inset-0 z-[9999] bg-black bg-opacity-60 flex items-center justify-center';
    backdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    `;

    // Create modal dialog
    const modal = document.createElement('div');
    modal.className = 'bg-white rounded-2xl shadow-2xl p-6 w-[90%] max-w-md mx-4';
    modal.style.cssText = `
      background: white;
      border-radius: 1rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      padding: 1.5rem;
      width: 90%;
      max-width: 28rem;
      margin: 0 1rem;
    `;

    // Create modal content
    modal.innerHTML = `
      <div class="text-center">
        <h3 class="text-xl font-bold text-gray-800 mb-4">Your session has expired. Please sign in again to continue.</h3>
        <button id="confirm-signout" class="px-6 py-3 bg-blue-600 text-white rounded-full font-semibold text-base shadow-md hover:bg-blue-700 transition-colors">
          Sign In
        </button>
      </div>
    `;

    // Add modal to backdrop
    backdrop.appendChild(modal);
    
    // Add backdrop to document
    document.body.appendChild(backdrop);

    // Handle confirm button click
    const confirmButton = modal.querySelector('#confirm-signout');
    confirmButton?.addEventListener('click', async () => {
      // Remove modal
      document.body.removeChild(backdrop);
      
      // Sign out user
      await signOut({ redirect: true, callbackUrl });
      
      resolve();
    });

    // Prevent closing by clicking backdrop
    backdrop.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    
    modal.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  });
};

/**
 * Test function to manually trigger the signout dialog
 * Only available when NEXT_PUBLIC_TEST_SIGNOUT_DIALOG is enabled
 */
const testSignOutDialog = (): void => {
  if (process.env.NEXT_PUBLIC_TEST_SIGNOUT_DIALOG === 'true') {
    showSignOutDialog("/login");
  } else {
    console.warn("testSignOutDialog: NEXT_PUBLIC_TEST_SIGNOUT_DIALOG is not enabled");
  }
};

// Make test function globally available in development and auto-invoke
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_TEST_SIGNOUT_DIALOG === 'true') {
  (window as any).testSignOutDialog = testSignOutDialog;
  console.log("🧪 Test mode enabled: Auto-invoking signout dialog in 2 seconds...");
  
  // Automatically invoke the dialog after a short delay to allow page to load
  setTimeout(() => {
    testSignOutDialog();
  }, 2000);
}

/**
 * Secure API client with automatic session refresh
 * Handles 401 errors by refreshing the session and retrying the request
 * Uses HttpOnly cookies (next-auth default) for secure token storage
 */
class SecureApiClient {
  private baseUrl: string;
  private isRefreshing = false;
  private refreshPromise: Promise<any> | null = null;

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_URL || "") {
    this.baseUrl = baseUrl;
  }

  /**
   * Fetch with automatic session refresh on 401 errors
   * @param endpoint - API endpoint (without /api prefix)
   * @param options - Fetch options
   * @param retryCount - Internal retry counter
   */
  async fetchWithAuth(
    endpoint: string,
    options: RequestInit = {},
    retryCount: number = 0
  ): Promise<Response> {
    const maxRetries = 3;
    
    console.log(`🌐 [ApiClient] Making request to: ${endpoint} (attempt ${retryCount + 1}/${maxRetries + 1})`);
    
    try {
      // Get current session for access token
      console.log('🔑 [ApiClient] Getting session...');
      const session = await getSession();
      const accessToken = session?.user?.accessToken;
      const userId = session?.user?.id;
      
      console.log('🔑 [ApiClient] Session status:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        hasAccessToken: !!accessToken,
        hasUserId: !!userId,
        userId: userId,
        tokenPrefix: accessToken ? `${accessToken.substring(0, 20)}...` : 'none'
      });

      // Prepare headers
      const headers = {
        "Content-Type": "application/json",
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        ...(userId && { 'X-User-Id': userId }),
        ...options.headers,
      };
      
      console.log('📤 [ApiClient] Request headers:', {
        hasAuth: !!headers.Authorization,
        hasUserId: !!headers['X-User-Id'],
        hasContentType: !!headers['Content-Type'],
        userId: headers['X-User-Id'],
        authPrefix: headers.Authorization ? `${headers.Authorization.substring(0, 20)}...` : 'none',
        endpoint: `${this.baseUrl}/api/${endpoint}`
      });

      // Make the API request
      const response = await fetch(`${this.baseUrl}/api/${endpoint}`, {
        ...options,
        headers,
      });
      
      console.log('📥 [ApiClient] Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        endpoint: endpoint
      });

      // Handle 401 Unauthorized - attempt session refresh
      if (response.status === 401 && retryCount < maxRetries) {
        console.log(`🔄 [ApiClient] Got 401, attempting token refresh (retry ${retryCount + 1}/${maxRetries})`);
        
        try {
          // Ensure only one refresh attempt at a time
          if (!this.isRefreshing) {
            console.log('🔄 [ApiClient] Starting new refresh session');
            this.isRefreshing = true;
            this.refreshPromise = this.refreshSession();
          } else {
            console.log('⏳ [ApiClient] Waiting for existing refresh to complete...');
          }

          // Wait for refresh to complete
          console.log('⏳ [ApiClient] Waiting for refresh to complete...');
          await this.refreshPromise;
          this.isRefreshing = false;
          this.refreshPromise = null;
          console.log('✅ [ApiClient] Refresh completed, resetting flags');

          // Retry the original request with fresh token
          console.log('🔁 [ApiClient] Retrying original request with fresh token');
          return this.fetchWithAuth(endpoint, options, retryCount + 1);
        } catch (refreshError: any) {
          console.error('❌ [ApiClient] Refresh failed:', {
            error: refreshError?.message || 'Unknown error',
            retryCount: retryCount,
            endpoint: endpoint
          });
          
          this.isRefreshing = false;
          this.refreshPromise = null;
          
          // If refresh failed due to expired token, don't retry - the user will be redirected to login
          if (refreshError?.message?.includes('Token expired')) {
            console.log('🚪 [ApiClient] Token expired, stopping retries');
            throw refreshError;
          }
          
          // For other refresh errors, continue with normal retry logic
          throw refreshError;
        }
      }

      // If refresh failed or max retries exceeded, logout user
      if (response.status === 401 && retryCount >= maxRetries) {
        console.log(`❌ [ApiClient] Max retries exceeded (${maxRetries}), showing sign out dialog`);
        await showSignOutDialog("/login");
      }

      return response;
    } catch (error: any) {
      console.error('❌ [ApiClient] Request error:', {
        endpoint: endpoint,
        retryCount: retryCount,
        error: error?.message || 'Unknown error',
        errorType: error?.constructor?.name || typeof error
      });
      
      // Handle network errors or other issues
      throw error;
    }
  }

  /**
   * Refresh the current session using next-auth
   * This triggers a new token exchange with Auth0
   */
  private async refreshSession(): Promise<void> {
    try {
      console.log('🔄 [ApiClient] Starting session refresh...');
      
      // Get current session first to compare
      console.log('🔄 [ApiClient] Getting current session before refresh...');
      const currentSession = await getSession();
      
      console.log('🔄 [ApiClient] Current session:', {
        hasSession: !!currentSession,
        hasUser: !!currentSession?.user,
        hasAccessToken: !!currentSession?.user?.accessToken,
        userId: currentSession?.user?.id,
        currentTokenPrefix: currentSession?.user?.accessToken ? `${currentSession.user.accessToken.substring(0, 20)}...` : 'none'
      });
      
      // Call our custom refresh endpoint
      console.log('🔄 [ApiClient] Triggering session refresh...');
      const sessionResponse = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('🔄 [ApiClient] Session refresh response:', {
        status: sessionResponse.status,
        ok: sessionResponse.ok
      });
      
      if (sessionResponse.ok) {
        const refreshData = await sessionResponse.json();
        
        console.log('🔄 [ApiClient] Session data from refresh:', {
          hasUser: !!refreshData.user,
          hasAccessToken: !!refreshData.user?.accessToken,
          userId: refreshData.user?.id,
          newTokenPrefix: refreshData.user?.accessToken ? `${refreshData.user.accessToken.substring(0, 20)}...` : 'none',
          requiresReauth: refreshData.requiresReauth
        });
        
        if (refreshData.requiresReauth) {
          console.log('🚪 [ApiClient] Refresh indicates re-authentication required');
          await showSignOutDialog("/login");
          throw new Error('Token expired, re-authentication required');
        }
      } else {
        const errorData = await sessionResponse.json();
        
        console.error('❌ [ApiClient] Session refresh failed:', {
          status: sessionResponse.status,
          errorData: errorData
        });
        
        if (errorData.requiresReauth) {
          console.log('🚪 [ApiClient] Error response indicates re-authentication required');
          await showSignOutDialog("/login");
          throw new Error('Token expired, re-authentication required');
        }
        
        throw new Error(`Session refresh failed: ${sessionResponse.status}`);
      }
      
      // Get the refreshed session
      console.log('🔄 [ApiClient] Getting new session after refresh...');
      const newSession = await getSession();
      
      console.log('🔄 [ApiClient] New session after refresh:', {
        hasSession: !!newSession,
        hasUser: !!newSession?.user,
        hasAccessToken: !!newSession?.user?.accessToken,
        userId: newSession?.user?.id,
        newTokenPrefix: newSession?.user?.accessToken ? `${newSession.user.accessToken.substring(0, 20)}...` : 'none',
        hasError: !!(newSession?.user as any)?.error,
        error: (newSession?.user as any)?.error
      });
      
      if (!newSession?.user?.accessToken) {
        console.error('❌ [ApiClient] No access token after refresh');
        await showSignOutDialog("/login");
        throw new Error('No access token after refresh');
      }
      
      // Check for refresh token errors
      if ((newSession.user as any).error === "RefreshAccessTokenError") {
        console.error('❌ [ApiClient] Refresh token expired');
        await showSignOutDialog("/login");
        throw new Error('Refresh token expired, re-authentication required');
      }
      
      // Compare tokens to see if refresh actually worked
      const tokenChanged = currentSession?.user?.accessToken !== newSession?.user?.accessToken;
      console.log('🔄 [ApiClient] Token comparison:', {
        tokenChanged: tokenChanged,
        oldTokenPrefix: currentSession?.user?.accessToken ? `${currentSession.user.accessToken.substring(0, 20)}...` : 'none',
        newTokenPrefix: newSession?.user?.accessToken ? `${newSession.user.accessToken.substring(0, 20)}...` : 'none'
      });
      
      if (!tokenChanged) {
        console.warn('⚠️ [ApiClient] Token did not change after refresh - this may indicate an issue');
      }
      
      console.log('✅ [ApiClient] Session refresh completed successfully');
    } catch (error: any) {
      console.error('❌ [ApiClient] Session refresh error:', {
        error: error?.message || 'Unknown error',
        errorType: error?.constructor?.name || typeof error
      });
      
      // If refresh fails, logout the user
      await showSignOutDialog("/login");
      throw error;
    }
  }
}

// Export singleton instance
export const apiClient = new SecureApiClient();

// Export the class for testing or custom instances
export { SecureApiClient };

// Export test function for development/testing
export { testSignOutDialog };

