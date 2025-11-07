/**
 * Features Block Component
 * Handles product features, abilities, and details display
 */

import React, { useState, useRef, useEffect } from 'react';
import { FeaturesBlock } from '@/types/EmailBlock';
import { BaseEmailBlockProps, EmailBlockWrapper, blockStylesToCss } from './BaseEmailBlock';

interface FeaturesBlockComponentProps extends BaseEmailBlockProps {
  block: FeaturesBlock;
  onEditingEnd?: () => void;
}

export const FeaturesBlockComponent: React.FC<FeaturesBlockComponentProps> = ({
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
  const [editingTitle, setEditingTitle] = useState(block.content.title || '');
  const [editingFeatures, setEditingFeatures] = useState(block.content.features);
  const [editingField, setEditingField] = useState<'title' | number | null>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const featureRefs = useRef<{ [key: number]: { title: HTMLTextAreaElement | null, description: HTMLTextAreaElement | null } }>({});

  // Auto-focus when editing starts
  useEffect(() => {
    if (editingField === 'title' && titleRef.current) {
      titleRef.current.focus();
      const length = titleRef.current.value.length;
      titleRef.current.setSelectionRange(length, length);
    } else if (typeof editingField === 'number') {
      const refs = featureRefs.current[editingField];
      if (refs?.title) {
        refs.title.focus();
        const length = refs.title.value.length;
        refs.title.setSelectionRange(length, length);
      }
    }
  }, [editingField]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditingTitle(e.target.value);
  };

  const handleFeatureChange = (index: number, field: 'title' | 'description' | 'icon', value: string) => {
    const updatedFeatures = [...editingFeatures];
    updatedFeatures[index] = {
      ...updatedFeatures[index],
      [field]: value
    };
    setEditingFeatures(updatedFeatures);
  };

  const handleTitleBlur = () => {
    if (editingTitle !== (block.content.title || '')) {
      onUpdate?.(block.id, {
        ...block,
        content: {
          ...block.content,
          title: editingTitle || undefined
        }
      });
    }
    setEditingField(null);
  };

  const handleFeatureBlur = (index: number) => {
    const hasChanges = JSON.stringify(editingFeatures) !== JSON.stringify(block.content.features);
    if (hasChanges) {
      onUpdate?.(block.id, {
        ...block,
        content: {
          ...block.content,
          features: editingFeatures
        }
      });
    }
    setEditingField(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, field: 'title' | number) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      if (field === 'title') {
        handleTitleBlur();
      } else {
        handleFeatureBlur(field);
      }
      onEditingEnd?.();
    } else if (e.key === 'Escape') {
      if (field === 'title') {
        setEditingTitle(block.content.title || '');
      } else {
        setEditingFeatures(block.content.features);
      }
      setEditingField(null);
      onEditingEnd?.();
    }
  };

  const addFeature = () => {
    const newFeature = {
      icon: '✓',
      title: 'New Feature',
      description: 'Feature description'
    };
    const updatedFeatures = [...editingFeatures, newFeature];
    setEditingFeatures(updatedFeatures);
    onUpdate?.(block.id, {
      ...block,
      content: {
        ...block.content,
        features: updatedFeatures
      }
    });
  };

  const removeFeature = (index: number) => {
    const updatedFeatures = editingFeatures.filter((_, i) => i !== index);
    setEditingFeatures(updatedFeatures);
    onUpdate?.(block.id, {
      ...block,
      content: {
        ...block.content,
        features: updatedFeatures
      }
    });
  };

  // Convert block styles to CSS
  const cssStyles = blockStylesToCss(block.styles);
  
  // Get alignment from styles or default to left
  const textAlignment = block.styles.textAlign || 'left';
  const alignmentClass = textAlignment === 'left' ? 'text-left' : 
                        textAlignment === 'right' ? 'text-right' : 'text-center';

  // Get layout style
  const layout = block.content.layout || 'list';

  return (
    <EmailBlockWrapper
      block={block}
      isSelected={isSelected}
      onSelect={onSelect}
    >
      <div className={`relative ${alignmentClass}`} style={cssStyles}>
        {/* Optional Title */}
        {(block.content.title || isEditing) && (
          <div className="mb-4">
            {isEditing && editingField === 'title' ? (
              <textarea
                ref={titleRef}
                value={editingTitle}
                onChange={handleTitleChange}
                onBlur={handleTitleBlur}
                onKeyDown={(e) => handleKeyDown(e, 'title')}
                className={`w-full min-h-[1.5em] p-2 border-2 border-blue-300 rounded resize-none outline-none ${alignmentClass} font-semibold text-lg`}
                style={{
                  fontFamily: cssStyles.fontFamily,
                  color: cssStyles.color,
                  backgroundColor: 'white',
                  textAlign: textAlignment
                }}
                placeholder="Enter features section title..."
                autoFocus
              />
            ) : (
              <h3
                className="text-lg font-semibold cursor-text p-2 min-h-[1.5em] border-2 border-transparent hover:border-gray-200 rounded"
                style={{
                  fontFamily: cssStyles.fontFamily,
                  color: cssStyles.color
                }}
                onClick={() => {
                  onSelect?.(block.id);
                  setEditingField('title');
                }}
              >
                {block.content.title || (isSelected ? 'Click to add title' : '')}
              </h3>
            )}
          </div>
        )}

        {/* Features List */}
        <div className={`features-container ${layout === 'grid' ? 'grid grid-cols-2 gap-4' : layout === 'columns' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-3'}`}>
          {editingFeatures.map((feature, index) => (
            <div 
              key={index} 
              className={`feature-item ${layout === 'list' ? 'flex items-start space-x-3' : 'flex flex-col space-y-2'} p-3 border border-transparent hover:border-gray-200 rounded-lg transition-colors`}
            >
              {/* Icon */}
              <div className={`feature-icon ${layout === 'list' ? 'flex-shrink-0 mt-1' : 'text-center'}`}>
                {isEditing && editingField === index ? (
                  <input
                    type="text"
                    value={feature.icon || ''}
                    onChange={(e) => handleFeatureChange(index, 'icon', e.target.value)}
                    className="w-8 h-8 text-center border border-gray-300 rounded text-lg"
                    placeholder="🔥"
                    maxLength={2}
                  />
                ) : (
                  <span 
                    className="text-2xl cursor-pointer hover:bg-gray-100 rounded p-1"
                    onClick={() => {
                      onSelect?.(block.id);
                      setEditingField(index);
                    }}
                  >
                    {feature.icon || '✓'}
                  </span>
                )}
              </div>

              {/* Feature Content */}
              <div className="feature-content flex-1">
                {/* Feature Title */}
                {isEditing && editingField === index ? (
                  <textarea
                    ref={(el) => {
                      if (!featureRefs.current[index]) featureRefs.current[index] = { title: null, description: null };
                      featureRefs.current[index].title = el;
                    }}
                    value={feature.title}
                    onChange={(e) => handleFeatureChange(index, 'title', e.target.value)}
                    onBlur={() => handleFeatureBlur(index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    className={`w-full min-h-[1.2em] p-1 border-2 border-blue-300 rounded resize-none outline-none font-medium mb-2 ${alignmentClass}`}
                    style={{
                      fontFamily: cssStyles.fontFamily,
                      color: cssStyles.color,
                      backgroundColor: 'white',
                      textAlign: textAlignment
                    }}
                    placeholder="Feature title..."
                  />
                ) : (
                  <h4
                    className="font-medium cursor-text p-1 min-h-[1.2em] border-2 border-transparent hover:border-gray-200 rounded mb-1"
                    style={{
                      fontFamily: cssStyles.fontFamily,
                      color: cssStyles.color
                    }}
                    onClick={() => {
                      onSelect?.(block.id);
                      setEditingField(index);
                    }}
                  >
                    {feature.title}
                  </h4>
                )}

                {/* Feature Description */}
                {isEditing && editingField === index ? (
                  <textarea
                    ref={(el) => {
                      if (!featureRefs.current[index]) featureRefs.current[index] = { title: null, description: null };
                      featureRefs.current[index].description = el;
                    }}
                    value={feature.description}
                    onChange={(e) => handleFeatureChange(index, 'description', e.target.value)}
                    onBlur={() => handleFeatureBlur(index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    className={`w-full min-h-[2em] p-1 border-2 border-blue-300 rounded resize-none outline-none text-sm ${alignmentClass}`}
                    style={{
                      fontFamily: cssStyles.fontFamily,
                      color: cssStyles.color,
                      backgroundColor: 'white',
                      textAlign: textAlignment,
                      opacity: 0.8
                    }}
                    placeholder="Feature description..."
                  />
                ) : (
                  <p
                    className="text-sm cursor-text p-1 min-h-[2em] border-2 border-transparent hover:border-gray-200 rounded opacity-80"
                    style={{
                      fontFamily: cssStyles.fontFamily,
                      color: cssStyles.color
                    }}
                    onClick={() => {
                      onSelect?.(block.id);
                      setEditingField(index);
                    }}
                  >
                    {feature.description}
                  </p>
                )}

                {/* Remove Feature Button (only when editing) */}
                {isEditing && editingFeatures.length > 1 && (
                  <button
                    onClick={() => removeFeature(index)}
                    className="mt-2 text-red-500 hover:text-red-700 text-xs"
                    title="Remove feature"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add Feature Button (only when editing) */}
        {isEditing && (
          <div className="mt-4 text-center">
            <button
              onClick={addFeature}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            >
              + Add Feature
            </button>
          </div>
        )}

        {/* Inline toolbar for features editing */}
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

            {/* Layout Controls */}
            <div className="w-px h-4 bg-gray-300 mx-1" />
            
            <button
              onClick={() => onUpdate?.(block.id, { ...block, content: { ...block.content, layout: 'list' } })}
              className={`p-1 ${layout === 'list' ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'}`}
              title="List layout"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
            
            <button
              onClick={() => onUpdate?.(block.id, { ...block, content: { ...block.content, layout: 'grid' } })}
              className={`p-1 ${layout === 'grid' ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'}`}
              title="Grid layout"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
            </button>

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
