import React from 'react';

interface IntentConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (intent: 'create' | 'update') => void;
  prompt: string;
  hasExistingEmail: boolean;
  clarificationMessage: string;
}

export default function IntentConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  prompt,
  hasExistingEmail,
  clarificationMessage
}: IntentConfirmationDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 glass-card">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            What would you like me to do?
          </h3>
          
          <p className="text-gray-600 mb-4 text-sm">
            {clarificationMessage}
          </p>
          
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-sm text-gray-700 italic">
              &quot;{prompt}&quot;
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {hasExistingEmail && (
            <button
              onClick={() => onConfirm('update')}
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Update Current Email</span>
            </button>
          )}
          
          <button
            onClick={() => onConfirm('create')}
            className={`w-full px-4 py-3 ${hasExistingEmail ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'} rounded-xl font-medium shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center space-x-2`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Create New Email</span>
          </button>
          
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
