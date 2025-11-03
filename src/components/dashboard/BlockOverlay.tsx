/**
 * Block Overlay Component
 * Displays interactive overlay for editable email blocks
 */

import { EmailBlock } from '@/utils/emailParser';

interface BlockPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface BlockOverlayProps {
  block: EmailBlock;
  position: BlockPosition;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
}

const blockTypeIcons = {
  header: '🏠',
  hero: '🎯',
  text: '📝',
  image: '🖼️',
  button: '🔘',
  divider: '➖',
  footer: '📄'
};

const blockTypeColors = {
  header: 'border-purple-500 bg-purple-50/20',
  hero: 'border-blue-500 bg-blue-50/20',
  text: 'border-green-500 bg-green-50/20',
  image: 'border-orange-500 bg-orange-50/20',
  button: 'border-red-500 bg-red-50/20',
  divider: 'border-gray-500 bg-gray-50/20',
  footer: 'border-indigo-500 bg-indigo-50/20'
};

export default function BlockOverlay({
  block,
  position,
  isSelected,
  onSelect,
  onEdit
}: BlockOverlayProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect();
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit();
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit();
  };

  return (
    <div
      className={`absolute border-2 pointer-events-auto cursor-pointer transition-all duration-200 ${
        isSelected 
          ? blockTypeColors[block.type] || 'border-blue-500 bg-blue-50/20'
          : 'border-transparent hover:border-blue-300 hover:bg-blue-50/10'
      }`}
      style={{
        left: position.x,
        top: position.y,
        width: position.width,
        height: position.height,
        minHeight: '20px'
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      title={`${block.type.toUpperCase()} block - Click to select, double-click to edit`}
    >
      {/* Block Type Indicator */}
      <div 
        className={`absolute -top-6 left-0 px-2 py-1 rounded text-xs font-medium text-white shadow-sm flex items-center space-x-1 ${
          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        } transition-opacity duration-200`}
        style={{
          backgroundColor: isSelected 
            ? getBlockTypeColor(block.type)
            : '#6B7280'
        }}
      >
        <span>{blockTypeIcons[block.type] || '📄'}</span>
        <span>{block.type.toUpperCase()}</span>
      </div>

      {/* Edit Controls */}
      {isSelected && (
        <div className="absolute -top-6 right-0 flex items-center space-x-1">
          <button
            onClick={handleEdit}
            className="w-6 h-6 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors flex items-center justify-center shadow-sm"
            title="Edit this block"
          >
            ✏️
          </button>
        </div>
      )}

      {/* Selection Indicator */}
      {isSelected && (
        <>
          {/* Corner indicators */}
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 rounded-full"></div>
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
          <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 rounded-full"></div>
          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
        </>
      )}

      {/* Content Preview (for very small blocks) */}
      {position.height < 30 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/70 text-white text-xs px-1 rounded">
            {blockTypeIcons[block.type]} {block.type}
          </div>
        </div>
      )}
    </div>
  );
}

function getBlockTypeColor(type: EmailBlock['type']): string {
  const colors = {
    header: '#8B5CF6',
    hero: '#3B82F6',
    text: '#10B981',
    image: '#F97316',
    button: '#EF4444',
    divider: '#6B7280',
    footer: '#6366F1'
  };
  
  return colors[type] || '#6B7280';
}
