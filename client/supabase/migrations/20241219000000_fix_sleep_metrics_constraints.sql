-- Fix NOT NULL constraints on sleep_metrics table
-- Allow NULL values for optional fields that may not be available in all sleep data

-- Drop existing NOT NULL constraints on optional fields
ALTER TABLE sleep_metrics ALTER COLUMN avg_heart_rate_bpm DROP NOT NULL;
ALTER TABLE sleep_metrics ALTER COLUMN resting_heart_rate_bpm DROP NOT NULL;
ALTER TABLE sleep_metrics ALTER COLUMN avg_hrv_rmssd DROP NOT NULL;
ALTER TABLE sleep_metrics ALTER COLUMN avg_hrv_sdnn DROP NOT NULL;
ALTER TABLE sleep_metrics ALTER COLUMN avg_oxygen_saturation DROP NOT NULL;
ALTER TABLE sleep_metrics ALTER COLUMN avg_breathing_rate DROP NOT NULL;
ALTER TABLE sleep_metrics ALTER COLUMN snoring_duration_seconds DROP NOT NULL;
ALTER TABLE sleep_metrics ALTER COLUMN temperature_delta DROP NOT NULL;
ALTER TABLE sleep_metrics ALTER COLUMN readiness_score DROP NOT NULL;
ALTER TABLE sleep_metrics ALTER COLUMN sleep_score DROP NOT NULL;
ALTER TABLE sleep_metrics ALTER COLUMN sleep_quality_score DROP NOT NULL;
ALTER TABLE sleep_metrics ALTER COLUMN recovery_score DROP NOT NULL;
ALTER TABLE sleep_metrics ALTER COLUMN efficiency_score DROP NOT NULL;
ALTER TABLE sleep_metrics ALTER COLUMN health_score DROP NOT NULL;

-- Add comments to document which fields are optional
COMMENT ON COLUMN sleep_metrics.avg_heart_rate_bpm IS 'Average heart rate during sleep (optional)';
COMMENT ON COLUMN sleep_metrics.resting_heart_rate_bpm IS 'Resting heart rate (optional)';
COMMENT ON COLUMN sleep_metrics.avg_hrv_rmssd IS 'Average HRV RMSSD (optional)';
COMMENT ON COLUMN sleep_metrics.avg_hrv_sdnn IS 'Average HRV SDNN (optional)';
COMMENT ON COLUMN sleep_metrics.avg_oxygen_saturation IS 'Average oxygen saturation (optional)';
COMMENT ON COLUMN sleep_metrics.avg_breathing_rate IS 'Average breathing rate (optional)';
COMMENT ON COLUMN sleep_metrics.snoring_duration_seconds IS 'Snoring duration in seconds (optional)';
COMMENT ON COLUMN sleep_metrics.temperature_delta IS 'Temperature delta (optional)';
COMMENT ON COLUMN sleep_metrics.readiness_score IS 'Readiness score (optional)';
COMMENT ON COLUMN sleep_metrics.sleep_score IS 'Sleep score (optional)';
COMMENT ON COLUMN sleep_metrics.sleep_quality_score IS 'Sleep quality score (optional)';
COMMENT ON COLUMN sleep_metrics.recovery_score IS 'Recovery score (optional)';
COMMENT ON COLUMN sleep_metrics.efficiency_score IS 'Efficiency score (optional)';
COMMENT ON COLUMN sleep_metrics.health_score IS 'Health score (optional)'; 