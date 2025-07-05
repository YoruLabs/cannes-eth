import { supabase } from "@/lib/supabase/client";

export interface SleepMetrics {
  id: string;
  user_id: string;
  session_id: string;
  start_time: string;
  end_time: string;
  total_sleep_duration_seconds: number;
  sleep_efficiency: number;
  deep_sleep_duration_seconds: number;
  light_sleep_duration_seconds: number;
  rem_sleep_duration_seconds: number;
  awake_duration_seconds: number;
  sleep_latency_seconds: number;
  wake_up_latency_seconds: number;
  avg_heart_rate_bpm: number;
  resting_heart_rate_bpm: number;
  avg_hrv_rmssd: number;
  avg_hrv_sdnn: number;
  avg_oxygen_saturation: number;
  avg_breathing_rate: number;
  snoring_duration_seconds: number;
  temperature_delta: number;
  readiness_score: number;
  recovery_level: number;
  sleep_score: number;
  sleep_quality_score: number;
  recovery_score: number;
  efficiency_score: number;
  health_score: number;
  created_at: string;
}

export interface HistoricalDataPoint {
  date: string;
  sleep_duration: number;
  sleep_efficiency: number;
  sleep_score: number;
  recovery_score: number;
  resting_hr: number;
  hrv: number;
  deep_sleep_minutes: number;
  rem_sleep_minutes: number;
  light_sleep_minutes: number;
}

export interface ProcessedSleepStats {
  // Current/Latest metrics (single values)
  current: {
    sleep: {
      lastNight: {
        duration: string;
        efficiency: number;
        score: number;
      };
      heartRate: {
        resting: number;
        average: number;
        max: number;
      };
      recovery: {
        score: number;
        hrv: number;
        readiness: number;
      };
    };
  };
  
  // Historical data for charts (arrays)
  historical: {
    last7Days: HistoricalDataPoint[];
    last30Days: HistoricalDataPoint[];
  };
  
  // Summary stats
  summary: {
    weeklyAverage: {
      duration: string;
      efficiency: number;
      score: number;
    };
    trends: {
      sleepDuration: 'improving' | 'declining' | 'stable';
      efficiency: 'improving' | 'declining' | 'stable';
      recovery: 'improving' | 'declining' | 'stable';
    };
  };
  
  hasData: boolean;
}

export class SleepMetricsService {
  /**
   * Get sleep metrics for a user based on their wallet address
   */
  static async getSleepMetricsByWalletAddress(
    walletAddress: string,
    limit: number = 10
  ): Promise<SleepMetrics[]> {
    try {
      // First, get the Terra user IDs for this wallet address from connections
      const { data: connections, error: connectionsError } = await supabase
        .from('connections')
        .select('id')
        .eq('reference_id', walletAddress)
        .eq('active', true);

      if (connectionsError) {
        console.error('Error fetching connections:', connectionsError);
        throw new Error(`Failed to fetch connections: ${connectionsError.message}`);
      }

      if (!connections || connections.length === 0) {
        console.log('No active connections found for wallet address:', walletAddress);
        return [];
      }

      // Extract Terra user IDs
      const terraUserIds = connections.map(conn => conn.id);

      // Get sleep metrics for all connected devices
      const { data: sleepMetrics, error: metricsError } = await supabase
        .from('sleep_metrics')
        .select('*')
        .in('user_id', terraUserIds)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (metricsError) {
        console.error('Error fetching sleep metrics:', metricsError);
        throw new Error(`Failed to fetch sleep metrics: ${metricsError.message}`);
      }

      return sleepMetrics || [];
    } catch (error) {
      console.error('Error in getSleepMetricsByWalletAddress:', error);
      throw error;
    }
  }

  /**
   * Get latest sleep metrics for a user
   */
  static async getLatestSleepMetrics(walletAddress: string): Promise<SleepMetrics | null> {
    try {
      const metrics = await this.getSleepMetricsByWalletAddress(walletAddress, 1);
      return metrics.length > 0 ? metrics[0] : null;
    } catch (error) {
      console.error('Error in getLatestSleepMetrics:', error);
      return null;
    }
  }

  /**
   * Process raw sleep metrics into historical data points for charts
   */
  static processHistoricalData(metrics: SleepMetrics[]): HistoricalDataPoint[] {
    return metrics.map(metric => ({
      date: new Date(metric.created_at).toISOString().split('T')[0], // YYYY-MM-DD format
      sleep_duration: Math.round(metric.total_sleep_duration_seconds / 3600 * 10) / 10, // Convert to hours with 1 decimal
      sleep_efficiency: Math.round(metric.sleep_efficiency),
      sleep_score: Math.round(metric.sleep_score || metric.sleep_quality_score || 0),
      recovery_score: Math.round(metric.recovery_score || metric.readiness_score || 0),
      resting_hr: Math.round(metric.resting_heart_rate_bpm),
      hrv: Math.round(metric.avg_hrv_rmssd || 0),
      deep_sleep_minutes: Math.round(metric.deep_sleep_duration_seconds / 60),
      rem_sleep_minutes: Math.round(metric.rem_sleep_duration_seconds / 60),
      light_sleep_minutes: Math.round(metric.light_sleep_duration_seconds / 60),
    })).reverse(); // Reverse to get chronological order for charts
  }

  /**
   * Calculate trends based on historical data
   */
  static calculateTrends(data: HistoricalDataPoint[]): {
    sleepDuration: 'improving' | 'declining' | 'stable';
    efficiency: 'improving' | 'declining' | 'stable';
    recovery: 'improving' | 'declining' | 'stable';
  } {
    if (data.length < 2) {
      return {
        sleepDuration: 'stable',
        efficiency: 'stable',
        recovery: 'stable',
      };
    }

    const first = data[0];
    const last = data[data.length - 1];
    
    const getTrend = (firstValue: number, lastValue: number, threshold: number = 0.1) => {
      const change = (lastValue - firstValue) / firstValue;
      if (change > threshold) return 'improving';
      if (change < -threshold) return 'declining';
      return 'stable';
    };

    return {
      sleepDuration: getTrend(first.sleep_duration, last.sleep_duration, 0.05),
      efficiency: getTrend(first.sleep_efficiency, last.sleep_efficiency, 0.05),
      recovery: getTrend(first.recovery_score, last.recovery_score, 0.1),
    };
  }

  /**
   * Process raw sleep metrics into comprehensive display format
   */
  static processSleepMetricsForDisplay(metrics: SleepMetrics[]): ProcessedSleepStats {
    if (!metrics || metrics.length === 0) {
      return {
        current: {
          sleep: {
            lastNight: {
              duration: "0h 0m",
              efficiency: 0,
              score: 0,
            },
            heartRate: {
              resting: 0,
              average: 0,
              max: 0,
            },
            recovery: {
              score: 0,
              hrv: 0,
              readiness: 0,
            },
          },
        },
        historical: {
          last7Days: [],
          last30Days: [],
        },
        summary: {
          weeklyAverage: {
            duration: "0h 0m",
            efficiency: 0,
            score: 0,
          },
          trends: {
            sleepDuration: 'stable',
            efficiency: 'stable',
            recovery: 'stable',
          },
        },
        hasData: false,
      };
    }

    const latest = metrics[0];
    
    // Process historical data
    const last7Days = this.processHistoricalData(metrics.slice(0, 7));
    const last30Days = this.processHistoricalData(metrics.slice(0, 30));
    
    // Calculate weekly averages
    const weeklyMetrics = metrics.slice(0, 7);
    const weeklyAvgDuration = weeklyMetrics.reduce((sum, m) => sum + m.total_sleep_duration_seconds, 0) / weeklyMetrics.length;
    const weeklyAvgEfficiency = weeklyMetrics.reduce((sum, m) => sum + m.sleep_efficiency, 0) / weeklyMetrics.length;
    const weeklyAvgScore = weeklyMetrics.reduce((sum, m) => sum + (m.sleep_score || m.sleep_quality_score || 0), 0) / weeklyMetrics.length;

    // Calculate trends
    const trends = this.calculateTrends(last7Days);

    return {
      current: {
        sleep: {
          lastNight: {
            duration: this.formatDuration(latest.total_sleep_duration_seconds),
            efficiency: Math.round(latest.sleep_efficiency),
            score: Math.round(latest.sleep_score || latest.sleep_quality_score || 0),
          },
          heartRate: {
            resting: Math.round(latest.resting_heart_rate_bpm),
            average: Math.round(latest.avg_heart_rate_bpm),
            max: Math.round(latest.avg_heart_rate_bpm * 1.8), // Estimate max HR
          },
          recovery: {
            score: Math.round(latest.recovery_score || latest.readiness_score || 0),
            hrv: Math.round(latest.avg_hrv_rmssd || 0),
            readiness: Math.round(latest.readiness_score || 0),
          },
        },
      },
      historical: {
        last7Days,
        last30Days,
      },
      summary: {
        weeklyAverage: {
          duration: this.formatDuration(weeklyAvgDuration),
          efficiency: Math.round(weeklyAvgEfficiency),
          score: Math.round(weeklyAvgScore),
        },
        trends,
      },
      hasData: true,
    };
  }

  /**
   * Format duration in seconds to "Xh Ym" format
   */
  private static formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }

  /**
   * Get comprehensive sleep metrics summary for a user
   */
  static async getSleepMetricsSummary(walletAddress: string): Promise<ProcessedSleepStats> {
    try {
      const metrics = await this.getSleepMetricsByWalletAddress(walletAddress, 30); // Last 30 days
      return this.processSleepMetricsForDisplay(metrics);
    } catch (error) {
      console.error('Error in getSleepMetricsSummary:', error);
      // Return empty stats on error
      return this.processSleepMetricsForDisplay([]);
    }
  }
} 