const { Terra } = require('terra-api');
const logger = require('../config/logger');

class TerraService {
  constructor() {
    this.terra = new Terra(
      process.env.TERRA_API_KEY,
      process.env.TERRA_DEV_ID
    );
  }

  /**
   * Verify webhook signature
   * @param {string} signature - Webhook signature
   * @param {string} body - Request body
   * @returns {boolean} Whether signature is valid
   */
  verifyWebhookSignature(signature, body) {
    try {
      // Terra webhook verification logic
      // This is a simplified version - implement according to Terra's documentation
      const expectedSignature = this.generateSignature(body);
      return signature === expectedSignature;
    } catch (error) {
      logger.error('Error verifying webhook signature', { error });
      return false;
    }
  }

  /**
   * Generate signature for webhook verification
   * @param {string} body - Request body
   * @returns {string} Generated signature
   */
  generateSignature(body) {
    const crypto = require('crypto');
    const secret = process.env.TERRA_WEBHOOK_SECRET;
    
    if (!secret) {
      logger.warn('TERRA_WEBHOOK_SECRET not configured');
      return '';
    }

    return crypto
      .createHmac('sha256', secret)
      .update(body, 'utf8')
      .digest('hex');
  }

  /**
   * Get user data from Terra
   * @param {string} userId - Terra user ID
   * @returns {Object} User data
   */
  async getUserData(userId) {
    try {
      logger.info('Fetching user data from Terra', { userId });

      const response = await this.terra.getUser(userId);
      
      logger.info('Successfully fetched user data', { userId });
      return response;
    } catch (error) {
      logger.error('Error fetching user data from Terra', { 
        userId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Get sleep data for a user
   * @param {string} userId - Terra user ID
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Object} Sleep data
   */
  async getSleepData(userId, startDate, endDate) {
    try {
      logger.info('Fetching sleep data from Terra', { 
        userId, 
        startDate, 
        endDate 
      });

      const response = await this.terra.getSleep({
        user_id: userId,
        start_date: startDate,
        end_date: endDate
      });

      logger.info('Successfully fetched sleep data', { 
        userId, 
        dataCount: response.data?.length || 0 
      });

      return response;
    } catch (error) {
      logger.error('Error fetching sleep data from Terra', { 
        userId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Get user's available data types
   * @param {string} userId - Terra user ID
   * @returns {Array} Available data types
   */
  async getAvailableDataTypes(userId) {
    try {
      logger.info('Fetching available data types from Terra', { userId });

      const response = await this.terra.getAvailableDataTypes(userId);
      
      logger.info('Successfully fetched available data types', { 
        userId, 
        types: response 
      });

      return response;
    } catch (error) {
      logger.error('Error fetching available data types from Terra', { 
        userId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Deauthorize a user
   * @param {string} userId - Terra user ID
   * @returns {Object} Deauthorization result
   */
  async deauthorizeUser(userId) {
    try {
      logger.info('Deauthorizing user from Terra', { userId });

      const response = await this.terra.deauthorizeUser(userId);
      
      logger.info('Successfully deauthorized user', { userId });
      return response;
    } catch (error) {
      logger.error('Error deauthorizing user from Terra', { 
        userId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Get webhook status
   * @param {string} userId - Terra user ID
   * @returns {Object} Webhook status
   */
  async getWebhookStatus(userId) {
    try {
      logger.info('Fetching webhook status from Terra', { userId });

      const response = await this.terra.getWebhookStatus(userId);
      
      logger.info('Successfully fetched webhook status', { userId });
      return response;
    } catch (error) {
      logger.error('Error fetching webhook status from Terra', { 
        userId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Generate authentication URL for user
   * @param {string} referenceId - Reference ID for the user
   * @param {Array} resources - Resources to request access to
   * @param {string} redirectUrl - Redirect URL after authentication
   * @returns {string} Authentication URL
   */
  generateAuthUrl(referenceId, resources = ['sleep'], redirectUrl = null) {
    try {
      logger.info('Generating Terra auth URL', { referenceId, resources });

      const authUrl = this.terra.generateAuthUrl({
        reference_id: referenceId,
        resources: resources,
        redirect_url: redirectUrl
      });

      logger.info('Successfully generated auth URL', { referenceId });
      return authUrl;
    } catch (error) {
      logger.error('Error generating Terra auth URL', { 
        referenceId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Exchange auth code for user token
   * @param {string} authCode - Authorization code
   * @returns {Object} User token data
   */
  async exchangeAuthCode(authCode) {
    try {
      logger.info('Exchanging auth code for user token');

      const response = await this.terra.exchangeAuthCode(authCode);
      
      logger.info('Successfully exchanged auth code for token');
      return response;
    } catch (error) {
      logger.error('Error exchanging auth code for token', { 
        error: error.message 
      });
      throw error;
    }
  }
}

module.exports = TerraService; 