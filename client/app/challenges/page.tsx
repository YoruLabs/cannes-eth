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
    getChallengeCounter,
    getMultipleCombinedChallengeData
  } = useMiniKit();

  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCheckingWallet, setIsCheckingWallet] = useState(true);
  const [windowDimensions, setWindowDimensions] = useState({
    width: 375,
    height: 812,
  });

  // Configuration for which challenges to show
  const STARTING_CHALLENGE_ID = process.env.NEXT_PUBLIC_STARTING_CHALLENGE_ID 
    ? parseInt(process.env.NEXT_PUBLIC_STARTING_CHALLENGE_ID) 
    : 3;

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
          console.log(`🔍 Loading challenges starting from ID ${STARTING_CHALLENGE_ID}...`);
          
          // Get total challenge count from blockchain
          const totalChallenges = await getChallengeCounter();
          console.log('📊 Total challenges on blockchain:', totalChallenges);
          
          // Get challenge IDs starting from the configured starting ID
          const challengeIds = [];
          for (let i = STARTING_CHALLENGE_ID; i <= totalChallenges; i++) {
            challengeIds.push(i);
          }
          
          console.log('📋 Challenge IDs to load:', challengeIds);
          
          if (challengeIds.length > 0) {
            // Get combined data for all challenges
            const challengeData = await getMultipleCombinedChallengeData(challengeIds);
            console.log('✅ Loaded challenge data:', challengeData);
            
            setChallenges(challengeData);
          } else {
            console.log(`ℹ️ No challenges found starting from ID ${STARTING_CHALLENGE_ID}`);
            setChallenges([]);
          }
        } catch (error) {
          console.error('❌ Failed to load challenges:', error);
          setChallenges([]);
        } finally {
          setLoading(false);
        }
      };

      loadChallenges();
    }
  }, [getChallengeCounter, getMultipleCombinedChallengeData, isCheckingWallet, STARTING_CHALLENGE_ID]);

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

  const formatChallengeDescription = (challenge: any) => {
    // Use database description if available, otherwise use a default based on challenge type
    if (challenge.description && challenge.description !== 'Complete your health goals to win!') {
      return challenge.description;
    }
    
    // Generate description based on challenge type
    if (challenge.challengeType === 'sleep_efficiency') {
      return `Achieve an average sleep efficiency of ${challenge.targetValue || 85}% or higher over 7 days`;
    } else if (challenge.challengeType === 'sleep_duration') {
      return `Sleep ${Math.round((challenge.targetValue || 32400) / 3600)} hours or more per night on average over 7 days`;
    }
    
    return 'Complete your health goals to win!';
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

      <div className="relative z-2 w-full min-h-screen flex flex-col px-6 pt-16 pb-32">
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
                    <h3 className="text-lg font-semibold text-gray-800">{challenge.title}</h3>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(challenge.isActive, challenge.isCompleted)}`}>
                    {getStatusText(challenge.isActive, challenge.isCompleted)}
                  </span>
                </div>

                <p className="text-gray-600 text-sm mb-6">
                  {formatChallengeDescription(challenge)}
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
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4 text-purple-500" />
                      <span className="text-gray-600 text-sm font-medium">
                        {challenge.isCurrentlyActive ? 'Tracking Active' :
                         challenge.canJoinNow ? 'Entry Open' : 
                         challenge.entryPeriodClosed ? 'Entry Closed' :
                         challenge.isCompleted ? 'Completed' : 'Upcoming'}
                      </span>
                    </div>
                    {challenge.isCurrentlyActive && (
                      <p className="text-xs text-green-600 ml-6">
                        Metrics are being tracked for participants
                      </p>
                    )}
                    {challenge.canJoinNow && challenge.entryEndTime && (
                      <p className="text-xs text-blue-600 ml-6">
                        Entry closes {new Date(challenge.entryEndTime).toLocaleDateString()}
                      </p>
                    )}
                    {challenge.entryPeriodClosed && !challenge.isCurrentlyActive && !challenge.isCompleted && (
                      <p className="text-xs text-yellow-600 ml-6">
                        Challenge will start soon
                      </p>
                    )}
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