import { NextApiRequest, NextApiResponse } from 'next';

interface SignUpRequest {
  email: string;
  password: string;
}

interface Auth0ManagementToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface Auth0User {
  user_id: string;
  email: string;
  email_verified: boolean;
  created_at: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password }: SignUpRequest = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Basic password validation
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    // Get Auth0 Management API token
    const tokenResponse = await fetch(`https://${process.env.NEXT_PUBLIC_AUTH0_DOMAIN}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.AUTH0_M2M_CLIENT_ID,
        client_secret: process.env.AUTH0_M2M_CLIENT_SECRET,
        audience: `https://${process.env.NEXT_PUBLIC_AUTH0_DOMAIN}/api/v2/`,
        grant_type: 'client_credentials',
      }),
    });

    if (!tokenResponse.ok) {
      return res.status(500).json({ message: 'Authentication service error' });
    }

    const tokenData: Auth0ManagementToken = await tokenResponse.json();

    // Create user in Auth0
    const createUserResponse = await fetch(`https://${process.env.NEXT_PUBLIC_AUTH0_DOMAIN}/api/v2/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
      body: JSON.stringify({
        email,
        password,
        connection: 'Username-Password-Authentication',
        email_verified: true, // Auto-verify for seamless login
        verify_email: false, // Skip verification email for now
      }),
    });

    if (!createUserResponse.ok) {
      const errorData = await createUserResponse.json();
      
      // Handle specific Auth0 errors
      if (errorData.code === 'user_exists') {
        return res.status(409).json({ message: 'An account with this email already exists' });
      }
      
      if (errorData.code === 'password_no_user_info') {
        return res.status(400).json({ message: 'Password cannot contain user information' });
      }
      
      if (errorData.code === 'password_dictionary_error') {
        return res.status(400).json({ message: 'Password is too common. Please choose a stronger password' });
      }
      
      if (errorData.code === 'password_strength_error') {
        return res.status(400).json({ message: 'Password is too weak. Please choose a stronger password' });
      }

      return res.status(400).json({ 
        message: errorData.message || 'Failed to create account. Please try again.' 
      });
    }

    const userData: Auth0User = await createUserResponse.json();

    // Return success response
    return res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: userData.user_id,
        email: userData.email,
        email_verified: userData.email_verified,
      },
    });

  } catch (error) {
    return res.status(500).json({ 
      message: 'Internal server error. Please try again later.' 
    });
  }
}
