# Terralink Frontend

A modern web interface for the Terralink Platform, built with Next.js 14, React 18, and TypeScript.

## Features

- 🔐 OAuth authentication (GitHub, Google)
- 🛠️ Toolkit management and execution
- 🔑 API key management
- 📊 Execution history tracking
- 🎨 Modern UI with Tailwind CSS
- 🔒 Secure JWT-based authentication

## Prerequisites

- Node.js 18+ 
- npm or yarn package manager
- Terralink Platform backend running (default: http://localhost:8000)

## Installation

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd earthflow/terralink
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Copy the example environment file and customize it:
   ```bash
   cp .env.example .env.local
   ```
   
   Then edit `.env.local` to match your setup:
   ```bash
   # Terralink Platform API Base URL
   NEXT_PUBLIC_TERRALINK_BASE_URL=http://localhost:8000
   
   # JWT Cookie Name (optional, defaults to "ef_session")
   JWT_COOKIE_NAME=ef_session
   ```
   ```

## Development

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Open your browser** and navigate to:
   ```
   http://localhost:3000
   ```

The application will automatically reload when you make changes to the source code.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality

## Project Structure

```
terralink/
├── app/                    # Next.js App Router pages
│   ├── (console)/         # Console layout pages
│   ├── (marketing)/       # Marketing pages
│   ├── api/               # API routes (proxy to backend)
│   └── auth/              # Authentication pages
├── components/            # Reusable React components
├── lib/                   # Utility libraries
│   ├── auth.ts           # Authentication utilities
│   ├── terralink.ts      # API client
│   └── types.ts          # TypeScript type definitions
├── .env.local            # Environment variables (create this)
└── package.json          # Project dependencies
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_TERRALINK_BASE_URL` | Backend API base URL | Required |
| `JWT_COOKIE_NAME` | JWT cookie name | `ef_session` |

### Backend Requirements

Ensure the Terralink Platform backend is running and accessible. The frontend expects:

- OAuth providers endpoint: `GET /v1/oauth/providers`
- Authentication endpoints: `/v1/login`, `/v1/register`
- API proxy endpoints under `/v1/`

## Authentication

The application supports multiple authentication methods:

1. **Email/Password** - Traditional login
2. **OAuth** - GitHub and Google integration
3. **API Keys** - For programmatic access

## Building for Production

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Start the production server**:
   ```bash
   npm run start
   ```

## Troubleshooting

### Common Issues

1. **"undefined/v1/oauth/providers" error**:
   - Ensure `NEXT_PUBLIC_TERRALINK_BASE_URL` is set in `.env.local`
   - Verify the backend is running on the specified URL

2. **Authentication not working**:
   - Check that the backend OAuth providers are configured
   - Verify JWT cookie settings match between frontend and backend

3. **API requests failing**:
   - Confirm the backend is accessible from the frontend
   - Check CORS settings on the backend

### Development Tips

- Use browser developer tools to inspect network requests
- Check the console for JavaScript errors
- Verify environment variables are loaded correctly

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is part of the Terralink Platform ecosystem.
