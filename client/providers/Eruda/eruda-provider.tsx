"use client";

import { ReactNode, useEffect } from "react";

export function Eruda({ children }: { children: ReactNode }) {
  useEffect(() => {
    import("eruda").then((module) => module.default.init());
  }, []);

  return <>{children}</>;
}
