/**
 * Button Block Component
 * Handles button display with action toolbar
 */

import React, { useState } from 'react';
import { ButtonBlock } from '@/types/EmailBlock';
import { BaseEmailBlockProps, EmailBlockWrapper, blockStylesToCss } from './BaseEmailBlock';

interface ButtonBlockComponentProps extends BaseEmailBlockProps {
  block: ButtonBlock;
}

export const ButtonBlockComponent: React.FC<ButtonBlockComponentProps> = ({
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
  const [showButtonEditor, setShowButtonEditor] = useState(false);
  const [editingText, setEditingText] = useState(block.content.text);
  const [editingUrl, setEditingUrl] = useState(block.content.url);
  const [editingStyle, setEditingStyle] = useState(block.content.buttonStyle || 'primary');
  const [editingBackgroundColor, setEditingBackgroundColor] = useState(block.content.backgroundColor || '');

  const handleButtonSave = () => {
    onUpdate?.(block.id, {
      ...block,
      content: {
        ...block.content,
        text: editingText,
        url: editingUrl,
        buttonStyle: editingStyle,
        backgroundColor: editingBackgroundColor || undefined
      }
    });
    setShowButtonEditor(false);
  };

  // Get alignment from styles or default to center
  const textAlignment = block.styles.textAlign || 'center';

  const getButtonStyles = () => {
    const baseStyles = blockStylesToCss(block.styles);
    
    // Button style variants
    const styleVariants = {
      primary: {
        backgroundColor: '#3B82F6',
        color: '#FFFFFF',
        border: '2px solid #3B82F6'
      },
      secondary: {
        backgroundColor: '#6B7280',
        color: '#FFFFFF',
        border: '2px solid #6B7280'
      },
      outline: {
        backgroundColor: 'transparent',
        color: '#3B82F6',
        border: '2px solid #3B82F6'
      },
      ghost: {
        backgroundColor: 'transparent',
        color: '#3B82F6',
        border: '2px solid transparent'
      }
    };

    const defaultStyle = styleVariants[block.content.buttonStyle || 'primary'];
    
    // Override with custom background color if provided
    const finalStyle = {
      ...defaultStyle,
      ...(block.content.backgroundColor && {
        backgroundColor: block.content.backgroundColor,
        border: `2px solid ${block.content.backgroundColor}`
      })
    };

    return {
      ...baseStyles,
      ...finalStyle,
      display: 'inline-block',
      padding: '12px 24px',
      textDecoration: 'none',
      borderRadius: '6px',
      fontWeight: '600',
      textAlign: 'center' as const,
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    };
  };

  const customActions = (
    <button
      onClick={() => setShowButtonEditor(true)}
      className="p-1 text-gray-500 hover:text-gray-700"
      title="Edit button"
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
        <div className={`p-4 ${textAlignment === 'left' ? 'text-left' : textAlignment === 'right' ? 'text-right' : 'text-center'}`}>
          <a
            href={block.content.url}
            onClick={(e) => e.preventDefault()} // Prevent navigation in editor
            style={getButtonStyles()}
            className="hover:opacity-90"
          >
            {block.content.text}
          </a>
        </div>

        {/* Button editor modal */}
        {showButtonEditor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Edit Button</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Button Text
                  </label>
                  <input
                    type="text"
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Click here"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL
                  </label>
                  <input
                    type="url"
                    value={editingUrl}
                    onChange={(e) => setEditingUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Button Style
                  </label>
                  <select
                    value={editingStyle}
                    onChange={(e) => {
                      const value = e.target.value as ButtonBlock['content']['buttonStyle'];
                      setEditingStyle(value || 'primary');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="primary">Primary (Blue)</option>
                    <option value="secondary">Secondary (Gray)</option>
                    <option value="outline">Outline</option>
                    <option value="ghost">Ghost</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Background Color (Optional)
                  </label>
                  <input
                    type="color"
                    value={editingBackgroundColor || '#3B82F6'}
                    onChange={(e) => setEditingBackgroundColor(e.target.value)}
                    className="w-full h-10 px-1 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="flex items-center mt-2">
                    <input
                      type="checkbox"
                      id="useCustomColor"
                      checked={!!editingBackgroundColor}
                      onChange={(e) => {
                        if (!e.target.checked) {
                          setEditingBackgroundColor('');
                        } else {
                          setEditingBackgroundColor('#3B82F6');
                        }
                      }}
                      className="mr-2"
                    />
                    <label htmlFor="useCustomColor" className="text-sm text-gray-600">
                      Use custom color (overrides button style)
                    </label>
                  </div>
                </div>

                {/* Preview */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preview
                  </label>
                  <div className="border border-gray-200 rounded-md p-4 bg-gray-50 text-center">
                    <span
                      style={{
                        ...getButtonStyles(),
                        backgroundColor: editingBackgroundColor || 
                                       (editingStyle === 'primary' ? '#3B82F6' : 
                                        editingStyle === 'secondary' ? '#6B7280' : 
                                        'transparent'),
                        color: (editingBackgroundColor && editingBackgroundColor !== 'transparent') ? '#FFFFFF' :
                               (editingStyle === 'outline' || editingStyle === 'ghost' ? '#3B82F6' : '#FFFFFF'),
                        border: editingBackgroundColor ? `2px solid ${editingBackgroundColor}` :
                               (editingStyle === 'ghost' ? '2px solid transparent' : 
                                editingStyle === 'outline' ? '2px solid #3B82F6' : 
                                `2px solid ${editingStyle === 'primary' ? '#3B82F6' : '#6B7280'}`)
                      }}
                    >
                      {editingText || 'Button Text'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowButtonEditor(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleButtonSave}
                  className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </EmailBlockWrapper>
  );
};
