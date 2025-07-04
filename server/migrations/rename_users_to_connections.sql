-- Migration: Rename users table to connections
-- This better reflects the semantic meaning since each record represents a Terra provider connection

-- 1. Rename the table
ALTER TABLE users RENAME TO connections;

-- 2. Update the foreign key constraint in sleep_metrics table
ALTER TABLE sleep_metrics 
DROP CONSTRAINT IF EXISTS sleep_metrics_user_id_fkey;

ALTER TABLE sleep_metrics 
ADD CONSTRAINT sleep_metrics_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES connections(id);

-- 3. Update the index name to reflect the new table name
DROP INDEX IF EXISTS idx_sleep_metrics_user_id;
CREATE INDEX idx_connections_user_id ON sleep_metrics(user_id);

-- 4. Add a comment to clarify the table purpose
COMMENT ON TABLE connections IS 'Terra provider connections for World miniapp users. Each record represents a connection to a health data provider (Oura, Whoop, etc.) for a specific user wallet.';

-- 5. Add a comment to clarify the user_id field
COMMENT ON COLUMN connections.id IS 'Terra user ID - unique for each provider connection';
COMMENT ON COLUMN connections.reference_id IS 'Reference ID linking to World miniapp wallet address'; 