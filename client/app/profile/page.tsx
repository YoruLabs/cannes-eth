"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/providers/user-provider";
import { CircleNotch } from "phosphor-react";
import { LogOut, Shield, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import MobileScreen from "@/components/layouts/MobileScreen";
import { FlickeringGrid } from "@/components/magicui/flickering-grid";

export default function ProfilePage() {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [windowDimensions, setWindowDimensions] = useState({
    width: 375,
    height: 812,
  });
  const router = useRouter();
  const { user, isLoading, logout } = useUser();

  /***** AUTH REDIRECTS *****/
  useEffect(() => {
    if (isLoading) return; // wait for user fetch

    const redirect = async () => {
      setIsRedirecting(true);
      
      // Small delay to prevent redirect flashing
      await new Promise(resolve => setTimeout(resolve, 100));

      if (!user) {
        // Not authenticated -> go to login
        router.push("/login");
      } else if (!user.is_verified || !user.username) {
        // User is authenticated but not verified or missing username -> go to onboarding
        router.push("/onboarding");
      }
    };

    if (!user || !user.is_verified || !user.username) {
      redirect();
    }
  }, [user, isLoading, router]);

  /***** LOADING STATE *****/
  if (isLoading || isRedirecting) {
    return (
      <MobileScreen className="relative flex flex-col bg-gradient-to-br from-transparent via-slate-50 to-slate-100 overflow-hidden">
        <FlickeringGrid
          className="absolute inset-0 z-0"
          squareSize={5}
          gridGap={3}
          color="#000000"
          maxOpacity={0.03}
          flickerChance={0.05}
          height={windowDimensions.height}
          width={windowDimensions.width}
        />
        <div className="relative z-2 flex-1 flex flex-col items-center justify-center">
          <CircleNotch className="h-8 w-8 animate-spin text-purple-500 mb-4" />
          <p className="text-gray-600 font-medium">
            {isRedirecting ? "Redirecting..." : "Loading..."}
          </p>
        </div>
      </MobileScreen>
    );
  }

  // Show profile page for fully authenticated and verified users
  if (user && user.is_verified && user.username) {
    return (
      <MobileScreen className="relative flex flex-col bg-gradient-to-br from-transparent via-slate-50 to-slate-100 overflow-hidden">
        <FlickeringGrid
          className="absolute inset-0 z-0"
          squareSize={5}
          gridGap={3}
          color="#000000"
          maxOpacity={0.03}
          flickerChance={0.05}
          height={windowDimensions.height}
          width={windowDimensions.width}
        />
        
        <div className="relative z-2 w-full min-h-screen flex flex-col px-6 pt-16 pb-8">
          {/* Header Section */}
          <div className="w-full mb-8">
            <div className="text-start">
              <p className="text-4xl font-bold text-gray-800 mb-3">Profile</p>
              <p className="text-gray-600 mb-6">Your account information</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center space-y-8 max-w-md mx-auto w-full">
            {/* Welcome Section */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">
                Welcome! 🌍
              </h2>
              <p className="text-lg text-gray-600">
                Hello, <span className="font-semibold text-purple-600">{user.username}</span>!
              </p>
            </div>

            {/* User Info Card */}
            <div className="bg-white/80 backdrop-blur-sm border border-gray-200 shadow-xl rounded-2xl p-6 w-full">
              <div className="space-y-4">
                {/* Verification Status */}
                <div className="flex items-center justify-center space-x-2 p-3 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50">
                  <ShieldCheck className="h-5 w-5 text-green-600" />
                  <span className="text-green-700 font-medium">World ID Verified</span>
                </div>

                {/* User Details */}
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Wallet Address:</span>
                    <span className="font-mono text-gray-800">
                      {user.wallet_address.slice(0, 6)}...{user.wallet_address.slice(-4)}
                    </span>
                  </div>
                  
                  {user.verification_level && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Verification Level:</span>
                      <span className="text-gray-800 capitalize">{user.verification_level}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Member Since:</span>
                    <span className="text-gray-800">
                      {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Section */}
            <div className="space-y-4 w-full">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  🎉 Your World authentication is working perfectly! This is a clean starter app with user authentication and World ID verification.
                </p>
              </div>
              
              <Button 
                onClick={logout}
                variant="outline"
                className="w-full h-12 text-base"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>

          {/* Spacer to push content up */}
          <div className="flex-1"></div>
        </div>
      </MobileScreen>
    );
  }

  return null;
} 