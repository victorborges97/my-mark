"use client";

import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { listLocalNotes } from "@/lib/local-notes";
import { createNote } from "@/lib/notes";
import { GoogleAuthProvider, User, linkWithPopup } from "firebase/auth";
import { Link as LinkIcon, User as UserIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [smallIdentity, setSmallIdentity] = useState({ email: "", isAnonymous: false });
  const provider = new GoogleAuthProvider();

  useEffect(() => {
    if (user) {
      setSmallIdentity({ email: user?.email || "", isAnonymous: user?.isAnonymous ?? true });
    }
  }, [user]);

  const linkGoogle = async () => {
    if (!user) return;
    try {
      await linkWithPopup(user, provider);
      toast.success("Conta Google vinculada com sucesso!");
      setUser(user);
      setSmallIdentity({ email: user?.email || "", isAnonymous: user?.isAnonymous ?? true });
      migrateNotes(user);
    } catch (e: any) {
      if (
        e?.code === "auth/credential-already-in-use" ||
        e?.code === "auth/account-exists-with-different-credential"
      ) {
        toast.error("Esta conta Google já está vinculada a outro usuário.");
      } else if (e?.code === "auth/popup-closed-by-user") {
      } else {
        toast.error("Falha ao vincular conta Google.");
        console.error(e);
      }
    }
  };

  async function migrateNotes(user: User) {
    try {
      const notes = listLocalNotes(user.uid);
      if (notes.length === 0) return;
      for (let index = 0; index < notes.length; index++) {
        const element = notes[index];
        await createNote(user.uid, element.title, element.content, element.id);
      }
      toast.success("Notas anônimas migradas com sucesso!");
      localStorage.removeItem("notes");
    } catch (e) {
      toast.error("Erro ao migrar notas.");
      console.error(e);
    }
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold inline-flex items-center gap-2">
          <UserIcon size={18} /> Perfil
        </h1>
      </div>

      <section className="rounded-[20px] border border-zinc-200 dark:border-zinc-800 p-4">
        <div className="grid gap-2 text-sm">
          <div>
            <span className="text-zinc-500">UID:</span> {user?.uid || "—"}
          </div>
          <div>
            <span className="text-zinc-500">Anônimo:</span>{" "}
            {String(smallIdentity?.isAnonymous ?? true)}
          </div>
          <div>
            <span className="text-zinc-500">Email:</span> {smallIdentity?.email || "—"}
          </div>
        </div>

        {
          smallIdentity?.isAnonymous ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button onClick={linkGoogle}>
                <span className="inline-flex items-center gap-2">
                  <LinkIcon size={16} /> Conectar com Google
                </span>
              </Button>
            </div>
          ) : null
        }

        {
          smallIdentity?.isAnonymous ? (
            <p className="mt-3 text-xs text-zinc-500">
              Vincular sua conta Google converte seu usuário anônimo em um usuário persistente sem perder seus dados salvos.
            </p>
          ) : null
        }
      </section>
    </div>
  );
}
