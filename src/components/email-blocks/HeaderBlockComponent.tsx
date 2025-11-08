/**
 * Header Block Component
 * Handles header with logo or text
 */

import React, { useState } from 'react';
import { HeaderBlock } from '@/types/EmailBlock';
import { BaseEmailBlockProps, EmailBlockWrapper, blockStylesToCss } from './BaseEmailBlock';
import ImageUploadDialog from '@/components/ui/ImageUploadDialog';

interface HeaderBlockComponentProps extends BaseEmailBlockProps {
  block: HeaderBlock;
}

export const HeaderBlockComponent: React.FC<HeaderBlockComponentProps> = ({
  block,
  isSelected = false,
  onSelect,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  onAlignmentChange
}) => {
  const [showHeaderEditor, setShowHeaderEditor] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [editingText, setEditingText] = useState(block.content.text || '');
  const [editingImageUrl, setEditingImageUrl] = useState(block.content.imageUrl || '');
  const [editingImageAlt, setEditingImageAlt] = useState(block.content.imageAlt || '');
  const [useImage, setUseImage] = useState(!!block.content.imageUrl);

  const handleHeaderSave = () => {
    onUpdate?.(block.id, {
      ...block,
      content: {
        text: useImage ? undefined : editingText,
        imageUrl: useImage ? editingImageUrl : undefined,
        imageAlt: useImage ? editingImageAlt : undefined,
        imageWidth: block.content.imageWidth,
        imageHeight: block.content.imageHeight
      }
    });
    setShowHeaderEditor(false);
  };

  const handleImageUploaded = (imageUrl: string) => {
    setEditingImageUrl(imageUrl);
    setUseImage(true);
    
    // Auto-save the uploaded image and trigger HTML regeneration + server sync
    onUpdate?.(block.id, {
      ...block,
      content: {
        text: undefined,
        imageUrl: imageUrl,
        imageAlt: editingImageAlt,
        imageWidth: block.content.imageWidth,
        imageHeight: block.content.imageHeight
      }
    });
    setShowUploadDialog(false);
  };

  const cssStyles = blockStylesToCss(block.styles);
  
  // Get alignment from styles or default to center
  const textAlignment = block.styles.textAlign || 'center';
  const alignmentClass = textAlignment === 'left' ? 'text-left' : 
                        textAlignment === 'right' ? 'text-right' : 'text-center';

  // Get image-specific alignment classes (same as ImageBlockComponent)
  const getImageAlignmentClass = () => {
    switch (textAlignment) {
      case 'left':
        return 'mr-auto'; // Push image to left
      case 'right':
        return 'ml-auto'; // Push image to right
      case 'center':
      default:
        return 'mx-auto'; // Center image
    }
  };

  // Debug: Log header alignment rendering

  const customActions = (
    <button
      onClick={() => setShowHeaderEditor(true)}
      className="p-1 text-gray-500 hover:text-gray-700"
      title="Edit header"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    </button>
  );

  return (
    <EmailBlockWrapper
      block={block}
      isSelected={isSelected}
      onSelect={onSelect}
      showToolbar={true}
      toolbarProps={{
        onDelete: onDelete!,
        onMoveUp,
        onMoveDown,
        canMoveUp,
        canMoveDown,
        customActions,
        onAlignmentChange,
        currentAlignment: textAlignment
      }}
    >
      <div className="relative">
        <div className="p-4" style={cssStyles}>
          {block.content.imageUrl ? (
            <div 
              className={`${getImageAlignmentClass()}`}
              style={{ display: 'block', width: 'fit-content' }}
            >
              <img
                src={block.content.imageUrl}
                alt={block.content.imageAlt}
                width={block.content.imageWidth}
                height={block.content.imageHeight}
                className="max-w-full h-auto block"
              />
            </div>
          ) : (
            <h1 className={`text-2xl font-bold ${alignmentClass}`}>
              {block.content.text || 'Company Name'}
            </h1>
          )}
        </div>

        {/* Header editor modal */}
        {showHeaderEditor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Edit Header</h3>
                <button
                  onClick={() => setShowHeaderEditor(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                  title="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Header Type
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={!useImage}
                        onChange={() => setUseImage(false)}
                        className="mr-2"
                      />
                      Text
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={useImage}
                        onChange={() => setUseImage(true)}
                        className="mr-2"
                      />
                      Logo Image
                    </label>
                  </div>
                </div>

                {!useImage ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Your Company Name"
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Logo URL
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="url"
                          value={editingImageUrl}
                          onChange={(e) => setEditingImageUrl(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="https://example.com/logo.png"
                        />
                        <button
                          onClick={() => setShowUploadDialog(true)}
                          className="btn-primary text-sm px-4 py-2 flex items-center space-x-2"
                          title="Upload logo"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <span>Upload</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Alt Text
                      </label>
                      <input
                        type="text"
                        value={editingImageAlt}
                        onChange={(e) => setEditingImageAlt(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Company logo"
                      />
                    </div>
                  </>
                )}

                {/* Preview */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preview
                  </label>
                  <div className="border border-gray-200 rounded-md p-4 bg-gray-50 text-center">
                    {useImage && editingImageUrl ? (
                      <img
                        src={editingImageUrl}
                        alt={editingImageAlt}
                        className="max-w-full h-auto max-h-16 mx-auto"
                      />
                    ) : (
                      <h1 className="text-xl font-bold">
                        {editingText || 'Company Name'}
                      </h1>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowHeaderEditor(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleHeaderSave}
                  className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Image Upload Dialog */}
      <ImageUploadDialog
        isOpen={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        onImageUploaded={handleImageUploaded}
        title="Upload Image"
      />
    </EmailBlockWrapper>
  );
};
