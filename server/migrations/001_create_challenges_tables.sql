-- Migration: Create challenges and challenge_participations tables
-- Description: Creates tables for storing challenge information and participant data

-- Drop existing constraints if they exist
ALTER TABLE IF EXISTS challenges DROP CONSTRAINT IF EXISTS challenges_status_check;
ALTER TABLE IF EXISTS challenge_participations DROP CONSTRAINT IF EXISTS challenge_participations_status_check;
ALTER TABLE IF EXISTS challenge_participations DROP CONSTRAINT IF EXISTS challenge_participations_wallet_address_check;

-- Create challenges table
CREATE TABLE IF NOT EXISTS challenges (
    id SERIAL PRIMARY KEY,
    challenge_id INTEGER NOT NULL UNIQUE, -- This comes from the smart contract
    title VARCHAR(255) NOT NULL,
    description TEXT,
    entry_fee DECIMAL(18, 8) NOT NULL,
    challenge_type VARCHAR(50) NOT NULL, -- 'sleep_average', 'sleep_duration', etc.
    
    -- Time windows
    entry_start_time TIMESTAMP WITH TIME ZONE NOT NULL, -- When users can start joining
    entry_end_time TIMESTAMP WITH TIME ZONE NOT NULL,   -- When entry period closes
    challenge_start_time TIMESTAMP WITH TIME ZONE NOT NULL, -- When challenge tracking begins
    challenge_end_time TIMESTAMP WITH TIME ZONE NOT NULL,   -- When challenge tracking ends
    
    -- Challenge configuration
    requirements JSONB DEFAULT '{}',
    winner_count INTEGER DEFAULT 1,
    
    -- Metric configuration for sleep challenges
    metric_type VARCHAR(50), -- 'sleep_efficiency', 'total_sleep_duration_seconds', 'deep_sleep_duration_seconds', etc.
    metric_calculation VARCHAR(20) DEFAULT 'average', -- 'average', 'total', 'minimum', 'maximum'
    target_value DECIMAL(10, 4), -- Target value for the metric (e.g., 85 for sleep efficiency, 32400 for 9 hours)
    target_unit VARCHAR(20), -- 'percentage', 'seconds', 'hours', etc.
    comparison_operator VARCHAR(10) DEFAULT 'gte', -- 'gte' (>=), 'lte' (<=), 'eq' (=)
    
    -- Status and lifecycle
    status VARCHAR(20) DEFAULT 'created',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    transaction_hash VARCHAR(66),
    completion_transaction_hash VARCHAR(66),
    
    -- Indexes
    CONSTRAINT challenges_challenge_id_key UNIQUE (challenge_id)
);

-- Create challenge_participations table
CREATE TABLE IF NOT EXISTS challenge_participations (
    id SERIAL PRIMARY KEY,
    challenge_id INTEGER NOT NULL,
    wallet_address VARCHAR(42) NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    transaction_hash VARCHAR(66),
    status VARCHAR(20) DEFAULT 'active',
    
    -- Metric tracking for the participant
    calculated_metric_value DECIMAL(10, 4), -- Final calculated value for this participant
    data_points_count INTEGER DEFAULT 0, -- Number of data points collected
    last_data_update TIMESTAMP WITH TIME ZONE, -- When last sleep data was processed
    
    -- Qualification status
    meets_requirements BOOLEAN DEFAULT FALSE, -- Whether participant meets the challenge requirements
    qualification_checked_at TIMESTAMP WITH TIME ZONE, -- When qualification was last checked
    
    -- Foreign key constraint
    CONSTRAINT fk_challenge_participations_challenge_id 
        FOREIGN KEY (challenge_id) REFERENCES challenges(challenge_id) ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate participations
    CONSTRAINT challenge_participations_unique_participation 
        UNIQUE (challenge_id, wallet_address)
);

-- Add check constraints after table creation
ALTER TABLE challenges ADD CONSTRAINT challenges_status_check 
    CHECK (status IN ('created', 'entry_open', 'entry_closed', 'active', 'completed', 'cancelled'));

ALTER TABLE challenges ADD CONSTRAINT challenges_metric_calculation_check 
    CHECK (metric_calculation IN ('average', 'total', 'minimum', 'maximum'));

ALTER TABLE challenges ADD CONSTRAINT challenges_comparison_operator_check 
    CHECK (comparison_operator IN ('gte', 'lte', 'eq', 'gt', 'lt'));

ALTER TABLE challenge_participations ADD CONSTRAINT challenge_participations_status_check 
    CHECK (status IN ('active', 'completed', 'winner', 'disqualified'));

ALTER TABLE challenge_participations ADD CONSTRAINT challenge_participations_wallet_address_check 
    CHECK (wallet_address ~ '^0x[a-fA-F0-9]{40}$');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_challenges_challenge_id ON challenges(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status);
CREATE INDEX IF NOT EXISTS idx_challenges_challenge_type ON challenges(challenge_type);
CREATE INDEX IF NOT EXISTS idx_challenges_entry_times ON challenges(entry_start_time, entry_end_time);
CREATE INDEX IF NOT EXISTS idx_challenges_challenge_times ON challenges(challenge_start_time, challenge_end_time);
CREATE INDEX IF NOT EXISTS idx_challenges_metric_type ON challenges(metric_type);

CREATE INDEX IF NOT EXISTS idx_challenge_participations_challenge_id ON challenge_participations(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participations_wallet_address ON challenge_participations(wallet_address);
CREATE INDEX IF NOT EXISTS idx_challenge_participations_status ON challenge_participations(status);
CREATE INDEX IF NOT EXISTS idx_challenge_participations_meets_requirements ON challenge_participations(meets_requirements);

-- Create views for easier querying

-- View for active challenges that are accepting entries
CREATE OR REPLACE VIEW challenges_accepting_entries AS
SELECT 
    c.*,
    COUNT(cp.id) as current_participants,
    (NOW() BETWEEN c.entry_start_time AND c.entry_end_time) as can_join_now,
    (NOW() > c.entry_end_time) as entry_period_closed
FROM challenges c
LEFT JOIN challenge_participations cp ON c.challenge_id = cp.challenge_id 
    AND cp.status = 'active'
WHERE c.status IN ('created', 'entry_open')
GROUP BY c.id;

-- View for challenges that are currently running
CREATE OR REPLACE VIEW active_challenges AS
SELECT 
    c.*,
    COUNT(cp.id) as participant_count,
    (NOW() BETWEEN c.challenge_start_time AND c.challenge_end_time) as is_currently_active,
    (NOW() > c.challenge_end_time) as should_be_completed
FROM challenges c
LEFT JOIN challenge_participations cp ON c.challenge_id = cp.challenge_id 
    AND cp.status = 'active'
WHERE c.status = 'active'
GROUP BY c.id;

-- View for challenge results and winners (uses existing sleep_metrics table)
CREATE OR REPLACE VIEW challenge_results AS
SELECT 
    cp.challenge_id,
    cp.wallet_address,
    cp.calculated_metric_value,
    cp.data_points_count,
    cp.meets_requirements,
    cp.status,
    c.title as challenge_title,
    c.metric_type,
    c.target_value,
    c.target_unit,
    c.comparison_operator,
    c.winner_count,
    ROW_NUMBER() OVER (
        PARTITION BY cp.challenge_id 
        ORDER BY 
            cp.meets_requirements DESC,
            CASE 
                WHEN c.comparison_operator = 'gte' THEN cp.calculated_metric_value 
                ELSE -cp.calculated_metric_value 
            END DESC
    ) as rank
FROM challenge_participations cp
JOIN challenges c ON cp.challenge_id = c.challenge_id
WHERE cp.calculated_metric_value IS NOT NULL
ORDER BY cp.challenge_id, rank;

-- Add comments for documentation
COMMENT ON TABLE challenges IS 'Stores health challenge information with time windows and metric configuration';
COMMENT ON TABLE challenge_participations IS 'Tracks user participation in challenges with calculated metrics';

-- Grant permissions (adjust based on your Supabase setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON challenges TO authenticated;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON challenge_participations TO authenticated;
-- GRANT SELECT ON challenges_accepting_entries TO authenticated;
-- GRANT SELECT ON active_challenges TO authenticated;
-- GRANT SELECT ON challenge_results TO authenticated;
-- GRANT USAGE, SELECT ON SEQUENCE challenges_id_seq TO authenticated;
-- GRANT USAGE, SELECT ON SEQUENCE challenge_participations_id_seq TO authenticated; 