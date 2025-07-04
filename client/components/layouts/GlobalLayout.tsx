"use client";

import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@/providers/user-provider";
import NavBar from "@/components/layouts/NavBar";

interface GlobalLayoutProps {
  children: React.ReactNode;
}

// Pages that should show the bottom navigation
const AUTHENTICATED_PAGES = ["/", "/connect", "/profile"];

export default function GlobalLayout({ children }: GlobalLayoutProps) {
  const { user, isLoading } = useUser();
  const pathname = usePathname();

  // Check if current page should show bottom navigation
  const shouldShowBottomNav =
    user &&
    user.is_verified &&
    (AUTHENTICATED_PAGES.includes(pathname) ||
      pathname.startsWith("/connect/"));

  return (
    <div className="relative w-full min-h-screen">
      {/* Main content area */}
      <div className="w-full min-h-screen">{children}</div>

      {/* Global bottom navigation - only show on authenticated pages */}
      {shouldShowBottomNav && <NavBar />}
    </div>
  );
}