"use client";

import Image from "next/image";
import { Toaster } from "@/components/ui/sonner";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F0F4F8] p-4">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-3">
        <div className="h-16 w-16 rounded-lg bg-white flex items-center justify-center shadow-sm overflow-hidden p-1">
          <Image
            src="/logo.png"
            alt="MEMS Logo"
            width={56}
            height={56}
            className="object-contain"
          />
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-semibold text-foreground">
            Maritime Environmental
          </span>
          <span className="text-lg font-semibold text-foreground">
            Management Systems Mems
          </span>
        </div>
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">{children}</div>
      </div>

      <Toaster position="top-right" richColors />
    </div>
  );
}






