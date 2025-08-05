# DIMO Account Manager

A Next.js web application for managing device subscriptions and connected vehicles through the DIMO ecosystem. This application enables users to view their connected vehicles, manage payment methods, and handle activate/update/cancel subscription flows including grandfathered devices and Tesla connections.

## 🚗 Features

### Current Features
- **DIMO Authentication**: Integrated with [Login With DIMO](https://docs.dimo.org/developer-platform/developer-guide/dimo-developer-sdks/login-with-dimo-sdk/react-component) for seamless user auth using JWT tokens
- **BackendSubscriptions Management**: Subscription management with three distinct flows:
  - **Active Subscriptions**: Existing subscriptions managed via backend proxy
  - **Grandfathered Devices**: Special handling for devices that pre-date the current subscription model
  - **Tesla Connections**: Dedicated flow for Tesla vehicle connections
- **Vehicle Dashboard**: Display connected vehicles from user's DIMO account with subscription status
- **Subscription Management**:
  - Activate subscriptions for R1, AutoPi, and Macaron devices; as well as, Tesla connections
  - Cancel active subscriptions with feedback collection
  - Real-time subscription status checking via backend proxy
  - Plan updates and subscription modifications
- **Payment Method Management**:
  - View saved payment methods
  - Set default payment methods
  - Remove payment methods
  - Stripe integration for secure payment processing
- **Multi-language Support**: (WIP) Internationalization with English and Spanish
- **Responsive Design**: Mobile-friendly interface built with Tailwind CSS

### Future Roadmap (DINC Account Manager Evolution)
- **Wallet Management**: Manage cryptocurrency wallets
- **Token Operations**: Send and receive tokens
- **Passkey Management**: Secure authentication with passkeys
- **Vehicle Minting**: Mint vehicles as NFTs
- **Extended Device Support**: Support for additional DIMO-compatible devices

### Authentication Flows
- **Primary**: DIMO Login SDK with JWT token authentication
- **Session Management**: Secure cookie-based session with `dimo_jwt` token
- **Authorization**: Subscription access control via DIMO tokens and JWT validation
- **API Access**: JWT tokens used for backend API authentication

### Subscription Flows

#### 1. Active Subscriptions
- Backend proxy integration for existing subscriptions
- Real-time subscription status and management
- Plan updates with scheduled changes
- Cancellation with feedback collection

#### 2. Grandfathered Devices
- Special handling for devices without existing payment methods
- Payment method validation before activation
- Checkout link generation for new subscriptions
- Extended trial period support

#### 3. Tesla Connections
- Dedicated flow for Tesla vehicle connections
- Backend proxy integration for subscription management
- Vehicle-specific subscription activation

## 🛠️ Tech Stack

- **Framework**: Next.js 15.3 with App Router
- **Frontend**: React 19, Tailwind CSS 4, TypeScript
- **Authentication**: DIMO Login SDK + JWT token authentication
- **Payments**: Stripe with subscription management
- **Backend Integration**: Backend proxy for subscription management
- **Database**: PostgreSQL with DrizzleORM
- **Internationalization**: next-intl
- **Development**: ESLint, TypeScript

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ and npm
- Backend API service for subscription management
- Stripe account for payment processing
- DIMO developer account and API credentials
- Backend API service for subscription management

### 1. Clone and Install

```bash
git clone https://github.com/DIMO-Network/account-manager.git
cd account-manager
npm install
```

### 2. Environment Setup
Create a `.env.local` file in the root directory with the following variables:

```bash
# DIMO Configuration
NEXT_PUBLIC_DIMO_CLIENT_ID=your_dimo_client_id
NEXT_PUBLIC_DIMO_REDIRECT_URI=http://localhost:3000/auth/dimo/callback
NEXT_PUBLIC_DIMO_API_KEY=your_dimo_api_key
NEXT_PUBLIC_DIMO_ENV=development

# Backend API Configuration
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:3001

# JWT Configuration
JWKS_URI=https://your-jwks-endpoint/keys
DIMO_JWT_COOKIE_MAX_AGE=7200

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Next.js
NEXT_TELEMETRY_DISABLED=1
```

## 🔧 API Structure

The application uses a hybrid approach with both direct Stripe API calls and backend proxy integration:

### Direct Stripe Operations
- `/api/stripe/customer` - Customer management
- `/api/subscriptions/[subscriptionId]/product-name` - Product information (read-only)
- `/api/subscriptions/[subscriptionId]` - Subscription retrieval (read-only)

### Backend Proxy Operations
- `/api/subscriptions/cancel-subscription` - Subscription cancellation
- `/api/subscriptions/update-plan` - Plan updates
- `/api/subscriptions/check-user-payment-method` - Payment method validation
- `/api/subscriptions/vehicle/[vehicleTokenId]/new-subscription-link` - Vehicle subscription links
- `/api/subscriptions/vehicle/[vehicleTokenId]/new-subscription` - Vehicle subscription creation

### Authentication Routes
- `/api/auth/dimo/callback` - DIMO authentication callback
- `/api/dimo-auth` - DIMO authentication endpoint
- `/api/auth/logout` - Logout endpoint
- `/api/auth/me` - User session information

## 🔐 Authentication Flow

1. **User initiates login** via DIMO Login SDK
2. **DIMO authentication** validates user credentials and generates JWT token
3. **JWT token validation** using DIMO's JWKS endpoint
4. **Session creation** with DIMO user data and JWT token
5. **Secure cookie storage** of JWT token for API authentication
6. **API authorization** using JWT token for backend service access

## 📝 Commit Message Format

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
Update `.env.production` with your production values:

```bash
NEXT_PUBLIC_APP_URL=https://your-domain.com

NEXT_PUBLIC_BACKEND_API_URL=https://your-backend-api.com
# ... other production environment variables
```

#### Build and Deploy
```bash
npm run build
npm start
```

The application is configured to work with various hosting platforms including Railway, Sevalla, Vercel, and traditional hosting providers.

### 🤝 Contributing
1. Create a feature branch from `development` (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request merging to `development`

### 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

### 🙏 Acknowledgments
- Built on [Next.js Boilerplate](https://github.com/ixartz/Next-js-Boilerplate) by [@ixartz](https://github.com/ixartz)
- Powered by [DIMO](https://dimo.org/) for connected vehicle data
- Payment processing by [Stripe](https://stripe.com/)

---

**Note**: This application is in active development. The roadmap includes evolution into a comprehensive DINC Account Manager with expanded wallet and token management capabilities.
