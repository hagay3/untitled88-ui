# Untitled88 - AI-Powered Email Designer

A modern Next.js application for designing and generating beautiful emails with AI-powered chat builder.

## 🚀 Features

- **AI-Powered Email Generation**: Chat with AI to create stunning email templates
- **Visual Email Builder**: Intuitive drag-and-drop interface for customization
- **Live Preview**: Real-time preview across different devices
- **Auth0 Google Login**: Secure authentication with Google OAuth
- **Payment Integration**: Subscription and payment management
- **Bookmark System**: Save and organize your favorite designs
- **Mobile Responsive**: Desktop-first design with mobile support
- **TypeScript**: Full type safety throughout the application

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (Pages Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + styled-components
- **UI Components**: shadcn/ui inspired components
- **State Management**: Zustand
- **Authentication**: NextAuth.js + Auth0
- **API Client**: Custom secure client with auto session refresh

## 📦 Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd untitled88-ui
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual values:
- Auth0 credentials (Domain, Client ID, Client Secret, Issuer, Audience)
- API URL for your backend
- NextAuth configuration

4. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run check-types` - Type check with TypeScript
- `npm run clean` - Clean build artifacts

## 📁 Project Structure

```
untitled88-ui/
├── src/
│   ├── components/
│   │   ├── ui/              # Reusable UI components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── badge.tsx
│   │   │   └── progress.tsx
│   │   └── LoadingSpinner.tsx
│   ├── pages/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth].ts  # Auth0 configuration
│   │   │   └── get-ip.ts
│   │   ├── _app.tsx
│   │   ├── _document.tsx
│   │   ├── index.tsx          # Home page
│   │   └── login.tsx          # Login page
│   ├── services/
│   │   └── bookmarkService.ts # Bookmark API service
│   ├── store/
│   │   ├── Payment.types.ts
│   │   └── paymentStore.ts    # Payment state management
│   ├── styles/
│   │   └── global.css
│   ├── utils/
│   │   ├── actions.ts         # API actions & utilities
│   │   ├── apiClient.ts       # Secure API client
│   │   ├── AppConfig.ts       # App configuration
│   │   └── mobileDetection.ts # Mobile detection utilities
│   └── next-auth.d.ts         # NextAuth type definitions
├── public/
├── .env.example
├── .env.local (create this)
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## 🔐 Authentication Setup

This app uses Auth0 for authentication via Google OAuth.

### Setting up Auth0:

1. Create an Auth0 account at [auth0.com](https://auth0.com)
2. Create a new Application (Regular Web Application)
3. Enable Google Social Connection
4. Configure Allowed Callback URLs: `http://localhost:3000/api/auth/callback/auth0`
5. Configure Allowed Logout URLs: `http://localhost:3000`
6. Copy your credentials to `.env.local`

## 🎨 UI Components

The application includes a comprehensive set of reusable UI components:

- **Button**: Multi-variant button with different sizes
- **Card**: Flexible card component with header, content, and footer
- **Input**: Styled input with focus states
- **Badge**: Status badges with different variants
- **Progress**: Progress bar component
- **LoadingSpinner**: Animated loading indicator

## 🔄 State Management

Uses Zustand for state management with:
- Payment details store
- Automatic persistence
- Type-safe actions

## 🌐 API Integration

The app includes a secure API client with:
- Automatic session refresh on 401 errors
- Retry logic with exponential backoff
- HttpOnly cookie support
- Graceful error handling

## 📱 Mobile Detection

Comprehensive mobile detection using multiple methods:
- User agent detection
- Screen size detection
- Touch capability detection
- Device orientation support
- Mobile-specific APIs detection

## 🔖 Bookmark Service

Full CRUD operations for bookmarks:
- Create bookmarks
- Get all bookmarks
- Delete bookmarks
- Toggle bookmark status
- Convert bookmarks to Set for efficient lookups

## 💳 Payment System

Payment store with:
- Fetch payment details
- Plan management (free, one_time, advanced, professional, gold)
- Device tracking
- Records limit tracking

## 🚀 Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

### Environment Variables for Production

Make sure to set all environment variables in your deployment platform:
- All Auth0 credentials
- API URL
- NextAuth URL and Secret

## 📝 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_AUTH0_DOMAIN` | Auth0 domain | `your-domain.auth0.com` |
| `NEXT_PUBLIC_AUTH0_CLIENT_ID` | Auth0 Client ID | `abc123...` |
| `AUTH0_CLIENT_SECRET` | Auth0 Client Secret | `secret...` |
| `AUTH0_ISSUER` | Auth0 Issuer URL | `https://your-domain.auth0.com` |
| `AUTH0_AUDIENCE` | Auth0 API Audience | `your-api-audience` |
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8000` |
| `NEXT_PUBLIC_USER_SESSION_TTL_MINUTES` | Session TTL in minutes | `1440` (24 hours) |
| `NEXTAUTH_URL` | Application URL | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | NextAuth secret key | Generate with `openssl rand -base64 32` |

## 🤝 Contributing

This is a private project. Contact the repository owner for contribution guidelines.

## 📄 License

ISC License

## 🆘 Support

For support or questions, please contact the development team.

---

**Built with ❤️ using Next.js, TypeScript, and Tailwind CSS**


