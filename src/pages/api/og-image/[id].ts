import { NextApiRequest, NextApiResponse } from 'next';
import puppeteer from 'puppeteer';

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid share ID' });
  }


  // Declare variables for fallback use
  let fallbackData: any = null;

  try {
    // Fetch the shared email data
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/share/${id}`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Untitled88-OG-Generator/1.0'
      }
    });

    if (!response.ok) {
      return res.status(404).json({ error: 'Email not found' });
    }

    const data = await response.json();

    if (!data.success) {
      return res.status(404).json({ error: 'Email not found' });
    }

    const sharedEmail: SharedEmail = data.shared_email;
    
    // Store data for fallback use
    fallbackData = data;

    // Extract email content for the preview
    let emailTitle = sharedEmail.email_subject || 'Shared Email';
    let authorEmail = sharedEmail.email_address || 'Anonymous';
    
    // Sanitize text to handle special characters and emojis
    const sanitizeText = (text: string): string => {
      return text
        .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII characters (emojis, special chars)
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
    };
    
    emailTitle = sanitizeText(emailTitle);
    authorEmail = sanitizeText(authorEmail);

    // Convert email JSON to HTML using EmailConverter
    let emailHtml = '';
    try {
      if (sharedEmail.email_json && typeof sharedEmail.email_json === 'object') {
        // Import emailConverter dynamically for server-side use
        const { emailConverter } = await import('@/utils/EmailConverter');
        emailHtml = emailConverter.jsonToHtml(sharedEmail.email_json);
      } else if (sharedEmail.email_json && typeof sharedEmail.email_json === 'string') {
        try {
          const parsedJson = JSON.parse(sharedEmail.email_json);
          const { emailConverter } = await import('@/utils/EmailConverter');
          emailHtml = emailConverter.jsonToHtml(parsedJson);
        } catch (parseError) {
          emailHtml = sharedEmail.email_html || '';
        }
      } else {
        emailHtml = sharedEmail.email_html || '';
      }
    } catch (conversionError) {
      emailHtml = sharedEmail.email_html || '';
    }

    // Create a complete HTML page for the email preview
    const fullHtmlPage = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${emailTitle}</title>
        <style>
          body {
            margin: 0;
            padding: 20px;
            font-family: Arial, sans-serif;
            background: #ffffff;
            min-height: 100vh;
            width: 1200px;
            height: 630px;
            overflow: hidden;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: #f9fafb;
            padding: 20px;
            border-bottom: 1px solid #e5e7eb;
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .logo {
            width: 32px;
            height: 32px;
            background: #3b82f6;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 14px;
          }
          .brand {
            font-weight: bold;
            font-size: 18px;
            color: #000;
          }
          .email-content {
            padding: 0;
          }
          .footer {
            background: #f9fafb;
            padding: 15px 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo">U</div>
            <div class="brand">Untitled88</div>
          </div>
          <div class="email-content">
            ${emailHtml}
          </div>
          <div class="footer">
            Shared by ${authorEmail} • Created with Untitled88
          </div>
        </div>
      </body>
      </html>
    `;

    // Use Puppeteer to generate screenshot
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      });

      const page = await browser.newPage();
      
      // Set viewport for OG image dimensions
      await page.setViewport({
        width: 1200,
        height: 630,
        deviceScaleFactor: 1
      });

      // Set the HTML content
      await page.setContent(fullHtmlPage, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      // Wait a bit more for  crawler to ensure everything is rendered

      await new Promise(resolve => setTimeout(resolve, 2000));


      // Take screenshot
      const screenshot = await page.screenshot({
        type: 'png',
        fullPage: false,
        quality: 100,
        omitBackground: false,
        clip: {
          x: 0,
          y: 0,
          width: 1200,
          height: 630
        }
      });

      await browser.close();

      // Set appropriate headers
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Length', screenshot.length.toString());
      
      
      res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours 
      
      
      
      // Return the PNG image
      res.status(200).send(screenshot);

    } catch (puppeteerError) {
      if (browser) {
        await browser.close();
      }
      throw puppeteerError;
    }

  } catch (error) {
    console.error('Error generating OG image:', error);
    
    // Extract basic info for fallback (re-declare in catch scope)
    let fallbackTitle = 'Email Preview';
    let fallbackAuthor = 'Anonymous';
    
    try {
      if (fallbackData?.shared_email?.email_subject) {
        fallbackTitle = fallbackData.shared_email.email_subject.replace(/[^\x00-\x7F]/g, '').trim();
      }
      if (fallbackData?.shared_email?.email_address) {
        fallbackAuthor = fallbackData.shared_email.email_address.replace(/[^\x00-\x7F]/g, '').trim();
      }
    } catch (e) {
      // Use defaults
    }
    
    // Fallback to a simple SVG response with solid white background
    const fallbackSvg = `
      <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
        <!-- Solid white background -->
        <rect width="100%" height="100%" fill="#ffffff"/>
        
        <!-- Email card -->
        <rect x="100" y="100" width="1000" height="430" rx="20" fill="#ffffff" stroke="#e5e7eb" stroke-width="2"/>
        
        <!-- Header section -->
        <rect x="100" y="100" width="1000" height="80" rx="20" fill="#f9fafb"/>
        <line x1="100" y1="180" x2="1100" y2="180" stroke="#e5e7eb" stroke-width="1"/>
        
        <!-- Logo -->
        <circle cx="150" cy="140" r="20" fill="#3b82f6"/>
        <text x="180" y="150" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#000000">Untitled88</text>
        
        <!-- Email title -->
        <text x="150" y="240" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#000000">${fallbackTitle}</text>
        
        <!-- Content area -->
        <rect x="150" y="270" width="900" height="180" fill="#ffffff"/>
        <text x="150" y="300" font-family="Arial, sans-serif" font-size="16" fill="#6b7280">Professional email created with Untitled88</text>
        <text x="150" y="330" font-family="Arial, sans-serif" font-size="14" fill="#9ca3af">Shared by ${fallbackAuthor}</text>
        
        <!-- Footer -->
        <rect x="100" y="480" width="1000" height="50" fill="#f9fafb"/>
        <text x="150" y="510" font-family="Arial, sans-serif" font-size="12" fill="#9ca3af">Created with Untitled88 • Professional Email Designer</text>
      </svg>
    `;
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=300'); // Shorter cache for fallback
    res.status(200).send(fallbackSvg);
  }
}
