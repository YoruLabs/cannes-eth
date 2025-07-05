/**
 * Mobile-friendly authentication utility for Hypergraph
 * 
 * This solves the issue where OAuth opens an external browser on mobile,
 * causing localStorage validation keys to be unavailable in the callback.
 * 
 * Solution: Encode validation keys in the callback URL instead of relying on localStorage.
 */

import { Connect } from '@graphprotocol/hypergraph';

export interface AuthValidationKeys {
  nonce: string;
  expiry: string;
  secretKey: string;
  publicKey: string;
}

export interface MobileAuthParams {
  connectUrl: string;
  successUrl: string;
  appId: string;
  storage: any; // Identity.Storage type
}

/**
 * Create a mobile-friendly authentication URL
 * This generates the auth URL and encodes validation keys in the success URL
 */
export function createMobileAuthUrl(params: MobileAuthParams): {
  authUrl: URL;
  validationKeys: AuthValidationKeys;
} {
  const { connectUrl, successUrl, appId } = params;
  
  // Generate auth components using the standard method
  const authData = Connect.createAuthUrl({
    connectUrl: `${connectUrl}/authenticate`,
    redirectUrl: successUrl, // We'll modify this later
    appId,
  });

  const validationKeys: AuthValidationKeys = {
    nonce: authData.nonce,
    expiry: authData.expiry.toString(),
    secretKey: authData.secretKey,
    publicKey: authData.publicKey,
  };

  // Create enhanced success URL with validation keys encoded
  const enhancedSuccessUrl = createSuccessUrlWithKeys(successUrl, validationKeys);
  
  // Recreate the auth URL with our enhanced success URL
  const finalAuthData = Connect.createAuthUrl({
    connectUrl: `${connectUrl}/authenticate`,
    redirectUrl: enhancedSuccessUrl,
    appId,
  });

  return {
    authUrl: finalAuthData.url,
    validationKeys,
  };
}

/**
 * Create a success URL that includes validation keys as parameters
 */
function createSuccessUrlWithKeys(baseUrl: string, keys: AuthValidationKeys): string {
  const url = new URL(baseUrl);
  
  // Encode keys as URL parameters with a prefix to avoid conflicts
  url.searchParams.set('_auth_nonce', encodeURIComponent(keys.nonce));
  url.searchParams.set('_auth_expiry', encodeURIComponent(keys.expiry));
  url.searchParams.set('_auth_secret', encodeURIComponent(keys.secretKey));
  url.searchParams.set('_auth_public', encodeURIComponent(keys.publicKey));
  
  return url.toString();
}

/**
 * Extract validation keys from URL parameters
 */
export function extractValidationKeysFromUrl(): AuthValidationKeys | null {
  if (typeof window === 'undefined') return null;
  
  const urlParams = new URLSearchParams(window.location.search);
  
  const nonce = urlParams.get('_auth_nonce');
  const expiry = urlParams.get('_auth_expiry');
  const secretKey = urlParams.get('_auth_secret');
  const publicKey = urlParams.get('_auth_public');
  
  if (!nonce || !expiry || !secretKey || !publicKey) {
    return null;
  }
  
  return {
    nonce: decodeURIComponent(nonce),
    expiry: decodeURIComponent(expiry),
    secretKey: decodeURIComponent(secretKey),
    publicKey: decodeURIComponent(publicKey),
  };
}

/**
 * Create a storage adapter that uses URL parameters as fallback
 */
export function createMobileStorage(validationKeys?: AuthValidationKeys | null) {
  return {
    setItem: (key: string, value: string) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, value);
      }
    },
    
    getItem: (key: string) => {
      if (typeof window === 'undefined') return null;
      
      // First try localStorage
      const stored = localStorage.getItem(key);
      if (stored) return stored;
      
      // If not found and we have validation keys, use them
      if (validationKeys) {
        switch (key) {
          case 'geo-connect-auth-nonce':
            return validationKeys.nonce;
          case 'geo-connect-auth-expiry':
            return validationKeys.expiry;
          case 'geo-connect-auth-secret-key':
            return validationKeys.secretKey;
          case 'geo-connect-auth-public-key':
            return validationKeys.publicKey;
        }
      }
      
      return null;
    },
    
    removeItem: (key: string) => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
      }
    }
  };
}

/**
 * Clean auth parameters from current URL
 */
export function cleanAuthParamsFromUrl() {
  if (typeof window === 'undefined') return;
  
  const url = new URL(window.location.href);
  
  // Remove auth-specific parameters
  url.searchParams.delete('_auth_nonce');
  url.searchParams.delete('_auth_expiry');
  url.searchParams.delete('_auth_secret');
  url.searchParams.delete('_auth_public');
  url.searchParams.delete('ciphertext');
  url.searchParams.delete('nonce');
  
  // Update browser URL without page reload
  window.history.replaceState({}, document.title, url.pathname + (url.search || ''));
}

/**
 * Check if current URL contains OAuth callback parameters
 */
export function hasAuthCallback(): boolean {
  if (typeof window === 'undefined') return false;
  
  const urlParams = new URLSearchParams(window.location.search);
  return !!(urlParams.get('ciphertext') && urlParams.get('nonce'));
}

/**
 * Get OAuth callback parameters from URL
 */
export function getAuthCallbackParams(): { ciphertext: string; nonce: string } | null {
  if (typeof window === 'undefined') return null;
  
  const urlParams = new URLSearchParams(window.location.search);
  const ciphertext = urlParams.get('ciphertext');
  const nonce = urlParams.get('nonce');
  
  if (!ciphertext || !nonce) return null;
  
  return { ciphertext, nonce };
} 