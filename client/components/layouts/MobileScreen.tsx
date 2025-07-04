import { ReactNode } from "react";

interface MobileScreenProps {
  children: ReactNode;
  className?: string;
}

export default function MobileScreen({
  children,
  className = "",
}: MobileScreenProps) {
  return <main className={`min-h-[100dvh] ${className}`}>{children}</main>;
}