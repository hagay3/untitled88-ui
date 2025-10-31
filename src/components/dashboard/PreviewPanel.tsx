/**
 * Right Preview Panel Component (75% width)
 * Contains email preview with desktop/mobile toggle and builder tools
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import EmailBuilder from './EmailBuilder';

interface PreviewPanelProps {
  email: any;
  viewMode: 'desktop' | 'mobile';
  onViewModeChange: (mode: 'desktop' | 'mobile') => void;
  isGenerating: boolean;
  generationProgress: string;
}

export default function PreviewPanel({
  email,
  viewMode,
  onViewModeChange,
  isGenerating,
  generationProgress
}: PreviewPanelProps) {
  const [showBuilder, setShowBuilder] = useState(false);

  const getPreviewStyles = () => {
    if (viewMode === 'mobile') {
      return {
        width: '375px',
        height: '667px',
        maxHeight: '80vh'
      };
    }
    return {
      width: '100%',
      height: '100%'
    };
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Preview Controls */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {email ? email.subject || 'Email Preview' : 'No Email Selected'}
            </h2>
            {email && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>•</span>
                <span>{email.features?.length || 0} features</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => onViewModeChange('desktop')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'desktop'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <svg className="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Desktop
              </button>
              <button
                onClick={() => onViewModeChange('mobile')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'mobile'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <svg className="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Mobile
              </button>
            </div>

            {/* Builder Toggle */}
            {email && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBuilder(!showBuilder)}
                className={showBuilder ? 'bg-blue-50 border-blue-200' : ''}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 011-1h1a2 2 0 100-4H7a1 1 0 01-1-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                </svg>
                {showBuilder ? 'Hide Builder' : 'Edit'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-hidden">
        {isGenerating ? (
          // Generation Progress
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Generating Your Email
              </h3>
              <p className="text-gray-600 mb-4">{generationProgress}</p>
              <div className="w-64 bg-gray-200 rounded-full h-2 mx-auto">
                <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: '60%' }}></div>
              </div>
            </div>
          </div>
        ) : email ? (
          <div className="h-full flex">
            {/* Email Preview */}
            <div className={`${showBuilder ? 'flex-1' : 'w-full'} flex items-center justify-center p-6 overflow-auto`}>
              <div
                className="bg-white shadow-lg rounded-lg overflow-hidden"
                style={getPreviewStyles()}
              >
                {viewMode === 'mobile' && (
                  // Mobile Chrome-like frame
                  <div className="bg-gray-800 px-4 py-2 flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="flex-1 bg-gray-700 rounded px-3 py-1 text-xs text-white">
                      Email Preview
                    </div>
                  </div>
                )}
                
                <div className="h-full overflow-auto">
                  <div
                    dangerouslySetInnerHTML={{ __html: email.html }}
                    className={viewMode === 'mobile' ? 'text-sm' : ''}
                  />
                </div>
              </div>
            </div>

            {/* Email Builder Sidebar */}
            {showBuilder && (
              <div className="w-80 border-l border-gray-200 bg-white">
                <EmailBuilder
                  email={email}
                  onEmailUpdate={(updatedEmail) => {
                    // Handle email updates
                    console.log('Email updated:', updatedEmail);
                  }}
                />
              </div>
            )}
          </div>
        ) : (
          // Empty State
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-6 text-gray-300">
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                No Email to Preview
              </h3>
              <p className="text-gray-600 mb-6 max-w-sm">
                Start a conversation in the chat panel to generate your first email design.
              </p>
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Desktop Preview
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Mobile Preview
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 011-1h1a2 2 0 100-4H7a1 1 0 01-1-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                  </svg>
                  Drag & Drop Editor
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
