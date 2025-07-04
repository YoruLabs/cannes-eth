"use client";

import Link from "next/link";
import Image from "next/image";
// import { ZapBg } from "@/components/zap-bg";
import { motion } from "motion/react";
import { useCallback } from "react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  // Use useCallback to handle navigation safely
  const handleGoBack = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      // Delay navigation slightly to avoid React error
      setTimeout(() => {
        router.back();
      }, 10);
    },
    [router]
  );

  return (
    <div className="flex h-screen items-center justify-center flex-col bg-background relative">
      {/* Background with logo mask */}
      {/* <div className="fixed inset-0">
        <ZapBg />
      </div> */}

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="z-10 flex flex-col items-center text-center max-w-md"
      >
        {/* Logo with desaturated effect for error state */}
        {/* <div className="relative mb-8">
          <Image
            src="/_terminal-logo.png"
            alt="_terminal Logo"
            width={120}
            height={120}
            style={{
              filter:
                'saturate(0.6) drop-shadow(0 0 8px rgba(200, 0, 50, 0.3))',
            }}
          />
        </div> */}

        <motion.h1
          className="text-5xl font-bold text-foreground mb-2"
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          404
        </motion.h1>

        <h2 className="mt-2 text-2xl font-semibold text-foreground mb-4">
          Page Not Found
        </h2>

        <p className="mt-2 text-center text-muted-foreground mb-6">
          Sorry, we couldn&apos;t find the page you&apos;re looking for.
          <br />
          It might have been removed, renamed, or doesn&apos;t exist.
        </p>

        <div className="flex gap-4 mt-6">
          <a
            href="#"
            onClick={handleGoBack}
            className="px-6 py-2.5 bg-muted text-muted-foreground rounded-md font-medium
              hover:bg-muted/80 transition-colors inline-flex items-center justify-center"
          >
            Go Back
          </a>

          <Link
            href="/"
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-md font-medium
              hover:bg-primary/90 transition-colors shadow-sm inline-flex items-center
              justify-center"
          >
            Go Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}