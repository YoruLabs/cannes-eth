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

    MiniKit.install();
    console.log(`is MiniKit installed? -> ${MiniKit.isInstalled()}`);
  }, []);

  return <>{children}</>;
}
