/**
 * My Emails Sidebar Component
 * Displays all generated emails with subject, date, and header image
 */

import React from 'react';
import { emailConverter } from '@/utils/EmailConverter';

interface EmailHistoryItem {
  type: string;
  content: string;
  timestamp: Date;
  emailData?: {
    subject?: string;
    email_subject?: string;
    message_subject?: string;
    html?: string;
    email_html?: string;
    updated_email_html?: string;
    email_json?: any;
    message_id?: string;
  };
}

interface MyEmailsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  emailHistory: EmailHistoryItem[];
  onEmailSelect: (emailData: any) => void;
  currentEmailId?: string;
}

const MyEmailsSidebar: React.FC<MyEmailsSidebarProps> = ({
  isOpen,
  onClose,
  emailHistory,
  onEmailSelect,
  currentEmailId
}) => {
  // Filter only email messages and sort by timestamp (newest first)
  const emailMessages = emailHistory
    .filter(msg => msg.type === 'email' && msg.emailData)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const extractHeaderImage = (emailData: any): string | null => {
    try {
      // Try to get from JSON structure first
      if (emailData.email_json?.blocks) {
        const headerBlock = emailData.email_json.blocks.find((block: any) => 
          block.blockType === 'header' || block.blockType === 'hero'
        );
        if (headerBlock?.content?.imageUrl) {
          return headerBlock.content.imageUrl;
        }
        
        // Look for any image block
        const imageBlock = emailData.email_json.blocks.find((block: any) => 
          block.blockType === 'image'
        );
        if (imageBlock?.content?.imageUrl) {
          return imageBlock.content.imageUrl;
        }
      }

      // Fallback: try to extract from HTML
      const html = emailData.html || emailData.email_html || emailData.updated_email_html || '';
      if (html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const firstImg = doc.querySelector('img');
        if (firstImg?.src) {
          return firstImg.src;
        }
      }
    } catch (error) {
      console.warn('Failed to extract header image:', error);
    }
    return null;
  };

  const getEmailSubject = (emailData: any): string => {
    return emailData.subject || 
           emailData.email_subject || 
           emailData.message_subject || 
           'Untitled Email';
  };

  const formatDate = (timestamp: Date): string => {
    const now = new Date();
    const diffInHours = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return timestamp.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: timestamp.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const handleEmailClick = (emailData: any) => {
    // Ensure we have HTML content
    let emailHtml = emailData.html || emailData.email_html || emailData.updated_email_html;
    
    // If no HTML but we have JSON, convert it
    if (!emailHtml && emailData.email_json) {
      try {
        emailHtml = emailConverter.jsonToHtml(emailData.email_json);
      } catch (error) {
        console.warn('Failed to convert JSON to HTML:', error);
      }
    }

    onEmailSelect({
      ...emailData,
      html: emailHtml
    });
    // Don't close the sidebar when selecting an email
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            My Emails
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-200 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Email List */}
        <div className="flex-1 overflow-y-auto">
          {emailMessages.length === 0 ? (
            <div className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Emails Yet</h3>
              <p className="text-gray-500 text-sm">
                Start creating emails with AI to see them here.
              </p>
            </div>
          ) : (
            <div className="p-2">
              {emailMessages.map((message, index) => {
                const emailData = message.emailData!;
                const subject = getEmailSubject(emailData);
                const headerImage = extractHeaderImage(emailData);
                const isSelected = currentEmailId === emailData.message_id;

                return (
                  <div
                    key={`${emailData.message_id || index}-${message.timestamp.getTime()}`}
                    onClick={() => handleEmailClick(emailData)}
                    className={`p-3 rounded-lg cursor-pointer transition-all duration-200 mb-2 border ${
                      isSelected 
                        ? 'bg-blue-50 border-blue-200 shadow-sm' 
                        : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    {/* Header Image */}
                    {headerImage && (
                      <div className="mb-3 rounded-md overflow-hidden">
                        <img
                          src={headerImage}
                          alt="Email header"
                          className="w-full h-20 object-cover"
                          onError={(e) => {
                            // Hide image if it fails to load
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    {/* Email Info */}
                    <div className="space-y-2">
                      <h3 className={`font-medium text-sm line-clamp-2 ${
                        isSelected ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {subject}
                      </h3>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{formatDate(message.timestamp)}</span>
                        {isSelected && (
                          <div className="flex items-center text-blue-600">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span>Current</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            {emailMessages.length} email{emailMessages.length !== 1 ? 's' : ''} generated
          </p>
        </div>
      </div>
    </>
  );
};

export default MyEmailsSidebar;
