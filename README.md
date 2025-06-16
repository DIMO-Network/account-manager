# [WIP] DIMO Subscription Manager

A Next.js web application for managing device subscriptions and connected vehicles through the DIMO ecosystem. At this time, this application enables users to view their connected vehicles, activate/cancel device subscriptions, and manage payment methods.

## 🚗 Features

### Current Features
- **DIMO Authentication**: Integrated with [Login With DIMO](https://docs.dimo.org/developer-platform/developer-guide/dimo-developer-sdks/login-with-dimo-sdk/react-component) for seamless user authentication
- **Vehicle Dashboard**: Display connected vehicles from user's DIMO account
- **Device Subscription Management**:
  - Activate subscriptions for R1 devices
  - Cancel active subscriptions
  - Real-time subscription status checking
- **Payment Method Management**:
  - View saved payment methods
  - Set default payment methods
  - Remove payment methods
- **Stripe Integration**: Secure payment processing with subscription management
- **Multi-language Support**: Internationalization with English and French (uses Crowdin)
- **Responsive Design**: Mobile-friendly interface built with Tailwind CSS

### Future Roadmap (DINC Account Manager Evolution)
- **Wallet Management**: Manage cryptocurrency wallets
- **Token Operations**: Send and receive tokens
- **Passkey Management**: Secure authentication with passkeys
- **Vehicle Minting**: Mint vehicles as NFTs
- **Extended Device Support**: Support for additional DIMO-compatible devices

## 🛠️ Tech Stack

- **Framework**: Next.js 15.3 with App Router
- **Frontend**: React 19, Tailwind CSS 4, TypeScript
- **Authentication**: DIMO Login SDK + Clerk (fallback)
- **Payments**: Stripe with subscription management
- **Database**: PostgreSQL with DrizzleORM
- **Internationalization**: next-intl
- **Development**: ESLint, TypeScript, Vitest

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ and npm
- PostgreSQL database (or use local SQLite for development)
- Stripe account for payment processing
- DIMO developer account and API credentials

### 1. Clone and Install

```bash
git clone https://github.com/jaggedbytes/by-road.git
cd by-road
npm install
```

### 2. Environment Setup
Create a .env.local file in the root directory with the following variables:
```bash
# DIMO Configuration
NEXT_PUBLIC_DIMO_CLIENT_ID=your_dimo_client_id
NEXT_PUBLIC_DIMO_REDIRECT_URI=http://localhost:3000/auth/dimo/callback
NEXT_PUBLIC_DIMO_API_KEY=your_dimo_api_key
NEXT_PUBLIC_DIMO_ENV=development

# Clerk Authentication (Fallback)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/byroad

# Next.js
NEXT_TELEMETRY_DISABLED=1
```

### 3. Database Setup
```bash
# Generate database migrations
npm run db:generate
```

This will create a migration file that reflects your schema changes. The migration is automatically applied during the next database interaction, so there is no need to run it manually or restart the Next.js server.

### Commit Message Format

The project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification, meaning all commit messages must be formatted accordingly. To help you write commit messages, the project uses [Commitizen](https://github.com/commitizen/cz-cli), an interactive CLI that guides you through the commit process. To use it, run the following command:

```shell
npm run commit
```

One of the benefits of using Conventional Commits is the ability to automatically generate a `CHANGELOG` file. It also allows us to automatically determine the next version number based on the types of commits that are included in a release.

### CodeRabbit AI Code Reviews

The project uses [CodeRabbit](https://www.coderabbit.ai?utm_source=next_js_starter&utm_medium=github&utm_campaign=next_js_starter_oss_2025), an AI-powered code reviewer. CodeRabbit monitors your repository and automatically provides intelligent code reviews on all new pull requests using its powerful AI engine.

Setting up CodeRabbit is simple, visit [coderabbit.ai](https://www.coderabbit.ai?utm_source=next_js_starter&utm_medium=github&utm_campaign=next_js_starter_oss_2025), sign in with your GitHub account, and add your repository from the dashboard. That's it!

### Testing

All unit tests are located alongside the source code in the same directory, making them easier to find. The project uses Vitest and React Testing Library for unit testing. You can run the tests with the following command:

```shell
npm run test

# Run tests with coverage
npm run test -- --coverage

# Type checking
npm run check-types

# Linting
npm run lint
```

### 📚 Additional Features (Available but not actively used)
The following features are configured but not currently active. They can be enabled by uncommenting relevant code and adding appropriate environment variables:

#### Error Monitoring (Sentry)
```bash
# Add to .env.local to enable
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
SENTRY_AUTH_TOKEN=your_sentry_token
```

#### Security (Arcjet)
```bash
# Add to .env.local to enable
ARCJET_KEY=your_arcjet_key
```

#### Logging (Better Stack)
```bash
# Add to .env.local to enable
LOGTAIL_SOURCE_TOKEN=your_logtail_token
```

#### Analytics (PostHog)
```bash
# Add to .env.local to enable
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

### 🚢 Deployment
#### Environment Variables for Production
Update `.env.production  with your production values:

```bash
NEXT_PUBLIC_APP_URL=https://your-domain.com
DATABASE_URL=your_production_database_url
# ... other production environment variables
```

#### Build and Deploy
```bash
npm run build
npm start
```

The application is configured to work with various hosting platforms including Vercel, Netlify, and traditional hosting providers.

### 🤝 Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

### 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

### 🙏 Acknowledgments
- Built on [Next.js Boilerplate](https://github.com/ixartz/Next-js-Boilerplate) by [@ixartz](https://github.com/ixartz)
- Powered by [DIMO](https://dimo.org/) for connected vehicle data
- Payment processing by [Stripe](https://stripe.com/)

---

**Note**: This application is in active development. The roadmap includes evolution into a comprehensive DINC Account Manager with expanded wallet and token management capabilities.
