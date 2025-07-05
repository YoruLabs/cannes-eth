"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/providers/user-provider";
import { useSleepMetrics } from "@/hooks/useSleepMetrics";
import { CircleNotch, Heart, Moon, Activity, Thermometer, Warning, TrendUp, TrendDown, Minus } from "phosphor-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import MobileScreen from "@/components/layouts/MobileScreen";
import { FlickeringGrid } from "@/components/magicui/flickering-grid";

export default function StatsPage() {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [windowDimensions, setWindowDimensions] = useState({
    width: 375,
    height: 812,
  });
  const router = useRouter();
  const { user, isLoading } = useUser();
  const { sleepStats, isLoading: sleepLoading, error: sleepError } = useSleepMetrics(user?.wallet_address || null);

  /***** AUTH REDIRECTS *****/
  useEffect(() => {
    if (isLoading) return; // wait for user fetch

    const redirect = async () => {
      setIsRedirecting(true);
      
      // Small delay to prevent redirect flashing
      await new Promise(resolve => setTimeout(resolve, 100));

      if (!user) {
        // Not authenticated -> go to login
        router.push("/login");
      } else if (!user.is_verified || !user.username) {
        // User is authenticated but not verified or missing username -> go to onboarding
        router.push("/onboarding");
      }
    };

    if (!user || !user.is_verified || !user.username) {
      redirect();
    }
  }, [user, isLoading, router]);

  /***** LOADING STATE *****/
  if (isLoading || isRedirecting) {
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
            {isRedirecting ? "Redirecting..." : "Loading..."}
          </p>
        </div>
      </MobileScreen>
    );
  }

  // Helper function to get trend icon
  const getTrendIcon = (trend: 'improving' | 'declining' | 'stable') => {
    switch (trend) {
      case 'improving':
        return <TrendUp className="w-4 h-4 text-green-600" />;
      case 'declining':
        return <TrendDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  // Helper function to format chart data labels
  const formatChartDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Colors for pie chart
  const pieColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  // Show stats page for fully authenticated and verified users
  if (user && user.is_verified && user.username) {
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
              <p className="text-4xl font-bold text-gray-800 mb-3">Stats</p>
              <p className="text-gray-600 mb-6">Your health metrics</p>
              
              {/* Data Status Indicator */}
              {sleepLoading && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <CircleNotch className="h-4 w-4 animate-spin" />
                  <span>Loading your data...</span>
                </div>
              )}
              
              {sleepError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded-lg">
                  <Warning className="h-4 w-4" />
                  <span>Error loading data: {sleepError}</span>
                </div>
              )}
              
              {!sleepLoading && !sleepError && !sleepStats.hasData && (
                <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-2 rounded-lg">
                  <Warning className="h-4 w-4" />
                  <span>No sleep data found. Connect your device to see your metrics!</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-6 max-w-md mx-auto w-full">
            {/* Current Sleep Stats - Single Values */}
            <div className="bg-white/80 backdrop-blur-sm border border-gray-200 shadow-xl rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Moon className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Last Night</h3>
                {sleepStats.hasData && sleepStats.summary?.trends && getTrendIcon(sleepStats.summary.trends.sleepDuration)}
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-800">{sleepStats.current.sleep.lastNight.duration}</p>
                  <p className="text-xs text-gray-600">Duration</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-800">{sleepStats.current.sleep.lastNight.efficiency}%</p>
                  <p className="text-xs text-gray-600">Efficiency</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{sleepStats.current.sleep.lastNight.score}</p>
                  <p className="text-xs text-gray-600">Score</p>
                </div>
              </div>
              
              {/* Progress bar for sleep score */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${sleepStats.current.sleep.lastNight.score}%` }}
                ></div>
              </div>
            </div>

            {/* Sleep Duration Trend Chart - Historical */}
            {sleepStats.hasData && sleepStats.historical?.last7Days?.length > 0 && (
              <div className="bg-white/80 backdrop-blur-sm border border-gray-200 shadow-xl rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Moon className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Sleep Duration (7 Days)</h3>
                </div>
                
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sleepStats.historical.last7Days}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatChartDate}
                        fontSize={12}
                        stroke="#666"
                      />
                      <YAxis 
                        domain={['dataMin - 0.5', 'dataMax + 0.5']}
                        fontSize={12}
                        stroke="#666"
                      />
                      <Tooltip 
                        labelFormatter={(value) => formatChartDate(value)}
                        formatter={(value: number) => [`${value}h`, 'Sleep Duration']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="sleep_duration" 
                        stroke="#3B82F6" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Heart Rate Stats - Current Values */}
            <div className="bg-white/80 backdrop-blur-sm border border-gray-200 shadow-xl rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Heart className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Heart Rate</h3>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-800">{sleepStats.current.sleep.heartRate.resting}</p>
                  <p className="text-xs text-gray-600">Resting</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-800">{sleepStats.current.sleep.heartRate.average}</p>
                  <p className="text-xs text-gray-600">Average</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-800">{sleepStats.current.sleep.heartRate.max}</p>
                  <p className="text-xs text-gray-600">Est. Max</p>
                </div>
              </div>
            </div>

            {/* Sleep Efficiency Chart - Historical */}
            {sleepStats.hasData && sleepStats.historical?.last7Days?.length > 0 && (
              <div className="bg-white/80 backdrop-blur-sm border border-gray-200 shadow-xl rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Activity className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Sleep Efficiency (7 Days)</h3>
                  {sleepStats.summary?.trends && getTrendIcon(sleepStats.summary.trends.efficiency)}
                </div>
                
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sleepStats.historical.last7Days}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatChartDate}
                        fontSize={12}
                        stroke="#666"
                      />
                      <YAxis 
                        domain={[0, 100]}
                        fontSize={12}
                        stroke="#666"
                      />
                      <Tooltip 
                        labelFormatter={(value) => formatChartDate(value)}
                        formatter={(value: number) => [`${value}%`, 'Efficiency']}
                      />
                      <Bar 
                        dataKey="sleep_efficiency" 
                        fill="#10B981"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Sleep Stages Breakdown - Latest Night */}
            {sleepStats.hasData && sleepStats.historical?.last7Days?.length > 0 && (
              <div className="bg-white/80 backdrop-blur-sm border border-gray-200 shadow-xl rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Thermometer className="w-5 h-5 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Sleep Stages (Last Night)</h3>
                </div>
                
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Deep Sleep', value: sleepStats.historical.last7Days[sleepStats.historical.last7Days.length - 1]?.deep_sleep_minutes || 0 },
                          { name: 'REM Sleep', value: sleepStats.historical.last7Days[sleepStats.historical.last7Days.length - 1]?.rem_sleep_minutes || 0 },
                          { name: 'Light Sleep', value: sleepStats.historical.last7Days[sleepStats.historical.last7Days.length - 1]?.light_sleep_minutes || 0 },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}m`}
                        outerRadius={60}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {sleepStats.historical.last7Days.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`${value} min`, '']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Recovery Stats - Current Values */}
            <div className="bg-white/80 backdrop-blur-sm border border-gray-200 shadow-xl rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Thermometer className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Recovery</h3>
                {sleepStats.hasData && sleepStats.summary?.trends && getTrendIcon(sleepStats.summary.trends.recovery)}
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Recovery Score</span>
                  <span className="font-semibold text-purple-600">{sleepStats.current.sleep.recovery.score}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Readiness</span>
                  <span className="font-semibold text-gray-800">{sleepStats.current.sleep.recovery.readiness}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">HRV</span>
                  <span className="font-semibold text-gray-800">{sleepStats.current.sleep.recovery.hrv}ms</span>
                </div>
                
                {/* Progress bar for recovery score */}
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${sleepStats.current.sleep.recovery.score}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Weekly Summary */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-4">
              <h4 className="font-semibold text-gray-800 mb-2">
                {sleepStats.hasData ? "Weekly Summary" : "Get Started"}
              </h4>
              {sleepStats.hasData && sleepStats.summary ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Average Sleep:</span>
                    <span className="font-medium">{sleepStats.summary.weeklyAverage.duration}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Average Efficiency:</span>
                    <span className="font-medium">{sleepStats.summary.weeklyAverage.efficiency}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Average Score:</span>
                    <span className="font-medium">{sleepStats.summary.weeklyAverage.score}/100</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    {sleepStats.summary.weeklyAverage.efficiency > 80 ? 
                      "Excellent sleep patterns! Keep up the great work! 🌟" :
                      "Room for improvement. Consider a consistent bedtime routine! 💤"
                    }
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-600">
                  Connect your health devices to start tracking your sleep metrics and see beautiful charts of your progress! 🚀
                </p>
              )}
            </div>
          </div>
        </div>
      </MobileScreen>
    );
  }

  return null;
} 