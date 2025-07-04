"use client";

import { useState, useEffect } from "react";
import { Wallet, Loader2, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { MiniKit, ISuccessResult, VerificationLevel } from "@worldcoin/minikit-js";
import { useUser } from "@/providers/user-provider";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const router = useRouter();
  
  const { user, login } = useUser();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  // Check MiniKit installation
  useEffect(() => {
    const checkMiniKit = async () => {
      const isInstalled = MiniKit.isInstalled();
      if (isInstalled) {
        setIsLoading(false);
      } else {
        setTimeout(checkMiniKit, 1000);
      }
    };

    checkMiniKit();
  }, []);

  // Handle World wallet authentication
  const handleConnectWallet = async () => {
    setAuthLoading(true);

    try {
      if (!MiniKit.isInstalled()) {
        toast.error("MiniKit is not installed");
        return;
      }

      // Get nonce from backend
      const res = await fetch("/api/nonce");
      const { nonce } = await res.json();
      
      // Perform wallet authentication
      const { commandPayload, finalPayload } = await MiniKit.commandsAsync.walletAuth({
        nonce: nonce,
        requestId: "0",
        expirationTime: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
        notBefore: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
        statement: "Sign in to Ailingo",
      });

      if (finalPayload.status === "error") {
        toast.error("Authentication failed");
        return;
      }

      // Verify the authentication with backend
      const response = await fetch("/api/complete-siwe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payload: finalPayload,
          nonce,
        }),
      });

      const result = await response.json();

      if (result.status === "success" && result.isValid) {
        // Get user info from MiniKit and payload
        const username = MiniKit.user?.username;
        const walletAddress = finalPayload.address;

        // Use the provider's login function to save to Supabase
        await login(walletAddress, username);
        
        toast.success(`Welcome ${username || "User"}! 🎉`);
        
        // Redirect to main page
        router.push('/');
      } else {
        toast.error("Authentication verification failed");
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      toast.error("Authentication failed");
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle World ID verification
  const handleWorldIdVerify = async () => {
    setVerifyLoading(true);

    try {
      if (!MiniKit.isInstalled()) {
        toast.error("MiniKit is not installed");
        return;
      }

      console.log("Starting World ID verification...");

      // Check if required environment variables are set
      const actionName = process.env.NEXT_PUBLIC_WLD_ACTION_NAME;
      if (!actionName) {
        toast.error("Action name not configured. Please set NEXT_PUBLIC_WLD_ACTION_NAME in your environment variables.");
        console.error("NEXT_PUBLIC_WLD_ACTION_NAME is not set");
        return;
      }

      console.log("Using action:", actionName);

      // First get the payload from World ID verification
      const { finalPayload } = await MiniKit.commandsAsync.verify({
        action: actionName,
        signal: "", // Optional signal - can be used for additional context
        verification_level: VerificationLevel.Orb, // Use enum instead of string
      });

      console.log("World ID verification response:", finalPayload);

      if (finalPayload.status === "error") {
        console.error("World ID verification error:", finalPayload);
        
        // Handle specific error codes according to World documentation
        switch (finalPayload.error_code) {
          case "verification_rejected":
            toast.error("Verification was rejected. Please try again if this was a mistake.");
            break;
          case "max_verifications_reached":
            toast.error("You have already verified for this action the maximum number of times.");
            break;
          case "credential_unavailable":
            toast.error("You need to verify at an Orb or verify your device in World App first.");
            break;
          case "invalid_network":
            toast.error("Network mismatch. Make sure you're using the correct environment.");
            break;
          case "malformed_request":
            toast.error("Invalid request. Please check the configuration.");
            break;
          case "inclusion_proof_failed":
            toast.error("Network issue. Please try again.");
            break;
          case "inclusion_proof_pending":
            toast.error("Your credential is not available on-chain yet. Please try again in about an hour.");
            break;
          default:
            toast.error(`World ID verification failed: ${finalPayload.error_code || 'Unknown error'}`);
        }
        return;
      }

      console.log("World ID verification successful, verifying proof with backend...");

      // Verify the proof with our backend
      const verifyResponse = await fetch("/api/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payload: finalPayload,
          action: actionName,
          signal: "",
        }),
      });

      const verifyResult = await verifyResponse.json();
      console.log("Backend verification result:", verifyResult);

      if (!verifyResponse.ok || !verifyResult.success) {
        console.error("Backend verification failed:", verifyResult);
        
        // Handle backend verification errors
        if (verifyResult.verifyRes && !verifyResult.verifyRes.success) {
          const backendError = verifyResult.verifyRes.detail;
          console.error("Backend error detail:", backendError);
          
          if (backendError.includes("already verified")) {
            toast.error("You have already verified for this action.");
          } else if (backendError.includes("invalid_proof")) {
            toast.error("Invalid proof. Please try again.");
          } else if (backendError.includes("invalid_merkle_root")) {
            toast.error("Stale proof. Please generate a new proof.");
          } else {
            toast.error(`Verification failed: ${backendError}`);
          }
        } else {
          toast.error("Backend verification failed. Please try again.");
        }
        return;
      }

      console.log("Proof verified successfully, getting wallet authentication...");

      // Now get wallet auth for address
      const { finalPayload: walletPayload } = await MiniKit.commandsAsync.walletAuth({
        nonce: crypto.randomUUID(),
        requestId: "1",
        expirationTime: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
        notBefore: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
        statement: "Complete World ID verification for Ailingo",
      });

      console.log("Wallet auth response:", walletPayload);

      if (walletPayload.status === "error") {
        console.error("Wallet authentication error:", walletPayload);
        toast.error("Wallet authentication failed");
        return;
      }

      // Get user info
      const username = MiniKit.user?.username;
      const walletAddress = walletPayload.address;

      console.log("Creating user session with World ID data...", {
        walletAddress,
        username,
        worldIdData: {
          world_id: finalPayload.nullifier_hash,
          nullifier_hash: finalPayload.nullifier_hash,
          verification_level: finalPayload.verification_level || "orb",
          is_verified: true,
        }
      });

      // Save to Supabase with World ID data
      await login(walletAddress, username, {
        world_id: finalPayload.nullifier_hash, // Using nullifier as World ID
        nullifier_hash: finalPayload.nullifier_hash,
        verification_level: finalPayload.verification_level || "orb",
        is_verified: true,
      });

      toast.success(`Welcome ${username || "User"}! You are now verified with World ID! ✅`);
      router.push('/');
    } catch (error: any) {
      console.error("World ID verification error:", error);
      
      // Check if it's a network error
      if (error.message && error.message.includes("fetch")) {
        toast.error("Network error. Please check your connection and try again.");
      } else if (error.message && error.message.includes("timeout")) {
        toast.error("Request timed out. Please try again.");
      } else {
        toast.error(`World ID verification failed: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setVerifyLoading(false);
    }
  };

  if (isLoading) {
    return (
      <main className="h-[100dvh] w-full relative overflow-hidden bg-gradient-to-br from-purple-600 to-blue-700">
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center">
          <div className="mb-6 relative">
            <div className="w-16 h-16 bg-white border-4 border-gray-800 shadow-lg animate-pulse rounded-lg">
              <div className="w-full h-full bg-gradient-to-br from-purple-400 to-blue-500 rounded"></div>
            </div>
          </div>
          <div className="text-xl font-bold text-white uppercase tracking-wider drop-shadow-lg">
            Loading World App...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="h-[100dvh] w-full relative overflow-hidden bg-gradient-to-br from-purple-600 to-blue-700">
      {/* Top Header Bar */}
      <header className="relative z-10 px-3 py-4 bg-gradient-to-r from-purple-700 to-blue-700 shadow-lg">
        <div className="flex items-center justify-center">
          <div className="text-lg font-bold text-white uppercase tracking-wider drop-shadow-lg">
            Ailingo
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 pb-32">
        
        {/* Title */}
        <div className="text-center mb-12">
          <div className="text-5xl font-bold text-white uppercase tracking-wider drop-shadow-lg mb-4">
            Welcome
          </div>
          <div className="text-lg text-white/90 uppercase tracking-wide drop-shadow-md">
            Choose your authentication method
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-2xl rounded-2xl p-8 w-full max-w-md">
          <div className="space-y-4">
            {/* World ID Verification Button (Recommended) */}
            <button
              onClick={handleWorldIdVerify}
              disabled={verifyLoading}
              className={cn(
                "w-full h-14 text-white text-base font-semibold bg-gradient-to-r from-green-600 to-emerald-600 border-0 shadow-lg px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-3",
                verifyLoading
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:from-green-700 hover:to-emerald-700 active:scale-[0.98] shadow-xl hover:shadow-green-500/25"
              )}
            >
              {verifyLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <Shield className="h-5 w-5" />
                  <span>Verify with World ID</span>
                </>
              )}
            </button>

            <div className="text-xs text-center text-green-700 font-medium">
              ⭐ Recommended - Get verified human status
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or</span>
              </div>
            </div>

            {/* World Wallet Authentication Button */}
            <button
              onClick={handleConnectWallet}
              disabled={authLoading}
              className={cn(
                "w-full h-14 text-white text-base font-semibold bg-gradient-to-r from-purple-600 to-blue-600 border-0 shadow-lg px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-3",
                authLoading
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:from-purple-700 hover:to-blue-700 active:scale-[0.98] shadow-xl hover:shadow-purple-500/25"
              )}
            >
              {authLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <Wallet className="h-5 w-5" />
                  <span>Connect Wallet Only</span>
                </>
              )}
            </button>

            <div className="text-xs text-center text-gray-600">
              Basic authentication without human verification
            </div>
          </div>
        </div>
      </div>
      
      <Toaster />
    </main>
  );
} 