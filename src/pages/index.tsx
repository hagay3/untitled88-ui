import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import LoadingSpinner from "@/components/LoadingSpinner";
import SEO from "@/components/SEO";
import { AppConfig } from "@/utils/AppConfig";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // If user is authenticated, you can redirect to dashboard or another page
    // For now, we'll just show them the home page
  }, [session]);

  const handleSignIn = async () => {
    await signIn("auth0", { callbackUrl: "/" });
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
        title="AI-Powered Email Designer & Marketing Platform"
        description="Create stunning email campaigns with AI. Generate beautiful HTML templates, preview across devices, and integrate with Brevo, Mailchimp & Klaviyo. Start free today!"
        keywords="email marketing, AI email designer, email templates, HTML emails, email campaigns, email builder, responsive emails, Brevo integration, Mailchimp integration, Klaviyo integration"
        url="/"
      />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header/Navbar */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-3">
              <Image 
                src="/logo.png" 
                alt="Untitled88 Logo" 
                width={200}
                height={60}
                className="h-8 w-auto"
              />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {AppConfig.site_name}
              </h1>
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
                  >
                    Dashboard
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleSignOut}
                  >
                    Logout
                  </Button>
                </div>
              ) : (
                <Button onClick={handleSignIn}>
                  Sign In with Google
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            AI-Powered Email Designer
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Design and generate beautiful emails with our AI-powered chat builder. 
            Create stunning email templates in minutes, not hours.
          </p>
          
          {!session && (
            <Button size="lg" onClick={handleSignIn} className="text-lg px-8 py-6">
              Get Started - Sign In with Google
            </Button>
          )}
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <Card className="hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle>🎨 AI-Powered Design</CardTitle>
              <CardDescription>
                Chat with our AI to create stunning email designs tailored to your needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Simply describe what you want, and our AI will generate beautiful email templates for you.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle>✏️ Visual Email Builder</CardTitle>
              <CardDescription>
                Customize every detail with our intuitive drag-and-drop builder
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Fine-tune your emails with our powerful visual editor. No coding required.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle>👁️ Live Preview</CardTitle>
              <CardDescription>
                See your emails come to life with real-time preview
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Preview your emails across different devices and email clients instantly.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        {!session && (
          <div className="mt-20 text-center">
            <Card className="max-w-2xl mx-auto bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
              <CardHeader>
                <CardTitle className="text-white text-3xl">Ready to get started?</CardTitle>
                <CardDescription className="text-white/90 text-lg">
                  Join thousands of users creating beautiful emails with AI
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  size="lg" 
                  variant="secondary"
                  onClick={handleSignIn}
                  className="text-lg px-8 py-6"
                >
                  Sign In with Google - It&apos;s Free!
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2025 {AppConfig.site_name}. All rights reserved.</p>
          </div>
        </div>
      </footer>
      </div>
    </>
  );
}

