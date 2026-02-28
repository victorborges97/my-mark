"use client";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import * as React from "react";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { loading, user } = useAuth();

  React.useEffect(() => {
    if (!user && loading === false) {
      router.replace("/");
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen">
        <div className="inline-flex items-center gap-2 text-sm text-zinc-600">
          <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
            <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="4" />
          </svg>
          Carregando usuário...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
