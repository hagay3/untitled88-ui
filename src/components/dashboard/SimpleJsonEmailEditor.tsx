/**
 * Simple JSON-based Email Editor (without drag-and-drop for now)
 * Replaces the HTML-based editing with structured JSON blocks
 */

import React, { useState, useEffect, useCallback } from 'react';
import { EmailStructure, EmailBlock } from '@/types/EmailBlock';
import { emailConverter } from '@/utils/EmailConverter';
import { updateEmailContent } from '@/lib/api';
import MyEmailsSidebar from './MyEmailsSidebar';
import {
  TextBlockComponent,
  ImageBlockComponent,
  ButtonBlockComponent,
  HeaderBlockComponent,
  HeroBlockComponent,
  DividerBlockComponent,
  FooterBlockComponent,
  FeaturesBlockComponent
} from '@/components/email-blocks';
import { sendError } from '@/utils/actions';

interface SimpleJsonEmailEditorProps {
  email: any; // Current email from backend
  viewMode: 'desktop' | 'mobile';
  onViewModeChange: (mode: 'desktop' | 'mobile') => void;
  onEmailUpdate: (updatedHtml: string) => void;
  isUpdating?: boolean;
  updateProgress?: string;
  onExportHtmlReady?: (getExportHtml: () => string) => void; // Callback to provide export function
  onPendingChangesUpdate?: (hasPendingChanges: boolean, pendingCount: number) => void; // Callback for pending changes
  emailHistory?: any[]; // Email history from conversation
  onEmailSelect?: (emailData: any) => void; // Callback when email is selected from sidebar
}

interface SimpleBlockProps {
  block: EmailBlock;
  index: number;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: (blockId: string) => void;
  onUpdate: (blockId: string, updates: Partial<EmailBlock>) => void;
  onDelete: (blockId: string) => void;
  onClone: (blockId: string) => void;
  onMoveUp: (blockId: string) => void;
  onMoveDown: (blockId: string) => void;
  onEditingEnd?: () => void;
  onAlignmentChange: (blockId: string, alignment: 'left' | 'center' | 'right') => void;
  totalBlocks: number;
  availableLogos?: Array<{
    url: string;
    thumbnail_url: string;
    width?: number;
    height?: number;
    size: number;
    format: string;
    index: number;
    original_filename: string;
    source_url?: string;
  }>;
}

// Simple wrapper for email blocks (no drag and drop)
const SimpleBlock: React.FC<SimpleBlockProps> = ({
  block,
  index,
  isSelected,
  isEditing,
  onSelect,
  onUpdate,
  onDelete,
  onClone,
  onMoveUp,
  onMoveDown,
  onEditingEnd,
  onAlignmentChange,
  totalBlocks,
  availableLogos = []
}) => {
  const renderBlock = () => {
    const commonProps = {
      block,
      isSelected,
      isEditing: isEditing && isSelected && (block.blockType === 'text' || block.blockType === 'hero' || block.blockType === 'features'),
      onSelect,
      onUpdate,
      onDelete,
      onClone,
      onMoveUp,
      onMoveDown,
      onEditingEnd,
      onAlignmentChange,
      currentAlignment: block.styles?.textAlign || 'left',
      canMoveUp: index > 0,
      canMoveDown: index < totalBlocks - 1,
      key: block.id, // Force re-render when block ID changes
      availableLogos // Pass available logos to image-based components
    };

    switch (block.blockType) {
      case 'header':
        return <HeaderBlockComponent {...commonProps} block={block} />;
      case 'text':
        return <TextBlockComponent {...commonProps} block={block} />;
      case 'image':
        return <ImageBlockComponent {...commonProps} block={block} />;
      case 'button':
        return <ButtonBlockComponent {...commonProps} block={block} />;
      case 'hero':
        return <HeroBlockComponent {...commonProps} block={block} />;
      case 'divider':
        return <DividerBlockComponent {...commonProps} block={block} />;
      case 'footer':
        return <FooterBlockComponent {...commonProps} block={block} />;
      case 'features':
        return <FeaturesBlockComponent {...commonProps} block={block} />;
      default:
        return <div className="p-4 bg-red-50 border border-red-200 rounded">Unknown Block Type</div>;
    }
  };

  return (
    <div className="mb-2" key={`${block.id}-wrapper`}>
      {renderBlock()}
    </div>
  );
};

export const SimpleJsonEmailEditor: React.FC<SimpleJsonEmailEditorProps> = ({
  email,
  viewMode,
  onViewModeChange,
  onEmailUpdate,
  onExportHtmlReady,
  onPendingChangesUpdate,
  emailHistory = [],
  onEmailSelect
}) => {
  // Local state management (immediate, never blocked)
  const [emailStructure, setEmailStructure] = useState<EmailStructure | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [isEditingText, setIsEditingText] = useState(false);
  const [currentEmailId, setCurrentEmailId] = useState<string | null>(null);
  
  // My Emails sidebar state
  const [showMyEmailsSidebar, setShowMyEmailsSidebar] = useState(false);
  
  // Background sync management (async, non-blocking)
  const [backgroundSyncQueue, setBackgroundSyncQueue] = useState<EmailStructure[]>([]);
  const [isSyncingToBackend, setIsSyncingToBackend] = useState(false);
  
  // Export-ready HTML (generated from current local state)
  const [exportReadyHtml, setExportReadyHtml] = useState<string>('');

  // Load JSON structure when email changes
  useEffect(() => {
    // Check if we have a new email (different message_id or first load)
    const isNewEmail = email?.message_id && email.message_id !== currentEmailId;
    
    if (isNewEmail && email?.email_json) {
      try {
        let structure: EmailStructure;
        
        // Parse email_json (always available from API)
        if (typeof email.email_json === 'string') {
          structure = JSON.parse(email.email_json);
        } else {
          structure = email.email_json;
        }
        
        // IMPORTANT: Preserve url_extraction_info from the original email object
        // This contains all_logo_urls and other metadata that's not in the JSON
        if (email.url_extraction_info) {
          (structure as any).url_extraction_info = email.url_extraction_info;
        }
        
        // Update all state for the new email
        setEmailStructure(structure);
        setCurrentEmailId(email.message_id);
        
        // Clear any pending updates when switching emails
        setBackgroundSyncQueue([]);
        setIsSyncingToBackend(false);
        
        // Reset selection state
        setSelectedBlockId(null);
        setIsEditingText(false);
        
        // Generate initial export-ready HTML
        const initialHtml = emailConverter.jsonToHtml(structure);
        setExportReadyHtml(initialHtml);
      } catch (error) {
        sendError("unknown", "Failed to load email JSON", error);
        
      }
    }
  }, [email?.message_id, email?.email_json, currentEmailId]);

  // Update export-ready HTML immediately when local state changes (non-blocking)
  const updateExportHtml = useCallback((structure: EmailStructure) => {
    try {
      const updatedHtml = emailConverter.jsonToHtml(structure);
      setExportReadyHtml(updatedHtml);
    } catch (error) {
    }
  }, []);

  // Background sync to backend (async, non-blocking)
  const processBackgroundSync = useCallback(async () => {
    if (isSyncingToBackend || backgroundSyncQueue.length === 0 || !email?.message_id) return;

    setIsSyncingToBackend(true);

    try {
      // Get the latest update from the queue (most recent state)
      const latestStructure = backgroundSyncQueue[backgroundSyncQueue.length - 1];
      if (!latestStructure) {
        return;
      }
      
      const updatedHtml = emailConverter.jsonToHtml(latestStructure);
      
      // Update parent component (for preview)
      onEmailUpdate(updatedHtml);
      
      // Sync with backend (this is async and won't block user actions)
      await updateEmailContent(email.message_id, latestStructure, 'Updated via JSON editor');
      
      // Clear the queue after successful update
      setBackgroundSyncQueue([]);
    } catch (error) {
      // Keep the queue for retry, but remove the first item to prevent infinite loops
      setBackgroundSyncQueue(prev => prev.slice(1));
    } finally {
      setIsSyncingToBackend(false);
    }
  }, [isSyncingToBackend, backgroundSyncQueue, email?.message_id, onEmailUpdate]);

  // Process background sync when new items are added (debounced)
  useEffect(() => {
    if (backgroundSyncQueue.length > 0 && !isSyncingToBackend) {
      // Debounce rapid updates - wait 1000ms before syncing to backend
      const timer = setTimeout(processBackgroundSync, 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [backgroundSyncQueue, isSyncingToBackend, processBackgroundSync]);

  // Notify parent about pending changes
  useEffect(() => {
    const hasPending = backgroundSyncQueue.length > 0 || isSyncingToBackend;
    const pendingCount = backgroundSyncQueue.length;
    
    if (onPendingChangesUpdate) {
      onPendingChangesUpdate(hasPending, pendingCount);
    }
  }, [backgroundSyncQueue.length, isSyncingToBackend, onPendingChangesUpdate]);

  // Queue background sync (async, non-blocking)
  const queueBackgroundSync = useCallback((structure: EmailStructure) => {
    setBackgroundSyncQueue(prev => [...prev, structure]);
  }, []);

  // Export function - always returns current local state as HTML
  const getExportHtml = useCallback(() => {
    
    // Log both JSON and HTML after export
    //convert to string
    
    return exportReadyHtml || '';
  }, [exportReadyHtml, emailStructure]);

  // Provide export function to parent component
  useEffect(() => {
    if (onExportHtmlReady && exportReadyHtml) {
      onExportHtmlReady(getExportHtml);
    }
  }, [onExportHtmlReady, getExportHtml, exportReadyHtml]);

  const handleBlockUpdate = useCallback((blockId: string, updates: Partial<EmailBlock>) => {
    if (!emailStructure) return;

    const updatedBlocks = emailStructure.blocks.map(block =>
      block.id === blockId ? { ...block, ...updates } as EmailBlock : block
    );

    const updatedStructure: EmailStructure = {
      ...emailStructure,
      blocks: updatedBlocks
    };

    
    // 1. Update local state immediately (never blocked)
    setEmailStructure(updatedStructure);
    
    // 2. Update export-ready HTML immediately (never blocked)
    updateExportHtml(updatedStructure);
    
    // 3. Queue background sync (async, non-blocking)
    queueBackgroundSync(updatedStructure);
  }, [emailStructure, updateExportHtml, queueBackgroundSync]);

  const handleBlockDelete = useCallback((blockId: string) => {
    if (!emailStructure) return;
    
    if (!confirm('Are you sure you want to delete this block?')) {
      return;
    }

    const updatedBlocks = emailStructure.blocks.filter(block => block.id !== blockId);
    
    // Reorder remaining blocks
    const reorderedBlocks = updatedBlocks.map((block, index) => ({
      ...block,
      orderId: index + 1
    }));

    const updatedStructure: EmailStructure = {
      ...emailStructure,
      blocks: reorderedBlocks
    };

    // 1. Update local state immediately
    setEmailStructure(updatedStructure);
    setSelectedBlockId(null);
    
    // 2. Update export-ready HTML immediately
    updateExportHtml(updatedStructure);
    
    // 3. Queue background sync
    queueBackgroundSync(updatedStructure);
  }, [emailStructure, updateExportHtml, queueBackgroundSync]);

  const handleBlockClone = useCallback((blockId: string) => {
    if (!emailStructure) return;

    const blockIndex = emailStructure.blocks.findIndex(b => b.id === blockId);
    if (blockIndex === -1) return;

    const blockToClone = emailStructure.blocks[blockIndex];
    if (!blockToClone) return;
    
    // Create a deep copy of the block with all properties
    const clonedBlock = {
      ...blockToClone,
      id: `${blockToClone.id}-clone-${Date.now()}`, // Generate unique ID
      blockType: blockToClone.blockType, // Preserve block type
      orderId: blockToClone.orderId + 1, // Place right after the original
      content: { ...blockToClone.content }, // Deep copy content
      styles: { ...blockToClone.styles } // Deep copy styles
    } as EmailBlock;

    // Insert the cloned block right after the original
    const updatedBlocks = [
      ...emailStructure.blocks.slice(0, blockIndex + 1),
      clonedBlock,
      ...emailStructure.blocks.slice(blockIndex + 1)
    ];

    // Reorder all blocks to maintain sequential orderIds
    const reorderedBlocks = updatedBlocks.map((block, index) => ({
      ...block,
      orderId: index + 1
    }));

    const updatedStructure: EmailStructure = {
      ...emailStructure,
      blocks: reorderedBlocks
    };

    // 1. Update local state immediately
    setEmailStructure(updatedStructure);
    setSelectedBlockId(clonedBlock.id); // Select the cloned block
    
    // 2. Update export-ready HTML immediately
    updateExportHtml(updatedStructure);
    
    // 3. Queue background sync
    queueBackgroundSync(updatedStructure);
  }, [emailStructure, updateExportHtml, queueBackgroundSync]);

  const handleBlockMoveUp = useCallback((blockId: string) => {
    if (!emailStructure) return;

    const blockIndex = emailStructure.blocks.findIndex(b => b.id === blockId);
    if (blockIndex <= 0) return;

    const blocks = [...emailStructure.blocks];
    const temp = blocks[blockIndex - 1];
    const current = blocks[blockIndex];
    if (temp && current) {
      blocks[blockIndex - 1] = current;
      blocks[blockIndex] = temp;
    }

    // Update orderIds
    const reorderedBlocks = blocks.map((block, index) => ({
      ...block,
      orderId: index + 1
    }));

    const updatedStructure: EmailStructure = {
      ...emailStructure,
      blocks: reorderedBlocks
    };

    // 1. Update local state immediately
    setEmailStructure(updatedStructure);
    
    // 2. Update export-ready HTML immediately
    updateExportHtml(updatedStructure);
    
    // 3. Queue background sync
    queueBackgroundSync(updatedStructure);
  }, [emailStructure, updateExportHtml, queueBackgroundSync]);

  const handleBlockMoveDown = useCallback((blockId: string) => {
    if (!emailStructure) return;

    const blockIndex = emailStructure.blocks.findIndex(b => b.id === blockId);
    if (blockIndex < 0 || blockIndex >= emailStructure.blocks.length - 1) return;

    const blocks = [...emailStructure.blocks];
    const current = blocks[blockIndex];
    const next = blocks[blockIndex + 1];
    if (current && next) {
      blocks[blockIndex] = next;
      blocks[blockIndex + 1] = current;
    }

    // Update orderIds
    const reorderedBlocks = blocks.map((block, index) => ({
      ...block,
      orderId: index + 1
    }));

    const updatedStructure: EmailStructure = {
      ...emailStructure,
      blocks: reorderedBlocks
    };

    // 1. Update local state immediately
    setEmailStructure(updatedStructure);
    
    // 2. Update export-ready HTML immediately
    updateExportHtml(updatedStructure);
    
    // 3. Queue background sync
    queueBackgroundSync(updatedStructure);
  }, [emailStructure, updateExportHtml, queueBackgroundSync]);

  const handleBlockSelect = useCallback((blockId: string) => {
    setSelectedBlockId(selectedBlockId === blockId ? null : blockId);
    
    // Enable text editing for text-like blocks
    const block = emailStructure?.blocks.find(b => b.id === blockId);
    if (block && (block.blockType === 'text' || block.blockType === 'hero')) {
      setIsEditingText(true);
    } else {
      setIsEditingText(false);
    }
  }, [selectedBlockId, emailStructure]);

  // Handle alignment changes
  const handleAlignmentChange = useCallback((blockId: string, alignment: 'left' | 'center' | 'right') => {
    if (!emailStructure) return;

    const updatedBlocks = emailStructure.blocks.map(block => {
      if (block.id === blockId) {
        // Log alignment changes for debugging
        
        return { 
          ...block, 
          styles: { 
            ...block.styles, 
            textAlign: alignment 
          } 
        } as EmailBlock;
      }
      return block;
    });

    const updatedStructure: EmailStructure = {
      ...emailStructure,
      blocks: updatedBlocks
    };

    // 1. Update local state immediately
    setEmailStructure(updatedStructure);
    
    // 2. Update export-ready HTML immediately
    updateExportHtml(updatedStructure);
    
    // 3. Queue background sync
    queueBackgroundSync(updatedStructure);
  }, [emailStructure, updateExportHtml, queueBackgroundSync]);

  // Handle click outside to deselect
  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedBlockId(null);
      setIsEditingText(false);
    }
  }, []);



  const getPreviewStyles = () => {
    if (viewMode === 'mobile') {
      return {
        width: '450px', // 20% wider than 375px
        height: '667px',
        maxHeight: '80vh'
      };
    }
    return {
      width: '720px', // 20% wider than 600px
      height: '100%',
      maxWidth: '100%' // Ensure it doesn't overflow on smaller screens
    };
  };

  // Show empty state when no email exists
  if (!email) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 mx-auto mb-6 text-gray-300">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-3">No Email Selected</h3>
          <p className="text-gray-500 mb-6">
            Create a new email using AI or select an existing email from your history to start editing.
          </p>
          <div className="space-y-2 text-sm text-gray-400">
            <p>💡 Try asking AI: &ldquo;Create a welcome email for new subscribers&rdquo;</p>
            <p>📧 Or browse your email history on the left</p>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state when email exists but structure is being loaded
  if (!emailStructure) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 animate-spin">
            <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Email...</h3>
          <p className="text-gray-500">Loading email structure</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">

      {/* Preview Controls */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {emailStructure.subject || email?.subject || email?.message_subject || 'Email Preview'}
            </h2>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>•</span>
              <span>{emailStructure.blocks.length} blocks</span>
            </div>
            <div className="flex items-center space-x-1 text-sm bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Pending Changes Indicator */}
            {(isSyncingToBackend || backgroundSyncQueue.length > 0) && (
              <div className="flex items-center space-x-2 text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                <span>{backgroundSyncQueue.length} change{backgroundSyncQueue.length > 1 ? 's' : ''} saving</span>
              </div>
            )}

            {/* My Emails Button */}
            <button
              onClick={() => setShowMyEmailsSidebar(true)}
              className="flex items-center space-x-2 px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              title="View all your generated emails"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>My emails</span>
            </button>

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
        <div
          className="bg-white shadow-lg rounded-lg overflow-visible relative"
          style={getPreviewStyles()}
          onClick={handleContainerClick}
        >
      

          <div className="h-full overflow-auto">
            <div className="space-y-2 p-4 pt-16" key={`email-blocks-${currentEmailId}`}>
              {emailStructure.blocks
                .sort((a, b) => a.orderId - b.orderId)
                .map((block, index) => {
                  // Extract available logos from url_extraction_info if available
                  const availableLogos = (emailStructure as any).url_extraction_info?.all_logo_urls || [];
                  
                  
                  return (
                    <SimpleBlock
                      key={`${currentEmailId}-${block.id}`}
                      block={block}
                      index={index}
                      isSelected={selectedBlockId === block.id}
                      isEditing={isEditingText}
                      onSelect={handleBlockSelect}
                      onUpdate={handleBlockUpdate}
                      onDelete={handleBlockDelete}
                      onClone={handleBlockClone}
                      onMoveUp={handleBlockMoveUp}
                      onMoveDown={handleBlockMoveDown}
                      onEditingEnd={() => setIsEditingText(false)}
                      onAlignmentChange={handleAlignmentChange}
                      totalBlocks={emailStructure.blocks.length}
                      availableLogos={availableLogos}
                    />
                  );
                })}
            </div>
          </div>
        </div>

      </div>

      {/* My Emails Sidebar */}
      <MyEmailsSidebar
        isOpen={showMyEmailsSidebar}
        onClose={() => setShowMyEmailsSidebar(false)}
        emailHistory={emailHistory}
        onEmailSelect={(emailData) => {
          if (onEmailSelect) {
            onEmailSelect(emailData);
          }
        }}
        currentEmailId={email?.message_id}
      />
    </div>
  );
};
