const { z } = require('zod');

// Terra Webhook User Schema
const TerraUserSchema = z.object({
  created_at: z.string().nullable(),
  provider: z.string(),
  reference_id: z.string(),
  scopes: z.any().nullable(),
  user_id: z.string().uuid(),
  active: z.boolean(),
  last_webhook_update: z.string().nullable()
});

// Heart Rate Data Schemas
const HeartRateSampleSchema = z.object({
  context: z.number(),
  timestamp: z.string(),
  timer_duration_seconds: z.number().nullable(),
  bpm: z.number()
});

const HRVSampleSchema = z.object({
  hrv_rmssd: z.number(),
  timestamp: z.string()
});

const HRVSdnnSampleSchema = z.object({
  hrv_sdnn: z.number(),
  timestamp: z.string()
});

const HeartRateSummarySchema = z.object({
  avg_hr_bpm: z.number(),
  avg_hrv_sdnn: z.number(),
  avg_hrv_rmssd: z.number(),
  min_hr_bpm: z.number(),
  max_hr_bpm: z.number(),
  resting_hr_bpm: z.number(),
  user_max_hr_bpm: z.number()
});

const HeartRateDataSchema = z.object({
  summary: HeartRateSummarySchema,
  detailed: z.object({
    hrv_samples_rmssd: z.array(HRVSampleSchema),
    hr_samples: z.array(HeartRateSampleSchema),
    hrv_samples_sdnn: z.array(HRVSdnnSampleSchema)
  })
});

// Respiration Data Schemas
const SnoringSampleSchema = z.object({
  duration_seconds: z.number(),
  timestamp: z.string()
});

const SnoringDataSchema = z.object({
  total_snoring_duration_seconds: z.number(),
  samples: z.array(SnoringSampleSchema),
  num_snoring_events: z.number(),
  end_time: z.string(),
  start_time: z.string()
});

const OxygenSaturationSampleSchema = z.object({
  percentage: z.number(),
  type: z.number(),
  timestamp: z.string()
});

const OxygenSaturationDataSchema = z.object({
  samples: z.array(OxygenSaturationSampleSchema),
  avg_saturation_percentage: z.number(),
  end_time: z.string(),
  start_time: z.string()
});

const BreathSampleSchema = z.object({
  breaths_per_min: z.number(),
  timestamp: z.string()
});

const BreathsDataSchema = z.object({
  samples: z.array(BreathSampleSchema),
  on_demand_reading: z.boolean(),
  avg_breaths_per_min: z.number(),
  max_breaths_per_min: z.number(),
  end_time: z.string(),
  min_breaths_per_min: z.number(),
  start_time: z.string()
});

const RespirationDataSchema = z.object({
  snoring_data: SnoringDataSchema,
  oxygen_saturation_data: OxygenSaturationDataSchema,
  breaths_data: BreathsDataSchema
});

// Sleep Durations Data Schemas
const HypnogramSampleSchema = z.object({
  level: z.number(),
  timestamp: z.string()
});

const AsleepDataSchema = z.object({
  num_REM_events: z.number(),
  duration_asleep_state_seconds: z.number(),
  duration_REM_sleep_state_seconds: z.number(),
  duration_deep_sleep_state_seconds: z.number(),
  duration_light_sleep_state_seconds: z.number()
});

const AwakeDataSchema = z.object({
  num_wakeup_events: z.number(),
  sleep_latency_seconds: z.number(),
  duration_short_interruption_seconds: z.number(),
  duration_long_interruption_seconds: z.number(),
  duration_awake_state_seconds: z.number(),
  wake_up_latency_seconds: z.number(),
  num_out_of_bed_events: z.number()
});

const OtherDataSchema = z.object({
  duration_unmeasurable_sleep_seconds: z.number(),
  duration_in_bed_seconds: z.number()
});

const SleepDurationsDataSchema = z.object({
  sleep_efficiency: z.number(),
  hypnogram_samples: z.array(HypnogramSampleSchema),
  asleep: AsleepDataSchema,
  awake: AwakeDataSchema,
  other: OtherDataSchema
});

// Metadata Schema
const MetadataSchema = z.object({
  timestamp_localization: z.number(),
  summary_id: z.string().nullable(),
  is_nap: z.boolean(),
  end_time: z.string(),
  upload_type: z.number(),
  start_time: z.string()
});

// Complete Terra Sleep Data Schema
const TerraSleepDataSchema = z.object({
  heart_rate_data: HeartRateDataSchema,
  readiness_data: z.object({
    readiness: z.number(),
    recovery_level: z.number()
  }),
  metadata: MetadataSchema,
  scores: z.object({
    sleep: z.number().nullable()
  }),
  respiration_data: RespirationDataSchema,
  sleep_durations_data: SleepDurationsDataSchema,
  device_data: z.object({
    serial_number: z.string().nullable(),
    activation_timestamp: z.string().nullable(),
    name: z.string().nullable(),
    software_version: z.string().nullable(),
    manufacturer: z.string().nullable(),
    last_upload_date: z.string().nullable(),
    other_devices: z.array(z.any()),
    hardware_version: z.string().nullable(),
    data_provided: z.array(z.any())
  }),
  data_enrichment: z.object({
    sleep_contributors: z.any().nullable(),
    sleep_score: z.number().nullable()
  }),
  temperature_data: z.object({
    delta: z.number()
  })
});

// Terra Healthcheck Schema
const TerraHealthcheckSchema = z.object({
  creation_timestamp: z.string(),
  sent_webhooks_last_hour: z.number(),
  status: z.string(),
  trend_percentage: z.number(),
  type: z.literal('healthcheck'),
  version: z.string()
});

// Terra Webhook Payload Schema
const TerraWebhookSchema = z.object({
  user: TerraUserSchema,
  data: z.array(TerraSleepDataSchema),
  type: z.literal('sleep')
});

// Combined Terra Webhook Schema that handles both types
const TerraWebhookCombinedSchema = z.union([
  TerraWebhookSchema,
  TerraHealthcheckSchema
]);

// Processed Sleep Metrics Schema (for challenge system)
const ProcessedSleepMetricsSchema = z.object({
  user_id: z.string().uuid(),
  session_id: z.string(),
  start_time: z.string(),
  end_time: z.string(),
  total_sleep_duration_seconds: z.number(),
  sleep_efficiency: z.number(),
  deep_sleep_duration_seconds: z.number(),
  light_sleep_duration_seconds: z.number(),
  rem_sleep_duration_seconds: z.number(),
  awake_duration_seconds: z.number(),
  sleep_latency_seconds: z.number(),
  wake_up_latency_seconds: z.number(),
  avg_heart_rate_bpm: z.number(),
  resting_heart_rate_bpm: z.number(),
  avg_hrv_rmssd: z.number(),
  avg_hrv_sdnn: z.number(),
  avg_oxygen_saturation: z.number(),
  avg_breathing_rate: z.number(),
  snoring_duration_seconds: z.number(),
  temperature_delta: z.number(),
  readiness_score: z.number(),
  recovery_level: z.number(),
  sleep_score: z.number().nullable(),
  created_at: z.string()
});

module.exports = {
  TerraWebhookSchema,
  TerraHealthcheckSchema,
  TerraWebhookCombinedSchema,
  ProcessedSleepMetricsSchema,
  TerraSleepDataSchema
}; 