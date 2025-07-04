const axios = require('axios');

// Sample Terra healthcheck payload (based on the error log)
const sampleHealthcheckPayload = {
  "creation_timestamp": "2025-07-04 21:37:36.638145+00:00",
  "sent_webhooks_last_hour": 0,
  "status": "normal",
  "trend_percentage": 0,
  "type": "healthcheck",
  "version": "2022-03-16"
};

async function testHealthcheckWebhook() {
  try {
    console.log('Testing Terra healthcheck webhook...');
    console.log('Payload:', JSON.stringify(sampleHealthcheckPayload, null, 2));
    
    const response = await axios.post('http://localhost:3001/webhook/terra', sampleHealthcheckPayload, {
      headers: {
        'Content-Type': 'application/json',
        'dev-id': 'nu3-testing-yvWUmUCOy3',
        'hook-type': 'WEBHOOK',
        'terra-reference': '7243c4e7-933a-406f-8db0-4ad5500add81',
        'terra-signature': 't=1751665056,v1=c33410e156655b13252913bb8bf3566b46904299576d890c1d0f1772be918737'
      }
    });

    console.log('✅ Healthcheck webhook test successful!');
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Healthcheck webhook test failed!');
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

async function testSleepWebhook() {
  try {
    console.log('\nTesting Terra sleep webhook...');
    
    // Import the sample sleep payload from the other test file
    const { sampleTerraPayload } = require('./test-webhook');
    
    const response = await axios.post('http://localhost:3001/webhook/terra', sampleTerraPayload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Sleep webhook test successful!');
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Sleep webhook test failed!');
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

async function main() {
  console.log('🚀 Testing Terra Webhook Types\n');
  
  await testHealthcheckWebhook();
  await testSleepWebhook();
  
  console.log('\n✨ All webhook type tests completed!');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testHealthcheckWebhook,
  sampleHealthcheckPayload
}; 