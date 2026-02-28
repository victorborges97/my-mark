import { getNoteServer, getPublishServer } from "@/lib/notes-server";
import type { Metadata } from "next";
import Link from "next/link";
export const runtime = "nodejs";

export async function generateMetadata({ params }: any): Promise<Metadata> {
  const getParams = await params;
  const publishId = getParams?.publishId;
  const pub = await getPublishServer(publishId);
  if (!pub) {
    return { title: "Publicação não encontrada" };
  }
  const note = await getNoteServer(pub.noteId);
  if (!note || !note.public) {
    return { title: "Publicação indisponível" };
  }
  const title = note.title || "Nota pública";
  const raw = (note.content || "").replace(/\s+/g, " ").trim();
  const description = raw.slice(0, 160);
  const url = `/public/${publishId}`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: "article"
    },
    twitter: {
      card: "summary",
      title,
      description
    }
  };
}

async function PublicNotePage({ params }: any) {
  const getParams = await params;
  const publishId = getParams?.publishId;
  const pub = await getPublishServer(publishId);
  if (!pub) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center text-sm text-zinc-600">
          <div>Publicação inválida ou não disponível.</div>
          <Link href="/" className="mt-2 inline-block underline">Voltar</Link>
        </div>
      </div>
    );
  }
  const note = await getNoteServer(pub.noteId);
  if (!note || !note.public) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center text-sm text-zinc-600">
          <div>Publicação inválida ou não disponível.</div>
          <Link href="/" className="mt-2 inline-block underline">Voltar</Link>
        </div>
      </div>
    );
  }
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">{note.title || ""}</h1>
        <pre className="whitespace-pre-wrap font-mono text-sm">{note.content || ""}</pre>
      </div>
    </div>
  );
}

export default PublicNotePage;