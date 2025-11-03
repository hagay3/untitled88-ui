/**
 * Right Preview Panel Component (75% width)
 * Contains email preview with inline editing capabilities (always in edit mode)
 */

import EditablePreview from './EditablePreview';

interface PreviewPanelProps {
  email: any;
  viewMode: 'desktop' | 'mobile';
  onViewModeChange: (mode: 'desktop' | 'mobile') => void;
  isGenerating: boolean;
  generationProgress: string;
  generationType: 'create' | 'update';
  onEmailUpdate?: (updatedHtml: string) => void;
}

export default function PreviewPanel({
  email,
  viewMode,
  onViewModeChange,
  isGenerating,
  generationProgress,
  generationType,
  onEmailUpdate
}: PreviewPanelProps) {
  const handleEmailUpdate = async (updatedHtml: string) => {
    try {
      // Update the parent component with the new HTML
      if (onEmailUpdate) {
        onEmailUpdate(updatedHtml);
      }
    } catch (error) {
      console.error('Error updating email:', error);
    }
  };

  // For creating new emails, show full loading screen
  if (isGenerating && generationType === 'create') {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4">
            <div className="animate-spin w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Generating Your Email</h3>
          <p className="text-gray-600 mb-4">{generationProgress}</p>
          <div className="w-64 bg-gray-200 rounded-full h-2 mx-auto">
            <div className="bg-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: '60%' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <EditablePreview
      email={email}
      viewMode={viewMode}
      onViewModeChange={onViewModeChange}
      onEmailUpdate={handleEmailUpdate}
      isUpdating={isGenerating && generationType === 'update'}
      updateProgress={generationProgress}
    />
  );
}
