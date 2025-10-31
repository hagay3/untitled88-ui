/**
 * Dashboard Navigation Bar
 * Contains logo, user info, and action buttons (save, export, share, templates)
 */

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { signOut } from 'next-auth/react';

interface DashboardNavbarProps {
  user: any;
  onTemplateGallery: () => void;
  onSave: () => void;
  onExport: () => void;
  onShare: () => void;
  currentEmail: any;
}

export default function DashboardNavbar({
  user,
  onTemplateGallery,
  onSave,
  onExport,
  onShare,
  currentEmail
}: DashboardNavbarProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    await onExport();
    setTimeout(() => setIsExporting(false), 1000);
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Left - Logo & Title */}
        <div className="flex items-center space-x-4">
          <Image 
            src="/logo.png" 
            alt="Untitled88 Logo" 
            width={120}
            height={40}
            className="h-8 w-auto"
          />
          <div className="h-6 w-px bg-gray-300" />
          <h1 className="text-lg font-semibold text-gray-900">
            Email Designer
          </h1>
        </div>

        {/* Center - Action Buttons */}
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onTemplateGallery}
            className="btn-ghost"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Templates
          </Button>

          {currentEmail && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={onSave}
                className="btn-ghost"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={isExporting}
                className="btn-ghost"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {isExporting ? 'Exporting...' : 'Export'}
              </Button>

              <Button
                size="sm"
                onClick={onShare}
                className="btn-primary"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                Share
              </Button>
            </>
          )}
        </div>

        {/* Right - User Info */}
        <div className="flex items-center space-x-3">
          <Image
            src={user?.image || "/default-avatar.png"}
            alt="User Avatar"
            width={32}
            height={32}
            className="w-8 h-8 rounded-full"
          />
          <div className="text-sm">
            <div className="font-medium text-gray-900">{user?.name}</div>
            <div className="text-gray-500">{user?.email}</div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </Button>
        </div>
      </div>
    </nav>
  );
}
