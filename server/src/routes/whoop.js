const logger = require('../config/logger');
const WhoopService = require('../services/whoopService');
const SupabaseService = require('../services/supabaseService');
const SleepDataProcessor = require('../services/sleepDataProcessor');
const axios = require('axios');

async function whoopRoutes(fastify, _options) {
  const whoopService = new WhoopService();
  const supabaseService = new SupabaseService();
  const sleepDataProcessor = new SleepDataProcessor();

  // Whoop OAuth token exchange endpoint
  fastify.post('/auth/token', async (request, reply) => {
    try {
      const { code, redirectUri } = request.body;

      if (!code || !redirectUri) {
        return reply.code(400).send({
          success: false,
          error: 'Missing code or redirectUri',
        });
      }

      const clientId = process.env.WHOOP_CLIENT_ID;
      const clientSecret = process.env.WHOOP_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        logger.error('Missing Whoop client credentials');
        return reply.code(500).send({
          success: false,
          error: 'Missing WHOOP client credentials',
        });
      }

      logger.info('Exchanging Whoop OAuth code for token', {
        codeLength: code.length,
        redirectUri,
      });

      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      });

      const response = await axios.post(
        'https://api.prod.whoop.com/oauth/oauth2/token',
        body.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      logger.info('Successfully exchanged Whoop OAuth code for token');

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      logger.error('Error exchanging Whoop OAuth code', {
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });

      return reply.code(error.response?.status || 500).send({
        success: false,
        error: 'Failed to exchange OAuth code',
        details: error.response?.data || error.message,
      });
    }
  });

  // Whoop user profile endpoint
  fastify.post('/profile', async (request, reply) => {
    try {
      const { accessToken } = request.body;

      if (!accessToken) {
        return reply.code(400).send({
          success: false,
          error: 'Missing access token',
        });
      }

      logger.info('Fetching Whoop user profile');

      const profile = await whoopService.getUserProfile(accessToken);

      return {
        success: true,
        data: profile,
      };
    } catch (error) {
      logger.error('Error fetching Whoop user profile', {
        error: error.message,
      });

      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch user profile',
        details: error.message,
      });
    }
  });

  // Whoop comprehensive data endpoint (profile + sleep + recovery + cycles)
  fastify.post('/data', async (request, reply) => {
    try {
      const { accessToken, limit = 25 } = request.body;

      if (!accessToken) {
        return reply.code(400).send({
          success: false,
          error: 'Missing access token',
        });
      }

      logger.info('Fetching comprehensive Whoop data', { limit });

      const comprehensiveData = await whoopService.getComprehensiveUserData(
        accessToken,
        limit
      );

      return {
        success: true,
        data: comprehensiveData,
        fetched_at: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error fetching comprehensive Whoop data', {
        error: error.message,
      });

      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch comprehensive data',
        details: error.message,
      });
    }
  });

  // Whoop authenticate and store data endpoint
  fastify.post('/authenticate-and-store', async (request, reply) => {
    try {
      const { accessToken, walletAddress, limit = 25 } = request.body;

      if (!accessToken || !walletAddress) {
        return reply.code(400).send({
          success: false,
          error: 'Missing access token or wallet address',
        });
      }

      logger.info('Starting Whoop authentication and data storage', {
        walletAddress,
        limit,
      });

      // Step 1: Get user profile to get user ID
      const profile = await whoopService.getUserProfile(accessToken);
      const userId = profile.user_id.toString();

      logger.info('Fetched Whoop user profile', {
        userId,
        email: profile.email,
        firstName: profile.first_name,
        lastName: profile.last_name,
      });

      // Step 2: Create/update connection record
      const connectionData = {
        user_id: userId,
        provider: 'WHOOP',
        reference_id: walletAddress,
        active: true,
        created_at: new Date().toISOString(),
      };

      await supabaseService.upsertConnection(connectionData);

      logger.info('Successfully created/updated Whoop connection', {
        userId,
        walletAddress,
      });

      // Step 3: Fetch and store sleep data
      const sleepData = await whoopService.getSleepData(accessToken, limit);
      const processedSleepData = whoopService.processSleepDataForStorage(
        sleepData,
        userId
      );

      logger.info('Processed Whoop sleep data', {
        userId,
        recordsCount: processedSleepData.length,
      });

      // Step 4: Store sleep data in database
      const storedRecords = [];
      for (const sleepRecord of processedSleepData) {
        try {
          // Process sleep data through the same pipeline as Terra
          const processedMetrics = SleepDataProcessor.processSleepData(sleepRecord);
          const challengeMetrics = SleepDataProcessor.calculateChallengeMetrics(processedMetrics);

          // Combine processed data with challenge metrics
          const finalMetrics = {
            ...processedMetrics,
            sleep_quality_score: challengeMetrics.sleepQualityScore,
            recovery_score: challengeMetrics.recoveryScore,
            efficiency_score: challengeMetrics.efficiencyScore,
            health_score: challengeMetrics.healthScore,
          };

          // Store in database
          const storedData = await supabaseService.storeSleepMetrics(finalMetrics);
          storedRecords.push({
            success: true,
            storedId: storedData.id,
            startTime: sleepRecord.start_time,
            metrics: {
              sleepEfficiency: finalMetrics.sleep_efficiency,
              sleepQualityScore: challengeMetrics.sleepQualityScore,
              recoveryScore: challengeMetrics.recoveryScore,
              totalSleepDuration: finalMetrics.total_sleep_duration_seconds,
            },
          });

          logger.info('Successfully stored Whoop sleep record', {
            userId,
            recordId: storedData.id,
            startTime: sleepRecord.start_time,
            sleepEfficiency: finalMetrics.sleep_efficiency,
            sleepQualityScore: challengeMetrics.sleepQualityScore,
          });
        } catch (error) {
          logger.error('Error storing individual Whoop sleep record', {
            userId,
            startTime: sleepRecord.start_time,
            error: error.message,
          });

          storedRecords.push({
            success: false,
            startTime: sleepRecord.start_time,
            error: error.message,
          });
        }
      }

      // Step 5: Fetch and store recovery data for additional metrics
      try {
        const recoveryData = await whoopService.getRecovery(accessToken, limit);
        logger.info('Fetched Whoop recovery data', {
          userId,
          recoveryRecords: recoveryData.records?.length || 0,
        });
      } catch (error) {
        logger.warn('Could not fetch Whoop recovery data', {
          userId,
          error: error.message,
        });
      }

      const successfulRecords = storedRecords.filter(record => record.success);
      const failedRecords = storedRecords.filter(record => !record.success);

      logger.info('Completed Whoop authentication and data storage', {
        userId,
        walletAddress,
        totalRecords: storedRecords.length,
        successfulRecords: successfulRecords.length,
        failedRecords: failedRecords.length,
      });

      return {
        success: true,
        message: 'Whoop authentication and data storage completed',
        data: {
          userId,
          walletAddress,
          profile: {
            email: profile.email,
            firstName: profile.first_name,
            lastName: profile.last_name,
          },
          sleepData: {
            totalRecords: storedRecords.length,
            successfulRecords: successfulRecords.length,
            failedRecords: failedRecords.length,
            records: storedRecords,
          },
        },
      };
    } catch (error) {
      logger.error('Error in Whoop authenticate and store', {
        error: error.message,
        stack: error.stack,
      });

      return reply.code(500).send({
        success: false,
        error: 'Failed to authenticate and store Whoop data',
        details: error.message,
      });
    }
  });

  // Whoop sleep data only endpoint (for stats page)
  fastify.post('/sleep-data', async (request, reply) => {
    try {
      const { accessToken, limit = 25 } = request.body;

      if (!accessToken) {
        return reply.code(400).send({
          success: false,
          error: 'Missing access token',
        });
      }

      logger.info('Fetching Whoop sleep data only', { limit });

      const sleepData = await whoopService.getSleepData(accessToken, limit);

      return {
        success: true,
        data: sleepData,
        fetched_at: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error fetching Whoop sleep data', {
        error: error.message,
      });

      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch sleep data',
        details: error.message,
      });
    }
  });

  // Whoop user data by wallet address (for stats page)
  fastify.get('/user-data/:walletAddress', async (request, reply) => {
    try {
      const { walletAddress } = request.params;

      if (!walletAddress) {
        return reply.code(400).send({
          success: false,
          error: 'Missing wallet address',
        });
      }

      logger.info('Fetching Whoop user data by wallet address', {
        walletAddress,
      });

      // Get connection record
      const connections = await supabaseService.getConnectionsByWalletAddress(
        walletAddress
      );
      const whoopConnection = connections.find(
        conn => conn.provider === 'WHOOP' && conn.active
      );

      if (!whoopConnection) {
        return reply.code(404).send({
          success: false,
          error: 'No active Whoop connection found for this wallet address',
        });
      }

      // Get sleep metrics for this user
      const sleepMetrics = await supabaseService.getSleepMetricsByUserId(
        whoopConnection.id
      );

      return {
        success: true,
        data: {
          connection: whoopConnection,
          sleepMetrics,
        },
      };
    } catch (error) {
      logger.error('Error fetching Whoop user data by wallet address', {
        walletAddress: request.params.walletAddress,
        error: error.message,
      });

      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch user data',
        details: error.message,
      });
    }
  });
}

module.exports = whoopRoutes; 