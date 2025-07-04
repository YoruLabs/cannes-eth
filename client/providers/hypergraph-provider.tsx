'use client';

import { HypergraphAppProvider } from '@graphprotocol/hypergraph-react';
import { mapping } from '../lib/hypergraph-mapping';
import { HYPERGRAPH_CONFIG } from '../lib/hypergraph-config';

interface HypergraphProviderProps {
  children: React.ReactNode;
}

export function HypergraphProvider({ children }: HypergraphProviderProps) {
  return (
    <HypergraphAppProvider 
      mapping={mapping}
      syncServerUri={HYPERGRAPH_CONFIG.syncServerUri}
    >
      {children}
    </HypergraphAppProvider>
  );
} 