"use client";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { auth } from "@/lib/firebase";
import { acceptInvite, getInvite } from "@/lib/invites";
import { GoogleAuthProvider, linkWithPopup, signInWithPopup, signInWithRedirect, linkWithRedirect } from "firebase/auth";
import Link from "next/link";
import { useParams } from "next/navigation";
import * as React from "react";

export default function InviteAcceptPage() {
  const { user } = useAuth();
  const params = useParams() as any;
  const inviteId = params?.inviteId as string | undefined;
  const [invite, setInvite] = React.useState<Awaited<ReturnType<typeof getInvite>> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [openLogin, setOpenLogin] = React.useState(false);
  const provider = React.useMemo(() => new GoogleAuthProvider(), []);

  const isGoogle = !!user && (user.providerData || []).some((p) => p?.providerId === "google.com");

  React.useEffect(() => {
    let active = true;
    (async () => {
      if (!inviteId) {
        if (active) setLoading(false);
        return;
      }
      const inv = await getInvite(inviteId);
      if (active) {
        setInvite(inv);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [inviteId]);

  React.useEffect(() => {
    setOpenLogin(!isGoogle);
  }, [isGoogle]);

  const handleLoginGoogle = async () => {
    try {
      if (!user) return;
      if (user.isAnonymous) {
        try {
          await linkWithPopup(user, provider);
        } catch (e: any) {
          if (e?.code === "auth/credential-already-in-use" || e?.code === "auth/account-exists-with-different-credential") {
            try {
              await signInWithPopup(auth, provider);
            } catch (err: any) {
              if (err?.code === "auth/popup-blocked") {
                try { localStorage.setItem("initRedirect", "1"); } catch {}
                await signInWithRedirect(auth, provider);
                return;
              }
              if (err?.code === "auth/popup-closed-by-user") return;
              throw err;
            }
          } else if (e?.code === "auth/popup-closed-by-user") {
            return;
          } else {
            if (e?.code === "auth/popup-blocked") {
              try { localStorage.setItem("initRedirect", "1"); } catch {}
              await linkWithRedirect(user, provider);
              return;
            }
            throw e;
          }
        }
      } else {
        try {
          await signInWithPopup(auth, provider);
        } catch (e: any) {
          if (e?.code === "auth/popup-blocked") {
            try { localStorage.setItem("initRedirect", "1"); } catch {}
            await signInWithRedirect(auth, provider);
            return;
          }
          if (e?.code === "auth/popup-closed-by-user") return;
          throw e;
        }
      }
    } catch { }
  };

  const handleAccept = async () => {
    if (!user || !isGoogle || !inviteId) return;
    await acceptInvite(inviteId, user.uid);
    alert("Convite aceito. Você agora possui acesso a este documento.");
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="text-sm text-zinc-500">Carregando convite...</span>
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center text-sm text-zinc-600">
          <div>Convite inválido ou inexistente.</div>
          <Link href="/" className="mt-2 inline-block underline">Voltar</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-md mx-auto rounded-[20px] border border-zinc-200 dark:border-zinc-800 p-4">
        <h1 className="text-lg font-semibold mb-2">Convite para acessar nota</h1>
        <p className="text-sm text-zinc-600">Nota: {invite.noteId}</p>
        <p className="text-sm text-zinc-600">Destinatário: {invite.toEmail}</p>
        <div className="mt-4 flex gap-2">
          <Button onClick={handleAccept} disabled={!isGoogle}>
            Aceitar convite
          </Button>
          <Link href="/" className="text-sm underline">Voltar</Link>
        </div>
      </div>

      <Dialog open={openLogin} onOpenChange={() => { }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Login necessário</DialogTitle>
            <DialogDescription>Entre com Google para aceitar o convite e acessar a nota.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button onClick={handleLoginGoogle}>Entrar com Google</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
