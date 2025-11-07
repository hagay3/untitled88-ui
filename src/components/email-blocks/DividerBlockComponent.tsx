/**
 * Divider Block Component
 * Handles horizontal dividers/separators
 */

import React, { useState } from 'react';
import { DividerBlock } from '@/types/EmailBlock';
import { BaseEmailBlockProps, EmailBlockWrapper, blockStylesToCss } from './BaseEmailBlock';

interface DividerBlockComponentProps extends BaseEmailBlockProps {
  block: DividerBlock;
}

export const DividerBlockComponent: React.FC<DividerBlockComponentProps> = ({
  block,
  isSelected = false,
  onSelect,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown
}) => {
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Convert block styles to CSS
  const cssStyles = blockStylesToCss(block.styles);

  const handleDividerEdit = () => {
    setShowEditDialog(true);
  };

  return (
    <EmailBlockWrapper
      block={block}
      isSelected={isSelected}
      onSelect={onSelect}
    >
      <div className="relative py-4" style={cssStyles}>
        {/* Divider Line or Space */}
        {block.content.dividerType === 'line' ? (
          <hr
            className="border-0 cursor-pointer hover:opacity-75 transition-opacity"
            style={{
              height: `${block.content.thickness || 1}px`,
              backgroundColor: cssStyles.backgroundColor || '#e5e7eb',
              margin: '0 auto',
              width: '100%'
            }}
            onClick={() => onSelect?.(block.id)}
          />
        ) : (
          <div
            className="cursor-pointer"
            style={{
              height: `${block.content.height || 20}px`,
              width: '100%'
            }}
            onClick={() => onSelect?.(block.id)}
          />
        )}

        {/* Inline toolbar for divider editing */}
        {isSelected && (
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 flex items-center space-x-1 bg-white border border-gray-200 rounded-lg shadow-lg px-2 py-1 z-50">
            <button
              onClick={handleDividerEdit}
              className="p-1 text-gray-500 hover:text-gray-700"
              title="Edit divider"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
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

        {/* Edit Dialog (placeholder for now) */}
        {showEditDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Edit Divider</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Divider Type
                  </label>
                  <select
                    value={block.content.dividerType}
                    onChange={(e) => {
                      onUpdate?.(block.id, {
                        ...block,
                        content: {
                          ...block.content,
                          dividerType: e.target.value as 'line' | 'space'
                        }
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="line">Line</option>
                    <option value="space">Space</option>
                  </select>
                </div>

                {block.content.dividerType === 'line' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thickness (px)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={block.content.thickness || 1}
                      onChange={(e) => {
                        onUpdate?.(block.id, {
                          ...block,
                          content: {
                            ...block.content,
                            thickness: parseInt(e.target.value)
                          }
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Height (px)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="100"
                      value={block.content.height || 20}
                      onChange={(e) => {
                        onUpdate?.(block.id, {
                          ...block,
                          content: {
                            ...block.content,
                            height: parseInt(e.target.value)
                          }
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowEditDialog(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </EmailBlockWrapper>
  );
};
