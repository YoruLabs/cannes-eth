-- Migration: Remove redundant session_id column from sleep_metrics table
-- The session_id is redundant because we have user_id and start_time which uniquely identify a sleep session

-- 1. Drop the session_id index first
DROP INDEX IF EXISTS idx_sleep_metrics_session_id;

-- 2. Remove the session_id column
ALTER TABLE sleep_metrics DROP COLUMN IF EXISTS session_id;

-- 3. Add a comment explaining the unique identification
COMMENT ON TABLE sleep_metrics IS 'Sleep metrics from Terra API. Each record is uniquely identified by user_id + start_time combination.';

-- 4. Create a unique constraint on user_id + start_time to ensure no duplicate sessions
ALTER TABLE sleep_metrics 
ADD CONSTRAINT unique_user_sleep_session 
UNIQUE (user_id, start_time);

-- 5. Add an index for the unique constraint
CREATE INDEX idx_sleep_metrics_user_start_time 
ON sleep_metrics(user_id, start_time); 