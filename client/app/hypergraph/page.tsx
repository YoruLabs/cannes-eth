'use client';

import React, { useState, useEffect } from 'react';
import { 
  useCreateEntity, 
  useHypergraphApp,
  useQuery,
  useSpaces,
  HypergraphSpaceProvider,
  useHypergraphAuth,
  useSpace
} from '@graphprotocol/hypergraph-react';
import { User_Oura_Data } from '@/lib/hypergraph-schema';
import { HYPERGRAPH_CONFIG } from '@/lib/hypergraph-config';
import { useUser } from '@/providers/user-provider';
import NavBar from '@/components/layouts/NavBar';

// Navbar Component
function Navbar() {
  const { authenticated } = useHypergraphAuth();
  const { redirectToConnect } = useHypergraphApp();
  const { user } = useUser();
  const { ready: spaceReady, name: spaceName } = useSpace({ mode: 'private' });
  const { data: privateOuraData } = useQuery(User_Oura_Data, { mode: 'private' });

  const handleConnect = () => {
    redirectToConnect({
      storage: localStorage,
      connectUrl: 'https://hypergraph-connect.vercel.app/',
      successUrl: 'https://996d-83-144-23-156.ngrok-free.app/hypergraph',
      appId: HYPERGRAPH_CONFIG.appId,
      redirectFn: (url: URL) => {
        window.open(url.toString());
      },
    });
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-gray-900">Health Wallet</span>
              </div>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {authenticated ? (
              <>
                {/* Space Status */}
                <div className="hidden sm:flex items-center text-sm text-gray-600">
                  <div className={`w-2 h-2 rounded-full mr-2 ${spaceReady ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>{spaceName || 'Unknown'}</span>
                </div>

                {/* Records Count */}
                <div className="hidden md:flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>{privateOuraData?.length || 0} records</span>
                </div>

                {/* User Info */}
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user?.wallet_address?.slice(2, 4).toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-3 hidden sm:block">
                    <div className="text-sm font-medium text-gray-900">
                      {user?.wallet_address?.slice(0, 6)}...{user?.wallet_address?.slice(-4)}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Connect Button when not authenticated */
              <button
                onClick={handleConnect}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Connect Data Wallet</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

// Main Dashboard Component
function Dashboard() {
  const [uploadingOura, setUploadingOura] = useState(false);
  const [uploadingWhoop, setUploadingWhoop] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);

  const { user } = useUser();
  const { ready: spaceReady, name: spaceName, id: spaceId } = useSpace({ mode: 'private' });
  const { data: privateOuraData } = useQuery(User_Oura_Data, { mode: 'private' });
  const createOuraData = useCreateEntity(User_Oura_Data);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Fetch user data from Supabase (used internally before uploads)
  const fetchUserHealthData = async (): Promise<any> => {
    if (!user?.wallet_address) {
      throw new Error('User wallet address not found');
    }

    const response = await fetch('/api/user/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress: user.wallet_address }),
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error);
    }

    return data.data;
  };

  // Upload Oura data to Hypergraph (now includes automatic Supabase fetch)
  const handleUploadOuraData = async () => {
    if (!spaceReady) {
      showNotification('error', 'Private space not ready');
      return;
    }

    setUploadingOura(true);
    try {
      // Step 1: Fetch latest data from Supabase
      showNotification('info', 'Fetching latest data from Supabase...');
      const userHealthData = await fetchUserHealthData();
      
      if (!userHealthData?.sleepMetrics?.length) {
        showNotification('error', 'No sleep data found in Supabase');
        return;
      }

      // Step 2: Upload to Hypergraph
      showNotification('info', `Uploading ${userHealthData.sleepMetrics.length} sleep records to Hypergraph...`);
      let uploadedCount = 0;
      const sleepMetrics = userHealthData.sleepMetrics;

      for (const sleepRecord of sleepMetrics) {
        const ouraDataEntity = {
          user_wallet_address: user?.wallet_address || 'unknown',
          user_id: sleepRecord.user_id || 'unknown',
          start_time: sleepRecord.start_time || '',
          end_time: sleepRecord.end_time || '',
          total_sleep_duration_seconds: sleepRecord.total_sleep_duration_seconds || 0,
          deep_sleep_duration_seconds: sleepRecord.deep_sleep_duration_seconds || 0,
          light_sleep_duration_seconds: sleepRecord.light_sleep_duration_seconds || 0,
          rem_sleep_duration_seconds: sleepRecord.rem_sleep_duration_seconds || 0,
          awake_duration_seconds: sleepRecord.awake_duration_seconds || 0,
          sleep_efficiency: sleepRecord.sleep_efficiency || 0,
          sleep_score: sleepRecord.sleep_score || 0,
          sleep_quality_score: sleepRecord.sleep_quality_score || 0,
          sleep_latency_seconds: sleepRecord.sleep_latency_seconds || 0,
          wake_up_latency_seconds: sleepRecord.wake_up_latency_seconds || 0,
          avg_heart_rate_bpm: sleepRecord.avg_heart_rate_bpm || 0,
          resting_heart_rate_bpm: sleepRecord.resting_heart_rate_bpm || 0,
          avg_hrv_rmssd: sleepRecord.avg_hrv_rmssd || 0,
          avg_hrv_sdnn: sleepRecord.avg_hrv_sdnn || 0,
          avg_oxygen_saturation: sleepRecord.avg_oxygen_saturation || 0,
          avg_breathing_rate: sleepRecord.avg_breathing_rate || 0,
          snoring_duration_seconds: sleepRecord.snoring_duration_seconds || 0,
          temperature_delta: sleepRecord.temperature_delta || 0,
          readiness_score: sleepRecord.readiness_score || 0,
          recovery_score: sleepRecord.recovery_score || 0,
          efficiency_score: sleepRecord.efficiency_score || 0,
          health_score: sleepRecord.health_score || 0,
          recovery_level: sleepRecord.recovery_level || 0,
          created_at: sleepRecord.created_at || new Date().toISOString(),
          data_source: 'oura'
        };

        createOuraData(ouraDataEntity);
        uploadedCount++;
      }

      showNotification('success', `Successfully uploaded ${uploadedCount} Oura sleep records to Hypergraph`);
    } catch (error) {
      showNotification('error', `Upload failed: ${error}`);
    } finally {
      setUploadingOura(false);
    }
  };

  // Upload Whoop data (placeholder - similar to Oura)
  const handleUploadWhoopData = async () => {
    if (!spaceReady) {
      showNotification('error', 'Private space not ready');
      return;
    }

    setUploadingWhoop(true);
    try {
      // Step 1: Fetch latest data from Supabase
      showNotification('info', 'Fetching latest Whoop data from Supabase...');
      const userHealthData = await fetchUserHealthData();
      
      if (!userHealthData?.sleepMetrics?.length) {
        showNotification('error', 'No sleep data found in Supabase');
        return;
      }

      // Step 2: Similar implementation to Oura but with data_source: 'whoop'
      showNotification('info', 'Whoop upload functionality coming soon');
    } catch (error) {
      showNotification('error', `Upload failed: ${error}`);
    } finally {
      setUploadingWhoop(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Notification */}
      {notification && (
        <div className={`max-w-6xl mx-auto px-4 py-2`}>
          <div className={`p-4 rounded-lg ${
            notification.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
            notification.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
            'bg-blue-50 text-blue-800 border border-blue-200'
          }`}>
            {notification.message}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Upload Oura Card */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Sync Oura Data</h3>
                <p className="text-sm text-gray-600">Fetch from Supabase & upload to Hypergraph</p>
              </div>
            </div>
            <button
              onClick={handleUploadOuraData}
              disabled={uploadingOura || !spaceReady}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {uploadingOura ? 'Syncing...' : 'Sync Oura Data'}
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Automatically fetches latest data from Supabase and stores in Hypergraph
            </p>
          </div>

          {/* Upload Whoop Card */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Sync Whoop Data</h3>
                <p className="text-sm text-gray-600">Fetch from Supabase & upload to Hypergraph</p>
              </div>
            </div>
            <button
              onClick={handleUploadWhoopData}
              disabled={uploadingWhoop || !spaceReady}
              className="w-full bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {uploadingWhoop ? 'Syncing...' : 'Sync Whoop Data'}
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Automatically fetches latest data from Supabase and stores in Hypergraph
            </p>
          </div>
        </div>

        {/* Data Display */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Your Sleep Data</h2>
            <p className="text-sm text-gray-600">Data stored in your private Hypergraph space</p>
          </div>

          <div className="p-6">
            {privateOuraData && privateOuraData.length > 0 ? (
              <div className="space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Total Records</p>
                    <p className="text-2xl font-bold text-gray-900">{privateOuraData.length}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Total Sleep</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.round(privateOuraData.reduce((total: number, record: any) => total + (record.total_sleep_duration_seconds || 0), 0) / 3600)}h
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Avg Efficiency</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.round(privateOuraData.reduce((total: number, record: any) => total + (record.sleep_efficiency || 0), 0) / privateOuraData.length)}%
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Avg Score</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.round(privateOuraData.reduce((total: number, record: any) => total + (record.sleep_score || 0), 0) / privateOuraData.length)}
                    </p>
                  </div>
                </div>

                {/* Sleep Records List */}
                <div className="space-y-3">
                  <h3 className="text-lg font-medium text-gray-900">Recent Sleep Sessions</h3>
                  {privateOuraData.slice(0, 10).map((record, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {new Date(record.start_time).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            {Math.round(record.total_sleep_duration_seconds / 3600 * 10) / 10}h sleep
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{record.sleep_efficiency}% efficiency</p>
                        <p className="text-sm text-gray-600">Score: {record.sleep_score || 'N/A'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Found</h3>
                <p className="text-gray-600 mb-4">Start by syncing your health data from Supabase to Hypergraph</p>
                <button
                  onClick={handleUploadOuraData}
                  className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Sync Your Data
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <NavBar />
    </div>
  );
}

// Main Component with Space Provider
function CoreOperations() {
  const { authenticated } = useHypergraphAuth();
  const { processConnectAuthSuccess } = useHypergraphApp();

  // Handle auth success
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ciphertext = urlParams.get('ciphertext');
    const nonce = urlParams.get('nonce');
    
    if (ciphertext && nonce) {
      processConnectAuthSuccess({ storage: localStorage, ciphertext, nonce });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [processConnectAuthSuccess]);

  if (!authenticated) {
    return <ConnectDataWallet />;
  }

  return <Dashboard />;
}

// Connect Data Wallet Component
function ConnectDataWallet() {
  const { redirectToConnect } = useHypergraphApp();
  
  const handleConnect = () => {
    redirectToConnect({
      storage: localStorage,
      connectUrl: 'https://hypergraph-connect.vercel.app/',
      successUrl: 'https://996d-83-144-23-156.ngrok-free.app/hypergraph',
      appId: HYPERGRAPH_CONFIG.appId,
      redirectFn: (url: URL) => {
        window.open(url.toString());
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      <div className="flex items-center justify-center px-4" style={{ minHeight: 'calc(100vh - 64px)' }}>
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Connect Data Wallet</h1>
              <p className="text-gray-600">Securely connect your wallet to access your health data on the Hypergraph</p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center text-sm text-gray-700">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Store your Oura & Whoop data privately
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Access your data from anywhere
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Decentralized & secure storage
              </div>
            </div>

            <button
              onClick={handleConnect}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105"
            >
              Connect Wallet
            </button>

            <p className="text-xs text-gray-500 mt-4">
              Your data is encrypted and stored in your private space
            </p>
          </div>
        </div>
      </div>
      <NavBar />
    </div>
  );
}

export default function HypergraphPage() {
  const { data: privateSpaces } = useSpaces({ mode: 'private' });
  const { authenticated } = useHypergraphAuth();
  
  // Use first available private space or fallback to config
  const spaceToUse = privateSpaces?.[0]?.id || HYPERGRAPH_CONFIG.privateSpaceId;
  
  return (
    <HypergraphSpaceProvider space={spaceToUse}>
      <CoreOperations />
    </HypergraphSpaceProvider>
  );
} 