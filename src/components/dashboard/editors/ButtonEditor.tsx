/**
 * Button Editor Modal
 * Allows editing of button text, link, and styling
 */

import { useState } from 'react';
import { EmailBlock } from '@/utils/emailParser';
import { Button } from '@/components/ui/button';

interface ButtonEditorProps {
  block: EmailBlock;
  onSave: (content: string, styles: Record<string, string>) => void;
  onClose: () => void;
}

const buttonStyles = [
  {
    name: 'Primary Blue',
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    borderRadius: '8px'
  },
  {
    name: 'Success Green',
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    borderRadius: '8px'
  },
  {
    name: 'Warning Orange',
    backgroundColor: '#F59E0B',
    color: '#FFFFFF',
    borderRadius: '8px'
  },
  {
    name: 'Danger Red',
    backgroundColor: '#EF4444',
    color: '#FFFFFF',
    borderRadius: '8px'
  },
  {
    name: 'Dark',
    backgroundColor: '#1F2937',
    color: '#FFFFFF',
    borderRadius: '8px'
  },
  {
    name: 'Light',
    backgroundColor: '#F3F4F6',
    color: '#1F2937',
    borderRadius: '8px'
  },
  {
    name: 'Outline Blue',
    backgroundColor: 'transparent',
    color: '#3B82F6',
    border: '2px solid #3B82F6',
    borderRadius: '8px'
  },
  {
    name: 'Rounded',
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    borderRadius: '25px'
  }
];

const buttonSizes = [
  { name: 'Small', padding: '8px 16px', fontSize: '14px' },
  { name: 'Medium', padding: '12px 24px', fontSize: '16px' },
  { name: 'Large', padding: '16px 32px', fontSize: '18px' },
  { name: 'X-Large', padding: '20px 40px', fontSize: '20px' }
];

export default function ButtonEditor({ block, onSave, onClose }: ButtonEditorProps) {
  const [buttonText, setButtonText] = useState(block.content);
  const [buttonUrl, setButtonUrl] = useState(block.styles.href || '#');
  const [backgroundColor, setBackgroundColor] = useState(block.styles['background-color'] || block.styles.backgroundColor || '#3B82F6');
  const [textColor, setTextColor] = useState(block.styles.color || '#FFFFFF');
  const [borderRadius, setBorderRadius] = useState(block.styles['border-radius'] || block.styles.borderRadius || '8px');
  const [padding, setPadding] = useState(block.styles.padding || '12px 24px');
  const [fontSize, setFontSize] = useState(block.styles['font-size'] || block.styles.fontSize || '16px');
  const [border, setBorder] = useState(block.styles.border || '');
  const [textAlign, setTextAlign] = useState(block.styles['text-align'] || block.styles.textAlign || 'center');
  const [customBgColor, setCustomBgColor] = useState('');
  const [customTextColor, setCustomTextColor] = useState('');

  const handleSave = () => {
    if (!buttonText.trim()) {
      alert('Please enter button text');
      return;
    }

    const updatedStyles = {
      href: buttonUrl,
      'background-color': customBgColor || backgroundColor,
      color: customTextColor || textColor,
      'border-radius': borderRadius,
      padding,
      'font-size': fontSize,
      border,
      'text-align': textAlign,
      'text-decoration': 'none',
      'display': 'inline-block'
    };

    onSave(buttonText, updatedStyles);
  };

  const applyButtonStyle = (style: typeof buttonStyles[0]) => {
    setBackgroundColor(style.backgroundColor);
    setTextColor(style.color);
    setBorderRadius(style.borderRadius);
    setBorder(style.border || '');
    setCustomBgColor('');
    setCustomTextColor('');
  };

  const applyButtonSize = (size: typeof buttonSizes[0]) => {
    setPadding(size.padding);
    setFontSize(size.fontSize);
  };

  const isValidUrl = (url: string) => {
    if (url === '#') return true;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Edit Button
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
        <div className="flex h-[calc(90vh-140px)]">
          {/* Left Panel - Content & Link */}
          <div className="w-1/2 p-6 border-r border-gray-200 overflow-y-auto">
            {/* Button Text */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Button Text
              </label>
              <input
                type="text"
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Click Here"
              />
            </div>

            {/* Button URL */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Link URL
              </label>
              <input
                type="url"
                value={buttonUrl}
                onChange={(e) => setButtonUrl(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com"
              />
              {buttonUrl && buttonUrl !== '#' && !isValidUrl(buttonUrl) && (
                <p className="text-red-500 text-xs mt-1">Please enter a valid URL</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Use &apos;#&apos; for placeholder links
              </p>
            </div>

            {/* Quick Style Presets */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Quick Styles
              </label>
              <div className="grid grid-cols-2 gap-2">
                {buttonStyles.map((style, index) => (
                  <button
                    key={index}
                    onClick={() => applyButtonStyle(style)}
                    className="p-3 text-left border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    <div className="text-xs font-medium text-gray-700 mb-1">
                      {style.name}
                    </div>
                    <div
                      className="text-xs px-2 py-1 rounded text-center"
                      style={{
                        backgroundColor: style.backgroundColor,
                        color: style.color,
                        border: style.border,
                        borderRadius: style.borderRadius
                      }}
                    >
                      Sample
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Size Presets */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Button Size
              </label>
              <div className="space-y-2">
                {buttonSizes.map((size, index) => (
                  <button
                    key={index}
                    onClick={() => applyButtonSize(size)}
                    className={`w-full p-2 text-left border border-gray-200 rounded-lg hover:border-gray-300 transition-colors ${
                      padding === size.padding && fontSize === size.fontSize
                        ? 'border-blue-500 bg-blue-50'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        {size.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {size.padding} • {size.fontSize}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Styling & Preview */}
          <div className="w-1/2 p-6 overflow-y-auto">
            {/* Preview */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preview
              </label>
              <div className="border border-gray-200 rounded-lg p-6 bg-gray-50 text-center">
                <a
                  href={buttonUrl}
                  className="inline-block transition-all hover:opacity-90"
                  style={{
                    backgroundColor: customBgColor || backgroundColor,
                    color: customTextColor || textColor,
                    borderRadius,
                    padding,
                    fontSize,
                    border,
                    textDecoration: 'none'
                  }}
                  onClick={(e) => e.preventDefault()}
                >
                  {buttonText || 'Button Text'}
                </a>
              </div>
            </div>

            {/* Custom Colors */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Custom Colors
              </label>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <label className="text-sm text-gray-600 w-20">Background:</label>
                  <input
                    type="color"
                    value={customBgColor || backgroundColor}
                    onChange={(e) => {
                      setCustomBgColor(e.target.value);
                      setBackgroundColor(e.target.value);
                    }}
                    className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={customBgColor || backgroundColor}
                    onChange={(e) => {
                      setCustomBgColor(e.target.value);
                      setBackgroundColor(e.target.value);
                    }}
                    className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                    placeholder="#3B82F6"
                  />
                </div>
                <div className="flex items-center space-x-3">
                  <label className="text-sm text-gray-600 w-20">Text:</label>
                  <input
                    type="color"
                    value={customTextColor || textColor}
                    onChange={(e) => {
                      setCustomTextColor(e.target.value);
                      setTextColor(e.target.value);
                    }}
                    className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={customTextColor || textColor}
                    onChange={(e) => {
                      setCustomTextColor(e.target.value);
                      setTextColor(e.target.value);
                    }}
                    className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                    placeholder="#FFFFFF"
                  />
                </div>
              </div>
            </div>

            {/* Advanced Styling */}
            <div className="space-y-4">
              {/* Border Radius */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Border Radius
                </label>
                <select
                  value={borderRadius}
                  onChange={(e) => setBorderRadius(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="0px">None (0px)</option>
                  <option value="4px">Small (4px)</option>
                  <option value="8px">Medium (8px)</option>
                  <option value="12px">Large (12px)</option>
                  <option value="16px">X-Large (16px)</option>
                  <option value="25px">Rounded (25px)</option>
                  <option value="50px">Pill (50px)</option>
                </select>
              </div>

              {/* Border */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Border (optional)
                </label>
                <input
                  type="text"
                  value={border}
                  onChange={(e) => setBorder(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="2px solid #3B82F6"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Example: &quot;2px solid #3B82F6&quot; or leave empty for no border
                </p>
              </div>

              {/* Alignment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Button Alignment
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
            disabled={!buttonText.trim() || (buttonUrl !== '#' && !isValidUrl(buttonUrl))}
            className="px-6 bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
