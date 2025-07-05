"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/providers/user-provider";
import { CircleNotch } from "phosphor-react";
import MobileScreen from "@/components/layouts/MobileScreen";
import { FlickeringGrid } from "@/components/magicui/flickering-grid";

export default function HomePage() {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [windowDimensions, setWindowDimensions] = useState({
    width: 375,
    height: 812,
  });
  const router = useRouter();
  const { user, isLoading } = useUser();

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
      // If user is authenticated, verified, and has username -> stay on home page
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

  // Show home page for fully authenticated and verified users
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
              <p className="text-4xl font-bold text-gray-800 mb-3">Home</p>
              <p className="text-gray-600 mb-6">Welcome back</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
            {/* Welcome Section */}
            <div className="text-center space-y-6">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-gray-900">
                  Hello, {user.username}! 👋
                </h2>
                <p className="text-lg text-gray-600">
                  Ready to track your health journey?
                </p>
              </div>

              {/* Simple Info Card */}
              <div className="bg-white/80 backdrop-blur-sm border border-gray-200 shadow-xl rounded-2xl p-6 w-full">
                <div className="text-center space-y-3">
                  <h3 className="text-xl font-semibold text-gray-800">
                    🌟 Your Health Dashboard
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Connect your devices and start monitoring your wellness data.
                  </p>
                </div>
              </div>

              {/* Quick Stats or Actions could go here */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 w-full">
                <p className="text-purple-800 text-sm text-center">
                  💡 Tip: Visit the Connect page to link your Oura or Whoop devices and start tracking your health metrics.
                </p>
              </div>
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