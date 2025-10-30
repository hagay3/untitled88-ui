# Auth0 Custom Login Setup Guide

## Overview
This guide enables custom email/password login using your own UI instead of Auth0's hosted login pages. Both sign-up and sign-in will happen on your website.

## Required Auth0 Configuration

### 1. Enable Resource Owner Password Grant

**IMPORTANT**: This is required for custom email/password authentication.

1. **Go to Auth0 Dashboard** → **Applications** → **Your App**
2. **Advanced Settings** → **Grant Types**
3. **Enable "Password"** grant type
4. **Save Changes**

### 2. Configure Application Settings

1. **Application Type**: Single Page Application (SPA)
2. **Token Endpoint Authentication Method**: None (for SPA)
3. **Allowed Callback URLs**: 
   ```
   http://localhost:3000/api/auth/callback/auth0,
   https://yourdomain.com/api/auth/callback/auth0
   ```

### 3. Database Connection Settings

1. **Go to Authentication** → **Database**
2. **Username-Password-Authentication** → **Settings**:
   - ✅ **Disable Sign Ups**: OFF (allow programmatic signup)
   - ✅ **Requires Username**: OFF (use email only)
   - ✅ **Password Policy**: Configure as needed
3. **Applications Tab**: Enable for your web application

### 4. Machine-to-Machine Application (for Sign-Up)

Follow the `AUTH0_M2M_SETUP.md` guide to create M2M app for user creation.

## Environment Variables

Update your `.env.local`:

```env
# Auth0 Domain (without https://)
AUTH0_DOMAIN=your-domain.auth0.com

# Web Application (SPA) Credentials
NEXT_PUBLIC_AUTH0_CLIENT_ID=your-spa-client-id
AUTH0_CLIENT_SECRET=your-spa-client-secret
AUTH0_ISSUER=https://your-domain.auth0.com

# Machine-to-Machine Credentials (for signup)
AUTH0_M2M_CLIENT_ID=your-m2m-client-id
AUTH0_M2M_CLIENT_SECRET=your-m2m-client-secret

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret-key
```

## How the Custom Authentication Works

### 1. Google OAuth (unchanged):
```
User → "Continue with Google" → Auth0 Provider → Google → Auth0 → Your App
```

### 2. Custom Email/Password Sign-Up:
```
User → Fill Form → /api/auth/signup → Auth0 Management API → User Created
                                                                ↓
User ← Dashboard ← NextAuth Session ← Credentials Provider ← Auto Sign-In
```

### 3. Custom Email/Password Sign-In:
```
User → Fill Form → Credentials Provider → Auth0 Password Grant → NextAuth Session → Dashboard
```

## Key Benefits

✅ **Full UI Control**: Your design, no redirects to Auth0 pages
✅ **Seamless UX**: Users never leave your website
✅ **Custom Validation**: Add your own validation rules
✅ **Better Analytics**: Track complete authentication funnel
✅ **Mobile Friendly**: No redirect issues on mobile devices

## Security Notes

🔒 **Resource Owner Password Grant**: Only use with trusted first-party applications
🔒 **Client Secret**: Keep secure, never expose in frontend code
🔒 **HTTPS Required**: Use HTTPS in production for password transmission
🔒 **Rate Limiting**: Auth0 automatically rate limits authentication attempts

## Testing the Setup

### 1. Test Google OAuth:
1. Go to `/login`
2. Click "Continue with Google"
3. Should redirect to Google → Auth0 → back to your app

### 2. Test Email/Password Sign-Up:
1. Go to `/login`
2. Click "Sign Up"
3. Fill email/password form
4. Should create account and auto-login (no redirects!)

### 3. Test Email/Password Sign-In:
1. Go to `/login`
2. Click "Sign in with email and password"
3. Fill email/password form
4. Should authenticate and login (no redirects!)

## Troubleshooting

### Error: "Grant type 'password' not allowed"
- **Solution**: Enable "Password" grant type in Application settings

### Error: "Access denied"
- **Check**: Database connection is enabled for your application
- **Check**: User exists and email is verified (if required)

### Error: "Invalid client"
- **Check**: Client ID and secret are correct
- **Check**: Application type is set correctly (SPA)

### Sign-up works but sign-in fails
- **Check**: Resource Owner Password Grant is enabled
- **Check**: Database connection allows password authentication
- **Check**: User's email is verified (if verification is required)

### Sessions not persisting
- **Check**: NEXTAUTH_SECRET is set
- **Check**: NEXTAUTH_URL matches your domain
- **Check**: Cookies are enabled in browser

## Production Considerations

1. **Use HTTPS**: Required for secure password transmission
2. **Rate Limiting**: Implement additional rate limiting if needed
3. **Password Policy**: Configure strong password requirements
4. **Email Verification**: Consider requiring email verification
5. **Monitoring**: Monitor Auth0 logs for failed attempts
6. **Backup Auth**: Keep Google OAuth as backup authentication method

## Alternative Approaches

If Resource Owner Password Grant is not suitable for your use case:

1. **Auth0 Universal Login**: Use Auth0's hosted pages with custom branding
2. **Embedded Login**: Use Auth0's Lock widget embedded in your page
3. **Passwordless**: Implement magic link or SMS-based authentication

The current implementation provides the best balance of security, UX, and customization.
