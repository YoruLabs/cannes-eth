import { useState, useEffect } from 'react';
import { SleepMetricsService, ProcessedSleepStats } from '@/lib/services/sleepMetrics';

export interface UseSleepMetricsReturn {
  sleepStats: ProcessedSleepStats;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSleepMetrics(walletAddress: string | null): UseSleepMetricsReturn {
  const [sleepStats, setSleepStats] = useState<ProcessedSleepStats>(
    SleepMetricsService.processSleepMetricsForDisplay([])
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSleepMetrics = async () => {
    if (!walletAddress) {
      setSleepStats(SleepMetricsService.processSleepMetricsForDisplay([]));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const stats = await SleepMetricsService.getSleepMetricsSummary(walletAddress);
      setSleepStats(stats);
    } catch (err) {
      console.error('Error fetching sleep metrics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch sleep metrics');
      setSleepStats(SleepMetricsService.processSleepMetricsForDisplay([]));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSleepMetrics();
  }, [walletAddress]);

  return {
    sleepStats,
    isLoading,
    error,
    refetch: fetchSleepMetrics,
  };
} 