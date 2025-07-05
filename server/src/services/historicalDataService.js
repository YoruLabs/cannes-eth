const axios = require('axios');
const logger = require('../config/logger');

class HistoricalDataService {
  constructor() {
    this.terraApiUrl = process.env.TERRA_API_URL || 'https://api.tryterra.co';
    this.apiKey = process.env.TERRA_API_KEY;
    this.devId = process.env.TERRA_DEV_ID;
    
    // Log configuration for debugging
    logger.info('HistoricalDataService initialized', {
      terraApiUrl: this.terraApiUrl,
      hasApiKey: !!this.apiKey,
      hasDevId: !!this.devId,
      apiKeyLength: this.apiKey ? this.apiKey.length : 0,
      devIdLength: this.devId ? this.devId.length : 0
    });
  }

  /**
   * Request historical data for a newly authenticated user
   * @param {string} userId - Terra user ID
   * @param {number} days - Number of days to look back (default: 28)
   * @returns {Object} Results from all endpoints
   */
  async requestHistoricalData(userId, days = 28) {
    try {
      logger.info('Requesting historical data for user', { userId, days });

      // Check if credentials are available
      if (!this.apiKey || !this.devId) {
        logger.error('Missing Terra API credentials', {
          hasApiKey: !!this.apiKey,
          hasDevId: !!this.devId
        });
        return {
          '/sleep': {
            success: false,
            error: 'Missing Terra API credentials (TERRA_API_KEY or TERRA_DEV_ID)'
          }
        };
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 1);

      const headers = {
        'x-api-key': this.apiKey,
        'dev-id': this.devId,
      };

      logger.info('Historical data request headers', {
        hasApiKey: !!this.apiKey,
        hasDevId: !!this.devId,
        apiKeyPrefix: this.apiKey ? this.apiKey.substring(0, 8) + '...' : 'missing',
        devId: this.devId || 'missing'
      });

      // Focus on sleep data for your use case
      const endpoints = ['/sleep'];
      const results = {};

      for (const endpoint of endpoints) {
        try {
          logger.info(
            `Requesting historical ${endpoint} data for user ${userId}`
          );

          const requestUrl = `${this.terraApiUrl}${endpoint}`;
          const requestParams = {
            user_id: userId,
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
            to_webhook: true, // Send to your webhook
            with_samples: true, // Include detailed data
          };

          logger.info('Making Terra API request', {
            url: requestUrl,
            params: requestParams,
            headers: {
              'x-api-key': this.apiKey ? this.apiKey.substring(0, 8) + '...' : 'missing',
              'dev-id': this.devId || 'missing'
            }
          });

          const response = await axios.get(requestUrl, {
            headers,
            params: requestParams,
          });

          results[endpoint] = {
            success: true,
            terraReference: response.headers['terra-reference'],
            data: response.data,
          };

          logger.info(`Successfully requested ${endpoint} data`, {
            userId,
            terraReference: response.headers['terra-reference'],
          });
        } catch (error) {
          logger.error(`Error requesting ${endpoint} data`, {
            userId,
            error: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            responseData: error.response?.data,
            requestUrl: `${this.terraApiUrl}${endpoint}`,
            requestHeaders: {
              'x-api-key': this.apiKey ? this.apiKey.substring(0, 8) + '...' : 'missing',
              'dev-id': this.devId || 'missing'
            }
          });
          results[endpoint] = {
            success: false,
            error: error.message,
            status: error.response?.status,
            details: error.response?.data
          };
        }
      }

      return results;
    } catch (error) {
      logger.error('Error in requestHistoricalData', {
        userId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Request historical data for a specific date range
   * @param {string} userId - Terra user ID
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Object} Results from sleep endpoint
   */
  async requestDateRangeData(userId, startDate, endDate) {
    try {
      logger.info('Requesting date range data for user', {
        userId,
        startDate,
        endDate,
      });

      const headers = {
        'x-api-key': this.apiKey,
        'dev-id': this.devId,
      };

      const response = await axios.get(`${this.terraApiUrl}/sleep`, {
        headers,
        params: {
          user_id: userId,
          start_date: startDate,
          end_date: endDate,
          to_webhook: true,
          with_samples: true,
        },
      });

      return {
        success: true,
        terraReference: response.headers['terra-reference'],
        data: response.data,
      };
    } catch (error) {
      logger.error('Error requesting date range data', {
        userId,
        error: error.message,
        status: error.response?.status,
      });
      throw error;
    }
  }

  /**
   * Handle large request processing events
   * @param {Object} event - Large request processing event
   * @returns {Object} Processing status
   */
  handleLargeRequestProcessing(event) {
    logger.info('Large request processing started', {
      terraReference: event.terra_reference,
      totalChunks: event.total_chunks,
    });

    return {
      success: true,
      message: 'Large request processing acknowledged',
      terraReference: event.terra_reference,
      totalChunks: event.total_chunks,
    };
  }

  /**
   * Handle large request sending events
   * @param {Object} event - Large request sending event
   * @returns {Object} Sending status
   */
  handleLargeRequestSending(event) {
    logger.info('Large request sending started', {
      terraReference: event.terra_reference,
      totalChunks: event.total_chunks,
    });

    return {
      success: true,
      message: 'Large request sending acknowledged',
      terraReference: event.terra_reference,
      totalChunks: event.total_chunks,
    };
  }
}

module.exports = HistoricalDataService;
