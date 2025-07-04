"use client"; // Required for Next.js

import { MiniKit } from "@worldcoin/minikit-js";
import { ReactNode, useEffect } from "react";

export function MiniKitProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Skip MiniKit initialization in test environment
    if (process.env.NEXT_PUBLIC_APP_ENV === "test") {
      console.log("Test mode -> MiniKit initialization skipped on provider");
      return;
    }

    try {
      console.log("Initializing MiniKit...");
      MiniKit.install();
      
      // Small delay to ensure installation is complete
      setTimeout(() => {
        const isInstalled = MiniKit.isInstalled();
        console.log(`MiniKit installation complete: ${isInstalled}`);
      }, 100);
    } catch (error) {
      console.error("Error initializing MiniKit:", error);
    }
  }, []);

  return <>{children}</>;
}
