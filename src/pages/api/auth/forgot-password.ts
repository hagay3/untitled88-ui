import { NextApiRequest, NextApiResponse } from 'next';
import EmailService from '@/lib/emailService';

interface ForgotPasswordRequest {
  email: string;
}

interface Auth0ManagementToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email }: ForgotPasswordRequest = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Get Auth0 Management API token
    const tokenResponse = await fetch(`https://${process.env.AUTH0_DOMAIN}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.AUTH0_M2M_CLIENT_ID,
        client_secret: process.env.AUTH0_M2M_CLIENT_SECRET,
        audience: `https://${process.env.AUTH0_DOMAIN}/api/v2/`,
        grant_type: 'client_credentials',
      }),
    });

    if (!tokenResponse.ok) {
      return res.status(500).json({ message: 'Authentication service error' });
    }

    const tokenData: Auth0ManagementToken = await tokenResponse.json();

    // First, get the connection ID for Username-Password-Authentication
    const connectionsResponse = await fetch(`https://${process.env.AUTH0_DOMAIN}/api/v2/connections?name=Username-Password-Authentication`, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    if (!connectionsResponse.ok) {
      return res.status(500).json({ message: 'Failed to retrieve connection information' });
    }

    const connections = await connectionsResponse.json();
    if (!connections || connections.length === 0) {
      return res.status(500).json({ message: 'Database connection not found' });
    }

    const connectionId = connections[0].id;

    // Send password reset email via Auth0 Management API
    const resetResponse = await fetch(`https://${process.env.AUTH0_DOMAIN}/api/v2/tickets/password-change`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
      body: JSON.stringify({
        connection_id: connectionId,
        email: email,
        client_id: process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID,
        // Optional: Time to live in seconds (default is 432000 = 5 days)
        ttl_sec: 86400, // 24 hours
      }),
    });

    if (!resetResponse.ok) {
      const errorData = await resetResponse.json();
      
      // Handle specific Auth0 errors
      if (errorData.statusCode === 400 && errorData.message?.includes('user does not exist')) {
        // For security reasons, we don't reveal if the user exists or not
        // We return success even if the user doesn't exist
        return res.status(200).json({
          message: 'If an account with this email exists, you will receive a password reset link shortly.',
        });
      }
      
      return res.status(400).json({ 
        message: errorData.message || 'Failed to send password reset email. Please try again.' 
      });
    }

    const resetData = await resetResponse.json();


    // Send custom email using our email service
    const emailService = new EmailService();
    
    const emailSent = await emailService.sendPasswordResetEmail({
      to: email,
      subject: 'Reset Your Untitled88 Password',
      resetUrl: resetData.ticket, // This is the Auth0 reset URL
    });

    if (!emailSent) {
      return res.status(500).json({ 
        message: 'Password reset link was created but email could not be sent. Please try again.' 
      });
    }

    // Return success response
    return res.status(200).json({
      message: 'Password reset email sent successfully. Please check your inbox.',
      ticket: resetData.ticket, // This contains the reset URL (optional to return)
    });

  } catch (error) {
    return res.status(500).json({ 
      message: 'Internal server error. Please try again later.' 
    });
  }
}
