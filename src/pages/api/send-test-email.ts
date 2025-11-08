import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import EmailService from '@/lib/emailService';

interface SendTestEmailRequest {
  to: string;
  subject: string;
  htmlContent: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check authentication
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user?.email) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { to, subject, htmlContent }: SendTestEmailRequest = req.body;

    // Validate required fields
    if (!to || !subject || !htmlContent) {
      return res.status(400).json({ 
        error: 'Missing required fields: to, subject, htmlContent' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return res.status(400).json({ 
        error: 'Invalid email address format' 
      });
    }

    // Initialize email service
    const emailService = new EmailService();

    // Test SMTP connection first
    const connectionTest = await emailService.testConnection();
    if (!connectionTest) {
      return res.status(500).json({ 
        error: 'SMTP connection failed. Please check email configuration.' 
      });
    }

    // Send test email
    const success = await emailService.sendTestEmail({
      to,
      subject: `${subject}`,
      htmlContent,
      senderEmail: session.user.email
    });

    if (success) {
      res.status(200).json({ 
        success: true, 
        message: 'Test email sent successfully',
        sentTo: to
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to send test email' 
      });
    }

  } catch (error) {
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
}
