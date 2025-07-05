const { TerraWebhookCombinedSchema } = require('../schemas/sleepData');
const SleepDataProcessor = require('../services/sleepDataProcessor');
const SupabaseService = require('../services/supabaseService');
const logger = require('../config/logger');

class WebhookHandler {
  constructor() {
    this.supabaseService = new SupabaseService();
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

      // Handle sleep data webhooks
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
            // Process the sleep data
            const processedMetrics = SleepDataProcessor.processSleepData(
              sleepData,
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
              sessionId: processedMetrics.session_id,
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
              sessionId: processedMetrics.session_id,
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

      // Handle unknown webhook types
      logger.warn('Received unknown webhook type', {
        type: validatedPayload.type,
      });
      return {
        success: true,
        message: 'Webhook received (unknown type)',
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
