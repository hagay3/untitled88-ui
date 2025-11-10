/**
 * Left Chat Panel Component (25% width)
 * Contains credits display, countdown timer, chat history, and message input
 */

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { FaCircleUp } from "react-icons/fa6";

interface ChatPanelProps {
  credits: number;
  resetTime: Date | null;
  onSendMessage: (message: string) => void;
  isGenerating: boolean;
  generationProgress: string;
  initialPrompt?: string;
  onEmailClick?: (emailData: any) => void;
  conversationHistory?: any[];
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system' | 'email';
  content: string;
  timestamp: Date;
  emailData?: {
    subject: string;
    html: string;
    preheader?: string;
    features?: string[];
    designNotes?: string;
    colorPalette?: string[];
    fontsUsed?: string[];
    accessibilityFeatures?: string[];
    compatibilityNotes?: string;
    estimatedSize?: string;
    mobileOptimized?: boolean;
  };
}


export default function ChatPanel({
  credits,
  resetTime,
  onSendMessage,
  isGenerating,
  generationProgress,
  initialPrompt,
  onEmailClick,
  conversationHistory = []
}: ChatPanelProps) {
  const [message, setMessage] = useState('');
  const [currentMessages, setCurrentMessages] = useState<ChatMessage[]>([]);
  const [timeLeft, setTimeLeft] = useState('');
  const [currentProgressStep, setCurrentProgressStep] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Company URL state
  const [companyUrl, setCompanyUrl] = useState('');
  const [isEditingUrl, setIsEditingUrl] = useState(true); // Default to edit mode when empty
  const [urlError, setUrlError] = useState('');
  
  // LocalStorage key for company URL
  const COMPANY_URL_KEY = 'untitled88_company_url';

  // Load company URL from localStorage on mount
  useEffect(() => {
    try {
      const savedUrl = localStorage.getItem(COMPANY_URL_KEY);
      if (savedUrl) {
        setCompanyUrl(savedUrl);
        setIsEditingUrl(false); // Show in view mode if URL exists
      }
    } catch (error) {
      // Silently handle localStorage errors
    }
  }, []);
  
  // Save company URL to localStorage whenever it changes
  useEffect(() => {
    try {
      if (companyUrl.trim()) {
        localStorage.setItem(COMPANY_URL_KEY, companyUrl.trim());
      } else {
        localStorage.removeItem(COMPANY_URL_KEY);
      }
    } catch (error) {
      // Silently handle localStorage errors
    }
  }, [companyUrl]);

  // Handle initial prompt from homepage
  useEffect(() => {
    if (initialPrompt) {
      setMessage(initialPrompt);
    }
  }, [initialPrompt]);
  
  // Validate URL format
  const validateUrl = (url: string): boolean => {
    if (!url.trim()) {
      setUrlError('');
      return true; // Empty is valid (optional field)
    }
    
    try {
      // Add protocol if missing
      const urlToValidate = url.startsWith('http://') || url.startsWith('https://') 
        ? url 
        : `https://${url}`;
      
      const urlObj = new URL(urlToValidate);
      
      // Check if it has a valid domain
      if (!urlObj.hostname || urlObj.hostname.indexOf('.') === -1) {
        setUrlError('Please enter a valid URL (e.g., example.com)');
        return false;
      }
      
      setUrlError('');
      return true;
    } catch (e) {
      setUrlError('Please enter a valid URL (e.g., example.com)');
      return false;
    }
  };
  
  // Handle URL save
  const handleSaveUrl = () => {
    if (validateUrl(companyUrl)) {
      setIsEditingUrl(false);
    }
  };
  
  // Handle URL edit
  const handleEditUrl = () => {
    setIsEditingUrl(true);
    setUrlError('');
  };
  
  // Handle URL clear
  const handleClearUrl = () => {
    setCompanyUrl('');
    setIsEditingUrl(true);
    setUrlError('');
    localStorage.removeItem(COMPANY_URL_KEY);
  };

  // Update countdown timer
  useEffect(() => {
    if (!resetTime) return;

    const updateTimer = () => {
      const now = new Date();
      const diff = resetTime.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeLeft('');
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      if(days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      }else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000); // Update every second

    return () => clearInterval(interval);
  }, [resetTime]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages, generationProgress]);

  // Dynamic progress step rotation
  useEffect(() => {
    if (!isGenerating) {
      setCurrentProgressStep(0);
      return;
    }

    const progressSteps = [
      "Analyzing your request...",
      "Connecting to AI service...",
      "Processing your prompt...",
      "Generating email structure...",
      "Applying design elements...",
      "Optimizing for mobile devices...",
      "Adding final touches...",
      "Preparing your email..."
    ];

    const interval = setInterval(() => {
      setCurrentProgressStep(prev => (prev + 1) % progressSteps.length);
    }, 1000);

    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleSend = async () => {
    if (!message.trim() || isGenerating || credits <= 0) return;

    const trimmedMessage = message.trim();
    
    // Append company URL to the message if provided
    let finalMessage = trimmedMessage;
    
    if (companyUrl.trim()) {
      // Ensure URL has https:// prefix
      let formattedUrl = companyUrl.trim();
      if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = `https://${formattedUrl}`;
      }
      
      finalMessage = `${trimmedMessage}\n\nCompany website url: ${formattedUrl}\n\n`;
    }
    
    // Immediately show user's message in chat (optimistic update)
    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      type: 'user',
      content: trimmedMessage, // Show original message without URL in chat
      timestamp: new Date()
    };
    setCurrentMessages(prev => [...prev, userMessage]);
    
    // Clear the input immediately
    setMessage('');

    try {
      await onSendMessage(finalMessage); // Send message with URL to backend
    } catch (error: any) {
      // Error handling is done in parent component
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Load conversation history from props
  useEffect(() => {
    if (conversationHistory && conversationHistory.length > 0) {
      
      // Transform conversation history to ChatMessage format
      const transformedMessages: ChatMessage[] = conversationHistory.map((msg: any, index: number) => ({
        id: `msg-${index}`,
        type: msg.type,
        content: msg.content,
        timestamp: msg.timestamp,
        emailData: msg.emailData
      }));
      
      // Sort messages by timestamp (oldest first for proper chat order)
      transformedMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      
      setCurrentMessages(transformedMessages);
    } else {
      setCurrentMessages([]);
    }
  }, [conversationHistory]);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Daily Usage Section */}
      <div className="p-4 bg-white border-b border-gray-200">
        { credits == 0 && 
        <div className="text-xs text-red-500">
          Tokens limit reached
        </div>
        }
        {credits <= 0 && timeLeft && (
          <div className="mt-2 text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded">
            Resets in {timeLeft}
            <br />
            Talk to support on discord to upgrade  
            <br />
            <a href={process.env.NEXT_PUBLIC_DISCORD_INVIRATION_URL} target="_blank" className="text-blue-500">Join Discord</a>
          </div>
          
        )}
      </div>

      {/* Current Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {currentMessages.length === 0 && !isGenerating && (
            <div className="text-center text-gray-500 mt-8">
              <div className="w-12 h-12 mx-auto mb-3 text-gray-300">
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                </svg>
              </div>
              <p className="text-sm">Start a conversation to create your email</p>
            </div>
          )}

          {currentMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg text-sm ${
                  msg.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : msg.type === 'system'
                    ? msg.content.startsWith('**Next Steps:**')
                      ? 'bg-blue-50 border border-blue-200 text-blue-900'
                      : 'bg-red-50 border border-red-200 text-red-800'
                    : msg.type === 'email'
                    ? 'bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 text-gray-900 cursor-pointer hover:from-green-100 hover:to-blue-100 transition-colors'
                    : 'bg-white border border-gray-200 text-gray-900'
                }`}
                onClick={msg.type === 'email' && onEmailClick ? () => onEmailClick(msg.emailData) : undefined}
              >
                {msg.type === 'system' && (
                  <div className="flex items-center mb-1">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium text-xs">
                      {msg.content.startsWith('**Next Steps:**') ? 'AI Assistant' : 'System'}
                    </span>
                  </div>
                )}
                {msg.type === 'email' && (
                  <div className="flex items-center mb-2">
                    <svg className="w-4 h-4 mr-1 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium text-xs text-green-700">Generated Email</span>
                    <span className="ml-2 text-xs text-gray-500">Click to preview</span>
                  </div>
                )}
                <div className="whitespace-pre-line">
                  {msg.type === 'email' ? (
                    <div>
                      <div className="font-semibold text-gray-900 mb-2">
                        📧 {msg.emailData?.subject || 'Email Generated'}
                      </div>
                      <div className="text-xs text-black mb-2">
                        <strong>Prompt:</strong> {msg.content}
                      </div>
                      {msg.emailData?.preheader && (
                        <div className="text-xs text-gray-500 mb-2">
                          <strong>Preheader:</strong> {msg.emailData.preheader}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {msg.emailData?.features?.slice(0, 3).map((feature, index) => (
                          <span key={index} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            {feature}
                          </span>
                        ))}
                        {(msg.emailData?.features?.length || 0) > 3 && (
                          <span className="text-xs text-gray-500">
                            +{(msg.emailData?.features?.length || 0) - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  ) : msg.content.startsWith('**Next Steps:**') ? (
                    <div>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            </div>
          ))}

          {isGenerating && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 p-3 rounded-lg text-sm text-gray-700">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-black">
                    {[
                      "Analyzing your request...",
                      "Connecting to AI service...",
                      "Processing your prompt...",
                      "Generating email structure...",
                      "Applying design elements...",
                      "Optimizing for mobile devices...",
                      "Adding final touches...",
                      "Preparing your email..."
                    ][currentProgressStep]}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

      {/* Message Input */}
      <div className="p-4 bg-white border-t border-gray-200">
        {/* Company URL Section */}
        <div className="mb-3">
          <div className="flex items-center space-x-2">
            {isEditingUrl ? (
              <>
                <div className="flex-1">
                  <input
                    type="text"
                    value={companyUrl}
                    onChange={(e) => setCompanyUrl(e.target.value)}
                    placeholder="https://yourbrand.com | Include your website URL to get the best results"
                    className={`w-full border ${urlError ? 'border-red-500' : 'border-gray-300'} rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    disabled={isGenerating}
                  />
                  {urlError && (
                    <p className="text-xs text-red-500 mt-1">{urlError}</p>
                  )}
                </div>
                <Button
                  onClick={handleSaveUrl}
                  disabled={isGenerating}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
                  size="sm"
                >
                  Save
                </Button>
              </>
            ) : (
              <>
                <div className="flex-1 flex items-center space-x-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  <span className="text-sm text-blue-900 font-medium truncate flex-1">
                    {companyUrl}
                  </span>
                </div>
                <Button
                  onClick={handleEditUrl}
                  disabled={isGenerating}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm"
                  size="sm"
                >
                  Edit
                </Button>
                <Button
                  onClick={handleClearUrl}
                  disabled={isGenerating}
                  className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-lg text-sm"
                  size="sm"
                >
                  Clear
                </Button>
              </>
            )}
          </div>
        </div>
        
        {/* Message Textarea */}
        <div className="flex space-x-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={credits > 0 ? "Describe your email idea..." : "Daily limit reached"}
            disabled={isGenerating || credits <= 0}
            className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            rows={3}
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim() || isGenerating || credits <= 0}
            className="btn-primary self-end"
            size="sm"
          >
            <FaCircleUp className="w-4 h-4" />
          </Button>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Press Enter to send • Shift + Enter for new line
        </div>
      </div>
    </div>
  );
}
