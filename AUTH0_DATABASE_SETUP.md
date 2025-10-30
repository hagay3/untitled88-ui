# Auth0 Database Connection Setup Guide

## Overview
This guide will help you set up Auth0's Database Connection to enable email/password authentication alongside Google OAuth.

## Steps to Enable Database Connection

### 1. Enable Database Connection in Auth0 Dashboard

1. **Go to Auth0 Dashboard** → **Authentication** → **Database**
2. **Create a new Database Connection** (if not already created):
   - Click **"+ Create DB Connection"**
   - Name: `Username-Password-Authentication` (this matches our code)
   - Database Type: Choose your preference (Auth0's built-in database is fine)

### 2. Configure Database Connection Settings

1. **In the Database Connection settings**:
   - **Enable "Disable Sign Ups"** if you want to control user registration
   - **Configure Password Policy** (strength requirements)
   - **Set up Email Templates** for verification and password reset

### 3. Enable Connection for Your Application

1. **Go to Applications** → **Your Untitled88 App**
2. **Connections Tab**
3. **Enable the Database Connection**:
   - Find `Username-Password-Authentication`
   - Toggle it **ON**

### 4. Configure Email Templates (Optional but Recommended)

1. **Go to Branding** → **Email Templates**
2. **Configure templates for**:
   - Welcome Email
   - Verification Email
   - Change Password Confirmation
   - Blocked Account Email

### 5. Test the Setup

1. **Go to your login page**: `http://localhost:3000/login`
2. **Try both flows**:
   - Click "Continue with Google" → Should work as before
   - Click "Sign in with email and password" → Should redirect to Auth0's hosted login
   - Try "Sign Up" → Should redirect to Auth0's hosted signup

## How It Works

### Current Flow:
1. **User clicks "Sign in with email and password"**
2. **Enters email/password in your custom form**
3. **NextAuth redirects to Auth0's hosted login page** with:
   - `connection=Username-Password-Authentication`
   - `login_hint=user@email.com`
   - Pre-filled email field

### For Sign Up:
1. **User clicks "Sign Up"**
2. **Enters email/password/confirm password**
3. **NextAuth redirects to Auth0's hosted signup page** with:
   - `connection=Username-Password-Authentication`
   - `screen_hint=signup`
   - `login_hint=user@email.com`

## Environment Variables Required

Make sure these are set in your `.env.local`:

```env
NEXT_PUBLIC_AUTH0_DOMAIN=your-auth0-domain.auth0.com
NEXT_PUBLIC_AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
AUTH0_ISSUER=https://your-auth0-domain.auth0.com
```

## Troubleshooting

### If email/password login redirects to Google:
1. **Check that Database Connection is enabled** for your application
2. **Verify the connection name** is exactly `Username-Password-Authentication`
3. **Check Auth0 logs** in Dashboard → Monitoring → Logs

### If signup doesn't work:
1. **Check "Disable Sign Ups" setting** in Database Connection
2. **Verify email templates** are configured
3. **Check password policy** requirements

### If users can't verify email:
1. **Configure Email Provider** in Auth0 Dashboard → Authentication → Emails
2. **Set up email templates** with proper verification links

## Next Steps

After setup:
1. **Test both authentication methods**
2. **Configure email verification** (recommended)
3. **Set up password reset flow**
4. **Customize Auth0's hosted login page** (optional)
5. **Add social connections** if needed (Facebook, Apple, etc.)

## Notes

- **Auth0's hosted login page** provides better security and handles edge cases
- **Email verification** is highly recommended for production
- **Password policies** can be customized in the Database Connection settings
- **Branding** can be applied to Auth0's hosted pages to match your design
