import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/LoadingSpinner";
import SEO from "@/components/SEO";
import { AppConfig } from "@/utils/AppConfig";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isUserFocused, setIsUserFocused] = useState(false);
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Example prompts for dynamic typing animation
  const examplePrompts = [
    "Create a welcome email for new subscribers with a warm greeting...",
    "Design a product launch announcement with hero image and CTA...",
    "Build a monthly newsletter with news and featured content...",
    "Generate a promotional email for a seasonal sale campaign...",
    "Create an abandoned cart recovery email with product images...",
    "Design a customer feedback survey email with incentives...",
    "Build a re-engagement email for inactive subscribers...",
    "Generate a birthday email with personalized offers..."
  ];

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Handle click outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Animation trigger effect - only depends on user state, not animation state
  useEffect(() => {
    if (isUserFocused || prompt.length > 0) {
      // Clear any ongoing animation
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      setIsAnimating(false);
      setDisplayText("");
      return;
    }

    // Don't start new animation if one is already running
    if (isAnimating) {
      return;
    }

    const startTypingAnimation = () => {
      setIsAnimating(true);
      
      const runAnimation = (promptIndex: number) => {
        const currentPrompt = examplePrompts[promptIndex];
        
        if (!currentPrompt) {
          setIsAnimating(false);
          return;
        }

        const typeCharacter = (index: number = 0) => {
          // Check if animation was cancelled
          if (!typingTimeoutRef.current && index > 0) {
            return;
          }
          
          if (index < currentPrompt.length) {
            const newText = currentPrompt.slice(0, index + 1);
            setDisplayText(newText);
            
            // Clear previous timeout to prevent multiple callbacks
            if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current);
            }
            
            // Schedule next character with faster timing
            typingTimeoutRef.current = setTimeout(() => {
              typeCharacter(index + 1);
            }, (80 + Math.random() * 40) / 1.69); // 1.69x faster (1.3 * 1.3): ~47-71ms per character
          } else {
            // Clear typing timeout
            if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current);
              typingTimeoutRef.current = null;
            }
            
            // Pause at end of prompt
            animationTimeoutRef.current = setTimeout(() => {
              // Clear text with backspace effect
              const clearText = () => {
                setDisplayText(prev => {
                  if (prev.length > 0) {
                    if (typingTimeoutRef.current) {
                      clearTimeout(typingTimeoutRef.current);
                    }
                    typingTimeoutRef.current = setTimeout(clearText, 50 / 1.69); // 1.69x faster backspace: ~30ms
                    return prev.slice(0, -1);
                  } else {
                    // Move to next prompt
                    const nextIndex = (promptIndex + 1) % examplePrompts.length;
                    setCurrentExampleIndex(nextIndex);
                    
                    // Clear timeout ref
                    if (typingTimeoutRef.current) {
                      clearTimeout(typingTimeoutRef.current);
                      typingTimeoutRef.current = null;
                    }
                    
                    // Start next animation cycle
                    animationTimeoutRef.current = setTimeout(() => {
                      runAnimation(nextIndex);
                    }, 1000 / 1.69); // 1.69x faster pause between prompts: ~590ms
                    return "";
                  }
                });
              };
              clearText();
            }, 1000 / 1.69);
          }
        };

        typeCharacter();
      };

      runAnimation(currentExampleIndex);
    };

    // Start animation after a short delay
    animationTimeoutRef.current = setTimeout(startTypingAnimation, 2000 / 1.69); // 1.69x faster initial delay: ~1.2 seconds

    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [isUserFocused, prompt.length]); // Removed isAnimating and currentExampleIndex from dependencies

  useEffect(() => {
    // If user is authenticated, you can redirect to dashboard or another page
    // For now, we'll just show them the home page
  }, [session]);

  const handlePromptSubmit = () => {
    if (!prompt.trim()) return;
    
    // Store the prompt in session storage to pass to dashboard
    sessionStorage.setItem('emailPrompt', prompt.trim());
    
    // Navigate to dashboard or login based on authentication status
    if (session) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handlePromptSubmit();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    setIsTyping(true);
    setDisplayText(""); // Clear animation text when user types
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
    
    // Clear typing indicator after a short delay
    setTimeout(() => setIsTyping(false), 500);
  };

  const handleInputFocus = () => {
    setIsUserFocused(true);
    setDisplayText(""); // Clear animation text when user focuses
  };

  const handleInputBlur = () => {
    // Only set unfocused if the input is empty
    if (!prompt.trim()) {
      setIsUserFocused(false);
    }
  };

  const handleExampleClick = (exampleText: string) => {
    setPrompt(exampleText);
    if (textareaRef.current) {
      textareaRef.current.focus();
      // Auto-resize for the example text
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleSignIn = () => {
    router.push("/login");
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };



  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <>
      <SEO 
        title="Tell us what kind of email you want to create and we'll generate it for you"
        description="Create stunning email campaigns with AI. Generate beautiful HTML templates, preview across devices, and integrate with Brevo, Mailchimp & Klaviyo. Start free today!"
        keywords="email marketing, AI email designer, email templates, HTML emails, email campaigns, email builder, responsive emails, Brevo integration, Mailchimp integration, Klaviyo integration"
        url="/"
      />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
        {/* Header/Navbar */}
        <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center gap-4">
                <Image 
                  src="/logo-transparent.png" 
                  alt="Untitled88 Logo" 
                  width={120}
                  height={40}
                  className="h-12 w-auto"
                />
                <Image 
                  src="/logo-untitled88-text-only.png" 
                  alt="Untitled88" 
                  width={1000}
                  height={400}
                  className="h-7 w-auto -ml-2"
                />
              </div>
              <div className="flex items-center space-x-4">
                {session ? (
                  <div className="flex items-center space-x-4">
                    <div className="relative" ref={dropdownRef}>
                      <button
                        onClick={() => setShowUserDropdown(!showUserDropdown)}
                        className="flex items-center space-x-3 hover:bg-gray-50 rounded-full p-2 transition-colors"
                      >
                        <Image
                          src={session.user?.image || "/default-avatar.png"}
                          alt="User"
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-full"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {session.user?.name}
                        </span>
                        <svg 
                          className={`w-4 h-4 text-gray-500 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {/* Dropdown Menu */}
                      {showUserDropdown && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 glass-card">
                          <button
                            onClick={() => {
                              router.push("/dashboard");
                              setShowUserDropdown(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                            </svg>
                            <span>Dashboard</span>
                          </button>
                          <div className="border-t border-gray-100 my-1"></div>
                          <button
                            onClick={() => {
                              handleSignOut();
                              setShowUserDropdown(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Logout</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <Button onClick={handleSignIn} className="rounded-full bg-black hover:bg-gray-800 text-white">
                    Sign In
                  </Button>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Beta Registration Banner */}
        {!session && (
          <div className="bg-gradient-to-r from-blue-400 to-purple-500 text-white py-4">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold">🚀 Join the Beta Program</p>
                    <p className="text-sm text-white/90">Get early access to AI-powered email marketing</p>
                  </div>
                </div>
                <Button
                  onClick={() => router.push('/beta')}
                  className="bg-white text-blue-600 hover:bg-gray-100 font-medium px-6 py-2 rounded-full"
                >
                  Join Beta
                </Button>
              </div>
            </div>
          </div>
        )}

  

        {/* Hero Section */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-medium text-gray-900 mb-6 leading-tight tracking-tight" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
              Type your ideas. Get your email. Its that simple.
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed font-normal" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
              {AppConfig.site_name} lets you build fully-functional emails in minutes with just your words. No coding necessary.
            </p>
            
            {/* Simple Prompt Input */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={handleInputChange}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  onKeyDown={handleKeyPress}
                  placeholder=""
                  className="w-full min-h-[60px] max-h-[200px] p-4 pr-24 pb-14 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-800 placeholder-gray-400 leading-relaxed bg-white shadow-sm font-normal"
                  style={{ 
                    fontSize: '16px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                  }}
                />
                
                {/* Dynamic typing animation overlay */}
                {!isUserFocused && !prompt && displayText && (
                  <div 
                    className="absolute top-4 left-4 pointer-events-none text-gray-500 leading-relaxed z-10 font-normal"
                    style={{ 
                      fontSize: '16px',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                    }}
                  >
                    {displayText}
                    <span className="animate-pulse">|</span>
                  </div>
                )}
                
                {/* Build Button */}
                <Button
                  onClick={handlePromptSubmit}
                  disabled={!prompt.trim()}
                  className="absolute right-3 bottom-3 bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center text-sm font-medium"
                  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
                >
                  {session ? 'Generate' : 'Build'}
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Button>
                
                {/* Cursor indicator */}
                {isTyping && (
                  <div className="absolute bottom-2 left-4">
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
                      <span>typing...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <p className="text-sm text-gray-500 mb-12 font-normal" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
              Press <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Enter</kbd> to generate • Not sure where to start? Try one of these:
            </p>

            {/* Example Prompts */}
            <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-16">
              <button
                onClick={() => handleExampleClick("Create a welcome email for new subscribers with a warm greeting and company introduction")}
                className="text-left p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 group"
              >
                <div className="text-sm text-gray-600 leading-relaxed group-hover:text-blue-600 font-normal" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
                  Create a welcome email for new subscribers with a warm greeting and company introduction
                </div>
                <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <span className="text-xs text-blue-500 font-medium" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>Click to use →</span>
                </div>
              </button>
              <button
                onClick={() => handleExampleClick("Design a product launch announcement email with hero image, features, and call-to-action")}
                className="text-left p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 group"
              >
                <div className="text-sm text-gray-600 leading-relaxed group-hover:text-blue-600 font-normal" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
                  Design a product launch announcement email with hero image, features, and call-to-action
                </div>
                <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <span className="text-xs text-blue-500 font-medium" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>Click to use →</span>
                </div>
              </button>
              <button
                onClick={() => handleExampleClick("Build a monthly newsletter template with sections for news, featured content, and social links")}
                className="text-left p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 group"
              >
                <div className="text-sm text-gray-600 leading-relaxed group-hover:text-blue-600 font-normal" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
                  Build a monthly newsletter template with sections for news, featured content, and social links
                </div>
                <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <span className="text-xs text-blue-500 font-medium" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>Click to use →</span>
                </div>
              </button>
            </div>
          </div>

          {/* Features Section */}
          <div className="grid md:grid-cols-4 gap-8 mt-20">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>Top-Designed Templates</h3>
              <p className="text-sm text-gray-600 font-normal" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>Professional HTML email templates designed by experts</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>AI Chat Builder</h3>
              <p className="text-sm text-gray-600 font-normal" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>Integrated chat within the platform for generating emails</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>Mobile & Desktop Preview</h3>
              <p className="text-sm text-gray-600 font-normal" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>Visual layout previews across all devices</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>ESP Integration</h3>
              <p className="text-sm text-gray-600 font-normal" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>Connect with Mailchimp (coming soon: Brevo, Klaviyo)</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-100 mt-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center text-gray-500 text-sm">
              <p className="font-normal mb-3" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>&copy; 2025 {AppConfig.site_name}. All rights reserved.</p>
              <div className="flex items-center justify-center gap-6">
                <a 
                  href="/privacy-policy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-blue-600 transition-colors font-normal"
                  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
                >
                  Privacy Policy
                </a>
                <span className="text-gray-300">•</span>
                <a 
                  href="/terms" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-blue-600 transition-colors font-normal"
                  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
                >
                  Terms of Service
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

