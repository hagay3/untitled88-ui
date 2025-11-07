/**
 * Email Builder Component
 * Drag-and-drop editor with text and color editing capabilities
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface EmailBuilderProps {
  email: any;
  onEmailUpdate: (updatedEmail: any) => void;
}


export default function EmailBuilder({ email: _email, onEmailUpdate: _onEmailUpdate }: EmailBuilderProps) {
  const [selectedElement] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'elements' | 'styles'>('elements');

  // Available elements to drag
  const availableElements = [
    {
      type: 'text',
      icon: '📝',
      label: 'Text Block',
      defaultContent: 'Your text here...'
    },
    {
      type: 'image',
      icon: '🖼️',
      label: 'Image',
      defaultContent: 'https://via.placeholder.com/400x200'
    },
    {
      type: 'button',
      icon: '🔘',
      label: 'Button',
      defaultContent: 'Click Here'
    },
    {
      type: 'features',
      icon: '⭐',
      label: 'Features List',
      defaultContent: 'Product features'
    },
    {
      type: 'divider',
      icon: '➖',
      label: 'Divider',
      defaultContent: ''
    },
    {
      type: 'spacer',
      icon: '⬜',
      label: 'Spacer',
      defaultContent: ''
    }
  ];

  const colorPresets = [
    '#000000', '#FFFFFF', '#3B82F6', '#10B981', '#F59E0B', 
    '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'
  ];


  const handleStyleChange = (property: string, value: string) => {
    // Update element styles
    console.log(`Updating ${property} to ${value} for element ${selectedElement}`);
  };

  const handleDragStart = (e: React.DragEvent, elementType: string) => {
    e.dataTransfer.setData('text/plain', elementType);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Builder Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-3">Email Builder</h3>
        
        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('elements')}
            className={`flex-1 px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'elements'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Elements
          </button>
          <button
            onClick={() => setActiveTab('styles')}
            className={`flex-1 px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'styles'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Styles
          </button>
        </div>
      </div>

      {/* Builder Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'elements' && (
          <div className="p-4">
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Drag elements to your email
              </h4>
              
              {availableElements.map((element) => (
                <div
                  key={element.type}
                  draggable
                  onDragStart={(e) => handleDragStart(e, element.type)}
                  className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-move hover:bg-gray-100 transition-colors"
                >
                  <span className="text-lg mr-3">{element.icon}</span>
                  <div>
                    <div className="font-medium text-gray-900 text-sm">
                      {element.label}
                    </div>
                    <div className="text-xs text-gray-500">
                      Drag to add to email
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Quick Actions
              </h4>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => console.log('Add header')}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                  Add Header
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => console.log('Add footer')}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 18h7" />
                  </svg>
                  Add Footer
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => console.log('Add social links')}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  Social Links
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'styles' && (
          <div className="p-4">
            {selectedElement ? (
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700">
                  Element Styles
                </h4>

                {/* Text Styles */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Font Size
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    onChange={(e) => handleStyleChange('fontSize', e.target.value)}
                  >
                    <option value="12px">12px</option>
                    <option value="14px">14px</option>
                    <option value="16px">16px</option>
                    <option value="18px">18px</option>
                    <option value="20px">20px</option>
                    <option value="24px">24px</option>
                    <option value="32px">32px</option>
                  </select>
                </div>

                {/* Text Color */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Text Color
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {colorPresets.map((color) => (
                      <button
                        key={color}
                        onClick={() => handleStyleChange('color', color)}
                        className="w-8 h-8 rounded border border-gray-300 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                {/* Background Color */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Background Color
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {colorPresets.map((color) => (
                      <button
                        key={color}
                        onClick={() => handleStyleChange('backgroundColor', color)}
                        className="w-8 h-8 rounded border border-gray-300 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                {/* Text Alignment */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Text Alignment
                  </label>
                  <div className="flex space-x-1">
                    {['left', 'center', 'right'].map((align) => (
                      <button
                        key={align}
                        onClick={() => handleStyleChange('textAlign', align)}
                        className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded hover:bg-gray-50"
                      >
                        {align.charAt(0).toUpperCase() + align.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Padding */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Padding
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 10px 15px"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    onChange={(e) => handleStyleChange('padding', e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">
                  <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500">
                  Select an element to edit its styles
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Builder Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => console.log('Undo')}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            Undo
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => console.log('Redo')}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6-6m6 6l-6 6" />
            </svg>
            Redo
          </Button>
        </div>
      </div>
    </div>
  );
}
