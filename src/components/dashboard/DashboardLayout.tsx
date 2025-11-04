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
      
      // Load conversations and chat history in parallel
      const [conversationsResponse, chatHistoryResponse] = await Promise.all([
        apiClient.fetchWithAuth('ai/conversations?limit=5'),
        apiClient.fetchWithAuth('ai/chat-history?limit=50')
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
      // Backend returns: { type: 'email' | 'text' | ..., emailData?: { ... }, source: 'ai_message' | 'user_message', ... }
      let processedChatHistory: any[] = [];
      if (chatHistoryResponse.ok) {
        const chatData = await chatHistoryResponse.json();
        // this is an example of chat data :
        // { "messages": [ { "content": "modify the existing email and extract the content from https://getkaps.com/ to get the right content for the annual subscription 50% off", "conversation_id": 52, "emailData": { "accessibilityFeatures": [ ], "colorPalette": [ "#f7f8fa", "#ffffff", "#111111", "#333333", "#4A90E2", "#888888" ], "compatibilityNotes": "", "designNotes": "The primary goal was to align the email's branding and content with the information on getkaps.com, as requested. I focused on updating key brand assets (logo, imagery) and refining the copy to be more compelling. The core layout, color scheme, and responsive structure were intentionally preserved to maintain the email's proven compatibility and professional quality. The changes enhance the email's authenticity and directness without requiring a full redesign.", "estimatedSize": "16", "features": [ ], "fontsUsed": [ "Helvetica", "Arial", "sans-serif" ], "html": "<html lang=\"en\"><head>    <meta charset=\"UTF-8\">    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">    <title>Email Subject Here</title>    <!--[if mso]>    <xml>        <o:OfficeDocumentSettings>            <o:AllowPNG/>            <o:PixelsPerInch>96</o:PixelsPerInch>        </o:OfficeDocumentSettings>    </xml>    <![endif]--></head><body style=\"margin: 0; padding: 0; background-color: #f4f4f4;\">    <!-- Main Email Container -->    <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"background-color: #f4f4f4;\">        <tbody><tr>            <td align=\"center\">                <table width=\"600\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"background-color: #ffffff; margin: 0 auto;\">                                        <!-- HEADER BLOCK -->                    <tbody><tr data-block-id=\"header-1\" data-block-type=\"header\">                        <td style=\"padding: 30px 40px 20px 40px; text-align: center; background-color: #ffffff;\">                            <img src=\"https://www.untitled88.com/logo-untitled88.png\" alt=\"Company Logo\" width=\"160\" style=\"max-width: 100%; height: auto; display: block; margin: 0 auto;\">                        </td>                    </tr>                                        <!-- HERO BLOCK -->                    <tr data-block-id=\"hero-1\" data-block-type=\"hero\">                        <td style=\"padding: 40px 40px 30px 40px; text-align: center;\">Your Main Headline Here                                                                                        Supporting text that explains your main message and value proposition.</td>                    </tr>                                        <!-- IMAGE BLOCK -->                    <tr data-block-id=\"image-1\" data-block-type=\"image\">                        <td style=\"padding: 20px 40px; text-align: center;\">                            <img src=\"data:image/jpeg;base64,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\" alt=\"Descriptive image text\" width=\"520\" style=\"max-width: 100%; height: auto; display: block; margin: 0 auto; border-radius: 8px;\">                        </td>                    </tr>                                        <!-- TEXT BLOCK -->                    <tr data-block-id=\"text-1\" data-block-type=\"text\">                        <td style=\"padding: 20px 40px;\">Section Heading                                                                                        Your content text goes here. This can be multiple paragraphs with detailed information about your product or service.                                                                                        Additional paragraph content if needed.</td>                    </tr>                                        <!-- BUTTON BLOCK -->                    <tr data-block-id=\"button-1\" data-block-type=\"button\">                        <td style=\"padding: 30px 40px; text-align: center;\">                            <a href=\"https://example.com\" style=\"display: inline-block; padding: 15px 30px; background-color: #3B82F6; color: #ffffff; text-decoration: none; border-radius: 6px; font-family: Arial, sans-serif; font-size: 16px; font-weight: bold;\">Call to Action</a>                        </td>                    </tr>                                        <!-- DIVIDER BLOCK -->                    <tr data-block-id=\"divider-1\" data-block-type=\"divider\">                        <td style=\"padding: 20px 40px;\"></td>                    </tr>                                        <!-- FOOTER BLOCK -->                    <tr data-block-id=\"footer-1\" data-block-type=\"footer\">                        <td style=\"padding: 30px 40px; text-align: center; background-color: #f8f9fa;\">Company Name | 123 Street Address, City, State 12345                                                                                        Unsubscribe |                                 Privacy Policy</td>                    </tr>                                    </tbody></table>            </td>        </tr>    </tbody></table></body></html>", "message_id": 72, "mobileOptimized": true, "preheader": "Unlock the full power of personalized video for half the price. This is a limited-time offer to help you build stronger connections.", "subject": "A personal offer: 50% off your year with Kaps" }, "id": "ai_msg_72", "message_type": "email_generation", "source": "ai_message", "timestamp": "2025-11-03T07:15:56", "type": "email" } ], "success": true, "total_count": 1 }
        // 1) Load ALL conversations with messages and emails (do not filter by message_type)
        if (chatData.success && chatData.messages && chatData.messages.length > 0) {
          console.log('📨 [DashboardLayout] Processing chat history:', {
            totalMessages: chatData.messages.length,
            emailMessages: chatData.messages.length
          });
          
          // Transform chat history messages to conversation history format WITHOUT filtering
          processedChatHistory = chatData.messages.map((msg: any) => {
            // Normalize message type for UI rendering
            const normalizedType =
              msg.type === 'email'
                ? 'email'
                : (msg.source && String(msg.source).includes('user'))
                  ? 'user'
                  : 'assistant';

            return {
              type: normalizedType,
              content: msg.content,
              timestamp: new Date(msg.timestamp),
              emailData: msg.emailData
            };
          });
          
          setConversationHistory(processedChatHistory);
        } else {
          setConversationHistory([]);
        }
      } else {
        console.error('❌ Failed to load chat history:', chatHistoryResponse.status);
        setConversationHistory([]);
      }

      // 2) Load the most recent generated email (separate logic)
      let lastEmailLoaded = false;
      setLoadingStatus('Looking for your last generated email...');

      // Consider only messages that actually contain email data or are labeled as email
      if (!lastEmailLoaded) {
        setLoadingStatus('Loading email from conversation history...');
        
        const emailMessages = processedChatHistory
          .filter((msg: any) => msg.message_type === 'email_generation' || !!msg.emailData)
          .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        if (emailMessages.length > 0) {
          const latestEmailMessage = emailMessages[0]; // First item after sorting (newest)
          
          console.log('📧 [DashboardLayout] Loading email from chat history:', {
            hasEmailData: !!latestEmailMessage.emailData,
            hasMessageId: !!latestEmailMessage.emailData?.message_id,
            messageId: latestEmailMessage.emailData?.message_id,
            subject: latestEmailMessage.emailData?.subject
          });
          
          if (latestEmailMessage.emailData) {
            // The emailData should already be parsed from the backend
            const emailData = latestEmailMessage.emailData;
            
            // Handle both updated_email_html and email_html fields
            const emailHtml = emailData.html || emailData.updated_email_html || emailData.email_html;
            
            if (emailHtml) {
              setCurrentEmail({
                ...emailData,
                html: emailHtml
              });
              setCurrentEmailHtml(emailHtml);
              lastEmailLoaded = true;
              setLoadingStatus('Email loaded from history!');
              
              console.log('✅ [DashboardLayout] Email loaded from chat history with message_id:', emailData.message_id);
            } else {
              console.warn('⚠️ [DashboardLayout] Email data found but no HTML content');
            }
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
          message_id: response.data.message_id, // ✅ Add message_id for backend sync
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
        
        console.log('📧 [DashboardLayout] Generated email with message_id:', response.data.message_id);
        
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
                  console.log('📧 [DashboardLayout] Email selected for preview:', {
                    hasMessageId: !!emailData.message_id,
                    messageId: emailData.message_id,
                    subject: emailData.subject
                  });
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
