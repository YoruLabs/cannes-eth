"use client";

import { useEffect } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';

interface MiniKitProviderProps {
  children: React.ReactNode;
}

export default function MiniKitProvider({ children }: MiniKitProviderProps) {
  useEffect(() => {
    // Initialize MiniKit when the component mounts
    const initMiniKit = async () => {
      try {
        console.log('🌍 Initializing MiniKit...');
        
        // MiniKit should be available globally in the World App
        if (typeof window !== 'undefined') {
          console.log('🔍 MiniKit available:', !!window.MiniKit);
          console.log('🔍 MiniKit installed:', MiniKit.isInstalled());
        }
      } catch (error) {
        console.error('❌ Failed to initialize MiniKit:', error);
      }
    };

    initMiniKit();
  }, []);

  return <>{children}</>;
} 