/**
 * Image Search Tool Component
 * Allows users to search for images and preview them
 */

import React, { useState } from 'react';
import { imageSearchAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { FaSearch, FaTimes, FaDownload, FaCopy, FaCheckCircle } from 'react-icons/fa';

interface ImageResult {
  url: string;
  thumbnail_url: string;
  width: number | null;
  height: number | null;
  size: number;
  format: string;
  index: number;
  original_filename: string;  // Original filename from download or source URL
  source_url?: string;  // Original URL from Google Images
}

interface ImageSearchResponse {
  success: boolean;
  search_term: string;
  images: ImageResult[];
  total_uploaded: number;
  error?: string;
}

interface ImageSearchToolProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImageSearchTool: React.FC<ImageSearchToolProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<ImageResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    setResults([]);
    setSelectedImageIndex(null);

    try {
      const response: ImageSearchResponse = await imageSearchAPI.searchImages(searchTerm.trim(), 5);

      if (response.success) {
        setResults(response.images);
        if (response.images.length > 0) {
          setSelectedImageIndex(0); // Auto-select first image
        }
      } else {
        setSearchError(response.error || 'Failed to search images');
      }
    } catch (error: any) {
      setSearchError(error.message || 'An error occurred while searching');
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSearching) {
      handleSearch();
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!isOpen) return null;

  const selectedImage = selectedImageIndex !== null ? results[selectedImageIndex] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="glass-modal w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">🖼️ Image Search Tool</h2>
            <p className="text-sm text-gray-500 mt-1">Search and find images for your emails</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes className="w-6 h-6" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex space-x-3">
            <div className="flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search for images (e.g., 'cute dogs', 'modern office', 'coffee shop')"
                disabled={isSearching}
                className="glass-input w-full px-4 py-3 text-base"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={!searchTerm.trim() || isSearching}
              className="btn-primary px-6"
            >
              {isSearching ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Searching...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <FaSearch className="w-4 h-4" />
                  <span>Search</span>
                </div>
              )}
            </Button>
          </div>

          {searchError && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              ❌ {searchError}
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {results.length === 0 && !isSearching && (
            <div className="flex-1 flex items-center justify-center p-12">
              <div className="text-center max-w-md">
                <div className="w-24 h-24 mx-auto mb-6 text-gray-300">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Start Your Image Search</h3>
                <p className="text-gray-500 mb-4">
                  Enter a search term above to find high-quality images for your email campaigns.
                </p>
                <div className="text-sm text-gray-400 space-y-1">
                  <p>💡 Try: &quot;product photography&quot;, &quot;office team&quot;, &quot;food plating&quot;</p>
                  <p>🔍 We&apos;ll find and upload 5 images to your cloud storage</p>
                </div>
              </div>
            </div>
          )}

          {results.length > 0 && (
            <>
              {/* Thumbnails Sidebar */}
              <div className="w-48 border-r border-gray-200 overflow-y-auto bg-gray-50 p-3 space-y-2">
                <div className="text-xs font-medium text-gray-600 mb-3 px-2">
                  {results.length} {results.length === 1 ? 'Result' : 'Results'}
                </div>
                {results.map((image, index) => (
                  <button
                    key={image.url}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`w-full aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImageIndex === index
                        ? 'border-blue-500 shadow-lg scale-105'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <img
                      src={image.thumbnail_url}
                      alt={`Result ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>

              {/* Main Preview Area */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {selectedImage && (
                  <>
                    {/* Image Preview */}
                    <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 overflow-auto">
                      <div className="max-w-full max-h-full">
                        <img
                          src={selectedImage.url}
                          alt={`Preview ${selectedImage.index}`}
                          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                        />
                      </div>
                    </div>

                    {/* Image Info & Actions */}
                    <div className="p-6 border-t border-gray-200 bg-white">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Image #{selectedImage.index}
                          </h3>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            {selectedImage.width && selectedImage.height && (
                              <div>
                                <span className="text-gray-500">Dimensions:</span>
                                <span className="ml-2 font-medium text-gray-900">
                                  {selectedImage.width} × {selectedImage.height}px
                                </span>
                              </div>
                            )}
                            <div>
                              <span className="text-gray-500">Format:</span>
                              <span className="ml-2 font-medium text-gray-900">
                                {selectedImage.format}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Size:</span>
                              <span className="ml-2 font-medium text-gray-900">
                                {formatFileSize(selectedImage.size)}
                              </span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-gray-500">Original File:</span>
                              <span className="ml-2 font-medium text-gray-900 font-mono text-xs">
                                {selectedImage.original_filename}
                              </span>
                            </div>
                            {selectedImage.source_url && (
                              <div className="col-span-2">
                                <span className="text-gray-500">Source:</span>
                                <a 
                                  href={selectedImage.source_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ml-2 text-blue-600 hover:text-blue-800 underline text-xs font-mono truncate max-w-md inline-block"
                                  title={selectedImage.source_url}
                                >
                                  {selectedImage.source_url}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* URL Display */}
                      <div className="glass-card p-4 mb-4">
                        <div className="text-xs font-medium text-gray-600 mb-2">Image URL (CloudFront CDN)</div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={selectedImage.url}
                            readOnly
                            className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg font-mono"
                          />
                          <button
                            onClick={() => handleCopyUrl(selectedImage.url)}
                            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                              copiedUrl === selectedImage.url
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {copiedUrl === selectedImage.url ? (
                              <div className="flex items-center space-x-1">
                                <FaCheckCircle className="w-4 h-4" />
                                <span>Copied!</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-1">
                                <FaCopy className="w-4 h-4" />
                                <span>Copy URL</span>
                              </div>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-3">
                        <a
                          href={selectedImage.url}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-secondary flex items-center space-x-2"
                        >
                          <FaDownload className="w-4 h-4" />
                          <span>Download</span>
                        </a>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

