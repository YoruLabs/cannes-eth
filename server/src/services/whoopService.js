const axios = require('axios');
const logger = require('../config/logger');

class WhoopService {
  constructor() {
    this.baseURL = 'https://api.prod.whoop.com/developer/v1';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Create authorization headers with token
   * @param {string} token - Whoop access token
   * @returns {Object} Headers with authorization
   */
  getAuthHeaders(token) {
    return {
      ...this.defaultHeaders,
      'Authorization': `Bearer ${token}`,
    };
  }

  /**
   * Get user profile data
   * @param {string} token - Whoop access token
   * @returns {Object} User profile data
   */
  async getUserProfile(token) {
    try {
      logger.info('Fetching user profile from Whoop API');

      const response = await axios.get(
        `${this.baseURL}/user/profile/basic`,
        {
          headers: this.getAuthHeaders(token),
        }
      );

      logger.info('Successfully fetched user profile from Whoop', {
        userId: response.data.user_id,
        email: response.data.email,
      });

      return response.data;
    } catch (error) {
      logger.error('Error fetching user profile from Whoop', {
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
      throw new Error(`Failed to fetch user profile: ${error.message}`);
    }
  }

  /**
   * Get user body measurements
   * @param {string} token - Whoop access token
   * @returns {Object} Body measurement data
   */
  async getBodyMeasurements(token) {
    try {
      logger.info('Fetching body measurements from Whoop API');

      const response = await axios.get(
        `${this.baseURL}/user/measurement/body`,
        {
          headers: this.getAuthHeaders(token),
        }
      );

      logger.info('Successfully fetched body measurements from Whoop', {
        recordsCount: response.data.records?.length || 0,
      });

      return response.data;
    } catch (error) {
      logger.error('Error fetching body measurements from Whoop', {
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
      });
      throw new Error(`Failed to fetch body measurements: ${error.message}`);
    }
  }

  /**
   * Get user cycles data
   * @param {string} token - Whoop access token
   * @param {number} limit - Number of cycles to retrieve (default: 25)
   * @returns {Object} Cycles data
   */
  async getCycles(token, limit = 25) {
    try {
      logger.info('Fetching cycles from Whoop API', { limit });

      const response = await axios.get(
        `${this.baseURL}/cycle`,
        {
          headers: this.getAuthHeaders(token),
          params: { limit },
        }
      );

      logger.info('Successfully fetched cycles from Whoop', {
        cyclesCount: response.data.records?.length || 0,
      });

      return response.data;
    } catch (error) {
      logger.error('Error fetching cycles from Whoop', {
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
      });
      throw new Error(`Failed to fetch cycles: ${error.message}`);
    }
  }

  /**
   * Get user recovery data
   * @param {string} token - Whoop access token
   * @param {number} limit - Number of recovery records to retrieve (default: 25)
   * @returns {Object} Recovery data
   */
  async getRecovery(token, limit = 25) {
    try {
      logger.info('Fetching recovery data from Whoop API', { limit });

      const response = await axios.get(
        `${this.baseURL}/recovery`,
        {
          headers: this.getAuthHeaders(token),
          params: { limit },
        }
      );

      logger.info('Successfully fetched recovery data from Whoop', {
        recoveryCount: response.data.records?.length || 0,
      });

      return response.data;
    } catch (error) {
      logger.error('Error fetching recovery data from Whoop', {
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
      });
      throw new Error(`Failed to fetch recovery data: ${error.message}`);
    }
  }

  /**
   * Get user sleep data
   * @param {string} token - Whoop access token
   * @param {number} limit - Number of sleep records to retrieve (default: 25)
   * @returns {Object} Sleep data
   */
  async getSleepData(token, limit = 25) {
    try {
      logger.info('Fetching sleep data from Whoop API', { limit });

      const response = await axios.get(
        `${this.baseURL}/activity/sleep`,
        {
          headers: this.getAuthHeaders(token),
          params: { limit },
        }
      );

      logger.info('Successfully fetched sleep data from Whoop', {
        sleepRecordsCount: response.data.records?.length || 0,
      });

      return response.data;
    } catch (error) {
      logger.error('Error fetching sleep data from Whoop', {
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
      });
      throw new Error(`Failed to fetch sleep data: ${error.message}`);
    }
  }

  /**
   * Get user workout data
   * @param {string} token - Whoop access token
   * @param {number} limit - Number of workout records to retrieve (default: 25)
   * @returns {Object} Workout data
   */
  async getWorkouts(token, limit = 25) {
    try {
      logger.info('Fetching workouts from Whoop API', { limit });

      const response = await axios.get(
        `${this.baseURL}/activity/workout`,
        {
          headers: this.getAuthHeaders(token),
          params: { limit },
        }
      );

      logger.info('Successfully fetched workouts from Whoop', {
        workoutCount: response.data.records?.length || 0,
      });

      return response.data;
    } catch (error) {
      logger.error('Error fetching workouts from Whoop', {
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
      });
      throw new Error(`Failed to fetch workouts: ${error.message}`);
    }
  }

  /**
   * Get comprehensive user data (profile + sleep + recovery)
   * @param {string} token - Whoop access token
   * @param {number} limit - Number of records to retrieve for each endpoint
   * @returns {Object} Comprehensive user data
   */
  async getComprehensiveUserData(token, limit = 25) {
    try {
      logger.info('Fetching comprehensive user data from Whoop API', { limit });

      const [profile, sleepData, recoveryData, cycles] = await Promise.all([
        this.getUserProfile(token),
        this.getSleepData(token, limit),
        this.getRecovery(token, limit),
        this.getCycles(token, limit),
      ]);

      const comprehensiveData = {
        profile,
        sleep: sleepData,
        recovery: recoveryData,
        cycles,
        timestamp: new Date().toISOString(),
      };

      logger.info('Successfully fetched comprehensive user data from Whoop', {
        userId: profile.user_id,
        sleepRecords: sleepData.records?.length || 0,
        recoveryRecords: recoveryData.records?.length || 0,
        cycleRecords: cycles.records?.length || 0,
      });

      return comprehensiveData;
    } catch (error) {
      logger.error('Error fetching comprehensive user data from Whoop', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Process Whoop sleep data into Terra-compatible format
   * @param {Object} whoopSleepData - Raw Whoop sleep data
   * @param {string} userId - User ID for the processed data
   * @returns {Array} Processed sleep metrics
   */
  processSleepDataForStorage(whoopSleepData, userId) {
    try {
      logger.info('Processing Whoop sleep data for storage', {
        userId,
        recordsCount: whoopSleepData.records?.length || 0,
      });

      if (!whoopSleepData.records || whoopSleepData.records.length === 0) {
        logger.warn('No sleep records found in Whoop data');
        return [];
      }

      const processedRecords = whoopSleepData.records.map(record => {
        const sleepData = record.score || {};
        const stages = sleepData.stage_summary || {};
        
        // Convert Whoop sleep data to our schema
        return {
          user_id: userId,
          start_time: record.start,
          end_time: record.end,
          total_sleep_duration_seconds: stages.total_in_bed_time_milli ? Math.round(stages.total_in_bed_time_milli / 1000) : null,
          sleep_efficiency: sleepData.sleep_efficiency_percentage || null,
          deep_sleep_duration_seconds: stages.total_slow_wave_sleep_time_milli ? Math.round(stages.total_slow_wave_sleep_time_milli / 1000) : null,
          light_sleep_duration_seconds: stages.total_light_sleep_time_milli ? Math.round(stages.total_light_sleep_time_milli / 1000) : null,
          rem_sleep_duration_seconds: stages.total_rem_sleep_time_milli ? Math.round(stages.total_rem_sleep_time_milli / 1000) : null,
          awake_duration_seconds: stages.total_awake_time_milli ? Math.round(stages.total_awake_time_milli / 1000) : null,
          sleep_latency_seconds: null, // Not directly available in Whoop API
          wake_up_latency_seconds: null, // Not directly available in Whoop API
          avg_heart_rate_bpm: null, // Would need to fetch from cycles data
          resting_heart_rate_bpm: null, // Would need to fetch from cycles data
          avg_hrv_rmssd: null, // Would need to fetch from cycles data
          avg_hrv_sdnn: null, // Not available in Whoop API
          avg_oxygen_saturation: null, // Not available in Whoop API
          avg_breathing_rate: sleepData.respiratory_rate || null,
          snoring_duration_seconds: null, // Not available in Whoop API
          temperature_delta: null, // Not available in Whoop API
          readiness_score: null, // Would need to fetch from recovery data
          recovery_level: null, // Would need to fetch from recovery data
          sleep_score: sleepData.sleep_performance_percentage || null,
          sleep_quality_score: null, // Will be calculated
          recovery_score: null, // Will be calculated
          efficiency_score: null, // Will be calculated
          health_score: null, // Will be calculated
          created_at: new Date().toISOString(),
        };
      });

      logger.info('Successfully processed Whoop sleep data', {
        userId,
        processedCount: processedRecords.length,
      });

      return processedRecords;
    } catch (error) {
      logger.error('Error processing Whoop sleep data', {
        error: error.message,
        userId,
      });
      throw error;
    }
  }
}

module.exports = WhoopService; 