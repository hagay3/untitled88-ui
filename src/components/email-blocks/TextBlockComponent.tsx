/**
 * Text Block Component
 * Handles plain text with optional inline links
 */

import React, { useState, useRef, useEffect } from 'react';
import { TextBlock } from '@/types/EmailBlock';
import { BaseEmailBlockProps, EmailBlockWrapper, blockStylesToCss } from './BaseEmailBlock';

interface TextBlockComponentProps extends BaseEmailBlockProps {
  block: TextBlock;
  onEditingEnd?: () => void;
}

export const TextBlockComponent: React.FC<TextBlockComponentProps> = ({
  block,
  isSelected = false,
  isEditing = false,
  onSelect,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  onEditingEnd,
  onAlignmentChange
}) => {
  const [editingText, setEditingText] = useState(block.content.text);
  const [editingLinkText, setEditingLinkText] = useState(block.content.linkText || '');
  const [editingLinkUrl, setEditingLinkUrl] = useState(block.content.linkUrl || '');
  const [showLinkEditor, setShowLinkEditor] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus when editing starts
  useEffect(() => {
    if (isEditing && textRef.current) {
      textRef.current.focus();
      // Set cursor to end of text
      const length = textRef.current.value.length;
      textRef.current.setSelectionRange(length, length);
    }
  }, [isEditing]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditingText(e.target.value);
  };

  const handleTextBlur = () => {
    if (editingText !== block.content.text) {
      onUpdate?.(block.id, {
        ...block,
        content: {
          ...block.content,
          text: editingText
        }
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleTextBlur();
      onEditingEnd?.();
    } else if (e.key === 'Escape') {
      setEditingText(block.content.text);
      onEditingEnd?.();
    }
  };

  const handleLinkSave = () => {
    onUpdate?.(block.id, {
      ...block,
      content: {
        ...block.content,
        linkText: editingLinkText || undefined,
        linkUrl: editingLinkUrl || undefined
      }
    });
    setShowLinkEditor(false);
  };

  const handleLinkRemove = () => {
    onUpdate?.(block.id, {
      ...block,
      content: {
        ...block.content,
        linkText: undefined,
        linkUrl: undefined
      }
    });
    setEditingLinkText('');
    setEditingLinkUrl('');
    setShowLinkEditor(false);
  };

  const renderTextWithLink = () => {
    const { text, linkText, linkUrl } = block.content;
    
    if (!linkText || !linkUrl) {
      return text;
    }

    // Simple replacement - in production you might want more sophisticated text processing
    const parts = text.split(linkText);
    if (parts.length === 1) {
      return text; // Link text not found in main text
    }

    return (
      <>
        {parts[0]}
        <a 
          href={linkUrl} 
          className="text-blue-600 underline hover:text-blue-800"
          onClick={(e) => e.preventDefault()} // Prevent navigation in editor
        >
          {linkText}
        </a>
        {parts.slice(1).join(linkText)}
      </>
    );
  };

  const cssStyles = blockStylesToCss(block.styles);
  
  // Get alignment from styles or default to left
  const textAlignment = block.styles.textAlign || 'left';

  return (
    <EmailBlockWrapper
      block={block}
      isSelected={isSelected}
      onSelect={onSelect}
    >
      <div className="relative">
        {isEditing ? (
          <textarea
            ref={textRef}
            value={editingText}
            onChange={handleTextChange}
            onBlur={handleTextBlur}
            onKeyDown={handleKeyDown}
            className="w-full min-h-[1.5em] p-2 border-2 border-blue-300 rounded resize-none outline-none"
            style={{
              fontFamily: cssStyles.fontFamily,
              fontSize: cssStyles.fontSize,
              color: cssStyles.color,
              textAlign: cssStyles.textAlign as any,
              backgroundColor: 'white'
            }}
            autoFocus
          />
        ) : (
          <div
            className="cursor-text p-2 min-h-[1.5em]"
            style={cssStyles}
            onClick={() => onSelect?.(block.id)}
          >
            {renderTextWithLink()}
          </div>
        )}

        {/* Inline toolbar for text editing */}
        {isSelected && (
          <div className="absolute -top-12 left-0 flex items-center space-x-1 bg-white border border-gray-200 rounded-lg shadow-lg px-2 py-1 z-50">
            <button
              onClick={() => setShowLinkEditor(!showLinkEditor)}
              className={`p-1 rounded ${
                block.content.linkText 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Add/Edit Link"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </button>

            {onMoveUp && (
              <button
                onClick={() => onMoveUp(block.id)}
                disabled={!canMoveUp}
                className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                title="Move up"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
            )}

            {onMoveDown && (
              <button
                onClick={() => onMoveDown(block.id)}
                disabled={!canMoveDown}
                className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                title="Move down"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}

            {/* Alignment Controls */}
            {onAlignmentChange && (
              <>
                <div className="w-px h-4 bg-gray-300 mx-1" />
                
                <button
                  onClick={() => onAlignmentChange(block.id, 'left')}
                  className={`p-1 ${textAlignment === 'left' ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'}`}
                  title="Align left"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
                  </svg>
                </button>
                
                <button
                  onClick={() => onAlignmentChange(block.id, 'center')}
                  className={`p-1 ${textAlignment === 'center' ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'}`}
                  title="Align center"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M8 12h8M6 18h12" />
                  </svg>
                </button>
                
                <button
                  onClick={() => onAlignmentChange(block.id, 'right')}
                  className={`p-1 ${textAlignment === 'right' ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'}`}
                  title="Align right"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M12 12h8M10 18h10" />
                  </svg>
                </button>
              </>
            )}

            <div className="w-px h-4 bg-gray-300 mx-1" />

            <button
              onClick={() => onDelete?.(block.id)}
              className="p-1 text-red-500 hover:text-red-700"
              title="Delete"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}

        {/* Link editor popup */}
        {showLinkEditor && (
          <div className="absolute top-full left-0 mt-2 p-4 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[300px]">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link Text
                </label>
                <input
                  type="text"
                  value={editingLinkText}
                  onChange={(e) => setEditingLinkText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Text to make clickable"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL
                </label>
                <input
                  type="url"
                  value={editingLinkUrl}
                  onChange={(e) => setEditingLinkUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com"
                />
              </div>
              <div className="flex justify-between">
                <div className="space-x-2">
                  <button
                    onClick={handleLinkSave}
                    className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setShowLinkEditor(false)}
                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm"
                  >
                    Cancel
                  </button>
                </div>
                {block.content.linkText && (
                  <button
                    onClick={handleLinkRemove}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm"
                  >
                    Remove Link
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </EmailBlockWrapper>
  );
};
