import { supabase } from '@/lib/supabase/client';

export interface Connection {
  id: string;
  provider: string;
  reference_id: string;
  active: boolean;
  last_webhook_update: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConnectionStatus {
  oura: Connection | null;
  whoop: Connection | null;
}

export class ConnectionsService {
  /**
   * Create a new connection record
   */
  static async createConnection(
    terraUserId: string,
    provider: string,
    referenceId: string
  ): Promise<Connection> {
    try {
      const { data, error } = await supabase
        .from('connections')
        .insert({
          id: terraUserId,
          provider: provider.toUpperCase(),
          reference_id: referenceId,
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating connection:', error);
        throw new Error(`Failed to create connection: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in createConnection:', error);
      throw error;
    }
  }

  /**
   * Update or create connection record (upsert)
   */
  static async upsertConnection(
    terraUserId: string,
    provider: string,
    referenceId: string
  ): Promise<Connection> {
    try {
      const { data, error } = await supabase
        .from('connections')
        .upsert({
          id: terraUserId,
          provider: provider.toUpperCase(),
          reference_id: referenceId,
          active: true,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        })
        .select()
        .single();

      if (error) {
        console.error('Error upserting connection:', error);
        throw new Error(`Failed to upsert connection: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in upsertConnection:', error);
      throw error;
    }
  }

  /**
   * Get all connections for a wallet address
   */
  static async getConnectionsByWalletAddress(walletAddress: string): Promise<Connection[]> {
    try {
      const { data, error } = await supabase
        .from('connections')
        .select('*')
        .eq('reference_id', walletAddress)
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching connections:', error);
        throw new Error(`Failed to fetch connections: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getConnectionsByWalletAddress:', error);
      throw error;
    }
  }

  /**
   * Get connection status for a wallet address (organized by provider)
   */
  static async getConnectionStatus(walletAddress: string): Promise<ConnectionStatus> {
    try {
      const connections = await this.getConnectionsByWalletAddress(walletAddress);
      
      return {
        oura: connections.find(conn => conn.provider === 'OURA') || null,
        whoop: connections.find(conn => conn.provider === 'WHOOP') || null,
      };
    } catch (error) {
      console.error('Error in getConnectionStatus:', error);
      throw error;
    }
  }

  /**
   * Get connection by wallet address and provider
   */
  static async getConnectionByWalletAndProvider(
    walletAddress: string, 
    provider: string
  ): Promise<Connection | null> {
    try {
      const { data, error } = await supabase
        .from('connections')
        .select('*')
        .eq('reference_id', walletAddress)
        .eq('provider', provider)
        .eq('active', true)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error fetching connection:', error);
        throw new Error(`Failed to fetch connection: ${error.message}`);
      }

      return data || null;
    } catch (error) {
      console.error('Error in getConnectionByWalletAndProvider:', error);
      throw error;
    }
  }

  /**
   * Check if a user has any active connections
   */
  static async hasActiveConnections(walletAddress: string): Promise<boolean> {
    try {
      const connections = await this.getConnectionsByWalletAddress(walletAddress);
      return connections.length > 0;
    } catch (error) {
      console.error('Error in hasActiveConnections:', error);
      return false;
    }
  }

  /**
   * Get connection count by provider
   */
  static async getConnectionCounts(walletAddress: string): Promise<{
    total: number;
    oura: number;
    whoop: number;
  }> {
    try {
      const connections = await this.getConnectionsByWalletAddress(walletAddress);
      
      return {
        total: connections.length,
        oura: connections.filter(conn => conn.provider === 'OURA').length,
        whoop: connections.filter(conn => conn.provider === 'WHOOP').length,
      };
    } catch (error) {
      console.error('Error in getConnectionCounts:', error);
      return { total: 0, oura: 0, whoop: 0 };
    }
  }
} 