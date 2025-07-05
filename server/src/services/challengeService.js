const { formatEther, parseEther } = require('viem');
const {
  createClients,
  HEALTH_CHALLENGE_ADDRESS,
  HEALTH_CHALLENGE_ABI,
} = require('../config/contracts');
const { createClient } = require('@supabase/supabase-js');
const logger = require('../config/logger');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Initialize blockchain clients
const { publicClient, walletClient } = createClients();

/**
 * Challenge Service
 * Handles all challenge-related operations including contract interactions, database management,
 * and sleep-based challenge calculations
 */
class ChallengeService {
  /**
   * Helper function to format entry fee for display
   * @param {bigint} weiValue - Value in wei
   * @returns {string} Formatted value in WLD
   */
  formatEntryFee(weiValue) {
    const etherValue = formatEther(weiValue);
    const numValue = parseFloat(etherValue);

    // Handle very small values (likely test values)
    if (numValue < 0.000001 && numValue > 0) {
      return `~${numValue.toExponential(2)}`; // Show in scientific notation with ~ prefix
    }

    // Handle normal values
    if (numValue >= 0.000001) {
      return numValue.toFixed(6).replace(/\.?0+$/, '');
    }

    // Handle zero
    if (numValue === 0) {
      return '0';
    }

    return numValue.toString();
  }

  /**
   * Create a new challenge on the blockchain and store it in the database
   * @param {Object} challengeData - Challenge information
   * @param {string} challengeData.title - Challenge title
   * @param {string} challengeData.description - Challenge description
   * @param {string} challengeData.entryFee - Entry fee in WLD (e.g., "0.01")
   * @param {string} challengeData.challengeType - Type of challenge (e.g., "sleep_efficiency", "sleep_duration")
   * @param {string} challengeData.entryStartTime - When users can start joining (ISO string)
   * @param {string} challengeData.entryEndTime - When entry period closes (ISO string)
   * @param {string} challengeData.challengeStartTime - When challenge tracking begins (ISO string)
   * @param {string} challengeData.challengeEndTime - When challenge tracking ends (ISO string)
   * @param {Object} challengeData.requirements - Challenge requirements object
   * @param {number} challengeData.winnerCount - Number of winners (default: 1)
   * @param {string} challengeData.metricType - Type of metric to track
   * @param {string} challengeData.metricCalculation - How to calculate metric (average, total, etc.)
   * @param {number} challengeData.targetValue - Target value to achieve
   * @param {string} challengeData.targetUnit - Unit of the target value
   * @param {string} challengeData.comparisonOperator - How to compare (gte, lte, etc.)
   * @returns {Promise<Object>} Created challenge data
   */
  async createChallenge(challengeData) {
    try {
      logger.info('Creating new challenge', { challengeData });

      const {
        title,
        description,
        entryFee,
        challengeType,
        entryStartTime,
        entryEndTime,
        challengeStartTime,
        challengeEndTime,
        requirements,
        winnerCount = 1,
        metricType,
        metricCalculation = 'average',
        targetValue,
        targetUnit,
        comparisonOperator = 'gte',
      } = challengeData;

      // Convert entry fee to wei
      const entryFeeWei = parseEther(entryFee);

      // Create challenge on blockchain
      const hash = await walletClient.writeContract({
        address: HEALTH_CHALLENGE_ADDRESS,
        abi: HEALTH_CHALLENGE_ABI,
        functionName: 'createChallenge',
        args: [entryFeeWei],
      });

      logger.info('Challenge creation transaction sent', { hash });

      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      logger.info('Challenge creation confirmed', { receipt });

      // Get the challenge ID from the contract
      const challengeCounter = await publicClient.readContract({
        address: HEALTH_CHALLENGE_ADDRESS,
        abi: HEALTH_CHALLENGE_ABI,
        functionName: 'challengeCounter',
      });

      const challengeId = Number(challengeCounter);

      // Store challenge in database
      const { data: dbChallenge, error: dbError } = await supabase
        .from('challenges')
        .insert({
          challenge_id: challengeId,
          title,
          description,
          entry_fee: entryFee,
          challenge_type: challengeType,
          entry_start_time: new Date(entryStartTime).toISOString(),
          entry_end_time: new Date(entryEndTime).toISOString(),
          challenge_start_time: new Date(challengeStartTime).toISOString(),
          challenge_end_time: new Date(challengeEndTime).toISOString(),
          deadline: new Date(challengeEndTime).toISOString(), // Add deadline field
          requirements: requirements || {},
          winner_count: winnerCount,
          metric_type: metricType,
          metric_calculation: metricCalculation,
          target_value: targetValue,
          target_unit: targetUnit,
          comparison_operator: comparisonOperator,
          status: 'created',
          created_at: new Date().toISOString(),
          transaction_hash: hash,
        })
        .select()
        .single();

      if (dbError) {
        logger.error('Failed to store challenge in database', {
          error: dbError,
        });
        throw new Error(`Database error: ${dbError.message}`);
      }

      logger.info('Challenge created successfully', {
        challengeId,
        dbChallenge,
      });

      return {
        success: true,
        challengeId,
        transactionHash: hash,
        challenge: dbChallenge,
      };
    } catch (error) {
      logger.error('Failed to create challenge', { error: error.message });
      throw error;
    }
  }

  /**
   * Get challenge details from both blockchain and database
   * @param {number} challengeId - Challenge ID
   * @returns {Promise<Object>} Challenge details
   */
  async getChallengeDetails(challengeId) {
    try {
      logger.info('Getting challenge details', { challengeId });

      // Get challenge from blockchain
      const contractData = await publicClient.readContract({
        address: HEALTH_CHALLENGE_ADDRESS,
        abi: HEALTH_CHALLENGE_ABI,
        functionName: 'getChallengeDetails',
        args: [BigInt(challengeId)],
      });

      // Get challenge from database
      const { data: dbChallenge, error: dbError } = await supabase
        .from('challenges')
        .select('*')
        .eq('challenge_id', challengeId)
        .single();

      if (dbError && dbError.code !== 'PGRST116') {
        logger.error('Failed to get challenge from database', {
          error: dbError,
        });
        throw new Error(`Database error: ${dbError.message}`);
      }

      // Combine blockchain and database data
      const challengeDetails = {
        id: challengeId,
        entryFee: this.formatEntryFee(contractData[1]), // Entry fee users pay
        totalPool: this.formatEntryFee(contractData[2]), // Live total pool from blockchain
        participantCount: this.formatParticipantCount(contractData[3]), // Participant count from blockchain
        winnerCount: Number(contractData[4]),
        isActive: contractData[5],
        isCompleted: contractData[6],
        // Database fields
        title: dbChallenge?.title || `Challenge #${challengeId}`,
        description:
          dbChallenge?.description || 'Complete your health goals to win!',
        challengeType: dbChallenge?.challenge_type || 'health',
        entryStartTime: dbChallenge?.entry_start_time,
        entryEndTime: dbChallenge?.entry_end_time,
        challengeStartTime: dbChallenge?.challenge_start_time,
        challengeEndTime: dbChallenge?.challenge_end_time,
        requirements: dbChallenge?.requirements || {},
        status: dbChallenge?.status || 'created',
        createdAt: dbChallenge?.created_at,
        startedAt: dbChallenge?.started_at,
        transactionHash: dbChallenge?.transaction_hash,
        completionTransactionHash: dbChallenge?.completion_transaction_hash,
        // Sleep challenge specific fields
        metricType: dbChallenge?.metric_type,
        metricCalculation: dbChallenge?.metric_calculation,
        targetValue: dbChallenge?.target_value,
        targetUnit: dbChallenge?.target_unit,
        comparisonOperator: dbChallenge?.comparison_operator,
        // Calculate time-based statuses
        canJoinNow:
          dbChallenge?.entry_start_time && dbChallenge?.entry_end_time
            ? new Date() >= new Date(dbChallenge.entry_start_time) &&
              new Date() <= new Date(dbChallenge.entry_end_time)
            : false,
        entryPeriodClosed: dbChallenge?.entry_end_time
          ? new Date() > new Date(dbChallenge.entry_end_time)
          : false,
        isCurrentlyActive:
          dbChallenge?.challenge_start_time && dbChallenge?.challenge_end_time
            ? new Date() >= new Date(dbChallenge.challenge_start_time) &&
              new Date() <= new Date(dbChallenge.challenge_end_time)
            : false,
        shouldBeCompleted: dbChallenge?.challenge_end_time
          ? new Date() > new Date(dbChallenge.challenge_end_time)
          : false,
      };

      logger.info('Challenge details retrieved', { challengeDetails });
      return challengeDetails;
    } catch (error) {
      logger.error('Failed to get challenge details', {
        error: error.message,
        challengeId,
      });
      throw error;
    }
  }

  /**
   * Get all challenges
   * @returns {Promise<Array>} Array of challenges
   */
  async getAllChallenges() {
    try {
      logger.info('Getting all challenges');

      // Get challenge counter from contract
      const challengeCounter = await publicClient.readContract({
        address: HEALTH_CHALLENGE_ADDRESS,
        abi: HEALTH_CHALLENGE_ABI,
        functionName: 'challengeCounter',
      });

      const totalChallenges = Number(challengeCounter);
      const challenges = [];

      // Get all challenges (starting from 1)
      for (let i = 1; i <= totalChallenges; i++) {
        try {
          const challenge = await this.getChallengeDetails(i);
          challenges.push(challenge);
        } catch (error) {
          logger.warn('Failed to get challenge details', {
            challengeId: i,
            error: error.message,
          });
        }
      }

      logger.info('Retrieved all challenges', { count: challenges.length });
      return challenges;
    } catch (error) {
      logger.error('Failed to get all challenges', { error: error.message });
      throw error;
    }
  }

  /**
   * Add a user to a challenge participation
   * @param {number} challengeId - Challenge ID
   * @param {string} walletAddress - User's wallet address
   * @param {string} transactionHash - Transaction hash of the join transaction
   * @returns {Promise<Object>} Participation record
   */
  async addParticipant(challengeId, walletAddress, transactionHash) {
    try {
      logger.info('Adding participant to challenge', {
        challengeId,
        walletAddress,
      });

      // Check if user is already participating
      const { data: existingParticipation } = await supabase
        .from('challenge_participations')
        .select('*')
        .eq('challenge_id', challengeId)
        .eq('wallet_address', walletAddress)
        .single();

      if (existingParticipation) {
        logger.info('User already participating in challenge', {
          challengeId,
          walletAddress,
        });
        return existingParticipation;
      }

      // Add participation record
      const { data: participation, error } = await supabase
        .from('challenge_participations')
        .insert({
          challenge_id: challengeId,
          wallet_address: walletAddress,
          joined_at: new Date().toISOString(),
          transaction_hash: transactionHash,
          status: 'active',
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to add participant', { error });
        throw new Error(`Database error: ${error.message}`);
      }

      logger.info('Participant added successfully', { participation });
      return participation;
    } catch (error) {
      logger.error('Failed to add participant', { error: error.message });
      throw error;
    }
  }

  /**
   * Get participants for a challenge
   * @param {number} challengeId - Challenge ID
   * @returns {Promise<Array>} Array of participants
   */
  async getChallengeParticipants(challengeId) {
    try {
      logger.info('Getting challenge participants', { challengeId });

      const { data: participants, error } = await supabase
        .from('challenge_participations')
        .select('*')
        .eq('challenge_id', challengeId)
        .eq('status', 'active');

      if (error) {
        logger.error('Failed to get participants', { error });
        throw new Error(`Database error: ${error.message}`);
      }

      logger.info('Retrieved challenge participants', {
        challengeId,
        count: participants.length,
      });
      return participants;
    } catch (error) {
      logger.error('Failed to get challenge participants', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Complete a challenge by determining winners and calling the contract
   * @param {number} challengeId - Challenge ID
   * @param {Array} winnerAddresses - Array of winner wallet addresses (optional)
   * @returns {Promise<Object>} Completion result
   */
  async completeChallenge(challengeId, winnerAddresses = []) {
    try {
      logger.info('Completing challenge', { challengeId, winnerAddresses });

      // Get challenge details
      const challenge = await this.getChallengeDetails(challengeId);

      // If no winners provided and it's a sleep challenge, calculate winners
      let winners = winnerAddresses;
      if (winners.length === 0) {
        if (challenge.metricType) {
          // This is a sleep challenge - calculate metrics and determine winners
          await this.calculateAllParticipantMetrics(challengeId);
          winners = await this.getChallengeWinners(challengeId);
        } else {
          // Legacy challenge - use mock logic
          const participants = await this.getChallengeParticipants(challengeId);
          winners = this.mockWinnerSelection(participants);
        }
      }

      // Create signature for the completion (mock signature for now)
      const signature = await this.createCompletionSignature(
        challengeId,
        winners
      );

      // Complete challenge on blockchain
      const hash = await walletClient.writeContract({
        address: HEALTH_CHALLENGE_ADDRESS,
        abi: HEALTH_CHALLENGE_ABI,
        functionName: 'completeChallenge',
        args: [BigInt(challengeId), winners, signature],
      });

      logger.info('Challenge completion transaction sent', { hash });

      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      logger.info('Challenge completion confirmed', { receipt });

      // Update challenge status in database
      const { error: updateError } = await supabase
        .from('challenges')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          completion_transaction_hash: hash,
        })
        .eq('challenge_id', challengeId);

      if (updateError) {
        logger.error('Failed to update challenge status', {
          error: updateError,
        });
      }

      // Update participant statuses
      await this.updateParticipantStatuses(challengeId, winners);

      logger.info('Challenge completed successfully', { challengeId, winners });

      return {
        success: true,
        challengeId,
        winners,
        transactionHash: hash,
      };
    } catch (error) {
      logger.error('Failed to complete challenge', { error: error.message });
      throw error;
    }
  }

  // ========== SLEEP CHALLENGE SPECIFIC METHODS ==========

  /**
   * Calculate metric value for a participant in a sleep challenge
   * @param {number} participationId - Participation ID
   * @param {Object} challenge - Challenge configuration
   * @returns {Promise<Object>} Calculated metric result
   */
  async calculateParticipantMetric(participationId, challenge) {
    try {
      logger.info('Calculating participant metric', {
        participationId,
        challengeId: challenge.challenge_id,
      });

      // Get participation details
      const { data: participation, error: participationError } = await supabase
        .from('challenge_participations')
        .select('*')
        .eq('id', participationId)
        .single();

      if (participationError || !participation) {
        throw new Error(
          `Participation not found: ${participationError?.message}`
        );
      }

      // Get sleep metrics for the challenge period by wallet address
      // We need to find the user_id associated with this wallet address
      const sleepMetrics = await this.getSleepMetricsForChallenge(
        participation.wallet_address,
        challenge.challenge_start_time,
        challenge.challenge_end_time
      );

      if (sleepMetrics.length === 0) {
        logger.warn('No sleep metrics found for participant', {
          participationId,
          walletAddress: participation.wallet_address,
        });
        return {
          calculatedValue: null,
          dataPointsCount: 0,
          meetsRequirements: false,
          details: 'No sleep data found for challenge period',
        };
      }

      // Calculate the metric based on challenge configuration
      const calculatedValue = this.calculateMetricValue(
        sleepMetrics,
        challenge.metric_type,
        challenge.metric_calculation
      );

      // Check if participant meets requirements
      const meetsRequirements = this.checkRequirements(
        calculatedValue,
        challenge.target_value,
        challenge.comparison_operator
      );

      logger.info('Metric calculated', {
        participationId,
        calculatedValue,
        dataPointsCount: sleepMetrics.length,
        meetsRequirements,
      });

      return {
        calculatedValue,
        dataPointsCount: sleepMetrics.length,
        meetsRequirements,
        details: `Calculated ${challenge.metric_type} using ${challenge.metric_calculation} method`,
      };
    } catch (error) {
      logger.error('Failed to calculate participant metric', {
        error: error.message,
        participationId,
      });
      throw error;
    }
  }

  /**
   * Get sleep metrics for a wallet address within a date range
   * @param {string} walletAddress - Wallet address
   * @param {string} startTime - Start time (ISO string)
   * @param {string} endTime - End time (ISO string)
   * @returns {Promise<Array>} Sleep metrics array
   */
  async getSleepMetricsForChallenge(walletAddress, startTime, endTime) {
    try {
      // First, try to find sleep metrics by wallet address if it's stored
      const { data: sleepMetrics, error } = await supabase
        .from('sleep_metrics')
        .select('*')
        .eq('wallet_address', walletAddress) // Assuming you have wallet_address in sleep_metrics
        .gte('start_time', startTime)
        .lte('end_time', endTime)
        .order('start_time', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch sleep metrics: ${error.message}`);
      }

      // If no metrics found by wallet address, we might need to link via user mapping
      if (!sleepMetrics || sleepMetrics.length === 0) {
        logger.warn('No sleep metrics found for wallet address', {
          walletAddress,
        });
        // TODO: Implement user mapping logic if needed
        // This would require a mapping table between wallet addresses and Terra user IDs
      }

      return sleepMetrics || [];
    } catch (error) {
      logger.error('Failed to get sleep metrics for challenge', {
        error: error.message,
        walletAddress,
      });
      throw error;
    }
  }

  /**
   * Calculate metric value based on sleep data and calculation method
   * @param {Array} sleepMetrics - Array of sleep metric records
   * @param {string} metricType - Type of metric to calculate
   * @param {string} calculationMethod - How to calculate (average, total, minimum, maximum)
   * @returns {number} Calculated metric value
   */
  calculateMetricValue(sleepMetrics, metricType, calculationMethod) {
    if (!sleepMetrics.length) return null;

    // Extract the specific metric values
    const values = sleepMetrics
      .map(record => record[metricType])
      .filter(value => value !== null && value !== undefined);

    if (!values.length) return null;

    switch (calculationMethod) {
      case 'average':
        return values.reduce((sum, value) => sum + value, 0) / values.length;
      case 'total':
        return values.reduce((sum, value) => sum + value, 0);
      case 'minimum':
        return Math.min(...values);
      case 'maximum':
        return Math.max(...values);
      default:
        logger.warn('Unknown calculation method, using average', {
          calculationMethod,
        });
        return values.reduce((sum, value) => sum + value, 0) / values.length;
    }
  }

  /**
   * Check if calculated value meets challenge requirements
   * @param {number} calculatedValue - Calculated metric value
   * @param {number} targetValue - Target value from challenge
   * @param {string} comparisonOperator - Comparison operator
   * @returns {boolean} Whether requirements are met
   */
  checkRequirements(calculatedValue, targetValue, comparisonOperator) {
    if (calculatedValue === null || calculatedValue === undefined) return false;

    switch (comparisonOperator) {
      case 'gte':
        return calculatedValue >= targetValue;
      case 'lte':
        return calculatedValue <= targetValue;
      case 'eq':
        return calculatedValue === targetValue;
      case 'gt':
        return calculatedValue > targetValue;
      case 'lt':
        return calculatedValue < targetValue;
      default:
        logger.warn('Unknown comparison operator, using gte', {
          comparisonOperator,
        });
        return calculatedValue >= targetValue;
    }
  }

  /**
   * Update participant metric calculation
   * @param {number} participationId - Participation ID
   * @param {Object} metricResult - Result from calculateParticipantMetric
   * @returns {Promise<Object>} Updated participation record
   */
  async updateParticipantMetric(participationId, metricResult) {
    try {
      const { data: updatedParticipation, error } = await supabase
        .from('challenge_participations')
        .update({
          calculated_metric_value: metricResult.calculatedValue,
          data_points_count: metricResult.dataPointsCount,
          meets_requirements: metricResult.meetsRequirements,
          last_data_update: new Date().toISOString(),
          qualification_checked_at: new Date().toISOString(),
        })
        .eq('id', participationId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update participation: ${error.message}`);
      }

      logger.info('Participant metric updated', {
        participationId,
        metricResult,
      });
      return updatedParticipation;
    } catch (error) {
      logger.error('Failed to update participant metric', {
        error: error.message,
        participationId,
      });
      throw error;
    }
  }

  /**
   * Calculate metrics for all participants in a challenge
   * @param {number} challengeId - Challenge ID
   * @returns {Promise<Array>} Array of calculation results
   */
  async calculateAllParticipantMetrics(challengeId) {
    try {
      logger.info('Calculating metrics for all participants', { challengeId });

      // Get challenge details
      const challenge = await this.getChallengeDetails(challengeId);

      if (!challenge.metricType) {
        throw new Error('Challenge does not have metric configuration');
      }

      // Get all active participants
      const participants = await this.getChallengeParticipants(challengeId);
      const results = [];

      // Calculate metrics for each participant
      for (const participant of participants) {
        try {
          const metricResult = await this.calculateParticipantMetric(
            participant.id,
            challenge
          );
          await this.updateParticipantMetric(participant.id, metricResult);

          results.push({
            participationId: participant.id,
            walletAddress: participant.wallet_address,
            ...metricResult,
          });
        } catch (error) {
          logger.error('Failed to calculate metric for participant', {
            participationId: participant.id,
            error: error.message,
          });
          results.push({
            participationId: participant.id,
            walletAddress: participant.wallet_address,
            error: error.message,
          });
        }
      }

      logger.info('Calculated metrics for all participants', {
        challengeId,
        resultsCount: results.length,
      });
      return results;
    } catch (error) {
      logger.error('Failed to calculate all participant metrics', {
        error: error.message,
        challengeId,
      });
      throw error;
    }
  }

  /**
   * Get challenge winners based on calculated metrics
   * @param {number} challengeId - Challenge ID
   * @returns {Promise<Array>} Array of winner wallet addresses
   */
  async getChallengeWinners(challengeId) {
    try {
      logger.info('Getting challenge winners', { challengeId });

      // Get challenge details
      const challenge = await this.getChallengeDetails(challengeId);

      // Get participants who meet requirements, ordered by metric value
      const orderDirection =
        challenge.comparisonOperator === 'gte' ||
        challenge.comparisonOperator === 'gt'
          ? 'desc'
          : 'asc';

      const { data: qualifiedParticipants, error: participantsError } =
        await supabase
          .from('challenge_participations')
          .select('*')
          .eq('challenge_id', challengeId)
          .eq('meets_requirements', true)
          .not('calculated_metric_value', 'is', null)
          .order('calculated_metric_value', {
            ascending: orderDirection === 'asc',
          })
          .limit(challenge.winnerCount);

      if (participantsError) {
        throw new Error(
          `Failed to get qualified participants: ${participantsError.message}`
        );
      }

      const winners = qualifiedParticipants.map(p => p.wallet_address);

      logger.info('Challenge winners determined', {
        challengeId,
        winners,
        winnerCount: winners.length,
      });
      return winners;
    } catch (error) {
      logger.error('Failed to get challenge winners', {
        error: error.message,
        challengeId,
      });
      throw error;
    }
  }

  /**
   * Get predefined sleep challenges
   * @returns {Array} Array of challenge configurations
   */
  getPredefinedSleepChallenges() {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const dayAfterTomorrow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return [
      {
        title: 'Sleep Efficiency Master',
        description:
          'Achieve an average sleep efficiency of 85% or higher over 7 days',
        challengeType: 'sleep_efficiency',
        entryFee: '0.01',
        entryStartTime: now.toISOString(),
        entryEndTime: tomorrow.toISOString(),
        challengeStartTime: dayAfterTomorrow.toISOString(),
        challengeEndTime: weekFromNow.toISOString(),
        metricType: 'sleep_efficiency',
        metricCalculation: 'average',
        targetValue: 85,
        targetUnit: 'percentage',
        comparisonOperator: 'gte',
        winnerCount: 3,
        requirements: {
          description: 'Sleep efficiency >= 85% average over 7 days',
          minimumDataPoints: 5,
        },
      },
      {
        title: '9-Hour Sleep Challenge',
        description: 'Sleep 9 hours or more per night on average over 7 days',
        challengeType: 'sleep_duration',
        entryFee: '0.01',
        entryStartTime: now.toISOString(),
        entryEndTime: tomorrow.toISOString(),
        challengeStartTime: dayAfterTomorrow.toISOString(),
        challengeEndTime: weekFromNow.toISOString(),
        metricType: 'total_sleep_duration_seconds',
        metricCalculation: 'average',
        targetValue: 32400, // 9 hours in seconds
        targetUnit: 'seconds',
        comparisonOperator: 'gte',
        winnerCount: 3,
        requirements: {
          description: 'Average sleep duration >= 9 hours over 7 days',
          minimumDataPoints: 5,
        },
      },
    ];
  }

  // ========== LEGACY/HELPER METHODS ==========

  /**
   * Mock winner selection logic for non-sleep challenges
   * @param {Array} participants - Array of participants
   * @returns {Array} Array of winner addresses
   */
  mockWinnerSelection(participants) {
    if (participants.length === 0) return [];

    // For now, select the first participant as winner
    // In production, this would be based on actual health data verification
    const winner = participants[0];
    logger.info('Mock winner selected', { winner: winner.wallet_address });

    return [winner.wallet_address];
  }

  /**
   * Create completion signature (mock implementation)
   * @param {number} challengeId - Challenge ID
   * @param {Array} winners - Array of winner addresses
   * @returns {string} Signature
   */
  async createCompletionSignature(challengeId, winners) {
    // Mock signature - in production, this would be a proper signature
    // using the backend private key to sign the completion data
    const mockSignature = `0x${'0'.repeat(130)}`; // 65 bytes of zeros

    logger.info('Created completion signature', {
      challengeId,
      winners,
      signature: mockSignature,
    });
    return mockSignature;
  }

  /**
   * Update participant statuses after challenge completion
   * @param {number} challengeId - Challenge ID
   * @param {Array} winners - Array of winner addresses
   */
  async updateParticipantStatuses(challengeId, winners) {
    try {
      // Update winners
      if (winners.length > 0) {
        const { error: winnerError } = await supabase
          .from('challenge_participations')
          .update({ status: 'winner' })
          .eq('challenge_id', challengeId)
          .in('wallet_address', winners);

        if (winnerError) {
          logger.error('Failed to update winner statuses', {
            error: winnerError,
          });
        }
      }

      // Update non-winners to completed status
      const { error: nonWinnerError } = await supabase
        .from('challenge_participations')
        .update({ status: 'completed' })
        .eq('challenge_id', challengeId)
        .not(
          'wallet_address',
          'in',
          `(${winners.map(w => `"${w}"`).join(',')})`
        );

      if (nonWinnerError) {
        logger.error('Failed to update non-winner statuses', {
          error: nonWinnerError,
        });
      }

      logger.info('Updated participant statuses', { challengeId, winners });
    } catch (error) {
      logger.error('Failed to update participant statuses', {
        error: error.message,
      });
    }
  }

  /**
   * Check if a user is participating in a challenge
   * @param {number} challengeId - Challenge ID
   * @param {string} walletAddress - User's wallet address
   * @returns {Promise<boolean>} True if participating
   */
  async isParticipating(challengeId, walletAddress) {
    try {
      const { data: participation } = await supabase
        .from('challenge_participations')
        .select('*')
        .eq('challenge_id', challengeId)
        .eq('wallet_address', walletAddress)
        .eq('status', 'active')
        .single();

      return !!participation;
    } catch (error) {
      logger.error('Failed to check participation', { error: error.message });
      return false;
    }
  }

  /**
   * Format participant count from contract data
   * @param {bigint} countValue - Participant count from contract
   * @returns {number} Formatted participant count
   */
  formatParticipantCount(countValue) {
    return Number(countValue);
  }

  /**
   * Get challenge data from database only (no blockchain calls)
   * @param {number} challengeId - Challenge ID
   * @returns {Promise<Object|null>} Challenge data from database
   */
  async getChallengeFromDatabase(challengeId) {
    try {
      logger.info('Getting challenge from database only', { challengeId });

      const { data: dbChallenge, error: dbError } = await supabase
        .from('challenges')
        .select('*')
        .eq('challenge_id', challengeId)
        .single();

      if (dbError) {
        if (dbError.code === 'PGRST116') {
          // Not found
          return null;
        }
        logger.error('Failed to get challenge from database', {
          error: dbError,
        });
        throw new Error(`Database error: ${dbError.message}`);
      }

      // Process and format the challenge data
      const processedChallenge = {
        id: dbChallenge.challenge_id,
        title: dbChallenge.title,
        description: dbChallenge.description,
        challengeType: dbChallenge.challenge_type,
        entryStartTime: dbChallenge.entry_start_time,
        entryEndTime: dbChallenge.entry_end_time,
        challengeStartTime: dbChallenge.challenge_start_time,
        challengeEndTime: dbChallenge.challenge_end_time,
        requirements: dbChallenge.requirements || {},
        challengeRequirements:
          dbChallenge.challenge_requirements ||
          dbChallenge.requirements?.challengeRequirements ||
          this.getDefaultRequirements(dbChallenge.challenge_type),
        status: dbChallenge.status,
        createdAt: dbChallenge.created_at,
        startedAt: dbChallenge.started_at,
        completedAt: dbChallenge.completed_at,
        transactionHash: dbChallenge.transaction_hash,
        completionTransactionHash: dbChallenge.completion_transaction_hash,
        metricType: dbChallenge.metric_type,
        metricCalculation: dbChallenge.metric_calculation,
        targetValue: dbChallenge.target_value,
        targetUnit: dbChallenge.target_unit,
        comparisonOperator: dbChallenge.comparison_operator,
        winnerCount: dbChallenge.winner_count,
        // Calculate time-based statuses
        canJoinNow:
          dbChallenge.entry_start_time && dbChallenge.entry_end_time
            ? new Date() >= new Date(dbChallenge.entry_start_time) &&
              new Date() <= new Date(dbChallenge.entry_end_time)
            : false,
        entryPeriodClosed: dbChallenge.entry_end_time
          ? new Date() > new Date(dbChallenge.entry_end_time)
          : false,
        isCurrentlyActive:
          dbChallenge.challenge_start_time && dbChallenge.challenge_end_time
            ? new Date() >= new Date(dbChallenge.challenge_start_time) &&
              new Date() <= new Date(dbChallenge.challenge_end_time)
            : false,
        shouldBeCompleted: dbChallenge.challenge_end_time
          ? new Date() > new Date(dbChallenge.challenge_end_time)
          : false,
      };

      logger.info('Challenge retrieved from database', { processedChallenge });
      return processedChallenge;
    } catch (error) {
      logger.error('Failed to get challenge from database', {
        error: error.message,
        challengeId,
      });
      throw error;
    }
  }

  /**
   * Get multiple challenges data from database only (no blockchain calls)
   * @param {Array<number>} challengeIds - Array of challenge IDs
   * @returns {Promise<Array>} Array of challenge data from database
   */
  async getMultipleChallengesFromDatabase(challengeIds) {
    try {
      logger.info('Getting multiple challenges from database only', {
        challengeIds,
      });

      const { data: dbChallenges, error: dbError } = await supabase
        .from('challenges')
        .select('*')
        .in('challenge_id', challengeIds)
        .order('challenge_id', { ascending: true });

      if (dbError) {
        logger.error('Failed to get challenges from database', {
          error: dbError,
        });
        throw new Error(`Database error: ${dbError.message}`);
      }

      // Process each challenge
      const challenges = dbChallenges.map(dbChallenge => {
        const challengeId = dbChallenge.challenge_id;
        return {
          id: challengeId,
          title: dbChallenge.title || `Challenge #${challengeId}`,
          description:
            dbChallenge.description || 'Complete your health goals to win!',
          challengeType: dbChallenge.challenge_type || 'health',
          entryStartTime: dbChallenge.entry_start_time,
          entryEndTime: dbChallenge.entry_end_time,
          challengeStartTime: dbChallenge.challenge_start_time,
          challengeEndTime: dbChallenge.challenge_end_time,
          requirements: dbChallenge.requirements || {},
          status: dbChallenge.status || 'created',
          createdAt: dbChallenge.created_at,
          startedAt: dbChallenge.started_at,
          completedAt: dbChallenge.completed_at,
          transactionHash: dbChallenge.transaction_hash,
          completionTransactionHash: dbChallenge.completion_transaction_hash,
          // Sleep challenge specific fields
          metricType: dbChallenge.metric_type,
          metricCalculation: dbChallenge.metric_calculation,
          targetValue: dbChallenge.target_value,
          targetUnit: dbChallenge.target_unit,
          comparisonOperator: dbChallenge.comparison_operator,
          winnerCount: dbChallenge.winner_count,
          // Calculate time-based statuses
          canJoinNow:
            dbChallenge.entry_start_time && dbChallenge.entry_end_time
              ? new Date() >= new Date(dbChallenge.entry_start_time) &&
                new Date() <= new Date(dbChallenge.entry_end_time)
              : false,
          entryPeriodClosed: dbChallenge.entry_end_time
            ? new Date() > new Date(dbChallenge.entry_end_time)
            : false,
          isCurrentlyActive:
            dbChallenge.challenge_start_time && dbChallenge.challenge_end_time
              ? new Date() >= new Date(dbChallenge.challenge_start_time) &&
                new Date() <= new Date(dbChallenge.challenge_end_time)
              : false,
          shouldBeCompleted: dbChallenge.challenge_end_time
            ? new Date() > new Date(dbChallenge.challenge_end_time)
            : false,
        };
      });

      logger.info('Multiple challenges data retrieved from database', {
        count: challenges.length,
        challengeIds,
      });
      return challenges;
    } catch (error) {
      logger.error('Failed to get multiple challenges from database', {
        error: error.message,
        challengeIds,
      });
      throw error;
    }
  }

  /**
   * Get default requirements for a challenge type
   * @param {string} challengeType - Type of challenge
   * @returns {Array} Array of requirement strings
   */
  getDefaultRequirements(challengeType) {
    switch (challengeType) {
      case 'sleep_efficiency':
        return [
          'Achieve average sleep efficiency of 85% or higher',
          'Track sleep data for minimum 7 consecutive days',
          'Connect Terra fitness tracker to your account',
          'Maintain consistent sleep schedule throughout challenge period',
        ];
      case 'sleep_duration':
        return [
          'Sleep minimum 9 hours per night on average',
          'Track sleep data for minimum 7 consecutive days',
          'Connect Terra fitness tracker to your account',
          'Maintain consistent bedtime and wake-up schedule',
        ];
      case 'health':
      default:
        return [
          'Complete daily health goals consistently',
          'Connect and sync your fitness tracking device',
          'Maintain activity throughout the challenge period',
          'Submit valid health data for verification',
        ];
    }
  }

  /**
   * Get default professional description for a challenge type
   * @param {string} challengeType - Type of challenge
   * @param {number} targetValue - Target value for the challenge
   * @returns {string} Professional description
   */
  getDefaultDescription(challengeType, targetValue = null) {
    switch (challengeType) {
      case 'sleep_efficiency':
        return `Demonstrate your commitment to quality sleep by maintaining an average sleep efficiency of ${targetValue || 85}% or higher over a 7-day period. Sleep efficiency measures the percentage of time spent asleep while in bed.`;
      case 'sleep_duration':
        return `Prioritize your sleep health by achieving an average of ${targetValue ? Math.round(targetValue / 3600) : 9} hours of sleep per night over a 7-day period. Consistent, adequate sleep is fundamental to overall wellness.`;
      case 'health':
      default:
        return 'Complete your personalized health goals and demonstrate consistency in your wellness journey. Track your progress and compete with others committed to healthy living.';
    }
  }
}

module.exports = new ChallengeService();
