-- Migration: Add sleep challenge columns to existing challenges table
-- Description: Adds time windows and metric configuration columns for sleep challenges

-- Add new columns to challenges table if they don't exist
ALTER TABLE challenges 
ADD COLUMN IF NOT EXISTS entry_start_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS entry_end_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS challenge_start_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS challenge_end_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS metric_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS metric_calculation VARCHAR(20) DEFAULT 'average',
ADD COLUMN IF NOT EXISTS target_value DECIMAL(10, 4),
ADD COLUMN IF NOT EXISTS target_unit VARCHAR(20),
ADD COLUMN IF NOT EXISTS comparison_operator VARCHAR(10) DEFAULT 'gte',
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;

-- Update the status constraint to include new states
ALTER TABLE challenges DROP CONSTRAINT IF EXISTS challenges_status_check;
ALTER TABLE challenges ADD CONSTRAINT challenges_status_check 
    CHECK (status IN ('created', 'entry_open', 'entry_closed', 'active', 'completed', 'cancelled'));

-- Add new constraints for metric configuration
ALTER TABLE challenges DROP CONSTRAINT IF EXISTS challenges_metric_calculation_check;
ALTER TABLE challenges ADD CONSTRAINT challenges_metric_calculation_check 
    CHECK (metric_calculation IN ('average', 'total', 'minimum', 'maximum'));

ALTER TABLE challenges DROP CONSTRAINT IF EXISTS challenges_comparison_operator_check;
ALTER TABLE challenges ADD CONSTRAINT challenges_comparison_operator_check 
    CHECK (comparison_operator IN ('gte', 'lte', 'eq', 'gt', 'lt'));

-- Add new columns to challenge_participations table if they don't exist
ALTER TABLE challenge_participations 
ADD COLUMN IF NOT EXISTS calculated_metric_value DECIMAL(10, 4),
ADD COLUMN IF NOT EXISTS data_points_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_data_update TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS meets_requirements BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS qualification_checked_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_challenges_entry_times ON challenges(entry_start_time, entry_end_time);
CREATE INDEX IF NOT EXISTS idx_challenges_challenge_times ON challenges(challenge_start_time, challenge_end_time);
CREATE INDEX IF NOT EXISTS idx_challenges_metric_type ON challenges(metric_type);
CREATE INDEX IF NOT EXISTS idx_challenge_participations_meets_requirements ON challenge_participations(meets_requirements);

-- Update comments
COMMENT ON COLUMN challenges.entry_start_time IS 'When users can start joining the challenge';
COMMENT ON COLUMN challenges.entry_end_time IS 'When the entry period closes';
COMMENT ON COLUMN challenges.challenge_start_time IS 'When challenge tracking begins';
COMMENT ON COLUMN challenges.challenge_end_time IS 'When challenge tracking ends';
COMMENT ON COLUMN challenges.metric_type IS 'Type of metric to track (sleep_efficiency, total_sleep_duration_seconds, etc.)';
COMMENT ON COLUMN challenges.metric_calculation IS 'How to calculate the metric (average, total, minimum, maximum)';
COMMENT ON COLUMN challenges.target_value IS 'Target value that participants need to achieve';
COMMENT ON COLUMN challenges.target_unit IS 'Unit of the target value (percentage, seconds, etc.)';
COMMENT ON COLUMN challenges.comparison_operator IS 'How to compare calculated value with target (gte, lte, eq, gt, lt)';

COMMENT ON COLUMN challenge_participations.calculated_metric_value IS 'Final calculated metric value for this participant';
COMMENT ON COLUMN challenge_participations.data_points_count IS 'Number of sleep data points collected';
COMMENT ON COLUMN challenge_participations.meets_requirements IS 'Whether participant meets the challenge requirements';
COMMENT ON COLUMN challenge_participations.qualification_checked_at IS 'When qualification was last checked'; 