"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  AuthState,
  UserData,
  createUserSession,
  deleteAccount as deleteUserAccount,
  getProfileByWallet,
  updateUserProfile,
} from "@/lib/services/auth";

interface UserContextType extends AuthState {
  login: (
    walletAddress: string,
    username?: string,
    worldIdData?: {
      world_id?: string;
      nullifier_hash?: string;
      verification_level?: string;
      is_verified?: boolean;
    }
  ) => Promise<UserData>;
  logout: () => void;
  deleteAccount: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  updateUser: (
    walletAddress: string,
    updateData: {
      username?: string;
      world_id?: string;
      nullifier_hash?: string;
      verification_level?: string;
      is_verified?: boolean;
      points?: number;
    }
  ) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Load user data from localStorage on mount
  useEffect(() => {
    const loadStoredUser = async () => {
      console.log("=== USER PROVIDER DEBUG ===");
      console.log("Loading stored user data...");

      try {
        const storedUser = localStorage.getItem("ailingo_user");
        console.log(
          "Stored user from localStorage:",
          storedUser ? JSON.parse(storedUser) : null
        );

        if (storedUser) {
          const userData = JSON.parse(storedUser) as UserData;
          console.log("Setting user from localStorage:", userData);
          setUser(userData);

          // Verify user still exists in database
          console.log("Fetching fresh user data from database...");
          const profile = await getProfileByWallet(userData.wallet_address);
          console.log("Database profile:", profile);

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
            };
            console.log("Updated user data from database:", updatedUserData);
            setUser(updatedUserData);
            localStorage.setItem(
              "ailingo_user",
              JSON.stringify(updatedUserData)
            );
          } else {
            // User no longer exists, clear storage
            console.log("User no longer exists in database, clearing storage");
            localStorage.removeItem("ailingo_user");
            setUser(null);
          }
        } else {
          console.log("No stored user found");
        }
      } catch (error) {
        console.error("Error loading stored user data:", error);
        // Clear corrupted data
        localStorage.removeItem("ailingo_user");
        setUser(null);
      } finally {
        console.log(
          "User provider loading complete, setting isLoading to false"
        );
        setIsLoading(false);
      }
    };

    loadStoredUser();
  }, []);

  // Login function
  const login = async (
    walletAddress: string,
    username?: string,
    worldIdData?: {
      world_id?: string;
      nullifier_hash?: string;
      verification_level?: string;
      is_verified?: boolean;
    }
  ): Promise<UserData> => {
    setIsLoading(true);
    try {
      // Create or get user session from Supabase
      const userData = await createUserSession(
        walletAddress,
        username,
        worldIdData
      );

      setUser(userData);
      localStorage.setItem("ailingo_user", JSON.stringify(userData));

      console.log("User logged in successfully:", userData);
      return userData;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem("ailingo_user");
    console.log("User logged out");
  };

  // Refresh user data
  const refreshUserData = async () => {
    if (!user) return;

    try {
      // Get fresh user data from database
      const profile = await getProfileByWallet(user.wallet_address);
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
        };
        setUser(updatedUserData);
        localStorage.setItem("ailingo_user", JSON.stringify(updatedUserData));
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  };

  // Delete account
  const deleteAccount = async () => {
    if (!user) return;

    try {
      await deleteUserAccount(user.wallet_address);
      setUser(null);
      localStorage.removeItem("ailingo_user");
      console.log("Account deleted");
    } catch (error) {
      console.error("Error deleting account:", error);
      throw error;
    }
  };

  // Update user profile
  const updateUser = async (
    walletAddress: string,
    updateData: {
      username?: string;
      world_id?: string;
      nullifier_hash?: string;
      verification_level?: string;
      is_verified?: boolean;
      points?: number;
    }
  ) => {
    try {
      const updatedUserData = await updateUserProfile(
        walletAddress,
        updateData
      );
      setUser(updatedUserData);
      localStorage.setItem("ailingo_user", JSON.stringify(updatedUserData));
      console.log("User updated successfully:", updatedUserData);
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  };

  const contextValue: UserContextType = {
    user,
    isLoading,
    login,
    logout,
    deleteAccount,
    refreshUserData,
    updateUser,
  };

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
}