-- Simple user table for World ID authentication
-- Drop existing tables if they exist (be careful with this in production!)
DROP TABLE IF EXISTS profiles CASCADE;

-- Create the simplified profiles table for World ID users
CREATE TABLE profiles (
  wallet_address TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  world_id TEXT,
  nullifier_hash TEXT,
  verification_level TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_profiles_world_id ON profiles(world_id);
CREATE INDEX idx_profiles_nullifier_hash ON profiles(nullifier_hash);
CREATE INDEX idx_profiles_is_verified ON profiles(is_verified);

-- Add RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for the profiles table
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (true);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 