"use client";

import { useRouter, usePathname } from "next/navigation";
import { House, LinkSimple, User, Graph, ChartBar, Trophy } from "phosphor-react";

interface NavItem {
  icon: React.ComponentType<any>;
  label: string;
  path: string;
  isActive?: boolean;
}

interface NavBarProps {
  className?: string;
}

export default function NavBar({
  className = "",
}: NavBarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const navItems: NavItem[] = [
    {
      icon: House,
      label: "Home",
      path: "/",
      isActive: pathname === "/",
    },
    {
      icon: Trophy,
      label: "Challenges",
      path: "/challenges",
      isActive: pathname === "/challenges" || pathname.startsWith("/challenges/"),
    },
    {
      icon: ChartBar,
      label: "Stats",
      path: "/stats",
      isActive: pathname === "/stats",
    },
    {
      icon: LinkSimple,
      label: "Connect",
      path: "/connect",
      isActive: pathname === "/connect",
    },
    {
      icon: User,
      label: "Profile",
      path: "/whoop",
      isActive: pathname === "/whoop",
    },
    {
      icon: User,
      label: "Profile",
      path: "/hypergraph",
      isActive: pathname === "/hypergraph",
    },
  ];

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <div
      className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 ${className}`}
    >
      <div
        className="bg-white/95 backdrop-blur-xl rounded-full shadow-lg border border-white/20 px-8
          py-2"
      >
        <div className="flex items-center gap-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all
                duration-300 ease-out transform hover:scale-110 active:scale-95 ${
                item.isActive
                    ? "bg-gray-500 text-white shadow-lg shadow-gray-500/30"
                    : "text-gray-500 hover:text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icon
                  className={`w-6 h-6 transition-all duration-200 ${
                  item.isActive ? "text-white" : "text-gray-500" }`}
                  weight={item.isActive ? "fill" : "regular"}
                />

                {/* Ripple effect on tap */}
                <div
                  className="absolute inset-0 rounded-full bg-current opacity-0 transition-opacity
                    duration-200 active:opacity-10"
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}