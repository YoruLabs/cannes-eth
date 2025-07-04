"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { AuthState, UserData, createUserSession, deleteAccount as deleteUserAccount, getProfileByWallet } from '@/lib/services/auth'

interface UserContextType extends AuthState {
  login: (
    walletAddress: string, 
    username?: string,
    worldIdData?: {
      world_id?: string
      nullifier_hash?: string
      verification_level?: string
      is_verified?: boolean
    }
  ) => Promise<void>
  logout: () => void
  deleteAccount: () => Promise<void>
  refreshUserData: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

interface UserProviderProps {
  children: ReactNode
}

export function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user

  // Load user data from localStorage on mount
  useEffect(() => {
    const loadStoredUser = async () => {
      try {
        const storedUser = localStorage.getItem('ailingo_user')
        
        if (storedUser) {
          const userData = JSON.parse(storedUser) as UserData
          setUser(userData)
          
          // Verify user still exists in database
          const profile = await getProfileByWallet(userData.wallet_address)
          if (profile) {
            const updatedUserData: UserData = {
              wallet_address: profile.wallet_address,
              username: profile.username,
              world_id: profile.world_id,
              nullifier_hash: profile.nullifier_hash,
              verification_level: profile.verification_level,
              is_verified: profile.is_verified,
              created_at: profile.created_at,
              updated_at: profile.updated_at,
            }
            setUser(updatedUserData)
            localStorage.setItem('ailingo_user', JSON.stringify(updatedUserData))
          } else {
            // User no longer exists, clear storage
            localStorage.removeItem('ailingo_user')
            setUser(null)
          }
        }
      } catch (error) {
        console.error('Error loading stored user data:', error)
        // Clear corrupted data
        localStorage.removeItem('ailingo_user')
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadStoredUser()
  }, [])

  // Login function
  const login = async (
    walletAddress: string, 
    username?: string,
    worldIdData?: {
      world_id?: string
      nullifier_hash?: string
      verification_level?: string
      is_verified?: boolean
    }
  ) => {
    setIsLoading(true)
    try {
      // Create or get user session from Supabase
      const userData = await createUserSession(walletAddress, username, worldIdData)
      
      setUser(userData)
      localStorage.setItem('ailingo_user', JSON.stringify(userData))
      
      console.log('User logged in successfully:', userData)
    } catch (error) {
      console.error('Login error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Logout function
  const logout = () => {
    setUser(null)
    localStorage.removeItem('ailingo_user')
    console.log('User logged out')
  }

  // Refresh user data
  const refreshUserData = async () => {
    if (!user) return
    
    try {
      // Get fresh user data from database
      const profile = await getProfileByWallet(user.wallet_address)
      if (profile) {
        const updatedUserData: UserData = {
          wallet_address: profile.wallet_address,
          username: profile.username,
          world_id: profile.world_id,
          nullifier_hash: profile.nullifier_hash,
          verification_level: profile.verification_level,
          is_verified: profile.is_verified,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
        }
        setUser(updatedUserData)
        localStorage.setItem('ailingo_user', JSON.stringify(updatedUserData))
      }
    } catch (error) {
      console.error('Error refreshing user data:', error)
    }
  }

  // Delete account
  const deleteAccount = async () => {
    if (!user) return
    
    try {
      await deleteUserAccount(user.wallet_address)
      setUser(null)
      localStorage.removeItem('ailingo_user')
      console.log('Account deleted')
    } catch (error) {
      console.error('Error deleting account:', error)
      throw error
    }
  }

  const contextValue: UserContextType = {
    user,
    isLoading,
    login,
    logout,
    deleteAccount,
    refreshUserData,
  }

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  )
} 