"use client";
import { useNotes } from "@/app/(app)/notes-context";
import { useAuth } from "@/components/AuthProvider";
import Editor from "@/components/Editor";
import Link from "next/link";
import { useParams } from "next/navigation";
import React from "react";

export default function NotePage() {
  const { getNote } = useNotes();
  const { user } = useAuth();
  const [checked, setChecked] = React.useState(false);
  const [allowed, setAllowed] = React.useState(false);
  const params = useParams() as any;
  const id = params?.noteId as string | undefined;

  React.useEffect(() => {
    let active = true;
    (async () => {
      if (!id) {
        if (active) {
          setAllowed(false);
          setChecked(true);
        }
        return;
      }
      const n = await getNote(id);
      if (active) {
        setAllowed(!!n);
        setChecked(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [id, user?.uid, getNote]);

  if (!checked) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="text-sm text-zinc-500">Verificando acesso...</span>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center text-sm text-zinc-600">
          <div>Você não possui acesso a este documento.</div>
          <Link href="/" className="mt-2 inline-block underline">
            Voltar
          </Link>
        </div>
      </div>
    );
  }

  return <Editor noteId={id!} />;
}
