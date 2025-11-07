/**
 * Hero Block Component
 * Handles hero sections with headline and subheadline text
 */

import React, { useState, useRef, useEffect } from 'react';
import { HeroBlock } from '@/types/EmailBlock';
import { BaseEmailBlockProps, EmailBlockWrapper, blockStylesToCss } from './BaseEmailBlock';

interface HeroBlockComponentProps extends BaseEmailBlockProps {
  block: HeroBlock;
  onEditingEnd?: () => void;
}

export const HeroBlockComponent: React.FC<HeroBlockComponentProps> = ({
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
  const [editingHeadline, setEditingHeadline] = useState(block.content.headline);
  const [editingSubheadline, setEditingSubheadline] = useState(block.content.subheadline || '');
  const [editingField, setEditingField] = useState<'headline' | 'subheadline' | null>(null);
  const headlineRef = useRef<HTMLTextAreaElement>(null);
  const subheadlineRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus when editing starts
  useEffect(() => {
    if (editingField === 'headline' && headlineRef.current) {
      headlineRef.current.focus();
      const length = headlineRef.current.value.length;
      headlineRef.current.setSelectionRange(length, length);
    } else if (editingField === 'subheadline' && subheadlineRef.current) {
      subheadlineRef.current.focus();
      const length = subheadlineRef.current.value.length;
      subheadlineRef.current.setSelectionRange(length, length);
    }
  }, [editingField]);

  const handleHeadlineChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditingHeadline(e.target.value);
  };

  const handleSubheadlineChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditingSubheadline(e.target.value);
  };

  const handleHeadlineBlur = () => {
    if (editingHeadline !== block.content.headline) {
      onUpdate?.(block.id, {
        ...block,
        content: {
          ...block.content,
          headline: editingHeadline
        }
      });
    }
    setEditingField(null);
  };

  const handleSubheadlineBlur = () => {
    if (editingSubheadline !== (block.content.subheadline || '')) {
      onUpdate?.(block.id, {
        ...block,
        content: {
          ...block.content,
          subheadline: editingSubheadline || undefined
        }
      });
    }
    setEditingField(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, field: 'headline' | 'subheadline') => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      if (field === 'headline') {
        handleHeadlineBlur();
      } else {
        handleSubheadlineBlur();
      }
      onEditingEnd?.();
    } else if (e.key === 'Escape') {
      if (field === 'headline') {
        setEditingHeadline(block.content.headline);
      } else {
        setEditingSubheadline(block.content.subheadline || '');
      }
      setEditingField(null);
      onEditingEnd?.();
    }
  };

  // Convert block styles to CSS
  const cssStyles = blockStylesToCss(block.styles);
  
  // Get alignment from styles or default to center
  const textAlignment = block.styles.textAlign || 'center';
  const alignmentClass = textAlignment === 'left' ? 'text-left' : 
                        textAlignment === 'right' ? 'text-right' : 'text-center';

  return (
    <EmailBlockWrapper
      block={block}
      isSelected={isSelected}
      onSelect={onSelect}
    >
      <div className={`relative ${alignmentClass}`} style={cssStyles}>
        {/* Headline */}
        <div className="mb-4">
          {isEditing && editingField === 'headline' ? (
            <textarea
              ref={headlineRef}
              value={editingHeadline}
              onChange={handleHeadlineChange}
              onBlur={handleHeadlineBlur}
              onKeyDown={(e) => handleKeyDown(e, 'headline')}
              className={`w-full min-h-[2em] p-2 border-2 border-blue-300 rounded resize-none outline-none ${alignmentClass} font-bold text-2xl`}
              style={{
                fontFamily: cssStyles.fontFamily,
                color: cssStyles.color,
                backgroundColor: 'white',
                textAlign: textAlignment
              }}
              placeholder="Enter headline..."
              autoFocus
            />
          ) : (
            <h1
              className="text-2xl font-bold cursor-text p-2 min-h-[2em] border-2 border-transparent hover:border-gray-200 rounded"
              style={{
                fontFamily: cssStyles.fontFamily,
                fontSize: '2rem',
                color: cssStyles.color,
                lineHeight: '1.2'
              }}
              onClick={() => {
                onSelect?.(block.id);
                setEditingField('headline');
              }}
            >
              {block.content.headline || 'Click to edit headline'}
            </h1>
          )}
        </div>

        {/* Subheadline */}
        <div>
          {isEditing && editingField === 'subheadline' ? (
            <textarea
              ref={subheadlineRef}
              value={editingSubheadline}
              onChange={handleSubheadlineChange}
              onBlur={handleSubheadlineBlur}
              onKeyDown={(e) => handleKeyDown(e, 'subheadline')}
              className={`w-full min-h-[1.5em] p-2 border-2 border-blue-300 rounded resize-none outline-none ${alignmentClass}`}
              style={{
                fontFamily: cssStyles.fontFamily,
                color: cssStyles.color,
                backgroundColor: 'white',
                textAlign: textAlignment
              }}
              placeholder="Enter subheadline (optional)..."
              autoFocus
            />
          ) : (
            <p
              className="text-lg cursor-text p-2 min-h-[1.5em] border-2 border-transparent hover:border-gray-200 rounded"
              style={{
                fontFamily: cssStyles.fontFamily,
                fontSize: '1.125rem',
                color: cssStyles.color,
                opacity: block.content.subheadline ? 1 : 0.5
              }}
              onClick={() => {
                onSelect?.(block.id);
                setEditingField('subheadline');
              }}
            >
              {block.content.subheadline || 'Click to add subheadline'}
            </p>
          )}
        </div>

        {/* Inline toolbar for hero editing */}
        {isSelected && (
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 flex items-center space-x-1 bg-white border border-gray-200 rounded-lg shadow-lg px-2 py-1 z-50">
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

            {onDelete && (
              <button
                onClick={() => onDelete(block.id)}
                className="p-1 text-red-500 hover:text-red-700"
                title="Delete block"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </EmailBlockWrapper>
  );
};
