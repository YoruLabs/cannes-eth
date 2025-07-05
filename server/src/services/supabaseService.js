const { createClient } = require('@supabase/supabase-js');
const logger = require('../config/logger');

class SupabaseService {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  /**
   * Store processed sleep metrics in Supabase
   * @param {Object} sleepMetrics - Processed sleep metrics
   * @returns {Object} Stored data
   */
  async storeSleepMetrics(sleepMetrics) {
    try {
      logger.info('Storing sleep metrics in Supabase', {
        userId: sleepMetrics.user_id,
        startTime: sleepMetrics.start_time,
      });

      // Log the exact payload for debugging
      logger.info('Sleep metrics payload:', {
        payload: JSON.stringify(sleepMetrics, null, 2),
        payloadKeys: Object.keys(sleepMetrics),
        payloadTypes: Object.fromEntries(
          Object.entries(sleepMetrics).map(([key, value]) => [
            key,
            typeof value,
          ])
        ),
      });

      const { data, error } = await this.supabase
        .from('sleep_metrics')
        .upsert([sleepMetrics], { onConflict: ['user_id', 'start_time'] })
        .select()
        .single();

      if (error) {
        logger.error('Error storing sleep metrics', { error });
        throw new Error(`Failed to store sleep metrics: ${error.message}`);
      }

      logger.info('Successfully stored sleep metrics', {
        id: data.id,
        userId: data.user_id,
      });

      return data;
    } catch (error) {
      logger.error('Error in storeSleepMetrics', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get sleep metrics for a user
   * @param {string} userId - User ID
   * @param {number} limit - Number of records to return
   * @returns {Array} Sleep metrics
   */
  async getUserSleepMetrics(userId, limit = 10) {
    try {
      logger.info('Fetching sleep metrics for user', { userId, limit });

      const { data, error } = await this.supabase
        .from('sleep_metrics')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Error fetching user sleep metrics', { error });
        throw new Error(`Failed to fetch sleep metrics: ${error.message}`);
      }

      logger.info('Successfully fetched sleep metrics', {
        userId,
        count: data.length,
      });

      return data;
    } catch (error) {
      logger.error('Error in getUserSleepMetrics', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get sleep metrics for challenge comparison
   * @param {string} challengeId - Challenge ID
   * @param {Array} userIds - Array of user IDs participating in challenge
   * @returns {Array} Sleep metrics for all participants
   */
  async getChallengeSleepMetrics(challengeId, userIds) {
    try {
      logger.info('Fetching challenge sleep metrics', { challengeId, userIds });

      const { data, error } = await this.supabase
        .from('sleep_metrics')
        .select('*')
        .in('user_id', userIds)
        .gte(
          'created_at',
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        ) // Last 7 days
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching challenge sleep metrics', { error });
        throw new Error(`Failed to fetch challenge metrics: ${error.message}`);
      }

      logger.info('Successfully fetched challenge sleep metrics', {
        challengeId,
        count: data.length,
      });

      return data;
    } catch (error) {
      logger.error('Error in getChallengeSleepMetrics', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get leaderboard data for sleep challenges
   * @param {string} metric - Metric to rank by (e.g., 'sleep_efficiency', 'sleep_quality_score')
   * @param {number} limit - Number of top performers to return
   * @returns {Array} Leaderboard data
   */
  async getSleepLeaderboard(metric = 'sleep_efficiency', limit = 10) {
    try {
      logger.info('Fetching sleep leaderboard', { metric, limit });

      const { data, error } = await this.supabase
        .from('sleep_metrics')
        .select('user_id, start_time, sleep_efficiency, created_at')
        .gte(
          'created_at',
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        ) // Last 30 days
        .order(metric, { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Error fetching sleep leaderboard', { error });
        throw new Error(`Failed to fetch leaderboard: ${error.message}`);
      }

      logger.info('Successfully fetched sleep leaderboard', {
        metric,
        count: data.length,
      });

      return data;
    } catch (error) {
      logger.error('Error in getSleepLeaderboard', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Check if connection exists in the system
   * @param {string} userId - Terra User ID
   * @returns {boolean} Whether connection exists
   */
  async connectionExists(userId) {
    try {
      const { data, error } = await this.supabase
        .from('connections')
        .select('id')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "not found"
        logger.error('Error checking if connection exists', { error });
        throw new Error(
          `Failed to check connection existence: ${error.message}`
        );
      }

      return !!data;
    } catch (error) {
      logger.error('Error in connectionExists', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Create or update connection record
   * @param {Object} userData - User data from Terra
   * @returns {Object} Connection record
   */
  async upsertConnection(userData) {
    try {
      logger.info('Upserting connection record', { userId: userData.user_id });

      // Extract provider from the user data or infer from context
      const provider = userData.provider || 'TERRA';
      
      // Extract reference_id (wallet address) from user data
      const referenceId = userData.reference_id || userData.wallet_address;

      if (!referenceId) {
        logger.warn('No reference_id found in user data', { userData });
      }

      const { data, error } = await this.supabase
        .from('connections')
        .upsert(
          [
            {
              id: userData.user_id,
              provider: provider,
              reference_id: referenceId,
              active: true,
              last_webhook_update: new Date().toISOString(),
            },
          ],
          {
            onConflict: 'id',
          }
        )
        .select()
        .single();

      if (error) {
        logger.error('Error upserting connection', { error });
        throw new Error(`Failed to upsert connection: ${error.message}`);
      }

      logger.info('Successfully upserted connection', { 
        userId: data.id,
        provider: data.provider,
        referenceId: data.reference_id 
      });

      return data;
    } catch (error) {
      logger.error('Error in upsertConnection', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get connection by Terra user ID
   * @param {string} userId - Terra User ID
   * @returns {Object} Connection record
   */
  async getConnectionByUserId(userId) {
    try {
      const { data, error } = await this.supabase
        .from('connections')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.error('Error fetching connection by user ID', { error });
        throw new Error(`Failed to fetch connection: ${error.message}`);
      }

      return data;
    } catch (error) {
      logger.error('Error in getConnectionByUserId', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get connections by wallet address
   * @param {string} walletAddress - Wallet address (reference_id)
   * @returns {Array} Connection records
   */
  async getConnectionsByWalletAddress(walletAddress) {
    try {
      logger.info('Fetching connections by wallet address', { walletAddress });

      const { data, error } = await this.supabase
        .from('connections')
        .select('*')
        .eq('reference_id', walletAddress)
        .eq('active', true);

      if (error) {
        logger.error('Error fetching connections by wallet address', { error });
        throw new Error(`Failed to fetch connections: ${error.message}`);
      }

      logger.info('Successfully fetched connections by wallet address', {
        walletAddress,
        count: data.length,
      });

      return data;
    } catch (error) {
      logger.error('Error in getConnectionsByWalletAddress', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get sleep metrics by user ID
   * @param {string} userId - User ID
   * @param {number} limit - Number of records to return (default: 30)
   * @returns {Array} Sleep metrics
   */
  async getSleepMetricsByUserId(userId, limit = 30) {
    try {
      logger.info('Fetching sleep metrics by user ID', { userId, limit });

      const { data, error } = await this.supabase
        .from('sleep_metrics')
        .select('*')
        .eq('user_id', userId)
        .order('start_time', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Error fetching sleep metrics by user ID', { error });
        throw new Error(`Failed to fetch sleep metrics: ${error.message}`);
      }

      logger.info('Successfully fetched sleep metrics by user ID', {
        userId,
        count: data.length,
      });

      return data;
    } catch (error) {
      logger.error('Error in getSleepMetricsByUserId', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get all connections for a wallet address (reference_id)
   * @param {string} walletAddress - Wallet address from World miniapp
   * @returns {Array} Connection records
   */
  async getConnectionsByWalletAddress(walletAddress) {
    try {
      logger.info('Fetching connections for wallet address', { walletAddress });

      const { data, error } = await this.supabase
        .from('connections')
        .select('*')
        .eq('reference_id', walletAddress)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching connections by wallet address', { error });
        throw new Error(`Failed to fetch connections: ${error.message}`);
      }

      logger.info('Successfully fetched connections', {
        walletAddress,
        count: data.length,
      });

      return data;
    } catch (error) {
      logger.error('Error in getConnectionsByWalletAddress', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get connection by wallet address and provider
   * @param {string} walletAddress - Wallet address from World miniapp
   * @param {string} provider - Provider name (OURA, WHOOP, etc.)
   * @returns {Object|null} Connection record or null if not found
   */
  async getConnectionByWalletAndProvider(walletAddress, provider) {
    try {
      logger.info('Fetching connection by wallet and provider', {
        walletAddress,
        provider,
      });

      const { data, error } = await this.supabase
        .from('connections')
        .select('*')
        .eq('reference_id', walletAddress)
        .eq('provider', provider)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "not found"
        logger.error('Error fetching connection by wallet and provider', {
          error,
        });
        throw new Error(`Failed to fetch connection: ${error.message}`);
      }

      if (data) {
        logger.info('Successfully fetched connection', {
          walletAddress,
          provider,
          connectionId: data.id,
        });
      } else {
        logger.info('No connection found for wallet and provider', {
          walletAddress,
          provider,
        });
      }

      return data;
    } catch (error) {
      logger.error('Error in getConnectionByWalletAndProvider', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }
}

module.exports = SupabaseService;
