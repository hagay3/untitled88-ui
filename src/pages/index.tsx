import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/LoadingSpinner";
import SEO from "@/components/SEO";
import { AppConfig } from "@/utils/AppConfig";
import SalesDashboard from "@/components/dashboards/SalesDashboard";
import FinancialDashboard from "@/components/dashboards/FinancialDashboard";
import PartySuccessDialog from "@/components/ui/PartySuccessDialog";

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
  const [showBetaSuccessDialog, setShowBetaSuccessDialog] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Example prompts for dynamic typing animation
  const examplePrompts = [
    "Build a finance dashboard showing expenses vs budget by department...",
    "Show customer churn by subscription plan as a stacked bar chart...",
    "What are the main drivers of revenue growth this quarter?",
    "Explain the biggest drop in user engagement last month...",
    "Summarize key insights from this dashboard in 3 bullet points...",
    "Highlight any anomalies or unusual patterns in the data..."
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

  // Check for beta registration success query parameter
  useEffect(() => {
    if (router.query.betaRegistered === 'true') {
      setShowBetaSuccessDialog(true);
      // Remove query parameter from URL without reload
      router.replace('/', undefined, { shallow: true });
    }
  }, [router.query.betaRegistered, router]);

  const handlePromptSubmit = () => {
    // If user is not logged in, redirect to beta page
    if (!session) {
      router.push('/beta');
      return;
    }
    
    // If logged in but no prompt, don't proceed
    if (!prompt.trim()) return;
    
    // Store the prompt in session storage to pass to dashboard
    sessionStorage.setItem('dashboardPrompt', prompt.trim());
    
    // Navigate to dashboard
    router.push('/dashboard');
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
        title="Type your ideas. Get your dashboards. It's that simple."
        description="Untitled88 turns your data into AI-driven dashboards. Ask questions, generate visualizations, and explore insights - all in one smooth experience."
        keywords="AI dashboards, Databricks, Tableau, data visualization, business intelligence, analytics, data insights, dashboard builder"
        url="/"
      />
      <div className="min-h-screen bg-[#0a0e1a] relative overflow-hidden">
        {/* Animated background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1f35_1px,transparent_1px),linear-gradient(to_bottom,#1a1f35_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
        
        {/* Animated particles */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ top: '10%', left: '20%', animationDelay: '0s' }}></div>
          <div className="absolute w-1 h-1 bg-purple-500 rounded-full animate-pulse" style={{ top: '30%', left: '70%', animationDelay: '1s' }}></div>
          <div className="absolute w-2 h-2 bg-cyan-500 rounded-full animate-pulse" style={{ top: '60%', left: '15%', animationDelay: '2s' }}></div>
          <div className="absolute w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{ top: '80%', left: '80%', animationDelay: '1.5s' }}></div>
          <div className="absolute w-1 h-1 bg-purple-400 rounded-full animate-pulse" style={{ top: '20%', left: '90%', animationDelay: '0.5s' }}></div>
        </div>
        {/* Header/Navbar */}
        <nav className="bg-[#0a0e1a]/80 backdrop-blur-md border-b border-gray-800/50 relative z-50 sticky top-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <Image 
                  src="/untitled_88_dark_mode_small.png" 
                  alt="Untitled88" 
                  width={40}
                  height={40}
                  className="h-10 w-auto"
                />
                <span className="text-white font-bold text-xl hidden sm:block font-poppins">Untitled88</span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-600/20 text-purple-400 border border-purple-500/30 hidden sm:block">
                  ✨ AI
                </span>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-1">
                <button className="px-4 py-2 text-sm font-medium text-white hover:bg-gray-800/50 rounded-lg transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Builder
                </button>
                <button className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
                  </svg>
                  Templates
                </button>
                <button className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Integrations
                </button>
                <button className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Pricing
                </button>
                <button className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  About
                </button>
              </div>

              {/* Right side - Auth */}
              <div className="flex items-center gap-3">
                {session ? (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setShowUserDropdown(!showUserDropdown)}
                      className="flex items-center space-x-2 hover:bg-gray-800/50 rounded-lg px-3 py-2 transition-colors"
                    >
                      <Image
                        src={session.user?.image || "/default-avatar.png"}
                        alt="User"
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full ring-2 ring-purple-500/50"
                      />
                      <span className="text-sm font-medium text-gray-200 hidden sm:block">
                        {session.user?.name}
                      </span>
                      <svg 
                        className={`w-4 h-4 text-gray-400 transition-transform hidden sm:block ${showUserDropdown ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {/* Dropdown Menu */}
                    {showUserDropdown && (
                      <div className="absolute right-0 mt-2 w-48 bg-gray-900 rounded-xl shadow-2xl border border-gray-800 py-2 z-50">
                        <button
                          onClick={() => {
                            router.push("/dashboard");
                            setShowUserDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white flex items-center space-x-2 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                          <span>Dashboard</span>
                        </button>
                        <div className="border-t border-gray-800 my-1"></div>
                        <button
                          onClick={() => {
                            handleSignOut();
                            setShowUserDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center space-x-2 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          <span>Logout</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                
                  </>
                )}

                {/* Mobile menu button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
                >
                  {mobileMenuOpen ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
              <div className="md:hidden py-4 border-t border-gray-800/50 animate-in slide-in-from-top duration-200">
                <div className="flex flex-col space-y-2">
                  <button className="px-4 py-3 text-sm font-medium text-white hover:bg-gray-800/50 rounded-lg transition-colors text-left flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Builder
                  </button>
                  <button className="px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors text-left flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5z" />
                    </svg>
                    Templates
                  </button>
                  <button className="px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors text-left flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Integrations
                  </button>
                  <button className="px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors text-left flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Pricing
                  </button>
                  <button className="px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors text-left flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    About
                  </button>
                  {!session && (
                    <>
                      <div className="border-t border-gray-800/50 my-2"></div>
                      <button 
                        onClick={() => router.push('/login')}
                        className="px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors text-left"
                      >
                        Sign In
                      </button>
                      <button 
                        onClick={() => router.push('/beta')}
                        className="px-4 py-3 text-sm font-medium bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg transition-all shadow-lg"
                      >
                        Get Started
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Beta Registration Banner */}
        {!session && (
          <div className="bg-gradient-to-r from-cyan-500 via-blue-500 to-blue-600 text-white py-3 relative z-10">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🚀</span>
                  <div>
                    <p className="font-semibold">Join the Waitlist</p>
                    <p className="text-sm text-white/90">Be the first to know when we launch</p>
                  </div>
                </div>
                <Button
                  onClick={() => router.push('/beta')}
                  className="bg-white text-blue-600 hover:bg-gray-100 font-semibold px-6 py-2 rounded-full shadow-lg"
                >
                  Join Waitlist
                </Button>
              </div>
            </div>
          </div>
        )}

  

        {/* Hero Section */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 relative z-10">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight tracking-tight font-poppins">
              Type your ideas. Get your dashboards. It's that simple.
            </h1>
            <h2 className="text-2xl md:text-3xl font-semibold text-purple-400 mb-6 leading-tight font-instrument-sans">
              Type Your Data Questions. Get Your Answers.
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed font-normal font-inter">
              Untitled88 answers analytical questions and creates AI-driven dashboards from your data, all in one smooth experience.
            </p>
            
            {/* Example Prompts Pills */}
            <div className="max-w-2xl mx-auto mb-4">
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  onClick={() => handleExampleClick("Build a finance dashboard showing expenses vs budget by department.")}
                  className="px-3 py-1.5 text-xs bg-gray-800/50 border border-gray-700 rounded-full hover:border-purple-500 hover:bg-gray-800 transition-all duration-200 text-gray-300 hover:text-purple-400 font-normal backdrop-blur-sm font-inter"
                >
                  📊 Build a finance dashboard
                </button>
                <button
                  onClick={() => handleExampleClick("Show customer churn by subscription plan as a stacked bar chart.")}
                  className="px-3 py-1.5 text-xs bg-gray-800/50 border border-gray-700 rounded-full hover:border-purple-500 hover:bg-gray-800 transition-all duration-200 text-gray-300 hover:text-purple-400 font-normal backdrop-blur-sm font-inter"
                >
                  📈 Show customer churn by plan
                </button>
                <button
                  onClick={() => handleExampleClick("What are the main drivers of revenue growth this quarter?")}
                  className="px-3 py-1.5 text-xs bg-gray-800/50 border border-gray-700 rounded-full hover:border-purple-500 hover:bg-gray-800 transition-all duration-200 text-gray-300 hover:text-purple-400 font-normal backdrop-blur-sm font-inter"
                >
                  🔍 Main revenue growth drivers?
                </button>
                <button
                  onClick={() => handleExampleClick("Explain the biggest drop in user engagement last month.")}
                  className="px-3 py-1.5 text-xs bg-gray-800/50 border border-gray-700 rounded-full hover:border-purple-500 hover:bg-gray-800 transition-all duration-200 text-gray-300 hover:text-purple-400 font-normal backdrop-blur-sm font-inter"
                >
                  💡 Biggest drop in engagement?
                </button>
              </div>
            </div>
            
            {/* Simple Prompt Input */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-20"></div>
                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={handleInputChange}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  onKeyDown={handleKeyPress}
                  placeholder=""
                  className="relative w-full min-h-[60px] max-h-[200px] p-4 pr-24 pb-14 border border-gray-700 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none text-white placeholder-gray-500 leading-relaxed bg-gray-900/80 backdrop-blur-sm shadow-2xl font-normal font-inter"
                  style={{
                    fontSize: '16px'
                  }}
                />
                
                {/* Dynamic typing animation overlay */}
                {!isUserFocused && !prompt && displayText && (
                  <div
                    className="absolute top-4 left-4 pointer-events-none text-gray-400 leading-relaxed z-10 font-normal font-inter"
                    style={{
                      fontSize: '16px'
                    }}
                  >
                    {displayText}
                    <span className="animate-pulse">|</span>
                  </div>
                )}
                
                {/* Build Button */}
                <Button
                  onClick={handlePromptSubmit}
                  disabled={!!session && !prompt.trim()}
                  className="absolute right-3 bottom-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center text-sm font-medium shadow-lg shadow-purple-500/50 font-instrument-sans"
                >
                  ⚡ {session ? 'Generate' : 'Create'}
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

            <p className="text-sm text-gray-400 mb-12 font-normal text-center font-inter">
              Press <kbd className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs font-fragment-mono text-gray-300">⌘ Enter</kbd> or <kbd className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs font-fragment-mono text-gray-300">Ctrl Enter</kbd> to generate
            </p>
          </div>

          {/* Interactive Dashboards Section */}
          <div className="max-w-[95vw] xl:max-w-[1400px] mx-auto px-2 sm:px-4 lg:px-8 mb-12 sm:mb-20 relative z-10">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2 text-center px-2 font-poppins">
              Key Features
            </h2>
            <p className="text-sm sm:text-base text-gray-400 mb-4 sm:mb-6 lg:mb-8 text-center max-w-2xl mx-auto px-2 font-inter">
              Powerful analytics and insights at your fingertips
            </p>
            <div className="space-y-4 sm:space-y-6 lg:space-y-8">
              <div className="transform transition-transform hover:scale-[1.01] duration-300 w-full min-h-[600px] sm:min-h-[500px] lg:aspect-video">
                <FinancialDashboard />
              </div>
              <div className="transform transition-transform hover:scale-[1.01] duration-300 w-full min-h-[600px] sm:min-h-[500px] lg:aspect-video">
                <SalesDashboard />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-transparent border-t border-gray-800/50 mt-20 relative z-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              <div className="text-center md:text-left">
                <p className="text-gray-300 text-sm font-medium font-inter">Ask. Visualize. Understand.</p>
              </div>
              <div className="text-center md:text-left">
                <p className="text-gray-300 text-sm font-medium font-inter">From data to dashboards - in seconds.</p>
              </div>
              <div className="text-center md:text-left">
                <p className="text-gray-300 text-sm font-medium font-inter">Turn questions into insights, instantly.</p>
              </div>
              <div className="text-center md:text-left">
                <p className="text-gray-300 text-sm font-medium font-inter">Chat with your data. See the answers.</p>
              </div>
              <div className="text-center md:text-left">
                <p className="text-gray-300 text-sm font-medium font-inter">Your data. Your dashboards. Powered by AI.</p>
              </div>
            </div>
            <div className="text-center text-gray-500 text-sm border-t border-gray-800 pt-8">
              <p className="font-normal mb-3 font-inter">&copy; 2026 {AppConfig.site_name}. All rights reserved.</p>
              <div className="flex items-center justify-center gap-6">
                <a
                  href="/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-purple-400 transition-colors font-normal font-inter"
                >
                  Privacy Policy
                </a>
                <span className="text-gray-700">•</span>
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-purple-400 transition-colors font-normal font-inter"
                >
                  Terms of Service
                </a>
              </div>
            </div>
          </div>
        </footer>

        {/* Beta Registration Success Dialog */}
        <PartySuccessDialog
          isOpen={showBetaSuccessDialog}
          message="We will be in touch very soon!"
          onClose={() => setShowBetaSuccessDialog(false)}
          duration={6000}
        />
      </div>
    </>
  );
}

