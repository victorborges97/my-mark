"use client";
import { useApp } from "@/app/(app)/app-context";
import { useNotes } from "@/app/(app)/notes-context";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, useSidebar } from "@/components/ui/sidebar";
import { FileText, LogOut, Notebook, Plus, Share2, User } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function AppSidebar() {
  const { logout, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { setOpenMobile } = useSidebar();
  const { activeNoteId } = useApp();
  const { notes, createNote, deleteNote, listType, setListType } = useNotes();
  const [openCreate, setOpenCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("Novo documento");
  const isGoogle = !!user && (user.providerData || []).some((p) => p?.providerId === "google.com");
  const smallIdentity = isGoogle ? (user?.displayName || user?.email || "") : "Logado como Anônimo";

  // Sincroniza listType com searchParams
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "shared") {
      setListType("shared");
    } else {
      setListType("my");
    }
  }, [searchParams, setListType]);

  const handleTabChange = (type: "my" | "shared") => {
    const params = new URLSearchParams(searchParams);
    if (type === "shared") {
      params.set("tab", "shared");
    } else {
      params.delete("tab");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleCreate = async () => {
    try {
      if (creating) return;
      setCreating(true);
      const id = await createNote(newTitle?.trim() || "Novo documento");
      router.push(`/${id}`);
      setOpenMobile(false);
      setOpenCreate(false);
      setNewTitle("Novo documento");
    } catch (e) {
      alert("Erro ao criar markdown. Verifique as regras/credenciais do Firestore.");
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex gap-2 items-center p-2">
          <Notebook size={18} />
          <span className="text-md" style={{ fontFamily: "var(--font-outfit)" }}>Docszin</span>
        </div>
        <div className="px-2 pb-2">
          <div className="grid grid-cols-2 gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
            <button
              onClick={() => handleTabChange("my")}
              className={`flex items-center justify-center text-xs font-medium py-1.5 px-2 rounded-md transition-all ${listType === "my"
                  ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
            >
              <User size={14} className="mr-1.5" />
              Meus
            </button>
            <button
              onClick={() => handleTabChange("shared")}
              className={`flex items-center justify-center text-xs font-medium py-1.5 px-2 rounded-md transition-all ${listType === "shared"
                  ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
            >
              <Share2 size={14} className="mr-1.5" />
              Compartilhados
            </button>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <ul>
          {notes.map((n) => (
            <li key={n.id} className="m-1">
              <div className={`flex items-center gap-2 rounded ${activeNoteId === n.id ? "bg-zinc-100 dark:bg-zinc-900" : ""}`}>
                <Link
                  href={`/${n.id}`}
                  onClick={() => setOpenMobile(false)}
                  className="flex min-w-0 flex-1 text-left px-2 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded"
                >
                  <span className="inline-flex items-center gap-2 min-w-0">
                    <FileText size={16} />
                    <span className="truncate overflow-hidden text-ellipsis whitespace-nowrap">
                      {n.title || "Sem título"}
                    </span>
                  </span>
                </Link>
                <button
                  aria-label="Excluir"
                  className="shrink-0 p-2 text-red-600 hover:text-red-700"
                  onClick={async (e) => {
                    e.stopPropagation();
                    const idx = notes.findIndex((x) => x.id === n.id);
                    const next = notes[idx + 1] || notes[idx - 1];
                    await deleteNote(n.id);
                    if (activeNoteId === n.id) {
                      if (next) {
                        router.push(`/${next.id}`);
                      } else {
                        router.push("/");
                      }
                      setOpenMobile(false);
                    }
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v9h-2V9zm4 0h2v9h-2V9zM7 9h2v9H7V9z"></path>
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex flex-col gap-2">
          <Button onClick={() => setOpenCreate(true)}>
            <span className="inline-flex items-center gap-2">
              <Plus size={16} /> Novo
            </span>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/profile" onClick={() => setOpenMobile(false)}>
              <span className="inline-flex items-center gap-2">
                <User size={16} /> Perfil
              </span>
            </Link>
          </Button>
          {user && (
            <div className="px-1">
              <span className="text-xs text-zinc-500">{smallIdentity}</span>
            </div>
          )}
          <Button
            variant="outline"
            onClick={async () => {
              try {
                await logout();
              } finally {
                setOpenMobile(false);
                router.replace("/");
                if (typeof window !== "undefined") {
                  window.location.reload();
                }
              }
            }}
          >
            <span className="inline-flex items-center gap-2">
              <LogOut size={16} /> Sair
            </span>
          </Button>
        </div>
      </SidebarFooter>

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar novo documento</DialogTitle>
            <DialogDescription>Deseja criar um novo documento agora?</DialogDescription>
          </DialogHeader>
          <div className="mb-3">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Título do documento"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpenCreate(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={creating || !newTitle.trim()}>
              {creating ? "Criando..." : "Criar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Sidebar>
  );
}
