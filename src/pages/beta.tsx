/**
 * Beta Page
 * Unified page for beta registration and verification
 */

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { BetaRegistrationForm } from '@/components/BetaRegistrationForm';
import { BetaAccessCodeForm } from '@/components/BetaAccessCodeForm';
import Link from 'next/link';

type BetaStep = 'registration' | 'verification';

export default function BetaPage() {
  const router = useRouter();
  useSession(); // Ensure session is initialized
  const [currentStep, setCurrentStep] = useState<BetaStep>('registration');

  const handleRegistrationSuccess = () => {
    // Show verification form immediately after successful registration
    setCurrentStep('verification');
  };

  const handleVerificationSuccess = (_userData: { email: string; name: string }) => {
    // Set beta verification in localStorage
    localStorage.setItem('beta_verified', 'true');
    
    // Always redirect to login page after verification
    router.push('/login');
  };

  const handleBackToRegistration = () => {
    setCurrentStep('registration');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <img 
              src="/logo-transparent.png" 
              alt="Untitled88" 
              className="h-12 w-auto mx-auto"
            />
          </Link>
          
          {currentStep === 'registration' ? (
            <>
              <h1 className="text-3xl md:text-4xl font-bold text-black mb-4">
                Join the Beta Program
              </h1>
              
              <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
                Get early access to the future of AI-powered email marketing. 
                Fill out the form below to request your beta invitation.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-3xl md:text-4xl font-bold text-black mb-4">
                Enter Your Access Code
              </h1>
              
              <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
                Check your email for the 6-digit access code we sent you. 
                Enter it below to complete your beta registration.
              </p>
            </>
          )}
        </div>

        {/* Form Container */}
        <div className="flex justify-center mb-8">
          {currentStep === 'registration' ? (
            <BetaRegistrationForm 
              onSuccess={handleRegistrationSuccess}
              className="w-full max-w-md"
            />
          ) : (
            <BetaAccessCodeForm 
              onSuccess={handleVerificationSuccess}
              onClose={handleBackToRegistration}
              className="w-full max-w-md"
            />
          )}
        </div>

        {/* Footer */}
        <div className="text-center">
          {currentStep === 'registration' ? (
            <p className="text-sm text-gray-500 mb-4">
              Already registered?{' '}
              <button 
                onClick={() => setCurrentStep('verification')}
                className="text-blue-600 hover:text-blue-700 underline"
              >
                Enter your access code
              </button>
            </p>
          ) : (
            <p className="text-sm text-gray-500 mb-4">
              Didn&apos;t receive the code?{' '}
              <button 
                onClick={handleBackToRegistration}
                className="text-blue-600 hover:text-blue-700 underline"
              >
                Register again
              </button>
            </p>
          )}
          
          <p className="text-sm text-gray-500 mb-4">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:text-blue-700 underline">
              Sign in here
            </Link>
          </p>
          
          <div className="flex justify-center space-x-6 text-xs text-gray-400">
            <Link href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600">Privacy Policy</Link>
            <Link href="/terms" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600">Terms of Service</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
