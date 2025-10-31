/**
 * Dashboard Page
 * Main entry point for the email designer dashboard
 */

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import SEO from '@/components/SEO';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [initialPrompt, setInitialPrompt] = useState<string | undefined>();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (status === "loading") return; // Still loading
    if (!session) {
      router.push("/login");
      return;
    }

    // Check for stored email prompt from homepage
    const storedPrompt = sessionStorage.getItem('emailPrompt');
    if (storedPrompt) {
      setInitialPrompt(storedPrompt);
      // Clear the stored prompt
      sessionStorage.removeItem('emailPrompt');
    }
  }, [session, status, router]);

  // Loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  // Not authenticated
  if (!session) {
    return null; // Will redirect to login
  }

  return (
    <>
      <SEO 
        title="Dashboard - AI Email Designer"
        description="Create and manage your email campaigns with AI-powered design tools"
        noindex={true}
      />
      <DashboardLayout initialPrompt={initialPrompt} />
    </>
  );
}
