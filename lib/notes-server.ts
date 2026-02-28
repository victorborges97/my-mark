import { dbAdmin } from "@/lib/firebase-admin"
async function fetchDoc(collection: string, docId: string) {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID as string
  const key = process.env.NEXT_PUBLIC_FIREBASE_API_KEY as string
  if (!projectId || !key) return null
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${docId}?key=${key}`
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) return null
  const json = await res.json()
  return json
}
function readString(fields: any, name: string) {
  return fields?.[name]?.stringValue || ""
}
function readBool(fields: any, name: string) {
  return fields?.[name]?.booleanValue === true
}
function readArray(fields: any, name: string) {
  const v = fields?.[name]?.arrayValue?.values
  return Array.isArray(v) ? v.map((x: any) => x?.stringValue || "").filter(Boolean) : []
}

export type ServerNote = {
  id: string
  ownerId: string
  title: string
  content: string
  public?: boolean
  publishId?: string
  allowedUsers?: string[]
}

export async function getNoteServer(id: string): Promise<ServerNote | null> {
  if (dbAdmin) {
    try {
      const snap = await dbAdmin.collection("notes").doc(id).get()
      if (!snap.exists) return null
      const data = snap.data() as any
      return {
        id: snap.id,
        ownerId: data.ownerId || "",
        title: data.title || "",
        content: data.content || "",
        public: data.public === true,
        publishId: data.publishId || "",
        allowedUsers: Array.isArray(data.allowedUsers) ? data.allowedUsers : []
      }
    } catch {}
  }
  const doc = await fetchDoc("notes", id)
  if (!doc?.fields) return null
  const f = doc.fields
  return {
    id,
    ownerId: readString(f, "ownerId"),
    title: readString(f, "title"),
    content: readString(f, "content"),
    public: readBool(f, "public"),
    publishId: readString(f, "publishId"),
    allowedUsers: readArray(f, "allowedUsers")
  }
}

export async function getPublishServer(publishId: string): Promise<{ noteId: string; ownerId: string } | null> {
  if (dbAdmin) {
    try {
      const snap = await dbAdmin.collection("publishes").doc(publishId).get()
      if (!snap.exists) return null
      const data = snap.data() as any
      return { noteId: data.noteId || "", ownerId: data.ownerId || "" }
    } catch {}
  }
  const doc = await fetchDoc("publishes", publishId)
  if (!doc?.fields) return null
  const f = doc.fields
  return { noteId: readString(f, "noteId"), ownerId: readString(f, "ownerId") }
}
