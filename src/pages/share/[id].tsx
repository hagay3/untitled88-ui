import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useSession } from 'next-auth/react';
import { emailConverter } from '@/utils/EmailConverter';
import { sendError } from '@/utils/actions';
import { canCopyJson } from '@/utils/testEmails';
import { GetServerSideProps } from 'next';

interface SharedEmail {
  user_id: string;
  email_address: string;
  email_json: any;
  shareable_link: string;
  email_subject: string;
  email_html: string;
  view_count: number;
  created_at: string;
}

interface SharePageProps {
  sharedEmail: SharedEmail | null;
  error: string | null;
  convertedHtml: string;
}

export default function SharePage({ sharedEmail: initialSharedEmail, error: initialError, convertedHtml: initialConvertedHtml }: SharePageProps) {
  const router = useRouter();
  const { id } = router.query;
  const { data: session } = useSession();
  
  const [sharedEmail, setSharedEmail] = useState<SharedEmail | null>(initialSharedEmail);
  const [convertedHtml, setConvertedHtml] = useState<string>(initialConvertedHtml);
  const [loading, setLoading] = useState(!initialSharedEmail && !initialError);
  const [error, setError] = useState<string | null>(initialError);

  useEffect(() => {
    // Skip fetching if we already have data from SSR
    if (initialSharedEmail || initialError) return;
    if (!id || typeof id !== 'string') return;

    const fetchSharedEmail = async () => {
      try {
        setLoading(true);
        setError(null);

        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/share/${id}`;
        
        const response = await fetch(apiUrl);

        if (!response.ok) {
          await response.text(); // Consume the response
          setError(`Failed to load shared email: ${response.status} ${response.statusText}`);
          return;
        }

        const data = await response.json();

        if (data.success) {
          const emailData = data.shared_email;
          setSharedEmail(emailData);
          
          // Convert JSON to HTML for display
          try {
            let htmlToDisplay = '';
            
            if (emailData.email_json && typeof emailData.email_json === 'object') {
              // Convert JSON structure to HTML using EmailConverter
              htmlToDisplay = emailConverter.jsonToHtml(emailData.email_json);
            } else if (emailData.email_json && typeof emailData.email_json === 'string') {
              // Parse JSON string first, then convert
              try {
                const parsedJson = JSON.parse(emailData.email_json);
                htmlToDisplay = emailConverter.jsonToHtml(parsedJson);
              } catch (parseError) {
                // Fallback to stored HTML
                htmlToDisplay = emailData.email_html || '';
              }
            } else {
              // Fallback to stored HTML if no valid JSON
              htmlToDisplay = emailData.email_html || '';
            }
            
            setConvertedHtml(htmlToDisplay);
          } catch (conversionError) {
            // Fallback to stored HTML
            setConvertedHtml(emailData.email_html || '');
          }
        } else {
          setError(data.error || 'Email not found');
        }
      } catch (err) {
        setError('Failed to load shared email');
      } finally {
        setLoading(false);
      }
    };

    fetchSharedEmail();
  }, [id, initialSharedEmail, initialError]);

  const handleBuildEmailClick = () => {
    if (session) {
      // User is logged in, go to dashboard
      router.push('/dashboard');
    } else {
      // User is not logged in, go to beta registration
      router.push('/beta');
    }
  };

  const handleExportHtml = () => {
    if (!sharedEmail) return;
    
    // Get the HTML content (prioritize converted HTML from JSON)
    const htmlContent = convertedHtml || sharedEmail.email_html;
    
    // Check if the HTML already has a complete document structure
    if (htmlContent.trim().toLowerCase().startsWith('<!doctype html')) {
      // HTML is already a complete document, use it as-is
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${sharedEmail.email_subject || 'email'}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return;
    }
    
    // If it's just HTML content without document structure, wrap it minimally
    const fullHtmlDocument = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${sharedEmail.email_subject || 'Email'}</title>
</head>
<body style="margin: 0; padding: 0;">
    ${htmlContent}
</body>
</html>`;
    
    // Create and download the file
    const blob = new Blob([fullHtmlDocument], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sharedEmail.email_subject || 'email'}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const [copyJsonSuccess, setCopyJsonSuccess] = useState(false);
  
  // Check if current user can copy JSON
  const userCanCopyJson = canCopyJson(session?.user?.email);

  const handleCopyJson = async () => {
    if (!sharedEmail?.email_json) {
      return;
    }

    try {
      // Get the JSON content
      let jsonContent = sharedEmail.email_json;
      
      // If it's already a string, parse it first to ensure proper formatting
      if (typeof jsonContent === 'string') {
        try {
          jsonContent = JSON.parse(jsonContent);
        } catch (parseError) {
          // If parsing fails, use the string as is
          sendError(sharedEmail.user_id, "Failed to parse JSON string", parseError);
        }
      }
      
      // Format with pretty indentation (4 spaces to match your example)
      const prettyJsonContent = JSON.stringify(jsonContent, null, 4);
      
      // Copy to clipboard
      await navigator.clipboard.writeText(prettyJsonContent);
      setCopyJsonSuccess(true);
      setTimeout(() => setCopyJsonSuccess(false), 2000);
    } catch (error) {
      //
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Navigation Bar */}
        <nav className="glass-card border-0 border-b border-black/10 rounded-none">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                  <img src="/logo-untitled88.png" alt="Untitled88 Logo" width={32} height={32} />
                </div>
                <span className="text-xl font-bold text-black">Untitled88</span>
              </Link>
            </div>
          </div>
        </nav>

        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <LoadingSpinner />
            <p className="mt-4 text-gray-600">Loading shared email...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !sharedEmail) {
    return (
      <>
        <Head>
          <title>Email Not Found - Untitled88</title>
          <meta name="description" content="The shared email you're looking for could not be found." />
        </Head>
        
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
          {/* Navigation Bar */}
          <nav className="glass-card border-0 border-b border-black/10 rounded-none">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <Link href="/" className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                    <img src="/logo-untitled88.png" alt="Untitled88 Logo" width={32} height={32} />
                  </div>
                  <span className="text-xl font-bold text-black">Untitled88</span>
                </Link>
                
                <Button 
                  onClick={handleBuildEmailClick}
                  className="btn-primary"
                >
                  Build Your Email
                </Button>
              </div>
            </div>
          </nav>

          <div className="flex items-center justify-center min-h-[80vh]">
            <Card className="glass-card p-8 max-w-md mx-4 text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-black mb-2">Email Not Found</h1>
                <p className="text-gray-600 mb-6">
                  {error || 'The shared email you&apos;re looking for could not be found or may have been removed.'}
                </p>
                <div className="space-y-3">
                  <Button 
                    onClick={handleBuildEmailClick}
                    className="btn-primary w-full"
                  >
                    Build Your Own Email
                  </Button>
                  <Link href="/">
                    <Button variant="outline" className="w-full">
                      Go to Homepage
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </>
    );
  }

  const shareUrl = typeof window !== 'undefined' ? window.location.href : `https://untitled88.com/share/${id}`;
  const emailSubject = sharedEmail?.email_subject || 'Shared Email';
  const emailDescription = `Check out this email created with Untitled88 - ${emailSubject}`;
  
  // Create a preview text from the email content
  const getEmailPreview = () => {
    if (!sharedEmail) return emailDescription;
    
    try {
      // Try to extract text from the email JSON for a better description
      if (sharedEmail.email_json && typeof sharedEmail.email_json === 'object') {
        const blocks = sharedEmail.email_json.blocks || [];
        const textBlocks = blocks.filter((block: any) => 
          block.blockType === 'hero' || block.blockType === 'text'
        );
        
        if (textBlocks.length > 0) {
          const firstBlock = textBlocks[0];
          const content = firstBlock.content;
          const text = content?.headline || content?.text || content?.subheadline || '';
          if (text && text.length > 10) {
            return `${text.substring(0, 150)}${text.length > 150 ? '...' : ''} - Created with Untitled88`;
          }
        }
      }
    } catch (e) {
      // Fallback to default description
    }
    
    return emailDescription;
  };
  
  const metaDescription = getEmailPreview();
  
  // Consistent date formatting to avoid hydration errors
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      // Use consistent formatting that works on both server and client
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
      });
    } catch (error) {
      return 'Unknown date';
    }
  };

  return (
    <>
      <Head>
        <title>{`${emailSubject} - Shared Email | Untitled88`}</title>
        <meta name="description" content={metaDescription} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={shareUrl} />
        <meta property="og:title" content={`${emailSubject} - Shared Email | Untitled88`} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={`https://untitled88.com/api/og-image/${id}`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={`Preview of ${emailSubject} email created with Untitled88`} />
        <meta property="og:site_name" content="Untitled88" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:site" content="@untitled88" />
        <meta property="twitter:creator" content="@untitled88" />
        <meta property="twitter:url" content={shareUrl} />
        <meta property="twitter:title" content={`${emailSubject} - Shared Email | Untitled88`} />
        <meta property="twitter:description" content={metaDescription} />
        <meta property="twitter:image" content={`https://untitled88.com/api/og-image/${id}`} />
        <meta property="twitter:image:alt" content={`Preview of ${emailSubject} email created with Untitled88`} />
        
        {/* LinkedIn */}
        <meta property="linkedin:title" content={`${emailSubject} - Shared Email | Untitled88`} />
        <meta property="linkedin:description" content={metaDescription} />
        <meta property="linkedin:image" content={`https://untitled88.com/api/og-image/${id}`} />
        
        {/* Additional SEO */}
        <meta name="author" content="Untitled88" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" content={shareUrl} />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebPage",
              "name": `${emailSubject} - Shared Email`,
              "description": metaDescription,
              "url": shareUrl,
              "image": `https://untitled88.com/api/og-image/${id}`,
              "publisher": {
                "@type": "Organization",
                "name": "Untitled88",
                "url": "https://untitled88.com"
              },
              "datePublished": sharedEmail?.created_at,
              "author": {
                "@type": "Person",
                "email": sharedEmail?.email_address
              }
            })
          }}
        />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Navigation Bar */}
        <nav className="glass-card border-0 border-b border-black/10 rounded-none">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                  <img src="/logo-untitled88.png" alt="Untitled88 Logo" width={32} height={32} />
                </div>
                <span className="text-xl font-bold text-black">Untitled88</span>
              </Link>
              
              <div className="flex items-center space-x-4">
                <div className="hidden sm:flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {sharedEmail.view_count} views
                </div>
                
                <Button 
                  onClick={handleBuildEmailClick}
                  className="btn-primary flex-shrink-0 whitespace-nowrap"
                >
                  Build Your Email
                </Button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-black mb-2">{emailSubject}</h1>
            <p className="text-gray-600">
              Shared by {sharedEmail.email_address} • {formatDate(sharedEmail.created_at)}
            </p>
          </div>

          {/* Email Preview */}
          <Card className="glass-card p-0 overflow-hidden">
            <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-black">Email Preview</h2>
                <div className="flex items-center space-x-4">
                  {/* Export button */}
                  <button
                    onClick={handleExportHtml}
                    className="text-green-600 hover:text-green-700 transition-colors"
                    title="Export HTML file"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>
                  
                  {/* Copy JSON button - Only for test emails */}
                  {sharedEmail?.email_json && userCanCopyJson && (
                    <button
                      onClick={handleCopyJson}
                      className={`transition-colors ${
                        copyJsonSuccess 
                          ? 'text-green-700' 
                          : 'text-purple-600 hover:text-purple-700'
                      }`}
                      title="Copy JSON representation"
                    >
                      {copyJsonSuccess ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  )}
                  
                  {/* Share buttons */}
                  <button
                    onClick={() => {
                      const text = `Check out this email: ${emailSubject}`;
                      const url = shareUrl;
                      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
                    }}
                    className="text-blue-500 hover:text-blue-600 transition-colors"
                    title="Share on Twitter"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </button>
                  
                  <button
                    onClick={() => {
                      const url = shareUrl;
                      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
                    }}
                    className="text-blue-700 hover:text-blue-800 transition-colors"
                    title="Share on LinkedIn"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </button>
                  
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(shareUrl);
                      // You could add a toast notification here
                    }}
                    className="text-gray-600 hover:text-gray-700 transition-colors"
                    title="Copy link"
                  >
                    Copy URL
                  </button>
                </div>
              </div>
            </div>
            
            {/* Email HTML Content */}
            <div className="p-6">
              <div className="w-full border border-gray-200 rounded-lg bg-white">
                <div 
                  className="w-full bg-white p-4"
                  style={{
                    fontFamily: 'Arial, sans-serif',
                    lineHeight: '1.6',
                    color: '#000000'
                  }}
                  dangerouslySetInnerHTML={{
                    __html: convertedHtml || sharedEmail.email_html
                  }}
                />
              </div>
            </div>
          </Card>

          {/* Call to Action */}
          <div className="text-center mt-12">
            <Card className="glass-card p-8 max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-black mb-4">
                Create Your Own Professional Emails
              </h3>
              <p className="text-gray-600 mb-6">
                Build stunning email campaigns with AI-powered design tools. 
                Join thousands of marketers creating beautiful emails with Untitled88.
              </p>
              <Button 
                onClick={handleBuildEmailClick}
                className="btn-primary text-lg px-8 py-3"
              >
                Get Started - Build Your Email
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

// Server-side rendering for better social media previews
export const getServerSideProps: GetServerSideProps<SharePageProps> = async (context) => {
  const { id } = context.params!;
  
  if (!id || typeof id !== 'string') {
    return {
      props: {
        sharedEmail: null,
        error: 'Invalid share ID',
        convertedHtml: ''
      }
    };
  }

  try {
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/share/${id}`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Untitled88-SSR/1.0'
      }
    });

    if (!response.ok) {
      return {
        props: {
          sharedEmail: null,
          error: `Failed to load shared email: ${response.status} ${response.statusText}`,
          convertedHtml: ''
        }
      };
    }

    const data = await response.json();

    if (data.success) {
      const emailData = data.shared_email;
      
      // Convert JSON to HTML for display
      let htmlToDisplay = '';
      
      try {
        if (emailData.email_json && typeof emailData.email_json === 'object') {
          // Import emailConverter dynamically for server-side use
          const { emailConverter } = await import('@/utils/EmailConverter');
          htmlToDisplay = emailConverter.jsonToHtml(emailData.email_json);
        } else if (emailData.email_json && typeof emailData.email_json === 'string') {
          try {
            const parsedJson = JSON.parse(emailData.email_json);
            const { emailConverter } = await import('@/utils/EmailConverter');
            htmlToDisplay = emailConverter.jsonToHtml(parsedJson);
          } catch (parseError) {
            htmlToDisplay = emailData.email_html || '';
          }
        } else {
          htmlToDisplay = emailData.email_html || '';
        }
      } catch (conversionError) {
        htmlToDisplay = emailData.email_html || '';
      }
      
      return {
        props: {
          sharedEmail: emailData,
          error: null,
          convertedHtml: htmlToDisplay
        }
      };
    } else {
      return {
        props: {
          sharedEmail: null,
          error: data.error || 'Email not found',
          convertedHtml: ''
        }
      };
    }
  } catch (err) {
    return {
      props: {
        sharedEmail: null,
        error: 'Failed to load shared email',
        convertedHtml: ''
      }
    };
  }
};
