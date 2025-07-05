const {
  TerraWebhookCombinedSchema,
  TerraSleepDataSchema,
} = require('../schemas/sleepData');
const SleepDataProcessor = require('../services/sleepDataProcessor');
const SupabaseService = require('../services/supabaseService');
const HistoricalDataService = require('../services/historicalDataService');
const logger = require('../config/logger');

class WebhookHandler {
  constructor() {
    this.supabaseService = new SupabaseService();
    this.historicalDataService = new HistoricalDataService();
    this.pendingHistoricalRequests = new Set(); // Track pending requests to prevent duplicates
  }

  /**
   * Handle Terra webhook for sleep data
   */
  async handleTerraWebhook(webhookPayload) {
    try {
      logger.info('Received Terra webhook', {
        bodySize: JSON.stringify(webhookPayload).length,
      });

      // Validate webhook payload with combined schema
      const validatedPayload = TerraWebhookCombinedSchema.parse(webhookPayload);

      // Handle healthcheck webhooks
      if (validatedPayload.type === 'healthcheck') {
        logger.info('Received Terra healthcheck webhook', {
          status: validatedPayload.status,
          version: validatedPayload.version,
        });

        return {
          success: true,
          message: 'Healthcheck received successfully',
          type: 'healthcheck',
          status: validatedPayload.status,
          timestamp: validatedPayload.creation_timestamp,
        };
      }

      // Handle authentication success webhooks
      if (
        validatedPayload.type === 'auth' &&
        validatedPayload.status === 'success'
      ) {
        logger.info('Received Terra authentication success webhook', {
          userId: validatedPayload.user?.user_id,
          status: validatedPayload.status,
        });

        // Create/update connection record
        await this.supabaseService.upsertConnection(validatedPayload.user);

        // Historical data will be sent via webhooks automatically
        // Terra will send historical data through large_request_processing/sending webhooks
        logger.info('Authentication successful - historical data will arrive via webhooks', {
          userId: validatedPayload.user?.user_id,
        });

        return {
          success: true,
          message: 'Authentication successful (historical data via webhooks)',
          type: 'auth',
          status: validatedPayload.status,
          historicalDataRequested: false,
          historicalDataViaWebhooks: true,
        };
      }

      // Handle user reauthentication webhooks
      if (validatedPayload.type === 'user_reauth') {
        logger.info('Received Terra user reauthentication webhook', {
          newUserId: validatedPayload.new_user?.user_id,
          oldUserId: validatedPayload.old_user?.user_id,
          status: validatedPayload.status,
        });

        // Update connection record with new user
        await this.supabaseService.upsertConnection(validatedPayload.new_user);

        // Historical data will be sent via webhooks automatically
        // Terra will send historical data through large_request_processing/sending webhooks
        logger.info('User reauthentication successful - historical data will arrive via webhooks', {
          newUserId: validatedPayload.new_user?.user_id,
        });

        return {
          success: true,
          message: 'User reauthentication processed (historical data via webhooks)',
          type: 'user_reauth',
          status: validatedPayload.status,
          newUserId: validatedPayload.new_user?.user_id,
          oldUserId: validatedPayload.old_user?.user_id,
          historicalDataRequested: false,
          historicalDataViaWebhooks: true,
        };
      }

      // Handle sleep data webhooks (ignore other data types)
      if (validatedPayload.type === 'sleep') {
        logger.info('Webhook payload validated for sleep data', {
          userId: validatedPayload.user.user_id,
          dataType: validatedPayload.type,
          dataCount: validatedPayload.data.length,
        });

        // Process each sleep data entry
        const results = [];
        for (const sleepData of validatedPayload.data) {
          try {
            // Validate that this is actually sleep data
            const validatedSleepData = TerraSleepDataSchema.parse(sleepData);

            // Process the sleep data
            const processedMetrics = SleepDataProcessor.processSleepData(
              validatedSleepData,
              validatedPayload.user.user_id
            );

            // Calculate challenge metrics
            const challengeMetrics =
              SleepDataProcessor.calculateChallengeMetrics(processedMetrics);

            // Combine processed metrics with challenge metrics
            const finalMetrics = {
              ...processedMetrics,
              sleep_quality_score: challengeMetrics.sleepQualityScore,
              recovery_score: challengeMetrics.recoveryScore,
              efficiency_score: challengeMetrics.efficiencyScore,
              health_score: challengeMetrics.healthScore,
            };

            // Store in Supabase
            const storedData =
              await this.supabaseService.storeSleepMetrics(finalMetrics);

            // Update connection record
            await this.supabaseService.upsertConnection(validatedPayload.user);

            results.push({
              success: true,
              storedId: storedData.id,
              metrics: {
                sleepEfficiency: processedMetrics.sleep_efficiency,
                sleepQualityScore: challengeMetrics.sleepQualityScore,
                recoveryScore: challengeMetrics.recoveryScore,
                totalSleepDuration:
                  processedMetrics.total_sleep_duration_seconds,
              },
            });

            logger.info('Successfully processed sleep session', {
              userId: validatedPayload.user.user_id,
              sleepEfficiency: processedMetrics.sleep_efficiency,
              sleepQualityScore: challengeMetrics.sleepQualityScore,
            });
          } catch (error) {
            logger.error('Error processing individual sleep data', {
              userId: validatedPayload.user.user_id,
              error: error.message,
              stack: error.stack,
            });

            results.push({
              success: false,
              error: error.message,
            });
          }
        }

        // Return success response for sleep data
        return {
          success: true,
          message: 'Sleep data processed successfully',
          processed: results.length,
          results,
        };
      }

      // Handle large request processing events (historical data)
      if (validatedPayload.type === 'large_request_processing') {
        logger.info('Received Terra large request processing webhook', {
          userId: validatedPayload.user?.user_id,
          status: validatedPayload.status,
          terraReference: validatedPayload.terra_reference,
        });

        return {
          success: true,
          message: 'Historical data processing started',
          type: 'large_request_processing',
          status: validatedPayload.status,
          terraReference: validatedPayload.terra_reference,
        };
      }

      // Handle large request sending events (historical data)
      if (validatedPayload.type === 'large_request_sending') {
        logger.info('Received Terra large request sending webhook', {
          userId: validatedPayload.user?.user_id,
          status: validatedPayload.status,
          terraReference: validatedPayload.terra_reference,
        });

        return {
          success: true,
          message: 'Historical data sending started',
          type: 'large_request_sending',
          status: validatedPayload.status,
          terraReference: validatedPayload.terra_reference,
        };
      }

      // Handle non-sleep webhook types (daily, activity, body)
      logger.info('Received non-sleep webhook type', {
        type: validatedPayload.type,
        userId: validatedPayload.user?.user_id,
      });
      return {
        success: true,
        message: `Webhook received (${validatedPayload.type} data - not processed)`,
        type: validatedPayload.type,
      };
    } catch (error) {
      logger.error('Error handling Terra webhook', {
        error: error.message,
        stack: error.stack,
        body: webhookPayload,
      });

      throw new Error(`Invalid webhook payload: ${error.message}`);
    }
  }
}

module.exports = WebhookHandler;
