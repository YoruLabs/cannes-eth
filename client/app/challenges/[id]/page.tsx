"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Trophy, 
  Users, 
  Coins, 
  Calendar, 
  ArrowLeft,
  CheckCircle,
  Warning,
  Wallet,
  CircleNotch
} from "phosphor-react";
import { useMiniKit } from "../../../hooks/useMiniKit";
import { HEALTH_CHALLENGE_ADDRESS } from "@/lib/web3";
import MobileScreen from "@/components/layouts/MobileScreen";
import { FlickeringGrid } from "@/components/magicui/flickering-grid";

export default function ChallengePage() {
  const params = useParams();
  const router = useRouter();
  const { 
    isConnected, 
    address, 
    wldBalance, 
    isLoading: web3Loading,
    getCombinedChallengeData,
    joinChallenge,
    completeChallenge,
    checkParticipation
  } = useMiniKit();

  const [challenge, setChallenge] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [isCheckingParticipation, setIsCheckingParticipation] = useState(false);
  const [windowDimensions, setWindowDimensions] = useState({
    width: 375,
    height: 812,
  });

  const challengeId = parseInt(params.id as string);

  useEffect(() => {
    const loadChallenge = async () => {
      try {
        const challengeData = await getCombinedChallengeData(challengeId);
        if (challengeData) {
          setChallenge(challengeData);
          
          // Check if user has already joined this challenge
          if (isConnected && address) {
            setIsCheckingParticipation(true);
            try {
              const isParticipating = await checkParticipation(challengeId, address);
              setHasJoined(isParticipating);
              console.log(`👤 User participation status for challenge ${challengeId}:`, isParticipating);
            } catch (error) {
              console.error('Failed to check participation:', error);
            } finally {
              setIsCheckingParticipation(false);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load challenge:', error);
      } finally {
        setLoading(false);
      }
    };

    if (challengeId) {
      loadChallenge();
    }
  }, [challengeId, getCombinedChallengeData, checkParticipation, isConnected, address]);

  const handleJoinChallenge = async () => {
    if (!isConnected) {
      alert("Please open this in the World App to connect your wallet!");
      return;
    }

    setIsJoining(true);
    
    try {
      const result = await joinChallenge(challengeId, challenge.entryFee);
      
      if (result.success) {
        // Update participation status
        setHasJoined(true);
        alert(`Successfully joined "${challenge.title}"! Transaction: ${result.txId}`);
        
        // Refresh challenge data
        const updatedChallenge = await getCombinedChallengeData(challengeId);
        if (updatedChallenge) {
          setChallenge(updatedChallenge);
        }
      } else {
        alert(`Failed to join challenge: ${result.error}`);
      }
    } catch (error) {
      console.error("Error joining challenge:", error);
      alert("Failed to join challenge. Please try again.");
    } finally {
      setIsJoining(false);
    }
  };

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

  if (loading) {
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
          <p className="text-gray-600 font-medium">Loading challenge...</p>
        </div>
      </MobileScreen>
    );
  }

  if (!challenge) {
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
        <div className="relative z-2 flex-1 flex flex-col items-center justify-center px-6">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Challenge Not Found</h1>
          <p className="text-gray-600 mb-6 text-center">The challenge you&apos;re looking for doesn&apos;t exist.</p>
          <button
            onClick={() => router.push('/challenges')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Back to Challenges
          </button>
        </div>
      </MobileScreen>
    );
  }

  const canJoin = challenge.canJoinNow && !challenge.isCompleted;
  const hasEnoughWLD = parseFloat(wldBalance) >= parseFloat(challenge.entryFee);

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
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/challenges')}
            className="w-10 h-10 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full shadow-sm flex items-center justify-center hover:bg-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800">{challenge.title}</h1>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(challenge.isActive, challenge.isCompleted)} mt-2`}>
              {getStatusText(challenge.isActive, challenge.isCompleted)}
            </span>
          </div>
        </div>

        <div className="flex-1 space-y-6 max-w-md mx-auto w-full">
          {/* Challenge Description */}
          <div className="bg-white/80 backdrop-blur-sm border border-gray-200 shadow-xl rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Trophy className="w-5 h-5 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">About This Challenge</h3>
            </div>
            
            <p className="text-gray-600 text-sm mb-6">
              {challenge.description || 'Complete your health goals to win!'}
            </p>
            
            <div className="space-y-3">
              <h4 className="font-medium text-gray-800 text-sm">Requirements:</h4>
              <div className="space-y-2">
                {(challenge.challengeRequirements || challenge.requirements || []).length > 0 ? (
                  (challenge.challengeRequirements || challenge.requirements || []).map((requirement: string, index: number) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-green-500" weight="fill" />
                      <span className="text-gray-600 text-sm">{requirement}</span>
                    </div>
                  ))
                ) : (
                  // Fallback requirements based on challenge type
                  <>
                    {challenge.challengeType === 'sleep_efficiency' ? (
                      <>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-4 h-4 text-green-500" weight="fill" />
                          <span className="text-gray-600 text-sm">Achieve {challenge.targetValue || 85}% sleep efficiency</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-4 h-4 text-green-500" weight="fill" />
                          <span className="text-gray-600 text-sm">Track sleep for 7 days</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-4 h-4 text-green-500" weight="fill" />
                          <span className="text-gray-600 text-sm">Connect Terra fitness tracker</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-4 h-4 text-green-500" weight="fill" />
                          <span className="text-gray-600 text-sm">Complete daily health goals</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-4 h-4 text-green-500" weight="fill" />
                          <span className="text-gray-600 text-sm">Connect fitness tracker</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-4 h-4 text-green-500" weight="fill" />
                          <span className="text-gray-600 text-sm">Maintain consistency</span>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Challenge Stats */}
          <div className="bg-white/80 backdrop-blur-sm border border-gray-200 shadow-xl rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Challenge Stats</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-yellow-500" />
                  <span className="text-gray-600 text-sm">Entry Fee</span>
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
            </div>
          </div>

          {/* Join Challenge */}
          <div className="bg-white/80 backdrop-blur-sm border border-gray-200 shadow-xl rounded-2xl p-6">
            {hasJoined ? (
              <div className="text-center">
                <div className="p-2 bg-green-100 rounded-lg w-fit mx-auto mb-3">
                  <CheckCircle className="w-8 h-8 text-green-600" weight="fill" />
                </div>
                <h3 className="text-lg font-semibold text-green-700 mb-2">
                  {challenge.isCurrentlyActive ? 'Challenge Active!' : 'Joined Successfully!'}
                </h3>
                <p className="text-green-600 text-sm mb-3">
                  {challenge.isCurrentlyActive 
                    ? 'Your sleep metrics are being tracked and counted towards this challenge.'
                    : challenge.shouldBeCompleted
                    ? 'Challenge has ended. Results will be announced soon.'
                    : challenge.entryPeriodClosed
                    ? 'Entry period closed. Challenge will start soon.'
                    : 'You\'ve successfully joined this challenge.'
                  }
                </p>
                
                {/* Challenge Timeline Info */}
                {challenge.isCurrentlyActive && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span className="text-blue-800 font-medium text-sm">Challenge Period</span>
                    </div>
                    <p className="text-blue-700 text-xs">
                      Started: {new Date(challenge.challengeStartTime).toLocaleDateString()}
                    </p>
                    <p className="text-blue-700 text-xs">
                      Ends: {new Date(challenge.challengeEndTime).toLocaleDateString()}
                    </p>
                  </div>
                )}
                
                {challenge.shouldBeCompleted && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mt-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Trophy className="w-4 h-4 text-purple-600" />
                      <span className="text-purple-800 font-medium text-sm">Challenge Completed</span>
                    </div>
                    <p className="text-purple-700 text-xs">
                      Winners will be announced soon!
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  {challenge.isCompleted ? 'Challenge Completed' : 
                   challenge.entryPeriodClosed ? 'Entry Period Closed' :
                   challenge.canJoinNow ? 'Ready to Join?' : 'Challenge Upcoming'}
                </h3>
                
                {/* Status Messages */}
                {challenge.entryPeriodClosed && !challenge.isCompleted && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Warning className="w-4 h-4 text-yellow-600" />
                      <span className="text-yellow-800 font-medium text-sm">Entry Period Closed</span>
                    </div>
                    <p className="text-yellow-700 text-xs">
                      {challenge.isCurrentlyActive 
                        ? 'Challenge is currently active. New participants cannot join.'
                        : 'The entry period for this challenge has ended.'}
                    </p>
                  </div>
                )}
                
                {challenge.canJoinNow && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-green-800 font-medium text-sm">Entry Period Open</span>
                    </div>
                    <p className="text-green-700 text-xs">
                      Join now! Entry closes on {new Date(challenge.entryEndTime).toLocaleDateString()}
                    </p>
                  </div>
                )}
                
                <button
                  onClick={handleJoinChallenge}
                  disabled={!isConnected || !canJoin || !hasEnoughWLD || isJoining || web3Loading || isCheckingParticipation || hasJoined}
                  className={`w-full py-3 rounded-lg font-medium transition-colors ${
                    isConnected && canJoin && hasEnoughWLD && !isJoining && !web3Loading && !isCheckingParticipation && !hasJoined
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isCheckingParticipation ? 'Checking participation...' :
                   isJoining ? 'Joining...' : 
                   hasJoined ? 'Already Joined' :
                   challenge.isCompleted ? 'Challenge Completed' :
                   challenge.entryPeriodClosed ? 'Entry Period Closed' :
                   !hasEnoughWLD ? 'Insufficient WLD Balance' :
                   `Join Challenge (${challenge.entryFee} WLD)`}
                </button>
              </div>
            )}
          </div>

          {/* Your Balance */}
          <div className="bg-white/80 backdrop-blur-sm border border-gray-200 shadow-xl rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Wallet className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Your Current Balance</h3>
            </div>
            
            {isConnected ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">WLD Balance</span>
                  <span className="font-semibold text-gray-800">{wldBalance} WLD</span>
                </div>
                
                {!hasEnoughWLD && !challenge.isCompleted && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                    <Warning className="w-4 h-4 text-red-500" />
                    <span className="text-red-600 text-sm">Insufficient WLD balance</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
                <Warning className="w-4 h-4 text-yellow-500" />
                <span className="text-yellow-600 text-sm">
                  Open in World App to see your balance
                </span>
              </div>
            )}
          </div>

          {/* Contract Info */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4">
            <h4 className="font-semibold text-gray-800 mb-2 text-sm">Smart Contract</h4>
            <div className="space-y-1">
              <div className="text-xs text-gray-600">Contract Address:</div>
              <div className="text-xs text-gray-800 font-mono break-all">{HEALTH_CHALLENGE_ADDRESS}</div>
            </div>
          </div>
        </div>
      </div>
    </MobileScreen>
  );
} 