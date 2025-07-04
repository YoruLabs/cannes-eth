"use client";

import dynamic from "next/dynamic";
import { ReactNode } from "react";

const Eruda = dynamic(() => import("./eruda-provider").then((c) => c.Eruda), {
  ssr: false,
});

export function ErudaProvider(props: { children: ReactNode }) {
  // Skip in production environment
  if (process.env.NEXT_PUBLIC_APP_ENV === "production") {
    return props.children;
  }
  console.log("Debug mode -> Eruda enabled");
  return <Eruda>{props.children}</Eruda>;
}
