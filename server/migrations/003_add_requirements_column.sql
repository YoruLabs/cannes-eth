-- Migration: Add requirements column to challenges table
-- This allows storing structured requirements as JSON array

ALTER TABLE challenges 
ADD COLUMN IF NOT EXISTS challenge_requirements JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN challenges.challenge_requirements IS 'Array of requirement strings for the challenge';

-- Update existing challenges with proper requirements
UPDATE challenges 
SET challenge_requirements = '[
  "Achieve average sleep efficiency of 85% or higher",
  "Track sleep data for minimum 7 consecutive days", 
  "Connect Terra fitness tracker to your account",
  "Maintain consistent sleep schedule throughout challenge period"
]'::jsonb
WHERE challenge_type = 'sleep_efficiency';

UPDATE challenges 
SET challenge_requirements = '[
  "Complete daily health goals consistently",
  "Connect and sync your fitness tracking device",
  "Maintain activity throughout the challenge period",
  "Submit valid health data for verification"
]'::jsonb
WHERE challenge_type = 'health' OR challenge_type IS NULL;

-- Update challenge descriptions to be more professional
UPDATE challenges 
SET description = 'Demonstrate your commitment to quality sleep by maintaining an average sleep efficiency of 85% or higher over a 7-day period. Sleep efficiency measures the percentage of time spent asleep while in bed.'
WHERE challenge_type = 'sleep_efficiency';

UPDATE challenges 
SET description = 'Complete your personalized health goals and demonstrate consistency in your wellness journey. Track your progress and compete with others committed to healthy living.'
WHERE challenge_type = 'health' OR challenge_type IS NULL; 