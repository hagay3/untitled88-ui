/**
 * Beta Registration Form Component
 * Handles beta access registration with glass morphism design
 */

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import LoadingSpinner from './LoadingSpinner';

interface BetaRegistrationFormProps {
  onSuccess?: (data: { email: string; name: string }) => void;
  onClose?: () => void;
  className?: string;
}

interface FormData {
  email: string;
  name: string;
  company: string;
  role: string;
  reason: string;
  country: string;
}

export const BetaRegistrationForm: React.FC<BetaRegistrationFormProps> = ({
  onSuccess,
  onClose,
  className = ''
}) => {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    email: '',
    name: '',
    company: '',
    role: '',
    reason: '',
    country: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const validateForm = (): string | null => {
    if (!formData.email.trim()) return 'Email is required';
    if (!formData.name.trim()) return 'Name is required';
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return 'Please enter a valid email address';
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
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
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess({ email: formData.email, name: formData.name });
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
        <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-black mb-2">Join the Beta</h2>
        <p className="text-gray-600">
          Get early access
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-black mb-2">
            Email Address *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="glass-input w-full px-4 py-3 text-black placeholder-gray-500"
            placeholder="your@email.com"
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-black mb-2">
            Full Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="glass-input w-full px-4 py-3 text-black placeholder-gray-500"
            placeholder="John Doe"
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Company Field */}
        <div>
          <label htmlFor="company" className="block text-sm font-medium text-black mb-2">
            Company
          </label>
          <input
            type="text"
            id="company"
            name="company"
            value={formData.company}
            onChange={handleInputChange}
            className="glass-input w-full px-4 py-3 text-black placeholder-gray-500"
            placeholder="Your Company"
            disabled={isSubmitting}
          />
        </div>

        {/* Country Field */}
        <div>
          <label htmlFor="country" className="block text-sm font-medium text-black mb-2">
            Country
          </label>
          <select
            id="country"
            name="country"
            value={formData.country}
            onChange={handleInputChange}
            className="glass-input w-full px-4 py-3 text-black"
            disabled={isSubmitting}
          >
            <option value="">Select your country</option>
            <option value="United States">United States</option>
            <option value="United Kingdom">United Kingdom</option>
            <option value="Canada">Canada</option>
            <option value="Australia">Australia</option>
            <option value="Germany">Germany</option>
            <option value="France">France</option>
            <option value="Spain">Spain</option>
            <option value="Italy">Italy</option>
            <option value="Netherlands">Netherlands</option>
            <option value="Belgium">Belgium</option>
            <option value="Switzerland">Switzerland</option>
            <option value="Austria">Austria</option>
            <option value="Sweden">Sweden</option>
            <option value="Norway">Norway</option>
            <option value="Denmark">Denmark</option>
            <option value="Finland">Finland</option>
            <option value="Poland">Poland</option>
            <option value="Ireland">Ireland</option>
            <option value="Portugal">Portugal</option>
            <option value="Greece">Greece</option>
            <option value="Czech Republic">Czech Republic</option>
            <option value="Romania">Romania</option>
            <option value="Hungary">Hungary</option>
            <option value="Israel">Israel</option>
            <option value="India">India</option>
            <option value="Japan">Japan</option>
            <option value="South Korea">South Korea</option>
            <option value="Singapore">Singapore</option>
            <option value="Hong Kong">Hong Kong</option>
            <option value="China">China</option>
            <option value="Brazil">Brazil</option>
            <option value="Mexico">Mexico</option>
            <option value="Argentina">Argentina</option>
            <option value="Chile">Chile</option>
            <option value="Colombia">Colombia</option>
            <option value="South Africa">South Africa</option>
            <option value="Nigeria">Nigeria</option>
            <option value="Kenya">Kenya</option>
            <option value="Egypt">Egypt</option>
            <option value="United Arab Emirates">United Arab Emirates</option>
            <option value="Saudi Arabia">Saudi Arabia</option>
            <option value="Turkey">Turkey</option>
            <option value="Russia">Russia</option>
            <option value="Ukraine">Ukraine</option>
            <option value="New Zealand">New Zealand</option>
            <option value="Indonesia">Indonesia</option>
            <option value="Malaysia">Malaysia</option>
            <option value="Thailand">Thailand</option>
            <option value="Vietnam">Vietnam</option>
            <option value="Philippines">Philippines</option>
            <option value="Pakistan">Pakistan</option>
            <option value="Bangladesh">Bangladesh</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Role Field */}
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-black mb-2">
            Role
          </label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleInputChange}
            className="glass-input w-full px-4 py-3 text-black"
            disabled={isSubmitting}
          >
            <option value="">Select your role</option>
            <option value="BI Developer">BI Developer</option>
            <option value="Data Engineer">Data Engineer</option>
            <option value="Data Analyst">Data Analyst</option>
            <option value="Data Scientist">Data Scientist</option>
            <option value="Analytics Engineer">Analytics Engineer</option>
            <option value="Business Intelligence Manager">Business Intelligence Manager</option>
            <option value="Data Architect">Data Architect</option>
            <option value="ETL Developer">ETL Developer</option>
            <option value="Data Warehouse Developer">Data Warehouse Developer</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Reason Field */}
        <div>
          <label htmlFor="reason" className="block text-sm font-medium text-black mb-2">
            Why do you want to try Untitled88?
          </label>
          <textarea
            id="reason"
            name="reason"
            value={formData.reason}
            onChange={handleInputChange}
            rows={3}
            className="glass-input w-full px-4 py-3 text-black placeholder-gray-500 resize-none"
            placeholder="Tell us what you're looking for in a BI tool powered by AI"
            disabled={isSubmitting}
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
              <span>Joining Beta...</span>
            </>
          ) : (
            <span>Join Beta Program</span>
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
        By joining, you agree to receive beta updates and product communications. 
        We respect your privacy and won&apos;t spam you.
      </p>
    </div>
  );
};
