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
  const [showBetaDialog, setShowBetaDialog] = useState(false);
  const [betaDialogType, setBetaDialogType] = useState<'registration' | 'verification' | 'pending'>('registration');
  const [betaStatus, setBetaStatus] = useState<{
    checked: boolean;
    inBeta: boolean;
    canLogin: boolean;
    needsVerification: boolean;
    needsRegistration: boolean;
    message: string;
  }>({
    checked: false,
    inBeta: false,
    canLogin: false,
    needsVerification: false,
    needsRegistration: false,
    message: ''
  });

  // Check if email is in beta before allowing sign in
  const checkEmailInBeta = async (emailToCheck: string): Promise<boolean> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/beta/check-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: emailToCheck }),
      });

      const data = await response.json();

      if (response.ok) {
        setBetaStatus({
          checked: true,
          inBeta: data.in_beta || false,
          canLogin: data.can_login || false,
          needsVerification: data.needs_verification || false,
          needsRegistration: data.needs_registration || false,
          message: data.message || ''
        });

        // If user needs to register or verify, show appropriate error
        if (data.needs_registration) {
          setError("You need to join the beta program first. Please register for beta access.");
          return false;
        }

        if (data.needs_verification) {
          setError("Please verify your email first. Check your inbox for the verification code.");
          return false;
        }

        if (!data.can_login) {
          setError("Your beta access is pending approval. We'll notify you once approved.");
          return false;
        }

        // User can proceed with login
        return true;
      } else {
        setError(data.error || 'Failed to check beta status');
        return false;
      }
    } catch (error) {
      setError('Failed to verify beta access. Please try again.');
      return false;
    }
  };

  useEffect(() => {
    // Check if user has beta access error after OAuth
    if (session?.error === "BetaAccessDenied") {
      const user = session.user as any;
      
      // Determine dialog type and show dialog
      if (user?.needsRegistration) {
        setBetaDialogType('registration');
        setShowBetaDialog(true);
        setBetaStatus({
          checked: true,
          inBeta: false,
          canLogin: false,
          needsVerification: false,
          needsRegistration: true,
          message: user?.betaMessage || ''
        });
      } else if (user?.needsVerification) {
        setBetaDialogType('verification');
        setShowBetaDialog(true);
        setBetaStatus({
          checked: true,
          inBeta: true,
          canLogin: false,
          needsVerification: true,
          needsRegistration: false,
          message: user?.betaMessage || ''
        });
      } else {
        setBetaDialogType('pending');
        setShowBetaDialog(true);
        setBetaStatus({
          checked: true,
          inBeta: true,
          canLogin: false,
          needsVerification: false,
          needsRegistration: false,
          message: user?.betaMessage || ''
        });
      }
      
      // Sign out the user
      import('next-auth/react').then(({ signOut }) => {
        signOut({ redirect: false });
      });
      
      return;
    }
    
    // If user is successfully logged in (no errors), redirect to dashboard
    if (session && !session.error) {
      router.push("/dashboard");
      return;
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
      }
    };

    prepareDeviceInfo();
  }, [session, router]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      // Prepare device info before authentication
      await prepareDeviceInfoForLogin();
      
      // Set callback to login page so we can show beta dialog if needed
      // Successful logins will be redirected to dashboard by the useEffect
      await signIn("auth0", { 
        callbackUrl: "/login",
        connection: "google-oauth2"
      });
    } catch (error) {
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
    
    // Check beta status before proceeding
    const canProceed = await checkEmailInBeta(email);
    if (!canProceed) {
      return; // Error message already set in checkEmailInBeta
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
          setError("Account created but sign in failed. Please try signing in manually.");
        } else if (result?.ok) {
          router.push("/dashboard");
        }
      } else {
        // Regular sign-in process using credentials provider
        const result = await signIn("credentials", {
          email: email,
          password: password,
          redirect: false,
        });
        
        if (result?.error) {
          setError("Authentication failed. Please check your email and password.");
        } else if (result?.ok) {
          setSuccess("Signed in successfully! Redirecting...");
          await new Promise(resolve => setTimeout(resolve, 500));
          router.push("/dashboard");
        }
      }
    } catch (error) {
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

  // If already logged in (and no errors), show a message instead of the login form
  if (session && !session.error) {
    return (
      <>
        <SEO 
          title="Already Signed In"
          description="You are already signed in to Untitled88"
          noindex={true}
        />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <Card className="w-full max-w-md shadow-lg border-0">
            <CardHeader className="text-center">
              <div className="mb-8 flex flex-col items-center space-y-6">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <Image 
                    src="/logo-untitled88.png" 
                    alt="Untitled88 Logo" 
                    width={160}
                    height={160}
                    className="w-40 h-40"
                  />
                  <Image 
                    src="/logo-untitled88-text-only.png" 
                    alt="Untitled88" 
                    width={180}
                    height={40}
                    className="h-8 w-auto"
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                    You&apos;re Already Signed In
                  </h1>
                  <p className="text-gray-600">
                    Welcome back, {session.user?.name || session.user?.email}!
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 px-8 pb-8">
              <Button 
                onClick={() => router.push("/dashboard")}
                className="w-full bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 hover:from-blue-500 hover:via-blue-600 hover:to-blue-700 text-white py-4 text-base font-medium rounded-xl"
              >
                Go to Dashboard
              </Button>
              <Button 
                onClick={() => router.push("/")}
                variant="outline"
                className="w-full py-4 text-base font-medium rounded-xl"
              >
                Go to Home
              </Button>
            </CardContent>
          </Card>
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
            <div className="mb-8 flex flex-col items-center gap-0">
              <div className="flex flex-col items-center justify-center gap-0">
                <Image 
                  src="/logo-untitled88.png" 
                  alt="Untitled88 Logo" 
                  width={160}
                  height={160}
                  className="w-40 h-40"
                />
                <Image 
                  src="/logo-untitled88-text-only.png" 
                  alt="Untitled88" 
                  width={1180}
                  height={500}
                  className="h-10 w-auto"
                />
              </div>
              <br/>
              <h1 className="text-2xl font-semibold text-gray-900 mb-2 mt-0">
                 The design studio for emails that convert
              </h1>
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
              <Link href="/terms" target="_blank" rel="noopener noreferrer" className="text-gray-700 underline hover:text-gray-900">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-gray-700 underline hover:text-gray-900">
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
                    {betaStatus.needsRegistration && (
                      <div className="mt-2">
                        <Link href="/beta" className="text-blue-600 hover:text-blue-700 underline font-medium">
                          Click here to join the beta program
                        </Link>
                      </div>
                    )}
                    {betaStatus.needsVerification && (
                      <div className="mt-2">
                        <Link href="/beta" className="text-blue-600 hover:text-blue-700 underline font-medium">
                          Click here to verify your email
                        </Link>
                      </div>
                    )}
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
                    {betaStatus.needsRegistration && (
                      <div className="mt-2">
                        <Link href="/beta" className="text-blue-600 hover:text-blue-700 underline font-medium">
                          Click here to join the beta program
                        </Link>
                      </div>
                    )}
                    {betaStatus.needsVerification && (
                      <div className="mt-2">
                        <Link href="/beta" className="text-blue-600 hover:text-blue-700 underline font-medium">
                          Click here to verify your email
                        </Link>
                      </div>
                    )}
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

        {/* Beta Access Dialog */}
        {showBetaDialog && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="glass-card max-w-md w-full p-8 animate-in fade-in duration-300">
              {/* Icon */}
              <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                {betaDialogType === 'registration' ? (
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                ) : betaDialogType === 'verification' ? (
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>

              {/* Title and Message */}
              <h2 className="text-2xl font-bold text-black text-center mb-3">
                {betaDialogType === 'registration' 
                  ? 'Beta Access Required' 
                  : betaDialogType === 'verification'
                  ? 'Email Verification Required'
                  : 'Pending Approval'}
              </h2>

              <p className="text-gray-600 text-center mb-6">
                {betaDialogType === 'registration' 
                  ? 'You need to join our beta program before you can sign in. It only takes a minute to register!'
                  : betaDialogType === 'verification'
                  ? 'Please verify your email address with the access code we sent you before signing in.'
                  : 'Your beta access request is pending approval. We\'ll notify you once you\'re approved!'}
              </p>

              {/* Action Buttons */}
              <div className="space-y-3">
                {betaDialogType === 'registration' && (
                  <Button
                    onClick={() => {
                      setShowBetaDialog(false);
                      router.push('/beta');
                    }}
                    className="btn-primary w-full"
                  >
                    Join Beta Program
                  </Button>
                )}

                {betaDialogType === 'verification' && (
                  <Button
                    onClick={() => {
                      setShowBetaDialog(false);
                      router.push('/beta');
                    }}
                    className="btn-primary w-full"
                  >
                    Verify Email
                  </Button>
                )}

                {betaDialogType === 'pending' && (
                  <Button
                    onClick={() => setShowBetaDialog(false)}
                    className="btn-primary w-full"
                  >
                    Got It
                  </Button>
                )}

                <Button
                  onClick={() => setShowBetaDialog(false)}
                  className="btn-ghost w-full"
                >
                  Close
                </Button>
              </div>

              {/* Additional Info */}
              {betaDialogType === 'registration' && (
                <p className="text-xs text-gray-500 text-center mt-4">
                  Already registered? <Link href="/beta" className="text-blue-600 hover:text-blue-700 underline">Enter verification code</Link>
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}