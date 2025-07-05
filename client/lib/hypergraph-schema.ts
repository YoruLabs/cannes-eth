import { Entity, Type } from '@graphprotocol/hypergraph';

// Simple patient entity
export class Patient extends Entity.Class<Patient>('Patient')({
  name: Type.Text,
  age: Type.Number,
  email: Type.Text,
}) {}

// Health provider entity  
export class HealthProvider extends Entity.Class<HealthProvider>('HealthProvider')({
  name: Type.Text,
  type: Type.Text,
  city: Type.Text,
}) {}

// Comprehensive User Oura Data entity
export class User_Oura_Data extends Entity.Class<User_Oura_Data>('User_Oura_Data')({
  // User identification
  user_wallet_address: Type.Text,
  user_id: Type.Text,
  
  // Sleep timing
  start_time: Type.Text,
  end_time: Type.Text,
  total_sleep_duration_seconds: Type.Number,
  
  // Sleep stages (seconds)
  deep_sleep_duration_seconds: Type.Number,
  light_sleep_duration_seconds: Type.Number,
  rem_sleep_duration_seconds: Type.Number,
  awake_duration_seconds: Type.Number,
  
  // Sleep quality metrics
  sleep_efficiency: Type.Number,
  sleep_score: Type.Number,
  sleep_quality_score: Type.Number,
  
  // Sleep latency
  sleep_latency_seconds: Type.Number,
  wake_up_latency_seconds: Type.Number,
  
  // Heart rate metrics
  avg_heart_rate_bpm: Type.Number,
  resting_heart_rate_bpm: Type.Number,
  avg_hrv_rmssd: Type.Number,
  avg_hrv_sdnn: Type.Number,
  
  // Respiration metrics
  avg_oxygen_saturation: Type.Number,
  avg_breathing_rate: Type.Number,
  snoring_duration_seconds: Type.Number,
  
  // Additional metrics
  temperature_delta: Type.Number,
  readiness_score: Type.Number,
  recovery_score: Type.Number,
  efficiency_score: Type.Number,
  health_score: Type.Number,
  recovery_level: Type.Number,
  
  // Metadata
  created_at: Type.Text,
  data_source: Type.Text, // "oura", "whoop", etc.
}) {} 