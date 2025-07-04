import { supabase } from '@/lib/supabase/client'
import { Database } from '@/lib/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

export interface UserData {
  wallet_address: string
  username: string
  world_id: string | null
  nullifier_hash: string | null
  verification_level: string | null
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface AuthState {
  user: UserData | null
  isLoading: boolean
}

// Get user profile by wallet address
export async function getProfileByWallet(walletAddress: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No user found
        return null
      }
      throw error
    }

    return data
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return null
  }
}

// Create or update user session after World ID verification
export async function createUserSession(
  walletAddress: string, 
  username?: string,
  worldIdData?: {
    world_id?: string
    nullifier_hash?: string
    verification_level?: string
    is_verified?: boolean
  }
): Promise<UserData> {
  try {
    // First, try to get existing user
    let profile = await getProfileByWallet(walletAddress)

    if (!profile) {
      // Create new user
      if (!username) {
        throw new Error('Username is required for new users')
      }

      const { data, error } = await supabase
        .from('profiles')
        .insert({
          wallet_address: walletAddress,
          username: username,
          world_id: worldIdData?.world_id || null,
          nullifier_hash: worldIdData?.nullifier_hash || null,
          verification_level: worldIdData?.verification_level || null,
          is_verified: worldIdData?.is_verified || false,
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      profile = data
    } else {
      // Update existing user with new data
      const updateData: any = {}
      
      if (username && profile.username !== username) {
        updateData.username = username
      }
      
      if (worldIdData) {
        if (worldIdData.world_id) updateData.world_id = worldIdData.world_id
        if (worldIdData.nullifier_hash) updateData.nullifier_hash = worldIdData.nullifier_hash
        if (worldIdData.verification_level) updateData.verification_level = worldIdData.verification_level
        if (worldIdData.is_verified !== undefined) updateData.is_verified = worldIdData.is_verified
      }

      if (Object.keys(updateData).length > 0) {
        const { data, error } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('wallet_address', walletAddress)
          .select()
          .single()

        if (error) {
          throw error
        }

        profile = data
      }
    }

    // At this point, profile is guaranteed to be non-null
    if (!profile) {
      throw new Error('Failed to create or retrieve user profile')
    }

    return {
      wallet_address: profile.wallet_address,
      username: profile.username,
      world_id: profile.world_id,
      nullifier_hash: profile.nullifier_hash,
      verification_level: profile.verification_level,
      is_verified: profile.is_verified,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    }
  } catch (error) {
    console.error('Error creating user session:', error)
    throw error
  }
}

// Delete user account
export async function deleteAccount(walletAddress: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('wallet_address', walletAddress)

    if (error) {
      throw error
    }
  } catch (error) {
    console.error('Error deleting account:', error)
    throw error
  }
} 