/**
 * Email Block Type Definitions
 * Defines the structure for JSON-based email editing
 */

// Base interface for all email blocks
export interface BaseEmailBlock {
  id: string;
  blockType: EmailBlockType;
  orderId: number;
  styles: BlockStyles;
}

// Supported block types
export type EmailBlockType = 
  | 'header' 
  | 'hero' 
  | 'text' 
  | 'image' 
  | 'button' 
  | 'divider' 
  | 'footer'
  | 'features';

// Predefined size options
export type SizeOption = 'small' | 'medium' | 'large' | 'extra-large';

// Common styling properties
export interface BlockStyles {
  // Layout - predefined sizes
  padding?: SizeOption;
  margin?: SizeOption;
  
  // Colors - free hex with palette support
  textColor?: string;
  borderColor?: string;
  
  // Typography - predefined sizes
  fontSize?: SizeOption;
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  textAlign?: 'left' | 'center' | 'right';
  lineHeight?: SizeOption;
  
  // Border
  borderWidth?: SizeOption;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';
  borderRadius?: SizeOption;
  
  // Dimensions
  width?: SizeOption | 'auto' | '100%';
  height?: SizeOption | 'auto';
  
  // Display
  textDecoration?: 'none' | 'underline' | 'line-through';
}

// Header Block - typically contains logo/company name
export interface HeaderBlock extends BaseEmailBlock {
  blockType: 'header';
  content: {
    text?: string;
    imageUrl?: string;
    imageAlt?: string;
    imageWidth?: number;
    imageHeight?: number;
  };
}

// Hero Block - main headline/banner section (text only)
export interface HeroBlock extends BaseEmailBlock {
  blockType: 'hero';
  content: {
    headline: string;
    subheadline?: string;
  };
}

// Text Block - paragraph content (plain text with optional links)
export interface TextBlock extends BaseEmailBlock {
  blockType: 'text';
  content: {
    text: string;
    linkText?: string; // Optional linkable text within the content
    linkUrl?: string; // URL for the linkable text
  };
}

// Image Block
export interface ImageBlock extends BaseEmailBlock {
  blockType: 'image';
  content: {
    imageUrl: string;
    imageAlt: string;
    imageWidth?: number;
    imageHeight?: number;
    caption?: string;
    linkUrl?: string; // Make image clickable
  };
}

// Button Block
export interface ButtonBlock extends BaseEmailBlock {
  blockType: 'button';
  content: {
    text: string;
    url: string;
    buttonStyle?: 'primary' | 'secondary' | 'outline' | 'ghost';
    backgroundColor?: string; // Custom button background color
  };
}

// Divider Block - horizontal line/spacer
export interface DividerBlock extends BaseEmailBlock {
  blockType: 'divider';
  content: {
    dividerType: 'line' | 'space';
    thickness?: number; // For line dividers
    height?: number; // For space dividers
  };
}

// Footer Block - contact info, unsubscribe, etc.
export interface FooterBlock extends BaseEmailBlock {
  blockType: 'footer';
  content: {
    companyName: string;
    address?: string;
    unsubscribeText: string;
    unsubscribeUrl: string;
    privacyPolicyText?: string;
    privacyPolicyUrl?: string;
    socialLinks?: Array<{
      platform: 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'youtube';
      url: string;
    }>;
  };
}

// Features Block - product features, abilities, and details
export interface FeaturesBlock extends BaseEmailBlock {
  blockType: 'features';
  content: {
    title?: string;
    features: Array<{
      icon?: string; // Emoji or icon character
      title: string;
      description: string;
    }>;
    layout?: 'list' | 'grid' | 'columns'; // How features are displayed
  };
}

// Union type for all email blocks
export type EmailBlock = 
  | HeaderBlock 
  | HeroBlock 
  | TextBlock 
  | ImageBlock 
  | ButtonBlock 
  | DividerBlock 
  | FooterBlock
  | FeaturesBlock;

// Email structure containing all blocks
export interface EmailStructure {
  id?: string;
  subject?: string;
  preheader?: string;
  blocks: EmailBlock[];
  globalStyles?: {
    fontFamily?: string;
    containerWidth?: number;
  };
  metadata?: {
    version: string;
    createdAt?: string;
    updatedAt?: string;
    tags?: string[];
  };
}

// Utility types for block creation
export type CreateBlockInput<T extends EmailBlockType> = {
  blockType: T;
  content: Extract<EmailBlock, { blockType: T }>['content'];
  styles?: Partial<BlockStyles>;
  orderId?: number;
};

// Validation result
export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    blockId?: string;
    field: string;
    message: string;
  }>;
  warnings: Array<{
    blockId?: string;
    field: string;
    message: string;
  }>;
}

// Color palette for brand consistency
export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  background: string;
  border: string;
}

// Size mappings for consistent styling
export const SIZE_MAPPINGS = {
  padding: {
    small: '10px',
    medium: '20px',
    large: '30px',
    'extra-large': '40px'
  },
  margin: {
    small: '5px',
    medium: '10px',
    large: '20px',
    'extra-large': '30px'
  },
  fontSize: {
    small: '12px',
    medium: '16px',
    large: '20px',
    'extra-large': '24px'
  },
  lineHeight: {
    small: '1.2',
    medium: '1.4',
    large: '1.6',
    'extra-large': '1.8'
  },
  borderWidth: {
    small: '1px',
    medium: '2px',
    large: '3px',
    'extra-large': '4px'
  },
  borderRadius: {
    small: '4px',
    medium: '8px',
    large: '12px',
    'extra-large': '16px'
  },
  width: {
    small: '200px',
    medium: '400px',
    large: '600px',
    'extra-large': '800px'
  },
  height: {
    small: '100px',
    medium: '200px',
    large: '300px',
    'extra-large': '400px'
  }
} as const;

// Default color palette
export const DEFAULT_COLOR_PALETTE: ColorPalette = {
  primary: '#3B82F6',
  secondary: '#6B7280',
  accent: '#10B981',
  text: '#111827',
  background: '#FFFFFF',
  border: '#E5E7EB'
};
