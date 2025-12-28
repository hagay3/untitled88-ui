/**
 * Beta Verification Page
 * Dedicated page for beta access code verification
 */

import { useRouter } from 'next/router';
import { BetaAccessCodeForm } from '@/components/BetaAccessCodeForm';
import Link from 'next/link';

export default function BetaVerifyPage() {
  const router = useRouter();

  const handleVerificationSuccess = (_userData: { email: string; name: string }) => {
    // Set beta verification in localStorage
    localStorage.setItem('beta_verified', 'true');
    
    // Always redirect to login page after verification
    router.push('/login');
  };

  const handleBackToRegistration = () => {
    router.push('/beta/register');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <img 
              src="/logo-untitled88.png" 
              alt="Untitled88" 
              className="h-12 w-auto mx-auto"
            />
          </Link>
          
          <h1 className="text-3xl md:text-4xl font-bold text-black mb-4">
            Enter Your Access Code
          </h1>
          
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Check your email for the 6-digit access code we sent you. 
            Enter it below to complete your beta registration.
          </p>
        </div>

        {/* Verification Form */}
        <div className="flex justify-center mb-8">
          <BetaAccessCodeForm 
            onSuccess={handleVerificationSuccess}
            onClose={handleBackToRegistration}
            className="w-full max-w-md"
          />
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-4">
            Didn&apos;t receive the code?{' '}
            <Link href="/beta/register" className="text-blue-600 hover:text-blue-700 underline">
              Register again
            </Link>
          </p>
          
          <p className="text-sm text-gray-500 mb-4">
            Need help?{' '}
            <a href="mailto:support@untitled88.com" className="text-blue-600 hover:text-blue-700 underline">
              Contact support
            </a>
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
