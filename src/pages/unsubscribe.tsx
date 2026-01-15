/**
 * Unsubscribe Page
 * Allows users to unsubscribe from beta notifications
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';

export default function UnsubscribePage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [error, setError] = useState('');

  // Get email from URL query parameter if provided
  useEffect(() => {
    if (router.isReady && router.query.email) {
      setEmail(router.query.email as string);
    }
  }, [router.isReady, router.query.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.trim()) {
      setError('Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const response = await fetch(`${API_URL}/api/beta/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Show success dialog immediately
        setShowSuccessDialog(true);
      } else {
        setError(data.error || 'Failed to unsubscribe. Please try again.');
      }
    } catch (err) {
      console.error('Unsubscribe error:', err);
      setError('An error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setShowSuccessDialog(false);
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] relative overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1f35_1px,transparent_1px),linear-gradient(to_bottom,#1a1f35_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
      
      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ top: '10%', left: '20%', animationDelay: '0s' }}></div>
        <div className="absolute w-1 h-1 bg-purple-500 rounded-full animate-pulse" style={{ top: '30%', left: '70%', animationDelay: '1s' }}></div>
        <div className="absolute w-2 h-2 bg-cyan-500 rounded-full animate-pulse" style={{ top: '60%', left: '15%', animationDelay: '2s' }}></div>
        <div className="absolute w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{ top: '80%', left: '80%', animationDelay: '1.5s' }}></div>
        <div className="absolute w-1 h-1 bg-purple-400 rounded-full animate-pulse" style={{ top: '20%', left: '90%', animationDelay: '0.5s' }}></div>
      </div>

      {/* Header/Navbar */}
      <nav className="bg-[#0a0e1a]/80 backdrop-blur-md border-b border-gray-800/50 relative z-50 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <Image 
                src="/untitled_88_dark_mode_small.png" 
                alt="Untitled88" 
                width={40}
                height={40}
                className="h-10 w-auto"
              />
              <span className="text-white font-bold text-xl hidden sm:block font-poppins">Untitled88</span>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-600/20 text-purple-400 border border-purple-500/30 hidden sm:block font-inter">
                ✨ AI
              </span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <div className="w-full max-w-md mx-auto">
          {/* Card */}
          <div className="bg-[#1a1f35]/50 backdrop-blur-md border border-gray-700/50 rounded-xl p-8 shadow-2xl">
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-white mb-2 font-poppins">
                Unsubscribe
              </h1>
              <p className="text-gray-400 font-inter">
                We're sorry to see you go. Enter your email to unsubscribe from our beta notifications.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2 font-inter">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full px-4 py-3 bg-[#0a0e1a] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors font-inter"
                  disabled={isLoading}
                  required
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm font-inter">
                  {error}
                </div>
              )}

              <button
                id="unsubscribe-submit-button"
                type="submit"
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center font-inter"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Unsubscribe'
                )}
              </button>
            </form>

            {/* Footer Links */}
            <div className="mt-6 text-center">
              <div className="flex justify-center space-x-4 text-xs text-gray-400">
                <Link href="/privacy-policy" className="hover:text-purple-400 transition-colors font-inter">
                  Privacy Policy
                </Link>
                <span>•</span>
                <Link href="/terms" className="hover:text-purple-400 transition-colors font-inter">
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Dialog */}
      {showSuccessDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#1a1f35] border border-gray-700/50 rounded-xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Success Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>

            {/* Success Message */}
            <h2 className="text-2xl font-bold text-white text-center mb-2 font-poppins">
              Successfully Unsubscribed
            </h2>
            <p className="text-gray-400 text-center mb-6 font-inter">
              You have been successfully unsubscribed from our beta program. You will no longer receive emails from us.
            </p>

            {/* Close Button */}
            <button
              onClick={handleCloseDialog}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 font-inter"
            >
              Go to Homepage
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
