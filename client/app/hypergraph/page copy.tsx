'use client';

import React, { useState, useEffect } from 'react';
import { 
  useCreateEntity, 
  preparePublish, 
  publishOps, 
  useHypergraphApp,
  useQuery,
  useSpaces,
  HypergraphSpaceProvider,
  useHypergraphAuth,
  useSpace
} from '@graphprotocol/hypergraph-react';
import { Connect } from '@graphprotocol/hypergraph';
import { Patient, HealthProvider, User_Oura_Data } from '@/lib/hypergraph-schema';
import { HYPERGRAPH_CONFIG } from '@/lib/hypergraph-config';
import { useUser } from '@/providers/user-provider';

function CoreOperations() {
  const [results, setResults] = useState<string[]>([]);
  const [userDataLoading, setUserDataLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [fetchedUserData, setFetchedUserData] = useState<any>(null);
  const { authenticated } = useHypergraphAuth();
  const { user } = useUser();
  const { redirectToConnect, processConnectAuthSuccess, getSmartSessionClient } = useHypergraphApp();
  
  // Check space status
  const { ready: spaceReady, name: spaceName, id: spaceId } = useSpace({ mode: 'private' });
  
  // Hooks for data access
  const { data: privatePatients } = useQuery(Patient, { mode: 'private' });
  const { data: privateProviders } = useQuery(HealthProvider, { mode: 'private' });
  const { data: privateOuraData } = useQuery(User_Oura_Data, { mode: 'private' });
  const { data: publicSpaces } = useSpaces({ mode: 'public' });
  const { data: privateSpaces } = useSpaces({ mode: 'private' });
  const createPatient = useCreateEntity(Patient);
  const createHealthProvider = useCreateEntity(HealthProvider);
  const createOuraData = useCreateEntity(User_Oura_Data);
  
  // Alternative creation hook (no space specified)
  const createPatientAlt = useCreateEntity(Patient, { space: undefined });

  const addResult = (message: string) => {
    setResults(prev => [`${new Date().toLocaleTimeString()}: ${message}`, ...prev.slice(0, 9)]);
  };

  // Debug space status
  useEffect(() => {
    console.log("Space Debug Info:", {
      spaceReady,
      spaceName,
      spaceId,
      configSpaceId: HYPERGRAPH_CONFIG.privateSpaceId,
      authenticated,
      privateSpacesCount: privateSpaces?.length || 0,
      availablePrivateSpaces: privateSpaces?.map(s => ({ id: s.id, name: s.name }))
    });
  }, [spaceReady, spaceName, spaceId, authenticated, privateSpaces]);

  // Handle auth success
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ciphertext = urlParams.get('ciphertext');
    const nonce = urlParams.get('nonce');
    
    if (ciphertext && nonce) {
      processConnectAuthSuccess({ storage: localStorage, ciphertext, nonce });
      window.history.replaceState({}, document.title, window.location.pathname);
      addResult("✅ Authentication successful!");
    }
  }, [processConnectAuthSuccess]);

  // 1. Authentication
  const handleAuthenticate = () => {
    if (authenticated) {
      addResult("Already authenticated!");
      return;
    }
    
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

  // 2. Read from Private Space
  const handleReadPrivate = () => {
    addResult(`📖 Private Data - Patients: ${privatePatients?.length || 0}, Providers: ${privateProviders?.length || 0}, Spaces: ${privateSpaces?.length || 0}`);
    console.log("Private Patients:", privatePatients);
    console.log("Private Providers:", privateProviders);
    console.log("Private Spaces:", privateSpaces);
  };

  // 3. Publish to Private Space (Create only)
  const handlePublishToPrivate = async () => {
    if (!authenticated) {
      addResult("❌ Must authenticate first!");
      return;
    }

    if (!spaceReady) {
      addResult("❌ Private space not ready! Check console for debug info.");
      console.log("Space not ready - Debug info:", {
        spaceReady,
        spaceName,
        spaceId,
        privateSpacesAvailable: privateSpaces?.length || 0
      });
      return;
    }

    try {
      addResult(`🔄 Creating patient in space: ${spaceName || spaceId}`);
      
      // Create a sample patient in private space
      const patient = createPatient({
        name: "John Doe",
        age: 30,
        email: "john@example.com"
      });
      
      addResult("✅ Created and published patient to private space");
      console.log("Patient created in private space:", patient);
      
    } catch (error) {
      addResult(`❌ Publish to private failed: ${error}`);
      console.error("Private publish error:", error);
      console.log("Error context:", {
        spaceReady,
        spaceName,
        spaceId,
        authenticated,
        privateSpacesCount: privateSpaces?.length || 0
      });
    }
  };

  // Alternative: Try to create without explicit space (let the system handle it)
  const handleTryAlternativeCreate = async () => {
    if (!authenticated) {
      addResult("❌ Must authenticate first!");
      return;
    }

    try {
      addResult("🧪 Trying alternative approach (no explicit space)...");
      
      // Try creating with a different useCreateEntity approach
      const patient = createPatientAlt({
        name: "Jane Doe (Alt)",
        age: 25,
        email: "jane@example.com"
      });
      
      addResult("✅ Alternative creation successful!");
      console.log("Patient created with alternative approach:", patient);
      
    } catch (error) {
      addResult(`❌ Alternative approach failed: ${error}`);
      console.error("Alternative creation error:", error);
    }
  };

  // 4. Read from Public Space
  const handleReadPublic = () => {
    const publicSpaceCount = publicSpaces?.length || 0;
    addResult(`🌍 Public Spaces Available: ${publicSpaceCount}`);
    if (publicSpaces) {
      publicSpaces.forEach(space => {
        addResult(`  • ${space.name} (${space.id})`);
      });
    }
    console.log("Public Spaces:", publicSpaces);
  };

  // 5. Read Patients Data specifically
  const handleReadPatientsData = () => {
    const patientCount = privatePatients?.length || 0;
    addResult(`👥 Found ${patientCount} patient(s) in private space`);
    
    if (privatePatients && privatePatients.length > 0) {
      privatePatients.forEach((patient, index) => {
        addResult(`  ${index + 1}. ${patient.name} (Age: ${patient.age}, Email: ${patient.email})`);
      });
      addResult("📊 Full patient data logged to console");
      console.log("Detailed Patients Data:", privatePatients);
    } else {
      addResult("📭 No patients found in private space");
    }

    // Also log space and query context
    console.log("Patients Query Context:", {
      spaceReady,
      spaceName,
      spaceId,
      patientCount,
      patients: privatePatients
    });
  };

  // 6. Fetch User Data and Sleep Metrics
  const handleFetchUserData = async () => {
    if (!user?.wallet_address) {
      addResult("❌ Please login first to fetch user data!");
      return;
    }

    setUserDataLoading(true);
    addResult(`🔍 Fetching user data for: ${user.wallet_address}`);

    try {
      const response = await fetch('/api/user/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress: user.wallet_address }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        const { profile, connections, sleepMetrics, summary } = data.data;
        
        // Store fetched data for potential upload
        setFetchedUserData(data.data);
        
        addResult(`✅ User data fetched successfully!`);
        addResult(`👤 Profile: ${summary.hasProfile ? 'Found' : 'Not Found'}`);
        addResult(`🔗 Connections: ${summary.connectionCount} (${summary.providers.join(', ')})`);
        addResult(`😴 Sleep Metrics: ${summary.sleepMetricsCount} records`);
        
        // Log detailed data to console
        console.log("📊 Complete User Data:", {
          profile,
          connections,
          sleepMetrics,
          summary,
          fetched_at: data.fetched_at
        });
        
        if (sleepMetrics && sleepMetrics.length > 0) {
          const latestSleep = sleepMetrics[0];
          addResult(`💤 Latest Sleep: ${new Date(latestSleep.start_time).toLocaleDateString()}`);
          addResult(`  Duration: ${Math.floor(latestSleep.total_sleep_duration_seconds / 3600)}h ${Math.floor((latestSleep.total_sleep_duration_seconds % 3600) / 60)}m`);
          addResult(`  Efficiency: ${latestSleep.sleep_efficiency}%`);
          addResult(`  Score: ${latestSleep.sleep_score || 'N/A'}`);
        }
        
        addResult("📋 Full data logged to console");
      } else {
        addResult(`❌ Failed to fetch user data: ${data.error}`);
      }
    } catch (error) {
      console.error('User data fetch error:', error);
      addResult(`❌ Error fetching user data: ${error}`);
    } finally {
      setUserDataLoading(false);
    }
  };

  // 7. Upload User Data to Hypergraph Private Space
  const handleUploadToHypergraph = async () => {
    if (!authenticated) {
      addResult("❌ Must authenticate first!");
      return;
    }

    if (!spaceReady) {
      addResult("❌ Private space not ready!");
      return;
    }

    if (!fetchedUserData) {
      addResult("❌ No user data to upload! Fetch user data first.");
      return;
    }

    setUploadLoading(true);
    addResult("🚀 Uploading Oura sleep data to Hypergraph private space...");

    try {
      const { sleepMetrics, summary } = fetchedUserData;
      
      if (!sleepMetrics || sleepMetrics.length === 0) {
        addResult("❌ No sleep metrics found to upload!");
        setUploadLoading(false);
        return;
      }

      addResult(`📊 Found ${sleepMetrics.length} sleep records to upload`);
      let uploadedCount = 0;
      let errorCount = 0;

      // Upload each sleep metric as a User_Oura_Data entity
      for (const sleepRecord of sleepMetrics) {
        try {
          const ouraDataEntity = {
            // User identification
            user_wallet_address: user?.wallet_address || 'unknown',
            user_id: sleepRecord.user_id || 'unknown',
            
            // Sleep timing
            start_time: sleepRecord.start_time || '',
            end_time: sleepRecord.end_time || '',
            total_sleep_duration_seconds: sleepRecord.total_sleep_duration_seconds || 0,
            
            // Sleep stages (seconds)
            deep_sleep_duration_seconds: sleepRecord.deep_sleep_duration_seconds || 0,
            light_sleep_duration_seconds: sleepRecord.light_sleep_duration_seconds || 0,
            rem_sleep_duration_seconds: sleepRecord.rem_sleep_duration_seconds || 0,
            awake_duration_seconds: sleepRecord.awake_duration_seconds || 0,
            
            // Sleep quality metrics
            sleep_efficiency: sleepRecord.sleep_efficiency || 0,
            sleep_score: sleepRecord.sleep_score || 0,
            sleep_quality_score: sleepRecord.sleep_quality_score || 0,
            
            // Sleep latency
            sleep_latency_seconds: sleepRecord.sleep_latency_seconds || 0,
            wake_up_latency_seconds: sleepRecord.wake_up_latency_seconds || 0,
            
            // Heart rate metrics
            avg_heart_rate_bpm: sleepRecord.avg_heart_rate_bpm || 0,
            resting_heart_rate_bpm: sleepRecord.resting_heart_rate_bpm || 0,
            avg_hrv_rmssd: sleepRecord.avg_hrv_rmssd || 0,
            avg_hrv_sdnn: sleepRecord.avg_hrv_sdnn || 0,
            
            // Respiration metrics
            avg_oxygen_saturation: sleepRecord.avg_oxygen_saturation || 0,
            avg_breathing_rate: sleepRecord.avg_breathing_rate || 0,
            snoring_duration_seconds: sleepRecord.snoring_duration_seconds || 0,
            
            // Additional metrics
            temperature_delta: sleepRecord.temperature_delta || 0,
            readiness_score: sleepRecord.readiness_score || 0,
            recovery_score: sleepRecord.recovery_score || 0,
            efficiency_score: sleepRecord.efficiency_score || 0,
            health_score: sleepRecord.health_score || 0,
            recovery_level: sleepRecord.recovery_level || 0,
            
            // Metadata
            created_at: sleepRecord.created_at || new Date().toISOString(),
            data_source: 'oura' // Assuming this is Oura data
          };

          console.log(`Creating User_Oura_Data entity ${uploadedCount + 1}:`, {
            start_time: ouraDataEntity.start_time,
            sleep_duration_hours: Math.round(ouraDataEntity.total_sleep_duration_seconds / 3600 * 10) / 10,
            sleep_efficiency: ouraDataEntity.sleep_efficiency,
            sleep_score: ouraDataEntity.sleep_score
          });
          
          const ouraEntity = createOuraData(ouraDataEntity);
          uploadedCount++;
          
          addResult(`✅ Sleep record ${uploadedCount}: ${new Date(sleepRecord.start_time).toLocaleDateString()}`);
          addResult(`   Duration: ${Math.floor(sleepRecord.total_sleep_duration_seconds / 3600)}h ${Math.floor((sleepRecord.total_sleep_duration_seconds % 3600) / 60)}m`);
          addResult(`   Efficiency: ${sleepRecord.sleep_efficiency}%, Score: ${sleepRecord.sleep_score || 'N/A'}`);
          
        } catch (error) {
          console.error(`Error creating Oura data entity ${uploadedCount + 1}:`, error);
          addResult(`❌ Failed to upload record ${uploadedCount + 1}: ${error}`);
          errorCount++;
        }
      }
      
      addResult(`\n🎉 Upload Summary:`);
      addResult(`   ✅ Successfully uploaded: ${uploadedCount} records`);
      if (errorCount > 0) {
        addResult(`   ❌ Failed uploads: ${errorCount} records`);
      }
      addResult(`   📊 Total sleep data: ${Math.round(sleepMetrics.reduce((total: number, record: any) => total + (record.total_sleep_duration_seconds || 0), 0) / 3600)} hours`);
      
      addResult("✅ Oura data upload to Hypergraph completed!");
      console.log("User_Oura_Data entities created:", uploadedCount);
      
    } catch (error) {
      console.error("Upload error:", error);
      addResult(`❌ Upload failed: ${error}`);
    } finally {
      setUploadLoading(false);
    }
  };

  // 8. Fetch All Private Space Data
  const handleFetchAllPrivateData = () => {
    if (!authenticated) {
      addResult("❌ Must authenticate first!");
      return;
    }

    if (!spaceReady) {
      addResult("❌ Private space not ready!");
      return;
    }

    addResult("🔍 Fetching all data from private space...");

    // Get current data counts
    const patientCount = privatePatients?.length || 0;
    const providerCount = privateProviders?.length || 0;
    const ouraDataCount = privateOuraData?.length || 0;
    const totalEntities = patientCount + providerCount + ouraDataCount;

    addResult(`📊 Private Space Summary:`);
    addResult(`  Space: ${spaceName || 'Unknown'} (${spaceId?.slice(0, 8)}...)`);
    addResult(`  Total Entities: ${totalEntities}`);
    addResult(`  👥 Patients: ${patientCount}`);
    addResult(`  🏥 Health Providers: ${providerCount}`);
    addResult(`  🌙 Oura Sleep Records: ${ouraDataCount}`);

    // Display detailed patient information
    if (privatePatients && privatePatients.length > 0) {
      addResult(`\n👥 Patient Details:`);
      privatePatients.forEach((patient, index) => {
        addResult(`  ${index + 1}. ${patient.name}`);
        addResult(`     Age: ${patient.age}, Email: ${patient.email}`);
        addResult(`     ID: ${patient.id?.slice(0, 8)}...`);
      });
    } else {
      addResult(`👥 No patients found in private space`);
    }

    // Display detailed provider information
    if (privateProviders && privateProviders.length > 0) {
      addResult(`\n🏥 Health Provider Details:`);
      privateProviders.forEach((provider, index) => {
        addResult(`  ${index + 1}. ${provider.name}`);
        addResult(`     Type: ${provider.type}, City: ${provider.city}`);
        addResult(`     ID: ${provider.id?.slice(0, 8)}...`);
      });
    } else {
      addResult(`🏥 No health providers found in private space`);
    }

    // Display detailed Oura data information
    if (privateOuraData && privateOuraData.length > 0) {
      addResult(`\n🌙 Oura Sleep Data Details:`);
      privateOuraData.forEach((ouraRecord, index) => {
        const sleepHours = Math.round(ouraRecord.total_sleep_duration_seconds / 3600 * 10) / 10;
        addResult(`  ${index + 1}. ${new Date(ouraRecord.start_time).toLocaleDateString()}`);
        addResult(`     Duration: ${sleepHours}h, Efficiency: ${ouraRecord.sleep_efficiency}%`);
        addResult(`     Score: ${ouraRecord.sleep_score}, Source: ${ouraRecord.data_source}`);
        addResult(`     User: ${ouraRecord.user_wallet_address?.slice(0, 6)}...`);
        addResult(`     ID: ${ouraRecord.id?.slice(0, 8)}...`);
      });
      
      // Calculate total sleep data
      const totalSleepHours = Math.round(
        privateOuraData.reduce((total: number, record: any) => 
          total + (record.total_sleep_duration_seconds || 0), 0
        ) / 3600
      );
      addResult(`\n📊 Total Sleep Data: ${totalSleepHours} hours across ${ouraDataCount} records`);
    } else {
      addResult(`🌙 No Oura sleep data found in private space`);
    }

    // Log comprehensive data to console
    console.log("🔍 Complete Private Space Data:", {
      spaceName,
      spaceId,
      totalEntities,
      patients: privatePatients,
      providers: privateProviders,
      ouraData: privateOuraData,
      spaceReady,
      authenticated
    });

    addResult(`\n✅ Private space data fetch completed!`);
    addResult(`📋 Full data logged to console for detailed inspection`);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🏥 Health Wallet</h1>
          <p className="text-gray-600">Hypergraph Integration + Health Data Management</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Status */}
          <div className="bg-blue-50 p-4 rounded border mb-6">
            <p className="text-sm text-gray-700">
              Auth: {authenticated ? '✅ Authenticated' : '❌ Not Authenticated'} | 
              Private Spaces: {privateSpaces?.length || 0} | 
              Public Spaces: {publicSpaces?.length || 0}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Current Space: {spaceReady ? '✅ Ready' : '❌ Not Ready'} | 
              Name: {spaceName || 'Unknown'} | 
              ID: {spaceId?.slice(0, 8)}...
            </p>
            {!spaceReady && (
              <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs">
                <p className="text-yellow-800">⚠️ Space not ready - check console for debug info</p>
                <p className="text-yellow-700">Available spaces: {privateSpaces?.length || 0}</p>
              </div>
            )}
          </div>

          {/* 5 Core Buttons */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button 
              onClick={handleAuthenticate}
              className="bg-blue-500 text-white px-6 py-4 rounded-lg hover:bg-blue-600 font-semibold text-lg transition-colors"
            >
              🔑 1. Authenticate
            </button>
            
            <button 
              onClick={handleReadPrivate}
              className="bg-green-500 text-white px-6 py-4 rounded-lg hover:bg-green-600 font-semibold text-lg transition-colors"
            >
              📖 2. Read Private
            </button>
            
            <button 
              onClick={handlePublishToPrivate}
              className="bg-purple-500 text-white px-6 py-4 rounded-lg hover:bg-purple-600 font-semibold text-lg transition-colors disabled:opacity-50"
              disabled={!authenticated}
            >
              🚀 3. Publish to Private
            </button>
            
            <button 
              onClick={handleReadPublic}
              className="bg-orange-500 text-white px-6 py-4 rounded-lg hover:bg-orange-600 font-semibold text-lg transition-colors"
            >
              🌍 4. Read Public
            </button>

            <button 
              onClick={handleReadPatientsData}
              className="bg-teal-500 text-white px-6 py-4 rounded-lg hover:bg-teal-600 font-semibold text-lg transition-colors col-span-2"
            >
              👥 5. Read Patients Data
            </button>
          </div>

          {/* User Data Section */}
          <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-3">💾 User Data & Sleep Metrics</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-blue-800 mb-1">
                  Current User Wallet Address:
                </label>
                <input
                  type="text"
                  value={user?.wallet_address || 'Not logged in'}
                  readOnly
                  placeholder="Login to see wallet address"
                  className="w-full px-3 py-2 border border-blue-300 rounded-md bg-gray-50 text-sm"
                />
              </div>
              
              {fetchedUserData && (
                <div className="bg-green-50 p-3 rounded-md border border-green-200">
                  <p className="text-sm text-green-800 font-medium">✅ Oura Data Ready for Upload</p>
                  <p className="text-xs text-green-700 mt-1">
                    Profile: {fetchedUserData.summary.hasProfile ? 'Yes' : 'No'} | 
                    Connections: {fetchedUserData.summary.connectionCount} | 
                    Sleep Records: {fetchedUserData.summary.sleepMetricsCount} → Will create {fetchedUserData.summary.sleepMetricsCount} User_Oura_Data entities
                  </p>
                </div>
              )}
              
              <button 
                onClick={handleFetchUserData}
                disabled={userDataLoading || !user?.wallet_address}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {userDataLoading ? '🔄 Fetching...' : '📊 6. Fetch User Data & Sleep Metrics'}
              </button>
              
              {fetchedUserData && (
                <button 
                  onClick={handleUploadToHypergraph}
                  disabled={uploadLoading || !authenticated || !spaceReady}
                  className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadLoading ? '🔄 Uploading...' : '🌙 7. Upload Oura Sleep Data to Hypergraph'}
                </button>
              )}
            </div>
          </div>

          {/* Hypergraph Data Section */}
          <div className="mb-6 bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h3 className="font-semibold text-purple-900 mb-3">🔮 Hypergraph Private Space Data</h3>
            <div className="space-y-3">
              <div className="bg-white p-3 rounded-md border border-purple-200">
                <p className="text-sm text-purple-800 font-medium">
                  Current Space: {spaceName || 'Unknown'} 
                  <span className="text-purple-600 ml-2">({spaceReady ? '✅ Ready' : '❌ Not Ready'})</span>
                </p>
                <p className="text-xs text-purple-700 mt-1">
                  Entities: {(privatePatients?.length || 0) + (privateProviders?.length || 0) + (privateOuraData?.length || 0)} total 
                  (👥 {privatePatients?.length || 0} patients, 🏥 {privateProviders?.length || 0} providers, 🌙 {privateOuraData?.length || 0} oura records)
                </p>
              </div>
              
              <button 
                onClick={handleFetchAllPrivateData}
                disabled={!authenticated || !spaceReady}
                className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🔍 8. Fetch All Private Space Data
              </button>
            </div>
          </div>

          {/* Alternative/Debug Button */}
          {!spaceReady && authenticated && (
            <div className="mb-6">
              <button 
                onClick={handleTryAlternativeCreate}
                className="w-full bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 font-semibold transition-colors"
              >
                🧪 Try Alternative Create (Debug)
              </button>
              <p className="text-xs text-gray-500 mt-1 text-center">
                Attempts to create data without explicit space assignment
              </p>
            </div>
          )}

          {/* Results Log */}
          <div className="bg-gray-50 p-4 rounded border">
            <h3 className="font-semibold mb-3 text-gray-900">📋 Operation Log:</h3>
            <div className="text-sm space-y-1 max-h-64 overflow-y-auto">
              {results.length === 0 ? (
                <p className="text-gray-500 italic">No operations yet... Click a button above!</p>
              ) : (
                results.map((result, index) => (
                  <p key={index} className="text-gray-800 font-mono text-xs bg-white p-2 rounded">{result}</p>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Hypergraph Integration + Health Data Management for Cannes ETH</p>
          <p>Private Space: <code className="bg-gray-200 px-1 rounded">{HYPERGRAPH_CONFIG.privateSpaceId}</code></p>
        </div>
      </div>
    </div>
  );
}

// Main App Component with Space Provider
export default function HypergraphPage() {
  const { data: privateSpaces } = useSpaces({ mode: 'private' });
  const { authenticated } = useHypergraphAuth();
  
  // Debug what spaces we have
  console.log("App Debug - Available spaces:", {
    authenticated,
    privateSpacesCount: privateSpaces?.length || 0,
    privateSpaces: privateSpaces?.map(s => ({ id: s.id, name: s.name }))
  });
  
  // If no private spaces are available, show a different interface
  if (authenticated && privateSpaces && privateSpaces.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">🏥 Health Wallet</h1>
            <p className="text-gray-600">Hypergraph Integration + Health Data Management</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-yellow-800 mb-3">🔐 No Private Spaces Available</h3>
                <p className="text-yellow-700 mb-4">
                  You are authenticated but don&apos;t have access to any private spaces yet.
                </p>
                <div className="text-left bg-yellow-100 p-4 rounded text-sm text-yellow-800 space-y-2">
                  <p><strong>Current Status:</strong></p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Authentication: ✅ Authenticated</li>
                    <li>Private Spaces: {privateSpaces?.length || 0} available</li>
                    <li>Configured Space: {HYPERGRAPH_CONFIG.privateSpaceId}</li>
                  </ul>
                  <p className="mt-3"><strong>To fix this:</strong></p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>You need to create a private space or get access to one</li>
                    <li>Contact your Hypergraph admin to get access</li>
                    <li>Or check the Hypergraph dashboard for space creation options</li>
                  </ol>
                </div>
                <div className="mt-4 text-xs text-yellow-600">
                  <p>Configured space: <code className="bg-yellow-200 px-1 rounded">{HYPERGRAPH_CONFIG.privateSpaceId}</code></p>
                  <p>This space is not accessible to your user account.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Use first available private space or fallback to config (even if not ready)
  const spaceToUse = privateSpaces?.[0]?.id || HYPERGRAPH_CONFIG.privateSpaceId;
  
  return (
    <HypergraphSpaceProvider space={spaceToUse}>
      <CoreOperations />
    </HypergraphSpaceProvider>
  );
} 