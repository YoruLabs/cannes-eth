"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import MobileScreen from "@/components/layouts/MobileScreen";
import { FlickeringGrid } from "@/components/magicui/flickering-grid";
import { CircleNotch } from "phosphor-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/providers/user-provider";

export default function ConnectPage() {
  const [ouraLoading, setOuraLoading] = useState(false);
  const [whoopLoading, setWhoopLoading] = useState(false);
  const [ouraDialogOpen, setOuraDialogOpen] = useState(false);
  const [whoopDialogOpen, setWhoopDialogOpen] = useState(false);
  const [ouraAuthUrl, setOuraAuthUrl] = useState("");
  const [whoopAuthUrl, setWhoopAuthUrl] = useState("");
  const [windowDimensions, setWindowDimensions] = useState({
    width: 375,
    height: 812,
  });
  
  const searchParams = useSearchParams();
  const { user } = useUser();

  // Handle OAuth redirect results
  useEffect(() => {
    const success = searchParams.get("success");
    if (success === "true") {
      toast.success("Device connected successfully!");
    } else if (success === "false") {
      toast.error("Failed to connect device. Please try again.");
    }
  }, [searchParams]);

  const handleOuraConnect = async () => {
    if (!user?.wallet_address) {
      toast.error("Please login first to connect your device.");
      return;
    }

    setOuraLoading(true);
    try {
      const response = await fetch("/api/terra/oura", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reference_id: user.wallet_address,
          auth_success_redirect_url: `${process.env.NEXT_PUBLIC_APP_ENV === "development" ? "https://world.org/mini-app?app_id=app_58d87e75f86ee1d5774b836e7190153d&path=/connect?success=true" : window.location.origin}/connect?success=true`,
          auth_failure_redirect_url: `${process.env.NEXT_PUBLIC_APP_ENV === "development" ? "https://world.org/mini-app?app_id=app_58d87e75f86ee1d5774b836e7190153d&path=/connect?success=false" : window.location.origin}/connect?success=false`,
        }),
      });

      console.log("Oura connection response:", response);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === "success" && data.auth_url) {
        setOuraAuthUrl(data.auth_url);
        setOuraDialogOpen(true);
      } else {
        throw new Error("Failed to get authentication URL");
      }
    } catch (error) {
      console.error("Oura connection error:", error);
      toast.error("Failed to connect Oura. Please try again.");
    } finally {
      setOuraLoading(false);
    }
  };

  const handleWhoopConnect = async () => {
    if (!user?.wallet_address) {
      toast.error("Please login first to connect your device.");
      return;
    }

    setWhoopLoading(true);
    try {
      const response = await fetch("/api/terra/whoop", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reference_id: user.wallet_address,
          auth_success_redirect_url: `${process.env.NEXT_PUBLIC_APP_ENV === "development" ? "https://world.org/mini-app?app_id=app_58d87e75f86ee1d5774b836e7190153d&path=/connect?success=true" : window.location.origin}/connect?success=true`,
          auth_failure_redirect_url: `${process.env.NEXT_PUBLIC_APP_ENV === "development" ? "https://world.org/mini-app?app_id=app_58d87e75f86ee1d5774b836e7190153d&path=/connect?success=false" : window.location.origin}/connect?success=false`,
        }),
      });

      console.log("Whoop connection response:", response);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === "success" && data.auth_url) {
        setWhoopAuthUrl(data.auth_url);
        setWhoopDialogOpen(true);
      } else {
        throw new Error("Failed to get authentication URL");
      }
    } catch (error) {
      console.error("Whoop connection error:", error);
      toast.error("Failed to connect Whoop. Please try again.");
    } finally {
      setWhoopLoading(false);
    }
  };

  const confirmOuraConnection = () => {
    window.open(ouraAuthUrl, "_blank");
    setOuraDialogOpen(false);
  };

  const confirmWhoopConnection = () => {
    window.open(whoopAuthUrl, "_blank");
    setWhoopDialogOpen(false);
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
      
      <div className="relative z-2 w-full min-h-screen flex flex-col px-6 pt-16 pb-8">
        {/* Header Section */}
        <div className="w-full mb-8">
          <div className="text-start">
            <p className="text-4xl font-bold text-gray-800 mb-3">Connect</p>
            <p className="text-gray-600 mb-6">Link your devices</p>
          </div>
        </div>

        {/* Connection buttons */}
        <div className="w-full max-w-md mx-auto space-y-4">
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
        </div>

        {/* Spacer to push content up */}
        <div className="flex-1"></div>
      </div>

      <Toaster />

      <AlertDialog open={ouraDialogOpen} onOpenChange={setOuraDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Connect to Oura</AlertDialogTitle>
            <AlertDialogDescription>
              You will be redirected to Oura&apos;s website to authorize the connection. Please click &quot;Confirm&quot; to proceed with the authentication process.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOuraDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmOuraConnection}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={whoopDialogOpen} onOpenChange={setWhoopDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Connect to Whoop</AlertDialogTitle>
            <AlertDialogDescription>
              You will be redirected to Whoop&apos;s website to authorize the connection. Please click &quot;Confirm&quot; to proceed with the authentication process.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setWhoopDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmWhoopConnection}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MobileScreen>
  );
} 