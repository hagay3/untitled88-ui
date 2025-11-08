/**
 * Image Editor Modal
 * Allows editing of image source, alt text, and styling
 */

import { useState, useRef } from 'react';
import { EmailBlock } from '@/utils/emailParser';
import { Button } from '@/components/ui/button';

interface ImageEditorProps {
  block: EmailBlock;
  onSave: (content: string, styles: Record<string, string>) => void;
  onClose: () => void;
}

const imageSizes = [
  { value: 'auto', label: 'Auto' },
  { value: '100%', label: 'Full Width' },
  { value: '75%', label: '75% Width' },
  { value: '50%', label: '50% Width' },
  { value: '25%', label: '25% Width' },
  { value: '200px', label: '200px' },
  { value: '300px', label: '300px' },
  { value: '400px', label: '400px' },
  { value: '500px', label: '500px' },
  { value: '600px', label: '600px' }
];

const stockImages = [
  {
    url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=400&fit=crop',
    alt: 'Modern workspace',
    category: 'Business'
  },
  {
    url: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&h=400&fit=crop',
    alt: 'Team collaboration',
    category: 'Business'
  },
  {
    url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=400&fit=crop',
    alt: 'Technology and coding',
    category: 'Technology'
  },
  {
    url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&h=400&fit=crop',
    alt: 'Business meeting',
    category: 'Business'
  },
  {
    url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop',
    alt: 'Team discussion',
    category: 'Business'
  },
  {
    url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&h=400&fit=crop',
    alt: 'Online shopping',
    category: 'E-commerce'
  }
];

export default function ImageEditor({ block, onSave, onClose }: ImageEditorProps) {
  const [imageUrl, setImageUrl] = useState(block.content);
  const [altText, setAltText] = useState(block.styles.alt || '');
  const [width, setWidth] = useState(block.styles.width || 'auto');
  const [height, setHeight] = useState(block.styles.height || 'auto');
  const [textAlign, setTextAlign] = useState(block.styles['text-align'] || block.styles.textAlign || 'center');
  const [borderRadius, setBorderRadius] = useState(block.styles['border-radius'] || block.styles.borderRadius || '0px');
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'url' | 'upload' | 'stock'>('url');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    if (!imageUrl.trim()) {
      alert('Please provide an image URL');
      return;
    }

    const updatedStyles = {
      alt: altText,
      width,
      height: height === 'auto' ? 'auto' : height,
      'text-align': textAlign,
      'border-radius': borderRadius
    };

    onSave(imageUrl, updatedStyles);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setIsUploading(true);

    try {
      // For now, we'll use a placeholder service
      // In production, you'd upload to your own storage service
      const formData = new FormData();
      formData.append('file', file);

      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo purposes, create a local URL
      const localUrl = URL.createObjectURL(file);
      setImageUrl(localUrl);
      
      // Set default alt text based on filename
      if (!altText) {
        const fileName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setAltText(fileName);
      }

    } catch (error) {
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleStockImageSelect = (stockImage: typeof stockImages[0]) => {
    setImageUrl(stockImage.url);
    setAltText(stockImage.alt);
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Edit Image
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
          {/* Left Panel - Image Source */}
          <div className="w-1/2 p-6 border-r border-gray-200 overflow-y-auto">
            {/* Source Tabs */}
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6">
              <button
                onClick={() => setActiveTab('url')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'url'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                🔗 URL
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'upload'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📤 Upload
              </button>
              <button
                onClick={() => setActiveTab('stock')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'stock'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📷 Stock
              </button>
            </div>

            {/* URL Tab */}
            {activeTab === 'url' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/image.jpg"
                  />
                  {imageUrl && !isValidUrl(imageUrl) && (
                    <p className="text-red-500 text-xs mt-1">Please enter a valid URL</p>
                  )}
                </div>
              </div>
            )}

            {/* Upload Tab */}
            {activeTab === 'upload' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Image
                  </label>
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {isUploading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
                        <span className="text-sm text-gray-600">Uploading...</span>
                      </div>
                    ) : (
                      <>
                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-sm text-gray-600">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          PNG, JPG, GIF up to 5MB
                        </p>
                      </>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>
            )}

            {/* Stock Images Tab */}
            {activeTab === 'stock' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">Choose from our curated stock images:</p>
                <div className="grid grid-cols-2 gap-3">
                  {stockImages.map((stockImage, index) => (
                    <button
                      key={index}
                      onClick={() => handleStockImageSelect(stockImage)}
                      className={`relative group rounded-lg overflow-hidden border-2 transition-all ${
                        imageUrl === stockImage.url
                          ? 'border-blue-500 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={stockImage.url}
                        alt={stockImage.alt}
                        className="w-full h-20 object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                        <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                          {stockImage.category}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Alt Text */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alt Text (for accessibility)
              </label>
              <input
                type="text"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe the image..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Helps screen readers and improves SEO
              </p>
            </div>
          </div>

          {/* Right Panel - Styling & Preview */}
          <div className="w-1/2 p-6 overflow-y-auto">
            {/* Preview */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preview
              </label>
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 text-center">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={altText}
                    className="max-w-full max-h-48 mx-auto rounded"
                    style={{
                      width: width === 'auto' ? 'auto' : width,
                      height: height === 'auto' ? 'auto' : height,
                      borderRadius
                    }}
                    onError={() => {}}
                  />
                ) : (
                  <div className="w-32 h-32 bg-gray-200 rounded-lg mx-auto flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Styling Controls */}
            <div className="space-y-4">
              {/* Width */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Width
                </label>
                <select
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {imageSizes.map((size) => (
                    <option key={size.value} value={size.value}>
                      {size.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Height */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Height
                </label>
                <select
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {imageSizes.map((size) => (
                    <option key={size.value} value={size.value}>
                      {size.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Alignment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alignment
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
                  <option value="50%">Circle (50%)</option>
                </select>
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
            disabled={!imageUrl.trim() || (!!imageUrl && !isValidUrl(imageUrl))}
            className="px-6 bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
