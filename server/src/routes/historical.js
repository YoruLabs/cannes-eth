const HistoricalDataService = require('../services/historicalDataService');
const logger = require('../config/logger');

async function historicalRoutes(fastify, _options) {
  const historicalDataService = new HistoricalDataService();

  // Manual sync endpoint for historical data
  fastify.post('/api/sync-historical/:userId', async (request, reply) => {
    const { userId } = request.params;
    const { days = 28 } = request.query;

    try {
      logger.info('Manual historical data sync requested', { userId, days });

      const result = await historicalDataService.requestHistoricalData(
        userId,
        days
      );

      return {
        success: true,
        message: 'Historical data sync initiated',
        userId,
        days,
        results: result,
      };
    } catch (error) {
      logger.error('Error in manual historical data sync', {
        userId,
        error: error.message,
        stack: error.stack,
      });

      reply.code(500);
      return {
        success: false,
        error: error.message,
        userId,
      };
    }
  });

  // Sync specific date range
  fastify.post('/api/sync-date-range/:userId', async (request, reply) => {
    const { userId } = request.params;
    const { startDate, endDate } = request.body;

    if (!startDate || !endDate) {
      reply.code(400);
      return {
        success: false,
        error: 'startDate and endDate are required',
      };
    }

    try {
      logger.info('Date range sync requested', { userId, startDate, endDate });

      const result = await historicalDataService.requestDateRangeData(
        userId,
        startDate,
        endDate
      );

      return {
        success: true,
        message: 'Date range sync initiated',
        userId,
        startDate,
        endDate,
        result,
      };
    } catch (error) {
      logger.error('Error in date range sync', {
        userId,
        error: error.message,
        stack: error.stack,
      });

      reply.code(500);
      return {
        success: false,
        error: error.message,
        userId,
      };
    }
  });
}

module.exports = historicalRoutes;
