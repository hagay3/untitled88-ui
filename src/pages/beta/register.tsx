/**
 * Beta Registration Page
 * Dedicated page for beta program registration
 */

import { useRouter } from 'next/router';
import { BetaRegistrationForm } from '@/components/BetaRegistrationForm';
import Link from 'next/link';

export default function BetaRegisterPage() {
  const router = useRouter();

  const handleRegistrationSuccess = () => {
    // Redirect to verification page after successful registration
    router.push('/beta/verify');
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
            Join the Beta Program
          </h1>
          
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Get early access to the future of AI-powered email marketing. 
            Fill out the form below to request your beta invitation.
          </p>
        </div>

        {/* Registration Form */}
        <div className="flex justify-center mb-8">
          <BetaRegistrationForm 
            onSuccess={handleRegistrationSuccess}
            className="w-full max-w-md"
          />
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-4">
            Already registered?{' '}
            <Link href="/beta/verify" className="text-blue-600 hover:text-blue-700 underline">
              Enter your access code
            </Link>
          </p>
          
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
