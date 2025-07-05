"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trophy, Users, Coins, Calendar, CircleNotch } from "phosphor-react";
import { useMiniKit } from "../../hooks/useMiniKit";
import { MiniKit } from "@worldcoin/minikit-js";
import MobileScreen from "@/components/layouts/MobileScreen";
import { FlickeringGrid } from "@/components/magicui/flickering-grid";

export default function ChallengesPage() {
  const router = useRouter();
  const { 
    isConnected, 
    address, 
    wldBalance, 
    getChallengeData
  } = useMiniKit();

  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCheckingWallet, setIsCheckingWallet] = useState(true);
  const [windowDimensions, setWindowDimensions] = useState({
    width: 375,
    height: 812,
  });

  // Check wallet connection before showing challenges
  useEffect(() => {
    const checkWalletConnection = () => {
      setTimeout(() => {
        // Skip wallet check in test environment
        if (process.env.NEXT_PUBLIC_APP_ENV === "test") {
          setIsCheckingWallet(false);
          return;
        }

        if (!MiniKit.isInstalled() || !MiniKit.user?.walletAddress) {
          router.push("/login");
        } else {
          setIsCheckingWallet(false);
        }
      }, 500);
    };

    checkWalletConnection();
  }, [router]);

  useEffect(() => {
    if (!isCheckingWallet) {
      const loadChallenges = async () => {
        try {
          // Load challenge #1 (the one we created with 0.01 WLD)
          const challenge1 = await getChallengeData(1);
          
          if (challenge1) {
            setChallenges([challenge1]);
          }
        } catch (error) {
          console.error('Failed to load challenges:', error);
        } finally {
          setLoading(false);
        }
      };

      loadChallenges();
    }
  }, [getChallengeData, isCheckingWallet]);

  const getStatusColor = (isActive: boolean, isCompleted: boolean) => {
    if (isCompleted) return 'bg-gray-500 text-white';
    if (isActive) return 'bg-green-500 text-white';
    return 'bg-blue-500 text-white';
  };

  const getStatusText = (isActive: boolean, isCompleted: boolean) => {
    if (isCompleted) return 'Completed';
    if (isActive) return 'Active';
    return 'Upcoming';
  };

  if (isCheckingWallet || loading) {
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
            {isCheckingWallet ? 'Checking wallet connection...' : 'Loading challenges...'}
          </p>
        </div>
      </MobileScreen>
    );
  }

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

      <div className="relative z-2 w-full min-h-screen flex flex-col px-6 pt-16 pb-24">
        {/* Header Section */}
        <div className="w-full mb-8">
          <div className="text-start">
            <p className="text-4xl font-bold text-gray-800 mb-3">Challenges</p>
            <p className="text-gray-600 mb-6">Stake WLD tokens and prove your commitment to healthy living</p>
          </div>
        </div>

        <div className="flex-1 space-y-6 max-w-md mx-auto w-full">
          {/* Challenges */}
          {challenges.length > 0 ? (
            challenges.map((challenge) => (
              <div key={challenge.id} className="bg-white/80 backdrop-blur-sm border border-gray-200 shadow-xl rounded-2xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Trophy className="w-5 h-5 text-yellow-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">{challenge.name}</h3>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(challenge.isActive, challenge.isCompleted)}`}>
                    {getStatusText(challenge.isActive, challenge.isCompleted)}
                  </span>
                </div>

                <p className="text-gray-600 text-sm mb-6">
                  Walk 10,000 steps every day for 7 days straight. Prove your dedication to healthy living!
                </p>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-yellow-500" />
                      <span className="text-gray-600 text-sm">Stake</span>
                    </div>
                    <span className="font-semibold text-gray-800">{challenge.entryFee} WLD</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-500" />
                      <span className="text-gray-600 text-sm">Participants</span>
                    </div>
                    <span className="font-semibold text-gray-800">{challenge.participantCount}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-green-500" />
                      <span className="text-gray-600 text-sm">Prize Pool</span>
                    </div>
                    <span className="font-semibold text-green-600">{challenge.totalPool} WLD</span>
                  </div>

                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-500" />
                      <span className="text-gray-600 text-sm">
                        {challenge.isCompleted ? 'Challenge completed' : 
                         challenge.isActive ? 'Challenge is active' : 'Challenge upcoming'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => router.push(`/challenges/${challenge.id}`)}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  View Challenge
                </button>
              </div>
            ))
          ) : (
            <div className="bg-white/80 backdrop-blur-sm border border-gray-200 shadow-xl rounded-2xl p-8 text-center">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No Challenges Available</h3>
              <p className="text-gray-600 text-sm">Check back later for new health challenges!</p>
            </div>
          )}
        </div>
      </div>
    </MobileScreen>
  );
} 