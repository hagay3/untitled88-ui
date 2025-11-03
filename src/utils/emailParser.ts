/**
 * Email Parser Utility
 * Parses HTML emails into editable blocks and reconstructs them after editing
 */

export interface EmailBlock {
  id: string;
  type: 'header' | 'hero' | 'text' | 'image' | 'button' | 'divider' | 'footer';
  content: string;
  styles: Record<string, string>;
  originalHtml: string;
  position?: { x: number; y: number; width: number; height: number };
}

export interface ParsedEmail {
  blocks: EmailBlock[];
  originalHtml: string;
  metadata: {
    hasBlocks: boolean;
    totalBlocks: number;
    blockTypes: string[];
  };
}

export class EmailParser {
  /**
   * Parse HTML email into editable blocks
   */
  parseEmailToBlocks(html: string): ParsedEmail {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const blocks: EmailBlock[] = [];
    
    // Find all elements with data-block-id
    const blockElements = doc.querySelectorAll('[data-block-id]');
    
    blockElements.forEach((element) => {
      const blockId = element.getAttribute('data-block-id');
      const blockType = element.getAttribute('data-block-type') as EmailBlock['type'];
      
      if (blockId && blockType) {
        const block: EmailBlock = {
          id: blockId,
          type: blockType,
          content: this.extractContent(element, blockType),
          styles: this.extractStyles(element),
          originalHtml: element.outerHTML
        };
        
        blocks.push(block);
      }
    });
    
    // Sort blocks by their position in the DOM
    blocks.sort((a, b) => {
      const aElement = doc.querySelector(`[data-block-id="${a.id}"]`);
      const bElement = doc.querySelector(`[data-block-id="${b.id}"]`);
      
      if (aElement && bElement) {
        return this.getElementPosition(aElement) - this.getElementPosition(bElement);
      }
      return 0;
    });
    
    const blockTypes = [...new Set(blocks.map(block => block.type))];
    
    return {
      blocks,
      originalHtml: html,
      metadata: {
        hasBlocks: blocks.length > 0,
        totalBlocks: blocks.length,
        blockTypes
      }
    };
  }
  
  /**
   * Reconstruct HTML with updated blocks
   */
  reconstructHtml(originalHtml: string, updatedBlocks: EmailBlock[]): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(originalHtml, 'text/html');
    
    updatedBlocks.forEach((block) => {
      const element = doc.querySelector(`[data-block-id="${block.id}"]`);
      if (element) {
        this.updateElement(element, block);
      }
    });
    
    return doc.documentElement.outerHTML;
  }
  
  /**
   * Extract content from a block element based on its type
   */
  private extractContent(element: Element, blockType: EmailBlock['type']): string {
    switch (blockType) {
      case 'image':
        const img = element.querySelector('img');
        return img?.getAttribute('src') || '';
        
      case 'button':
        const link = element.querySelector('a');
        return link?.textContent?.trim() || '';
        
      case 'header':
        const logo = element.querySelector('img');
        return logo?.getAttribute('src') || '';
        
      default:
        // For text, hero, footer - extract text content
        return element.textContent?.trim() || '';
    }
  }
  
  /**
   * Extract CSS styles from element
   */
  private extractStyles(element: Element): Record<string, string> {
    const styles: Record<string, string> = {};
    
    // Extract inline styles from the main element
    const styleAttr = element.getAttribute('style');
    if (styleAttr) {
      this.parseStyleString(styleAttr, styles);
    }
    
    // Extract styles from child elements (like td, img, a)
    const childElements = element.querySelectorAll('td, img, a, h1, h2, h3, p');
    childElements.forEach((child) => {
      const childStyle = child.getAttribute('style');
      if (childStyle) {
        this.parseStyleString(childStyle, styles);
      }
    });
    
    // Extract specific attributes for images
    if (element.querySelector('img')) {
      const img = element.querySelector('img');
      if (img) {
        styles.width = img.getAttribute('width') || styles.width || 'auto';
        styles.height = img.getAttribute('height') || styles.height || 'auto';
        styles.alt = img.getAttribute('alt') || '';
      }
    }
    
    // Extract href for buttons
    if (element.querySelector('a')) {
      const link = element.querySelector('a');
      if (link) {
        styles.href = link.getAttribute('href') || '#';
      }
    }
    
    return styles;
  }
  
  /**
   * Parse CSS style string into object
   */
  private parseStyleString(styleString: string, styles: Record<string, string>): void {
    styleString.split(';').forEach((rule) => {
      const colonIndex = rule.indexOf(':');
      if (colonIndex > 0) {
        const property = rule.substring(0, colonIndex).trim();
        const value = rule.substring(colonIndex + 1).trim();
        if (property && value) {
          styles[property] = value;
        }
      }
    });
  }
  
  /**
   * Update DOM element with new block data
   */
  private updateElement(element: Element, block: EmailBlock): void {
    switch (block.type) {
      case 'image':
        const img = element.querySelector('img');
        if (img) {
          img.setAttribute('src', block.content);
          if (block.styles.alt) {
            img.setAttribute('alt', block.styles.alt);
          }
          if (block.styles.width && block.styles.width !== 'auto') {
            img.setAttribute('width', block.styles.width.replace('px', ''));
          }
          if (block.styles.height && block.styles.height !== 'auto') {
            img.setAttribute('height', block.styles.height.replace('px', ''));
          }
        }
        break;
        
      case 'button':
        const link = element.querySelector('a');
        if (link) {
          link.textContent = block.content;
          if (block.styles.href) {
            link.setAttribute('href', block.styles.href);
          }
          // Update button styles
          this.updateElementStyles(link, block.styles);
        }
        break;
        
      case 'header':
        const headerImg = element.querySelector('img');
        if (headerImg && block.content) {
          headerImg.setAttribute('src', block.content);
        }
        break;
        
      default:
        // For text content blocks
        const textElements = element.querySelectorAll('h1, h2, h3, p, td');
        if (textElements.length > 0) {
          // Update the main text element
          const mainTextElement = textElements[0];
          if (mainTextElement) {
            mainTextElement.textContent = block.content;
            this.updateElementStyles(mainTextElement, block.styles);
          }
        } else {
          // Fallback: update the element directly
          element.textContent = block.content;
        }
        break;
    }
    
    // Update container styles
    this.updateElementStyles(element, block.styles);
  }
  
  /**
   * Update element styles from styles object
   */
  private updateElementStyles(element: Element, styles: Record<string, string>): void {
    const styleUpdates: string[] = [];
    
    Object.entries(styles).forEach(([property, value]) => {
      // Skip non-CSS properties
      if (['alt', 'href', 'width', 'height'].includes(property)) {
        return;
      }
      
      if (value && value.trim()) {
        styleUpdates.push(`${property}: ${value}`);
      }
    });
    
    if (styleUpdates.length > 0) {
      element.setAttribute('style', styleUpdates.join('; '));
    }
  }
  
  /**
   * Get element position in DOM tree for sorting
   */
  private getElementPosition(element: Element): number {
    let position = 0;
    let current = element.previousElementSibling;
    
    while (current) {
      position++;
      current = current.previousElementSibling;
    }
    
    return position;
  }
  
  /**
   * Generate a new unique block ID
   */
  generateBlockId(type: EmailBlock['type'], existingBlocks: EmailBlock[]): string {
    const existingIds = existingBlocks
      .filter(block => block.type === type)
      .map(block => block.id);
    
    let counter = 1;
    let newId = `${type}-${counter}`;
    
    while (existingIds.includes(newId)) {
      counter++;
      newId = `${type}-${counter}`;
    }
    
    return newId;
  }
  
  /**
   * Validate if HTML has proper block structure
   */
  validateBlockStructure(html: string): { isValid: boolean; issues: string[] } {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const issues: string[] = [];
    
    const blockElements = doc.querySelectorAll('[data-block-id]');
    
    if (blockElements.length === 0) {
      issues.push('No editable blocks found. Email may not be editable.');
    }
    
    blockElements.forEach((element, index) => {
      const blockId = element.getAttribute('data-block-id');
      const blockType = element.getAttribute('data-block-type');
      
      if (!blockId) {
        issues.push(`Block ${index + 1} missing data-block-id attribute`);
      }
      
      if (!blockType) {
        issues.push(`Block ${index + 1} missing data-block-type attribute`);
      }
      
      if (blockType && !['header', 'hero', 'text', 'image', 'button', 'divider', 'footer'].includes(blockType)) {
        issues.push(`Block ${index + 1} has invalid block type: ${blockType}`);
      }
    });
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }
}

// Export singleton instance
export const emailParser = new EmailParser();
