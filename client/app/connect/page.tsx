"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import MobileScreen from "@/components/layouts/MobileScreen";
import { FlickeringGrid } from "@/components/magicui/flickering-grid";
import { CircleNotch } from "phosphor-react";
import { cn } from "@/lib/utils";

export default function ConnectPage() {
  const [ouraLoading, setOuraLoading] = useState(false);
  const [whoopLoading, setWhoopLoading] = useState(false);
  const [windowDimensions, setWindowDimensions] = useState({
    width: 375,
    height: 812,
  });

  const handleOuraConnect = async () => {
    setOuraLoading(true);
    try {
      // Simulate connection process
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success("Oura connected successfully!");
    } catch (error) {
      toast.error("Failed to connect Oura. Please try again.");
    } finally {
      setOuraLoading(false);
    }
  };

  const handleWhoopConnect = async () => {
    setWhoopLoading(true);
    try {
      // Simulate connection process
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success("Whoop connected successfully!");
    } catch (error) {
      toast.error("Failed to connect Whoop. Please try again.");
    } finally {
      setWhoopLoading(false);
    }
  };

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
      
      <div className="relative z-2 w-full h-screen flex flex-col items-center justify-center pt-24 pb-16">
        {/* Header */}
        <div className="absolute top-[15%] left-[7%] flex flex-col items-start justify-center z-2">
          <div className="text-6xl text-gray-700">Connect</div>
          <div className="text-lg text-gray-500 mt-2">Link your devices</div>
        </div>

        {/* Connection buttons */}
        <section className="mt-auto space-y-4 w-full max-w-md mx-auto px-6">
          {/* Oura Connect Button */}
          <button
            onClick={handleOuraConnect}
            disabled={ouraLoading || whoopLoading}
            className={cn(
              `w-full h-16 rounded-2xl text-lg uppercase transition-all duration-300
                active:scale-[0.95] flex items-center justify-center gap-3 shadow-lg`,
              ouraLoading || whoopLoading
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : `bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 
                  text-white shadow-purple-500/30 hover:shadow-purple-600/40`
            )}
          >
            {ouraLoading ? (
              <>
                <CircleNotch className="w-6 h-6 animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-bold text-sm">O</span>
                </div>
                <span>Connect Oura</span>
              </>
            )}
          </button>

          {/* Whoop Connect Button */}
          <button
            onClick={handleWhoopConnect}
            disabled={ouraLoading || whoopLoading}
            className={cn(
              `w-full h-16 rounded-2xl text-lg uppercase transition-all duration-300
                active:scale-[0.95] flex items-center justify-center gap-3 shadow-lg`,
              ouraLoading || whoopLoading
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : `bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 
                  text-white shadow-yellow-500/30 hover:shadow-yellow-600/40`
            )}
          >
            {whoopLoading ? (
              <>
                <CircleNotch className="w-6 h-6 animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 font-bold text-sm">W</span>
                </div>
                <span>Connect Whoop</span>
              </>
            )}
          </button>
        </section>

        {/* Info section */}
        <div className="mt-8 px-6 w-full max-w-md mx-auto">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm text-center">
              Connect your fitness devices to sync your health data and unlock personalized insights.
            </p>
          </div>
        </div>
      </div>

      <Toaster />
    </MobileScreen>
  );
} 