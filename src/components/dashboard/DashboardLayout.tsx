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
import ExportDialog from '@/components/ui/ExportDialog';
import { apiClient } from '@/utils/apiClient';
import { analyzeEmailIntent, generateClarificationPrompt } from '@/utils/emailIntentDetection';
import { downloadHtmlFile, exportEmailWithMetadata } from '@/utils/exportUtils';

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
  const [generationType, setGenerationType] = useState<'create' | 'update'>('create');
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [dailyUsage, setDailyUsage] = useState({
    daily_limit: 10,
    daily_used: 0,
    messages_left: 10,
    reset_time: null as string | null,
    can_send: true
  });

  // Fetch daily usage
  const fetchDailyUsage = async () => {
    try {
      const response = await apiClient.fetchWithAuth('ai/daily-usage');
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDailyUsage({
            daily_limit: data.daily_limit,
            daily_used: data.daily_used,
            messages_left: data.messages_left,
            reset_time: data.reset_time,
            can_send: data.can_send
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch daily usage:', error);
    }
  };

  // Authentication check and initial data loading
  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
      return;
    }

    // Fetch daily usage when authenticated
    fetchDailyUsage();
    
    // Load page reload data and automatically show last email
    loadPageReloadData();
  }, []); // Removed router from dependencies to prevent re-renders

  // State for conversation management
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  
  // State for current email context
  const [currentEmailHtml, setCurrentEmailHtml] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const [isLoadingPageData, setIsLoadingPageData] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState('Initializing...');
  
  // Load page reload data and automatically show last email
  const loadPageReloadData = async () => {
    setIsLoadingPageData(true);
    setLoadingStatus('Loading your workspace...');
    try {
      
      setLoadingStatus('Fetching your conversations and emails...');
      
      // Test API connectivity first
      
      // Load conversations, chat history, and recent emails in parallel
      const [conversationsResponse, chatHistoryResponse, recentEmailsResponse] = await Promise.all([
        apiClient.fetchWithAuth('ai/conversations?limit=5'),
        apiClient.fetchWithAuth('ai/chat-history?limit=50'),
        apiClient.fetchWithAuth('ai/recent-emails?limit=1') // Get the most recent email
      ]);
      
      
      // Process conversations
      if (conversationsResponse.ok) {
        const conversationsData = await conversationsResponse.json();
        
        if (conversationsData.success && conversationsData.conversations) {
          
          // Set the first conversation as current if available
          if (conversationsData.conversations.length > 0) {
            setCurrentConversationId(conversationsData.conversations[0].conversation_id);
          }
        }
      }
      
      // Process chat history for conversation display
      let processedChatHistory: any[] = [];
      if (chatHistoryResponse.ok) {
        const chatData = await chatHistoryResponse.json();
        
        if (chatData.success && chatData.messages && chatData.messages.length > 0) {
          
          // Transform chat history messages to conversation history format
          processedChatHistory = chatData.messages.map((msg: any) => ({
            type: msg.type,
            content: msg.content,
            timestamp: new Date(msg.timestamp),
            emailData: msg.emailData,
            intent: 'create' // Default intent
          }));
          
      
          
          setConversationHistory(processedChatHistory);
        } else {
          setConversationHistory([]);
        }
      } else {
        console.error('❌ Failed to load chat history:', chatHistoryResponse.status);
        setConversationHistory([]);
      }

      // Primary: Try to load the most recent email from dedicated API
      let lastEmailLoaded = false;
      setLoadingStatus('Looking for your last generated email...');
      
      if (recentEmailsResponse.ok) {
        const recentEmailsData = await recentEmailsResponse.json();
      
        if (recentEmailsData.success && recentEmailsData.emails && recentEmailsData.emails.length > 0) {
          const latestEmail = recentEmailsData.emails[0];
          
          setLoadingStatus('Loading your last email to preview...');
          
          // Transform the email data to match expected format
          const emailData = {
            subject: latestEmail.email_subject,
            html: latestEmail.email_html,
            preheader: latestEmail.preheader_text,
            features: latestEmail.key_features || [],
            designNotes: latestEmail.design_notes,
            colorPalette: latestEmail.color_palette || [],
            fontsUsed: latestEmail.fonts_used || [],
            accessibilityFeatures: latestEmail.accessibility_features || [],
            compatibilityNotes: latestEmail.compatibility_notes,
            estimatedSize: latestEmail.estimated_size_kb,
            mobileOptimized: latestEmail.mobile_optimized
          };
          
          // Only load if we have valid HTML content
         
          
          if (emailData.html) {
            setCurrentEmail(emailData);
            setCurrentEmailHtml(emailData.html);
            lastEmailLoaded = true;
            setLoadingStatus('Email loaded successfully!');
          } else {
          }
        } else {
          setLoadingStatus('Checking conversation history...');
        }
      } else {
        console.warn('⚠️ Failed to load recent emails:', recentEmailsResponse.status);
        setLoadingStatus('Checking conversation history...');
      }

      // Fallback: If no email loaded from recent-emails API, try chat history
      if (!lastEmailLoaded && processedChatHistory.length > 0) {

        // Find the most recent email in chat history
        const emailMessages = processedChatHistory.filter((msg: any) => msg.type === 'email' && msg.emailData);
        
        if (emailMessages.length > 0) {
          const latestEmailMessage = emailMessages[emailMessages.length - 1]; // Last email
    
          
          if (latestEmailMessage.emailData && latestEmailMessage.emailData.html) {
            setCurrentEmail(latestEmailMessage.emailData);
            setCurrentEmailHtml(latestEmailMessage.emailData.html);
            lastEmailLoaded = true;
          }
        }
      }

      if (!lastEmailLoaded) {
        setLoadingStatus('Ready to create your first email!');
      }
      
    } catch (error) {
    } finally {
      setIsLoadingPageData(false);
    }
  };

  // Handle email generation with conversation integration
  const handleEmailGeneration = async (prompt: string) => {
    setIsGenerating(true);
    setGenerationProgress('Analyzing your request...');
    
    try {

      // 🎯 Smart Intent Detection
      const intentAnalysis = analyzeEmailIntent(
        prompt, 
        !!currentEmailHtml, 
        conversationHistory
      );
      
      
      // Handle unclear intent with high confidence threshold
      if (intentAnalysis.intent === 'unclear' || intentAnalysis.confidence < 0.7) {
        const clarification = generateClarificationPrompt(prompt, !!currentEmailHtml);
        setGenerationProgress(clarification);
        
    

      }
      
      const emailType = intentAnalysis.intent === 'unclear' 
        ? (currentEmailHtml ? 'update' : 'create')
        : intentAnalysis.intent;
        
      setGenerationType(emailType);
      
      // Import API function
      // Use apiClient for API calls with automatic token refresh
      
      // Step 1: Ensure we have a conversation
      let conversationId = currentConversationId;
      if (!conversationId) {
        setGenerationProgress('Creating conversation...');
        
        const conversationResponse = await apiClient.fetchWithAuth('ai/conversations', {
          method: 'POST',
          body: JSON.stringify({
            title: `Email: ${prompt.substring(0, 50)}...`
          })
        });
        
        const conversationData = await conversationResponse.json();
        
        
        if (conversationResponse.ok && conversationData.success && conversationData.data) {
          conversationId = conversationData.data.conversation_id;
          setCurrentConversationId(conversationId);
        } else {
          throw new Error(`Failed to create conversation: ${conversationData.error || conversationData.message || 'Unknown error'}`);
        }
      }
      
      // Step 2: Add user message to conversation
      if (conversationId) {
        setGenerationProgress('Gathering Email Requirements...');
        
        const messageResponse = await apiClient.fetchWithAuth(`ai/conversations/${conversationId}/messages`, {
          method: 'POST',
          body: JSON.stringify({
            message_content: prompt,
            message_role: 'user',
            message_type: 'text',
            metadata: {
              email_type: 'create',
              user_prompt: prompt
            }
          })
        });
        
        const messageData = await messageResponse.json();
        
        if (!messageResponse.ok || !messageData.success) {
          console.warn('⚠️ Failed to add message to conversation:', messageData);
        } 

      }
      
      // Step 3: Generate email (this will also store the AI response)
      setTimeout(() => setGenerationProgress('Connecting to AI...'), 500);
      setTimeout(() => setGenerationProgress('Generating email structure...'), 1500);
      setTimeout(() => setGenerationProgress('Applying design elements...'), 2500);
      setTimeout(() => setGenerationProgress('Optimizing for mobile...'), 3500);
      
      // Call the actual API with smart intent detection
      const emailResponse = await apiClient.fetchWithAuth('ai/quick-email', {
        method: 'POST',
        body: JSON.stringify({
          user_prompt: prompt,
          email_type: emailType,
          existing_email_html: emailType === 'update' ? currentEmailHtml : undefined
        })
      });
      
      const response = await emailResponse.json();
      
      if (emailResponse.ok && response.success && response.data) {
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
        
        // Update current email HTML for future updates
        setCurrentEmailHtml(emailData.html);
        
        // Update conversation history
        const newMessage = {
          type: 'email',
          content: prompt,
          emailData: emailData,
          timestamp: new Date(),
          intent: emailType
        };
        setConversationHistory(prev => [...prev, newMessage]);
        
        // Add email to chat history
        if (typeof window !== 'undefined' && (window as any).addEmailToChat) {
          (window as any).addEmailToChat(emailData, prompt);
        }
        
        // Refresh daily usage after successful generation
        await fetchDailyUsage();
        setIsGenerating(false);
        setGenerationProgress('');
      } else {
        throw new Error(response.message || 'Failed to generate email');
      }
      
    } catch (error: any) {
      console.error('❌ Email generation failed:', error);
      setIsGenerating(false);
      setGenerationProgress('');
      
      // Check if it's an authentication error
      if (error.message?.includes('No valid session') || error.message?.includes('log in again')) {
        console.error('🔐 Authentication error detected');
        showError('Authentication expired. Please refresh the page and log in again.');
        // Optionally redirect to login
        // router.push('/login');
      } else {
        // Show error message to user
        showError(`Email generation failed: ${error.message || 'Unknown error'}`);
      }
    }
  };

  // Handle email export
  const handleExportEmail = async () => {
    if (!currentEmail || !currentEmail.html) {
      showError('No email to export. Please generate an email first.');
      return;
    }

    // Show export dialog
    setShowExportDialog(true);
  };

  // Handle export with options
  const handleExportWithOptions = async (options: any) => {
    try {
      if (options.format === 'html-with-metadata') {
        // Export both HTML and metadata
        downloadHtmlFile(currentEmail.html, {
          filename: options.filename,
          includeStyles: options.includeStyles,
          format: 'html'
        });
        
        // Also export metadata
        exportEmailWithMetadata(currentEmail);
      } else {
        // Export HTML only
        downloadHtmlFile(currentEmail.html, {
          filename: options.filename,
          includeStyles: options.includeStyles,
          format: 'html'
        });
      }

    } catch (error: any) {
      console.error('❌ Export failed:', error);
      showError(error.message || 'Failed to export email. Please try again.');
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
        onExport={handleExportEmail}
        onShare={() => console.log('Share email')}
        currentEmail={currentEmail}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {isLoadingPageData ? (
          /* Loading State */
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 animate-spin">
                <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Loading your workspace...</h3>
              <p className="text-gray-500 mb-1">{loadingStatus}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Left Chat Panel - 25% */}
            <div className="w-1/4 border-r border-gray-200 flex flex-col">
              <ChatPanel
                credits={dailyUsage.messages_left}
                resetTime={dailyUsage.reset_time ? new Date(dailyUsage.reset_time) : null}
                onSendMessage={handleEmailGeneration}
                isGenerating={isGenerating}
                generationProgress={generationProgress}
                initialPrompt={initialPrompt}
                onEmailClick={(emailData) => {
                  setCurrentEmail(emailData);
                  setCurrentEmailHtml(emailData.html);
                 
                }}
                conversationHistory={conversationHistory}
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
                generationType={generationType}
                onEmailUpdate={(updatedHtml) => {
                  // Update the current email with new HTML
                  if (currentEmail) {
                    setCurrentEmail({
                      ...currentEmail,
                      html: updatedHtml
                    });
                    setCurrentEmailHtml(updatedHtml);
                  }
                }}
              />
            </div>
          </>
        )}
      </div>

      {/* Template Gallery Overlay */}
      {showTemplateGallery && (
        <TemplateGallery
          onClose={() => setShowTemplateGallery(false)}
          onSelectTemplate={handleTemplateSelect}
        />
      )}

      {/* Export Dialog */}
      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        onExport={handleExportWithOptions}
        email={currentEmail}
      />

      {/* Error Dialog */}
      <ErrorDialog
        isOpen={errorDialogOpen}
        message={errorMessage}
        onClose={hideError}
      />
    </div>
  );
}
