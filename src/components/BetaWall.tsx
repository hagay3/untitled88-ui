/**
 * Beta Wall Component
 * Controls access to the application during beta phase
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import LoadingSpinner from './LoadingSpinner';

interface BetaWallProps {
  children: React.ReactNode;
  requireBetaAccess?: boolean;
}

type BetaStep = 'loading' | 'registration' | 'verification' | 'granted';

export const BetaWall: React.FC<BetaWallProps> = ({ 
  children, 
  requireBetaAccess = true 
}) => {
  const { data: session, status } = useSession();
  const user = session?.user;
  const authLoading = status === 'loading';
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<BetaStep>('loading');
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  // Check beta access on mount and when user or session changes
  useEffect(() => {
    checkBetaAccess();
  }, [user, authLoading, session]);

  const checkBetaAccess = async () => {
    if (!requireBetaAccess) {
      setCurrentStep('granted');
      setIsCheckingAccess(false);
      return;
    }

    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    try {
      // CRITICAL: If user is authenticated, check their session for beta access errors
      if (user) {
        // Check if session has beta access denial error
        const sessionAny = session as any;
        if (sessionAny?.error === "BetaAccessDenied" || sessionAny?.user?.error === "BetaAccessDenied") {
          
          
          // Sign out the user immediately
          const { signOut } = await import('next-auth/react');
          await signOut({ redirect: false });
          
          // Clear any local storage beta verification
          localStorage.removeItem('beta_verified');
          
          // Determine the appropriate step based on the error details
          if (sessionAny?.user?.needsRegistration) {
            setCurrentStep('registration');
          } else if (sessionAny?.user?.needsVerification) {
            setCurrentStep('verification');
          } else {
            setCurrentStep('registration'); // Default to registration if unclear
          }
          
          setIsCheckingAccess(false);
          return;
        }

        // If user is authenticated and no beta access error, verify with backend
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/beta/check-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: user.email }),
          });

          if (response.ok) {
            const betaData = await response.json();
                        
            // Check if user can actually login
            if (betaData.can_login) {
              setCurrentStep('granted');
            } else if (betaData.needs_registration) {
              setCurrentStep('registration');
            } else if (betaData.needs_verification) {
              setCurrentStep('verification');
            } else {
              setCurrentStep('registration'); // Default to registration
            }
          } else {
            // If API check fails, block access
            setCurrentStep('registration');
          }
        } catch (error) {
          // On error, block access by default
          setCurrentStep('registration');
        }
      } else {
        // User is not authenticated - check localStorage for public pages
        const localBetaVerified = localStorage.getItem('beta_verified') === 'true';
        if (localBetaVerified) {
          setCurrentStep('granted');
        } else {
          setCurrentStep('registration');
        }
      }
    } catch (error) {
      // On error, block access
      setCurrentStep('registration');
    } finally {
      setIsCheckingAccess(false);
    }
  };

  const handleJoinBetaClick = () => {
    // Redirect to unified beta page
    router.push('/beta');
  };


  // Show loading while checking access
  if (authLoading || isCheckingAccess || currentStep === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Checking access...</p>
        </div>
      </div>
    );
  }

  // If beta access is granted, render children
  if (currentStep === 'granted') {
    return <>{children}</>;
  }

  // Render beta wall
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6 gap-4">
            <img 
              src="/logo-transparent.png" 
              alt="Untitled88" 
              className="h-12 w-auto -ml-6"
            />
            
            <img 
              src="/logo-untitled88-text-only.png" 
              alt="Untitled88" 
              className="h-12 w-auto"
            />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-black mb-4">
            Welcome to the Future of 
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent"> Email Marketing</span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Create stunning, high-converting email campaigns with AI-powered design and content generation. 
            Join our exclusive beta program today.
          </p>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
            <div className="glass-card p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-black mb-2">AI-Powered Design</h3>
              <p className="text-sm text-gray-600">Generate beautiful email templates with natural language prompts</p>
            </div>

            <div className="glass-card p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-black mb-2">Performance Analytics</h3>
              <p className="text-sm text-gray-600">Track opens, clicks, and conversions with detailed insights</p>
            </div>

            <div className="glass-card p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-black mb-2">ESP Integration</h3>
              <p className="text-sm text-gray-600">Connect with Mailchimp, Brevo, Klaviyo, and more</p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="flex justify-center">
          <div className="text-center">
            <button
              onClick={handleJoinBetaClick}
              className="btn-primary text-lg px-8 py-4 mb-4"
            >
              Join the Beta Program
            </button>
            
     
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-sm text-gray-500 mb-4">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:text-blue-700 underline">
              Sign in here
            </Link>
          </p>
          
          <div className="flex justify-center space-x-6 text-xs text-gray-400">
            <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600">Privacy Policy</a>
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600">Terms of Service</a>
          </div>
        </div>
      </div>
    </div>
  );
};
