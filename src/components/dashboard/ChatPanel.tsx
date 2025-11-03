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

  // Handle initial prompt from homepage
  useEffect(() => {
    if (initialPrompt) {
      setMessage(initialPrompt);
    }
  }, [initialPrompt]);

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

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      if (hours > 0) {
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

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: message.trim(),
      timestamp: new Date()
    };

    // Add user message to chat history
    setCurrentMessages(prev => [...prev, userMessage]);
    
    // Clear the input immediately
    setMessage('');

    // Add dynamic next steps message
    const nextStepsMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      type: 'system',
      content: generateNextSteps(message.trim()),
      timestamp: new Date()
    };
    
    setCurrentMessages(prev => [...prev, nextStepsMessage]);

    try {
      await onSendMessage(userMessage.content);
    } catch (error: any) {
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        type: 'system',
        content: `Error: ${error.message || 'Failed to generate email. Please try again.'}`,
        timestamp: new Date()
      };
      setCurrentMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };


  const generateNextSteps = (prompt: string): string => {
    // Analyze the prompt for key indicators
    const isWelcome = /welcome|onboard|greeting|hello|intro/i.test(prompt);
    const isPromo = /sale|discount|offer|promo|deal|special|limited/i.test(prompt);
    const isNewsletter = /newsletter|update|news|announce|inform/i.test(prompt);
    const isEvent = /event|webinar|meeting|conference|workshop/i.test(prompt);
    const isProduct = /product|launch|feature|new|release/i.test(prompt);
    const hasColors = /color|blue|red|green|brand|style/i.test(prompt);
    const hasCTA = /button|click|action|cta|link/i.test(prompt);
    
    let steps = ["Analyzing your request...", "Generating email structure..."];
    
    // Add specific steps based on content analysis
    if (isWelcome) {
      steps.push("Creating welcoming tone and onboarding flow...");
    } else if (isPromo) {
      steps.push("Designing promotional layout with urgency elements...");
    } else if (isNewsletter) {
      steps.push("Structuring newsletter with clear sections...");
    } else if (isEvent) {
      steps.push("Adding event details and RSVP elements...");
    } else if (isProduct) {
      steps.push("Highlighting product features and benefits...");
    }
    
    if (hasColors) {
      steps.push("Applying brand colors and visual styling...");
    }
    
    if (hasCTA) {
      steps.push("Optimizing call-to-action buttons...");
    }
    
    steps.push("Ensuring mobile responsiveness...", "Adding final touches and optimization...");
    
    return `**Next Steps:**\n${steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}`;
  };

  // Add generated email to chat history
  const addEmailToChat = (emailData: any, userPrompt: string) => {
    const emailMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'email',
      content: userPrompt,
      timestamp: new Date(),
      emailData: emailData
    };
    
    setCurrentMessages(prev => [...prev, emailMessage]);
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

  // Expose the addEmailToChat method to parent component
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).addEmailToChat = addEmailToChat;
    }
  }, []);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Daily Usage Section */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Daily Limit</span>
          <span className="text-lg font-bold text-blue-600">{credits}</span>
        </div>
        <div className="text-xs text-gray-500">
          {credits > 0 ? `${credits} messages left` : 'Daily limit reached'}
        </div>
        {credits <= 0 && timeLeft && (
          <div className="mt-2 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
            Resets in {timeLeft}
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
