"use client";

import { ReactNode } from "react";
import { MiniKitProvider } from "./minikit";
import { ErudaProvider } from "./Eruda";
import { UserProvider } from "./user-provider";
// import { I18nextProvider } from "react-i18next";
// import i18n from "@/lib/utils/i18";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ErudaProvider>
      <MiniKitProvider>
        <UserProvider>
          {/* <I18nextProvider i18n={i18n}>
            <ToastProvider> */}
          {children}
          {/* </ToastProvider>
          </I18nextProvider> */}
        </UserProvider>
      </MiniKitProvider>
    </ErudaProvider>
  );
}
