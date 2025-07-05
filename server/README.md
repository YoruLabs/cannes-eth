# Terra Sleep Data Server

A Fastify-based server for processing Terra sleep data webhooks and storing health metrics in Supabase for challenge-based competitions.

## Features

- **Real-time Health Data Processing**: Receive and process Terra webhooks for sleep, activity, and body data
- **Supabase Integration**: Store processed metrics in PostgreSQL database
- **Challenge System Support**: Calculate sleep quality, recovery, and efficiency scores
- **Webhook Subscription Management**: Subscribe/unsubscribe to real-time data streams
- **Multi-provider Support**: Oura, Whoop, Fitbit, and other Terra-supported providers
- **Data Validation**: Zod schemas for payload validation
- **Comprehensive Logging**: Winston-based logging with structured output

## Quick Start

### Prerequisites

- Node.js 18+
- Supabase project with PostgreSQL database
- Terra API credentials

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the server directory:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Terra API Configuration
TERRA_API_KEY=your_terra_api_key
TERRA_DEV_ID=your_terra_dev_id
TERRA_WEBHOOK_SECRET=your_webhook_secret

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Logging
LOG_LEVEL=info
```

### Database Setup

Run the migration to create the required tables:

```sql
-- Run this in your Supabase SQL editor
-- See: migrations/rename_users_to_connections.sql
```

### Start the Server

```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

## API Endpoints

### Webhook Endpoints

#### `POST /webhook/terra`

Receive Terra webhook data for processing.

**Supported webhook types:**

- `sleep`: Sleep data from health devices
- `healthcheck`: Terra service health checks

**Example response:**

```json
{
  "success": true,
  "message": "Sleep data processed successfully",
  "processed": 1,
  "results": [
    {
      "sessionId": "user_id_timestamp",
      "success": true,
      "storedId": "uuid",
      "metrics": {
        "sleepEfficiency": 85,
        "sleepQualityScore": 78.5,
        "recoveryScore": 92.3,
        "totalSleepDuration": 28800
      }
    }
  ]
}
```

### Webhook Subscription Management

#### `POST /webhook/subscribe`

Subscribe to real-time health data updates.

**Request body:**

```json
{
  "userId": "terra-user-id",
  "webhookUrl": "https://your-server.com/webhook/terra",
  "events": ["sleep", "activity", "body"]
}
```

#### `POST /webhook/unsubscribe`

Unsubscribe from webhook updates.

**Request body:**

```json
{
  "userId": "terra-user-id",
  "webhookId": "webhook-subscription-id"
}
```

#### `GET /webhook/subscriptions/:userId`

List all webhook subscriptions for a user.

#### `PUT /webhook/subscriptions/:userId`

Update webhook subscription settings.

**Request body:**

```json
{
  "webhookId": "webhook-subscription-id",
  "events": ["sleep", "activity"],
  "webhookUrl": "https://new-url.com/webhook/terra"
}
```

#### `POST /webhook/streaming/enable`

Enable real-time data streaming for all available data types.

**Request body:**

```json
{
  "userId": "terra-user-id",
  "webhookUrl": "https://your-server.com/webhook/terra"
}
```

#### `POST /webhook/streaming/disable`

Disable real-time data streaming for a user.

**Request body:**

```json
{
  "userId": "terra-user-id"
}
```

#### `GET /webhook/status/:userId`

Get webhook status for a user.

### Health Check

#### `GET /webhook/health`

Server health check endpoint.

## Testing

### Test Supabase Integration

```bash
npm run test:supabase
```

This test:

- Verifies Supabase connection
- Creates test connection and sleep metrics
- Validates data storage and retrieval
- Cleans up test data

### Test Webhook Subscriptions

```bash
npm run test:webhook
```

This test:

- Sets up webhook subscriptions
- Tests subscription management endpoints
- Validates real-time streaming setup
- Cleans up test data

## Real-time Health Data Setup

### 1. Enable Webhook Subscriptions

To receive real-time health data updates from Terra:

```javascript
// Subscribe to sleep data
const response = await fetch("http://localhost:3001/webhook/subscribe", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    userId: "terra-user-id",
    webhookUrl: "https://your-server.com/webhook/terra",
    events: ["sleep", "activity", "body"],
  }),
});
```

### 2. Enable Real-time Streaming

For automatic subscription to all available data types:

```javascript
// Enable real-time streaming
const response = await fetch("http://localhost:3001/webhook/streaming/enable", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    userId: "terra-user-id",
    webhookUrl: "https://your-server.com/webhook/terra",
  }),
});
```

### 3. Monitor Incoming Data

Once subscribed, Terra will send webhooks to your endpoint whenever new health data is available. Monitor your server logs to see incoming data:

```bash
# Watch server logs
tail -f logs/app.log
```

## Database Schema

### Connections Table

Stores Terra provider connections for World miniapp users.

```sql
CREATE TABLE connections (
  id UUID PRIMARY KEY,                    -- Terra user ID
  provider TEXT NOT NULL,                 -- Provider name (Oura, Whoop, etc.)
  reference_id TEXT NOT NULL,             -- World miniapp wallet address
  active BOOLEAN DEFAULT true,
  last_webhook_update TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Sleep Metrics Table

Stores processed sleep data with challenge-ready metrics.

```sql
CREATE TABLE sleep_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES connections(id),
  session_id TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  total_sleep_duration_seconds INTEGER,
  sleep_efficiency INTEGER,
  deep_sleep_duration_seconds INTEGER,
  light_sleep_duration_seconds INTEGER,
  rem_sleep_duration_seconds INTEGER,
  awake_duration_seconds INTEGER,
  sleep_latency_seconds INTEGER,
  wake_up_latency_seconds INTEGER,
  avg_heart_rate_bpm INTEGER,
  resting_heart_rate_bpm INTEGER,
  avg_hrv_rmssd INTEGER,
  avg_hrv_sdnn INTEGER,
  avg_oxygen_saturation INTEGER,
  avg_breathing_rate INTEGER,
  snoring_duration_seconds INTEGER,
  temperature_delta NUMERIC,
  readiness_score INTEGER,
  recovery_level INTEGER,
  sleep_score INTEGER,
  sleep_quality_score NUMERIC,
  recovery_score NUMERIC,
  efficiency_score NUMERIC,
  health_score NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Challenge System

The server calculates several challenge-ready metrics:

- **Sleep Quality Score**: Overall sleep quality (0-100)
- **Recovery Score**: Recovery readiness based on HRV and readiness data
- **Efficiency Score**: Sleep efficiency percentage
- **Health Score**: Overall health indicator

These metrics are automatically calculated and stored with each sleep session for challenge comparisons.

## Troubleshooting

### Common Issues

1. **"fetch failed" errors**: Check Supabase URL and service role key
2. **Foreign key constraint errors**: Ensure connection exists before inserting sleep metrics
3. **Webhook subscription failures**: Verify Terra API credentials and webhook URL accessibility

### Logs

Check the logs directory for detailed error information:

```bash
# View recent logs
tail -f logs/app.log

# Search for specific errors
grep "ERROR" logs/app.log
```

## Development

### Project Structure

```
server/
├── src/
│   ├── config/
│   │   └── logger.js
│   ├── handlers/
│   │   └── webhookHandler.js
│   ├── routes/
│   │   └── webhook.js
│   ├── schemas/
│   │   └── sleepData.js
│   ├── services/
│   │   ├── sleepDataProcessor.js
│   │   ├── supabaseService.js
│   │   └── terraService.js
│   └── index.js
├── migrations/
│   └── rename_users_to_connections.sql
├── tests/
├── logs/
└── package.json
```

### Adding New Data Types

1. Update Zod schemas in `src/schemas/sleepData.js`
2. Add processing logic in `src/services/sleepDataProcessor.js`
3. Update database schema if needed
4. Add webhook subscription for new data type

## License

MIT
