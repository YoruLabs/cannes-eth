require('dotenv').config();
const fastify = require('fastify');
const webhookRoutes = require('./routes/webhook');
const whoopRoutes = require('./routes/whoop');
const challengeRoutes = require('./routes/challenges');
const logger = require('./config/logger');

// Create Fastify instance
const server = fastify({
  logger: false, // We're using Winston instead
  trustProxy: true,
});

// Register CORS plugin
server.register(require('@fastify/cors'), {
  origin: [
    'http://localhost:3000',
    'https://mantis-famous-personally.ngrok-free.app',
    /\.vercel\.app$/,
    /\.netlify\.app$/,
    /\.ngrok\.app$/,
    /\.ngrok-free\.app$/,
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
});

// Register JSON body parser
server.addContentTypeParser(
  'application/json',
  { parseAs: 'string' },
  function (req, body, done) {
    try {
      const json = JSON.parse(body);
      done(null, json);
    } catch (err) {
      err.statusCode = 400;
      done(err, undefined);
    }
  }
);

// Register webhook routes
server.register(webhookRoutes, { prefix: '/webhook' });

// Register historical data routes
server.register(require('./routes/historical'), { prefix: '/api' });

// Register Whoop routes
server.register(whoopRoutes, { prefix: '/api/whoop' });

// Register Challenge routes
server.register(challengeRoutes, { prefix: '/api/challenges' });

// Error handler
server.setErrorHandler(function (error, request, reply) {
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    url: request.url,
    method: request.method,
  });

  reply.status(500).send({
    success: false,
    error: 'Internal server error',
    message:
      process.env.NODE_ENV === 'development'
        ? error.message
        : 'Something went wrong',
  });
});

// Graceful shutdown
const gracefulShutdown = async signal => {
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
      environment: process.env.NODE_ENV || 'development',
    });

    logger.info('Available endpoints:', {
      webhook: 'POST /webhook/terra',
      health: 'GET /webhook/health',
      whoopAuth: 'POST /api/whoop/auth/token',
      whoopData: 'POST /api/whoop/authenticate-and-store',
      whoopProfile: 'POST /api/whoop/profile',
      whoopSleepData: 'POST /api/whoop/sleep-data',
      whoopUserData: 'GET /api/whoop/user-data/:walletAddress',
    });
  } catch (err) {
    logger.error('Error starting server', {
      error: err.message,
      stack: err.stack,
    });
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', error => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  process.exit(1);
});

start();
