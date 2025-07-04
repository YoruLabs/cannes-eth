"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MiniKit } from "@worldcoin/minikit-js";
import { useUser } from "@/providers/user-provider";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import MobileScreen from "@/components/layouts/MobileScreen";
import { FlickeringGrid } from "@/components/magicui/flickering-grid";
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";
import { 
  ArrowRight,
  Globe,
  Shield,
  User,
  CircleNotch,
  CheckCircle
} from "phosphor-react";
import { cn } from "@/lib/utils";

type OnboardingStep = "verification" | "verifying" | "username" | "complete";

interface OnboardingData {
  username: string;
}

export default function OnboardingPage() {
  const [step, setStep] = useState<OnboardingStep>("verification");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    username: "",
  });
  const [isTestMode, setIsTestMode] = useState(false);
  const [windowDimensions, setWindowDimensions] = useState({
    width: 375,
    height: 812,
  });

  const { user, updateUser } = useUser();
  const router = useRouter();

  // Set window dimensions
  useEffect(() => {
    if (typeof window !== "undefined") {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });

      const handleResize = () => {
        setWindowDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  // Check if in test mode
  useEffect(() => {
    setIsTestMode(process.env.NEXT_PUBLIC_APP_MODE === "test");
  }, []);

  const handleTestVerification = async () => {
    setVerifyLoading(true);
    setStep("verifying");
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (user) {
        await updateUser(user.wallet_address, {
          is_verified: true,
          world_id: "test_world_id_" + Date.now(),
          nullifier_hash: "test_nullifier_" + Date.now(),
          verification_level: "orb",
        });
      }
      
      toast.success("Verification successful!");
      setStep("username");
    } catch (error) {
      toast.error("Verification failed");
      setStep("verification");
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleWorldIdVerify = async () => {
    if (isTestMode) {
      return handleTestVerification();
    }

    setVerifyLoading(true);
    setStep("verifying");

    try {
      if (!MiniKit.isInstalled()) {
        toast.error("MiniKit is not installed");
        setStep("verification");
        return;
      }

      if (user?.is_verified) {
        setStep("username");
        return;
      }

      const actionName = process.env.NEXT_PUBLIC_WLD_ACTION_NAME;
      if (!actionName) {
        toast.error("Action name not configured. Please contact support.");
        setStep("verification");
        return;
      }

      let verificationLevel: "orb" | "device" = "orb";
      let finalPayload: any;
      
      try {
        const result = await MiniKit.commandsAsync.verify({
          action: actionName,
          signal: "",
          verification_level: "orb" as any,
        });
        finalPayload = result.finalPayload;
      } catch (orbError) {
        try {
          const result = await MiniKit.commandsAsync.verify({
            action: actionName,
            signal: "",
            verification_level: "device" as any,
          });
          finalPayload = result.finalPayload;
          verificationLevel = "device";
        } catch (deviceError) {
          throw deviceError;
        }
      }

      // Handle user cancellation
      if (finalPayload.status === "error" && finalPayload.error_code === "user_cancelled") {
        toast.info("Verification cancelled");
        setStep("verification");
        return;
      }

      if (finalPayload.status === "error") {
        if (finalPayload.error_code === "inclusion_proof_failed") {
          toast.error("Verification service temporarily unavailable. Please try again in a moment.");
          setStep("verification");
          return;
        }

        if (finalPayload.error_code === "max_verifications_reached" && user) {
          await updateUser(user.wallet_address, { is_verified: true });
          setStep("username");
          return;
        }

        toast.error(`Verification failed: ${finalPayload.error_code || "Please try again."}`);
        setStep("verification");
        return;
      }

      const verifyResponse = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payload: finalPayload,
          action: actionName,
          signal: "",
        }),
      });

      const verifyResult = await verifyResponse.json();

      if (!verifyResponse.ok || !verifyResult.success) {
        if (
          verifyResult.verifyRes?.detail?.includes("already verified") &&
          user
        ) {
          await updateUser(user.wallet_address, { is_verified: true });
          setStep("username");
          return;
        }

        const errorMessage = verifyResult.error || verifyResult.verifyRes?.detail || "Unknown error";
        
        let userFriendlyMessage = errorMessage;
        if (errorMessage.includes("invalid")) {
          userFriendlyMessage = "The action 'livus-verifier' doesn't exist in your World ID app. Please create it in the Developer Portal.";
        } else if (errorMessage.includes("already verified")) {
          userFriendlyMessage = "You have already been verified.";
        }
        
        toast.error(`Verification failed: ${userFriendlyMessage}`);
        setStep("verification");
        return;
      }

      if (user) {
        const updateData = {
          world_id: finalPayload.nullifier_hash,
          nullifier_hash: finalPayload.nullifier_hash,
          verification_level: finalPayload.verification_level || "orb",
          is_verified: true,
        };
        
        await updateUser(user.wallet_address, updateData);
      }

      setStep("username");
    } catch (error: any) {
      // Handle cancellation errors
      if (error.message?.includes("cancelled") || error.message?.includes("cancel")) {
        toast.info("Verification cancelled");
        setStep("verification");
        return;
      }
      
      toast.error(`Verification failed: ${error.message || "Please try again."}`);
      setStep("verification");
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleUsernameSubmit = async () => {
    if (!onboardingData.username.trim()) {
      toast.error("Please enter a username");
      return;
    }

    if (onboardingData.username.length < 3) {
      toast.error("Username must be at least 3 characters");
      return;
    }

    setUsernameLoading(true);

    try {
      if (user) {
        await updateUser(user.wallet_address, {
          username: onboardingData.username.trim(),
        });
      }
      
      setStep("complete");
      toast.success("Welcome! Your profile is complete.");
      
      // Auto-redirect after a brief moment
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (error) {
      toast.error("Failed to update username");
    } finally {
      setUsernameLoading(false);
    }
  };

  const renderContent = () => {
    switch (step) {
      case "verification":
        return (
          <div className="relative z-2 w-full h-screen flex flex-col items-center justify-center pt-24 pb-16">
            <div className="absolute top-[15%] left-[7%] flex flex-col items-start justify-center z-2">
              <div className="text-6xl text-gray-700">Setup</div>
              <div className="text-lg text-gray-500 mt-2">Verify your identity</div>
            </div>

            <section className="mt-auto space-y-6 w-full max-w-md mx-auto px-6">
              <button
                onClick={handleWorldIdVerify}
                disabled={verifyLoading}
                className={cn(
                  `w-full h-16 rounded-2xl text-lg uppercase transition-all duration-300
                    active:scale-[0.95] flex items-center justify-center gap-3 shadow-lg`,
                  verifyLoading
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : `bg-gray-500 hover:bg-gray-600 text-white shadow-gray-500/30
                      hover:shadow-gray-600/40`
                )}
              >
                {verifyLoading ? (
                  <>
                    <CircleNotch className="w-6 h-6 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-6 h-6" />
                    <span>Verify with World ID</span>
                  </>
                )}
              </button>
            </section>

            {isTestMode && (
              <div className="z-10 mt-4 px-3 py-1 bg-orange-100 border border-orange-300 rounded-full">
                <span className="text-sm text-orange-600 font-medium">Test Mode</span>
              </div>
            )}
          </div>
        );

      case "verifying":
        return (
          <div className="relative z-2 w-full h-screen flex flex-col items-center justify-center">
            <div className="flex flex-col items-center space-y-6">
              <CircleNotch className="w-16 h-16 animate-spin text-gray-500" />
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-700 mb-2">Verifying...</h1>
                <p className="text-gray-500">Please wait while we verify your identity</p>
              </div>
            </div>
          </div>
        );

      case "username":
        return (
          <div className="relative z-2 w-full h-screen flex flex-col items-center justify-center pt-24 pb-16">
            <div className="absolute top-[15%] left-[7%] flex flex-col items-start justify-center z-2">
              <div className="text-6xl text-gray-700">Username</div>
              <div className="text-lg text-gray-500 mt-2">Choose your username</div>
            </div>

            <section className="mt-auto space-y-6 w-full max-w-md mx-auto px-6">
              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder="Enter your username"
                  value={onboardingData.username}
                  onChange={(e) => setOnboardingData(prev => ({ ...prev, username: e.target.value }))}
                  className="h-16 text-lg text-center rounded-2xl border-2 border-gray-200 focus:border-gray-400"
                  maxLength={20}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && onboardingData.username.trim().length >= 3) {
                      handleUsernameSubmit();
                    }
                  }}
                />
                <div className="text-center text-sm text-gray-400">
                  {onboardingData.username.length}/20 characters
                </div>
              </div>

              <button
                onClick={handleUsernameSubmit}
                disabled={!onboardingData.username.trim() || onboardingData.username.length < 3 || usernameLoading}
                className={cn(
                  `w-full h-16 rounded-2xl text-lg uppercase transition-all duration-300
                    active:scale-[0.95] flex items-center justify-center gap-3 shadow-lg`,
                  (!onboardingData.username.trim() || onboardingData.username.length < 3 || usernameLoading)
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : `bg-gray-500 hover:bg-gray-600 text-white shadow-gray-500/30
                      hover:shadow-gray-600/40`
                )}
              >
                {usernameLoading ? (
                  <>
                    <CircleNotch className="w-6 h-6 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <User className="w-6 h-6" />
                    <span>Continue</span>
                  </>
                )}
              </button>
            </section>
          </div>
        );

      case "complete":
        return (
          <div className="relative z-2 w-full h-screen flex flex-col items-center justify-center">
            <div className="flex flex-col items-center space-y-6">
              <CheckCircle className="w-16 h-16 text-green-500" />
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-700 mb-2">Welcome!</h1>
                <p className="text-gray-500">Your profile is complete</p>
                <p className="text-sm text-gray-400 mt-2">Redirecting to the app...</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
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
      
      {renderContent()}

      <Toaster />
    </MobileScreen>
  );
}
