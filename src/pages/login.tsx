import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import LoadingSpinner from "@/components/LoadingSpinner";
import SEO from "@/components/SEO";
import { prepareDeviceInfoForLogin } from "@/utils/deviceInfo";

export default function Login() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  useEffect(() => {
    // Redirect to dashboard if already logged in
    if (session) {
      router.push("/");
    }
    
    // Check for password reset completion message
    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get('message');
    if (message === 'password_reset_complete') {
      setSuccess("Password reset completed! You can now sign in with your new password.");
      // Clean up the URL
      router.replace('/login', undefined, { shallow: true });
    }

    // Prepare device info for login when component mounts
    const prepareDeviceInfo = async () => {
      try {
        await prepareDeviceInfoForLogin();
      } catch (error) {
        console.error('Failed to prepare device info:', error);
      }
    };

    prepareDeviceInfo();
  }, [session, router]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    
    try {
      // Prepare device info before authentication
      await prepareDeviceInfoForLogin();
      
      await signIn("auth0", { 
        callbackUrl: "/",
        connection: "google-oauth2"
      });
    } catch (error) {
      console.error('Error during Google sign-in:', error);
      setError('Sign-in failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Clear previous messages
    setError("");
    setSuccess("");
    
    if (isSignUp && password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }
    
    // Password strength validation for signup
    if (isSignUp && password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Prepare device info before authentication
      await prepareDeviceInfoForLogin();
      
      if (isSignUp) {
        // Custom sign-up process
        const signUpResponse = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
          }),
        });
        
        const signUpResult = await signUpResponse.json();
        
        if (!signUpResponse.ok) {
          throw new Error(signUpResult.message || 'Sign up failed');
        }
        
        // After successful signup, automatically sign in
        setSuccess("Account created successfully! Signing you in...");
        
        // Wait a moment to show success message
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Sign in the user using credentials provider
        const result = await signIn("credentials", {
          email: email,
          password: password,
          redirect: false,
        });
        
        if (result?.error) {
          console.error("Sign in after signup error:", result.error);
          setError("Account created but sign in failed. Please try signing in manually.");
        } else if (result?.ok) {
          router.push("/");
        }
      } else {
        // Regular sign-in process using credentials provider
        const result = await signIn("credentials", {
          email: email,
          password: password,
          redirect: false,
        });
        
        if (result?.error) {
          console.error("Authentication error:", result.error);
          setError("Authentication failed. Please check your email and password.");
        } else if (result?.ok) {
          setSuccess("Signed in successfully! Redirecting...");
          await new Promise(resolve => setTimeout(resolve, 500));
          router.push("/");
        }
      }
    } catch (error) {
      console.error("Authentication error:", error);
      setError(error instanceof Error ? error.message : "An error occurred during authentication. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous messages
    setError("");
    setSuccess("");
    
    if (!resetEmail) {
      setError("Please enter your email address");
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resetEmail)) {
      setError("Please enter a valid email address");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: resetEmail,
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to send reset email');
      }
      
      setSuccess("Password reset email sent! Check your inbox and follow the instructions.");
      setResetEmail("");
      
      // Auto-hide forgot password form after success
      setTimeout(() => {
        setShowForgotPassword(false);
        setSuccess("");
      }, 3000);
      
    } catch (error) {
      console.error("Forgot password error:", error);
      setError(error instanceof Error ? error.message : "Failed to send reset email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <>
        <SEO 
          title="Sign In"
          description="Sign in to Untitled88 to access your AI-powered email design dashboard"
          noindex={true}
        />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
          <LoadingSpinner />
        </div>
      </>
    );
  }

  if (session) {
    return (
      <>
        <SEO 
          title="Redirecting..."
          description="Redirecting to dashboard"
          noindex={true}
        />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
          <LoadingSpinner />
        </div>
      </>
    );
  }

  return (
    <>
      <SEO 
        title="Sign In to Your Account"
        description="Sign in to Untitled88 to access your AI-powered email design dashboard and create stunning email campaigns"
        keywords="sign in, login, email marketing dashboard, AI email designer"
        url="/login"
      />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md shadow-lg border-0">
          <CardHeader className="text-center">
            <div className="mb-8 flex flex-col items-center space-y-6">
              <div className="w-24 h-24 bg-gradient-to-br from-pink-400 via-purple-400 to-blue-400 rounded-3xl flex items-center justify-center shadow-lg">
                <Image 
                  src="/logo.png" 
                  alt="Untitled88 Logo" 
                  width={48}
                  height={48}
                  className="w-12 h-12 filter brightness-0 invert"
                />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                  A sacred place for your work-in-progress emails
                </h1>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 px-8 pb-8">
            {/* Main Login Options - Show only when no forms are active */}
            {!showEmailForm && !isSignUp && (
              <>
                {/* Google Sign In */}
                <Button 
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 py-4 text-base font-medium flex items-center justify-center space-x-3 rounded-xl"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Continue with Google</span>
                </Button>

                {/* Email/Password Sign In */}
                <Button 
                  onClick={() => {
                    setIsSignUp(false);
                    setShowEmailForm(true);
                  }}
                  disabled={isLoading}
                  className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 py-4 text-base font-medium flex items-center justify-center space-x-3 rounded-xl"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                  </svg>
                  <span>Sign in with email and password</span>
                </Button>

                {/* Sign Up Button */}
                <div className="pt-4">
                  <Button 
                    onClick={() => {
                      setIsSignUp(true);
                      setShowEmailForm(false);
                    }}
                    disabled={isLoading}
                    variant="ghost"
                    className="w-full text-gray-700 hover:text-gray-900 py-4 text-base font-medium rounded-xl"
                  >
                    Sign Up
                  </Button>
                </div>
              </>
            )}

            {/* Terms Agreement */}
            <div className="text-center text-sm text-gray-500 mt-6 px-4">
              By continuing you confirm that you&apos;ve read and accepted our{" "}
              <Link href="/terms" className="text-gray-700 underline hover:text-gray-900">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy-policy" className="text-gray-700 underline hover:text-gray-900">
                Privacy Policy
              </Link>
            </div>

            {/* Email/Password Sign In Form */}
            {showEmailForm && !isSignUp && (
              <div className="mt-6 space-y-4">
                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}
                
                {/* Success Message */}
                {success && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
                    {success}
                  </div>
                )}
                
                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your email"
                    />
                  </div>
                  
                  <div>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your password"
                    />
                  </div>

                  <Button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-black hover:bg-gray-800 text-white py-3 text-base font-medium rounded-xl"
                  >
                    Sign In
                  </Button>
                </form>
                
                {/* Forgot Password Link */}
                <div className="text-center">
                  <button 
                    onClick={() => {
                      setShowForgotPassword(true);
                      setResetEmail(email); // Pre-fill with current email
                    }}
                    className="text-blue-600 hover:text-blue-700 text-sm underline"
                  >
                    Forgot your password?
                  </button>
                </div>
                
                <div className="text-center">
                  <button 
                    onClick={() => {
                      setShowEmailForm(false);
                      setEmail("");
                      setPassword("");
                    }}
                    className="text-gray-600 hover:text-gray-800 text-sm"
                  >
                    Back to login options
                  </button>
                </div>
              </div>
            )}

            {/* Forgot Password Form */}
            {showForgotPassword && (
              <div className="mt-6 space-y-4">
                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}
                
                {/* Success Message */}
                {success && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
                    {success}
                  </div>
                )}
                
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Reset Your Password</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Enter your email address and we&apos;ll send you a link to reset your password.
                  </p>
                </div>
                
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <input
                      id="reset-email"
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your email address"
                    />
                  </div>

                  <Button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-base font-medium rounded-xl"
                  >
                    Send Reset Link
                  </Button>
                </form>
                
                <div className="text-center">
                  <button 
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetEmail("");
                      setError("");
                      setSuccess("");
                    }}
                    className="text-gray-600 hover:text-gray-800 text-sm"
                  >
                    Back to sign in
                  </button>
                </div>
              </div>
            )}

            {/* Sign Up Form */}
            {isSignUp && (
              <div className="mt-6 space-y-4">
                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}
                
                {/* Success Message */}
                {success && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
                    {success}
                  </div>
                )}
                
                <div>
                  <input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email"
                  />
                </div>
                
                <div>
                  <input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Create a password"
                  />
                </div>

                <div>
                  <input
                    id="signup-confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Confirm your password"
                  />
                </div>

                <Button 
                  onClick={handleEmailAuth}
                  disabled={isLoading}
                  className="w-full bg-black hover:bg-gray-800 text-white py-3 text-base font-medium rounded-xl"
                >
                  Create Account
                </Button>

                <div className="text-center">
                  <button 
                    onClick={() => {
                      setIsSignUp(false);
                      setShowEmailForm(false);
                      setEmail("");
                      setPassword("");
                      setConfirmPassword("");
                    }}
                    className="text-gray-600 hover:text-gray-800 text-sm"
                  >
                    Already have an account? Sign in
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}