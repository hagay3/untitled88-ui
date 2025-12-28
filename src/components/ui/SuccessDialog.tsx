/**
 * Modern Success Dialog Component
 * Shows success messages with a sleek, modern design
 */

import { useEffect, useState, useCallback } from 'react';

interface SuccessDialogProps {
  isOpen: boolean;
  message?: string;
  onClose: () => void;
  duration?: number; // Auto-close duration in milliseconds
}

export default function SuccessDialog({ 
  isOpen, 
  message = "Success!", 
  onClose, 
  duration = 5000 
}: SuccessDialogProps) {
  const [isVisible, setIsVisible] = useState(false);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300); // Wait for animation to complete
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      
      // Auto-close after duration
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      return undefined;
    }
  }, [isOpen, duration, handleClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/20 transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      />
      
      {/* Dialog Container */}
      <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className={`
            glass-card bg-white/95 backdrop-blur-xl border border-gray-200 
            text-gray-900 px-8 py-6 rounded-2xl shadow-2xl max-w-md w-full
            transform transition-all duration-300 pointer-events-auto
            ${isVisible 
              ? 'translate-y-0 opacity-100 scale-100' 
              : 'translate-y-4 opacity-0 scale-95'
            }
          `}
        >
          {/* Icon */}
          <div className="flex flex-col items-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center mb-4">
              <svg 
                className="w-8 h-8 text-white" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="M5 13l4 4L19 7" 
                />
              </svg>
            </div>
            
            {/* Message */}
            <p className="text-gray-900 font-medium text-center text-lg">
              {message}
            </p>
          </div>
          
          {/* Close Button */}
          <div className="flex justify-center mt-4">
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors duration-200 font-medium"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook for managing success dialog state
 */
export function useSuccessDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState<string>();

  const showSuccess = (successMessage?: string) => {
    setMessage(successMessage || "Success!");
    setIsOpen(true);
  };

  const hideSuccess = () => {
    setIsOpen(false);
    setMessage(undefined);
  };

  return {
    isOpen,
    message,
    showSuccess,
    hideSuccess
  };
}

