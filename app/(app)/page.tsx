"use client";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInAnonymously, signInWithPopup, signInWithRedirect } from "firebase/auth";
import { useEffect, useMemo, useState } from "react";

export default function AppHomePage() {
  const { user } = useAuth();
  const provider = useMemo(() => new GoogleAuthProvider(), []);
  const isGoogle =
    !!user && (user.providerData || []).some((p) => p?.providerId === "google.com");
  const [openInfo, setOpenInfo] = useState(false);

  useEffect(() => {
    setOpenInfo(!isGoogle);
  }, [isGoogle]);

  const continueAnon = async () => {
    try {
      if (!user) {
        await signInAnonymously(auth);
      }
      if (user?.isAnonymous) {
        localStorage.setItem(
          "anonUser",
          JSON.stringify({ uid: user.uid, lastSeen: Date.now() })
        );
      }
      setOpenInfo(false);
    } catch {
      setOpenInfo(false);
    }
  };

  const loginGoogle = async () => {
    try {
      try {
        await signInWithPopup(auth, provider);
      } catch (e: any) {
        if (e?.code === "auth/popup-blocked") {
          try { localStorage.setItem("initRedirect", "1"); } catch { }
          await signInWithRedirect(auth, provider);
          return;
        }
        if (e?.code === "auth/popup-closed-by-user") return;
        throw e;
      }
    } catch (e: any) {
      if (e?.code === "auth/popup-closed-by-user") return;
      alert("Falha ao conectar com Google.");
      console.error(e);
    }
  };

  return (
    <div className="flex h-full items-center justify-center text-zinc-500">
      Selecione ou crie um Markdown
      <Dialog open={openInfo} onOpenChange={() => { }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Como funciona o Docszin</DialogTitle>
            <DialogDescription>
              Você pode usar como anônimo com armazenamento local, ou entrar com Google
              para salvar suas notas na nuvem (Firestore) e sincronizar entre dispositivos.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 text-sm">
            <div className="rounded border p-3">
              <div className="font-medium">Conta anônima</div>
              <div className="text-zinc-500">
                - Notas salvas no seu navegador (localStorage)
                <br />
                - Sem sincronização entre dispositivos
                <br />
                - Pode vincular ao Google depois, sem perder dados
              </div>
            </div>
            <div className="rounded border p-3">
              <div className="font-medium">Conta Google</div>
              <div className="text-zinc-500">
                - Notas salvas no Firestore
                <br />
                - Sincroniza entre dispositivos
                <br />
                - Migra automaticamente suas notas locais
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={continueAnon}>
              Manter anônimo
            </Button>
            <Button onClick={loginGoogle}>Entrar com Google</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
