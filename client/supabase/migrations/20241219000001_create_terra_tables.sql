-- Create Terra integration tables if they don't exist
-- This ensures the tables are created with the correct schema

-- Create connections table
CREATE TABLE IF NOT EXISTS connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'connected',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sleep_metrics table
CREATE TABLE IF NOT EXISTS sleep_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  total_sleep_duration_seconds INTEGER NOT NULL,
  sleep_efficiency DECIMAL(5,2) NOT NULL,
  deep_sleep_duration_seconds INTEGER NOT NULL DEFAULT 0,
  light_sleep_duration_seconds INTEGER NOT NULL DEFAULT 0,
  rem_sleep_duration_seconds INTEGER NOT NULL DEFAULT 0,
  awake_duration_seconds INTEGER NOT NULL DEFAULT 0,
  sleep_latency_seconds INTEGER NOT NULL DEFAULT 0,
  wake_up_latency_seconds INTEGER NOT NULL DEFAULT 0,
  avg_heart_rate_bpm INTEGER,
  resting_heart_rate_bpm INTEGER,
  avg_hrv_rmssd INTEGER,
  avg_hrv_sdnn INTEGER,
  avg_oxygen_saturation DECIMAL(4,2),
  avg_breathing_rate INTEGER,
  snoring_duration_seconds INTEGER,
  temperature_delta DECIMAL(4,2),
  readiness_score INTEGER,
  recovery_level INTEGER NOT NULL DEFAULT 0,
  sleep_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sleep_quality_score DECIMAL(5,2),
  recovery_score DECIMAL(5,2),
  efficiency_score DECIMAL(5,2),
  health_score DECIMAL(5,2)
);

-- Add unique constraint on user_id and start_time
ALTER TABLE sleep_metrics ADD CONSTRAINT IF NOT EXISTS unique_user_sleep_session 
  UNIQUE (user_id, start_time);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sleep_metrics_user_id ON sleep_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_sleep_metrics_start_time ON sleep_metrics(start_time);
CREATE INDEX IF NOT EXISTS idx_sleep_metrics_created_at ON sleep_metrics(created_at);
CREATE INDEX IF NOT EXISTS idx_connections_user_id ON connections(user_id);
CREATE INDEX IF NOT EXISTS idx_connections_provider ON connections(provider);

-- Add RLS (Row Level Security)
ALTER TABLE sleep_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- Create policies for sleep_metrics table
CREATE POLICY "Users can view their own sleep metrics" ON sleep_metrics
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own sleep metrics" ON sleep_metrics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own sleep metrics" ON sleep_metrics
  FOR UPDATE USING (true);

-- Create policies for connections table
CREATE POLICY "Users can view their own connections" ON connections
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own connections" ON connections
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own connections" ON connections
  FOR UPDATE USING (true);

-- Create triggers to automatically update the updated_at column
CREATE TRIGGER update_connections_updated_at
    BEFORE UPDATE ON connections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 