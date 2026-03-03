"use client";
import { useNotes } from "@/app/(app)/notes-context";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { createInvite, listInvitesForNote, reInvite, revokeInvite, type Invite } from "@/lib/invites";
import { createPublish, removePublish, subscribeNote } from "@/lib/notes";
import { Copy, Download, Globe, LoaderCircle, MoreVertical, RotateCcw, Share, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function Editor({ noteId }: { noteId: string }) {
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const fallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const titleRef = useRef<HTMLDivElement | null>(null);
    const contentRef = useRef<HTMLDivElement | null>(null);
    const [status, setStatus] = useState<"idle" | "saving">("idle");
    const { getNote, updateNote, source } = useNotes();
    const [loading, setLoading] = useState(source === "remote");
    const { user } = useAuth();

    const isGoogle = !!user && (user.providerData || []).some((p) => p?.providerId === "google.com");
    const [openShare, setOpenShare] = useState(false);
    const [shareEmail, setShareEmail] = useState("");
    const [publishing, setPublishing] = useState(false);
    const [openPublish, setOpenPublish] = useState(false);
    const [publishId, setPublishId] = useState<string | null>(null);
    const [isPublished, setIsPublished] = useState<boolean>(false);
    const [invites, setInvites] = useState<Invite[]>([]);
    const [loadingInvites, setLoadingInvites] = useState(false);
    const [invitesError, setInvitesError] = useState<string | null>(null);

    useEffect(() => {
        if (!noteId) return;
        let unsub: null | (() => void) = null;
        (async () => {
            try {
                const note = await getNote(noteId);
                if (note) {
                    if (titleRef.current) {
                        titleRef.current.innerText = note.title || "";
                    }
                    if (contentRef.current) {
                        contentRef.current.innerText = note.content || "";
                    }
                    setIsPublished(!!note.public);
                    setPublishId(note.publishId || null);
                }
                if (source === "remote") setLoading(false);
                if (source === "remote") {
                    unsub = subscribeNote(noteId, (n) => {
                        if (!n || (user && n.ownerId && n.ownerId !== user.uid)) return;
                        if (titleRef.current) {
                            const newTitle = n?.title || "";
                            const el = titleRef.current;
                            const isFocused = document.activeElement === el;
                            if ((!isFocused || el.innerText === "") && el.innerText !== newTitle) {
                                el.innerText = newTitle;
                            }
                        }
                        if (contentRef.current) {
                            const newContent = n?.content || "";
                            const el = contentRef.current;
                            const isFocused = document.activeElement === el;
                            if ((!isFocused || el.innerText === "") && el.innerText !== newContent) {
                                el.innerText = newContent;
                            }
                        }
                        setIsPublished(!!n?.public);
                        setPublishId(n?.publishId || null);
                    });
                }
            } catch (e: any) {
                console.error("Erro ao recuperar nota", e);
                const msg = e?.code ? `Erro ao recuperar nota (${e.code})` : "Erro ao recuperar nota";
                toast.error("Recuperar nota", {
                    description: msg,
                });
            }
        })();

        return () => {
            if (unsub) unsub();
            if (saveTimer.current) {
                clearTimeout(saveTimer.current);
            }
            if (fallbackTimer.current) {
                clearTimeout(fallbackTimer.current);
            }
        };
    }, [noteId, source, user, getNote]);

    const scheduleSave = () => {
        if (!noteId) return;
        if (saveTimer.current) clearTimeout(saveTimer.current);
        setStatus("saving");
        if (fallbackTimer.current) clearTimeout(fallbackTimer.current);
        // Fallback: se demorar mais de 1m30s, oculta "Salvando..." e mostra erro
        fallbackTimer.current = setTimeout(() => {
            setStatus("idle");
            toast.error("Salvar nota", {
                description: "Tempo esgotado. Tente novamente.",
            });
        }, 90_000);
        saveTimer.current = setTimeout(async () => {
            try {
                const title = titleRef.current?.innerText || "";
                const content = contentRef.current?.innerText || "";
                await updateNote(noteId, { title, content });
                setStatus("idle");
                if (fallbackTimer.current) {
                    clearTimeout(fallbackTimer.current);
                }
            } catch (e: any) {
                console.error("Erro ao salvar nota", e);
                setStatus("idle");
                if (fallbackTimer.current) {
                    clearTimeout(fallbackTimer.current);
                }
                const msg = e?.code ? `Erro ao salvar (${e.code})` : "Erro ao salvar";
                toast.error("Salvar nota", {
                    description: msg,
                });
            }
        }, 500);
    };

    const handleShare = async () => {
        // Primeiro trata só a criação do convite (mensagem de sucesso/erro)
        try {
            if (!isGoogle || !noteId) return;
            if (!shareEmail.trim()) {
                toast.error("Convite", { description: "Informe um email válido." });
                return;
            }
            const id = await createInvite(noteId, shareEmail.trim().toLowerCase(), user!.uid);
            setShareEmail("");
            toast.success("Convite criado", { description: `ID: ${id}` });
        } catch (e: any) {
            console.error(e);
            const msg = e?.code ? `Erro ao convidar (${e.code})` : "Erro ao convidar";
            toast.error("Convite", { description: msg });
            return;
        }
        // Depois atualiza a lista silenciosamente (sem gerar erro de UI)
        try {
            await loadInvites();
        } catch (e) {
            console.warn("Falha ao atualizar lista de convites", e);
        }
    };
    const loadInvites = async () => {
        if (!noteId || !user) return;
        setLoadingInvites(true);
        setInvitesError(null);
        try {
            const list = await listInvitesForNote(noteId, user.uid);
            setInvites(list);
        } catch (e: any) {
            const msg = e?.code || e?.message || "Falha ao carregar convites";
            setInvitesError(String(msg));
        } finally {
            setLoadingInvites(false);
        }
    };
    useEffect(() => {
        if (openShare && noteId) {
            loadInvites();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [openShare, noteId]);
    const handleCopyInvite = async (inviteId: string) => {
        try {
            await navigator.clipboard.writeText(`${location.origin}/invite/${inviteId}`);
            toast.success("Link do convite copiado");
        } catch { }
    };
    const handleReinvite = async (inviteId: string) => {
        try {
            if (!user) return;
            const newId = await reInvite(inviteId, user.uid);
            await loadInvites();
            if (newId) {
                try {
                    await navigator.clipboard.writeText(`${location.origin}/invite/${newId}`);
                    toast.success("Novo convite criado", { description: "Link copiado" });
                } catch {
                    toast.success("Novo convite criado");
                }
            }
        } catch (e: any) {
            const msg = e?.code ? `Erro ao reenviar (${e.code})` : "Erro ao reenviar";
            toast.error("Convite", { description: msg });
        }
    };
    const handleRevoke = async (inviteId: string) => {
        try {
            await revokeInvite(inviteId);
            await loadInvites();
            toast.success("Acesso removido");
        } catch (e: any) {
            const msg = e?.code ? `Erro ao remover acesso (${e.code})` : "Erro ao remover acesso";
            toast.error("Convite", { description: msg });
        }
    };

    const handlePublish = async () => {
        try {
            if (!isGoogle || !noteId) return;
            if (publishing) return;
            setPublishing(true);
            const pid = await createPublish(noteId, user!.uid);
            setPublishing(false);
            toast.success("Publicação criada", { description: `/public/${pid}` });
            setPublishId(pid);
            setIsPublished(true);
        } catch (e: any) {
            console.error(e);
            setPublishing(false);
            const msg = e?.code ? `Erro ao publicar (${e.code})` : "Erro ao publicar";
            toast.error("Publicar", { description: msg });
        }
    };
    const handleUnpublish = async () => {
        try {
            if (!isGoogle || !noteId) return;
            await removePublish(noteId);
            setIsPublished(false);
            setPublishId(null);
            toast.success("Publicação removida");
        } catch (e: any) {
            console.error(e);
            const msg = e?.code ? `Erro ao remover publicação (${e.code})` : "Erro ao remover publicação";
            toast.error("Publicar", { description: msg });
        }
    };
    const copyPublishLink = async () => {
        if (!publishId) return;
        try {
            await navigator.clipboard.writeText(`${location.origin}/public/${publishId}`);
            toast.success("Link copiado");
        } catch { }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full min-h-0 w-full flex-col relative">
                <svg className="tea" width="37" height="48" viewBox="0 0 37 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M27.0819 17H3.02508C1.91076 17 1.01376 17.9059 1.0485 19.0197C1.15761 22.5177 1.49703 29.7374 2.5 34C4.07125 40.6778 7.18553 44.8868 8.44856 46.3845C8.79051 46.79 9.29799 47 9.82843 47H20.0218C20.639 47 21.2193 46.7159 21.5659 46.2052C22.6765 44.5687 25.2312 40.4282 27.5 34C28.9757 29.8188 29.084 22.4043 29.0441 18.9156C29.0319 17.8436 28.1539 17 27.0819 17Z" stroke="#33406f" strokeWidth="2"></path>
                    <path d="M29 23.5C29 23.5 34.5 20.5 35.5 25.4999C36.0986 28.4926 34.2033 31.5383 32 32.8713C29.4555 34.4108 28 34 28 34" stroke="#33406f" strokeWidth="2"></path>
                    <path id="teabag" fill="#33406f" fillRule="evenodd" clipRule="evenodd" d="M16 25V17H14V25H12C10.3431 25 9 26.3431 9 28V34C9 35.6569 10.3431 37 12 37H18C19.6569 37 21 35.6569 21 34V28C21 26.3431 19.6569 25 18 25H16ZM11 28C11 27.4477 11.4477 27 12 27H18C18.5523 27 19 27.4477 19 28V34C19 34.5523 18.5523 35 18 35H12C11.4477 35 11 34.5523 11 34V28Z"></path>
                    <path id="steamL" d="M17 1C17 1 17 4.5 14 6.5C11 8.5 11 12 11 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" stroke="#33406f"></path>
                    <path id="steamR" d="M21 6C21 6 21 8.22727 19 9.5C17 10.7727 17 13 17 13" stroke="#33406f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
            </div>
        )
    }

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="relative">
                {status === "saving" && (
                    <span className="absolute top-5 right-5 text-xs text-green-600 inline-flex items-center gap-1">
                        <LoaderCircle size={12} className="animate-spin" /> Salvando...
                    </span>
                )}
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
                    <div
                        ref={titleRef}
                        contentEditable
                        suppressContentEditableWarning
                        data-placeholder="Título"
                        className="flex-1 min-w-0 text-2xl font-semibold outline-none p-4"
                        onInput={scheduleSave}
                    />
                    <div className="flex items-center gap-2 p-4">
                        <div className="hidden md:flex items-center gap-2">
                            <Button variant="outline">
                                <Download size={14} /> Exportar
                            </Button>
                            {isGoogle && (
                                <>
                                    <Button variant="outline" onClick={() => setOpenShare(true)}>
                                        <Share size={14} /> Compartilhar
                                    </Button>
                                    <Button variant="outline" onClick={() => setOpenPublish(true)}>
                                        <Globe size={14} /> Publicar
                                    </Button>
                                </>
                            )}
                        </div>
                        <div className="md:hidden">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline">
                                        <MoreVertical size={16} />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem>
                                        <Download size={14} /> Exportar
                                    </DropdownMenuItem>
                                    {isGoogle && (
                                        <>
                                            <DropdownMenuItem onClick={() => setOpenShare(true)}>
                                                <Share size={14} /> Compartilhar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setOpenPublish(true)}>
                                                <Globe size={14} /> Publicar
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
            </div>
            <div
                ref={contentRef}
                contentEditable
                suppressContentEditableWarning
                data-placeholder="Escreva seu Markdown aqui..."
                className="flex-1 min-h-0 overflow-y-auto whitespace-pre-wrap font-mono text-sm p-4 outline-none"
                onInput={scheduleSave}
            />
            <Dialog open={openPublish} onOpenChange={setOpenPublish}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Publicação</DialogTitle>
                        <DialogDescription>
                            Torne sua nota acessível publicamente com um link. Você pode remover a qualquer momento.
                        </DialogDescription>
                    </DialogHeader>
                    {!isPublished ? (
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setOpenPublish(false)}>Cancelar</Button>
                            <Button onClick={handlePublish} disabled={publishing}>
                                <Globe size={14} /> Publicar
                            </Button>
                        </div>
                    ) : (
                        <div className="grid gap-2">
                            <div className="text-sm">
                                Link público:
                                <div className="mt-1 rounded border p-2 break-all">{publishId ? `${location.origin}/public/${publishId}` : "—"}</div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={copyPublishLink}>Copiar link</Button>
                                <Button variant="outline" onClick={handleUnpublish}>Remover publicação</Button>
                                <Button onClick={() => setOpenPublish(false)}>Fechar</Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
            <Dialog open={openShare} onOpenChange={setOpenShare}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Compartilhar nota</DialogTitle>
                        <DialogDescription>Informe o email do usuário que receberá o convite.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3">
                        <div className="grid gap-2">
                            {loadingInvites && (
                                <div className="text-xs text-zinc-500">Carregando convites...</div>
                            )}
                            {!loadingInvites && invitesError && (
                                <div className="flex items-center justify-between rounded border border-red-300 text-red-700 bg-red-50 px-3 py-2 text-xs">
                                    <span>{invitesError === "permission-denied" ? "Sem permissão para listar convites. Verifique as regras (invites: allow list)." : `Falha ao carregar convites: ${invitesError}`}</span>
                                    <Button size="sm" variant="outline" onClick={loadInvites}>Tentar novamente</Button>
                                </div>
                            )}
                            {!loadingInvites && !invitesError && invites.length === 0 && (
                                <div className="text-xs text-zinc-500">Nenhum convite ainda.</div>
                            )}
                            {!loadingInvites && !invitesError && invites.length > 0 && invites.map((inv) => (
                                <div key={inv.id} className="flex items-center justify-between rounded border px-3 py-2">
                                    <div>
                                        <div className="text-sm font-medium">{inv.toEmail}</div>
                                        <div className="text-xs text-zinc-500">
                                            {inv.status === "accepted" ? "Aceito" : inv.status === "revoked" ? "Removido" : "Pendente"}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {inv.status === "pending" && (
                                            <>
                                                <Button aria-label="Reenviar" size="icon-sm" variant="outline" onClick={() => handleReinvite(inv.id)}>
                                                    <RotateCcw size={14} />
                                                </Button>
                                                <Button aria-label="Copiar" size="icon-sm" variant="outline" onClick={() => handleCopyInvite(inv.id)}>
                                                    <Copy size={14} />
                                                </Button>
                                                <Button aria-label="Remover" size="icon-sm" variant="outline" onClick={() => handleRevoke(inv.id)}>
                                                    <Trash2 size={14} />
                                                </Button>
                                            </>
                                        )}
                                        {inv.status === "accepted" && (
                                            <Button aria-label="Remover acesso" size="icon-sm" variant="outline" onClick={() => handleRevoke(inv.id)}>
                                                <Trash2 size={14} />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Input
                            placeholder="email@exemplo.com"
                            value={shareEmail}
                            onChange={(e) => setShareEmail(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setOpenShare(false)}>Cancelar</Button>
                            <Button onClick={handleShare}>Enviar convite</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
