-- Migration: Allow NULL values for optional sleep metrics
-- Terra doesn't always provide all metrics, so we need to allow NULL values for optional fields

-- Make optional heart rate metrics nullable
ALTER TABLE sleep_metrics ALTER COLUMN avg_heart_rate_bpm DROP NOT NULL;
ALTER TABLE sleep_metrics ALTER COLUMN resting_heart_rate_bpm DROP NOT NULL;
ALTER TABLE sleep_metrics ALTER COLUMN avg_hrv_rmssd DROP NOT NULL;
ALTER TABLE sleep_metrics ALTER COLUMN avg_hrv_sdnn DROP NOT NULL;

-- Make optional respiration metrics nullable
ALTER TABLE sleep_metrics ALTER COLUMN avg_oxygen_saturation DROP NOT NULL;
ALTER TABLE sleep_metrics ALTER COLUMN avg_breathing_rate DROP NOT NULL;
ALTER TABLE sleep_metrics ALTER COLUMN snoring_duration_seconds DROP NOT NULL;

-- Make optional temperature and readiness metrics nullable
ALTER TABLE sleep_metrics ALTER COLUMN temperature_delta DROP NOT NULL;
ALTER TABLE sleep_metrics ALTER COLUMN readiness_score DROP NOT NULL;

-- Make sleep score nullable (not always provided)
ALTER TABLE sleep_metrics ALTER COLUMN sleep_score DROP NOT NULL;

-- Add comments explaining which fields are optional
COMMENT ON COLUMN sleep_metrics.avg_heart_rate_bpm IS 'Average heart rate in BPM - may be NULL if not available from device';
COMMENT ON COLUMN sleep_metrics.resting_heart_rate_bpm IS 'Resting heart rate in BPM - may be NULL if not available from device';
COMMENT ON COLUMN sleep_metrics.avg_hrv_rmssd IS 'Average HRV RMSSD - may be NULL if not available from device';
COMMENT ON COLUMN sleep_metrics.avg_hrv_sdnn IS 'Average HRV SDNN - may be NULL if not available from device';
COMMENT ON COLUMN sleep_metrics.avg_oxygen_saturation IS 'Average oxygen saturation percentage - may be NULL if not available from device';
COMMENT ON COLUMN sleep_metrics.avg_breathing_rate IS 'Average breathing rate - may be NULL if not available from device';
COMMENT ON COLUMN sleep_metrics.snoring_duration_seconds IS 'Total snoring duration in seconds - may be NULL if not available from device';
COMMENT ON COLUMN sleep_metrics.temperature_delta IS 'Temperature delta - may be NULL if not available from device';
COMMENT ON COLUMN sleep_metrics.readiness_score IS 'Readiness score - may be NULL if not available from device';
COMMENT ON COLUMN sleep_metrics.sleep_score IS 'Sleep score - may be NULL if not available from device'; 