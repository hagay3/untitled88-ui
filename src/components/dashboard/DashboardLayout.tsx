/**
 * Main Dashboard Layout Component
 * Split-screen design with chat panel (25%) and preview panel (75%)
 */

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import ChatPanel from './ChatPanel';
import PreviewPanel from './PreviewPanel';
import DashboardNavbar from './DashboardNavbar';
import TemplateGallery from './TemplateGallery';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorDialog, { useErrorDialog } from '@/components/ui/ErrorDialog';

interface DashboardLayoutProps {
  initialPrompt?: string;
}

export default function DashboardLayout({ initialPrompt }: DashboardLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isOpen: errorDialogOpen, message: errorMessage, showError, hideError } = useErrorDialog();
  
  // State management
  const [currentEmail, setCurrentEmail] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState('');
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [credits, setCredits] = useState(25); // Mock credits

  // Authentication check
  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
      return;
    }

  }, [session, status, router]);

  // Handle email generation
  const handleEmailGeneration = async (prompt: string) => {
    setIsGenerating(true);
    setGenerationProgress('Analyzing your request...');
    
    try {
      // Import API function
      const { aiAPI } = await import('@/lib/api');
      
      // Update progress
      setTimeout(() => setGenerationProgress('Connecting to AI...'), 500);
      setTimeout(() => setGenerationProgress('Generating email structure...'), 1500);
      setTimeout(() => setGenerationProgress('Applying design elements...'), 2500);
      setTimeout(() => setGenerationProgress('Optimizing for mobile...'), 3500);
      
      // Call the actual API
      const response = await aiAPI.quickEmailGeneration({
        user_prompt: prompt,
        email_type: 'create'
      });
      
      if (response.success && response.data) {
        const emailData = {
          subject: response.data.email_subject,
          html: response.data.email_html || response.data.updated_email_html,
          preheader: response.data.preheader_text,
          features: response.data.key_features || [],
          designNotes: response.data.design_notes,
          colorPalette: response.data.color_palette || [],
          fontsUsed: response.data.fonts_used || [],
          accessibilityFeatures: response.data.accessibility_features || [],
          compatibilityNotes: response.data.compatibility_notes,
          estimatedSize: response.data.estimated_size_kb,
          mobileOptimized: response.data.mobile_optimized
        };
        
        setCurrentEmail(emailData);
        setCredits(prev => Math.max(0, prev - 1));
        setIsGenerating(false);
        setGenerationProgress('');
      } else {
        throw new Error(response.message || 'Failed to generate email');
      }
      
    } catch (error: any) {
      console.error('Email generation failed:', error);
      setIsGenerating(false);
      setGenerationProgress('');
      
       // Show error message to user
       showError(`Email generation failed: ${error.message || 'Unknown error'}`);
    }
  };

  // Handle template selection
  const handleTemplateSelect = (template: any) => {
    setCurrentEmail(template);
    setShowTemplateGallery(false);
  };

  // Loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Top Navigation */}
      <DashboardNavbar 
        user={session.user}
        onTemplateGallery={() => setShowTemplateGallery(true)}
        onSave={() => console.log('Save email')}
        onExport={() => console.log('Export email')}
        onShare={() => console.log('Share email')}
        currentEmail={currentEmail}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Chat Panel - 25% */}
        <div className="w-1/4 border-r border-gray-200 flex flex-col">
          <ChatPanel
            credits={credits}
            resetTime={null}
            onSendMessage={handleEmailGeneration}
            isGenerating={isGenerating}
            generationProgress={generationProgress}
            initialPrompt={initialPrompt}
          />
        </div>

        {/* Right Preview Panel - 75% */}
        <div className="flex-1 flex flex-col">
          <PreviewPanel
            email={currentEmail}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            isGenerating={isGenerating}
            generationProgress={generationProgress}
          />
        </div>
      </div>

      {/* Template Gallery Overlay */}
      {showTemplateGallery && (
        <TemplateGallery
          onClose={() => setShowTemplateGallery(false)}
          onSelectTemplate={handleTemplateSelect}
        />
      )}

      {/* Error Dialog */}
      <ErrorDialog
        isOpen={errorDialogOpen}
        message={errorMessage}
        onClose={hideError}
      />
    </div>
  );
}
