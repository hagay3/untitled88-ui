/**
 * Left Chat Panel Component (25% width)
 * Contains credits display, countdown timer, chat history, and message input
 */

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

interface ChatPanelProps {
  credits: number;
  resetTime: Date | null;
  onSendMessage: (message: string) => void;
  isGenerating: boolean;
  generationProgress: string;
  initialPrompt?: string;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  lastMessage: Date;
  messageCount: number;
}

export default function ChatPanel({
  credits,
  resetTime,
  onSendMessage,
  isGenerating,
  generationProgress,
  initialPrompt
}: ChatPanelProps) {
  const [message, setMessage] = useState('');
  const [conversations] = useState<Conversation[]>([
    {
      id: '1',
      title: 'Welcome Email Campaign',
      lastMessage: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
      messageCount: 5
    },
    {
      id: '2',
      title: 'Product Launch Newsletter',
      lastMessage: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      messageCount: 8
    },
    {
      id: '3',
      title: 'Monthly Update Template',
      lastMessage: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      messageCount: 3
    }
  ]);
  const [currentMessages, setCurrentMessages] = useState<ChatMessage[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState('');
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
      setTimeLeft(`${hours}h ${minutes}m`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [resetTime]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages, generationProgress]);

  const handleSend = async () => {
    if (!message.trim() || isGenerating || credits <= 0) return;

    // Don't add user message to chat - just send to parent component
    try {
      await onSendMessage(message.trim());
    } catch (error: any) {
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'system',
        content: `Error: ${error.message || 'Failed to generate email. Please try again.'}`,
        timestamp: new Date()
      };
      setCurrentMessages(prev => [...prev, errorMessage]);
    }
    
    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Credits Section */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Credits</span>
          <span className="text-lg font-bold text-blue-600">{credits}</span>
        </div>
        <div className="text-xs text-gray-500">
          {credits > 0 ? `${credits} messages left` : 'No credits remaining'}
        </div>
        {credits <= 0 && timeLeft && (
          <div className="mt-2 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
            Resets in {timeLeft}
          </div>
        )}
      </div>

      {/* Conversation History */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="p-3 bg-white border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Recent Conversations</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setActiveConversation(conv.id)}
                className={`w-full text-left p-2 rounded-lg text-xs transition-colors ${
                  activeConversation === conv.id
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="font-medium text-gray-900 truncate">{conv.title}</div>
                <div className="text-gray-500 flex justify-between mt-1">
                  <span>{conv.messageCount} messages</span>
                  <span>{formatTime(conv.lastMessage)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Current Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {currentMessages.length === 0 && !generationProgress && (
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
                    ? 'bg-red-50 border border-red-200 text-red-800'
                    : 'bg-white border border-gray-200 text-gray-900'
                }`}
              >
                {msg.type === 'system' && (
                  <div className="flex items-center mb-1">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium text-xs">System</span>
                  </div>
                )}
                {msg.content}
              </div>
            </div>
          ))}

          {generationProgress && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 p-3 rounded-lg text-sm text-gray-700">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>{generationProgress}</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex space-x-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={credits > 0 ? "Describe your email idea..." : "No credits remaining"}
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
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </Button>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Press Enter to send • Shift + Enter for new line
        </div>
      </div>
    </div>
  );
}
