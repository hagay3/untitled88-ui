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
  onAlignmentChange
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
    console.log('🖼️ Image uploaded successfully, updating block and syncing with server...', imageUrl);
    
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
    console.warn(`Failed to load image: ${block.content.imageUrl}`);
  };

  const cssStyles = blockStylesToCss(block.styles);
  
  // Get alignment from styles or default to center
  const textAlignment = block.styles.textAlign || 'center';
  const alignmentClass = textAlignment === 'left' ? 'text-left' : 
                        textAlignment === 'right' ? 'text-right' : 'text-center';

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
  console.log(`🖼️ [ImageBlockComponent] Rendering image with alignment:`, {
    blockId: block.id,
    textAlignment,
    alignmentClass,
    imageAlignmentClass: getImageAlignmentClass(),
    hasStyles: !!block.styles,
    hasLinkUrl: !!block.content.linkUrl
  });

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
