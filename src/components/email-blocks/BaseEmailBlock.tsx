/**
 * Base Email Block Component
 * Common functionality for all email block types
 */

import { EmailBlock, BlockStyles, SIZE_MAPPINGS, SizeOption } from '@/types/EmailBlock';
import type { ReactNode, CSSProperties, MouseEvent, FC } from 'react';

export interface BaseEmailBlockProps {
  block: EmailBlock;
  isSelected?: boolean;
  isEditing?: boolean;
  onSelect?: (blockId: string) => void;
  onUpdate?: (blockId: string, updates: Partial<EmailBlock>) => void;
  onDelete?: (blockId: string) => void;
  onClone?: (blockId: string) => void;
  onMoveUp?: (blockId: string) => void;
  onMoveDown?: (blockId: string) => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onAlignmentChange?: (blockId: string, alignment: 'left' | 'center' | 'right') => void;
}

export interface BlockActionToolbarProps {
  blockId: string;
  onDelete: (blockId: string) => void;
  onClone?: (blockId: string) => void;
  onMoveUp?: (blockId: string) => void;
  onMoveDown?: (blockId: string) => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  customActions?: ReactNode;
  onAlignmentChange?: (blockId: string, alignment: 'left' | 'center' | 'right') => void;
  currentAlignment?: 'left' | 'center' | 'right';
}

// Convert BlockStyles to CSS styles
export const blockStylesToCss = (styles: BlockStyles): CSSProperties => {
  const cssStyles: CSSProperties = {};

  // Convert size options to actual values
  if (styles.padding) {
    cssStyles.padding = SIZE_MAPPINGS.padding[styles.padding];
  }
  if (styles.margin) {
    cssStyles.margin = SIZE_MAPPINGS.margin[styles.margin];
  }
  if (styles.fontSize) {
    cssStyles.fontSize = SIZE_MAPPINGS.fontSize[styles.fontSize];
  }
  if (styles.lineHeight) {
    cssStyles.lineHeight = SIZE_MAPPINGS.lineHeight[styles.lineHeight];
  }
  if (styles.borderWidth) {
    cssStyles.borderWidth = SIZE_MAPPINGS.borderWidth[styles.borderWidth];
  }
  if (styles.borderRadius) {
    cssStyles.borderRadius = SIZE_MAPPINGS.borderRadius[styles.borderRadius];
  }
  if (styles.width) {
    if (styles.width === 'auto' || styles.width === '100%') {
      cssStyles.width = styles.width;
    } else {
      cssStyles.width = SIZE_MAPPINGS.width[styles.width as SizeOption];
    }
  }
  if (styles.height) {
    if (styles.height === 'auto') {
      cssStyles.height = styles.height;
    } else {
      cssStyles.height = SIZE_MAPPINGS.height[styles.height as SizeOption];
    }
  }

  // Direct style mappings
  if (styles.textColor) cssStyles.color = styles.textColor;
  if (styles.borderColor) cssStyles.borderColor = styles.borderColor;
  if (styles.fontFamily) cssStyles.fontFamily = styles.fontFamily;
  if (styles.fontWeight) cssStyles.fontWeight = styles.fontWeight;
  if (styles.textAlign) cssStyles.textAlign = styles.textAlign;
  if (styles.borderStyle) cssStyles.borderStyle = styles.borderStyle;
  if (styles.textDecoration) cssStyles.textDecoration = styles.textDecoration;

  return cssStyles;
};

// Action toolbar for non-text blocks
export const BlockActionToolbar: FC<BlockActionToolbarProps> = ({
  blockId,
  onDelete,
  onClone,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
  customActions,
  onAlignmentChange,
  currentAlignment = 'left'
}) => {
  return (
    <div className="absolute -top-10 left-0 flex items-center space-x-1 bg-white border border-gray-200 rounded-lg shadow-lg px-2 py-1 z-50">
      {onMoveUp && (
        <button
          onClick={() => onMoveUp(blockId)}
          disabled={!canMoveUp}
          className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Move up"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}
      
      {onMoveDown && (
        <button
          onClick={() => onMoveDown(blockId)}
          disabled={!canMoveDown}
          className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Move down"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}
      
      {customActions}
      
      {/* Alignment Controls */}
      {onAlignmentChange && (
        <>
          <div className="w-px h-4 bg-gray-300 mx-1" />
          
          <button
            onClick={() => onAlignmentChange(blockId, 'left')}
            className={`p-1 ${currentAlignment === 'left' ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'}`}
            title="Align left"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
          </button>
          
          <button
            onClick={() => onAlignmentChange(blockId, 'center')}
            className={`p-1 ${currentAlignment === 'center' ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'}`}
            title="Align center"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M8 12h8M6 18h12" />
            </svg>
          </button>
          
          <button
            onClick={() => onAlignmentChange(blockId, 'right')}
            className={`p-1 ${currentAlignment === 'right' ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'}`}
            title="Align right"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M12 12h8M10 18h10" />
            </svg>
          </button>
        </>
      )}
      
      <div className="w-px h-4 bg-gray-300 mx-1" />
      
      {onClone && (
        <button
          onClick={() => onClone(blockId)}
          className="p-1 text-blue-500 hover:text-blue-700"
          title="Clone this block (duplicate with same content and styles)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
      )}
      
      <button
        onClick={() => onDelete(blockId)}
        className="p-1 text-red-500 hover:text-red-700"
        title="Delete block"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
};

// Base wrapper for all email blocks
export const EmailBlockWrapper: React.FC<{
  block: EmailBlock;
  isSelected?: boolean;
  onSelect?: (blockId: string) => void;
  children: ReactNode;
  showToolbar?: boolean;
  toolbarProps?: Omit<BlockActionToolbarProps, 'blockId'>;
}> = ({
  block,
  isSelected = false,
  onSelect,
  children,
  showToolbar = false,
  toolbarProps
}) => {
  const handleClick = (e: MouseEvent) => {
    e.stopPropagation();
    onSelect?.(block.id);
  };

  return (
    <div
      className={`relative group transition-all duration-200 ${
        isSelected 
          ? 'ring-2 ring-blue-500 ring-offset-2' 
          : 'hover:ring-1 hover:ring-gray-300 hover:ring-offset-1'
      }`}
      onClick={handleClick}
      data-block-id={block.id}
      data-block-type={block.blockType}
    >
      {children}
      
      {/* Show toolbar on selection for non-text blocks */}
      {isSelected && showToolbar && toolbarProps && (
        <BlockActionToolbar
          blockId={block.id}
          {...toolbarProps}
        />
      )}
    </div>
  );
};
