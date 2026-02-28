"use client";

import { useAuth } from "@/components/AuthProvider";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";

type AppContextValue = {
  user: ReturnType<typeof useAuth>["user"];
  activeNoteId: string | null;
  goToNote: (noteId: string) => void;
};

const AppContext = React.createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const activeNoteId = typeof params?.noteId === "string" ? params.noteId : null;

  const goToNote = React.useCallback(
    (noteId: string) => {
      router.push(`/${noteId}`);
    },
    [router]
  );

  return (
    <AppContext.Provider value={{ user, activeNoteId, goToNote }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = React.useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
