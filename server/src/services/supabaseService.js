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
        sessionId: sleepMetrics.session_id 
      });

      const { data, error } = await this.supabase
        .from('sleep_metrics')
        .insert([sleepMetrics])
        .select()
        .single();

      if (error) {
        logger.error('Error storing sleep metrics', { error });
        throw new Error(`Failed to store sleep metrics: ${error.message}`);
      }

      logger.info('Successfully stored sleep metrics', { 
        id: data.id,
        userId: data.user_id 
      });

      return data;
    } catch (error) {
      logger.error('Error in storeSleepMetrics', { 
        error: error.message,
        stack: error.stack 
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
        count: data.length 
      });

      return data;
    } catch (error) {
      logger.error('Error in getUserSleepMetrics', { 
        error: error.message,
        stack: error.stack 
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
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching challenge sleep metrics', { error });
        throw new Error(`Failed to fetch challenge metrics: ${error.message}`);
      }

      logger.info('Successfully fetched challenge sleep metrics', { 
        challengeId, 
        count: data.length 
      });

      return data;
    } catch (error) {
      logger.error('Error in getChallengeSleepMetrics', { 
        error: error.message,
        stack: error.stack 
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
        .select('user_id, session_id, sleep_efficiency, created_at')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
        .order(metric, { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Error fetching sleep leaderboard', { error });
        throw new Error(`Failed to fetch leaderboard: ${error.message}`);
      }

      logger.info('Successfully fetched sleep leaderboard', { 
        metric, 
        count: data.length 
      });

      return data;
    } catch (error) {
      logger.error('Error in getSleepLeaderboard', { 
        error: error.message,
        stack: error.stack 
      });
      throw error;
    }
  }

  /**
   * Check if user exists in the system
   * @param {string} userId - User ID
   * @returns {boolean} Whether user exists
   */
  async userExists(userId) {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        logger.error('Error checking if user exists', { error });
        throw new Error(`Failed to check user existence: ${error.message}`);
      }

      return !!data;
    } catch (error) {
      logger.error('Error in userExists', { 
        error: error.message,
        stack: error.stack 
      });
      throw error;
    }
  }

  /**
   * Create or update user record
   * @param {Object} userData - User data from Terra
   * @returns {Object} User record
   */
  async upsertUser(userData) {
    try {
      logger.info('Upserting user record', { userId: userData.user_id });

      const { data, error } = await this.supabase
        .from('users')
        .upsert([{
          id: userData.user_id,
          provider: userData.provider,
          reference_id: userData.reference_id,
          active: userData.active,
          last_webhook_update: new Date().toISOString()
        }], {
          onConflict: 'id'
        })
        .select()
        .single();

      if (error) {
        logger.error('Error upserting user', { error });
        throw new Error(`Failed to upsert user: ${error.message}`);
      }

      logger.info('Successfully upserted user', { userId: data.id });

      return data;
    } catch (error) {
      logger.error('Error in upsertUser', { 
        error: error.message,
        stack: error.stack 
      });
      throw error;
    }
  }
}

module.exports = SupabaseService; 