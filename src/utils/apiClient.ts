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
  }
};

// Make test function globally available in development and auto-invoke
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_TEST_SIGNOUT_DIALOG === 'true') {
  (window as any).testSignOutDialog = testSignOutDialog;
  
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
    
    
    try {
      // Get current session for access token
      const session = await getSession();
      const accessToken = session?.user?.accessToken;
      const userId = session?.user?.id;
      


      // Prepare headers
      const headers = {
        "Content-Type": "application/json",
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        ...(userId && { 'X-User-Id': userId }),
        ...options.headers,
      };
      
   

      // Make the API request
      const response = await fetch(`${this.baseUrl}/api/${endpoint}`, {
        ...options,
        headers,
      });
      
  

      // Handle 401 Unauthorized - attempt session refresh
      if (response.status === 401 && retryCount < maxRetries) {
        
        try {
          // Ensure only one refresh attempt at a time
          if (!this.isRefreshing) {
            this.isRefreshing = true;
            this.refreshPromise = this.refreshSession();
          }

          // Wait for refresh to complete
          await this.refreshPromise;
          this.isRefreshing = false;
          this.refreshPromise = null;

          // Retry the original request with fresh token
          return this.fetchWithAuth(endpoint, options, retryCount + 1);
        } catch (refreshError: any) {
       
          
          this.isRefreshing = false;
          this.refreshPromise = null;
          
          // If refresh failed due to expired token, don't retry - the user will be redirected to login
          if (refreshError?.message?.includes('Token expired')) {
            throw refreshError;
          }
          
          // For other refresh errors, continue with normal retry logic
          throw refreshError;
        }
      }

      // If refresh failed or max retries exceeded, logout user
      if (response.status === 401 && retryCount >= maxRetries) {
        await showSignOutDialog("/login");
      }

      return response;
    } catch (error: any) {
      
      
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
      
      // Get current session first (needed for NextAuth token lifecycle)
      await getSession();

      
      // Call our custom refresh endpoint
      const sessionResponse = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
    
      if (sessionResponse.ok) {
        const refreshData = await sessionResponse.json();
        
    
        
        if (refreshData.requiresReauth) {
          await showSignOutDialog("/login");
          throw new Error('Token expired, re-authentication required');
        }
      } else {
        const errorData = await sessionResponse.json();
        
     
        if (errorData.requiresReauth) {
          await showSignOutDialog("/login");
          throw new Error('Token expired, re-authentication required');
        }
        
        throw new Error(`Session refresh failed: ${sessionResponse.status}`);
      }
      
      // Get the refreshed session
      const newSession = await getSession();
      
 
      
      if (!newSession?.user?.accessToken) {
        await showSignOutDialog("/login");
        throw new Error('No access token after refresh');
      }
      
      // Check for refresh token errors
      if ((newSession.user as any).error === "RefreshAccessTokenError") {
        await showSignOutDialog("/login");
        throw new Error('Refresh token expired, re-authentication required');
      }
      

    } catch (error: any) {

      
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

