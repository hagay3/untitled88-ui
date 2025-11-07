/**
 * Main Dashboard Layout Component
 * Split-screen design with chat panel (25%) and preview panel (75%)
 */

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import ChatPanel from './ChatPanel';
import { SimpleJsonEmailEditor } from './SimpleJsonEmailEditor';
import DashboardNavbar from './DashboardNavbar';
import TemplateGallery from './TemplateGallery';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorDialog, { useErrorDialog } from '@/components/ui/ErrorDialog';
import ExportDialog from '@/components/ui/ExportDialog';
import SendTestEmailDialog from '@/components/ui/SendTestEmailDialog';
import { apiClient } from '@/utils/apiClient';
import { ShareDialog } from '@/components/ShareDialog';
import { analyzeEmailIntent, generateClarificationPrompt } from '@/utils/emailIntentDetection';
import { downloadHtmlFile, exportEmailWithMetadata } from '@/utils/exportUtils';
import { updateEmailContent } from '@/lib/api';
import { emailConverter } from '@/utils/EmailConverter';

interface DashboardLayoutProps {
  initialPrompt?: string;
}

export default function DashboardLayout({ initialPrompt }: DashboardLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isOpen: errorDialogOpen, message: errorMessage, showError, hideError } = useErrorDialog();
  
  // Success message state
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };
  
  // State management
  const [currentEmail, setCurrentEmail] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState('');
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showTestEmailDialog, setShowTestEmailDialog] = useState(false);
  const [testEmailMessage, setTestEmailMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareableLink, setShareableLink] = useState<string>('');
  const [isCreatingShare, setIsCreatingShare] = useState(false);
  
  // Export function from SimpleJsonEmailEditor (always current local state)
  const [getExportHtml, setGetExportHtml] = useState<(() => string) | null>(null);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  
  // Pending changes state (from SimpleJsonEmailEditor)
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [pendingChangesCount, setPendingChangesCount] = useState(0);
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
            
            // Convert from JSON structure to HTML if available
            let emailHtml = '';
            if (emailData.email_json) {
              // New JSON format - convert to HTML
              try {
                emailHtml = emailConverter.jsonToHtml(emailData.email_json);
                console.log('✅ [DashboardLayout] Converted email JSON to HTML');
              } catch (error) {
                console.error('❌ [DashboardLayout] Failed to convert JSON to HTML:', error);
                // Fallback to legacy HTML if conversion fails
                emailHtml = emailData.html || emailData.updated_email_html || emailData.email_html || '';
              }
            } else {
              // Legacy HTML format
              emailHtml = emailData.html || emailData.updated_email_html || emailData.email_html || '';
            }
            
            if (emailHtml) {
              setCurrentEmail({
                ...emailData,
                html: emailHtml,
                email_json: emailData.email_json // Store the JSON for editing
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
      
      // Step 2: User message will be automatically stored by the AI handler
      // No need to manually store it here as _store_ai_message handles both user and AI messages
      
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
        // Handle new JSON format from AI
        let emailHtml = '';
        if (response.data.subject && response.data.blocks) {
          // New JSON format - convert to HTML
          try {
            emailHtml = emailConverter.jsonToHtml(response.data);
            console.log('✅ [DashboardLayout] Converted generated email JSON to HTML');
          } catch (error) {
            console.error('❌ [DashboardLayout] Failed to convert generated JSON to HTML:', error);
            // Fallback to legacy fields if available
            emailHtml = response.data.email_html || response.data.updated_email_html || '';
          }
        } else {
          // Legacy HTML format
          emailHtml = response.data.email_html || response.data.updated_email_html || '';
        }

        const emailData = {
          message_id: response.data.message_id, // ✅ Add message_id for backend sync
          subject: response.data.subject || response.data.email_subject,
          html: emailHtml,
          preheader: response.data.preheader || response.data.preheader_text,
          email_json: response.data.subject && response.data.blocks ? response.data : null, // Store JSON if available
          // Legacy fields for backward compatibility
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
        setCurrentEmailHtml(emailHtml);
        
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

  // Handle export with options - uses current local state HTML
  const handleExportWithOptions = async (options: any) => {
    // Get HTML from current local state (not from backend)
    const exportHtml = getExportHtml ? getExportHtml() : currentEmail?.html;
    
    if (!exportHtml) {
      showError('No email content to export');
      return;
    }

    try {
      console.log('📤 Exporting email using current local state HTML');
      
      if (options.format === 'html-with-metadata') {
        // Export both HTML and metadata
        downloadHtmlFile(exportHtml, {
          filename: options.filename,
          includeStyles: options.includeStyles,
          format: 'html'
        });
        
        // Also export metadata (use current email data with local HTML)
        exportEmailWithMetadata({
          ...currentEmail,
          html: exportHtml // Use current local state HTML
        });
      } else {
        // Export HTML only
        downloadHtmlFile(exportHtml, {
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

  const prepareEmailForSending = (htmlContent?: string): string => {
    // Use provided HTML or get from current local state
    const emailHtml = htmlContent || (getExportHtml ? getExportHtml() : currentEmail?.html) || '';
    
    if (!emailHtml) {
      throw new Error('No email content available for sending');
    }
    // Use the same preparation logic as export
    let exportHtml = emailHtml;
    
    // Add DOCTYPE if missing
    if (!exportHtml.trim().toLowerCase().startsWith('<!doctype')) {
      exportHtml = '<!DOCTYPE html>\n' + exportHtml;
    }
    
    // Parse the HTML with DOCTYPE
    const parser = new DOMParser();
    const finalDoc = parser.parseFromString(exportHtml, 'text/html');
    
    // Add meta tags if missing
    const head = finalDoc.querySelector('head');
    if (head) {
      // Add charset if missing
      if (!head.querySelector('meta[charset]')) {
        const charsetMeta = finalDoc.createElement('meta');
        charsetMeta.setAttribute('charset', 'UTF-8');
        head.insertBefore(charsetMeta, head.firstChild);
      }
      
      // Add viewport if missing
      if (!head.querySelector('meta[name="viewport"]')) {
        const viewportMeta = finalDoc.createElement('meta');
        viewportMeta.setAttribute('name', 'viewport');
        viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0');
        head.appendChild(viewportMeta);
      }
      
      // Add title if missing
      if (!head.querySelector('title')) {
        const title = finalDoc.createElement('title');
        title.textContent = currentEmail?.subject || 'Email Template - Untitled88';
        head.appendChild(title);
      }
      
      // Add email client compatibility styles
      const emailStyles = finalDoc.createElement('style');
      emailStyles.textContent = getEmailCompatibilityStyles();
      head.appendChild(emailStyles);
    }
    
    // Remove any data-block attributes for clean export
    const blockElements = finalDoc.querySelectorAll('[data-block-id], [data-block-type]');
    blockElements.forEach(element => {
      element.removeAttribute('data-block-id');
      element.removeAttribute('data-block-type');
    });
    
    // Return the cleaned HTML
    return finalDoc.documentElement.outerHTML;
  };

  const getEmailCompatibilityStyles = (): string => {
    return `
      /* Email Client Compatibility Styles */
      body {
        margin: 0;
        padding: 0;
        -webkit-text-size-adjust: 100%;
        -ms-text-size-adjust: 100%;
      }
      
      table {
        border-collapse: collapse;
        mso-table-lspace: 0pt;
        mso-table-rspace: 0pt;
      }
      
      img {
        border: 0;
        height: auto;
        line-height: 100%;
        outline: none;
        text-decoration: none;
        -ms-interpolation-mode: bicubic;
      }
      
      /* Outlook specific styles */
      .ExternalClass {
        width: 100%;
      }
      
      .ExternalClass,
      .ExternalClass p,
      .ExternalClass span,
      .ExternalClass font,
      .ExternalClass td,
      .ExternalClass div {
        line-height: 100%;
      }
      
      /* Mobile styles */
      @media only screen and (max-width: 600px) {
        table[class="main"] {
          width: 100% !important;
        }
        
        td[class="mobile-padding"] {
          padding: 20px !important;
        }
        
        img[class="mobile-image"] {
          width: 100% !important;
          height: auto !important;
        }
      }
    `;
  };

  const handleSendTestEmail = () => {
    setShowTestEmailDialog(true);
  };

  const handleTestEmailSend = (success: boolean, message: string) => {
    setTestEmailMessage({
      type: success ? 'success' : 'error',
      message
    });
    
    // Clear message after 5 seconds
    setTimeout(() => {
      setTestEmailMessage(null);
    }, 5000);
  };

  // Handle share email - generate link first, then show dialog
  const handleShareEmail = async () => {
    console.log('🚀 handleShareEmail called!', {
      hasCurrentEmail: !!currentEmail,
      hasHtml: !!currentEmail?.html,
      emailSubject: currentEmail?.subject
    });

    if (!currentEmail || !currentEmail.html) {
      console.log('❌ No email to share');
      showError('No email to share. Please generate an email first.');
      return;
    }

    try {
      setIsCreatingShare(true); // Start loading state
      console.log('🔗 Creating shareable link first...');
      
      // Get the current email data
      const emailHtml = getExportHtml ? getExportHtml() : currentEmail.html;
      const emailJson = currentEmail.email_json || {};
      const emailSubject = currentEmail.subject || 'Untitled Email';
      
      console.log('📧 Sharing email data:', {
        hasHtml: !!emailHtml,
        hasJson: !!emailJson,
        jsonType: typeof emailJson,
        jsonKeys: Object.keys(emailJson || {}),
        subject: emailSubject
      });
      
      // Use the existing API client for consistency
      console.log('📡 Making API call to share/create...');
      const response = await apiClient.fetchWithAuth('share/create', {
        method: 'POST',
        body: JSON.stringify({
          email_html: emailHtml,
          email_json: emailJson,
          email_subject: emailSubject,
        }),
      });

      console.log('📥 API response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Share API error:', response.status, errorText);
        showError(`Failed to share email: ${response.status} ${response.statusText}`);
        return;
      }

      const data = await response.json();
      console.log('📊 API response data:', data);

      if (data.success) {
        // Construct full URL from the shareable_link suffix using current host
        const currentOrigin = window.location.origin; // Gets protocol + host + port
        const shareableUrl = `${currentOrigin}${data.shareable_link}`;
        
        console.log('🔗 Constructing full URL:', {
          origin: currentOrigin,
          suffix: data.shareable_link,
          fullUrl: shareableUrl
        });
        
        setShareableLink(shareableUrl);
        
        // Open dialog only after link is set
        console.log('🎯 Opening dialog with link ready');
        setShowShareDialog(true);
        
        showSuccess('Shareable link created successfully!');
        
        console.log('✅ Email shared successfully:', {
          shareable_id: data.shareable_id,
          shareable_link: data.shareable_link,
          full_url: shareableUrl,
          dialog_opened: true
        });
      } else {
        console.error('❌ API returned error:', data.error);
        showError(data.error || 'Failed to share email');
      }
    } catch (error) {
      console.error('❌ Error sharing email:', error);
      showError('Failed to share email. Please try again.');
    } finally {
      setIsCreatingShare(false); // Stop loading state
    }
  };

  // Handle creating a new shareable link
  const handleCreateShareLink = async () => {
    if (!currentEmail || !currentEmail.html) {
      showError('No email to share. Please generate an email first.');
      return;
    }

    try {
      setIsCreatingShareLink(true);
      console.log('🔗 Creating shareable link...');
      
      // Get the current email data
      const emailHtml = getExportHtml ? getExportHtml() : currentEmail.html;
      const emailJson = currentEmail.email_json || {};
      const emailSubject = currentEmail.subject || 'Untitled Email';
      
      console.log('📧 Sharing email data:', {
        hasHtml: !!emailHtml,
        hasJson: !!emailJson,
        jsonType: typeof emailJson,
        jsonKeys: Object.keys(emailJson || {}),
        subject: emailSubject
      });
      
      // Use the existing API client for consistency
      const response = await apiClient.fetchWithAuth('share/create', {
        method: 'POST',
        body: JSON.stringify({
          email_html: emailHtml,
          email_json: emailJson,
          email_subject: emailSubject,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Share API error:', response.status, errorText);
        showError(`Failed to share email: ${response.status} ${response.statusText}`);
        return;
      }

      const data = await response.json();

      if (data.success) {
        // Set the shareable link in state
        const shareableUrl = data.full_url;
        setShareableLink(shareableUrl);
        
        showSuccess('Shareable link created successfully!');
        
        console.log('✅ Email shared successfully:', {
          shareable_id: data.shareable_id,
          shareable_link: data.shareable_link,
          full_url: data.full_url
        });
      } else {
        showError(data.error || 'Failed to share email');
      }
    } catch (error) {
      console.error('❌ Error sharing email:', error);
      showError('Failed to share email. Please try again.');
    } finally {
      setIsCreatingShareLink(false);
    }
  };

  // Handle save email
  const handleSaveEmail = async () => {
    if (!currentEmail?.message_id) {
      console.warn('No email to save');
      return;
    }

    try {
      console.log('💾 Saving email to database...');
      
      // Get the current email JSON structure
      let emailJson = currentEmail.email_json;
      
      if (!emailJson) {
        // If no JSON available, try to convert from HTML (legacy support)
        const currentHtml = getExportHtml ? getExportHtml() : currentEmail.html;
        if (currentHtml) {
          try {
            emailJson = emailConverter.htmlToJson(currentHtml);
            console.log('✅ Converted HTML to JSON for saving');
          } catch (error) {
            console.error('❌ Failed to convert HTML to JSON:', error);
            throw new Error('Unable to save email: conversion failed');
          }
        } else {
          throw new Error('No email content to save');
        }
      }

      // Use the correct API endpoint for updating email content
      const result = await updateEmailContent(
        currentEmail.message_id,
        emailJson,
        'Manual save from dashboard'
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to save email');
      }

      console.log('✅ Email saved successfully:', result);
      
      // Show success message
      showSuccess('Email saved successfully');
      
    } catch (error) {
      console.error('❌ Failed to save email:', error);
      showError(error instanceof Error ? error.message : 'Failed to save email');
      throw error; // Re-throw so the UI can handle the error state
    }
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
        onSave={handleSaveEmail}
        onExport={handleExportEmail}
        onShare={handleShareEmail}
        onSendTestEmail={handleSendTestEmail}
        currentEmail={currentEmail}
        hasPendingChanges={hasPendingChanges}
        pendingChangesCount={pendingChangesCount}
        isCreatingShare={isCreatingShare}
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
                  
                  // Convert from JSON to HTML if needed
                  let emailHtml = emailData.html;
                  if (emailData.email_json && !emailHtml) {
                    try {
                      emailHtml = emailConverter.jsonToHtml(emailData.email_json);
                      console.log('✅ [DashboardLayout] Converted selected email JSON to HTML');
                    } catch (error) {
                      console.error('❌ [DashboardLayout] Failed to convert selected email JSON to HTML:', error);
                      emailHtml = '';
                    }
                  }
                  
                  setCurrentEmail({
                    ...emailData,
                    html: emailHtml
                  });
                  setCurrentEmailHtml(emailHtml);
                }}
                conversationHistory={conversationHistory}
              />
            </div>

            {/* Right JSON Email Editor - 75% */}
            <div className="flex-1 flex flex-col">
              <SimpleJsonEmailEditor
                email={currentEmail}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                isUpdating={isGenerating}
                updateProgress={generationProgress}
                onEmailUpdate={(updatedHtml) => {
                  // Update the current email with new HTML (for preview)
                  if (currentEmail) {
                    setCurrentEmail({
                      ...currentEmail,
                      html: updatedHtml
                    });
                    setCurrentEmailHtml(updatedHtml);
                  }
                }}
                onExportHtmlReady={(getHtmlFunction) => {
                  // Store the export function for immediate access to local state
                  console.log('📤 Export function ready from SimpleJsonEmailEditor');
                  setGetExportHtml(() => getHtmlFunction);
                }}
                onPendingChangesUpdate={(hasPending, count) => {
                  setHasPendingChanges(hasPending);
                  setPendingChangesCount(count);
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
        getHtmlContent={getExportHtml || undefined}
      />

      {/* Send Test Email Dialog */}
      <SendTestEmailDialog
        isOpen={showTestEmailDialog}
        onClose={() => setShowTestEmailDialog(false)}
        email={currentEmail}
        onSend={handleTestEmailSend}
        prepareEmailHtml={prepareEmailForSending}
      />

      {/* Share Dialog */}
      <ShareDialog
        isOpen={showShareDialog}
        onClose={() => {
          setShowShareDialog(false);
          setShareableLink(''); // Clear link when closing
        }}
        emailSubject={currentEmail?.subject || 'Untitled Email'}
        shareableLink={shareableLink}
        onCreateNewLink={handleCreateShareLink}
        isCreatingLink={false}
      />

      {/* Test Email Success/Error Message */}
      {testEmailMessage && (
        <div className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg shadow-lg ${
          testEmailMessage.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-start space-x-3">
            <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
              testEmailMessage.type === 'success' ? 'text-green-500' : 'text-red-500'
            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {testEmailMessage.type === 'success' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              )}
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium">
                {testEmailMessage.type === 'success' ? 'Email Sent!' : 'Send Failed'}
              </p>
              <p className="text-sm mt-1">{testEmailMessage.message}</p>
            </div>
            <button
              onClick={() => setTestEmailMessage(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{successMessage}</span>
          </div>
        </div>
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
