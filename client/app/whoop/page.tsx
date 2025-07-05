'use client';

import { useEffect, useState } from "react";

// ---- config ----
const REDIRECT_URI = "https://996d-83-144-23-156.ngrok-free.app/whoop"

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

interface UrlInfo {
  fullUrl: string;
  pathname: string;
  search: string;
  params: Record<string, string>;
}

export default function WhoopConnect() {
  const [tokens, setTokens] = useState<TokenResponse | null>(null);
  const [whoopData, setWhoopData] = useState<WhoopData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlInfo, setUrlInfo] = useState<UrlInfo | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [authCode, setAuthCode] = useState<string | null>(null);
  const [tokenExchangeLoading, setTokenExchangeLoading] = useState(false);
  const [dataFetchLoading, setDataFetchLoading] = useState(false);

  // Add debug logging
  const addDebugLog = (message: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  // Update URL info whenever the component mounts or URL changes
  useEffect(() => {
    const updateUrlInfo = () => {
      const url = new URL(window.location.href);
      const params: Record<string, string> = {};
      
      // Extract all URL parameters
      url.searchParams.forEach((value, key) => {
        params[key] = value;
      });

      setUrlInfo({
        fullUrl: window.location.href,
        pathname: window.location.pathname,
        search: window.location.search,
        params
      });

      // Check for auth code in URL
      const code = url.searchParams.get("code");
      if (code) {
        setAuthCode(code);
        addDebugLog(`Found auth code in URL: ${code}`);
      }
    };

    updateUrlInfo();
    
    // Listen for URL changes
    const handlePopState = () => updateUrlInfo();
    window.addEventListener('popstate', handlePopState);
    
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Listen for postMessage from parent window (World app)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      addDebugLog(`Received postMessage: ${JSON.stringify(event.data)}`);
      
      // Check if this is a WHOOP redirect message
      if (event.data?.type === 'whoop-redirect' && event.data?.url) {
        const url = new URL(event.data.url);
        const code = url.searchParams.get('code');
        if (code) {
          setAuthCode(code);
          addDebugLog(`Found code in postMessage: ${code}`);
        }
      }
      
      // Also check if the data contains URL parameters directly
      if (event.data?.code) {
        setAuthCode(event.data.code);
        addDebugLog(`Found code directly in postMessage: ${event.data.code}`);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Check multiple sources for auth code
  useEffect(() => {
    const checkForAuthCode = () => {
      let code = null;
      
      // Method 1: Check URL parameters
      const url = new URL(window.location.href);
      code = url.searchParams.get("code");
      if (code) {
        setAuthCode(code);
        addDebugLog(`Found code in URL params: ${code}`);
        return;
      }
      
      // Method 2: Check URL fragment
      if (window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        code = hashParams.get("code");
        if (code) {
          setAuthCode(code);
          addDebugLog(`Found code in URL fragment: ${code}`);
          return;
        }
      }
      
      // Method 3: Check localStorage (in case World app stores it there)
      const storedCode = localStorage.getItem('whoop_auth_code');
      if (storedCode) {
        setAuthCode(storedCode);
        addDebugLog(`Found code in localStorage: ${storedCode}`);
        localStorage.removeItem('whoop_auth_code'); // Clean up
        return;
      }
      
      // Method 4: Check sessionStorage
      const sessionCode = sessionStorage.getItem('whoop_auth_code');
      if (sessionCode) {
        setAuthCode(sessionCode);
        addDebugLog(`Found code in sessionStorage: ${sessionCode}`);
        sessionStorage.removeItem('whoop_auth_code'); // Clean up
        return;
      }
      
      // Method 5: Ask parent window for URL
      if (window.parent && window.parent !== window) {
        addDebugLog('Requesting URL from parent window');
        window.parent.postMessage({ type: 'get-url', source: 'whoop-app' }, '*');
      }
    };

    checkForAuthCode();
  }, []);

  const handleManualTokenExchange = async () => {
    if (!authCode) {
      setError("No auth code found");
      return;
    }
    
    setTokenExchangeLoading(true);
    setError(null);
    addDebugLog(`Starting manual token exchange with code: ${authCode}`);
    addDebugLog(`Using redirect URI: ${REDIRECT_URI}`);
    
    try {
      const response = await fetch("/api/whoop/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          code: authCode, 
          redirectUri: REDIRECT_URI // Use the same redirect URI as in auth
        })
      });
      
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
        addDebugLog(`Token exchange error: ${JSON.stringify(data)}`);
      } else {
        setTokens(data);
        addDebugLog('Token exchange successful');
        // Clear URL parameters after successful token exchange
        window.history.replaceState({}, document.title, window.location.pathname);
        setAuthCode(null);
      }
    } catch (err) {
      console.error('Token exchange error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to exchange token: ${errorMessage}`);
      addDebugLog(`Token exchange failed: ${errorMessage}`);
    } finally {
      setTokenExchangeLoading(false);
    }
  };

  const handleManualDataFetch = async () => {
    if (!tokens?.access_token) {
      setError("No access token available");
      return;
    }
    
    setDataFetchLoading(true);
    setError(null);
    addDebugLog(`Starting data fetch with token: ${tokens.access_token.substring(0, 10)}...`);
    
    try {
      const res = await fetch("/api/whoop/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: tokens.access_token })
      });
      
      const data = await res.json();
      
      if (data.error) {
        setError(data.error);
        addDebugLog(`Data fetch error: ${JSON.stringify(data)}`);
      } else {
        setWhoopData(data);
        addDebugLog('Data fetch successful');
      }
    } catch (err) {
      console.error('Data fetch error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to fetch data: ${errorMessage}`);
      addDebugLog(`Data fetch failed: ${errorMessage}`);
    } finally {
      setDataFetchLoading(false);
    }
  };

  const handleAuthClick = () => {
    const state = Math.random().toString(36).substring(2, 15);
    addDebugLog(`Starting auth flow with state: ${state}`);
    addDebugLog(`Using redirect URI: ${REDIRECT_URI}`);
    
    window.location.href = "https://api.prod.whoop.com/oauth/oauth2/auth?response_type=code&client_id=186dab5b-12d3-411a-86d7-4f187d0fcff0&redirect_uri=https%3A%2F%2F996d-83-144-23-156.ngrok-free.app%2Fwhoop&scope=offline%20read%3Arecovery%20read%3Acycles%20read%3Aworkout%20read%3Asleep%20read%3Aprofile%20read%3Abody_measurement&state=STATE123"
  };

  const resetConnection = () => {
    setTokens(null);
    setWhoopData(null);
    setError(null);
    setDebugInfo([]);
    setAuthCode(null);
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
        
        {/* Debug Information */}
        {debugInfo.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-3 text-black">Debug Information</h3>
            <div className="space-y-1 text-sm max-h-60 overflow-y-auto">
              {debugInfo.map((log, index) => (
                <div key={index} className="font-mono text-xs">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Auth Code Display */}
        {authCode && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-3 text-black">Authorization Code Found</h3>
            <div className="bg-white p-3 rounded font-mono text-sm break-all">
              {authCode}
            </div>
          </div>
        )}

        {/* URL Information Display */}
        {urlInfo && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-3 text-black">Current URL Information</h3>
            <div className="space-y-2 text-sm">
              <div>
                <strong>Full URL:</strong>
                <div className="bg-white p-2 rounded mt-1 font-mono text-xs break-all">
                  {urlInfo.fullUrl}
                </div>
              </div>
              <div>
                <strong>Pathname:</strong> <code className="bg-white px-2 py-1 rounded">{urlInfo.pathname}</code>
              </div>
              {urlInfo.search && (
                <div>
                  <strong>Search:</strong> <code className="bg-white px-2 py-1 rounded">{urlInfo.search}</code>
                </div>
              )}
              {Object.keys(urlInfo.params).length > 0 && (
                <div>
                  <strong>URL Parameters:</strong>
                  <div className="bg-white p-3 rounded mt-1">
                    {Object.entries(urlInfo.params).map(([key, value]) => (
                      <div key={key} className="flex items-start gap-2 mb-1">
                        <span className="font-medium text-blue-600 min-w-0">{key}:</span>
                        <span className="font-mono text-xs break-all">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {Object.keys(urlInfo.params).length === 0 && (
                <div>
                  <strong>URL Parameters:</strong> <span className="text-gray-500">None</span>
                </div>
              )}
              <div>
                <strong>Window Context:</strong>
                <div className="bg-white p-2 rounded mt-1 text-xs">
                  <div>Is in iframe: {window.parent !== window ? 'Yes' : 'No'}</div>
                  <div>Parent origin: {window.parent !== window ? 'Available' : 'Same as current'}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-black px-4 py-3 rounded mb-6">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Debug Controls */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-3 text-black">Debug Controls</h3>
          <div className="flex flex-wrap gap-3">
            {!authCode && (
              <button 
                onClick={handleAuthClick}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                Start OAuth Flow
              </button>
            )}
            
            {authCode && !tokens && (
              <button 
                onClick={handleManualTokenExchange}
                disabled={tokenExchangeLoading}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50"
              >
                {tokenExchangeLoading ? 'Exchanging...' : 'Exchange Token'}
              </button>
            )}
            
            {tokens && (
              <button 
                onClick={handleManualDataFetch}
                disabled={dataFetchLoading}
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50"
              >
                {dataFetchLoading ? 'Fetching...' : 'Fetch Data'}
              </button>
            )}
            
            <button 
              onClick={resetConnection}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              Reset All
            </button>
          </div>
        </div>

        {loading && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-black">Loading...</p>
          </div>
        )}

        {tokens && (
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