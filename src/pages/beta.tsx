/**
 * Beta Page
 * Unified page for beta registration and verification
 */

import { useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { BetaRegistrationForm } from '@/components/BetaRegistrationForm';
import { BetaAccessCodeForm } from '@/components/BetaAccessCodeForm';
import Link from 'next/link';
import Image from 'next/image';

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
              <span className="text-white font-bold text-xl hidden sm:block">Untitled88</span>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-600/20 text-purple-400 border border-purple-500/30 hidden sm:block">
                ✨ AI
              </span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <div className="w-full max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            {currentStep === 'registration' ? (
              <>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight tracking-tight" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
                  Join the Beta Program
                </h1>
                
                <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-8 leading-relaxed font-normal" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
                  Get early access to the future of AI-powered dashboards. 
                  Fill out the form below to request your beta invitation.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight tracking-tight" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
                  Enter Your Access Code
                </h1>
                
                <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-8 leading-relaxed font-normal" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
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
            {currentStep === 'verification' && (
              <p className="text-sm text-gray-400 mb-4">
                Didn&apos;t receive the code?{' '}
                <button 
                  onClick={handleBackToRegistration}
                  className="text-purple-400 hover:text-purple-300 underline transition-colors"
                >
                  Register again
                </button>
              </p>
            )}
            
            <div className="flex justify-center space-x-6 text-xs text-gray-400">
              <Link href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="hover:text-purple-400 transition-colors">Privacy Policy</Link>
              <Link href="/terms" target="_blank" rel="noopener noreferrer" className="hover:text-purple-400 transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
