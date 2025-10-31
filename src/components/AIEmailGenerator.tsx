import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { aiAPI, EmailGenerationResponse, EmailSuggestionsResponse, TEXT_LIMITS } from '@/lib/api';
import ErrorDialog, { useErrorDialog } from '@/components/ui/ErrorDialog';

interface AIEmailGeneratorProps {
  onEmailGenerated?: (emailData: any) => void;
  existingEmailHtml?: string;
  mode?: 'create' | 'update';
}

interface RateLimitInfo {
  requests_remaining: number;
  hourly_limit: number;
  daily_limit: number;
  hourly_usage: number;
  daily_usage: number;
  rate_limited: boolean;
  next_reset?: string;
}

export default function AIEmailGenerator({ 
  onEmailGenerated, 
  existingEmailHtml, 
  mode = 'create' 
}: AIEmailGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<EmailSuggestionsResponse | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null);
  const { isOpen: errorDialogOpen, message: errorMessage, showError, hideError } = useErrorDialog();
  const [textValidation, setTextValidation] = useState({
    isValid: true,
    message: '',
    charCount: 0,
    showWarning: false
  });

  // Text validation
  const validateText = useCallback((text: string) => {
    const charCount = text.length;
    const isValid = charCount >= TEXT_LIMITS.MIN_PROMPT_LENGTH && charCount <= TEXT_LIMITS.MAX_PROMPT_LENGTH;
    const showWarning = charCount >= TEXT_LIMITS.WARNING_THRESHOLD;
    
    let message = '';
    if (charCount < TEXT_LIMITS.MIN_PROMPT_LENGTH) {
      message = `Minimum ${TEXT_LIMITS.MIN_PROMPT_LENGTH} characters required`;
    } else if (charCount > TEXT_LIMITS.MAX_PROMPT_LENGTH) {
      message = `Maximum ${TEXT_LIMITS.MAX_PROMPT_LENGTH} characters allowed`;
    } else if (showWarning) {
      message = `Approaching character limit (${TEXT_LIMITS.MAX_PROMPT_LENGTH - charCount} remaining)`;
    } else {
      message = `${charCount}/${TEXT_LIMITS.MAX_PROMPT_LENGTH} characters`;
    }

    setTextValidation({
      isValid,
      message,
      charCount,
      showWarning
    });
  }, []);

  // Handle prompt change with validation
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newPrompt = e.target.value;
    setPrompt(newPrompt);
    validateText(newPrompt);
  };

  // Load suggestions and check for stored prompt on component mount
  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const response = await aiAPI.getEmailSuggestions();
        setSuggestions(response);
      } catch (error) {
        console.error('Failed to load suggestions:', error);
      }
    };

    // Check for stored prompt from homepage
    const storedPrompt = sessionStorage.getItem('emailPrompt');
    if (storedPrompt) {
      setPrompt(storedPrompt);
      validateText(storedPrompt);
      sessionStorage.removeItem('emailPrompt');
    }

    loadSuggestions();
  }, [validateText]);

  // Load rate limit status
  const loadRateLimitStatus = useCallback(async () => {
    try {
      const response = await aiAPI.checkRateLimit();
      if (response.success && response.endpoints) {
        const endpoint = mode === 'create' ? 'ai_generation' : 'ai_quick_generation';
        setRateLimitInfo(response.endpoints[endpoint] || null);
      }
    } catch (error) {
      console.error('Failed to load rate limit status:', error);
    }
  }, [mode]);

  useEffect(() => {
    loadRateLimitStatus();
  }, [loadRateLimitStatus]);

  // Generate email
  const handleGenerate = async () => {
    if (!textValidation.isValid || !prompt.trim()) {
      showError('Please enter a valid prompt');
      return;
    }

    if (rateLimitInfo?.rate_limited) {
      showError('Rate limit exceeded. Please wait before making another request.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response: EmailGenerationResponse = await aiAPI.quickEmailGeneration({
        user_prompt: prompt,
        email_type: mode,
        existing_email_html: existingEmailHtml
      });

      if (response.success && response.data) {
        setGeneratedEmail(response.data);
        if (onEmailGenerated) {
          onEmailGenerated(response.data);
        }
        // Refresh rate limit status
        loadRateLimitStatus();
      } else {
        showError(response.error || 'Failed to generate email');
        
        // Handle rate limit errors specifically
        if (response.error?.includes('rate_limit') || response.error?.includes('limit_exceeded')) {
          loadRateLimitStatus();
        }
      }
    } catch (error: any) {
      console.error('Email generation error:', error);
      showError(error.message || 'Failed to generate email');
    } finally {
      setIsGenerating(false);
    }
  };


  // Clear generated email
  const handleClear = () => {
    setGeneratedEmail(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Rate Limit Status */}
      {rateLimitInfo && (
        <Card className={`${rateLimitInfo.rate_limited ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50'}`}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <span className={rateLimitInfo.rate_limited ? 'text-red-700' : 'text-blue-700'}>
                  {rateLimitInfo.rate_limited ? '⚠️ Rate Limited' : '✅ Available'}
                </span>
                <span className="text-gray-600">
                  {rateLimitInfo.requests_remaining} requests remaining
                </span>
              </div>
              <div className="text-gray-500 text-xs">
                Usage: {rateLimitInfo.hourly_usage}/{rateLimitInfo.hourly_limit} hourly, {rateLimitInfo.daily_usage}/{rateLimitInfo.daily_limit} daily
              </div>
            </div>
            {rateLimitInfo.rate_limited && rateLimitInfo.next_reset && (
              <div className="mt-2 text-xs text-red-600">
                Resets at: {new Date(rateLimitInfo.next_reset).toLocaleTimeString()}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Generator */}
      <Card>
        <CardHeader>
          <CardTitle>
            {mode === 'create' ? 'Create New Email' : 'Update Email'} with AI
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Prompt Input */}
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
              Describe your email
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={handlePromptChange}
              placeholder={mode === 'create' 
                ? "Describe the email you want to create. For example: 'Create a professional newsletter for a tech startup with sections for product updates, team highlights, and industry news. Use a clean, modern design with blue and white colors.'"
                : "Describe what you want to change in the existing email. For example: 'Change the color scheme to blue and white, and add a new section for customer testimonials.'"
              }
              className={`w-full h-32 px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                !textValidation.isValid 
                  ? 'border-red-300 focus:ring-red-500' 
                  : textValidation.showWarning 
                    ? 'border-yellow-300 focus:ring-yellow-500'
                    : 'border-gray-300'
              }`}
              disabled={isGenerating}
            />
            <div className={`mt-1 text-xs flex justify-between ${
              !textValidation.isValid 
                ? 'text-red-600' 
                : textValidation.showWarning 
                  ? 'text-yellow-600'
                  : 'text-gray-500'
            }`}>
              <span>{textValidation.message}</span>
              {textValidation.showWarning && (
                <span>⚠️ Approaching limit</span>
              )}
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !textValidation.isValid || !prompt.trim() || rateLimitInfo?.rate_limited}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Generating Email...</span>
              </div>
            ) : (
              `${mode === 'create' ? 'Create' : 'Update'} Email with AI`
            )}
          </Button>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Suggestions */}
      {suggestions && suggestions.success && !generatedEmail && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Email Template Suggestions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {suggestions.categories?.map(category => (
                <div key={category} className="space-y-2">
                  <h4 className="font-medium text-gray-900 capitalize">{category}</h4>
                  <div className="grid gap-2">
                    {suggestions.all_suggestions?.[category]?.examples.slice(0, 2).map((example, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setPrompt(example.prompt);
                          validateText(example.prompt);
                        }}
                        className="text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                        disabled={isGenerating}
                      >
                        <div className="font-medium text-sm text-gray-900">{example.title}</div>
                        <div className="text-xs text-gray-600 mt-1 line-clamp-2">{example.prompt}</div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {example.features.slice(0, 3).map((feature, featureIndex) => (
                            <span key={featureIndex} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              {feature}
                            </span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated Email Display */}
      {generatedEmail && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Generated Email</CardTitle>
            <Button variant="outline" onClick={handleClear} size="sm">
              Clear
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Email Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="text-sm font-medium text-gray-700">Subject Line</label>
                <p className="text-sm text-gray-900">{generatedEmail.email_subject}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Preheader Text</label>
                <p className="text-sm text-gray-900">{generatedEmail.preheader_text}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Mobile Optimized</label>
                <p className="text-sm text-gray-900">
                  {generatedEmail.mobile_optimized ? '✅ Yes' : '❌ No'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Estimated Size</label>
                <p className="text-sm text-gray-900">{generatedEmail.estimated_size_kb || 'N/A'}</p>
              </div>
            </div>

            {/* Design Notes */}
            {generatedEmail.design_notes && (
              <div>
                <label className="text-sm font-medium text-gray-700">Design Notes</label>
                <p className="text-sm text-gray-600 mt-1">{generatedEmail.design_notes}</p>
              </div>
            )}

            {/* Features and Colors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {generatedEmail.key_features && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Key Features</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {generatedEmail.key_features.map((feature: string, index: number) => (
                      <span key={index} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {generatedEmail.color_palette && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Color Palette</label>
                  <div className="flex gap-2 mt-1">
                    {generatedEmail.color_palette.map((color: string, index: number) => (
                      <div key={index} className="flex items-center space-x-1">
                        <div 
                          className="w-4 h-4 rounded border border-gray-300"
                          style={{ backgroundColor: color }}
                        ></div>
                        <span className="text-xs text-gray-600">{color}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* HTML Preview */}
            <div>
              <label className="text-sm font-medium text-gray-700">Email HTML</label>
              <div className="mt-2 border rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-3 py-2 border-b">
                  <span className="text-xs text-gray-600">HTML Preview</span>
                </div>
                <div className="max-h-96 overflow-auto">
                  <iframe
                    srcDoc={generatedEmail.email_html || generatedEmail.updated_email_html}
                    className="w-full h-96 border-0"
                    title="Email Preview"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Dialog */}
      <ErrorDialog
        isOpen={errorDialogOpen}
        message={errorMessage}
        onClose={hideError}
      />
    </div>
  );
}
