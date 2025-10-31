/**
 * Modern Black Floating Error Dialog Component
 * Replaces old-fashioned alert() popups with a sleek, modern design
 */

import { useEffect, useState, useCallback } from 'react';

interface ErrorDialogProps {
  isOpen: boolean;
  message?: string;
  onClose: () => void;
  duration?: number; // Auto-close duration in milliseconds
}

export default function ErrorDialog({ 
  isOpen, 
  message = "There was an issue, try again", 
  onClose, 
  duration = 4000 
}: ErrorDialogProps) {
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
            glass-card bg-black/90 backdrop-blur-xl border border-white/10 
            text-white px-6 py-4 rounded-2xl shadow-2xl max-w-md w-full
            transform transition-all duration-300 pointer-events-auto
            ${isVisible 
              ? 'translate-y-0 opacity-100 scale-100' 
              : 'translate-y-4 opacity-0 scale-95'
            }
          `}
          onClick={handleClose}
        >
          {/* Icon */}
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg 
                className="w-6 h-6 text-red-400" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
                />
              </svg>
            </div>
            
            {/* Message */}
            <div className="flex-1">
              <p className="text-white font-medium text-sm">
                {message}
              </p>
            </div>
            
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="flex-shrink-0 text-white/60 hover:text-white transition-colors duration-200"
            >
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="M6 18L18 6M6 6l12 12" 
                />
              </svg>
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-3 w-full bg-white/10 rounded-full h-1 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-red-400 to-red-500 rounded-full animate-pulse"
              style={{
                animation: `shrink ${duration}ms linear forwards`
              }}
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Hook for managing error dialog state
 */
export function useErrorDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState<string>();

  const showError = (errorMessage?: string) => {
    setMessage(errorMessage || "There was an issue, try again");
    setIsOpen(true);
  };

  const hideError = () => {
    setIsOpen(false);
    setMessage(undefined);
  };

  return {
    isOpen,
    message,
    showError,
    hideError
  };
}
