/**
 * Inline Text Toolbar Component
 * Displays a floating toolbar above selected text elements with editing controls
 */

import { useState, useRef, useEffect } from 'react';
import { EmailBlock } from '@/utils/emailParser';

interface InlineTextToolbarProps {
  block: EmailBlock;
  position: { x: number; y: number; width: number };
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  onStyleChange: (styles: Record<string, string>) => void;
  onContentChange: (content: string) => void;
  totalBlocks: number;
  blockIndex: number;
}

const colorPresets = [
  { value: '#000000', label: 'Black' },
  { value: '#FFFFFF', label: 'White' },
  { value: '#6B7280', label: 'Gray' },
  { value: '#3B82F6', label: 'Blue' },
  { value: '#10B981', label: 'Green' },
  { value: '#F59E0B', label: 'Amber' },
  { value: '#EF4444', label: 'Red' },
  { value: '#8B5CF6', label: 'Purple' },
  { value: '#06B6D4', label: 'Cyan' },
  { value: '#F97316', label: 'Orange' }
];

export default function InlineTextToolbar({
  block,
  position,
  onMoveUp,
  onMoveDown,
  onDelete,
  onStyleChange,
  onContentChange,
  totalBlocks,
  blockIndex
}: InlineTextToolbarProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const [showSizeSlider, setShowSizeSlider] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  
  const [textColor, setTextColor] = useState(block.styles.color || '#000000');
  const [bgColor, setBgColor] = useState(block.styles['background-color'] || block.styles.backgroundColor || 'transparent');
  const [fontSize, setFontSize] = useState(
    parseInt(block.styles['font-size'] || block.styles.fontSize || '16') || 16
  );

  const toolbarRef = useRef<HTMLDivElement>(null);

  // Close pickers when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setShowColorPicker(false);
        setShowBgColorPicker(false);
        setShowSizeSlider(false);
        setShowLinkInput(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTextColorChange = (color: string) => {
    setTextColor(color);
    onStyleChange({ ...block.styles, color });
  };

  const handleBgColorChange = (color: string) => {
    setBgColor(color);
    onStyleChange({ ...block.styles, 'background-color': color });
  };

  const handleFontSizeChange = (size: number) => {
    setFontSize(size);
    onStyleChange({ ...block.styles, 'font-size': `${size}px` });
  };

  const handleAddLink = () => {
    if (linkUrl.trim()) {
      // Add link to the text content
      const linkedContent = `<a href="${linkUrl}" style="color: ${textColor}; text-decoration: underline;">${block.content}</a>`;
      onContentChange(linkedContent);
      setLinkUrl('');
      setShowLinkInput(false);
    }
  };

  // Calculate toolbar position (above the element)
  const toolbarStyle = {
    left: `${position.x}px`,
    top: `${position.y - 60}px`, // 60px above the element
    minWidth: '400px'
  };

  return (
    <div
      ref={toolbarRef}
      className="absolute z-50 bg-white rounded-lg shadow-2xl border border-gray-200 p-2 flex items-center space-x-1"
      style={toolbarStyle}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Move Up */}
      <button
        onClick={onMoveUp}
        disabled={blockIndex === 0}
        className="p-2 hover:bg-gray-100 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title="Move Up"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>

      {/* Move Down */}
      <button
        onClick={onMoveDown}
        disabled={blockIndex === totalBlocks - 1}
        className="p-2 hover:bg-gray-100 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title="Move Down"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-300 mx-1"></div>

      {/* Delete */}
      <button
        onClick={onDelete}
        className="p-2 hover:bg-red-50 hover:text-red-600 rounded transition-colors"
        title="Delete"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-300 mx-1"></div>

      {/* Text Color */}
      <div className="relative">
        <button
          onClick={() => {
            setShowColorPicker(!showColorPicker);
            setShowBgColorPicker(false);
            setShowSizeSlider(false);
            setShowLinkInput(false);
          }}
          className="p-2 hover:bg-gray-100 rounded transition-colors flex items-center space-x-1"
          title="Text Color"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
          <div
            className="w-4 h-4 rounded border border-gray-300"
            style={{ backgroundColor: textColor }}
          ></div>
        </button>

        {/* Color Picker Popup */}
        {showColorPicker && (
          <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-3 w-64 z-50">
            <div className="text-xs font-medium text-gray-700 mb-2">Text Color</div>
            <div className="grid grid-cols-5 gap-2 mb-3">
              {colorPresets.map((color) => (
                <button
                  key={color.value}
                  onClick={() => handleTextColorChange(color.value)}
                  className={`w-10 h-10 rounded border-2 transition-all hover:scale-110 ${
                    textColor === color.value ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.label}
                >
                  {color.value === '#FFFFFF' && (
                    <div className="w-full h-full border border-gray-200 rounded"></div>
                  )}
                </button>
              ))}
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={textColor}
                onChange={(e) => handleTextColorChange(e.target.value)}
                className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={textColor}
                onChange={(e) => handleTextColorChange(e.target.value)}
                className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs"
                placeholder="#000000"
              />
            </div>
          </div>
        )}
      </div>

      {/* Background Color */}
      <div className="relative">
        <button
          onClick={() => {
            setShowBgColorPicker(!showBgColorPicker);
            setShowColorPicker(false);
            setShowSizeSlider(false);
            setShowLinkInput(false);
          }}
          className="p-2 hover:bg-gray-100 rounded transition-colors flex items-center space-x-1"
          title="Background Color"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
          <div
            className="w-4 h-4 rounded border border-gray-300"
            style={{ backgroundColor: bgColor === 'transparent' ? '#ffffff' : bgColor }}
          ></div>
        </button>

        {/* Background Color Picker Popup */}
        {showBgColorPicker && (
          <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-3 w-64 z-50">
            <div className="text-xs font-medium text-gray-700 mb-2">Background Color</div>
            <div className="grid grid-cols-5 gap-2 mb-3">
              <button
                onClick={() => handleBgColorChange('transparent')}
                className={`w-10 h-10 rounded border-2 transition-all hover:scale-110 ${
                  bgColor === 'transparent' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'
                }`}
                style={{ background: 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)', backgroundSize: '10px 10px', backgroundPosition: '0 0, 5px 5px' }}
                title="Transparent"
              ></button>
              {colorPresets.map((color) => (
                <button
                  key={color.value}
                  onClick={() => handleBgColorChange(color.value)}
                  className={`w-10 h-10 rounded border-2 transition-all hover:scale-110 ${
                    bgColor === color.value ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.label}
                >
                  {color.value === '#FFFFFF' && (
                    <div className="w-full h-full border border-gray-200 rounded"></div>
                  )}
                </button>
              ))}
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={bgColor === 'transparent' ? '#ffffff' : bgColor}
                onChange={(e) => handleBgColorChange(e.target.value)}
                className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={bgColor}
                onChange={(e) => handleBgColorChange(e.target.value)}
                className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs"
                placeholder="transparent or #ffffff"
              />
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-300 mx-1"></div>

      {/* Font Size */}
      <div className="relative">
        <button
          onClick={() => {
            setShowSizeSlider(!showSizeSlider);
            setShowColorPicker(false);
            setShowBgColorPicker(false);
            setShowLinkInput(false);
          }}
          className="p-2 hover:bg-gray-100 rounded transition-colors flex items-center space-x-1"
          title="Font Size"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-xs font-medium">{fontSize}px</span>
        </button>

        {/* Font Size Slider Popup */}
        {showSizeSlider && (
          <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-64 z-50">
            <div className="text-xs font-medium text-gray-700 mb-3">Font Size: {fontSize}px</div>
            <input
              type="range"
              min="8"
              max="72"
              value={fontSize}
              onChange={(e) => handleFontSizeChange(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>8px</span>
              <span>72px</span>
            </div>
          </div>
        )}
      </div>

      {/* Link */}
      <div className="relative">
        <button
          onClick={() => {
            setShowLinkInput(!showLinkInput);
            setShowColorPicker(false);
            setShowBgColorPicker(false);
            setShowSizeSlider(false);
          }}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Add Link"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </button>

        {/* Link Input Popup */}
        {showLinkInput && (
          <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-80 z-50">
            <div className="text-xs font-medium text-gray-700 mb-2">Add Link to Text</div>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && handleAddLink()}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setLinkUrl('');
                  setShowLinkInput(false);
                }}
                className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddLink}
                disabled={!linkUrl.trim()}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Link
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3B82F6;
          cursor: pointer;
        }
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3B82F6;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
}

