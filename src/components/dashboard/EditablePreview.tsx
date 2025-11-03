/**
 * Editable Preview Component
 * Displays email preview with inline editing capabilities
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { EmailParser, EmailBlock, ParsedEmail } from '@/utils/emailParser';
import { updateEmailBlock } from '@/lib/api';
import InlineTextToolbar from './InlineTextToolbar';
import InlineImageToolbar from './InlineImageToolbar';
import ImageEditDialog from './ImageEditDialog';

interface EditablePreviewProps {
  email: any;
  viewMode: 'desktop' | 'mobile';
  onViewModeChange: (mode: 'desktop' | 'mobile') => void;
  onEmailUpdate: (updatedHtml: string) => void;
  isUpdating?: boolean;
  updateProgress?: string;
}

interface BlockPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function EditablePreview({
  email,
  viewMode,
  onViewModeChange,
  onEmailUpdate,
  isUpdating = false,
  updateProgress = '',
}: EditablePreviewProps) {
  const [parsedEmail, setParsedEmail] = useState<ParsedEmail | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [blockPositions, setBlockPositions] = useState<Record<string, BlockPosition>>({});
  const [editingImageBlock, setEditingImageBlock] = useState<EmailBlock | null>(null);
  const [isUpdatingBlock, setIsUpdatingBlock] = useState(false);
  const [editableContent, setEditableContent] = useState<Record<string, string>>({});
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const emailParser = useRef(new EmailParser());

  // Parse email HTML into blocks
  useEffect(() => {
    console.log('📧 Email parsing effect triggered:', {
      hasEmail: !!email,
      hasHtml: !!email?.html,
      htmlLength: email?.html?.length || 0
    });

    if (email?.html) {
      console.log('🔍 Parsing email HTML...');
      const parsed = emailParser.current.parseEmailToBlocks(email.html);
      console.log('📊 Parsed email result:', {
        totalBlocks: parsed.blocks.length,
        blockTypes: parsed.blocks.map(b => b.type),
        blockIds: parsed.blocks.map(b => b.id),
        hasBlocks: parsed.metadata.hasBlocks
      });

      setParsedEmail(parsed);
      
      // Initialize editable content
      const content: Record<string, string> = {};
      parsed.blocks.forEach((block) => {
        content[block.id] = block.content;
      });
      console.log('📝 Initialized editable content:', content);
      setEditableContent(content);
      
      // Reset selection when email changes
      console.log('🔄 Resetting selection state');
      setSelectedBlock(null);
      setEditingImageBlock(null);
    } else {
      console.log('❌ No email HTML to parse');
    }
  }, [email?.html]);

  // Calculate block positions when iframe loads (always in edit mode now)
  useEffect(() => {
    if (parsedEmail && iframeRef.current) {
      calculateBlockPositions();
      
      // Setup click listeners on blocks
      setupBlockListeners();
    }
  }, [parsedEmail, viewMode]);

  const calculateBlockPositions = useCallback(() => {
    if (!iframeRef.current || !parsedEmail) return;

    const iframe = iframeRef.current;
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    
    if (!iframeDoc) return;

    const positions: Record<string, BlockPosition> = {};

    parsedEmail.blocks.forEach((block) => {
      const element = iframeDoc.querySelector(`[data-block-id="${block.id}"]`) as HTMLElement;
      if (element) {
        const rect = element.getBoundingClientRect();
        const iframeRect = iframe.getBoundingClientRect();
        const iframeScrollTop = iframeDoc.documentElement.scrollTop || iframeDoc.body.scrollTop;
        
        positions[block.id] = {
          x: rect.left + iframeRect.left,
          y: rect.top + iframeRect.top - iframeScrollTop,
          width: rect.width,
          height: rect.height
        };
      }
    });

    setBlockPositions(positions);
  }, [parsedEmail]);

  const setupBlockListeners = useCallback((overrideSelectedBlock?: string | null) => {
    const currentSelectedBlock = overrideSelectedBlock !== undefined ? overrideSelectedBlock : selectedBlock;
    
    console.log('🔧 setupBlockListeners called');
    console.log('📊 Current state:', {
      hasIframe: !!iframeRef.current,
      hasParsedEmail: !!parsedEmail,
      selectedBlock: currentSelectedBlock,
      overrideProvided: overrideSelectedBlock !== undefined,
      totalBlocks: parsedEmail?.blocks?.length || 0
    });

    if (!iframeRef.current || !parsedEmail) {
      console.log('❌ Missing iframe or parsedEmail, returning early');
      return;
    }

    const iframe = iframeRef.current;
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    
    if (!iframeDoc) {
      console.log('❌ No iframe document found');
      return;
    }

    console.log('✅ Iframe document found');

    // Remove any existing selection overlays
    const existingOverlays = iframeDoc.querySelectorAll('.untitled88-selection-overlay');
    console.log(`🧹 Removing ${existingOverlays.length} existing overlays`);
    existingOverlays.forEach(overlay => overlay.remove());

    // Add scroll listener to update toolbar positions
    const handleScroll = () => {
      calculateBlockPositions();
    };
    
    iframeDoc.addEventListener('scroll', handleScroll);
    
    // Cleanup function to remove scroll listener
    const cleanup = () => {
      iframeDoc.removeEventListener('scroll', handleScroll);
    };

    console.log(`🔍 Processing ${parsedEmail.blocks.length} blocks`);

    parsedEmail.blocks.forEach((block, index) => {
      console.log(`📦 Processing block ${index + 1}:`, {
        id: block.id,
        type: block.type,
        isSelected: currentSelectedBlock === block.id
      });

      const element = iframeDoc.querySelector(`[data-block-id="${block.id}"]`) as HTMLElement;
      
      if (!element) {
        console.log(`❌ Element not found for block ${block.id}`);
        return;
      }

      console.log(`✅ Element found for block ${block.id}:`, {
        tagName: element.tagName,
        className: element.className,
        hasDataBlockId: element.hasAttribute('data-block-id'),
        hasDataBlockType: element.hasAttribute('data-block-type')
      });

      // Add click listener
      element.onclick = (e) => {
        console.log(`🖱️ Block clicked: ${block.id}`);
        e.preventDefault();
        e.stopPropagation();
        handleBlockSelect(block.id);
      };

      // Add double-click listener for images
      if (block.type === 'image') {
        element.ondblclick = (e) => {
          console.log(`🖱️🖱️ Image double-clicked: ${block.id}`);
          e.preventDefault();
          e.stopPropagation();
          handleImageEdit(block);
        };
      }

      // Handle selection styling
      if (currentSelectedBlock === block.id) {
        console.log(`🎯 Creating selection overlay for selected block: ${block.id}`);
        
        // Create selection overlay that attaches directly to the element
        const overlay = iframeDoc.createElement('div');
        overlay.className = 'untitled88-selection-overlay';
        overlay.style.cssText = `
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          border: 2px solid #3B82F6;
          border-radius: 4px;
          background-color: rgba(59, 130, 246, 0.05);
          pointer-events: none;
          z-index: 1000;
        `;

        console.log('📐 Overlay created with styles:', overlay.style.cssText);

        // Make the element position relative if it's not already positioned
        const computedStyle = iframeDoc.defaultView?.getComputedStyle(element);
        const currentPosition = computedStyle?.position || 'static';
        
        console.log(`📍 Element current position: ${currentPosition}`);
        
        if (currentPosition === 'static') {
          element.style.position = 'relative';
          console.log('✅ Set element position to relative');
        }

        // Append overlay to the element
        element.appendChild(overlay);
        console.log('✅ Overlay appended to element');
        
        // Verify overlay was added
        const addedOverlay = element.querySelector('.untitled88-selection-overlay');
        console.log('🔍 Overlay verification:', {
          overlayExists: !!addedOverlay,
          overlayParent: addedOverlay?.parentElement?.tagName,
          overlayStyles: addedOverlay ? (addedOverlay as HTMLElement).style.cssText : 'N/A'
        });
        
        // Make text elements contenteditable
        if (block.type === 'text' || block.type === 'hero' || block.type === 'header' || block.type === 'footer') {
          const textElement = element.querySelector('h1, h2, h3, p, td, span') as HTMLElement;
          if (textElement) {
            console.log(`📝 Making text element editable for block ${block.id}`);
            textElement.contentEditable = 'true';
            textElement.style.cursor = 'text';
            
            // Listen for content changes
            textElement.oninput = () => {
              setEditableContent((prev) => ({
                ...prev,
                [block.id]: textElement.innerText
              }));
            };
          } else {
            console.log(`⚠️ No text element found for editable block ${block.id}`);
          }
        }
      } else {
        // Remove any existing overlays from this element
        const existingOverlay = element.querySelector('.untitled88-selection-overlay');
        if (existingOverlay) {
          console.log(`🧹 Removing overlay from unselected block ${block.id}`);
          existingOverlay.remove();
        }
        
        // Remove contenteditable
        if (block.type === 'text' || block.type === 'hero' || block.type === 'header' || block.type === 'footer') {
          const textElement = element.querySelector('h1, h2, h3, p, td, span') as HTMLElement;
          if (textElement) {
            textElement.contentEditable = 'false';
            textElement.style.cursor = '';
          }
        }
      }
    });

    console.log('✅ setupBlockListeners completed');

    // Return cleanup function (though it won't be used in this useCallback)
    return cleanup;
  }, [parsedEmail, selectedBlock, calculateBlockPositions]);

  const handleBlockSelect = (blockId: string) => {
    console.log('🎯 handleBlockSelect called:', {
      clickedBlockId: blockId,
      currentSelectedBlock: selectedBlock,
      willToggle: selectedBlock === blockId
    });

    const newSelection = selectedBlock === blockId ? null : blockId;
    console.log('🔄 Setting new selection:', newSelection);
    setSelectedBlock(newSelection);
    
    // Recalculate positions when selection changes (for toolbars)
    setTimeout(() => {
      console.log('⏰ Timeout triggered - recalculating positions and re-setting up listeners');
      calculateBlockPositions();
      // Re-setup listeners to apply new selection styling - pass the new selection directly
      setupBlockListeners(newSelection);
    }, 10);
  };

  const handleImageEdit = (block: EmailBlock) => {
    setEditingImageBlock(block);
  };

  const handleMoveUp = async (blockId: string) => {
    if (!parsedEmail) return;
    
    const blockIndex = parsedEmail.blocks.findIndex((b) => b.id === blockId);
    if (blockIndex <= 0) return;
    
    // Swap blocks - with proper type checking
    const blocks = [...parsedEmail.blocks];
    const currentBlock = blocks[blockIndex];
    const previousBlock = blocks[blockIndex - 1];
    
    if (!currentBlock || !previousBlock) return;
    
    blocks[blockIndex - 1] = currentBlock;
    blocks[blockIndex] = previousBlock;
    
    // Reconstruct HTML (this will need backend support for proper implementation)
    console.log('Move up:', blockId);
    // TODO: Implement move up with backend API
  };

  const handleMoveDown = async (blockId: string) => {
    if (!parsedEmail) return;
    
    const blockIndex = parsedEmail.blocks.findIndex((b) => b.id === blockId);
    if (blockIndex < 0 || blockIndex >= parsedEmail.blocks.length - 1) return;
    
    // Swap blocks - with proper type checking
    const blocks = [...parsedEmail.blocks];
    const currentBlock = blocks[blockIndex];
    const nextBlock = blocks[blockIndex + 1];
    
    if (!currentBlock || !nextBlock) return;
    
    blocks[blockIndex] = nextBlock;
    blocks[blockIndex + 1] = currentBlock;
    
    // Reconstruct HTML (this will need backend support for proper implementation)
    console.log('Move down:', blockId);
    // TODO: Implement move down with backend API
  };

  const handleDelete = async (blockId: string) => {
    if (!parsedEmail || !email?.html) return;
    
    if (!confirm('Are you sure you want to delete this block?')) {
      return;
    }
    
    setIsUpdatingBlock(true);
    
    try {
      // Remove block by setting empty content (backend will handle removal)
      const result = await updateEmailBlock(email.html, blockId, '', {});
      
      if (result.success && result.updated_html) {
        onEmailUpdate(result.updated_html);
        
        const newParsedEmail = emailParser.current.parseEmailToBlocks(result.updated_html);
        setParsedEmail({
          ...newParsedEmail,
          originalHtml: result.updated_html
        });
        
        console.log('✅ Block deleted successfully:', blockId);
      }
      
      setSelectedBlock(null);
    } catch (error) {
      console.error('Error deleting block:', error);
    } finally {
      setIsUpdatingBlock(false);
    }
  };

  const handleStyleChange = async (blockId: string, newStyles: Record<string, string>) => {
    if (!parsedEmail || !email?.html) return;
    
    setIsUpdatingBlock(true);
    
    try {
      const block = parsedEmail.blocks.find((b) => b.id === blockId);
      if (!block) return;
      
      const result = await updateEmailBlock(
        email.html, 
        blockId, 
        editableContent[blockId] || block.content, 
        newStyles
      );
      
      if (result.success && result.updated_html) {
        onEmailUpdate(result.updated_html);
        
        const newParsedEmail = emailParser.current.parseEmailToBlocks(result.updated_html);
        setParsedEmail({
          ...newParsedEmail,
          originalHtml: result.updated_html
        });
        
        console.log('✅ Block styles updated successfully:', blockId);
      }
    } catch (error) {
      console.error('Error updating block styles:', error);
    } finally {
      setIsUpdatingBlock(false);
    }
  };

  const handleContentChange = async (blockId: string, newContent: string) => {
    if (!parsedEmail || !email?.html) return;
    
    setIsUpdatingBlock(true);
    
    try {
      const block = parsedEmail.blocks.find((b) => b.id === blockId);
      if (!block) return;
      
      const result = await updateEmailBlock(
        email.html, 
        blockId, 
        newContent, 
        block.styles
      );
      
      if (result.success && result.updated_html) {
        onEmailUpdate(result.updated_html);
        
        const newParsedEmail = emailParser.current.parseEmailToBlocks(result.updated_html);
        setParsedEmail({
          ...newParsedEmail,
          originalHtml: result.updated_html
        });
        
        console.log('✅ Block content updated successfully:', blockId);
      }
    } catch (error) {
      console.error('Error updating block content:', error);
    } finally {
      setIsUpdatingBlock(false);
    }
  };

  const handleImageSave = async (imageUrl: string, altText: string) => {
    if (!editingImageBlock || !parsedEmail || !email?.html) return;
    
    setIsUpdatingBlock(true);
    
    try {
      const newStyles = {
        ...editingImageBlock.styles,
        alt: altText
      };
      
      const result = await updateEmailBlock(
        email.html,
        editingImageBlock.id,
        imageUrl,
        newStyles
      );
      
      if (result.success && result.updated_html) {
        onEmailUpdate(result.updated_html);
        
        const newParsedEmail = emailParser.current.parseEmailToBlocks(result.updated_html);
        setParsedEmail({
          ...newParsedEmail,
          originalHtml: result.updated_html
        });
        
        console.log('✅ Image updated successfully:', editingImageBlock.id);
      }
      
      setEditingImageBlock(null);
      setSelectedBlock(null);
    } catch (error) {
      console.error('Error updating image:', error);
    } finally {
      setIsUpdatingBlock(false);
    }
  };


  const getPreviewStyles = () => {
    if (viewMode === 'mobile') {
      return {
        width: '375px',
        height: '667px',
        maxHeight: '80vh'
      };
    }
    return {
      width: '100%',
      height: '100%'
    };
  };

  // Debug function to inspect iframe content
  const debugIframeContent = () => {
    if (!iframeRef.current) {
      console.log('❌ No iframe ref');
      return;
    }

    const iframe = iframeRef.current;
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    
    if (!iframeDoc) {
      console.log('❌ No iframe document');
      return;
    }

    console.log('🔍 Iframe content debug:', {
      documentReady: iframeDoc.readyState,
      bodyExists: !!iframeDoc.body,
      elementsWithBlockId: iframeDoc.querySelectorAll('[data-block-id]').length,
      allElements: iframeDoc.querySelectorAll('*').length,
      bodyInnerHTML: iframeDoc.body?.innerHTML?.substring(0, 200) + '...'
    });

    // List all elements with data-block-id
    const blockElements = iframeDoc.querySelectorAll('[data-block-id]');
    console.log('📦 Block elements found:', Array.from(blockElements).map(el => ({
      id: el.getAttribute('data-block-id'),
      type: el.getAttribute('data-block-type'),
      tagName: el.tagName,
      hasOverlay: !!el.querySelector('.untitled88-selection-overlay')
    })));
  };

  const handleIframeLoad = () => {
    console.log('🖼️ Iframe loaded - setting up positions and listeners');
    
    // Debug iframe content immediately
    setTimeout(debugIframeContent, 50);
    
    // Small delay to ensure content is fully rendered
    setTimeout(() => {
      console.log('⏰ Calculating block positions after iframe load');
      calculateBlockPositions();
    }, 100);
    setTimeout(() => {
      console.log('⏰ Setting up block listeners after iframe load');
      setupBlockListeners();
    }, 150);
  };

  if (!email) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Email Selected</h3>
          <p className="text-gray-500">Generate or select an email to preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Email Update Progress Bar */}
      {isUpdating && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
          <div className="flex items-center space-x-3">
            <div className="text-sm font-medium text-blue-900">Updating Your Email</div>
            <div className="flex-1 bg-blue-200 rounded-full h-1.5">
              <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-500" style={{ width: '60%' }}></div>
            </div>
            <div className="text-xs text-blue-700">{updateProgress}</div>
          </div>
        </div>
      )}
      
      {/* Preview Controls */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {email.subject || 'Email Preview'}
            </h2>
            {parsedEmail && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>•</span>
                <span>{parsedEmail.metadata.totalBlocks} editable blocks</span>
                {!parsedEmail.metadata.hasBlocks && (
                  <span className="text-amber-600">• Not editable</span>
                )}
              </div>
            )}
            {/* Always in Edit Mode indicator */}
            <div className="flex items-center space-x-1 text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <span className="font-medium">Edit Mode</span>
            </div>

            {/* Debug Button */}
            <button
              onClick={debugIframeContent}
              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded border hover:bg-gray-200"
            >
              🐛 Debug
            </button>
          </div>

          <div className="flex items-center space-x-3">
            {/* View Mode Buttons */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => onViewModeChange('desktop')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'desktop'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                🖥️ Desktop
              </button>
              <button
                onClick={() => onViewModeChange('mobile')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'mobile'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📱 Mobile
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-auto relative">
        {isUpdatingBlock && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-4 flex items-center space-x-3">
              <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">Updating block...</span>
            </div>
          </div>
        )}
        
        <div
          className="bg-white shadow-lg rounded-lg overflow-visible relative"
          style={getPreviewStyles()}
        >
          {viewMode === 'mobile' && (
            <div className="bg-gray-800 px-4 py-2 flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div className="flex-1 bg-gray-700 rounded px-3 py-1 text-xs text-white">
                Email Preview
              </div>
            </div>
          )}
          
          <div className="h-full overflow-auto relative">
            <iframe
              ref={iframeRef}
              srcDoc={email.html}
              className={`w-full h-full border-0 ${viewMode === 'mobile' ? 'text-sm' : ''}`}
              title="Email Preview"
              sandbox="allow-same-origin allow-scripts"
              onLoad={handleIframeLoad}
            />
          </div>
          
          
          {/* Inline Toolbars - Rendered outside iframe with proper positioning */}
          {parsedEmail && selectedBlock && (
            <>
              {parsedEmail.blocks.map((block) => {
                if (block.id !== selectedBlock) return null;
                
                const position = blockPositions[block.id];
                if (!position) return null;
                
                const blockIndex = parsedEmail.blocks.findIndex((b) => b.id === block.id);
                
                // Calculate toolbar position (above the element, attached to it)
                const toolbarPosition = {
                  x: position.x,
                  y: Math.max(10, position.y - 50), // Ensure it doesn't go off-screen
                  width: position.width
                };
                
                // Show appropriate toolbar based on block type
                if (block.type === 'image') {
                  return (
                    <div
                      key={`toolbar-${block.id}`}
                      className="absolute pointer-events-auto"
                      style={{
                        left: toolbarPosition.x,
                        top: toolbarPosition.y,
                        zIndex: 1000
                      }}
                    >
                      <InlineImageToolbar
                        block={block}
                        position={toolbarPosition}
                        onDelete={() => handleDelete(block.id)}
                        onEdit={() => handleImageEdit(block)}
                      />
                    </div>
                  );
                } else if (block.type === 'text' || block.type === 'hero' || block.type === 'header' || block.type === 'footer') {
                  return (
                    <div
                      key={`toolbar-${block.id}`}
                      className="absolute pointer-events-auto"
                      style={{
                        left: toolbarPosition.x,
                        top: toolbarPosition.y,
                        zIndex: 1000
                      }}
                    >
                      <InlineTextToolbar
                        block={block}
                        position={toolbarPosition}
                        onMoveUp={() => handleMoveUp(block.id)}
                        onMoveDown={() => handleMoveDown(block.id)}
                        onDelete={() => handleDelete(block.id)}
                        onStyleChange={(styles: Record<string, string>) => handleStyleChange(block.id, styles)}
                        onContentChange={(content: string) => handleContentChange(block.id, content)}
                        totalBlocks={parsedEmail.blocks.length}
                        blockIndex={blockIndex}
                      />
                    </div>
                  );
                }
                
                return null;
              })}
            </>
          )}
        </div>
      </div>

      {/* Image Edit Dialog */}
      {editingImageBlock && (
        <ImageEditDialog
          block={editingImageBlock}
          onSave={handleImageSave}
          onClose={() => {
            setEditingImageBlock(null);
            setSelectedBlock(null);
          }}
        />
      )}
    </div>
  );
}
