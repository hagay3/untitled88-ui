/**
 * Text Editor Modal
 * Allows editing of text content and styling
 */

import { useState, useEffect } from 'react';
import { EmailBlock } from '@/utils/emailParser';
import { Button } from '@/components/ui/button';

interface TextEditorProps {
  block: EmailBlock;
  onSave: (content: string, styles: Record<string, string>) => void;
  onClose: () => void;
}

const fontSizes = [
  { value: '12px', label: '12px - Small' },
  { value: '14px', label: '14px - Regular' },
  { value: '16px', label: '16px - Medium' },
  { value: '18px', label: '18px - Large' },
  { value: '20px', label: '20px - X-Large' },
  { value: '24px', label: '24px - Heading' },
  { value: '28px', label: '28px - Big Heading' },
  { value: '32px', label: '32px - Hero' },
  { value: '36px', label: '36px - Display' }
];

const colorPresets = [
  { value: '#000000', label: 'Black' },
  { value: '#FFFFFF', label: 'White' },
  { value: '#6B7280', label: 'Gray' },
  { value: '#3B82F6', label: 'Blue' },
  { value: '#10B981', label: 'Green' },
  { value: '#F59E0B', label: 'Yellow' },
  { value: '#EF4444', label: 'Red' },
  { value: '#8B5CF6', label: 'Purple' },
  { value: '#06B6D4', label: 'Cyan' },
  { value: '#F97316', label: 'Orange' }
];

export default function TextEditor({ block, onSave, onClose }: TextEditorProps) {
  const [content, setContent] = useState(block.content);
  const [fontSize, setFontSize] = useState(block.styles['font-size'] || block.styles.fontSize || '16px');
  const [color, setColor] = useState(block.styles.color || '#000000');
  const [textAlign, setTextAlign] = useState(block.styles['text-align'] || block.styles.textAlign || 'left');
  const [fontWeight, setFontWeight] = useState(block.styles['font-weight'] || block.styles.fontWeight || 'normal');
  const [lineHeight, setLineHeight] = useState(block.styles['line-height'] || block.styles.lineHeight || '1.5');
  const [customColor, setCustomColor] = useState('');

  useEffect(() => {
    // Set custom color if current color is not in presets
    const isPresetColor = colorPresets.some(preset => preset.value === color);
    if (!isPresetColor) {
      setCustomColor(color);
    }
  }, [color]);

  const handleSave = () => {
    const updatedStyles = {
      'font-size': fontSize,
      'color': customColor || color,
      'text-align': textAlign,
      'font-weight': fontWeight,
      'line-height': lineHeight
    };

    onSave(content, updatedStyles);
  };

  const handleColorSelect = (selectedColor: string) => {
    setColor(selectedColor);
    setCustomColor('');
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setCustomColor(newColor);
    setColor(newColor);
  };

  const getBlockTypeTitle = () => {
    switch (block.type) {
      case 'hero':
        return 'Edit Hero Section';
      case 'header':
        return 'Edit Header';
      case 'footer':
        return 'Edit Footer';
      default:
        return 'Edit Text';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {getBlockTypeTitle()}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Text Content */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-32 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Enter your text content..."
            />
            <p className="text-xs text-gray-500 mt-1">
              {content.length} characters
            </p>
          </div>

          {/* Style Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Font Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Font Size
              </label>
              <select
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {fontSizes.map((size) => (
                  <option key={size.value} value={size.value}>
                    {size.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Font Weight */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Font Weight
              </label>
              <select
                value={fontWeight}
                onChange={(e) => setFontWeight(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="normal">Normal</option>
                <option value="500">Medium</option>
                <option value="600">Semi Bold</option>
                <option value="700">Bold</option>
                <option value="800">Extra Bold</option>
              </select>
            </div>

            {/* Line Height */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Line Height
              </label>
              <select
                value={lineHeight}
                onChange={(e) => setLineHeight(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="1.2">Tight (1.2)</option>
                <option value="1.4">Snug (1.4)</option>
                <option value="1.5">Normal (1.5)</option>
                <option value="1.6">Relaxed (1.6)</option>
                <option value="2">Loose (2.0)</option>
              </select>
            </div>

            {/* Text Alignment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Text Alignment
              </label>
              <div className="flex space-x-1">
                {[
                  { value: 'left', icon: '⬅️', label: 'Left' },
                  { value: 'center', icon: '↔️', label: 'Center' },
                  { value: 'right', icon: '➡️', label: 'Right' }
                ].map((align) => (
                  <button
                    key={align.value}
                    onClick={() => setTextAlign(align.value)}
                    className={`flex-1 px-3 py-2 text-sm border rounded-lg transition-colors ${
                      textAlign === align.value
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className="mr-1">{align.icon}</span>
                    {align.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Color Selection */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Text Color
            </label>
            
            {/* Preset Colors */}
            <div className="grid grid-cols-5 gap-2 mb-4">
              {colorPresets.map((colorOption) => (
                <button
                  key={colorOption.value}
                  onClick={() => handleColorSelect(colorOption.value)}
                  className={`w-full h-10 rounded-lg border-2 transition-all hover:scale-105 ${
                    color === colorOption.value && !customColor
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: colorOption.value }}
                  title={colorOption.label}
                >
                  {colorOption.value === '#FFFFFF' && (
                    <div className="w-full h-full border border-gray-200 rounded-lg"></div>
                  )}
                </button>
              ))}
            </div>

            {/* Custom Color */}
            <div className="flex items-center space-x-3">
              <label className="text-sm text-gray-600">Custom:</label>
              <input
                type="color"
                value={customColor || color}
                onChange={handleCustomColorChange}
                className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={customColor || color}
                onChange={(e) => handleCustomColorChange(e)}
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                placeholder="#000000"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preview
            </label>
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div
                style={{
                  fontSize,
                  color: customColor || color,
                  textAlign: textAlign as any,
                  fontWeight,
                  lineHeight
                }}
                className="break-words"
              >
                {content || 'Your text will appear here...'}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="px-6"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="px-6 bg-blue-500 hover:bg-blue-600 text-white"
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
