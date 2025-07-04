# World Template Starter

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3-06B6D4?style=flat-square&logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat-square&logo=supabase)
![World ID](https://img.shields.io/badge/World%20ID-000000?style=flat-square&logo=worldcoin)

A complete Next.js starter application with World ID authentication and Supabase integration. This template provides everything you need to build a secure World Mini App with user verification and database management.

**Why this template?** While World provides official templates, they don't currently offer a Next.js 15 template using the modern App Router format. This template fills that gap by providing a production-ready starter with Next.js 15, React 19, and Supabase integration instead of NextAuth, giving you a more streamlined and modern development experience.

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Step 1: World ID Developer Portal Setup](#step-1-world-id-developer-portal-setup)
- [Step 2: Supabase Database Configuration](#step-2-supabase-database-configuration)
- [Step 3: Project Setup and Installation](#step-3-project-setup-and-installation)
- [Step 4: Environment Configuration](#step-4-environment-configuration)
- [Step 5: Database Migration](#step-5-database-migration)
- [Step 6: Running the Application](#step-6-running-the-application)
- [Step 7: Testing with World App (Mobile)](#step-7-testing-with-world-app-mobile)
- [Authentication Flow](#authentication-flow)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)
- [Development Notes](#development-notes)

## Project Overview

This starter template demonstrates how to integrate World ID verification with a full-stack web application. Users can authenticate using either:

1. **World ID Verification**: Complete human verification + wallet connection (recommended)
2. **Wallet Only**: Basic wallet authentication without human verification

The application stores user data in Supabase and provides a complete authentication flow suitable for production use.

## Features

- World ID Integration with human verification
- Wallet-based authentication fallback
- Supabase database integration with RLS (Row Level Security)
- TypeScript support throughout
- Modern UI with Tailwind CSS and Radix components
- Production-ready authentication flow
- Comprehensive error handling

## Prerequisites

Before starting, ensure you have:

- **Node.js** (version 18 or higher)
- **npm** or **pnpm** package manager
- **Git** for version control
- **ngrok** account and CLI tool (for mobile testing)
- **World App** installed on your mobile device
- Basic knowledge of React/Next.js and databases

## Step 1: World ID Developer Portal Setup

### 1.1 Create Your World ID Developer Account

1. Visit [developer.worldcoin.org](https://developer.worldcoin.org)
2. Click **"Sign Up"** and create your account
3. Verify your email address

### 1.2 Create a Team and App

1. After logging in, click **"Create Team"**
2. Enter your team name and create the team
3. Inside your team, click **"Create App"**
4. Fill in your app details:
   - **App Name**: Your application name
   - **App Description**: Brief description of your app
   - **App URL**: Leave blank for now (you'll update this later)

### 1.3 Configure World ID Settings

1. Navigate to the **"Sign in with World ID"** tab in your app settings
2. Copy and save the following values (you'll need these later):
   - **App ID**: Starts with `app_` (e.g., `app_1234567890abcdef`)
   - **Client ID**: Your application's client identifier
   - **Client Secret**: Keep this secure and never expose it publicly

### 1.4 Get Your API Key

1. Go to your **Team Settings** (not app settings)
2. Find the **"API Keys"** section
3. Copy your **API Key** - this will be used for server-side operations

### 1.5 Create an Incognito Action

Incognito actions allow you to verify users without revealing their identity:

1. In your app settings, go to the **"Incognito Actions"** tab
2. Click **"New Action"**
3. Configure your action:
   - **Action Name**: `verify-human` (or your preferred name)
   - **Description**: "Verify that the user is a unique human"
   - **Max Verifications per User**: Set to `1` (users can only verify once)
4. Click **"Create Action"**
5. Save the **Action Name** - you'll need it in your environment variables

## Step 2: Supabase Database Configuration

### 2.1 Create a Supabase Project

1. Visit [supabase.com](https://supabase.com) and sign up
2. Click **"New Project"**
3. Choose your organization and fill in:
   - **Project Name**: Your project name
   - **Database Password**: Create a strong password and **save it securely**
   - **Region**: Choose the region closest to your users
4. Click **"Create New Project"** and wait for setup to complete

### 2.2 Get Your Supabase Configuration

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy and save these values:
   - **Project URL**: Your Supabase project URL
   - **anon/public key**: Used for client-side operations
   - **service_role key**: Used for server-side operations (keep secure)

### 2.3 Configure Authentication Settings

1. Go to **Authentication** → **URL Configuration**
2. Set your Site URL and Redirect URLs:
   - **Site URL**: `http://localhost:3000` (for development)
   - **Redirect URLs**: Add `http://localhost:3000/auth/callback`

Note: You'll update these URLs with your production domain when deploying.

## Step 3: Project Setup and Installation

### 3.1 Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd miniapp-template

# Navigate to the client directory
cd client

# Install dependencies
npm install
# or if you prefer pnpm
pnpm install
```

### 3.2 Install Required Development Tools

Install ngrok for mobile testing:

```bash
# Install ngrok globally
npm install -g ngrok

# Or using Homebrew on macOS
brew install ngrok

# Or download from https://ngrok.com/download
```

## Step 4: Environment Configuration

### 4.1 Create Environment Files

In the `client` directory, create a `.env.local` file:

```bash
# Navigate to client directory if not already there
cd client

# Copy the example environment file
cp .env.example .env.local
```

### 4.2 Configure Environment Variables

Edit your `.env.local` file with the values you collected:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# World ID Configuration
APP_ID=your-world-app-id
DEV_PORTAL_API_KEY=your-developer-portal-api-key
NEXT_PUBLIC_WLD_ACTION_NAME=verify-human

# Application Environment
NODE_APP_ENV=development
NEXT_PUBLIC_APP_ENV=development
```

**Important**: Replace all placeholder values with your actual credentials from Steps 1 and 2.

## Step 5: Database Migration

### 5.1 Set Up Database Schema

The project includes a database migration file that creates the necessary tables. You need to run this in your Supabase project:

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Open the file `client/supabase/migrations/20241218000000_initial_setup.sql`
4. Copy the entire SQL content
5. Paste it into the Supabase SQL Editor
6. Click **"Run"** to execute the migration

The migration creates a `profiles` table with the following structure:

```sql
CREATE TABLE profiles (
  wallet_address TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  world_id TEXT,
  nullifier_hash TEXT,
  verification_level TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5.2 Verify Database Setup

1. In Supabase, go to **Table Editor**
2. Confirm you see the `profiles` table
3. Check that all columns are present and configured correctly

## Step 6: Running the Application

### 6.1 Start the Development Server

In the `client` directory:

```bash
# Start the development server
npm run dev
# or
pnpm dev
```

The application will start at `http://localhost:3000`.

### 6.2 Verify Local Setup

1. Open your browser to `http://localhost:3000`
2. You should see the application home page
3. Try navigating to the login page (`/login`)
4. Verify that the page loads without errors

## Step 7: Testing with World App (Mobile)

Since World Mini Apps can only be tested within the World App mobile application, you'll need to expose your local development server to the internet.

### 7.1 Why You Need ngrok

- **MiniKit SDK** only works within the World App mobile environment
- **Desktop browsers** cannot access World App features like verification
- **Eruda** is included for mobile debugging and logging

### 7.2 Set Up ngrok

1. **Authenticate ngrok** (if you haven't already):

   ```bash
   ngrok config add-authtoken YOUR_NGROK_AUTH_TOKEN
   ```

   Get your auth token from [ngrok.com/dashboard](https://dashboard.ngrok.com/get-started/your-authtoken)

2. **Start ngrok tunnel**:

   ```bash
   # In a new terminal window, run:
   ngrok http 3000
   ```

3. **Copy the public URL**:
   ```
   Session Status                online
   Account                       Your Account
   Version                       3.x.x
   Region                        United States (us)
   Forwarding                    https://abc123.ngrok.io -> http://localhost:3000
   ```
   Copy the `https://abc123.ngrok.io` URL.

### 7.3 Update World ID App Configuration

1. Return to [developer.worldcoin.org](https://developer.worldcoin.org)
2. Go to your app settings
3. Update the **App URL** with your ngrok URL: `https://abc123.ngrok.io`
4. Save the changes

### 7.4 Test in World App

1. **Open World App** on your mobile device
2. Go to the **Developer Portal** in the World App
3. **Enter your App ID** in the testing interface
4. **Scan the QR code** that appears
5. Your mini app should open within World App

### 7.5 Mobile Debugging

The app includes **Eruda** for mobile debugging:

- **Eruda** provides a console interface on mobile devices
- You can view logs, network requests, and errors directly on your phone
- Access it by tapping the green console icon that appears in development mode

## Authentication Flow

### World ID Verification Process

1. **User clicks "Sign in with World ID"**
2. **World ID verification modal appears**
3. **User completes human verification** (if not already verified)
4. **Verification proof is generated**
5. **Server validates the proof** with World ID API
6. **User profile is created/updated** in Supabase
7. **User is authenticated** and redirected to dashboard

### Wallet-Only Authentication

1. **User clicks "Connect Wallet"**
2. **Wallet connection prompt appears**
3. **User signs authentication message**
4. **SIWE (Sign-In with Ethereum) verification**
5. **User profile is created** in Supabase
6. **User is authenticated** without human verification

## Project Structure

```
client/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── complete-siwe/ # SIWE verification endpoint
│   │   ├── nonce/         # Nonce generation for SIWE
│   │   └── verify/        # World ID verification endpoint
│   ├── login/             # Login page
│   └── page.tsx           # Main dashboard page
├── lib/                   # Utility libraries
│   ├── services/
│   │   └── auth.ts        # Authentication service
│   ├── supabase/          # Supabase configuration
│   ├── types/
│   │   └── database.ts    # TypeScript database types
│   └── utils.ts           # General utilities
├── providers/             # React context providers
│   └── user-provider.tsx  # User authentication context
├── supabase/              # Supabase configuration
│   ├── migrations/        # Database migration files
│   └── config.js          # Supabase project configuration
└── components/            # React UI components
```

## Troubleshooting

### Common Issues

**1. "Invalid API key" error**

- Verify your World ID App ID is correct in `.env.local`
- Check that you're using the correct API key from your team settings
- Ensure the App URL in World Developer Portal matches your ngrok URL

**2. "Supabase connection failed"**

- Verify your Supabase URL and anon key are correct
- Check that your Supabase project is active
- Ensure the database migration has been run successfully

**3. "World ID verification failed"**

- Confirm your Incognito Action is properly configured
- Check that the action name in `.env.local` matches the one in Developer Portal
- Verify your World App is updated to the latest version

**4. "Cannot access app in World App"**

- Ensure ngrok is running and the URL is accessible
- Check that your App URL in Developer Portal is updated
- Verify your App ID is entered correctly in the World App testing interface

**5. "Database error: relation does not exist"**

- Run the database migration in Supabase SQL Editor
- Check that all tables were created successfully
- Verify you're connecting to the correct Supabase project

### Getting Help

If you encounter issues:

1. Check the browser console for detailed error messages
2. Use Eruda on mobile to debug World App specific issues
3. Verify all environment variables are set correctly
4. Ensure all external services (Supabase, World ID) are properly configured

## Development Notes

### Important Security Considerations

- **Never expose your Supabase service role key** in client-side code
- **Keep your World ID Client Secret secure** and server-side only
- **Use environment variables** for all sensitive configuration
- **Enable RLS (Row Level Security)** on your Supabase tables in production

### Performance Tips

- The app includes optimizations for mobile World App environment
- Database queries are optimized for the authentication flow
- Consider implementing caching for production deployments

### Production Deployment

When ready to deploy:

1. **Update World ID App URL** with your production domain
2. **Configure production Supabase instance** if using separate environments
3. **Set up proper environment variables** on your hosting platform
4. **Enable additional security measures** like CORS configuration
5. **Test thoroughly** in World App before going live

This template provides a solid foundation for building World ID authenticated applications. The modular structure allows for easy customization and extension based on your specific requirements.
