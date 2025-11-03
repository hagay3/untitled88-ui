/**
 * Inline Image Toolbar Component
 * Displays a floating toolbar above selected image elements
 */

import { EmailBlock } from '@/utils/emailParser';

interface InlineImageToolbarProps {
  block: EmailBlock;
  position: { x: number; y: number; width: number };
  onDelete: () => void;
  onEdit: () => void;
}

export default function InlineImageToolbar({
  position,
  onDelete,
  onEdit
}: InlineImageToolbarProps) {
  // Calculate toolbar position (above the element)
  const toolbarStyle = {
    left: `${position.x}px`,
    top: `${position.y - 60}px`, // 60px above the element
    minWidth: '120px'
  };

  return (
    <div
      className="absolute z-50 bg-white rounded-lg shadow-2xl border border-gray-200 p-2 flex items-center space-x-1"
      style={toolbarStyle}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Edit/Pencil */}
      <button
        onClick={onEdit}
        className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded transition-colors"
        title="Edit Image"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-300 mx-1"></div>

      {/* Delete */}
      <button
        onClick={onDelete}
        className="p-2 hover:bg-red-50 hover:text-red-600 rounded transition-colors"
        title="Delete Image"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}

