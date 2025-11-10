/**
 * Export utilities for downloading email HTML files
 */

import { sendError } from "@/utils/actions";

export interface ExportOptions {
  filename?: string;
  includeStyles?: boolean;
  format?: 'html' | 'zip';
}

/**
 * Download HTML content as a file
 */
export const downloadHtmlFile = (
  htmlContent: string,
  options: ExportOptions = {}
): void => {
  const {
    filename = 'email-template.html',
    includeStyles = true
  } = options;

  try {
    // Clean and prepare HTML content
    const cleanHtml = prepareHtmlForExport(htmlContent, includeStyles);
    
    // Create blob with HTML content
    const blob = new Blob([cleanHtml], { type: 'text/html;charset=utf-8' });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.html') ? filename : `${filename}.html`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Failed to export email:', error);
  }
};

/**
 * Prepare HTML content for export
 */
const prepareHtmlForExport = (htmlContent: string, includeStyles: boolean): string => {
  // Ensure proper DOCTYPE and structure
  let exportHtml = htmlContent;
  
  // Add DOCTYPE if missing
  if (!exportHtml.trim().toLowerCase().startsWith('<!doctype')) {
    exportHtml = '<!DOCTYPE html>\n' + exportHtml;
  }
  
  // Parse the HTML with DOCTYPE
  const parser = new DOMParser();
  const finalDoc = parser.parseFromString(exportHtml, 'text/html');
  
  // Add meta tags if missing
  const head = finalDoc.querySelector('head');
  if (head) {
    // Add charset if missing
    if (!head.querySelector('meta[charset]')) {
      const charsetMeta = finalDoc.createElement('meta');
      charsetMeta.setAttribute('charset', 'UTF-8');
      head.insertBefore(charsetMeta, head.firstChild);
    }
    
    // Add viewport if missing
    if (!head.querySelector('meta[name="viewport"]')) {
      const viewportMeta = finalDoc.createElement('meta');
      viewportMeta.setAttribute('name', 'viewport');
      viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0');
      head.appendChild(viewportMeta);
    }
    
    // Add title if missing
    if (!head.querySelector('title')) {
      const title = finalDoc.createElement('title');
      title.textContent = 'Email Template - Untitled88';
      head.appendChild(title);
    }
    
    // Add email client compatibility styles
    if (includeStyles) {
      const emailStyles = finalDoc.createElement('style');
      emailStyles.textContent = getEmailCompatibilityStyles();
      head.appendChild(emailStyles);
    }
  }
  
  // Remove any data-block attributes for clean export
  const blockElements = finalDoc.querySelectorAll('[data-block-id], [data-block-type]');
  blockElements.forEach(element => {
    element.removeAttribute('data-block-id');
    element.removeAttribute('data-block-type');
  });
  
  // Return the cleaned HTML
  return finalDoc.documentElement.outerHTML;
};

/**
 * Get email client compatibility styles
 */
const getEmailCompatibilityStyles = (): string => {
  return `
    /* Email Client Compatibility Styles */
    body {
      margin: 0;
      padding: 0;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    
    table {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    
    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
    }
    
    /* Outlook specific styles */
    .ExternalClass {
      width: 100%;
    }
    
    .ExternalClass,
    .ExternalClass p,
    .ExternalClass span,
    .ExternalClass font,
    .ExternalClass td,
    .ExternalClass div {
      line-height: 100%;
    }
    
    /* Mobile styles */
    @media only screen and (max-width: 600px) {
      table[class="main"] {
        width: 100% !important;
      }
      
      td[class="mobile-padding"] {
        padding: 20px !important;
      }
      
      img[class="mobile-image"] {
        width: 100% !important;
        height: auto !important;
      }
    }
  `;
};

/**
 * Generate filename based on email content
 */
export const generateFilename = (email: any): string => {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
  
  if (email?.subject) {
    // Clean subject for filename
    const cleanSubject = email.subject
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase()
      .slice(0, 50);
    
    return `${cleanSubject}-${timestamp}`;
  }
  
  return `email-template-${timestamp}`;
};

/**
 * Export email with metadata as JSON
 */
export const exportEmailWithMetadata = (email: any): void => {
  const exportData = {
    email: {
      subject: email.subject || 'Untitled Email',
      html: email.html || '',
      preheader: email.preheader || '',
      features: email.features || [],
      designNotes: email.designNotes || '',
      colorPalette: email.colorPalette || [],
      fontsUsed: email.fontsUsed || [],
      accessibilityFeatures: email.accessibilityFeatures || [],
      compatibilityNotes: email.compatibilityNotes || '',
      estimatedSize: email.estimatedSize || '',
      mobileOptimized: email.mobileOptimized || false
    },
    exportInfo: {
      exportedAt: new Date().toISOString(),
      exportedBy: 'Untitled88 Email Designer',
      version: '1.0.0'
    }
  };
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
    type: 'application/json;charset=utf-8' 
  });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${generateFilename(email)}-metadata.json`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Copy HTML to clipboard
 */
export const copyHtmlToClipboard = async (htmlContent: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(htmlContent);
  } catch (error) {
    sendError("unknown", "Failed to copy HTML to clipboard", error);
  }
};
