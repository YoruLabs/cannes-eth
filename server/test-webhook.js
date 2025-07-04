const axios = require('axios');

// Sample Terra sleep data payload (based on the provided example)
const sampleTerraPayload = {
  "user": {
    "created_at": null,
    "provider": "OURA",
    "reference_id": "",
    "scopes": null,
    "user_id": "1fe69941-d312-45ac-904b-1331d17e4f37",
    "active": true,
    "last_webhook_update": null
  },
  "data": [
    {
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
            },
            {
              "hrv_rmssd": 50,
              "timestamp": "2025-07-04T21:15:20.000000+00:00"
            }
          ],
          "hr_samples": [
            {
              "context": 0,
              "timestamp": "2025-07-04T21:02:20.000000+00:00",
              "timer_duration_seconds": null,
              "bpm": 152
            },
            {
              "context": 0,
              "timestamp": "2025-07-04T21:15:20.000000+00:00",
              "timer_duration_seconds": null,
              "bpm": 121
            }
          ],
          "hrv_samples_sdnn": [
            {
              "hrv_sdnn": 44,
              "timestamp": "2025-07-04T21:02:20.000000+00:00"
            },
            {
              "hrv_sdnn": 89,
              "timestamp": "2025-07-04T21:15:20.000000+00:00"
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
        "summary_id": null,
        "is_nap": false,
        "end_time": "2025-07-05T04:32:20.000000+00:00",
        "upload_type": 0,
        "start_time": "2025-07-04T21:02:20.000000+00:00"
      },
      "scores": {
        "sleep": null
      },
      "respiration_data": {
        "snoring_data": {
          "total_snoring_duration_seconds": 331,
          "samples": [
            {
              "duration_seconds": 99,
              "timestamp": "2025-07-04T21:02:20.000000+00:00"
            },
            {
              "duration_seconds": 48,
              "timestamp": "2025-07-04T21:15:20.000000+00:00"
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
            },
            {
              "percentage": 99,
              "type": 0,
              "timestamp": "2025-07-04T21:15:20.000000+00:00"
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
            },
            {
              "breaths_per_min": 12,
              "timestamp": "2025-07-04T21:15:20.000000+00:00"
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
          },
          {
            "level": 4,
            "timestamp": "2025-07-04T21:15:20.000000+00:00"
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

async function testWebhook() {
  try {
    console.log('Testing Terra webhook endpoint...');
    
    const response = await axios.post('http://localhost:3001/webhook/terra', sampleTerraPayload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Webhook test successful!');
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Webhook test failed!');
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

async function testHealthCheck() {
  try {
    console.log('\nTesting health check endpoint...');
    
    const response = await axios.get('http://localhost:3001/health');
    
    console.log('✅ Health check successful!');
    console.log('Response:', response.data);

  } catch (error) {
    console.error('❌ Health check failed!');
    console.error('Error:', error.message);
  }
}

async function testUserMetrics() {
  try {
    console.log('\nTesting user metrics endpoint...');
    
    const userId = '1fe69941-d312-45ac-904b-1331d17e4f37';
    const response = await axios.get(`http://localhost:3001/users/${userId}/metrics?limit=5`);
    
    console.log('✅ User metrics test successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ User metrics test failed!');
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

async function testLeaderboard() {
  try {
    console.log('\nTesting leaderboard endpoint...');
    
    const response = await axios.get('http://localhost:3001/leaderboard?metric=sleep_efficiency&limit=5');
    
    console.log('✅ Leaderboard test successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Leaderboard test failed!');
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Terra Sleep Server Tests\n');
  
  await testHealthCheck();
  await testWebhook();
  await testUserMetrics();
  await testLeaderboard();
  
  console.log('\n✨ All tests completed!');
}

// Check if server is running before testing
async function checkServerStatus() {
  try {
    await axios.get('http://localhost:3001/health');
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
  
  await runAllTests();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testWebhook,
  testHealthCheck,
  testUserMetrics,
  testLeaderboard,
  sampleTerraPayload
}; 