"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MobileScreen from "@/components/layouts/MobileScreen";
import { FlickeringGrid } from "@/components/magicui/flickering-grid";
import { MiniKit } from "@worldcoin/minikit-js";

export default function HomePage() {
  const [windowDimensions, setWindowDimensions] = useState({
    width: 375,
    height: 812,
  });
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();

  // Check wallet connection on page load
  useEffect(() => {
    const checkWalletConnection = () => {
      // Small delay to ensure MiniKit is properly initialized
      setTimeout(() => {
        // Skip wallet check in test environment
        if (process.env.NEXT_PUBLIC_APP_ENV === "test") {
          setIsChecking(false);
          return;
        }

        if (!MiniKit.isInstalled() || !MiniKit.user?.walletAddress) {
          router.push("/login");
        } else {
          setIsChecking(false);
        }
      }, 500);
    };

    checkWalletConnection();
  }, [router]);

  // Show loading while checking wallet connection
  if (isChecking) {
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-4"></div>
          <p className="text-gray-600 font-medium">Checking wallet connection...</p>
        </div>
      </MobileScreen>
    );
  }

  // Show home page content (wallet is connected or in test environment)
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
            <p className="text-gray-600 mb-6">Welcome to Health Challenge</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
          {/* Welcome Section */}
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-gray-900">
                Hello! 👋
              </h2>
              <p className="text-lg text-gray-600">
                Ready to start your health journey?
              </p>
            </div>

            {/* Wallet Info Card */}
            <div className="bg-white/80 backdrop-blur-sm border border-gray-200 shadow-xl rounded-2xl p-6 w-full">
              <div className="text-center space-y-3">
                <h3 className="text-xl font-semibold text-gray-800">
                  {process.env.NEXT_PUBLIC_APP_ENV === "test" ? "🧪 Test Mode" : "🌟 Wallet Connected"}
                </h3>
                <p className="text-gray-600 text-sm">
                  {process.env.NEXT_PUBLIC_APP_ENV === "test" 
                    ? "Running in test environment" 
                    : "Your wallet is connected and ready for challenges!"}
                </p>
                {MiniKit.user?.walletAddress && (
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-green-800 text-xs font-mono break-all">
                      {MiniKit.user.walletAddress}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation Card */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 w-full">
              <p className="text-purple-800 text-sm text-center">
                💡 Visit the Challenges page to join health challenges and earn WLD rewards!
              </p>
            </div>
          </div>
        </div>
      </div>
    </MobileScreen>
  );
}