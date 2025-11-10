/**
 * Image Block Component
 * Handles image display with action toolbar
 */

import React, { useState } from 'react';
import { ImageBlock } from '@/types/EmailBlock';
import { BaseEmailBlockProps, EmailBlockWrapper, blockStylesToCss } from './BaseEmailBlock';
import ImageUploadDialog from '@/components/ui/ImageUploadDialog';

interface ImageBlockComponentProps extends BaseEmailBlockProps {
  block: ImageBlock;
  availableLogos?: Array<{
    url: string;
    thumbnail_url: string;
    width?: number;
    height?: number;
    size: number;
    format: string;
    index: number;
    original_filename: string;
    source_url?: string;
  }>;
}

export const ImageBlockComponent: React.FC<ImageBlockComponentProps> = ({
  block,
  isSelected = false,
  onSelect,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  onAlignmentChange,
  availableLogos = []
}) => {
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [editingImageUrl, setEditingImageUrl] = useState(block.content.imageUrl);
  const [editingImageAlt, setEditingImageAlt] = useState(block.content.imageAlt);
  const [editingLinkUrl, setEditingLinkUrl] = useState(block.content.linkUrl || '');

  const handleImageSave = () => {
    onUpdate?.(block.id, {
      ...block,
      content: {
        ...block.content,
        imageUrl: editingImageUrl,
        imageAlt: editingImageAlt,
        linkUrl: editingLinkUrl || undefined
      }
    });
    setShowImageEditor(false);
  };

  const handleImageUploaded = (imageUrl: string) => {
    setEditingImageUrl(imageUrl);
    
    // Auto-save the uploaded image and trigger HTML regeneration + server sync
    onUpdate?.(block.id, {
      ...block,
      content: {
        ...block.content,
        imageUrl: imageUrl,
        imageAlt: editingImageAlt,
        linkUrl: editingLinkUrl || undefined
      }
    });
    setShowUploadDialog(false);
  };

  const handleImageError = () => {
    // Could show a placeholder or error state
  };

  const cssStyles = blockStylesToCss(block.styles);
  
  // Get alignment from styles or default to center
  const textAlignment = block.styles.textAlign || 'center';

  // Get image-specific alignment classes
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

  // Debug: Log image alignment rendering

  const imageElement = (
    <img
      src={block.content.imageUrl}
      alt={block.content.imageAlt}
      width={block.content.imageWidth}
      height={block.content.imageHeight}
      onError={handleImageError}
      className="max-w-full h-auto block"
      style={cssStyles}
    />
  );

  const content = block.content.linkUrl ? (
    <a 
      href={block.content.linkUrl}
      onClick={(e) => e.preventDefault()} // Prevent navigation in editor
      className={`block ${getImageAlignmentClass()}`}
      style={{ display: 'block', width: 'fit-content' }}
    >
      {imageElement}
    </a>
  ) : (
    <div 
      className={`${getImageAlignmentClass()}`}
      style={{ display: 'block', width: 'fit-content' }}
    >
      {imageElement}
    </div>
  );

  const customActions = (
    <button
      onClick={() => setShowImageEditor(true)}
      className="p-1 text-gray-500 hover:text-gray-700"
      title="Edit image"
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
        <div className="p-2">
          {content}
        </div>

        {/* Image editor modal */}
        {showImageEditor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Edit Image</h3>
                <button
                  onClick={() => setShowImageEditor(false)}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image URL
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="url"
                      value={editingImageUrl}
                      onChange={(e) => setEditingImageUrl(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://example.com/image.jpg"
                    />
                    <button
                      onClick={() => setShowUploadDialog(true)}
                      className="btn-primary text-sm px-4 py-2 flex items-center space-x-2"
                      title="Upload new image"
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
                    placeholder="Describe the image"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Link URL (optional)
                  </label>
                  <input
                    type="url"
                    value={editingLinkUrl}
                    onChange={(e) => setEditingLinkUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Make the image clickable
                  </p>
                </div>

                {/* Available Logo Options */}
                {availableLogos && availableLogos.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Available Logo Options ({availableLogos.length})
                    </label>
                    <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto border border-gray-200 rounded-md p-3 bg-gray-50">
                      {availableLogos.map((logo, index) => (
                        <button
                          key={`${logo.url}-${index}`}
                          onClick={() => setEditingImageUrl(logo.url)}
                          className={`relative group border-2 rounded-md p-2 transition-all hover:border-blue-500 ${
                            editingImageUrl === logo.url ? 'border-blue-600 bg-blue-50' : 'border-gray-300 bg-white'
                          }`}
                          title={`${logo.original_filename} - ${logo.format} (${(logo.size / 1024).toFixed(1)}KB)`}
                        >
                          <div className="aspect-square relative overflow-hidden rounded bg-white flex items-center justify-center">
                            <img
                              src={logo.thumbnail_url || logo.url}
                              alt={`Logo option ${index + 1}`}
                              className="max-w-full max-h-full object-contain"
                              onError={(e) => {
                                // Fallback to placeholder on error
                                e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"%3E%3Cpath strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/%3E%3C/svg%3E';
                              }}
                            />
                          </div>
                          <div className="mt-1 text-xs text-center text-gray-600 truncate">
                            {logo.format} - {(logo.size / 1024).toFixed(0)}KB
                          </div>
                          {editingImageUrl === logo.url && (
                            <div className="absolute top-1 right-1 bg-blue-600 text-white rounded-full p-0.5">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Click on a logo to select it
                    </p>
                  </div>
                )}

                {/* Preview */}
                {editingImageUrl && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preview
                    </label>
                    <div className="border border-gray-200 rounded-md p-2 bg-gray-50">
                      <img
                        src={editingImageUrl}
                        alt={editingImageAlt}
                        className="max-w-full h-auto max-h-32 mx-auto"
                        onError={() => {
                          // Show error state in preview
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowImageEditor(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImageSave}
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
