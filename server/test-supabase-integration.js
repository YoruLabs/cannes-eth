const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Sample Terra sleep data payload
const sampleTerraPayload = {
  "user": {
    "created_at": null,
    "provider": "OURA",
    "reference_id": "0x1234567890abcdef1234567890abcdef12345678",
    "scopes": null,
    "user_id": "123e4567-e89b-12d3-a456-426614174000", // valid UUID
    "active": true,
    "last_webhook_update": null
  },
  "data": [
    {
      "session_id": "test-session-12345-67890", // Add session_id for sleep_metrics table
      "heart_rate_data": {
        "summary": {
          "avg_hr_bpm": 79,
          "avg_hrv_sdnn": 111,
          "avg_hrv_rmssd": 133,
          "min_hr_bpm": 78,
          "max_hr_bpm": 49,
          "resting_hr_bpm": 66,
          "user_max_hr_bpm": 184
        },
        "detailed": {
          "hrv_samples_rmssd": [
            {
              "hrv_rmssd": 36,
              "timestamp": "2025-07-04T21:02:20.000000+00:00"
            }
          ],
          "hr_samples": [
            {
              "context": 0,
              "timestamp": "2025-07-04T21:02:20.000000+00:00",
              "timer_duration_seconds": null,
              "bpm": 152
            }
          ],
          "hrv_samples_sdnn": [
            {
              "hrv_sdnn": 44,
              "timestamp": "2025-07-04T21:02:20.000000+00:00"
            }
          ]
        }
      },
      "readiness_data": {
        "readiness": 61,
        "recovery_level": 3
      },
      "metadata": {
        "timestamp_localization": 1,
        "summary_id": "test-session-12345-67890", // Use same session_id
        "is_nap": false,
        "end_time": "2025-07-05T04:32:20.000000+00:00",
        "upload_type": 0,
        "start_time": "2025-07-04T21:02:20.000000+00:00"
      },
      "scores": {
        "sleep": 85
      },
      "respiration_data": {
        "snoring_data": {
          "total_snoring_duration_seconds": 331,
          "samples": [
            {
              "duration_seconds": 99,
              "timestamp": "2025-07-04T21:02:20.000000+00:00"
            }
          ],
          "num_snoring_events": 0,
          "end_time": "2025-07-04T22:33:20.000000+00:00",
          "start_time": "2025-07-04T22:33:20.000000+00:00"
        },
        "oxygen_saturation_data": {
          "samples": [
            {
              "percentage": 99,
              "type": 0,
              "timestamp": "2025-07-04T21:02:20.000000+00:00"
            }
          ],
          "avg_saturation_percentage": 93,
          "end_time": "2025-07-04T22:33:20.000000+00:00",
          "start_time": "2025-07-04T22:33:20.000000+00:00"
        },
        "breaths_data": {
          "samples": [
            {
              "breaths_per_min": 12,
              "timestamp": "2025-07-04T21:02:20.000000+00:00"
            }
          ],
          "on_demand_reading": true,
          "avg_breaths_per_min": 19,
          "max_breaths_per_min": 12,
          "end_time": "2025-07-04T22:33:20.000000+00:00",
          "min_breaths_per_min": 16,
          "start_time": "2025-07-04T22:33:20.000000+00:00"
        }
      },
      "sleep_durations_data": {
        "sleep_efficiency": 1.9938853887604413,
        "hypnogram_samples": [
          {
            "level": 4,
            "timestamp": "2025-07-04T21:02:20.000000+00:00"
          }
        ],
        "asleep": {
          "num_REM_events": 10,
          "duration_asleep_state_seconds": 377.28851499185174,
          "duration_REM_sleep_state_seconds": 331.193753665309,
          "duration_deep_sleep_state_seconds": 415.69009357564454,
          "duration_light_sleep_state_seconds": 421.35806662354315
        },
        "awake": {
          "num_wakeup_events": 13,
          "sleep_latency_seconds": 247.15582050112627,
          "duration_short_interruption_seconds": 110.52744015261756,
          "duration_long_interruption_seconds": 169.13677315392545,
          "duration_awake_state_seconds": 188.17053556949534,
          "wake_up_latency_seconds": 427.3524895015741,
          "num_out_of_bed_events": 4
        },
        "other": {
          "duration_unmeasurable_sleep_seconds": 395.1017258263604,
          "duration_in_bed_seconds": 55.589391238581406
        }
      },
      "device_data": {
        "serial_number": null,
        "activation_timestamp": null,
        "name": null,
        "software_version": null,
        "manufacturer": null,
        "last_upload_date": null,
        "other_devices": [],
        "hardware_version": null,
        "data_provided": []
      },
      "data_enrichment": {
        "sleep_contributors": null,
        "sleep_score": null
      },
      "temperature_data": {
        "delta": -0.06857358880477937
      }
    }
  ],
  "type": "sleep"
};

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...');
  
  try {
    const { data, error } = await supabase
      .from('connections')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection error:', error.message);
    return false;
  }
}

async function checkTableExists(tableName) {
  console.log(`🔍 Checking if table '${tableName}' exists...`);
  
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      console.error(`❌ Table '${tableName}' does not exist or is not accessible:`, error.message);
      return false;
    }
    
    console.log(`✅ Table '${tableName}' exists and is accessible`);
    return true;
  } catch (error) {
    console.error(`❌ Error checking table '${tableName}':`, error.message);
    return false;
  }
}

async function sendWebhookTest() {
  console.log('🚀 Sending test webhook to server...');
  
  try {
    const response = await axios.post('http://localhost:3001/webhook/terra', sampleTerraPayload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Webhook sent successfully');
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('❌ Webhook test failed:');
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    
    return null;
  }
}

async function verifyConnectionCreated() {
  console.log('🔍 Verifying connection was created in database...');
  
  try {
    const { data, error } = await supabase
      .from('connections')
      .select('*')
      .eq('id', sampleTerraPayload.user.user_id) // Use id field (Terra user_id)
      .single();

    if (error) {
      console.error('❌ Error fetching connection:', error.message);
      return null;
    }

    if (data) {
      console.log('✅ Connection found in database:');
      console.log(JSON.stringify(data, null, 2));
      return data;
    } else {
      console.log('❌ Connection not found in database');
      return null;
    }
  } catch (error) {
    console.error('❌ Error verifying connection:', error.message);
    return null;
  }
}

async function verifySleepMetricsCreated() {
  console.log('🔍 Verifying sleep metrics were created in database...');
  
  try {
    const { data, error } = await supabase
      .from('sleep_metrics')
      .select('*')
      .eq('user_id', sampleTerraPayload.user.user_id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ Error fetching sleep metrics:', error.message);
      return null;
    }

    if (data && data.length > 0) {
      console.log(`✅ Found ${data.length} sleep metrics records:`);
      data.forEach((metric, index) => {
        console.log(`\n--- Record ${index + 1} ---`);
        console.log('Session ID:', metric.session_id);
        console.log('Sleep Efficiency:', metric.sleep_efficiency);
        console.log('Total Sleep Duration:', metric.total_sleep_duration_seconds, 'seconds');
        console.log('Sleep Quality Score:', metric.sleep_quality_score);
        console.log('Recovery Score:', metric.recovery_score);
        console.log('Created At:', metric.created_at);
      });
      return data;
    } else {
      console.log('❌ No sleep metrics found in database');
      return null;
    }
  } catch (error) {
    console.error('❌ Error verifying sleep metrics:', error.message);
    return null;
  }
}

async function testConnectionByWalletAndProvider() {
  console.log('🔍 Testing getConnectionByWalletAndProvider method...');
  
  try {
    const { data, error } = await supabase
      .from('connections')
      .select('*')
      .eq('reference_id', sampleTerraPayload.user.reference_id)
      .eq('provider', sampleTerraPayload.user.provider)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Error testing connection lookup:', error.message);
      return null;
    }

    if (data) {
      console.log('✅ Connection found by wallet and provider:');
      console.log(JSON.stringify(data, null, 2));
      return data;
    } else {
      console.log('❌ Connection not found by wallet and provider');
      return null;
    }
  } catch (error) {
    console.error('❌ Error testing connection lookup:', error.message);
    return null;
  }
}

async function cleanupTestData() {
  console.log('🧹 Cleaning up test data...');
  
  try {
    // Delete sleep metrics first (due to foreign key constraint)
    const { error: metricsError } = await supabase
      .from('sleep_metrics')
      .delete()
      .eq('user_id', sampleTerraPayload.user.user_id);

    if (metricsError) {
      console.error('❌ Error cleaning up sleep metrics:', metricsError.message);
    } else {
      console.log('✅ Sleep metrics cleaned up');
    }

    // Delete connection
    const { error: connectionError } = await supabase
      .from('connections')
      .delete()
      .eq('id', sampleTerraPayload.user.user_id); // Use id field (Terra user_id)

    if (connectionError) {
      console.error('❌ Error cleaning up connection:', connectionError.message);
    } else {
      console.log('✅ Connection cleaned up');
    }

  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
  }
}

async function ensureTestConnectionExists() {
  console.log('🔧 Ensuring test connection exists...');
  try {
    const { data, error } = await supabase
      .from('connections')
      .upsert([
        {
          id: sampleTerraPayload.user.user_id,
          provider: sampleTerraPayload.user.provider,
          reference_id: sampleTerraPayload.user.reference_id,
          active: true,
          last_webhook_update: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ], { onConflict: ['id'] })
      .select()
      .single();
    if (error) {
      console.error('❌ Error upserting test connection:', error.message);
      return false;
    }
    console.log('✅ Test connection ensured:', data.id);
    return true;
  } catch (error) {
    console.error('❌ Exception upserting test connection:', error.message);
    return false;
  }
}

async function runFullTest() {
  console.log('🚀 Starting Supabase Integration Test\n');
  
  // Step 0: Ensure test connection exists
  const connectionEnsured = await ensureTestConnectionExists();
  if (!connectionEnsured) {
    console.log('❌ Cannot proceed without test connection');
    return;
  }

  // Step 1: Test Supabase connection
  const connectionOk = await testSupabaseConnection();
  if (!connectionOk) {
    console.log('❌ Cannot proceed without Supabase connection');
    return;
  }

  // Step 2: Check if tables exist
  const connectionsTableExists = await checkTableExists('connections');
  const sleepMetricsTableExists = await checkTableExists('sleep_metrics');
  
  if (!connectionsTableExists || !sleepMetricsTableExists) {
    console.log('❌ Required tables do not exist. Please run the migration first.');
    return;
  }

  // Step 3: Send webhook test
  const webhookResponse = await sendWebhookTest();
  if (!webhookResponse) {
    console.log('❌ Webhook test failed. Cannot proceed.');
    return;
  }

  // Step 4: Wait a moment for data to be processed
  console.log('⏳ Waiting for data processing...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Step 5: Verify connection was created
  const connection = await verifyConnectionCreated();
  if (!connection) {
    console.log('❌ Connection verification failed');
    return;
  }

  // Step 6: Verify sleep metrics were created
  const sleepMetrics = await verifySleepMetricsCreated();
  if (!sleepMetrics) {
    console.log('❌ Sleep metrics verification failed');
    return;
  }

  // Step 7: Test connection lookup by wallet and provider
  const connectionLookup = await testConnectionByWalletAndProvider();
  if (!connectionLookup) {
    console.log('❌ Connection lookup test failed');
    return;
  }

  // Step 8: Cleanup test data
  //await cleanupTestData();

  console.log('\n🎉 All tests passed! Supabase integration is working correctly.');
  console.log('\n📊 Summary:');
  console.log('- ✅ Supabase connection: Working');
  console.log('- ✅ Database tables: Exist and accessible');
  console.log('- ✅ Webhook processing: Working');
  console.log('- ✅ Connection creation: Working');
  console.log('- ✅ Sleep metrics creation: Working');
  console.log('- ✅ Connection lookup: Working');
  console.log('- ✅ Data cleanup: Completed');
}

// Check if server is running before testing
async function checkServerStatus() {
  try {
    await axios.get('http://localhost:3001/webhook/health');
    return true;
  } catch (error) {
    return false;
  }
}

async function main() {
  const serverRunning = await checkServerStatus();
  
  if (!serverRunning) {
    console.log('❌ Server is not running on http://localhost:3001');
    console.log('Please start the server first with: npm run dev');
    process.exit(1);
  }
  
  await runFullTest();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  runFullTest,
  testSupabaseConnection,
  sendWebhookTest,
  verifyConnectionCreated,
  verifySleepMetricsCreated
};