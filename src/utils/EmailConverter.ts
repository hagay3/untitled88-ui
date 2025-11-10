/**
 * Email Converter Utility
 * Converts between HTML email format and JSON block structure
 */

import { 
  EmailStructure, 
  EmailBlock, 
  HeaderBlock,
  HeroBlock,
  TextBlock,
  ImageBlock,
  ButtonBlock,
  DividerBlock,
  FooterBlock,
  FeaturesBlock,
  ValidationResult,
  BlockStyles
} from '@/types/EmailBlock';

export class EmailConverter {
  
  
  /**
   * Convert JSON block structure to HTML email
   */
  jsonToHtml(emailStructure: EmailStructure): string {
    // Sort blocks by orderId
    const sortedBlocks = [...emailStructure.blocks].sort((a, b) => a.orderId - b.orderId);
    
    // Generate HTML for each block
    const blockHtmls = sortedBlocks.map(block => this.blockToHtml(block));
    
    // Wrap in email template structure
    return this.wrapInEmailTemplate(blockHtmls, emailStructure);
  }
  
 
  
  /**
   * Convert JSON block to HTML string
   */
  private blockToHtml(block: EmailBlock): string {
    switch (block.blockType) {
      case 'header':
        return this.headerBlockToHtml(block as HeaderBlock);
      case 'hero':
        return this.heroBlockToHtml(block as HeroBlock);
      case 'text':
        return this.textBlockToHtml(block as TextBlock);
      case 'image':
        return this.imageBlockToHtml(block as ImageBlock);
      case 'button':
        return this.buttonBlockToHtml(block as ButtonBlock);
      case 'divider':
        return this.dividerBlockToHtml(block as DividerBlock);
      case 'footer':
        return this.footerBlockToHtml(block as FooterBlock);
      case 'features':
        return this.featuresBlockToHtml(block as FeaturesBlock);
      default:
        return '';
    }
  }
  

  // HTML generation methods for each block type
  private headerBlockToHtml(block: HeaderBlock): string {
    return `<tr data-block-id="${block.id}" data-block-type="header">
      <td style="${this.stylesToCss(block.styles)}">
        ${block.content.imageUrl 
          ? `<img src="${block.content.imageUrl}" alt="${block.content.imageAlt || ''}" 
             width="${block.content.imageWidth || 200}" 
             style="max-width: 200px; height: auto; display: block; margin: 0 auto;" />`
          : `<h1 style="margin: 0; font-size: 32px; font-weight: bold; line-height: 1.2;">${block.content.text || 'Company Name'}</h1>`
        }
      </td>
    </tr>`;
  }
  
  private heroBlockToHtml(block: HeroBlock): string {
    return `<tr data-block-id="${block.id}" data-block-type="hero">
      <td style="${this.stylesToCss(block.styles)}">
        <h1 style="margin: 0; font-size: 48px; font-weight: bold; line-height: 1.2;">${block.content.headline}</h1>
        ${block.content.subheadline ? `<p style="margin: 10px 0 0 0; font-size: 18px; line-height: 1.4;">${block.content.subheadline}</p>` : ''}
      </td>
    </tr>`;
  }
  
  private textBlockToHtml(block: TextBlock): string {
    return `<tr data-block-id="${block.id}" data-block-type="text">
      <td style="${this.stylesToCss(block.styles)}">
        <p style="margin: 0; line-height: 1.6;">${block.content.text}</p>
      </td>
    </tr>`;
  }
  
  private imageBlockToHtml(block: ImageBlock): string {
    const imgTag = `<img src="${block.content.imageUrl}" alt="${block.content.imageAlt}" 
      ${block.content.imageWidth ? `width="${block.content.imageWidth}"` : ''}
      style="max-width: 100%; height: auto; display: block;" />`;
    
    const content = block.content.linkUrl 
      ? `<a href="${block.content.linkUrl}" style="display: inline-block;">${imgTag}</a>`
      : imgTag;
    
    return `<tr data-block-id="${block.id}" data-block-type="image">
      <td style="${this.stylesToCss(block.styles)}">
        <div style="display: inline-block;">
          ${content}
        </div>
      </td>
    </tr>`;
  }
  
  private buttonBlockToHtml(block: ButtonBlock): string {
    // Determine button background color based on style or custom color
    let backgroundColor = '#3B82F6'; // Default primary blue
    
    if (block.content.backgroundColor) {
      backgroundColor = block.content.backgroundColor;
    } else {
      // Use predefined colors based on buttonStyle
      switch (block.content.buttonStyle) {
        case 'primary':
          backgroundColor = '#3B82F6';
          break;
        case 'secondary':
          backgroundColor = '#6B7280';
          break;
        case 'outline':
        case 'ghost':
          backgroundColor = 'transparent';
          break;
        default:
          backgroundColor = '#3B82F6';
      }
    }
    
    // Determine text color based on background
    const textColor = backgroundColor === 'transparent' ? '#3B82F6' : '#FFFFFF';
    
    // Determine border style
    const borderStyle = block.content.buttonStyle === 'outline' ? '2px solid #3B82F6' : 
                       block.content.buttonStyle === 'ghost' ? '2px solid transparent' :
                       `2px solid ${backgroundColor}`;
    
    return `<tr data-block-id="${block.id}" data-block-type="button">
      <td style="${this.stylesToCss(block.styles)}">
        <div style="display: inline-block;">
          <a href="${block.content.url}" style="display: inline-block; padding: 12px 24px; background-color: ${backgroundColor}; color: ${textColor}; text-decoration: none; border-radius: 6px; font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; border: ${borderStyle};">
            ${block.content.text}
          </a>
        </div>
      </td>
    </tr>`;
  }
  
  private dividerBlockToHtml(block: DividerBlock): string {
    return `<tr data-block-id="${block.id}" data-block-type="divider">
      <td style="${this.stylesToCss(block.styles)}">
        <div style="display: inline-block; width: 100%;">
          <hr style="border: none; border-top: ${block.content.thickness || 1}px solid #e5e7eb; margin: 20px 0; width: 100%;" />
        </div>
      </td>
    </tr>`;
  }
  
  private footerBlockToHtml(block: FooterBlock): string {
    const footerContent = [];
    
    if (block.content.companyName) {
      footerContent.push(`<p style="margin: 0 0 10px 0; font-size: 14px; line-height: 1.4;"><strong>${block.content.companyName}</strong></p>`);
    }
    
    if (block.content.address) {
      footerContent.push(`<p style="margin: 0 0 10px 0; font-size: 12px; line-height: 1.4; color: #666;">${block.content.address}</p>`);
    }
    
    const links = [];
    if (block.content.unsubscribeText && block.content.unsubscribeUrl) {
      links.push(`<a href="${block.content.unsubscribeUrl}" style="color: #666; text-decoration: underline;">${block.content.unsubscribeText}</a>`);
    }
    if (block.content.privacyPolicyText && block.content.privacyPolicyUrl) {
      links.push(`<a href="${block.content.privacyPolicyUrl}" style="color: #666; text-decoration: underline;">${block.content.privacyPolicyText}</a>`);
    }
    
    if (links.length > 0) {
      footerContent.push(`<p style="margin: 10px 0 0 0; font-size: 12px; line-height: 1.4; color: #666;">${links.join(' | ')}</p>`);
    }
    
    // Get styles but force center alignment for footer
    const baseStyles = this.stylesToCss(block.styles);
    const footerStyles = baseStyles.replace(/text-align:\s*[^;]+;?/g, '') + '; text-align: center';
    
    return `<tr data-block-id="${block.id}" data-block-type="footer">
      <td style="${footerStyles}">
        ${footerContent.join('')}
      </td>
    </tr>`;
  }
  
  private featuresBlockToHtml(block: FeaturesBlock): string {
    const baseStyles = this.stylesToCss(block.styles);
    const layout = block.content.layout || 'list';
    
    // Build title HTML if present
    let titleHtml = '';
    if (block.content.title) {
      titleHtml = `<h3 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600; line-height: 1.3;">${block.content.title}</h3>`;
    }
    
    // Build features HTML based on layout
    let featuresHtml = '';
    
    if (layout === 'grid' || layout === 'columns') {
      // Grid/columns layout using table structure for email compatibility
      const featuresPerRow = layout === 'grid' ? 2 : 2;
      const features = block.content.features;
      
      featuresHtml = '<table width="100%" cellpadding="0" cellspacing="0" style="margin: 0;">';
      
      for (let i = 0; i < features.length; i += featuresPerRow) {
        featuresHtml += '<tr>';
        
        for (let j = 0; j < featuresPerRow; j++) {
          const feature = features[i + j];
          const cellWidth = Math.floor(100 / featuresPerRow);
          
          if (feature) {
            featuresHtml += `
              <td width="${cellWidth}%" style="padding: 10px; vertical-align: top;">
                <div style="text-align: ${block.styles.textAlign || 'left'};">
                  <div style="font-size: 20px; margin-bottom: 8px;">${feature.icon || '✓'}</div>
                  <h4 style="margin: 0 0 5px 0; font-size: 14px; font-weight: 600; line-height: 1.3;">${feature.title}</h4>
                  ${feature.description ? `<p style="margin: 0; font-size: 12px; line-height: 1.4; color: #666;">${feature.description}</p>` : ''}
                </div>
              </td>`;
          } else {
            featuresHtml += `<td width="${cellWidth}%" style="padding: 10px;"></td>`;
          }
        }
        
        featuresHtml += '</tr>';
      }
      
      featuresHtml += '</table>';
    } else {
      // List layout (default)
      featuresHtml = '<div style="margin: 0;">';
      
      block.content.features.forEach((feature, index) => {
        const marginBottom = index < block.content.features.length - 1 ? '15px' : '0';
        
        featuresHtml += `
          <div style="display: flex; align-items: flex-start; margin-bottom: ${marginBottom}; text-align: ${block.styles.textAlign || 'left'};">
            <div style="flex-shrink: 0; margin-right: 12px; margin-top: 2px;">
              <span style="font-size: 18px; line-height: 1;">${feature.icon || '✓'}</span>
            </div>
            <div style="flex: 1;">
              <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; line-height: 1.3;">${feature.title}</h4>
              ${feature.description ? `<p style="margin: 0; font-size: 12px; line-height: 1.4; color: #666;">${feature.description}</p>` : ''}
            </div>
          </div>`;
      });
      
      featuresHtml += '</div>';
    }
    
    return `<tr data-block-id="${block.id}" data-block-type="features">
      <td style="${baseStyles}">
        ${titleHtml}
        ${featuresHtml}
      </td>
    </tr>`;
  }
  
  
  
  private stylesToCss(styles: BlockStyles): string {
    const cssProps: string[] = [];
    
    // Base padding
    cssProps.push('padding: 20px 40px');
    
    // Text alignment - default to center if not specified
    const textAlign = styles.textAlign || 'center';
    cssProps.push(`text-align: ${textAlign}`);
    
    // Colors
    if (styles.textColor) {
      cssProps.push(`color: ${styles.textColor}`);
    }
    
    
    // Font properties
    if (styles.fontFamily) {
      cssProps.push(`font-family: ${styles.fontFamily}`);
    }
    
    if (styles.fontWeight) {
      cssProps.push(`font-weight: ${styles.fontWeight}`);
    }
    
    if (styles.fontSize) {
      cssProps.push(`font-size: ${styles.fontSize}`);
    }
    
    // Borders
    if (styles.borderWidth && styles.borderStyle && styles.borderColor) {
      cssProps.push(`border: ${styles.borderWidth} ${styles.borderStyle} ${styles.borderColor}`);
    }
    
    if (styles.borderRadius) {
      cssProps.push(`border-radius: ${styles.borderRadius}`);
    }
    
    // Text decoration
    if (styles.textDecoration) {
      cssProps.push(`text-decoration: ${styles.textDecoration}`);
    }
    
    return cssProps.join('; ');
  }
  
  
  private wrapInEmailTemplate(blockHtmls: string[], emailStructure: EmailStructure): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${emailStructure.subject || 'Email'}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center">
                <table width="${emailStructure.globalStyles?.containerWidth || 600}" cellpadding="0" cellspacing="0" border="0" 
                       style="background-color: #ffffff;">
                    ${blockHtmls.join('\n')}
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
  }
  
  /**
   * Validate email structure
   */
  validate(emailStructure: EmailStructure): ValidationResult {
    const errors: ValidationResult['errors'] = [];
    const warnings: ValidationResult['warnings'] = [];
    
    // Validate blocks
    emailStructure.blocks.forEach(block => {
      // Check for duplicate orderIds
      const duplicateOrder = emailStructure.blocks.filter(b => b.orderId === block.orderId);
      if (duplicateOrder.length > 1) {
        errors.push({
          blockId: block.id,
          field: 'orderId',
          message: `Duplicate orderId ${block.orderId} found`
        });
      }
      
      // Block-specific validation
      this.validateBlock(block, errors, warnings);
    });
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  private validateBlock(block: EmailBlock, errors: ValidationResult['errors'], _warnings: ValidationResult['warnings']) {
    switch (block.blockType) {
      case 'image':
        const imageBlock = block as ImageBlock;
        if (!imageBlock.content.imageUrl) {
          errors.push({
            blockId: block.id,
            field: 'imageUrl',
            message: 'Image URL is required'
          });
        }
        break;
      case 'button':
        const buttonBlock = block as ButtonBlock;
        if (!buttonBlock.content.text) {
          errors.push({
            blockId: block.id,
            field: 'text',
            message: 'Button text is required'
          });
        }
        break;
      // Add more validations as needed
    }
  }
}

// Export singleton instance
export const emailConverter = new EmailConverter();
