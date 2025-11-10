/**
 * Image Compression Utility for Email Compatibility
 * Compresses images before uploading to S3 for optimal email client support
 */

import { sendError } from "@/utils/actions";

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  maxSizeKB?: number;
}

export interface CompressionResult {
  success: boolean;
  file?: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  error?: string;
}

export class ImageCompressor {
  // Default settings optimized for email clients
  private static readonly DEFAULT_OPTIONS: CompressionOptions = {
    maxWidth: 600,      // Email template width is 600px - images should fit within
    maxHeight: 400,     // Reasonable height for email content (maintains 3:2 ratio)
    quality: 0.8,       // Slightly lower quality for better email performance
    format: 'jpeg',     // Best compatibility across email clients
    maxSizeKB: 300      // Keep under 300KB for faster email loading
  };

  /**
   * Compress an image file for email compatibility
   */
  static async compressImage(
    file: File, 
    options: CompressionOptions = {}
  ): Promise<CompressionResult> {
    try {
      const opts = { ...this.DEFAULT_OPTIONS, ...options };
      const originalSize = file.size;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        return {
          success: false,
          originalSize,
          compressedSize: 0,
          compressionRatio: 0,
          error: 'File is not an image'
        };
      }

      // Always process images to ensure they fit email dimensions
      // Even if file size is small, dimensions might be too large for email
      const maxSizeBytes = (opts.maxSizeKB || 300) * 1024;
      
      // Load image first to check dimensions
      const img = await this.loadImage(file);
      
      // Check if image needs resizing for email compatibility
      const needsResizing = img.width > (opts.maxWidth || 600) || img.height > (opts.maxHeight || 400);
      const needsCompression = originalSize > maxSizeBytes || !this.isEmailFriendlyFormat(file.type);
      
      if (!needsResizing && !needsCompression) {
        // File is already optimized for email, return as-is
        return {
          success: true,
          file,
          originalSize,
          compressedSize: originalSize,
          compressionRatio: 1
        };
      }

      // Create canvas for image processing
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        sendError("unknown", "Could not get canvas context");
        return {
          success: true,
          file,
          originalSize,
          compressedSize: originalSize,
          compressionRatio: 1
        };
      }

      // Calculate new dimensions (img already loaded above)
      const { width, height } = this.calculateDimensions(
        img.width, 
        img.height, 
        opts.maxWidth || 600, 
        opts.maxHeight || 400
      );

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw and compress image
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob with compression
      let quality = opts.quality || 0.8;
      let compressedBlob = await this.canvasToBlob(
        canvas, 
        opts.format || 'jpeg', 
        quality
      );

      // If still too large, reduce quality iteratively
      const targetSize = maxSizeBytes;
      let attempts = 0;
      while (compressedBlob.size > targetSize && quality > 0.3 && attempts < 5) {
        quality -= 0.1;
        compressedBlob = await this.canvasToBlob(canvas, opts.format || 'jpeg', quality);
        attempts++;
      }

      // Create new file
      const compressedFile = new File(
        [compressedBlob], 
        this.generateFileName(file.name, opts.format || 'jpeg'),
        { 
          type: compressedBlob.type,
          lastModified: Date.now()
        }
      );

      const compressedSize = compressedFile.size;
      const compressionRatio = originalSize / compressedSize;

      return {
        success: true,
        file: compressedFile,
        originalSize,
        compressedSize,
        compressionRatio
      };

    } catch (error) {
      return {
        success: false,
        originalSize: file.size,
        compressedSize: 0,
        compressionRatio: 0,
        error: error instanceof Error ? error.message : 'Compression failed'
      };
    }
  }

  /**
   * Load image from file
   */
  private static loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };

      img.src = url;
    });
  }

  /**
   * Calculate optimal dimensions for email while maintaining aspect ratio
   * Ensures images fit within email template constraints (600px width)
   */
  private static calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    // If image is already smaller than limits, keep original size
    if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
      return {
        width: originalWidth,
        height: originalHeight
      };
    }

    // Calculate aspect ratio
    const aspectRatio = originalWidth / originalHeight;
    
    let width = originalWidth;
    let height = originalHeight;

    // Scale down based on width constraint first (most important for email)
    if (width > maxWidth) {
      width = maxWidth;
      height = width / aspectRatio;
    }

    // Then check height constraint and scale down further if needed
    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }

    return {
      width: Math.round(width),
      height: Math.round(height)
    };
  }

  /**
   * Convert canvas to blob with specified format and quality
   */
  private static canvasToBlob(
    canvas: HTMLCanvasElement,
    format: string,
    quality: number
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        },
        mimeType,
        quality
      );
    });
  }

  /**
   * Generate appropriate filename based on format
   */
  private static generateFileName(originalName: string, format: string): string {
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    const extension = format === 'png' ? 'png' : 'jpg';
    return `${nameWithoutExt}.${extension}`;
  }

  /**
   * Check if format is email-friendly
   */
  private static isEmailFriendlyFormat(mimeType: string): boolean {
    const emailFriendlyTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png'
    ];
    return emailFriendlyTypes.includes(mimeType);
  }

  /**
   * Get file size in human-readable format
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Validate image file before processing
   */
  static validateImageFile(file: File): { valid: boolean; error?: string } {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return { valid: false, error: 'File must be an image' };
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { 
        valid: false, 
        error: `File size must be less than ${this.formatFileSize(maxSize)}` 
      };
    }

    // Check supported formats
    const supportedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp'
    ];

    if (!supportedTypes.includes(file.type)) {
      return { 
        valid: false, 
        error: 'Unsupported image format. Please use JPEG, PNG, GIF, or WebP.' 
      };
    }

    return { valid: true };
  }

  /**
   * Get compression preview info without actually compressing
   */
  static async getCompressionPreview(
    file: File,
    options: CompressionOptions = {}
  ): Promise<{
    estimatedSize: number;
    estimatedSizeFormatted: string;
    compressionRatio: number;
    newDimensions: { width: number; height: number };
  }> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    
    try {
      const img = await this.loadImage(file);
      const newDimensions = this.calculateDimensions(
        img.width,
        img.height,
        opts.maxWidth || 600,
        opts.maxHeight || 400
      );

      // Rough estimation based on quality and size reduction
      const pixelReduction = (newDimensions.width * newDimensions.height) / (img.width * img.height);
      const qualityFactor = opts.quality || 0.8;
      const estimatedSize = Math.round(file.size * pixelReduction * qualityFactor);
      
      return {
        estimatedSize,
        estimatedSizeFormatted: this.formatFileSize(estimatedSize),
        compressionRatio: file.size / estimatedSize,
        newDimensions
      };
    } catch (error) {
      // Fallback estimation
      return {
        estimatedSize: Math.round(file.size * 0.7),
        estimatedSizeFormatted: this.formatFileSize(Math.round(file.size * 0.7)),
        compressionRatio: 1.4,
        newDimensions: { width: 800, height: 600 }
      };
    }
  }
}
