import { useState, useRef, useCallback } from 'react';
import { ImageCompressor, CompressionResult } from '@/utils/imageCompression';
import { apiClient } from '@/utils/apiClient';

interface ImageUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImageUploaded: (imageUrl: string) => void;
  title?: string;
}

interface UploadState {
  status: 'idle' | 'compressing' | 'uploading' | 'success' | 'error';
  progress: number;
  message: string;
  error?: string;
}

export default function ImageUploadDialog({
  isOpen,
  onClose,
  onImageUploaded,
  title = 'Upload Image'
}: ImageUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [compressionResult, setCompressionResult] = useState<CompressionResult | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    progress: 0,
    message: ''
  });
  const [dragActive, setDragActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setSelectedFile(null);
    setCompressionResult(null);
    setUploadState({
      status: 'idle',
      progress: 0,
      message: ''
    });
    setDragActive(false);
  }, []);

  const handleClose = useCallback(() => {
    if (uploadState.status !== 'uploading' && uploadState.status !== 'compressing') {
      resetState();
      onClose();
    }
  }, [uploadState.status, resetState, onClose]);

  const handleFileSelect = useCallback(async (file: File) => {
    // Validate file
    const validation = ImageCompressor.validateImageFile(file);
    if (!validation.valid) {
      setUploadState({
        status: 'error',
        progress: 0,
        message: '',
        error: validation.error
      });
      return;
    }

    setSelectedFile(file);
    setUploadState({
      status: 'compressing',
      progress: 25,
      message: 'Preparing image for email compatibility...'
    });

    try {
      // Compress image
      const result = await ImageCompressor.compressImage(file);
      
      if (result.success && result.file) {
        setCompressionResult(result);
        setUploadState({
          status: 'idle',
          progress: 0,
          message: `Image prepared for email compatibility`
        });
        
        // Automatically start upload after compression
        setTimeout(async () => {
          await handleUploadInternal(result);
        }, 500);
      } else {
        setUploadState({
          status: 'error',
          progress: 0,
          message: '',
          error: result.error || 'Image preparation failed'
        });
      }
    } catch (error) {
      setUploadState({
        status: 'error',
        progress: 0,
        message: '',
        error: error instanceof Error ? error.message : 'Image preparation failed'
      });
    }
  }, []);

  const handleUploadInternal = useCallback(async (result: CompressionResult) => {
    if (!result?.file) return;

    setUploadState({
      status: 'uploading',
      progress: 10,
      message: 'Getting upload URL...'
    });

    try {
      // Step 1: Get presigned upload URL
      const uploadUrlResponse = await apiClient.fetchWithAuth('get_upload_image_url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: result.file.name,
          content_type: result.file.type
        })
      });

      if (!uploadUrlResponse.ok) {
        const errorData = await uploadUrlResponse.json();
        throw new Error(errorData.error || 'Failed to get upload URL');
      }

      const uploadData = await uploadUrlResponse.json();
      
      setUploadState({
        status: 'uploading',
        progress: 30,
        message: 'Uploading...'
      });

      // Step 2: Upload file 
      const uploadResponse = await fetch(uploadData.upload_url, {
        method: 'PUT',
        headers: {
          'Content-Type': result.file.type,
          'Content-Length': result.file.size.toString()
        },
        body: result.file
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
      }

      setUploadState({
        status: 'success',
        progress: 100,
        message: 'Image uploaded successfully!'
      });

      // Call success callback with the final URL
      onImageUploaded(uploadData.final_url);
      
      // Close dialog after short delay
      setTimeout(() => {
        handleClose();
      }, 1500);

    } catch (error) {
      setUploadState({
        status: 'error',
        progress: 0,
        message: '',
        error: error instanceof Error ? error.message : 'Upload failed'
      });
    }
  }, [onImageUploaded, handleClose]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    }
  }, [handleFileSelect]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file) {
        handleFileSelect(file);
      }
    }
  }, [handleFileSelect]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 p-6 border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={handleClose}
            disabled={uploadState.status === 'uploading' || uploadState.status === 'compressing'}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Upload Area */}
        {!selectedFile && (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDragIn}
            onDragLeave={handleDragOut}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-lg font-medium text-gray-900 mb-2">
              Drop your image here
            </p>
            <p className="text-sm text-gray-500 mb-4">
              or click to browse files
            </p>
            {/* immrpove the button desgin */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-primary text-sm bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
            >
              Choose Image
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <p className="text-xs text-gray-400 mt-4">
              Supports JPEG, PNG, GIF, WebP • Max 10MB
            </p>
          </div>
        )}

        {/* File Preview */}
        {selectedFile && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {ImageCompressor.formatFileSize(selectedFile.size)}
                </p>
              </div>
              {uploadState.status !== 'uploading' && uploadState.status !== 'compressing' && (
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setCompressionResult(null);
                    setUploadState({ status: 'idle', progress: 0, message: '' });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Compression Info */}
            {compressionResult && uploadState.status === 'idle' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-green-700">
                    <p className="font-medium">Image Optimized for Email</p>
                    <p>{uploadState.message}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Progress */}
            {(uploadState.status === 'compressing' || uploadState.status === 'uploading') && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{uploadState.message}</span>
                  <span className="text-gray-500">{uploadState.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadState.progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Success Message */}
            {uploadState.status === 'success' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-green-700">
                    <p className="font-medium">Upload Complete!</p>
                    <p>{uploadState.message}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {uploadState.status === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-red-700">
                    <p className="font-medium">Upload Failed</p>
                    <p>{uploadState.error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={handleClose}
            disabled={uploadState.status === 'uploading' || uploadState.status === 'compressing'}
            className="btn-secondary text-sm disabled:opacity-50"
          >
            {uploadState.status === 'success' ? 'Done' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}
