import { dbAdmin } from "@/lib/firebase-admin"

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
}

export async function getPublishServer(publishId: string): Promise<{ noteId: string; ownerId: string } | null> {
  console.log('getPublishServe : ', publishId)
  const snap = await dbAdmin.collection("publishes").doc(publishId).get()
  if (!snap.exists) return null
  const data = snap.data() as any
  return { noteId: data.noteId || "", ownerId: data.ownerId || "" }
}
