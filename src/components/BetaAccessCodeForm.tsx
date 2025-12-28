/**
 * Beta Access Code Form Component
 * Handles beta access code verification with glass morphism design
 */
import { FaKey } from "react-icons/fa6";

import React, { useState, useRef, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface BetaAccessCodeFormProps {
  onSuccess?: (userData: { email: string; name: string }) => void;
  onClose?: () => void;
  className?: string;
}

export const BetaAccessCodeForm: React.FC<BetaAccessCodeFormProps> = ({
  onSuccess,
  onClose,
  className = ''
}) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleInputChange = (index: number, value: string) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value.slice(-1); // Only take the last character
    setCode(newCode);
    
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
    
    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    
    // Handle paste
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    
    if (pastedData.length === 6) {
      const newCode = pastedData.split('');
      setCode(newCode);
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async () => {
    const accessCode = code.join('');
    
    if (accessCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/beta/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ access_code: accessCode }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setIsSuccess(true);
        
        // Store beta access in localStorage for future checks
        localStorage.setItem('beta_verified', 'true');
        localStorage.setItem('beta_user_email', result.user.email);
        
        setTimeout(() => {
          onSuccess?.(result.user);
        }, 1500);
      } else {
        setError(result.error || 'Invalid access code. Please try again.');
        // Clear the form on error
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className={`glass-card p-8 max-w-md mx-auto ${className}`}>
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h3 className="text-2xl font-bold text-black mb-2">Welcome to Untitled88! 🚀</h3>
          <p className="text-gray-600 mb-4">
            Your access has been verified. Redirecting you to the dashboard...
          </p>
          
          <div className="flex justify-center">
            <LoadingSpinner />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`glass-card p-8 max-w-md mx-auto ${className}`}>
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <FaKey className="w-8 h-8 text-white" />
        </div>
        
        <h2 className="text-2xl font-bold text-black mb-2">Enter Access Code</h2>
        <p className="text-gray-600">
          Check your email for the 6-digit access code
        </p>
      </div>

      <div className="space-y-6">
        {/* Code Input */}
        <div>
          <label className="block text-sm font-medium text-black mb-4 text-center">
            Access Code
          </label>
          
          <div className="flex justify-center space-x-3 mb-4" onPaste={handlePaste}>
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-12 text-center text-xl font-bold glass-input"
                disabled={isSubmitting}
              />
            ))}
          </div>
          
          <p className="text-xs text-gray-500 text-center">
            Paste your code or type each digit
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-800 text-center">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || code.join('').length !== 6}
          className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <LoadingSpinner />
              <span>Verifying...</span>
            </>
          ) : (
            <span>Verify Access Code</span>
          )}
        </button>

        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="btn-ghost w-full"
            disabled={isSubmitting}
          >
            Back
          </button>
        )}
      </div>

      {/* Help Text */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500 mb-2">
          Didn&apos;t receive your code?
        </p>
        <button
          onClick={() => {
            setError('Please check your spam folder or try registering again.');
          }}
          className="text-xs text-blue-600 hover:text-blue-700 underline"
          disabled={isSubmitting}
        >
          Need help?
        </button>
      </div>
    </div>
  );
};
