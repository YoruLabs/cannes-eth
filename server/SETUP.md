# Quick Setup Guide

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment

```bash
cp env.example .env
```

Edit `.env` with your credentials:

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
LOG_LEVEL=info
```

### 3. Set Up Database

Run these SQL commands in your Supabase SQL editor:

```sql
-- Connections table
CREATE TABLE connections (
  id UUID PRIMARY KEY,
  provider TEXT NOT NULL,
  reference_id TEXT,
  active BOOLEAN DEFAULT true,
  last_webhook_update TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sleep metrics table
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

-- Indexes for performance
CREATE INDEX idx_connections_user_id ON sleep_metrics(user_id);
CREATE INDEX idx_sleep_metrics_created_at ON sleep_metrics(created_at);
CREATE INDEX idx_sleep_metrics_session_id ON sleep_metrics(session_id);
```

### 4. Start the Server

```bash
npm run dev
```

The server will start on `http://localhost:3001`

### 5. Test the Setup

```bash
npm test
```

This will test all endpoints with sample data.

## 📋 Available Endpoints

- **POST** `/webhook/terra` - Receive Terra sleep data
- **GET** `/health` - Health check
- **GET** `/users/:userId/metrics` - Get user sleep metrics
- **GET** `/leaderboard` - Get sleep leaderboard

## 🔧 Terra Webhook Configuration

1. Go to your Terra dashboard
2. Set webhook URL to: `https://your-domain.com/webhook/terra`
3. Enable "sleep" data type
4. Test with the sample payload in `test-webhook.js`

## 📊 Processed Metrics

The server automatically processes and stores:

- **Sleep Efficiency**: Percentage of time in bed actually sleeping
- **Sleep Quality Score**: Composite score (0-100)
- **Recovery Score**: Based on HRV and readiness
- **Health Score**: Overall health indicators
- **Heart Rate Metrics**: Average, resting, HRV
- **Respiration Metrics**: Oxygen saturation, breathing rate, snoring
- **Sleep Stages**: Deep, light, REM sleep durations

## 🏆 Challenge System Ready

The processed metrics are optimized for competition:

- Pre-calculated scores for fair comparison
- Session-based tracking
- Leaderboard endpoints
- Historical data analysis

## 🐛 Troubleshooting

- **Port in use**: Change `PORT` in `.env`
- **Database errors**: Check Supabase credentials
- **Webhook fails**: Verify Terra payload format
- **Logs**: Check `logs/` directory for detailed information

## 📚 Next Steps

1. Configure Terra webhook URL
2. Set up monitoring and alerts
3. Implement rate limiting for production
4. Add authentication if needed
5. Scale database as needed

---

**Need help?** Check the main `README.md` for detailed documentation.
