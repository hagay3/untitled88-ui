/**
 * Export Dialog Component
 * Provides options for exporting email templates
 */

import { useState } from 'react';
import { Button } from './button';
import { apiClient } from '@/utils/apiClient';
import { sendError } from '@/utils/actions';

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
  const [options, _setOptions] = useState<ExportOptions>({
    filename: email?.subject ? 
      email.subject.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-').toLowerCase() : 
      'email-template'
  });
  
  const [copyJsonSuccess, setCopyJsonSuccess] = useState(false);
  const [isCreatingShareLink, setIsCreatingShareLink] = useState(false);

  const handleExport = () => {
    onExport(options);
    onClose();
  };

  const handlePreviewInNewWindow = async () => {
    if (!getHtmlContent || !email) {
      return;
    }

    try {
      setIsCreatingShareLink(true);
      
      // Get the current email data
      const emailHtml = getHtmlContent();
      const emailJson = email.email_json || {};
      const emailSubject = email.subject || 'Untitled Email';
      
      if (!emailHtml) {
        return;
      }

      // Create a share link using the same API as ShareDialog
      const response = await apiClient.fetchWithAuth('share/create', {
        method: 'POST',
        body: JSON.stringify({
          email_html: emailHtml,
          email_json: emailJson,
          email_subject: emailSubject,
        }),
      });

      if (!response.ok) {
        sendError("unknown", "Failed to create share link", response.statusText);
        return;
      }

      const data = await response.json();
      
      
      if (data.success) {
        // Get the relative path from response and add current host/port prefix
        let shareableUrl = null;
        
        if (data.shareable_link) {
          // Add current host and port to the relative path
          const baseUrl = window.location.origin; // Gets http://localhost:3000 or production domain
          shareableUrl = `${baseUrl}${data.shareable_link}`;
        } else if (data.shareable_id) {
          // Fallback: construct from shareable_id
          const baseUrl = window.location.origin;
          shareableUrl = `${baseUrl}/share/${data.shareable_id}`;
        }
                
        if (shareableUrl) {
          // Open the share link in a new tab
          window.open(shareableUrl, '_blank');
        } else {
          //
        }
      } else {
        sendError("unknown", "Failed to create share link", data);
      }
    } catch (error) {
      sendError("unknown", "Failed to create share link", error);
    } finally {
      setIsCreatingShareLink(false);
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
      sendError("unknown", "Failed to copy JSON", error);
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
                  disabled={isCreatingShareLink}
                  className="btn-ghost flex items-center"
                >
                  {isCreatingShareLink ? (
                    <>
                      <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Preview in New Window
                    </>
                  )}
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
