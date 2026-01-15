/**
 * Beta Registration Form Component
 * Simple email-only beta registration with clean design
 */

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import LoadingSpinner from './LoadingSpinner';

interface BetaRegistrationFormProps {
  onSuccess?: (data: { email: string }) => void;
  onClose?: () => void;
  className?: string;
}

export const BetaRegistrationForm: React.FC<BetaRegistrationFormProps> = ({
  onSuccess,
  onClose,
  className = ''
}) => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);

    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const validateEmail = (): string | null => {
    if (!email.trim()) return 'Email is required';

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateEmail();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/beta/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess({ email: email.trim().toLowerCase() });
        } else {
          // Fallback: redirect to homepage with success query parameter
          router.push('/?betaRegistered=true');
        }
      } else {
        setError(result.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className={`glass-card p-8 max-w-md mx-auto ${className}`}>
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-black mb-2">Join the Waitlist</h2>
        <p className="text-gray-600">
          Be the first to know when we launch
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-black mb-2">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={handleInputChange}
            className="glass-input w-full px-4 py-3 text-black placeholder-gray-500"
            placeholder="your@email.com"
            required
            disabled={isSubmitting}
            autoFocus
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <LoadingSpinner />
              <span>Joining...</span>
            </>
          ) : (
            <span>Join Waitlist</span>
          )}
        </button>

        {/* Close Button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost w-full"
            disabled={isSubmitting}
          >
            Cancel
          </button>
        )}
      </form>

      {/* Privacy Note */}
      <p className="text-xs text-gray-500 text-center mt-4">
        We&apos;ll notify you when we launch. No spam, unsubscribe anytime.
      </p>
    </div>
  );
};
