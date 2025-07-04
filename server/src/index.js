require('dotenv').config();
const fastify = require('fastify');
const WebhookHandler = require('./routes/webhook');
const logger = require('./config/logger');

// Create Fastify instance
const server = fastify({
  logger: false, // We're using Winston instead
  trustProxy: true
});

// Register JSON body parser
server.addContentTypeParser('application/json', { parseAs: 'string' }, function (req, body, done) {
  try {
    const json = JSON.parse(body);
    done(null, json);
  } catch (err) {
    err.statusCode = 400;
    done(err, undefined);
  }
});

// Initialize webhook handler
const webhookHandler = new WebhookHandler();

// Register routes
server.register(async function (fastify, opts) {
  // Terra webhook endpoint
  fastify.post('/webhook/terra', async (request, reply) => {
    return await webhookHandler.handleTerraWebhook(request, reply);
  });

  // Health check endpoint
  fastify.get('/health', async (request, reply) => {
    return await webhookHandler.healthCheck(request, reply);
  });

  // User metrics endpoint
  fastify.get('/users/:userId/metrics', async (request, reply) => {
    return await webhookHandler.getUserMetrics(request, reply);
  });



  // Leaderboard endpoint
  fastify.get('/leaderboard', async (request, reply) => {
    return await webhookHandler.getLeaderboard(request, reply);
  });
});

// Error handler
server.setErrorHandler(function (error, request, reply) {
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    url: request.url,
    method: request.method
  });

  reply.status(500).send({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}, starting graceful shutdown`);
  
  try {
    await server.close();
    logger.info('Server closed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown', { error });
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const start = async () => {
  try {
    const port = process.env.PORT || 3001;
    const host = process.env.HOST || '0.0.0.0';

    await server.listen({ port, host });
    
    logger.info(`Terra Sleep Server started successfully`, {
      port,
      host,
      environment: process.env.NODE_ENV || 'development'
    });

    logger.info('Available endpoints:', {
      webhook: 'POST /webhook/terra',
      health: 'GET /health',
      userMetrics: 'GET /users/:userId/metrics',
      leaderboard: 'GET /leaderboard'
    });

  } catch (err) {
    logger.error('Error starting server', { error: err.message, stack: err.stack });
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  process.exit(1);
});

start(); 