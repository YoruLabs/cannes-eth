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
import { CircleNotch, CheckCircle, XCircle } from "phosphor-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/providers/user-provider";
import { Connection, ConnectionsService } from "@/lib/services/connections";
import { useConnections } from "@/lib/hooks/useConnections";

export default function ConnectPage() {
  const [ouraLoading, setOuraLoading] = useState(false);
  const [whoopLoading, setWhoopLoading] = useState(false);
  const [ouraDialogOpen, setOuraDialogOpen] = useState(false);
  const [whoopDialogOpen, setWhoopDialogOpen] = useState(false);
  const [ouraAuthUrl, setOuraAuthUrl] = useState("");
  const [whoopAuthUrl, setWhoopAuthUrl] = useState("");
  const [waitingForWebhook, setWaitingForWebhook] = useState(false);
  const [windowDimensions, setWindowDimensions] = useState({
    width: 375,
    height: 812,
  });

  const searchParams = useSearchParams();
  const { user } = useUser();

  // Use the custom hook for connections
  const {
    connections,
    loading: connectionsLoading,
    error: connectionsError,
    refetch: refetchConnections,
    hasOuraConnection,
    hasWhoopConnection,
    hasAnyConnection
  } = useConnections(user?.wallet_address || null);

  // Handle Terra callback parameters
  const handleTerraCallback = async () => {
    const urlParams = new URLSearchParams(window.location.search);

    // Check for Terra success parameters
    if (
      urlParams.get("terra_success") === "true" ||
      (urlParams.has("user_id") &&
        urlParams.has("resource") &&
        urlParams.has("reference_id"))
    ) {
      console.log("Terra callback: Processing Terra success callback");

      // Terra sends:
      // - user_id: Terra's unique ID for this specific device connection
      // - resource: The device type (OURA, WHOOP, etc.)
      // - reference_id: Our original reference ID (should match user.wallet_address)
      const terraUserId = urlParams.get("user_id");
      const terraResource = urlParams.get("resource");
      const referenceId = urlParams.get("reference_id");

      console.log("Terra callback params:", {
        terraUserId,
        terraResource,
        referenceId,
        ourWalletAddress: user?.wallet_address,
        referenceMatches: referenceId === user?.wallet_address,
      });

      if (terraUserId && terraResource && referenceId && user?.wallet_address) {
        // Verify that the reference_id matches our user's wallet address
        if (referenceId === user.wallet_address) {
          try {
            // Note: We don't create connection records here anymore
            // The Fastify server will handle this via webhooks
            console.log("Terra authentication successful - waiting for webhook...");

            toast.success(`${terraResource} device connected successfully!`);
            toast.info("Your historical sleep data will be synced automatically via webhooks. This may take some time.");

            // Set waiting state
            setWaitingForWebhook(true);

            // Clean up URL parameters
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);

            // Refetch connections after a delay to allow webhook processing
            setTimeout(refetchConnections, 2000);
          } catch (error) {
            console.error("Error handling Terra callback:", error);
            toast.error("Connection successful but there was an issue. Please refresh the page.");
          }
        } else {
          console.error("Reference ID mismatch:", {
            received: referenceId,
            expected: user.wallet_address,
          });
          toast.error("Connection failed: Invalid reference ID");
        }
      } else {
        console.error("Missing required Terra callback parameters");
        toast.error("Connection failed: Missing required parameters");
      }
    }
  };

  // Handle OAuth redirect results and Terra callback
  useEffect(() => {
    // First check for Terra callback parameters
    const urlParams = new URLSearchParams(window.location.search);

    if (
      urlParams.get("terra_success") === "true" ||
      (urlParams.has("user_id") &&
        urlParams.has("resource") &&
        urlParams.has("reference_id"))
    ) {
      // Handle Terra callback
      handleTerraCallback();
    } else {
      // Handle legacy success/failure parameters (fallback)
      const success = searchParams.get("success");
      if (success === "true") {
        toast.success("Device connected successfully!");
        toast.info("Your historical sleep data will be synced automatically via webhooks. This may take some time.");
        setTimeout(refetchConnections, 2000);
      } else if (success === "false") {
        toast.error("Failed to connect device. Please try again.");
      }
    }
  }, [searchParams, user?.wallet_address, refetchConnections]);

  // Show error toast if there's a connection error
  useEffect(() => {
    if (connectionsError) {
      toast.error(`Failed to load connections: ${connectionsError}`);
    }
  }, [connectionsError]);

  // Clear waiting state when connections are loaded
  useEffect(() => {
    if (!connectionsLoading && hasAnyConnection && waitingForWebhook) {
      setWaitingForWebhook(false);
    }
  }, [connectionsLoading, hasAnyConnection, waitingForWebhook]);

  // Poll for connection updates after authentication
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hasTerraCallback = urlParams.get("terra_success") === "true" ||
      (urlParams.has("user_id") && urlParams.has("resource") && urlParams.has("reference_id"));

    if (hasTerraCallback && user?.wallet_address) {
      // Poll for connection updates every 3 seconds for up to 30 seconds
      let pollCount = 0;
      const maxPolls = 10;
      const pollInterval = setInterval(() => {
        pollCount++;
        refetchConnections();

        if (pollCount >= maxPolls) {
          clearInterval(pollInterval);
          setWaitingForWebhook(false);
          console.log("Stopped polling for connection updates");
        }
      }, 3000);

      return () => clearInterval(pollInterval);
    }
  }, [user?.wallet_address, refetchConnections]);

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
          auth_success_redirect_url: `${process.env.NEXT_PUBLIC_APP_ENV === "development" ? "https://world.org/mini-app?app_id=app_58d87e75f86ee1d5774b836e7190153d&path=/connect" : window.location.origin}/connect?terra_success=true`,
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
          auth_success_redirect_url: `${process.env.NEXT_PUBLIC_APP_ENV === "development" ? "https://world.org/mini-app?app_id=app_58d87e75f86ee1d5774b836e7190153d&path=/connect" : window.location.origin}/connect?terra_success=true`,
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

  const renderConnectionButton = (
    provider: 'oura' | 'whoop',
    connection: Connection | null,
    isLoading: boolean,
    onConnect: () => void,
    colors: {
      gradient: string;
      shadow: string;
      icon: string;
    }
  ) => {
    const isConnected = connection && connection.active;
    const isDisabled = isLoading || ouraLoading || whoopLoading || waitingForWebhook;

    return (
      <button
        onClick={isConnected ? undefined : onConnect}
        disabled={isDisabled}
        className={cn(
          `w-full h-16 rounded-2xl text-lg uppercase transition-all duration-300
            active:scale-[0.95] flex items-center justify-center gap-3 shadow-lg`,
          isDisabled && !isConnected
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : isConnected
              ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-green-500/30"
              : `${colors.gradient} text-white ${colors.shadow}`
        )}
      >
        {isLoading ? (
          <>
            <CircleNotch className="w-6 h-6 animate-spin" />
            <span>Connecting...</span>
          </>
        ) : isConnected ? (
          <>
            <CheckCircle className="w-6 h-6" />
            <span>Connected to {provider === 'oura' ? 'Oura' : 'Whoop'}</span>
          </>
        ) : (
          <>
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
              <span className={`${colors.icon} font-bold text-sm`}>
                {provider === 'oura' ? 'O' : 'W'}
              </span>
            </div>
            <span>Connect {provider === 'oura' ? 'Oura' : 'Whoop'}</span>
          </>
        )}
      </button>
    );
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

        {/* Connection Status Loading */}
        {connectionsLoading && !waitingForWebhook && (
          <div className="w-full max-w-md mx-auto mb-4 flex items-center justify-center gap-2 text-gray-600">
            <CircleNotch className="w-4 h-4 animate-spin" />
            <span>Loading connection status...</span>
          </div>
        )}

        {/* Waiting for Webhook */}
        {waitingForWebhook && (
          <div className="w-full max-w-md mx-auto mb-4 flex items-center justify-center gap-2 text-blue-600">
            <CircleNotch className="w-4 h-4 animate-spin" />
            <span>Processing connection...</span>
          </div>
        )}

        {/* Connection buttons */}
        <div className="w-full max-w-md mx-auto space-y-4">
          {/* Oura Connect Button */}
          {renderConnectionButton(
            'oura',
            connections.oura,
            ouraLoading,
            handleOuraConnect,
            {
              gradient: 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
              shadow: 'shadow-purple-500/30 hover:shadow-purple-600/40',
              icon: 'text-purple-600'
            }
          )}

          {/* Whoop Connect Button */}
          {renderConnectionButton(
            'whoop',
            connections.whoop,
            whoopLoading,
            handleWhoopConnect,
            {
              gradient: 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700',
              shadow: 'shadow-yellow-500/30 hover:shadow-yellow-600/40',
              icon: 'text-yellow-600'
            }
          )}
        </div>

        {/* Connection Summary */}
        {!connectionsLoading && hasAnyConnection && (
          <div className="w-full max-w-md mx-auto mt-8 p-4 bg-white/50 rounded-xl backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Your Connections</h3>
            <div className="space-y-2">
              {hasOuraConnection && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-700">Oura Ring connected</span>
                  {connections.oura && (
                    <div className="text-xs text-gray-500">
                      Connected on {new Date(connections.oura.created_at).toLocaleDateString()}
                      {connections.oura.last_webhook_update && (
                        <div>
                          Last update: {new Date(connections.oura.last_webhook_update).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {hasWhoopConnection && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-700">Whoop device connected</span>
                  {connections.whoop && (
                    <div className="text-xs text-gray-500">
                      Connected on {new Date(connections.whoop.created_at).toLocaleDateString()}
                      {connections.whoop.last_webhook_update && (
                        <div>
                          Last update: {new Date(connections.whoop.last_webhook_update).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

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