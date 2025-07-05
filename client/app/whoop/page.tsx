'use client';

import { useEffect, useState } from "react";

// ---- config ----
const REDIRECT_URI = "https://world.org/mini-app?app_id=app_58d87e75f86ee1d5774b836e7190153d&path=/whoop"

const SCOPES = [
  "offline",
  "read:recovery",
  "read:cycles",
  "read:workout",
  "read:sleep",
  "read:profile",
  "read:body_measurement"
].join(" ");

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface WhoopData {
  success: boolean;
  data: {
    profile?: any;
    recovery?: any;
    sleep?: any;
    workout?: any;
    cycles?: any;
    body_measurement?: any;
  };
  fetched_at: string;
}

export default function WhoopConnect() {
  const [tokens, setTokens] = useState<TokenResponse | null>(null);
  const [whoopData, setWhoopData] = useState<WhoopData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Automatically exchange token when WHOOP redirects back with ?code=...
  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    
    if (!code || tokens) return;

    setLoading(true);
    setError(null);
    
    fetch("/api/whoop/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, redirectUri: REDIRECT_URI })
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setTokens(data);
          // Clear URL parameters after successful token exchange
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      })
      .catch(err => {
        console.error(err);
        setError("Failed to exchange token");
      })
      .finally(() => setLoading(false));
  }, [tokens]);

  const handleAuthClick = () => {
    const state = Math.random().toString(36).substring(2, 15); // Simple random state
    const authURL = new URL("https://api.prod.whoop.com/oauth/oauth2/auth");
    authURL.searchParams.set("response_type", "code");
    authURL.searchParams.set("client_id", process.env.NEXT_PUBLIC_WHOOP_CLIENT_ID!);
    authURL.searchParams.set("redirect_uri", REDIRECT_URI);
    authURL.searchParams.set("scope", SCOPES);
    authURL.searchParams.set("state", state);
    window.location.href = authURL.toString();
  };

  const fetchAllData = async () => {
    if (!tokens?.access_token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch("/api/whoop/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: tokens.access_token })
      });
      
      const data = await res.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setWhoopData(data);
      }
    } catch (err) {
      console.error('Data fetch error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to fetch data: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const resetConnection = () => {
    setTokens(null);
    setWhoopData(null);
    setError(null);
    // Clear URL parameters
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  const renderDataSection = (title: string, data: any, bgColor: string = "bg-gray-50") => {
    if (!data) return null;
    
    if (data.error) {
      return (
        <div className={`${bgColor} rounded-lg p-4 mb-4`}>
          <h3 className="text-lg font-semibold mb-2 text-black">{title}</h3>
          <div className="text-red-600 text-sm">{data.error}</div>
        </div>
      );
    }
    
    return (
      <div className={`${bgColor} rounded-lg p-4 mb-4`}>
        <h3 className="text-lg font-semibold mb-2 text-black">{title}</h3>
        <div className="bg-white rounded p-3 overflow-x-auto">
          <pre className="text-sm text-black whitespace-pre-wrap">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </div>
    );
  };

  return (
    <main className="container mx-auto p-8 max-w-6xl">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6 text-black">WHOOP Health Data Connector</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-black px-4 py-3 rounded mb-6">
            <strong>Error:</strong> {error}
          </div>
        )}

        {loading && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-black">Loading...</p>
          </div>
        )}

        {!tokens && !loading && (
          <div className="text-center">
            <p className="text-black mb-6">
              Connect your WHOOP account to access your complete health data including recovery, 
              sleep, workouts, cycles, and body measurements.
            </p>
            <button 
              onClick={handleAuthClick}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Connect WHOOP (All Data)
            </button>
            <div className="mt-4 text-sm text-black">
              <p>Requested permissions:</p>
              <ul className="mt-2 space-y-1">
                <li>• Recovery data</li>
                <li>• Sleep data</li>
                <li>• Workout data</li>
                <li>• Cycle data</li>
                <li>• Profile information</li>
                <li>• Body measurements</li>
              </ul>
            </div>
          </div>
        )}

        {tokens && !loading && (
          <div className="space-y-6">
            <div className="bg-green-100 border border-green-400 text-black px-4 py-3 rounded">
              <p className="font-semibold">✅ Successfully connected to WHOOP!</p>
              <p className="text-sm mt-1">
                Token expires in {Math.floor(tokens.expires_in / 60)} minutes
              </p>
            </div>

            {/* Display Token Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3 text-black">Access Token</h3>
              <div className="space-y-2 text-sm">
                <div className="bg-gray-100 p-3 rounded font-mono break-all">
                  <strong>Token:</strong> {tokens.access_token}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><strong>Token Type:</strong> {tokens.token_type}</div>
                  <div><strong>Expires In:</strong> {tokens.expires_in}s</div>
                </div>
                <div><strong>Scope:</strong> {tokens.scope}</div>
                {tokens.refresh_token && (
                  <div className="bg-gray-100 p-3 rounded font-mono break-all">
                    <strong>Refresh Token:</strong> {tokens.refresh_token}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={fetchAllData}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50"
              >
                Get All WHOOP Data
              </button>
              <button 
                onClick={resetConnection}
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                Disconnect
              </button>
            </div>

            {whoopData && (
              <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-black">Complete WHOOP Data</h2>
                  <div className="text-sm text-black">
                    Fetched: {new Date(whoopData.fetched_at).toLocaleString()}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {renderDataSection("👤 Profile", whoopData.data.profile, "bg-blue-50")}
                  {renderDataSection("🔋 Recovery", whoopData.data.recovery, "bg-green-50")}
                  {renderDataSection("😴 Sleep", whoopData.data.sleep, "bg-purple-50")}
                  {renderDataSection("💪 Workouts", whoopData.data.workout, "bg-orange-50")}
                  {renderDataSection("🔄 Cycles", whoopData.data.cycles, "bg-yellow-50")}
                  {renderDataSection("📊 Body Measurements", whoopData.data.body_measurement, "bg-pink-50")}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
} 