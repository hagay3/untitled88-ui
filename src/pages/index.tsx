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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
    
    // Clear typing indicator after a short delay
    setTimeout(() => setIsTyping(false), 500);
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
        title="Design & Create Your Top Emails Instantly"
        description="Create stunning email campaigns with AI. Generate beautiful HTML templates, preview across devices, and integrate with Brevo, Mailchimp & Klaviyo. Start free today!"
        keywords="email marketing, AI email designer, email templates, HTML emails, email campaigns, email builder, responsive emails, Brevo integration, Mailchimp integration, Klaviyo integration"
        url="/"
      />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
        {/* Header/Navbar */}
        <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center gap-0">
                <Image 
                  src="/logo.png" 
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
                  className="h-8 w-auto -ml-2"
                />
              </div>
              <div className="flex items-center space-x-4">
                {session ? (
                  <div className="flex items-center space-x-4">
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
                    <Button
                      variant="outline"
                      onClick={() => router.push("/dashboard")}
                      className="rounded-full"
                    >
                      Dashboard
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={handleSignOut}
                      className="rounded-full"
                    >
                      Logout
                    </Button>
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

        {/* Hero Section */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Design & Create Your Top Emails Instantly
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              {AppConfig.site_name} lets you build fully-functional emails in minutes with just your words. No coding necessary.
            </p>
            
            {/* AI Prompt Window */}
            <div className="max-w-3xl mx-auto mb-8">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-600 ml-4">
                      AI Email Designer
                    </span>
                  </div>
                </div>
                
                {/* Prompt Input Area */}
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      Describe your email idea
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Tell us what kind of email you want to create and we&apos;ll generate it for you
                    </p>
                  </div>
                  
                  <div className="relative">
                    <textarea
                      ref={textareaRef}
                      value={prompt}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyPress}
                      placeholder="e.g., Create a welcome email for new subscribers with a warm greeting, company introduction, and next steps..."
                      className="w-full min-h-[120px] max-h-[300px] p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-800 placeholder-gray-400 leading-relaxed"
                      style={{ 
                        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                        fontSize: '14px'
                      }}
                    />
                    
                    {/* Cursor indicator */}
                    {isTyping && (
                      <div className="absolute bottom-4 right-4">
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
                          <span>typing...</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-xs text-gray-500">
                      Press <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">⌘ + Enter</kbd> to generate
                    </div>
                    <Button
                      onClick={handlePromptSubmit}
                      disabled={!prompt.trim()}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      {session ? 'Generate Email' : 'Sign In & Generate'}
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-500 mb-12">
              Not sure where to start? Try one of these:
            </p>

            {/* Example Prompts */}
            <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-16">
              <button
                onClick={() => handleExampleClick("Create a welcome email for new subscribers with a warm greeting and company introduction")}
                className="text-left p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 group"
              >
                <div className="text-sm text-gray-600 leading-relaxed group-hover:text-blue-600">
                  Create a welcome email for new subscribers with a warm greeting and company introduction
                </div>
                <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <span className="text-xs text-blue-500 font-medium">Click to use →</span>
                </div>
              </button>
              <button
                onClick={() => handleExampleClick("Design a product launch announcement email with hero image, features, and call-to-action")}
                className="text-left p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 group"
              >
                <div className="text-sm text-gray-600 leading-relaxed group-hover:text-blue-600">
                  Design a product launch announcement email with hero image, features, and call-to-action
                </div>
                <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <span className="text-xs text-blue-500 font-medium">Click to use →</span>
                </div>
              </button>
              <button
                onClick={() => handleExampleClick("Build a monthly newsletter template with sections for news, featured content, and social links")}
                className="text-left p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 group"
              >
                <div className="text-sm text-gray-600 leading-relaxed group-hover:text-blue-600">
                  Build a monthly newsletter template with sections for news, featured content, and social links
                </div>
                <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <span className="text-xs text-blue-500 font-medium">Click to use →</span>
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
              <h3 className="font-semibold text-gray-900 mb-2">Top-Designed Templates</h3>
              <p className="text-sm text-gray-600">Professional HTML email templates designed by experts</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">AI Chat Builder</h3>
              <p className="text-sm text-gray-600">Integrated chat within the platform for generating emails</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Mobile & Desktop Preview</h3>
              <p className="text-sm text-gray-600">Visual layout previews across all devices</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">ESP Integration</h3>
              <p className="text-sm text-gray-600">Connect with Brevo, Mailchimp, and Klaviyo</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-100 mt-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center text-gray-500 text-sm">
              <p>&copy; 2025 {AppConfig.site_name}. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

