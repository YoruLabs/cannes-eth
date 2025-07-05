const logger = require('../config/logger');
const { ProcessedSleepMetricsSchema } = require('../schemas/sleepData');

class SleepDataProcessor {
  /**
   * Process raw Terra sleep data and extract relevant metrics for challenges
   * @param {Object} terraData - Raw Terra sleep data
   * @param {string} userId - User ID from Terra
   * @returns {Object} Processed sleep metrics
   */
  static processSleepData(terraData, userId) {
    try {
      logger.info('Processing sleep data for user', { userId });

      // Calculate total sleep duration
      const totalSleepDuration = this.calculateTotalSleepDuration(
        terraData.sleep_durations_data
      );

      // Extract heart rate metrics
      const heartRateMetrics = this.extractHeartRateMetrics(
        terraData.heart_rate_data
      );

      // Extract respiration metrics
      const respirationMetrics = this.extractRespirationMetrics(
        terraData.respiration_data
      );

      // Calculate sleep efficiency score
      const sleepEfficiency = this.calculateSleepEfficiency(
        terraData.sleep_durations_data
      );

      // Create consolidated metrics object
      const processedMetrics = {
        user_id: userId,
        start_time: terraData.metadata.start_time,
        end_time: terraData.metadata.end_time,
        total_sleep_duration_seconds: Math.round(totalSleepDuration),
        sleep_efficiency: Math.round(sleepEfficiency),
        deep_sleep_duration_seconds: Math.round(
          terraData.sleep_durations_data.asleep
            .duration_deep_sleep_state_seconds
        ),
        light_sleep_duration_seconds: Math.round(
          terraData.sleep_durations_data.asleep
            .duration_light_sleep_state_seconds
        ),
        rem_sleep_duration_seconds: Math.round(
          terraData.sleep_durations_data.asleep.duration_REM_sleep_state_seconds
        ),
        awake_duration_seconds: Math.round(
          terraData.sleep_durations_data.awake.duration_awake_state_seconds
        ),
        sleep_latency_seconds: Math.round(
          terraData.sleep_durations_data.awake.sleep_latency_seconds
        ),
        wake_up_latency_seconds: Math.round(
          terraData.sleep_durations_data.awake.wake_up_latency_seconds
        ),
        avg_heart_rate_bpm: heartRateMetrics.avgHeartRate
          ? Math.round(heartRateMetrics.avgHeartRate)
          : null,
        resting_heart_rate_bpm: heartRateMetrics.restingHeartRate
          ? Math.round(heartRateMetrics.restingHeartRate)
          : null,
        avg_hrv_rmssd: heartRateMetrics.avgHrvRmssd
          ? Math.round(heartRateMetrics.avgHrvRmssd)
          : null,
        avg_hrv_sdnn: heartRateMetrics.avgHrvSdnn
          ? Math.round(heartRateMetrics.avgHrvSdnn)
          : null,
        avg_oxygen_saturation: respirationMetrics.avgOxygenSaturation
          ? Math.round(respirationMetrics.avgOxygenSaturation)
          : null,
        avg_breathing_rate: respirationMetrics.avgBreathingRate
          ? Math.round(respirationMetrics.avgBreathingRate)
          : null,
        snoring_duration_seconds: respirationMetrics.snoringDuration
          ? Math.round(respirationMetrics.snoringDuration)
          : null,
        temperature_delta: terraData.temperature_data.delta || null,
        readiness_score: terraData.readiness_data.readiness
          ? Math.round(terraData.readiness_data.readiness)
          : null,
        recovery_level: Math.round(terraData.readiness_data.recovery_level),
        sleep_score: terraData.scores.sleep
          ? Math.round(terraData.scores.sleep)
          : null,
        created_at: new Date().toISOString(),
      };

      // Validate processed metrics
      const validatedMetrics =
        ProcessedSleepMetricsSchema.parse(processedMetrics);

      logger.info('Successfully processed sleep data', {
        userId,
        totalSleepDuration,
        sleepEfficiency,
      });

      return validatedMetrics;
    } catch (error) {
      logger.error('Error processing sleep data', {
        userId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Calculate total sleep duration in seconds
   */
  static calculateTotalSleepDuration(sleepDurationsData) {
    const asleep = sleepDurationsData.asleep.duration_asleep_state_seconds;
    const inBed = sleepDurationsData.other.duration_in_bed_seconds;
    return asleep + inBed;
  }

  /**
   * Extract heart rate related metrics
   */
  static extractHeartRateMetrics(heartRateData) {
    return {
      avgHeartRate: heartRateData.summary.avg_hr_bpm || null,
      restingHeartRate: heartRateData.summary.resting_hr_bpm || null,
      avgHrvRmssd: heartRateData.summary.avg_hrv_rmssd || null,
      avgHrvSdnn: heartRateData.summary.avg_hrv_sdnn || null,
      minHeartRate: heartRateData.summary.min_hr_bpm || null,
      maxHeartRate: heartRateData.summary.max_hr_bpm || null,
    };
  }

  /**
   * Extract respiration related metrics
   */
  static extractRespirationMetrics(respirationData) {
    return {
      avgOxygenSaturation:
        respirationData.oxygen_saturation_data.avg_saturation_percentage || null,
      avgBreathingRate: respirationData.breaths_data.avg_breaths_per_min || null,
      snoringDuration:
        respirationData.snoring_data.total_snoring_duration_seconds || null,
      snoringEvents: respirationData.snoring_data.num_snoring_events || null,
    };
  }

  /**
   * Extract sleep stage metrics
   */
  static extractSleepStageMetrics(sleepDurationsData) {
    return {
      deepSleepDuration:
        sleepDurationsData.asleep.duration_deep_sleep_state_seconds,
      lightSleepDuration:
        sleepDurationsData.asleep.duration_light_sleep_state_seconds,
      remSleepDuration:
        sleepDurationsData.asleep.duration_REM_sleep_state_seconds,
      awakeDuration: sleepDurationsData.awake.duration_awake_state_seconds,
      remEvents: sleepDurationsData.asleep.num_REM_events || 0,
      wakeupEvents: sleepDurationsData.awake.num_wakeup_events,
    };
  }

  /**
   * Calculate sleep efficiency score (0-100)
   */
  static calculateSleepEfficiency(sleepDurationsData) {
    const totalTimeInBed =
      sleepDurationsData.asleep.duration_asleep_state_seconds +
      sleepDurationsData.awake.duration_awake_state_seconds +
      sleepDurationsData.other.duration_in_bed_seconds;

    const actualSleepTime =
      sleepDurationsData.asleep.duration_asleep_state_seconds;

    if (totalTimeInBed === 0) return 0;

    const efficiency = (actualSleepTime / totalTimeInBed) * 100;
    return Math.min(100, Math.max(0, efficiency));
  }

  /**
   * Calculate challenge-ready metrics for competition
   */
  static calculateChallengeMetrics(processedMetrics) {
    return {
      sleepQualityScore: this.calculateSleepQualityScore(processedMetrics),
      recoveryScore: this.calculateRecoveryScore(processedMetrics),
      efficiencyScore: this.calculateEfficiencyScore(processedMetrics),
      healthScore: this.calculateHealthScore(processedMetrics),
    };
  }

  /**
   * Calculate overall sleep quality score (0-100)
   */
  static calculateSleepQualityScore(metrics) {
    const factors = {
      sleepEfficiency: metrics.sleep_efficiency * 0.3,
      deepSleepRatio:
        (metrics.deep_sleep_duration_seconds /
          metrics.total_sleep_duration_seconds) *
        100 *
        0.25,
      remSleepRatio:
        (metrics.rem_sleep_duration_seconds /
          metrics.total_sleep_duration_seconds) *
        100 *
        0.25,
      sleepLatency:
        Math.max(0, 100 - (metrics.sleep_latency_seconds / 60) * 10) * 0.2,
    };

    return Object.values(factors).reduce((sum, score) => sum + score, 0);
  }

  /**
   * Calculate recovery score based on HRV and readiness
   */
  static calculateRecoveryScore(metrics) {
    const hrvScore = metrics.avg_hrv_rmssd
      ? Math.min(100, (metrics.avg_hrv_rmssd / 100) * 100)
      : 0;
    const readinessScore = metrics.readiness_score || 0;

    return hrvScore * 0.6 + readinessScore * 0.4;
  }

  /**
   * Calculate efficiency score
   */
  static calculateEfficiencyScore(metrics) {
    return metrics.sleep_efficiency;
  }

  /**
   * Calculate overall health score
   */
  static calculateHealthScore(metrics) {
    const factors = {
      heartRate: metrics.avg_heart_rate_bpm
        ? Math.max(0, 100 - Math.abs(metrics.avg_heart_rate_bpm - 60) * 2) *
          0.25
        : 0,
      oxygenSaturation: metrics.avg_oxygen_saturation
        ? Math.max(0, metrics.avg_oxygen_saturation - 90) * 10 * 0.25
        : 0,
      breathingRate: metrics.avg_breathing_rate
        ? Math.max(0, 100 - Math.abs(metrics.avg_breathing_rate - 12) * 5) *
          0.25
        : 0,
      snoring: metrics.snoring_duration_seconds
        ? Math.max(0, 100 - (metrics.snoring_duration_seconds / 60) * 10) * 0.25
        : 0,
    };

    return Object.values(factors).reduce((sum, score) => sum + score, 0);
  }
}

module.exports = SleepDataProcessor;
