"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trophy, Users, Coins } from "phosphor-react";
import { useWeb3 } from "../../hooks/useWeb3";

export default function ChallengesPage() {
  const router = useRouter();
  const { getChallengeData } = useWeb3();
  const [challenge, setChallenge] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadChallenge = async () => {
      try {
        const challengeData = await getChallengeData(1); // Challenge ID 1
        if (challengeData) {
          setChallenge(challengeData);
        }
      } catch (error) {
        console.error('Failed to load challenge:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChallenge();
  }, [getChallengeData]);

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
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Health Challenges</h1>
            <p className="text-gray-600">
              Stake WLD tokens and earn rewards by completing health goals
            </p>
          </div>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading challenges...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Health Challenges</h1>
          <p className="text-gray-600">
            Stake WLD tokens and earn rewards by completing health goals
          </p>
        </div>

        {/* Challenge Card */}
        {challenge ? (
          <div className="max-w-md mx-auto">
            <div
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer"
              onClick={() => router.push(`/challenges/${challenge.id}`)}
            >
              <div className="flex items-center justify-between mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(challenge.isActive, challenge.isCompleted)}`}>
                  {getStatusText(challenge.isActive, challenge.isCompleted)}
                </span>
                <Trophy className="w-5 h-5 text-yellow-500" weight="fill" />
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">{challenge.name}</h3>
              <p className="text-gray-600 text-sm mb-4">Walk 10,000 steps every day for 7 days straight</p>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-yellow-500" />
                    <span className="text-gray-600">{challenge.entryFee} WLD</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span className="text-gray-600">{challenge.participantCount}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
                  <span className="text-gray-600">Prize Pool</span>
                  <span className="font-semibold text-green-600">{challenge.totalPool} WLD</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No challenges available</h3>
            <p className="text-gray-600">Check back later for new challenges.</p>
          </div>
        )}
      </div>
    </div>
  );
} 