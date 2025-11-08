/**
 * Export Dialog Component
 * Provides options for exporting email templates
 */

import { useState } from 'react';
import { Button } from './button';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => void;
  email: any;
  getHtmlContent?: () => string; // Function to get current HTML content
}

interface ExportOptions {
  filename: string;
}

export default function ExportDialog({ isOpen, onClose, onExport, email, getHtmlContent }: ExportDialogProps) {
  const [options, setOptions] = useState<ExportOptions>({
    filename: email?.subject ? 
      email.subject.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-').toLowerCase() : 
      'email-template'
  });
  
  const [copyJsonSuccess, setCopyJsonSuccess] = useState(false);

  const handleExport = () => {
    onExport(options);
    onClose();
  };

  const handlePreviewInNewWindow = () => {
    if (!getHtmlContent) {
      return;
    }

    try {
      // Get the current HTML content
      const htmlContent = getHtmlContent();
      
      if (!htmlContent) {
        return;
      }

      // Create a new window and write the HTML content
      const previewWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
      
      if (previewWindow) {
        previewWindow.document.write(htmlContent);
        previewWindow.document.close();
        previewWindow.focus();
      } else {
      }
    } catch (error) {
    }
  };

  const handleCopyJson = async () => {
    if (!email?.email_json) {
      return;
    }

    try {
      // Get the JSON content
      let jsonContent = email.email_json;
      
      // If it's already a string, use it as is, otherwise stringify it
      if (typeof jsonContent === 'object') {
        jsonContent = JSON.stringify(jsonContent, null, 2);
      }
      
      // Copy to clipboard
      await navigator.clipboard.writeText(jsonContent);
      setCopyJsonSuccess(true);
      setTimeout(() => setCopyJsonSuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy JSON:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Export Email</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
          


            {/* Email Preview Info */}
            {email && (
              <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Email Details</h4>
                <div className="space-y-1 text-xs text-gray-600">
                  <div><strong>Subject:</strong> {email.subject || 'Untitled Email'}</div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center mt-6">
            {/* Preview Button - Left side */}
            <div className="flex space-x-3">
              {getHtmlContent && (
                <Button
                  variant="outline"
                  onClick={handlePreviewInNewWindow}
                  className="btn-ghost flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Preview in New Window
                </Button>
              )}
              
              {/* Copy JSON Button */}
              {email?.email_json && (
                <Button
                  variant="outline"
                  onClick={handleCopyJson}
                  className={`btn-ghost flex items-center ${
                    copyJsonSuccess ? 'bg-green-100 text-green-700 border-green-300' : ''
                  }`}
                >
                  {copyJsonSuccess ? (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      JSON Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy JSON
                    </>
                  )}
                </Button>
              )}
            </div>
            
            {/* Export Button - Right side */}
            <div className="flex space-x-3">
              <Button
                onClick={handleExport}
                className="btn-primary"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
