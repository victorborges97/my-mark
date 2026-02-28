"use client";
import { useNotes } from "@/app/(app)/notes-context";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Note } from "@/lib/notes";
import { FileText, LogOut, Notebook, Plus, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function MobileSheet({
    open,
    onClose,
    selectedId,
    onSelect,
}: {
    open: boolean;
    onClose: () => void;
    selectedId: string | null;
    onSelect: (id: string) => void;
}) {
    const [notes, setNotes] = useState<Note[]>([]);
    const { logout } = useAuth();
    const { notes: ctxNotes, createNote, deleteNote } = useNotes();

    useEffect(() => {
        if (open) {
            setNotes(ctxNotes);
        }
    }, [open, ctxNotes]);

    const [openCreate, setOpenCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newTitle, setNewTitle] = useState("Novo documento");

    const handleCreate = async () => {
        try {
            if (creating) return;
            setCreating(true);
            const id = await createNote(newTitle?.trim() || "Novo documento");
            onSelect(id);
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
        <div
            className={`fixed inset-0 z-50 transition ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                }`}
        >
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="absolute left-0 top-0 h-full w-80 bg-white dark:bg-black border-r border-zinc-200 dark:border-zinc-800 shadow-xl">
                <header className="flex items-center gap-2 p-3 border-b border-zinc-200 dark:border-zinc-800">
                    <Notebook size={18} />
                    <span className="text-sm" style={{ fontFamily: 'var(--font-outfit)' }}>Docszin</span>
                </header>
                <div className="flex-1 overflow-y-auto">
                    <ul>
                        {notes.map((n) => (
                            <li key={n.id} className="px-2">
                                <div className={`flex items-center gap-2 ${selectedId === n.id ? "bg-zinc-100 dark:bg-zinc-900" : ""}`}>
                                    <button
                                        onClick={() => {
                                            onSelect(n.id);
                                            onClose();
                                        }}
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
                </div>
                <div className="border-t border-zinc-200 dark:border-zinc-800 p-3">
                    <div className="flex flex-col gap-2">
                        <Button onClick={() => setOpenCreate(true)}>
                            <span className="inline-flex items-center gap-2">
                                <Plus size={16} /> Novo
                            </span>
                        </Button>
                        <Link
                            href="/profile"
                            className="flex items-center gap-2 rounded px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700"
                            onClick={onClose}
                        >
                            <User size={16} /> Perfil
                        </Link>
                        <Button variant="outline" onClick={() => { logout(); onClose(); }}>
                            <span className="inline-flex items-center gap-2">
                                <LogOut size={16} /> Sair
                            </span>
                        </Button>
                    </div>
                </div>
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
                            <Button variant="outline" onClick={() => setOpenCreate(false)}>Cancelar</Button>
                            <Button onClick={handleCreate} disabled={creating || !newTitle.trim()}>
                                {creating ? "Criando..." : "Criar"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
