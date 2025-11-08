import { useState, useEffect } from 'react';
import { signIn, getSession, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { userAPI } from '../lib/api';
import { captureDeviceInfo } from '../utils/deviceInfo';

export default function DebugLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [email, setEmail] = useState('hagay3@gmail.com');
  const [password, setPassword] = useState('Aa123456');
  const router = useRouter();
  const { data: session, status } = useSession();

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  const handleDebugLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // FIRST: Set beta verification in localStorage to bypass beta wall
      localStorage.setItem('beta_verified', 'true');
      localStorage.setItem('debug_mode', 'true');
      
      setSuccess('🔧 Debug mode enabled, beta wall bypassed. Capturing device info...');

      // SECOND: Capture and store device info before authentication
      try {
        console.log('🔍 Starting device info capture...');
        const deviceInfo = await captureDeviceInfo();
        console.log('📱 Captured device info:', deviceInfo);
        
        // Store device info on server for NextAuth callback
        const storeResponse = await fetch('/api/auth/store-device-info', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(deviceInfo),
        });
        
        const storeResult = await storeResponse.json();
        console.log('💾 Store device info result:', storeResult);
        
        if (storeResponse.ok) {
          setSuccess(`📱 Device info captured: ${deviceInfo.device_name}. Attempting login...`);
        } else {
          console.error('Failed to store device info:', storeResult);
          setSuccess('⚠️ Device info storage failed, proceeding with login...');
        }
      } catch (deviceError) {
        console.error('Failed to capture device info:', deviceError);
        setSuccess('⚠️ Device info capture failed, proceeding with login...');
      }

      // THIRD: Attempt to sign in with provided credentials
      const result = await signIn('credentials', {
        email: email.trim(),
        password: password,
        redirect: false,
      });

      if (result?.error) {
        setError(`Login failed: ${result.error}`);
        // Keep beta bypass even if login fails for debugging
        setIsLoading(false);
        return;
      }

      if (result?.ok) {
        setSuccess('✅ Debug login successful! Registering user...');
        
        // Get the session to extract user ID
        const session = await getSession();
        if (session?.user?.id) {
          try {
            // Call subscribe_user API to register/update user
            await userAPI.subscribeUser(session.user.id);
            setSuccess('✅ User registered successfully! Redirecting to dashboard...');
          } catch (apiError) {
            // Don't fail the login if API call fails
            setSuccess('✅ Login successful! Redirecting to dashboard...');
          }
        }
        
        // Wait a moment then redirect
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } else {
        setError('Login failed: Unknown error occurred');
      }

    } catch (error) {
      setError('Debug login failed. Please check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearDebug = () => {
    localStorage.removeItem('beta_verified');
    localStorage.removeItem('debug_mode');
    setSuccess('🧹 Debug mode cleared');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Debug Login - Untitled88</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Debug Warning Banner */}
          <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-6 rounded-r-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>DEBUG MODE</strong> - This page bypasses authentication for development testing only.
                </p>
              </div>
            </div>
          </div>

          {/* Debug Login Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
            <div className="text-center mb-8">
              <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Debug Login</h1>
              <p className="text-gray-600">Quick access for development testing</p>
            </div>

            {/* Login Form */}
            <form id="debug-login-form" onSubmit={handleDebugLogin} className="space-y-4 mb-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your email"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </form>

            {/* Default Credentials Helper */}
            <div className="bg-blue-50 rounded-lg p-3 mb-4">
              <h4 className="text-xs font-medium text-blue-800 mb-1">Default Test Credentials:</h4>
              <div className="space-y-1 text-xs text-blue-700">
                <div>Email: hagay3@gmail.com</div>
                <div>Password: Aa123456</div>
              </div>
            </div>

            {/* Status Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex">
                  <svg className="h-5 w-5 text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex">
                  <svg className="h-5 w-5 text-green-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">{success}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                type="submit"
                form="debug-login-form"
                disabled={isLoading || !email.trim() || !password}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  '🚀 Debug Login & Bypass Beta Wall'
                )}
              </button>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('hagay3@gmail.com');
                    setPassword('Aa123456');
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-3 rounded-lg transition-colors duration-200 text-sm"
                >
                  📋 Fill Test Credentials
                </button>
                
                <button
                  type="button"
                  onClick={handleClearDebug}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-3 rounded-lg transition-colors duration-200 text-sm"
                >
                  🧹 Clear Debug Mode
                </button>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <a href="/" className="text-blue-600 hover:text-blue-800 transition-colors">
                  ← Back to Home
                </a>
                <a href="/login" className="text-blue-600 hover:text-blue-800 transition-colors">
                  Normal Login →
                </a>
              </div>
            </div>

            {/* Debug Info */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <details className="text-xs text-gray-600">
                <summary className="cursor-pointer font-medium">Debug Info</summary>
                <div className="mt-2 space-y-1">
                  <div>Beta Verified: {localStorage.getItem('beta_verified') || 'false'}</div>
                  <div>Debug Mode: {localStorage.getItem('debug_mode') || 'false'}</div>
                  <div>Session Status: {status}</div>
                  <div>Current URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}</div>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
