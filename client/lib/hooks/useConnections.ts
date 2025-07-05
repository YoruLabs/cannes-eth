import { useState, useEffect, useCallback } from 'react';
import { ConnectionsService, Connection, ConnectionStatus } from '@/lib/services/connections';

export function useConnections(walletAddress: string | null) {
  const [connections, setConnections] = useState<ConnectionStatus>({
    oura: null,
    whoop: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConnections = useCallback(async () => {
    if (!walletAddress) {
      setConnections({ oura: null, whoop: null });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const connectionStatus = await ConnectionsService.getConnectionStatus(walletAddress);
      setConnections(connectionStatus);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch connections';
      setError(errorMessage);
      console.error('Error fetching connections:', err);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const hasOuraConnection = connections.oura !== null;
  const hasWhoopConnection = connections.whoop !== null;
  const hasAnyConnection = hasOuraConnection || hasWhoopConnection;

  return {
    connections,
    loading,
    error,
    refetch: fetchConnections,
    hasOuraConnection,
    hasWhoopConnection,
    hasAnyConnection,
  };
} 