# Auth0 Machine-to-Machine Setup for Custom Sign-Up

## Overview
To enable custom sign-up (instead of Auth0's hosted pages), we need to set up a Machine-to-Machine application that can access Auth0's Management API to create users programmatically.

## Steps to Set Up Machine-to-Machine Application

### 1. Create Machine-to-Machine Application

1. **Go to Auth0 Dashboard** → **Applications**
2. **Click "Create Application"**
3. **Choose "Machine to Machine Applications"**
4. **Name**: `Untitled88 Management API`
5. **Select API**: `Auth0 Management API`
6. **Click "Create"**

### 2. Configure Scopes

After creating the M2M application:

1. **In the APIs tab**, find `Auth0 Management API`
2. **Expand the application** you just created
3. **Enable the following scopes**:
   - `create:users` - Required to create new users
   - `read:users` - Optional, for user lookup
   - `update:users` - Optional, for user updates
   - `read:user_idp_tokens` - Optional, for social connections
   - `read:connections` - Required for forgot password functionality
   - `create:user_tickets` - Required for password reset tickets

### 3. Get Credentials

1. **Go to Applications** → **Your M2M App**
2. **Copy the following values**:
   - **Client ID** (for `AUTH0_M2M_CLIENT_ID`)
   - **Client Secret** (for `AUTH0_M2M_CLIENT_SECRET`)

### 4. Update Environment Variables

Add these to your `.env.local` file:

```env
# Existing Auth0 variables
NEXT_PUBLIC_AUTH0_DOMAIN=your-domain.auth0.com
NEXT_PUBLIC_AUTH0_CLIENT_ID=your-web-app-client-id
AUTH0_CLIENT_SECRET=your-web-app-client-secret
AUTH0_ISSUER=https://your-domain.auth0.com

# New M2M variables for custom signup
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_M2M_CLIENT_ID=your-m2m-client-id
AUTH0_M2M_CLIENT_SECRET=your-m2m-client-secret
```

### 5. Enable Database Connection

Make sure your Database Connection is properly configured:

1. **Go to Authentication** → **Database**
2. **Find "Username-Password-Authentication"**
3. **Settings**:
   - ✅ **Disable Sign Ups**: OFF (allow programmatic signup)
   - ✅ **Requires Username**: OFF (use email only)
   - ✅ **Password Policy**: Configure as needed
4. **Applications Tab**: Enable for your main web application

### 6. Configure Email Settings (Recommended)

For email verification to work:

1. **Go to Authentication** → **Emails**
2. **Configure Email Provider** (SendGrid, Mailgun, etc.)
3. **Go to Branding** → **Email Templates**
4. **Configure "Verification Email" template**

## How the Custom Sign-Up Works

### 1. User Flow:
1. User fills out sign-up form on your website
2. Form data is sent to `/api/auth/signup`
3. API gets M2M token from Auth0
4. API creates user via Auth0 Management API
5. User receives verification email (if configured)
6. User is automatically signed in
7. User is redirected to dashboard

### 2. Technical Flow:
```
Frontend → /api/auth/signup → Auth0 M2M Token → Auth0 Management API → User Created
                                                                            ↓
Frontend ← NextAuth Sign-In ← Auth0 Database Connection ← User Created
```

## Benefits of Custom Sign-Up

✅ **Full UI Control**: Your design, your branding
✅ **Better UX**: No redirects to Auth0 pages
✅ **Custom Validation**: Add your own validation rules
✅ **Error Handling**: Better error messages
✅ **Analytics**: Track sign-up funnel in your analytics
✅ **A/B Testing**: Test different sign-up flows

## Testing the Setup

1. **Restart your development server**:
   ```bash
   npm run dev
   ```

2. **Test sign-up flow**:
   - Go to `/login`
   - Click "Sign Up"
   - Fill out email/password
   - Click "Create Account"
   - Should see success message and auto sign-in

3. **Check Auth0 Dashboard**:
   - Go to **User Management** → **Users**
   - Verify new user was created
   - Check user's connection is "Username-Password-Authentication"

## Troubleshooting

### Error: "Insufficient scope"
- **Check M2M scopes**: Ensure `create:users` is enabled
- **Verify API selection**: Make sure M2M app is authorized for Management API

### Error: "user_exists"
- **User already exists**: Try with different email
- **Check connection**: Verify user isn't in different connection

### Error: "password_strength_error"
- **Check password policy**: Go to Database Connection settings
- **Update validation**: Adjust frontend validation to match Auth0 policy

### Email verification not working
- **Configure email provider**: Set up SendGrid/Mailgun in Auth0
- **Check email templates**: Verify verification email template is configured
- **Check spam folder**: Verification emails might be filtered

## Security Notes

🔒 **M2M Credentials**: Keep client secret secure, never expose in frontend
🔒 **Rate Limiting**: Auth0 has rate limits on Management API calls
🔒 **Scopes**: Only grant minimum required scopes to M2M application
🔒 **Environment**: Use different M2M apps for dev/staging/production
