"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";
import { db } from "@/lib/firebase";
import { GoogleAuthProvider, linkWithPopup } from "firebase/auth";
import { addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { LogOut, Link as LinkIcon, User } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const provider = new GoogleAuthProvider();

  const linkGoogle = async () => {
    if (!user) return;
    try {
      await linkWithPopup(user, provider);
      alert("Conta Google vinculada com sucesso!");
    } catch (e: any) {
      if (
        e?.code === "auth/credential-already-in-use" ||
        e?.code === "auth/account-exists-with-different-credential"
      ) {
        alert("Esta conta Google já está vinculada a outro usuário.");
      } else if (e?.code === "auth/popup-closed-by-user") {
      } else {
        alert("Falha ao vincular conta Google.");
        console.error(e);
      }
    }
  };

  const testFirestore = async () => {
    try {
      const ref = await addDoc(collection(db, "diagnostics"), {
        createdAt: serverTimestamp(),
        uid: user?.uid ?? null,
      });
      const snap = await getDoc(doc(db, "diagnostics", ref.id));
      if (snap.exists()) {
        alert("Firestore OK: escrita e leitura realizadas.");
      } else {
        alert("Firestore leitura falhou: documento não encontrado.");
      }
    } catch (e: any) {
      const msg = e?.code ? `Firestore erro (${e.code})` : "Firestore erro";
      alert(msg);
      console.error(e);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold inline-flex items-center gap-2">
          <User size={18} /> Perfil
        </h1>
        <Link href="/" className="text-sm underline">
          Voltar
        </Link>
      </div>

      <section className="rounded-[20px] border border-zinc-200 dark:border-zinc-800 p-4">
        <div className="grid gap-2 text-sm">
          <div>
            <span className="text-zinc-500">UID:</span> {user?.uid || "—"}
          </div>
          <div>
            <span className="text-zinc-500">Anônimo:</span>{" "}
            {String(user?.isAnonymous ?? true)}
          </div>
          <div>
            <span className="text-zinc-500">Email:</span> {user?.email || "—"}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button onClick={linkGoogle}>
            <span className="inline-flex items-center gap-2">
              <LinkIcon size={16} /> Conectar com Google
            </span>
          </Button>
          <Button variant="outline" onClick={testFirestore}>
            Testar Firestore
          </Button>
          <Button variant="outline" onClick={logout}>
            <span className="inline-flex items-center gap-2">
              <LogOut size={16} /> Sair
            </span>
          </Button>
        </div>

        <p className="mt-3 text-xs text-zinc-500">
          Vincular sua conta Google converte seu usuário anônimo em um usuário persistente sem perder seus dados salvos.
        </p>
      </section>
    </div>
  );
}
