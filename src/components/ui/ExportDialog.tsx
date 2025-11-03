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
}

interface ExportOptions {
  format: 'html' | 'html-with-metadata';
  includeStyles: boolean;
  filename: string;
}

export default function ExportDialog({ isOpen, onClose, onExport, email }: ExportDialogProps) {
  const [options, setOptions] = useState<ExportOptions>({
    format: 'html',
    includeStyles: true,
    filename: email?.subject ? 
      email.subject.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-').toLowerCase() : 
      'email-template'
  });

  const handleExport = () => {
    onExport(options);
    onClose();
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
            {/* Filename */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filename
              </label>
              <input
                type="text"
                value={options.filename}
                onChange={(e) => setOptions(prev => ({ ...prev, filename: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="email-template"
              />
              <p className="text-xs text-gray-500 mt-1">
                File will be saved as {options.filename}.html
              </p>
            </div>

            {/* Format Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Export Format
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="format"
                    value="html"
                    checked={options.format === 'html'}
                    onChange={(e) => setOptions(prev => ({ ...prev, format: e.target.value as 'html' }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">HTML only</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="format"
                    value="html-with-metadata"
                    checked={options.format === 'html-with-metadata'}
                    onChange={(e) => setOptions(prev => ({ ...prev, format: e.target.value as 'html-with-metadata' }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">HTML + Metadata (JSON)</span>
                </label>
              </div>
            </div>

            {/* Style Options */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.includeStyles}
                  onChange={(e) => setOptions(prev => ({ ...prev, includeStyles: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Include email client compatibility styles</span>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Recommended for better email client support
              </p>
            </div>

            {/* Email Preview Info */}
            {email && (
              <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Email Details</h4>
                <div className="space-y-1 text-xs text-gray-600">
                  <div><strong>Subject:</strong> {email.subject || 'Untitled Email'}</div>
                  <div><strong>Size:</strong> {email.estimatedSize || 'Unknown'}</div>
                  <div><strong>Mobile Optimized:</strong> {email.mobileOptimized ? 'Yes' : 'No'}</div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-6">
            <Button
              variant="outline"
              onClick={onClose}
              className="btn-ghost"
            >
              Cancel
            </Button>
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
  );
}
