/**
 * Template Gallery Component
 * Right-side panel overlay for template selection
 */

import { Button } from '@/components/ui/button';

interface TemplateGalleryProps {
  onClose: () => void;
  onSelectTemplate: (template: any) => void;
}

export default function TemplateGallery({ onClose }: TemplateGalleryProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1" onClick={onClose} />
      
      {/* Panel */}
      <div className="w-96 bg-white h-full shadow-2xl flex flex-col glass-card">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Template Gallery</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
        </div>

        {/* Coming Soon Content */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-400 mb-6">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-medium text-gray-900 mb-2">Coming Soon ...</h3>
            <p className="text-gray-600">
              Professional email templates are on their way
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
