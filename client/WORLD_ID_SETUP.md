# World ID Setup Guide

## Required Environment Variables

Create a `.env.local` file in your `client` directory with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# World ID Configuration
APP_ID=app_staging_your_app_id_here
NEXT_PUBLIC_WLD_ACTION_NAME=verify-human
```

## Setup Steps

### 1. World Developer Portal Setup

1. Go to [World Developer Portal](https://developer.worldcoin.org/)
2. Create a new application or use existing one
3. Note down your **App ID** (starts with `app_staging_` for staging or `app_` for production)

### 2. Create an Action

1. In your app dashboard, go to "Actions" section
2. Create a new action with:
   - **Action ID**: `verify-human` (or your preferred name)
   - **Name**: Human Verification
   - **Description**: Verify that user is a unique human
   - **Max verifications**: Set based on your needs (e.g., 1 for one-time verification)

### 3. Environment Configuration

Replace the values in your `.env.local`:

```bash
# Replace with your actual values
APP_ID=app_staging_abc123def456
NEXT_PUBLIC_WLD_ACTION_NAME=verify-human
```

## Common Issues & Solutions

### 1. "malformed_request" Error
- **Cause**: Invalid APP_ID or action name
- **Solution**: Double-check your APP_ID matches exactly from Developer Portal

### 2. "invalid_network" Error
- **Cause**: Environment mismatch (staging vs production)
- **Solution**: 
  - For testing: Use `app_staging_` prefix and test in Worldcoin Simulator
  - For production: Use `app_` prefix and test in World App

### 3. "action_inactive" Error
- **Cause**: Action is disabled in Developer Portal
- **Solution**: Enable the action in your Developer Portal dashboard

### 4. "credential_unavailable" Error
- **Cause**: User hasn't verified with Orb or device
- **Solution**: User needs to verify at an Orb or verify their device in World App

### 5. "max_verifications_reached" Error
- **Cause**: User already verified maximum allowed times
- **Solution**: This is expected behavior - user cannot verify again

## Testing Environment

- **Staging**: Use [Worldcoin Simulator](https://simulator.worldcoin.org) with `app_staging_` prefix
- **Production**: Use World App with `app_` prefix

## Debug Mode

The app now includes detailed console logging. Check browser console for:
- Environment variable validation
- World ID verification responses
- Backend verification results
- Specific error codes and messages

## Next Steps

1. Create your `.env.local` file with correct values
2. Restart your development server: `npm run dev`
3. Test World ID verification
4. Check console logs for specific error details 