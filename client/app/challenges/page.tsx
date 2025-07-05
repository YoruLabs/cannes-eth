"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trophy, Users, Coins, Calendar, CheckCircle, Warning, Wallet } from "phosphor-react";
import NavBar from "../../components/layouts/NavBar";
import { useMiniKit } from "../../hooks/useMiniKit";
import { MiniKit } from "@worldcoin/minikit-js";
import { HEALTH_CHALLENGE_ADDRESS, WLD_TOKEN_ADDRESS } from "@/lib/web3";

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

  // Check wallet connection before showing challenges
  useEffect(() => {
    const checkWalletConnection = () => {
      setTimeout(() => {
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
          // Load challenge #2 (the one we created with 0.01 WLD)
          const challenge2 = await getChallengeData(1);
          
          if (challenge2) {
            setChallenges([challenge2]);
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
      <>
        <div className="min-h-screen bg-gray-50 pb-24">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-600 mt-4">
                {isCheckingWallet ? 'Checking wallet connection...' : 'Loading challenges...'}
              </p>
            </div>
          </div>
        </div>
        <NavBar />
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Health Challenges</h1>
              <p className="text-gray-600 mt-2">Stake WLD tokens and prove your commitment to healthy living</p>
            </div>
          </div>

          {/* Wallet Status */}
          <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-purple-500" />
              World App Wallet
            </h3>
            
            {isConnected ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-500" weight="fill" />
                    <span className="text-green-700 font-medium">Connected</span>
                  </div>
                  <div className="text-xs text-green-600 font-mono break-all">
                    {address}
                  </div>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-blue-700 text-sm mb-1">WLD Balance</div>
                  <div className="text-blue-900 font-semibold text-lg">{wldBalance} WLD</div>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-purple-700 text-sm mb-1">Network</div>
                  <div className="text-purple-900 font-semibold">World Chain Mainnet</div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-4 bg-yellow-50 rounded-lg">
                <Warning className="w-5 h-5 text-yellow-500" />
                <span className="text-yellow-700">
                  Please open this app in the World App to connect your wallet
                </span>
              </div>
            )}
          </div>

          {/* Challenges Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {challenges.length > 0 ? (
              challenges.map((challenge) => (
                <div key={challenge.id} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-6 h-6 text-yellow-500" />
                      <h3 className="text-lg font-semibold text-gray-900">{challenge.name}</h3>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(challenge.isActive, challenge.isCompleted)}`}>
                      {getStatusText(challenge.isActive, challenge.isCompleted)}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-4">
                    Walk 10,000 steps every day for 7 days straight. Prove your dedication to healthy living!
                  </p>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Coins className="w-4 h-4 text-yellow-500" />
                        <span className="text-gray-600 text-sm">Stake</span>
                      </div>
                      <span className="font-semibold text-gray-900">{challenge.entryFee} WLD</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-500" />
                        <span className="text-gray-600 text-sm">Participants</span>
                      </div>
                      <span className="font-semibold text-gray-900">{challenge.participantCount}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-green-500" />
                        <span className="text-gray-600 text-sm">Prize Pool</span>
                      </div>
                      <span className="font-semibold text-green-600">{challenge.totalPool} WLD</span>
                    </div>

                    <div className="pt-2 border-t border-gray-100">
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
                    className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
                  >
                    View Challenge
                  </button>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Challenges Available</h3>
                <p className="text-gray-600">Check back later for new health challenges!</p>
              </div>
            )}
          </div>

          {/* Contract Info */}
          <div className="bg-blue-50 rounded-xl p-6 mt-8">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Smart Contract Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-blue-700 mb-1">Health Challenge Contract:</div>
                <div className="text-blue-900 font-mono text-xs break-all">
                {HEALTH_CHALLENGE_ADDRESS}
                </div>
              </div>
              <div>
                <div className="text-blue-700 mb-1">WLD Token Contract:</div>
                <div className="text-blue-900 font-mono text-xs break-all">
                {WLD_TOKEN_ADDRESS}
                </div>
              </div>
              <div>
                <div className="text-blue-700 mb-1">Network:</div>
                <div className="text-blue-900">World Chain Mainnet (Chain ID: 480)</div>
              </div>
              <div>
                <div className="text-blue-700 mb-1">Explorer:</div>
                <div className="text-blue-900">worldscan.org</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <NavBar />
    </>
  );
} 