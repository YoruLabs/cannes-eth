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
  SignOut
} from "phosphor-react";
import NavBar from "../../../components/layouts/NavBar";
import { useWeb3 } from "../../../hooks/useWeb3";

export default function ChallengePage() {
  const params = useParams();
  const router = useRouter();
  const { 
    isConnected, 
    address, 
    wldBalance, 
    isLoading: web3Loading,
    isManualConnection,
    connectWallet,
    connectDeployerAddress,
    disconnectWallet,
    getChallengeData,
    joinChallenge,
    completeChallenge
  } = useWeb3();

  const [challenge, setChallenge] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);

  const challengeId = parseInt(params.id as string);

  useEffect(() => {
    const loadChallenge = async () => {
      try {
        const challengeData = await getChallengeData(challengeId);
        if (challengeData) {
          setChallenge(challengeData);
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
  }, [challengeId, getChallengeData]);

  const handleJoinChallenge = async () => {
    if (!isConnected) {
      alert("Please connect your wallet first!");
      return;
    }

    setIsJoining(true);
    
    try {
      const result = await joinChallenge(challengeId, challenge.entryFee);
      
      if (result.success) {
        setHasJoined(true);
        alert(`Successfully joined "${challenge.name}"! Transaction: ${result.txHash}`);
        
        // Refresh challenge data
        const updatedChallenge = await getChallengeData(challengeId);
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

  const handleCompleteChallenge = async () => {
    if (!isConnected) {
      alert("Please connect your wallet first!");
      return;
    }

    setIsCompleting(true);
    
    try {
      const result = await completeChallenge(challengeId);
      
      if (result.success) {
        alert(`Successfully completed "${challenge.name}"! Transaction: ${result.txHash}`);
        
        // Refresh challenge data
        const updatedChallenge = await getChallengeData(challengeId);
        if (updatedChallenge) {
          setChallenge(updatedChallenge);
        }
      } else {
        alert(`Failed to complete challenge: ${result.error}`);
      }
    } catch (error) {
      console.error("Error completing challenge:", error);
      alert("Failed to complete challenge. Please try again.");
    } finally {
      setIsCompleting(false);
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
      <>
        <div className="min-h-screen bg-gray-50 pb-24">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading challenge...</p>
            </div>
          </div>
        </div>
        <NavBar />
      </>
    );
  }

  if (!challenge) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center pb-24">
          <div className="text-center">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Challenge Not Found</h1>
            <p className="text-gray-600 mb-4">The challenge you&apos;re looking for doesn&apos;t exist.</p>
            <button
              onClick={() => router.push('/challenges')}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Back to Challenges
            </button>
          </div>
        </div>
        <NavBar />
      </>
    );
  }

  const canJoin = challenge.isActive && !challenge.isCompleted;
  const hasEnoughWLD = parseFloat(wldBalance) >= parseFloat(challenge.entryFee);

  return (
    <>
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => router.push('/challenges')}
              className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{challenge.name}</h1>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(challenge.isActive, challenge.isCompleted)} mt-2`}>
                {getStatusText(challenge.isActive, challenge.isCompleted)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Challenge Info */}
              <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">About This Challenge</h3>
                <p className="text-gray-700 mb-6">Walk 10,000 steps every day for 7 days straight. Connect your fitness tracker and prove your dedication!</p>
                
                <h4 className="font-medium text-gray-900 mb-3">Requirements:</h4>
                <ul className="space-y-2">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-green-500" weight="fill" />
                    <span className="text-gray-700">Walk 10,000+ steps daily</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-green-500" weight="fill" />
                    <span className="text-gray-700">Connect fitness tracker</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-green-500" weight="fill" />
                    <span className="text-gray-700">Complete all 7 days</span>
                  </li>
                </ul>
              </div>

              {/* Contract Info */}
              <div className="bg-blue-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Smart Contract</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Contract:</span>
                    <span className="text-blue-900 font-mono text-xs">0x73c455192547Feb273C000d8B9ee475bA7EabE49</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Network:</span>
                    <span className="text-blue-900">World Chain Sepolia</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Challenge ID:</span>
                    <span className="text-blue-900">{challenge.id}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Challenge Stats */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Challenge Stats</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Coins className="w-5 h-5 text-yellow-500" />
                      <span className="text-gray-600">Stake</span>
                    </div>
                    <span className="font-semibold text-gray-900">{challenge.entryFee} WLD</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-500" />
                      <span className="text-gray-600">Participants</span>
                    </div>
                    <span className="font-semibold text-gray-900">{challenge.participantCount}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-green-500" />
                      <span className="text-gray-600">Prize Pool</span>
                    </div>
                    <span className="font-semibold text-green-600">{challenge.totalPool} WLD</span>
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-5 h-5 text-purple-500" />
                      <span className="text-gray-600">Status</span>
                    </div>
                    <p className="text-sm text-gray-700">
                      {challenge.isCompleted ? 'Challenge completed' : 
                       challenge.isActive ? 'Challenge is active' : 'Challenge upcoming'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Wallet Status */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-purple-500" />
                  Wallet
                </h3>
                
                {isConnected ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" weight="fill" />
                        <span className="text-green-700">
                          {isManualConnection ? 'Manual Connection' : 'MetaMask Connected'}
                        </span>
                      </div>
                      <button
                        onClick={disconnectWallet}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        title="Disconnect"
                      >
                        <SignOut className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">Address:</div>
                      <div className="font-mono text-xs text-gray-700 break-all">
                        {address}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">WLD Balance:</span>
                      <span className="font-semibold text-gray-900">{wldBalance} WLD</span>
                    </div>
                    
                    {!hasEnoughWLD && (
                      <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                        <Warning className="w-5 h-5 text-red-500" />
                        <span className="text-red-700 text-sm">Insufficient WLD</span>
                      </div>
                    )}

                    {isManualConnection && (
                      <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
                        <Warning className="w-5 h-5 text-yellow-500" />
                        <span className="text-yellow-700 text-sm">
                          Manual connection - transactions disabled
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <button
                      onClick={connectWallet}
                      className="w-full bg-purple-500 text-white py-3 rounded-lg hover:bg-purple-600 transition-colors"
                    >
                      Connect MetaMask
                    </button>
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200" />
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="bg-white px-2 text-gray-500">or</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={connectDeployerAddress}
                      className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors"
                    >
                      Connect Deployer Address
                    </button>
                    
                    <p className="text-xs text-gray-500 text-center">
                      Deployer address has 1,000,000 WLD tokens for testing
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                {hasJoined ? (
                  <div className="text-center mb-4">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" weight="fill" />
                    <h3 className="text-lg font-semibold text-green-700 mb-2">Joined!</h3>
                    <p className="text-green-600 text-sm">You&apos;ve successfully joined this challenge.</p>
                  </div>
                ) : (
                  <div className="space-y-4 mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Ready to Join?</h3>
                    
                    {!canJoin && (
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <Warning className="w-5 h-5 text-gray-500" />
                        <span className="text-gray-700 text-sm">Not available for joining</span>
                      </div>
                    )}
                    
                    <button
                      onClick={handleJoinChallenge}
                      disabled={!isConnected || !canJoin || !hasEnoughWLD || isJoining || web3Loading}
                      className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                        isConnected && canJoin && hasEnoughWLD && !isJoining && !web3Loading
                          ? 'bg-green-500 text-white hover:bg-green-600'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {isJoining ? 'Joining...' : `Join (${challenge.entryFee} WLD)`}
                    </button>
                  </div>
                )}

                {/* Complete Challenge Button (for testing) */}
                <div className="pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Admin Actions</h4>
                  <button
                    onClick={handleCompleteChallenge}
                    disabled={!isConnected || isCompleting || web3Loading || challenge.isCompleted}
                    className={`w-full py-2 rounded-lg text-sm font-semibold transition-colors ${
                      isConnected && !isCompleting && !web3Loading && !challenge.isCompleted
                        ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {isCompleting ? 'Completing...' : 'Complete Challenge'}
                  </button>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    For testing purposes only
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <NavBar />
    </>
  );
} 