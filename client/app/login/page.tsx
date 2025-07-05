"use client";

import { useState, useEffect } from "react";
import { ArrowRightIcon, Globe } from "lucide-react";
import { LockKeyOpen, CircleNotch } from "phosphor-react";
import { useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { MiniKit } from "@worldcoin/minikit-js";
import { useUser } from "@/providers/user-provider";
import { cn } from "@/lib/utils";
import MobileScreen from "@/components/layouts/MobileScreen";
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";
import { FlickeringGrid } from "@/components/magicui/flickering-grid";

/**
 * Refreshed Login / On-Ramp page for AILingo
 * --------------------------------------------------
 * Design tweaks inspired by the provided mock-up:
 *  • Brand chip pinned to the top-left corner (glassmorphism)
 *  • Softer teal-centric gradient background
 *  • Subtle glowing blob in the top-right corner for depth
 *  • Tighter, clearer hierarchy in hero + CTA
 *  • Dark-mode aware
 */

// Mock user data for test environment
const MOCK_USER_DATA = {
  wallet_address: "0x6b84bba6e67a124093933aba8f5b6beb96307d99",
  username: "mrbry.0675",
  world_id:
    "0x1f7ea7470188cf8ffc728dcfc0d37da45dbb4cba03343f9bc259decb24051926",
  nullifier_hash:
    "0x1f7ea7470188cf8ffc728dcfc0d37da45dbb4cba03343f9bc259decb24051926",
  verification_level: "orb",
  is_verified: true
};

// Generate random wallet address for testing
const generateRandomWallet = () => {
  const chars = "0123456789abcdef";
  let result = "0x";
  for (let i = 0; i < 40; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Mock data for new unverified user (for onboarding testing)
const generateMockOnboardingUser = () => ({
  wallet_address: generateRandomWallet(),
  username: `testuser.${Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0")}`,
  world_id: undefined, // Not verified yet
  nullifier_hash: undefined, // Not verified yet
  verification_level: undefined, // Not verified yet
  is_verified: false, // Key: this user needs onboarding
  native_language: undefined, // Will be set during onboarding
  active_learning_language: undefined, // Will be set during onboarding
  points: 0,
});

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [onboardingLoading, setOnboardingLoading] = useState(false);
  const [windowDimensions, setWindowDimensions] = useState({
    width: 375, // fallback mobile width
    height: 812, // fallback mobile height
  });
  const router = useRouter();

  const { user, login } = useUser();

  const isTestMode = process.env.NEXT_PUBLIC_APP_ENV === "test";

  // Debug logging
  console.log("isTestMode", isTestMode);
  console.log("NEXT_PUBLIC_APP_MODE", process.env.NEXT_PUBLIC_APP_ENV);
  console.log("NODE_ENV", process.env.NODE_ENV);

  /* --------------------------------------------------
   * Set window dimensions safely
   * -------------------------------------------------- */
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

  /* --------------------------------------------------
   * Redirect once authenticated
   * -------------------------------------------------- */
  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  /* --------------------------------------------------
   * Poll for World App / MiniKit installation (skip in test mode)
   * -------------------------------------------------- */
  useEffect(() => {
    console.log("isTestMode", isTestMode);
    console.log("env", process.env.NODE_ENV);
    if (isTestMode) {
      setIsLoading(false);

      console.log("Test mode -> MiniKit initialization skipped on provider");

      return;
    }

    const checkMiniKit = async () => {
      if (MiniKit.isInstalled()) {
        setIsLoading(false);
      } else {
        setTimeout(checkMiniKit, 1000);
      }
    };
    checkMiniKit();
  }, [isTestMode]);

  /* --------------------------------------------------
   * Handle test authentication (bypass World App)
   * -------------------------------------------------- */
  const handleTestLogin = async () => {
    setAuthLoading(true);

    try {
      const userData = await login(
        MOCK_USER_DATA.wallet_address,
        MOCK_USER_DATA.username,
        {
          world_id: MOCK_USER_DATA.world_id,
          nullifier_hash: MOCK_USER_DATA.nullifier_hash,
          verification_level: MOCK_USER_DATA.verification_level,
          is_verified: MOCK_USER_DATA.is_verified,
        }
      );

      toast.success(`Welcome back, ${MOCK_USER_DATA.username}!`);
      setTimeout(() => router.push("/"), 300);
    } catch (err) {
      console.error("Test authentication error:", err);
      toast.error("Test authentication failed");
    } finally {
      setAuthLoading(false);
    }
  };

  /* --------------------------------------------------
   * Handle test onboarding (new unverified user)
   * -------------------------------------------------- */
  const handleTestOnboarding = async () => {
    setOnboardingLoading(true);

    try {
      const mockUser = generateMockOnboardingUser();

      const userData = await login(mockUser.wallet_address, mockUser.username, {
        world_id: mockUser.world_id,
        nullifier_hash: mockUser.nullifier_hash,
        verification_level: mockUser.verification_level,
        is_verified: mockUser.is_verified,
      });

      toast.success(`New user created: ${mockUser.username}`);
      setTimeout(() => router.push("/onboarding"), 300);
    } catch (err) {
      console.error("Test onboarding error:", err);
      toast.error("Onboarding setup failed");
    } finally {
      setOnboardingLoading(false);
    }
  };

  /* --------------------------------------------------
   * Handle SIWE-style wallet auth via MiniKit
   * -------------------------------------------------- */
  const handleConnectWallet = async () => {
    setAuthLoading(true);

    try {
      if (!MiniKit.isInstalled()) {
        toast.error("MiniKit is not installed");
        return;
      }

      // 1️⃣  Get nonce from backend
      const res = await fetch("/api/nonce");
      const { nonce } = await res.json();

      // 2️⃣  Ask wallet to sign-in
      const { finalPayload } = await MiniKit.commandsAsync.walletAuth({
        nonce,
        requestId: "0",
        expirationTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        notBefore: new Date(Date.now() - 24 * 60 * 60 * 1000),
        statement: "Sign in to AILingo",
      });

      if (finalPayload.status === "error") {
        toast.error("Authentication failed");
        return;
      }

      // 3️⃣  Verify signature server-side
      const verifyRes = await fetch("/api/complete-siwe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: finalPayload, nonce }),
      });

      const result = await verifyRes.json();

      if (result.status === "success" && result.isValid) {
        const username = MiniKit.user?.username ?? "";
        const walletAddress = finalPayload.address;

        const userData = await login(walletAddress, username);

        const welcome = userData.is_verified
          ? `Welcome back, ${username || "User"}!`
          : `Welcome, ${username || "User"}!`;

        toast.success(welcome);
        setTimeout(
          () => router.push(userData.is_verified ? "/" : "/onboarding"),
          300
        );
      } else {
        toast.error("Authentication failed");
      }
    } catch (err) {
      console.error("Auth error:", err);
      toast.error("Authentication failed");
    } finally {
      setAuthLoading(false);
    }
  };

  /* --------------------------------------------------
   * Loading skeleton while waiting for MiniKit (skip in test mode)
   * -------------------------------------------------- */
  if (isLoading && !isTestMode) {
    return (
      <MobileScreen
        className="flex flex-col items-center justify-center bg-gradient-to-br from-gray-100
          via-gray-200 to-gray-300 rounded-[32px] overflow-hidden"
      >
        {/*  Blurred decorative blob  */}
        <div
          className="absolute -top-20 -left-20 w-72 h-72 bg-gray-300 opacity-30 rounded-full
            blur-[100px]"
        />

        <div className="relative z-10 flex flex-col items-center space-y-6">
          {/*  Brand chip  */}
          <div
            className="bg-white/40 backdrop-blur-lg rounded-3xl px-4 py-2 flex items-center gap-2
              shadow-lg"
          >
            <Globe className="w-5 h-5 text-gray-500" />
            <span className="font-bold text-gray-700 tracking-wide">
              Livus
            </span>
          </div>

          <h1 className="text-3xl font-extrabold text-gray-700">
            Loading&nbsp;World&nbsp;App…
          </h1>
          <CircleNotch className="w-10 h-10 animate-spin text-gray-500" />
        </div>
      </MobileScreen>
    );
  }

  /* --------------------------------------------------
   * Main UI
   * -------------------------------------------------- */
  return (
    <MobileScreen
      className="relative flex flex-col bg-gradient-to-br from-transparent via-slate-50
        to-slate-100 overflow-hidden"
    >
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
      {/*  Hero  */}
      <div className="absolute top-[15%] left-[7%] flex flex-col items-start justify-center z-2">
        <div className="text-6xl text-gray-700">
          Livus
        </div>
      </div>

      <div
        className="relative z-2 w-full h-screen flex flex-col items-center justify-center pt-24
          pb-16"
      >
        {/*  CTA  */}
        <section className="mt-auto space-y-6 w-full max-w-md mx-auto px-6">
          {/* Test mode authentication */}
          {isTestMode ? (
            <>
              <button
                onClick={handleTestLogin}
                disabled={authLoading || onboardingLoading}
                className={cn(
                  `w-full h-16 rounded-2xl text-lg uppercase transition-all duration-300
                    active:scale-[0.95] active:bg-orange-600 flex items-center justify-center gap-3
                    shadow-lg`,
                  authLoading || onboardingLoading
                    ? "bg-orange-300 text-orange-500 cursor-not-allowed"
                    : `bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/30
                      hover:shadow-orange-600/40`
                )}
              >
                {authLoading ? (
                  <>
                    <CircleNotch className="w-6 h-6 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <LockKeyOpen className="w-6 h-6" />
                    <span>Test Login</span>
                  </>
                )}
              </button>

              <button
                onClick={handleTestOnboarding}
                disabled={authLoading || onboardingLoading}
                className={cn(
                  `w-full h-16 rounded-2xl text-lg uppercase transition-all duration-300
                    active:scale-[0.95] active:bg-blue-600 flex items-center justify-center gap-3
                    shadow-lg`,
                  authLoading || onboardingLoading
                    ? "bg-blue-300 text-blue-500 cursor-not-allowed"
                    : `bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/30
                      hover:shadow-blue-600/40`
                )}
              >
                {onboardingLoading ? (
                  <>
                    <CircleNotch className="w-6 h-6 animate-spin" />
                    <span>Creating User...</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-6 h-6" />
                    <span>Test Onboarding</span>
                  </>
                )}
              </button>
            </>
          ) : (
            /*  Connect wallet button  */
            <button
              onClick={handleConnectWallet}
              disabled={authLoading}
              className={cn(
                `w-full h-16 rounded-2xl text-lg uppercase transition-all duration-300
                  active:scale-[0.95] active:bg-gray-600 flex items-center justify-center gap-3
                  shadow-lg`,
                authLoading
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : `bg-gray-500 hover:bg-gray-600 text-white shadow-gray-500/30
                    hover:shadow-gray-600/40`
              )}
            >
              {authLoading ? (
                <>
                  <CircleNotch className="w-6 h-6 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <LockKeyOpen className="w-6 h-6" />
                  <span>Connect with World App</span>
                </>
              )}
            </button>
          )}
        </section>

        <div className="z-10 flex flex-col items-center justify-center mt-12">
          <div className="text-sm text-gray-400 text-center font-thin uppercase">
            Languages Supported
          </div>
          <div className="text-md text-gray-400 text-center font-thin uppercase mt-1">
            PT-BR | EN-US | ES-ES | JP-JP
          </div>
        </div>

        <div className="z-10 flex items-center justify-center mt-8">
          <div
            className={cn(
              `group rounded-full border border-black/5 bg-neutral-100 text-base text-white
              transition-all ease-in hover:cursor-pointer hover:bg-neutral-200`
            )}
            onClick={() => {
              window.open("https://x.com/YoruLabs", "_blank");
            }}
          >
            <AnimatedShinyText
              className="inline-flex items-center justify-center px-4 py-1 transition ease-out
                hover:text-neutral-600 hover:duration-300 hover:dark:text-neutral-400"
            >
              <span>Made by YoruLabs</span>
              <ArrowRightIcon
                className="ml-1 size-3 transition-transform duration-300 ease-in-out
                  group-hover:translate-x-0.5"
              />
            </AnimatedShinyText>
          </div>
        </div>

        {/* Test mode indicator */}
        {isTestMode && (
          <div className="z-10 mt-4 px-3 py-1 bg-orange-100 border border-orange-300 rounded-full">
            <span className="text-sm text-orange-600 font-medium">
              Test Mode
            </span>
          </div>
        )}

        <Toaster />
      </div>
    </MobileScreen>
  );
}