"use client";
import { useNotes } from "@/app/(app)/notes-context";
import { useAuth } from "@/components/AuthProvider";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Note } from "@/lib/notes";
import { FileText, LogOut, Notebook, Plus, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function Sidebar({
    selectedId,
    onSelect,
}: {
    selectedId: string | null;
    onSelect: (id: string) => void;
}) {
    const [notes, setNotes] = useState<Note[]>([]);
    const { logout, user } = useAuth();
    const { notes: ctxNotes, createNote, deleteNote } = useNotes();
    const ownerId = useMemo(() => {
        try {
            const anon = JSON.parse(localStorage.getItem("anonUser") || "{}");
            return user?.uid || anon?.uid || "";
        } catch {
            return "";
        }
    }, [user]);

    useEffect(() => {
        setNotes(ctxNotes);
    }, [ctxNotes]);

    const [openCreate, setOpenCreate] = useState(false);
    const [creating, setCreating] = useState(false);

    const handleCreate = async () => {
        try {
            if (creating) return;
            if (!ownerId) return;
            setCreating(true);
            const id = await createNote("Novo documento");
            onSelect(id);
            setOpenCreate(false);
        } catch (e) {
            alert("Erro ao criar markdown. Verifique as regras/credenciais do Firestore.");
            console.error(e);
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="flex h-full w-64 flex-col bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-[20px] overflow-hidden">
            <header className="flex items-center gap-2 p-3 border-b border-zinc-200 dark:border-zinc-800">
                <Notebook size={18} />
                <span className="text-sm" style={{ fontFamily: "var(--font-outfit)" }}>Docszin</span>
            </header>
            <nav className="flex-1 overflow-y-auto p-1">
                <ul>
                    {notes.map((n) => (
                        <li key={n.id} className="m-1">
                            <div className={`flex items-center gap-2 rounded ${selectedId === n.id ? "bg-zinc-100 dark:bg-zinc-900" : ""}`}>
                                <button
                                    onClick={() => onSelect(n.id)}
                                    className="flex-1 text-left px-2 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded"
                                >
                                    <span className="inline-flex items-center gap-2 truncate">
                                        <FileText size={16} />
                                        {n.title || "Sem título"}
                                    </span>
                                </button>
                                <button
                                    aria-label="Excluir"
                                    className="p-2 text-red-600 hover:text-red-700"
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        if (!ownerId) return;
                                        const idx = notes.findIndex((x) => x.id === n.id);
                                        const next = notes[idx + 1] || notes[idx - 1];
                                        await deleteNote(n.id);
                                        if (selectedId === n.id && next) {
                                            onSelect(next.id);
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
            </nav>
            <footer className="border-t border-zinc-200 dark:border-zinc-800 p-3">
                <div className="flex flex-col gap-2">
                    <button
                        className="flex items-center gap-2 rounded px-3 py-2 text-sm bg-black text-white dark:bg-white dark:text-black"
                        onClick={() => {
                            if (!ownerId) return;
                            setOpenCreate(true);
                        }}
                        disabled={!ownerId}
                    >
                        <Plus size={16} /> Novo
                    </button>
                    <Link
                        href="/profile"
                        className="flex items-center gap-2 rounded px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700"
                    >
                        <User size={16} /> Perfil
                    </Link>
                    <button
                        className="flex items-center gap-2 rounded px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700"
                        onClick={logout}
                    >
                        <LogOut size={16} /> Sair
                    </button>
                </div>
            </footer>
            <Dialog open={openCreate} onOpenChange={setOpenCreate}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Criar novo documento</DialogTitle>
                        <DialogDescription>Deseja criar um novo documento agora?</DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2">
                        <button
                            className="rounded px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700"
                            onClick={() => setOpenCreate(false)}
                        >
                            Cancelar
                        </button>
                        <button
                            className="rounded px-3 py-2 text-sm bg-black text-white dark:bg-white dark:text-black disabled:opacity-50"
                            onClick={handleCreate}
                            disabled={creating}
                        >
                            {creating ? "Criando..." : "Criar"}
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
