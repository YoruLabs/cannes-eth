# Terra Sleep Data Server

A Fastify-based server for handling Terra sleep data webhooks and processing health metrics for challenge systems.

## Features

- **Terra Webhook Integration**: Receives and validates sleep data from Terra API
- **Data Processing**: Consolidates relevant sleep metrics (heart rate, respiration, sleep stages, etc.)
- **Challenge System Ready**: Calculates competition-ready metrics and scores
- **Supabase Integration**: Stores processed data for challenge comparisons
- **Comprehensive Logging**: Winston-based structured logging
- **Data Validation**: Zod schemas for payload validation
- **Auto-restart**: Nodemon for development

## Prerequisites

- Node.js 18+
- Terra API account and credentials
- Supabase project with database

## Installation

1. **Clone and navigate to server directory:**

   ```bash
   cd server
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**

   ```bash
   cp env.example .env
   ```

   Fill in your environment variables:

   ```env
   # Terra API Configuration
   TERRA_API_KEY=your_terra_api_key_here
   TERRA_WEBHOOK_SECRET=your_terra_webhook_secret_here
   TERRA_DEV_ID=your_terra_dev_id_here

   # Supabase Configuration
   SUPABASE_URL=your_supabase_url_here
   SUPABASE_ANON_KEY=your_supabase_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

   # Server Configuration
   PORT=3001
   NODE_ENV=development

   # Logging
   LOG_LEVEL=info
   ```

4. **Create logs directory:**
   ```bash
   mkdir logs
   ```

## Database Setup

Create the following tables in your Supabase database:

### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  provider TEXT NOT NULL,
  reference_id TEXT,
  active BOOLEAN DEFAULT true,
  last_webhook_update TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Sleep Metrics Table

```sql
CREATE TABLE sleep_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  session_id TEXT UNIQUE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  total_sleep_duration_seconds INTEGER NOT NULL,
  sleep_efficiency DECIMAL(5,2) NOT NULL,
  deep_sleep_duration_seconds INTEGER NOT NULL,
  light_sleep_duration_seconds INTEGER NOT NULL,
  rem_sleep_duration_seconds INTEGER NOT NULL,
  awake_duration_seconds INTEGER NOT NULL,
  sleep_latency_seconds INTEGER NOT NULL,
  wake_up_latency_seconds INTEGER NOT NULL,
  avg_heart_rate_bpm INTEGER NOT NULL,
  resting_heart_rate_bpm INTEGER NOT NULL,
  avg_hrv_rmssd INTEGER NOT NULL,
  avg_hrv_sdnn INTEGER NOT NULL,
  avg_oxygen_saturation INTEGER NOT NULL,
  avg_breathing_rate INTEGER NOT NULL,
  snoring_duration_seconds INTEGER NOT NULL,
  temperature_delta DECIMAL(10,6) NOT NULL,
  readiness_score INTEGER NOT NULL,
  recovery_level INTEGER NOT NULL,
  sleep_score INTEGER,
  sleep_quality_score DECIMAL(5,2),
  recovery_score DECIMAL(5,2),
  efficiency_score DECIMAL(5,2),
  health_score DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_sleep_metrics_user_id ON sleep_metrics(user_id);
CREATE INDEX idx_sleep_metrics_created_at ON sleep_metrics(created_at);
CREATE INDEX idx_sleep_metrics_session_id ON sleep_metrics(session_id);
```

## Running the Server

### Development Mode (with auto-restart)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

The server will start on port 3001 (or the port specified in your .env file).

## API Endpoints

### 1. Terra Webhook

**POST** `/webhook/terra`

Receives sleep data from Terra webhooks.

**Request Body:** Terra sleep data payload
**Response:**

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
        "sleepEfficiency": 85.5,
        "sleepQualityScore": 78.2,
        "recoveryScore": 82.1,
        "totalSleepDuration": 28800
      }
    }
  ]
}
```

### 2. Health Check

**GET** `/health`

Returns server health status.

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "service": "terra-sleep-server"
}
```

### 3. User Metrics

**GET** `/users/:userId/metrics?limit=10`

Get sleep metrics for a specific user.

**Parameters:**

- `userId` (path): User UUID
- `limit` (query): Number of records to return (default: 10)

**Response:**

```json
{
  "success": true,
  "data": [...],
  "count": 5
}
```

### 4. Leaderboard

**GET** `/leaderboard?metric=sleep_efficiency&limit=10`

Get sleep leaderboard data.

**Parameters:**

- `metric` (query): Metric to rank by (default: sleep_efficiency)
- `limit` (query): Number of top performers (default: 10)

**Response:**

```json
{
  "success": true,
  "data": [...],
  "metric": "sleep_efficiency",
  "count": 10
}
```

## Processed Sleep Metrics

The server processes and stores the following consolidated metrics:

### Core Sleep Metrics

- **Total Sleep Duration**: Total time spent sleeping
- **Sleep Efficiency**: Percentage of time in bed actually spent sleeping
- **Deep Sleep Duration**: Time spent in deep sleep
- **Light Sleep Duration**: Time spent in light sleep
- **REM Sleep Duration**: Time spent in REM sleep
- **Awake Duration**: Time spent awake during sleep session

### Heart Rate Metrics

- **Average Heart Rate**: Mean BPM during sleep
- **Resting Heart Rate**: Resting heart rate
- **HRV RMSSD**: Heart rate variability (RMSSD)
- **HRV SDNN**: Heart rate variability (SDNN)

### Respiration Metrics

- **Average Oxygen Saturation**: Mean SpO2 percentage
- **Average Breathing Rate**: Mean breaths per minute
- **Snoring Duration**: Total time spent snoring

### Challenge Scores

- **Sleep Quality Score**: Composite score based on multiple factors
- **Recovery Score**: Based on HRV and readiness
- **Efficiency Score**: Sleep efficiency percentage
- **Health Score**: Overall health indicators

## Terra Webhook Setup

1. **Configure Terra Webhook URL:**

   - URL: `https://your-domain.com/webhook/terra`
   - Method: POST
   - Content-Type: application/json

2. **Set up webhook events:**

   - Enable "sleep" data type
   - Configure retry settings as needed

3. **Test webhook:**
   Use the sample payload provided in the main README to test the endpoint.

## Logging

Logs are stored in the `logs/` directory:

- `combined.log`: All log levels
- `error.log`: Error-level logs only

Log format includes:

- Timestamp
- Log level
- Service name
- Structured data
- Error stack traces (when applicable)

## Error Handling

The server includes comprehensive error handling:

- Input validation with Zod schemas
- Database error handling
- Graceful shutdown on SIGTERM/SIGINT
- Uncaught exception handling
- Structured error responses

## Development

### File Structure

```
server/
├── src/
│   ├── config/
│   │   └── logger.js
│   ├── routes/
│   │   └── webhook.js
│   ├── schemas/
│   │   └── sleepData.js
│   ├── services/
│   │   ├── sleepDataProcessor.js
│   │   └── supabaseService.js
│   └── index.js
├── logs/
├── package.json
├── nodemon.json
├── env.example
└── README.md
```

### Adding New Metrics

1. Update the Zod schemas in `src/schemas/sleepData.js`
2. Add processing logic in `src/services/sleepDataProcessor.js`
3. Update the database schema if needed
4. Add validation and error handling

## Challenge System Integration

The processed metrics are designed for challenge systems:

1. **Competition Metrics**: Pre-calculated scores for fair comparison
2. **User Tracking**: Session-based tracking for individual progress
3. **Leaderboards**: Ready-to-use leaderboard endpoints
4. **Historical Data**: Time-series data for trend analysis

## Security Considerations

- Validate all incoming webhook data
- Use environment variables for sensitive data
- Implement rate limiting for production
- Monitor logs for suspicious activity
- Use HTTPS in production

## Troubleshooting

### Common Issues

1. **Webhook validation fails**: Check Terra payload format and Zod schemas
2. **Database connection errors**: Verify Supabase credentials and network
3. **Port already in use**: Change PORT in .env file
4. **Missing environment variables**: Ensure all required vars are set

### Debug Mode

Set `LOG_LEVEL=debug` in your .env file for detailed logging.

## License

MIT License
