# WHOOP Integration Setup

This guide explains how to set up the WHOOP integration in the cannes-eth client.

## Prerequisites

1. A WHOOP Developer account
2. A registered WHOOP application with OAuth credentials

## Setup Steps

### 1. Get WHOOP Developer Credentials

1. Go to [WHOOP Developer Portal](https://developer.whoop.com/)
2. Create a developer account if you don't have one
3. Create a new application
4. Note down your:
   - Client ID
   - Client Secret

### 2. Configure Environment Variables

Create a `.env.local` file in the root of the client directory and add:

```env
# WHOOP Configuration
NEXT_PUBLIC_WHOOP_CLIENT_ID=your_whoop_client_id_here
WHOOP_CLIENT_SECRET=your_whoop_client_secret_here
```

### 3. Configure Redirect URI

In your WHOOP application settings, add the following redirect URI:

- For development: `http://localhost:3000/whoop`
- For production: `https://your-domain.com/whoop`

### 4. Update Redirect URI in Code

If you're deploying to production, update the `REDIRECT_URI` constant in `/app/whoop/page.tsx`:

```typescript
const REDIRECT_URI = process.env.NODE_ENV === 'production' 
  ? "https://your-actual-domain.com/whoop"  // Update this
  : "http://localhost:3000/whoop";
```

## Usage

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/whoop` in your browser

3. Click "Connect WHOOP (All Data)" to start the OAuth flow

4. After successful authentication, you can fetch your WHOOP data

## API Endpoints

The integration creates the following API endpoints:

- `POST /api/whoop/token` - Exchange OAuth code for access token
- `POST /api/whoop/profile` - Fetch all WHOOP data (profile, recovery, sleep, workouts, cycles, body measurements)

## Data Fetched

The integration fetches the following data from WHOOP:

- **Profile**: Basic user profile information
- **Recovery**: Recovery data and scores
- **Sleep**: Sleep tracking data
- **Workouts**: Workout sessions and metrics
- **Cycles**: Physiological cycles
- **Body Measurements**: Body composition data

## Scopes

The application requests the following WHOOP API scopes:

- `offline` - For refresh token capability
- `read:recovery` - Access to recovery data
- `read:cycles` - Access to cycle data
- `read:workout` - Access to workout data
- `read:sleep` - Access to sleep data
- `read:profile` - Access to profile data
- `read:body_measurement` - Access to body measurement data

## Troubleshooting

1. **Authentication Error**: Ensure your Client ID and Client Secret are correct
2. **Redirect URI Mismatch**: Verify the redirect URI matches exactly in your WHOOP app settings
3. **Missing Data**: Check that your WHOOP account has the required permissions and data
4. **Token Expiry**: Tokens expire after a certain time - the UI will show the expiry time

## Security Notes

- Never commit your `.env.local` file to version control
- Keep your Client Secret secure and only use it on the server side
- The Client ID is safe to expose in the frontend as it's public by design 