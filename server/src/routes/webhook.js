const logger = require('../config/logger');
const WebhookHandler = require('../handlers/webhookHandler');

async function webhookRoutes(fastify, _options) {
  const webhookHandler = new WebhookHandler();

  // Health check endpoint
  fastify.get('/health', async (_request, _reply) => {
    return {
      status: 'healthy',
      service: 'terra-sleep-server',
      timestamp: new Date().toISOString(),
    };
  });

  // Terra webhook endpoint - receives data from Terra dashboard
  fastify.post('/terra', async (request, reply) => {
    try {
      const result = await webhookHandler.handleTerraWebhook(request.body);
      return result;
    } catch (error) {
      logger.error('Error handling Terra webhook', { error: error.message });
      return reply.code(500).send({
        success: false,
        error: 'Internal server error',
      });
    }
  });
}

module.exports = webhookRoutes;
