/**
 * Beta Page
 * Page for beta registration
 */

import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { BetaRegistrationForm } from '@/components/BetaRegistrationForm';
import Link from 'next/link';
import Image from 'next/image';

export default function BetaPage() {
  const router = useRouter();
  useSession(); // Ensure session is initialized

  const handleRegistrationSuccess = () => {
    // Redirect to homepage with success query parameter
    router.push('/?betaRegistered=true');
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
        <div className="w-full max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight tracking-tight font-poppins">
              Join the Beta Program
            </h1>

            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-8 leading-relaxed font-normal font-inter">
              Untitled88 answers analytical questions and creates AI-driven dashboards from your data, all in one smooth experience.
              Join the waitlist to be notified when we launch.
            </p>
          </div>

          {/* Form Container */}
          <div className="flex justify-center mb-8">
            <BetaRegistrationForm 
              onSuccess={handleRegistrationSuccess}
              className="w-full max-w-md"
            />
          </div>

          {/* Footer */}
          <div className="text-center">
            <div className="flex justify-center space-x-6 text-xs text-gray-400">
              <Link href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="hover:text-purple-400 transition-colors font-inter">Privacy Policy</Link>
              <Link href="/terms" target="_blank" rel="noopener noreferrer" className="hover:text-purple-400 transition-colors font-inter">Terms of Service</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
