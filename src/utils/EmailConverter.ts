/**
 * Email Converter Utility
 * Converts between HTML email format and JSON block structure
 */

import { 
  EmailStructure, 
  EmailBlock, 
  EmailBlockType,
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
   * Convert HTML email to JSON block structure
   */
  htmlToJson(html: string): EmailStructure {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const blocks: EmailBlock[] = [];
    let orderId = 1;
    
    // Find all elements with data-block-id (existing structure)
    const blockElements = doc.querySelectorAll('[data-block-id]');
    
    blockElements.forEach((element) => {
      const blockId = element.getAttribute('data-block-id');
      const blockType = element.getAttribute('data-block-type') as EmailBlockType;
      
      if (blockId && blockType) {
        const block = this.parseHtmlBlock(element, blockId, blockType, orderId++);
        if (block) {
          blocks.push(block);
        }
      }
    });
    
    // Extract global email metadata
    const subject = this.extractSubject(doc);
    const preheader = this.extractPreheader(doc);
    const globalStyles = this.extractGlobalStyles(doc);
    
    return {
      subject,
      preheader,
      blocks,
      globalStyles,
      metadata: {
        version: '1.0',
        createdAt: new Date().toISOString(),
      }
    };
  }
  
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
   * Parse individual HTML block element to JSON block
   */
  private parseHtmlBlock(
    element: Element, 
    blockId: string, 
    blockType: EmailBlockType, 
    orderId: number
  ): EmailBlock | null {
    
    const styles = this.extractBlockStyles(element);
    
    switch (blockType) {
      case 'header':
        return this.parseHeaderBlock(element, blockId, orderId, styles);
      case 'hero':
        return this.parseHeroBlock(element, blockId, orderId, styles);
      case 'text':
        return this.parseTextBlock(element, blockId, orderId, styles);
      case 'image':
        return this.parseImageBlock(element, blockId, orderId, styles);
      case 'button':
        return this.parseButtonBlock(element, blockId, orderId, styles);
      case 'divider':
        return this.parseDividerBlock(element, blockId, orderId, styles);
      case 'footer':
        return this.parseFooterBlock(element, blockId, orderId, styles);
      case 'features':
        return this.parseFeaturesBlock(element, blockId, orderId, styles);
      default:
        console.warn(`Unknown block type: ${blockType}`);
        return null;
    }
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
  
  // Parsing methods for each block type
  private parseHeaderBlock(element: Element, id: string, orderId: number, styles: BlockStyles): HeaderBlock {
    const img = element.querySelector('img');
    const text = element.textContent?.trim() || '';
    
    return {
      id,
      blockType: 'header',
      orderId,
      styles,
      content: {
        text: img ? undefined : text,
        imageUrl: img?.getAttribute('src') || undefined,
        imageAlt: img?.getAttribute('alt') || undefined,
        imageWidth: img?.getAttribute('width') ? parseInt(img.getAttribute('width')!) : undefined,
        imageHeight: img?.getAttribute('height') ? parseInt(img.getAttribute('height')!) : undefined,
      }
    };
  }
  
  private parseHeroBlock(element: Element, id: string, orderId: number, styles: BlockStyles): HeroBlock {
    let headline = '';
    let subheadline: string | undefined = undefined;
    
    // Look for structured content (h1, h2, p tags)
    const h1 = element.querySelector('h1');
    const h2 = element.querySelector('h2');
    const p = element.querySelector('p');
    
    if (h1) {
      headline = h1.textContent?.trim() || '';
      // If there's a p tag after h1, use it as subheadline
      if (p) {
        subheadline = p.textContent?.trim() || undefined;
      }
    } else if (h2) {
      headline = h2.textContent?.trim() || '';
      if (p) {
        subheadline = p.textContent?.trim() || undefined;
      }
    } else {
      // Fallback to first text content as headline
      const textNodes = Array.from(element.childNodes)
        .filter(node => node.nodeType === Node.TEXT_NODE || node.nodeName === 'P')
        .map(node => node.textContent?.trim())
        .filter(text => text && text.length > 0);
      
      if (textNodes.length > 0) {
        headline = textNodes[0] || '';
        if (textNodes.length > 1) {
          subheadline = textNodes[1] || undefined;
        }
      }
    }
    
    return {
      id,
      blockType: 'hero',
      orderId,
      styles,
      content: {
        headline,
        subheadline,
      }
    };
  }
  
  private parseTextBlock(element: Element, id: string, orderId: number, styles: BlockStyles): TextBlock {
    return {
      id,
      blockType: 'text',
      orderId,
      styles,
      content: {
        text: element.textContent?.trim() || '',
      }
    };
  }
  
  private parseImageBlock(element: Element, id: string, orderId: number, styles: BlockStyles): ImageBlock {
    const img = element.querySelector('img');
    const link = element.querySelector('a');
    
    return {
      id,
      blockType: 'image',
      orderId,
      styles,
      content: {
        imageUrl: img?.getAttribute('src') || '',
        imageAlt: img?.getAttribute('alt') || '',
        imageWidth: img?.getAttribute('width') ? parseInt(img.getAttribute('width')!) : undefined,
        imageHeight: img?.getAttribute('height') ? parseInt(img.getAttribute('height')!) : undefined,
        linkUrl: link?.getAttribute('href') || undefined,
      }
    };
  }
  
  private parseButtonBlock(element: Element, id: string, orderId: number, styles: BlockStyles): ButtonBlock {
    const link = element.querySelector('a');
    
    return {
      id,
      blockType: 'button',
      orderId,
      styles,
      content: {
        text: link?.textContent?.trim() || '',
        url: link?.getAttribute('href') || '#',
        buttonStyle: 'primary', // Default style
      }
    };
  }
  
  private parseDividerBlock(_element: Element, id: string, orderId: number, styles: BlockStyles): DividerBlock {
    return {
      id,
      blockType: 'divider',
      orderId,
      styles,
      content: {
        dividerType: 'line',
        thickness: 1,
      }
    };
  }
  
  private parseFooterBlock(element: Element, id: string, orderId: number, styles: BlockStyles): FooterBlock {
    // Try to parse structured footer content
    const paragraphs = element.querySelectorAll('p');
    let companyName = '';
    let address = '';
    let unsubscribeText = 'Unsubscribe';
    let unsubscribeUrl = '#';
    let privacyPolicyText = '';
    let privacyPolicyUrl = '';
    
    if (paragraphs.length > 0) {
      // First paragraph usually contains company info
      const firstP = paragraphs[0];
      if (firstP) {
        const strongElement = firstP.querySelector('strong');
        if (strongElement) {
          companyName = strongElement.textContent?.trim() || '';
        } else {
          companyName = firstP.textContent?.trim() || '';
        }
      }
      
      // Look for unsubscribe links in any paragraph
      paragraphs.forEach(p => {
        const links = p.querySelectorAll('a');
        links.forEach(link => {
          const linkText = link.textContent?.trim().toLowerCase() || '';
          const href = link.getAttribute('href') || '#';
          
          if (linkText.includes('unsubscribe')) {
            unsubscribeText = link.textContent?.trim() || 'Unsubscribe';
            unsubscribeUrl = href;
          } else if (linkText.includes('privacy')) {
            privacyPolicyText = link.textContent?.trim() || 'Privacy Policy';
            privacyPolicyUrl = href;
          }
        });
      });
    } else {
      // Fallback to simple text content if no structured content
      const fullText = element.textContent?.trim() || '';
      
      // Try to extract company name from the beginning
      const lines = fullText.split('\n').filter(line => line.trim());
      if (lines.length > 0 && lines[0]) {
        companyName = lines[0].trim();
      }
      
      // Look for unsubscribe links
      const unsubscribeLink = element.querySelector('a[href]');
      if (unsubscribeLink) {
        unsubscribeText = unsubscribeLink.textContent?.trim() || 'Unsubscribe';
        unsubscribeUrl = unsubscribeLink.getAttribute('href') || '#';
      }
    }
    
    // Clean up company name - remove excessive whitespace and duplicated text
    companyName = companyName
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/(.+?)\1+/g, '$1') // Remove repeated text patterns
      .replace(/Unsubscribe.*$/i, '') // Remove unsubscribe text if it got mixed in
      .replace(/Privacy Policy.*$/i, '') // Remove privacy policy text if it got mixed in
      .trim();
    
    return {
      id,
      blockType: 'footer',
      orderId,
      styles,
      content: {
        companyName,
        address,
        unsubscribeText,
        unsubscribeUrl,
        privacyPolicyText: privacyPolicyText || undefined,
        privacyPolicyUrl: privacyPolicyUrl || undefined,
      }
    };
  }
  
  private parseFeaturesBlock(element: Element, id: string, orderId: number, styles: BlockStyles): FeaturesBlock {
    const features: Array<{ icon?: string; title: string; description: string }> = [];
    let title: string | undefined = undefined;
    
    // Look for title element (h2, h3, or first strong element)
    const titleElement = element.querySelector('h2, h3') || element.querySelector('strong');
    if (titleElement) {
      title = titleElement.textContent?.trim() || undefined;
    }
    
    // Look for feature items - they might be in lists, divs, or paragraphs
    const featureElements = element.querySelectorAll('li, .feature-item, .feature');
    
    if (featureElements.length > 0) {
      // Structured features found
      featureElements.forEach(featureEl => {
        const titleEl = featureEl.querySelector('h4, strong, .feature-title') || featureEl.querySelector('*:first-child');
        const descEl = featureEl.querySelector('p, .feature-description') || featureEl.querySelector('*:last-child');
        
        let featureTitle = '';
        let featureDescription = '';
        let icon = '';
        
        if (titleEl) {
          const titleText = titleEl.textContent?.trim() || '';
          // Extract emoji/icon from beginning of title
          const iconMatch = titleText.match(/^([^\w\s]+)\s*(.*)$/);
          if (iconMatch) {
            icon = iconMatch[1] || '';
            featureTitle = iconMatch[2] || '';
          } else {
            featureTitle = titleText;
          }
        }
        
        if (descEl && descEl !== titleEl) {
          featureDescription = descEl.textContent?.trim() || '';
        }
        
        if (featureTitle) {
          features.push({
            icon: icon || '✓',
            title: featureTitle,
            description: featureDescription
          });
        }
      });
    } else {
      // Fallback: try to parse from paragraphs or text content
      const paragraphs = element.querySelectorAll('p');
      if (paragraphs.length > 0) {
        paragraphs.forEach(p => {
          const text = p.textContent?.trim() || '';
          if (text && !text.toLowerCase().includes('unsubscribe')) {
            // Try to split title and description
            const parts = text.split(/[:\-–—]/);
            if (parts.length >= 2) {
              const titlePart = parts[0]?.trim() || '';
              const descPart = parts.slice(1).join(':').trim();
              
              // Extract icon from title
              const iconMatch = titlePart.match(/^([^\w\s]+)\s*(.*)$/);
              let icon = '✓';
              let featureTitle = titlePart;
              
              if (iconMatch) {
                icon = iconMatch[1] || '✓';
                featureTitle = iconMatch[2] || '';
              }
              
              features.push({
                icon,
                title: featureTitle,
                description: descPart
              });
            } else {
              // Single line feature
              const iconMatch = text.match(/^([^\w\s]+)\s*(.*)$/);
              let icon = '✓';
              let featureTitle = text;
              
              if (iconMatch) {
                icon = iconMatch[1] || '✓';
                featureTitle = iconMatch[2] || '';
              }
              
              features.push({
                icon,
                title: featureTitle,
                description: ''
              });
            }
          }
        });
      }
    }
    
    // Default to at least one feature if none found
    if (features.length === 0) {
      features.push({
        icon: '✓',
        title: 'Feature',
        description: 'Feature description'
      });
    }
    
    return {
      id,
      blockType: 'features',
      orderId,
      styles,
      content: {
        title,
        features,
        layout: 'list' // Default layout
      }
    };
  }
  
  // HTML generation methods for each block type
  private headerBlockToHtml(block: HeaderBlock): string {
    return `<tr data-block-id="${block.id}" data-block-type="header">
      <td style="${this.stylesToCss(block.styles)}">
        ${block.content.imageUrl 
          ? `<img src="${block.content.imageUrl}" alt="${block.content.imageAlt || ''}" 
             ${block.content.imageWidth ? `width="${block.content.imageWidth}"` : ''}
             ${block.content.imageHeight ? `height="${block.content.imageHeight}"` : ''} />`
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
      ${block.content.imageHeight ? `height="${block.content.imageHeight}"` : ''} 
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
    return `<tr data-block-id="${block.id}" data-block-type="button">
      <td style="${this.stylesToCss(block.styles)}">
        <div style="display: inline-block;">
          <a href="${block.content.url}" style="display: inline-block; padding: 12px 24px; background-color: #3B82F6; color: white; text-decoration: none; border-radius: 6px; font-family: Arial, sans-serif; font-size: 16px; font-weight: bold;">
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
  
  // Utility methods
  private extractBlockStyles(element: Element): BlockStyles {
    const styles: BlockStyles = {};
    
    // Parse inline styles from style attribute
    const styleAttr = element.getAttribute('style');
    if (styleAttr) {
      const inlineStyles = this.parseInlineStyles(styleAttr);
      
      // Extract text alignment
      if (inlineStyles['text-align']) {
        const textAlign = inlineStyles['text-align'];
        if (['left', 'center', 'right'].includes(textAlign)) {
          styles.textAlign = textAlign as 'left' | 'center' | 'right';
        }
      }
      
      // Extract colors
      if (inlineStyles.color) {
        styles.textColor = inlineStyles.color;
      }
      
      if (inlineStyles['background-color']) {
        styles.backgroundColor = inlineStyles['background-color'];
      }
      
      // Extract font properties
      if (inlineStyles['font-family']) {
        styles.fontFamily = inlineStyles['font-family'];
      }
      
      if (inlineStyles['font-weight']) {
        styles.fontWeight = inlineStyles['font-weight'] as any;
      }
      
      if (inlineStyles['font-size']) {
        // Only store font-size if it's a valid SizeOption format
        const fontSize = inlineStyles['font-size'];
        if (fontSize.match(/^\d+(px|em|rem|%)$/)) {
          styles.fontSize = fontSize as any;
        }
      }
    }
    
    // Check parent TD element for styles as well
    const parentTd = element.closest('td');
    if (parentTd && parentTd !== element) {
      const parentStyleAttr = parentTd.getAttribute('style');
      if (parentStyleAttr) {
        const parentStyles = this.parseInlineStyles(parentStyleAttr);
        
        // Only use parent text-align if not already set
        if (!styles.textAlign && parentStyles['text-align']) {
          const textAlign = parentStyles['text-align'];
          if (['left', 'center', 'right'].includes(textAlign)) {
            styles.textAlign = textAlign as 'left' | 'center' | 'right';
          }
        }
      }
    }
    
    // Set center as default if no text-align is specified
    if (!styles.textAlign) {
      styles.textAlign = 'center';
    }
    
    return styles;
  }
  
  /**
   * Parse inline CSS styles from style attribute
   */
  private parseInlineStyles(styleString: string): Record<string, string> {
    const styles: Record<string, string> = {};
    
    if (!styleString) return styles;
    
    // Split by semicolon and parse each property
    const declarations = styleString.split(';');
    
    declarations.forEach(declaration => {
      const colonIndex = declaration.indexOf(':');
      if (colonIndex > 0) {
        const property = declaration.slice(0, colonIndex).trim().toLowerCase();
        const value = declaration.slice(colonIndex + 1).trim();
        
        if (property && value) {
          styles[property] = value;
        }
      }
    });
    
    return styles;
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
    
    if (styles.backgroundColor) {
      cssProps.push(`background-color: ${styles.backgroundColor}`);
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
  
  
  private extractSubject(doc: Document): string | undefined {
    const title = doc.querySelector('title');
    return title?.textContent || undefined;
  }
  
  private extractPreheader(_doc: Document): string | undefined {
    // TODO: Extract preheader from HTML
    return undefined;
  }
  
  private extractGlobalStyles(_doc: Document) {
    // TODO: Extract global styles
    return {
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f4f4f4',
      containerWidth: 600,
      containerBackgroundColor: '#ffffff',
    };
  }
  
  private wrapInEmailTemplate(blockHtmls: string[], emailStructure: EmailStructure): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${emailStructure.subject || 'Email'}</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${emailStructure.globalStyles?.backgroundColor || '#f4f4f4'};">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center">
                <table width="${emailStructure.globalStyles?.containerWidth || 600}" cellpadding="0" cellspacing="0" border="0" 
                       style="background-color: ${emailStructure.globalStyles?.containerBackgroundColor || '#ffffff'};">
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
