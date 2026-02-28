"use client";

import { useAuth } from "@/components/AuthProvider";
import { createLocalNote, deleteLocalNote, getLocalNote, linkLocalOwner, listLocalNotes, updateLocalNote } from "@/lib/local-notes";
import { Note, createNote as remoteCreate, deleteNote as remoteDelete, getNote as remoteGet, subscribeNotes as remoteSubscribe, updateNote as remoteUpdate } from "@/lib/notes";
import * as React from "react";

type Source = "local" | "remote";

type NotesContextValue = {
  source: Source;
  notes: Note[];
  getNote: (id: string) => Promise<Note | null>;
  createNote: (title?: string) => Promise<string>;
  updateNote: (id: string, data: Partial<Pick<Note, "title" | "content">>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
};

const NotesContext = React.createContext<NotesContextValue | null>(null);

function detectSource(user: ReturnType<typeof useAuth>["user"]): Source {
  if (!user) return "local";
  if (user.isAnonymous) return "local";
  const isGoogle = (user.providerData || []).some((p) => p?.providerId === "google.com");
  return isGoogle ? "remote" : "local";
}

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const source = detectSource(user);
  const [notes, setNotes] = React.useState<Note[]>([]);
  const ownerId = user?.uid || (typeof window !== "undefined" ? JSON.parse(localStorage.getItem("anonUser") || "{}")?.uid : undefined);
  const prevSourceRef = React.useRef<Source | null>(null);
  const prevOwnerRef = React.useRef<string | undefined>(undefined);

  React.useEffect(() => {
    let unsub: null | (() => void) = null;
    if (source === "remote" && ownerId) {
      unsub = remoteSubscribe(ownerId, (list) => setNotes(list));
    } else if (ownerId) {
      setNotes(listLocalNotes(ownerId) as Note[]);
      const handler = () => setNotes(listLocalNotes(ownerId) as Note[]);
      window.addEventListener("storage", handler);
      return () => {
        window.removeEventListener("storage", handler);
      };
    }
    return () => {
      if (unsub) unsub();
    };
  }, [source, ownerId]);

  React.useEffect(() => {
    const prevSource = prevSourceRef.current;
    const prevOwner = prevOwnerRef.current;
    if (prevSource === "local" && source === "remote" && prevOwner && ownerId && prevOwner !== ownerId) {
      const flagKey = `migrated:${prevOwner}:${ownerId}`;
      const already = typeof window !== "undefined" ? localStorage.getItem(flagKey) : "true";
      if (!already) {
        const locals = listLocalNotes(prevOwner);
        Promise.all(
          locals.map(async (n) => {
            await remoteCreate(ownerId, n.title, n.content, n.id);
          })
        ).then(() => {
          localStorage.setItem(flagKey, "true");
          linkLocalOwner(prevOwner, ownerId);
        }).catch(() => {
          // silencioso
        });
      }
    }
    prevSourceRef.current = source;
    prevOwnerRef.current = ownerId;
  }, [source, ownerId]);

  const getNote = React.useCallback(async (id: string) => {
    if (source === "remote" && ownerId) {
      const n = await remoteGet(id);
      if (!n) return null;
      if (!n.ownerId && ownerId) {
        await remoteUpdate(id, { ownerId });
        n.ownerId = ownerId;
      }
      if (n.ownerId !== ownerId) return null;
      return n;
    }
    const n = getLocalNote(id);
    if (!n) return null;
    if ((n as any).ownerId && ownerId && (n as any).ownerId !== ownerId) return null;
    return n as Note;
  }, [source, ownerId]);

  const createNote = React.useCallback(async (title?: string) => {
    if (source === "remote" && ownerId) {
      return await remoteCreate(ownerId, title);
    }
    if (!ownerId) throw new Error("ownerId indisponível");
    const id = createLocalNote(ownerId, title);
    setNotes(listLocalNotes(ownerId) as Note[]);
    return id;
  }, [source, ownerId]);

  const updateNote = React.useCallback(async (id: string, data: Partial<Pick<Note, "title" | "content">>) => {
    if (source === "remote") {
      await remoteUpdate(id, data);
      return;
    }
    updateLocalNote(id, data);
    if (ownerId) setNotes(listLocalNotes(ownerId) as Note[]);
  }, [source, ownerId]);

  const deleteNote = React.useCallback(async (id: string) => {
    if (source === "remote") {
      await remoteDelete(id);
      return;
    }
    deleteLocalNote(id);
    if (ownerId) setNotes(listLocalNotes(ownerId) as Note[]);
  }, [source, ownerId]);

  return (
    <NotesContext.Provider value={{ source, notes, getNote, createNote, updateNote, deleteNote }}>
      {children}
    </NotesContext.Provider>
  );
}

export function useNotes() {
  const ctx = React.useContext(NotesContext);
  if (!ctx) throw new Error("useNotes must be used within NotesProvider");
  return ctx;
}
