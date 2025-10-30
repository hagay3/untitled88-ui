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
        <div class="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
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
    
    try {
      // Get current session for access token
      const session = await getSession();
      const accessToken = session?.user?.accessToken;

      // Prepare headers
      const headers = {
        "Content-Type": "application/json",
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        ...options.headers,
      };

      // Make the API request
      const response = await fetch(`${this.baseUrl}/api/${endpoint}`, {
        ...options,
        headers,
      });

      // Handle 401 Unauthorized - attempt session refresh
      if (response.status === 401 && retryCount < maxRetries) {
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
      }

      // If refresh failed or max retries exceeded, logout user
      if (response.status === 401 && retryCount >= maxRetries) {
        await showSignOutDialog("/login");
      }

      return response;
    } catch (error) {
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
      // Trigger session refresh by calling getSession
      // This will use the refresh token stored in HttpOnly cookies
      const newSession = await getSession();
      
      if (!newSession?.user?.accessToken) {
        await showSignOutDialog("/login");
        // fail
      }
    } catch (error) {
      // If refresh fails, logout the user
      await showSignOutDialog("/login");
      // refresh fail
    }
  }
}

// Export singleton instance
export const apiClient = new SecureApiClient();

// Export the class for testing or custom instances
export { SecureApiClient };

// Export test function for development/testing
export { testSignOutDialog };

