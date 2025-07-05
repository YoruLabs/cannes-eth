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
import { Patient, HealthProvider } from '@/lib/hypergraph-schema';
import { HYPERGRAPH_CONFIG } from '@/lib/hypergraph-config';

function CoreOperations() {
  const [results, setResults] = useState<string[]>([]);
  const { authenticated } = useHypergraphAuth();
  const { redirectToConnect, processConnectAuthSuccess, getSmartSessionClient } = useHypergraphApp();
  
  // Check space status
  const { ready: spaceReady, name: spaceName, id: spaceId } = useSpace({ mode: 'private' });
  
  // Hooks for data access
  const { data: privatePatients } = useQuery(Patient, { mode: 'private' });
  const { data: privateProviders } = useQuery(HealthProvider, { mode: 'private' });
  const { data: publicSpaces } = useSpaces({ mode: 'public' });
  const { data: privateSpaces } = useSpaces({ mode: 'private' });
  const createPatient = useCreateEntity(Patient);
  
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

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🏥 Health Wallet</h1>
          <p className="text-gray-600">Hypergraph Integration (5 Core Functions)</p>
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
          <p>Hypergraph Integration for Cannes ETH</p>
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
            <p className="text-gray-600">Hypergraph Integration (5 Core Functions)</p>
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