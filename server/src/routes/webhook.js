const { TerraWebhookCombinedSchema, TerraWebhookSchema } = require('../schemas/sleepData');
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
  async handleTerraWebhook(request, reply) {
    try {
      logger.info('Received Terra webhook', { 
        headers: request.headers,
        bodySize: JSON.stringify(request.body).length 
      });

      // Validate webhook payload with combined schema
      const validatedPayload = TerraWebhookCombinedSchema.parse(request.body);
      
      // Handle healthcheck webhooks
      if (validatedPayload.type === 'healthcheck') {
        logger.info('Received Terra healthcheck webhook', { 
          status: validatedPayload.status,
          version: validatedPayload.version 
        });

        return reply.code(200).send({
          success: true,
          message: 'Healthcheck received successfully',
          type: 'healthcheck',
          status: validatedPayload.status,
          timestamp: validatedPayload.creation_timestamp
        });
      }

      // Handle sleep data webhooks
      if (validatedPayload.type === 'sleep') {
        logger.info('Webhook payload validated for sleep data', { 
          userId: validatedPayload.user.user_id,
          dataType: validatedPayload.type,
          dataCount: validatedPayload.data.length 
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
            const challengeMetrics = SleepDataProcessor.calculateChallengeMetrics(processedMetrics);
            
            // Combine processed metrics with challenge metrics
            const finalMetrics = {
              ...processedMetrics,
              sleep_quality_score: challengeMetrics.sleepQualityScore,
              recovery_score: challengeMetrics.recoveryScore,
              efficiency_score: challengeMetrics.efficiencyScore,
              health_score: challengeMetrics.healthScore
            };

            // Store in Supabase
            const storedData = await this.supabaseService.storeSleepMetrics(finalMetrics);
            
            // Update user record
            await this.supabaseService.upsertUser(validatedPayload.user);

            results.push({
              sessionId: processedMetrics.session_id,
              success: true,
              storedId: storedData.id,
              metrics: {
                sleepEfficiency: processedMetrics.sleep_efficiency,
                sleepQualityScore: challengeMetrics.sleepQualityScore,
                recoveryScore: challengeMetrics.recoveryScore,
                totalSleepDuration: processedMetrics.total_sleep_duration_seconds
              }
            });

            logger.info('Successfully processed sleep session', {
              userId: validatedPayload.user.user_id,
              sessionId: processedMetrics.session_id,
              sleepEfficiency: processedMetrics.sleep_efficiency,
              sleepQualityScore: challengeMetrics.sleepQualityScore
            });

          } catch (error) {
            logger.error('Error processing individual sleep data', {
              userId: validatedPayload.user.user_id,
              error: error.message,
              stack: error.stack
            });

            results.push({
              success: false,
              error: error.message
            });
          }
        }

        // Return success response for sleep data
        return reply.code(200).send({
          success: true,
          message: 'Sleep data processed successfully',
          processed: results.length,
          results
        });
      }

      // Handle unknown webhook types
      logger.warn('Received unknown webhook type', { type: validatedPayload.type });
      return reply.code(200).send({
        success: true,
        message: 'Webhook received (unknown type)',
        type: validatedPayload.type
      });

    } catch (error) {
      logger.error('Error handling Terra webhook', {
        error: error.message,
        stack: error.stack,
        body: request.body
      });

      return reply.code(400).send({
        success: false,
        error: 'Invalid webhook payload',
        details: error.message
      });
    }
  }

  /**
   * Health check endpoint
   */
  async healthCheck(request, reply) {
    return reply.code(200).send({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'terra-sleep-server'
    });
  }

  /**
   * Get user sleep metrics endpoint
   */
  async getUserMetrics(request, reply) {
    try {
      const { userId } = request.params;
      const { limit = 10 } = request.query;

      logger.info('Fetching user metrics', { userId, limit });

      const metrics = await this.supabaseService.getUserSleepMetrics(userId, parseInt(limit));

      return reply.code(200).send({
        success: true,
        data: metrics,
        count: metrics.length
      });

    } catch (error) {
      logger.error('Error fetching user metrics', {
        error: error.message,
        stack: error.stack
      });

      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch user metrics',
        details: error.message
      });
    }
  }

  /**
   * Get sleep leaderboard endpoint
   */
  async getLeaderboard(request, reply) {
    try {
      const { metric = 'sleep_efficiency', limit = 10 } = request.query;

      logger.info('Fetching sleep leaderboard', { metric, limit });

      const leaderboard = await this.supabaseService.getSleepLeaderboard(metric, parseInt(limit));

      return reply.code(200).send({
        success: true,
        data: leaderboard,
        metric,
        count: leaderboard.length
      });

    } catch (error) {
      logger.error('Error fetching leaderboard', {
        error: error.message,
        stack: error.stack
      });

      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch leaderboard',
        details: error.message
      });
    }
  }
}

module.exports = WebhookHandler; 