"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/providers/user-provider";
import { Loader2, LogOut, Shield, ShieldCheck, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MainPage() {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();
  const { user, isLoading, logout } = useUser();

  useEffect(() => {
    // Don't redirect if still loading user data
    if (isLoading) return;

    const redirect = async () => {
      setIsRedirecting(true);

      // Small delay to prevent redirect flashing
      await new Promise(resolve => setTimeout(resolve, 100));

      if (!user) {
        // Not authenticated -> go to login
        router.push('/login');
      }
    };

    redirect();
  }, [user, isLoading, router]);

  // Show loading spinner while determining where to redirect
  if (isLoading || (!user && isRedirecting)) {
    return (
      <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-slate-50 to-zinc-100">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          <p className="text-gray-600">
            {isRedirecting ? 'Redirecting...' : 'Loading...'}
          </p>
        </div>
      </main>
    );
  }

  // Show welcome page for authenticated users
  if (user) {
    return (
      <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-6">
        <div className="flex flex-col items-center space-y-8 text-center max-w-lg">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-gray-900">
              Welcome to Ailingo! 🌍
            </h1>
            <p className="text-lg text-gray-600">
              Hello, <span className="font-semibold text-purple-600">{user.username}</span>!
            </p>
          </div>

          {/* User Info Card */}
          <div className="bg-white/80 backdrop-blur-sm border border-gray-200 shadow-xl rounded-2xl p-6 w-full">
            <div className="space-y-4">
              {/* Verification Status */}
              <div className="flex items-center justify-center space-x-2 p-3 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50">
                {user.is_verified ? (
                  <>
                    <ShieldCheck className="h-5 w-5 text-green-600" />
                    <span className="text-green-700 font-medium">World ID Verified</span>
                  </>
                ) : (
                  <>
                    <Shield className="h-5 w-5 text-gray-500" />
                    <span className="text-gray-600">Not World ID Verified</span>
                  </>
                )}
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

            {!user.is_verified && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-sm">
                  💡 Consider completing World ID verification for enhanced security and access to premium features.
                </p>
              </div>
            )}
            
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
      </main>
    );
  }

  return null;
}