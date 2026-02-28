import { db } from "@/lib/firebase"
import { addAllowedUser } from "@/lib/notes"
import { collection, doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore"

export type Invite = {
  id: string
  noteId: string
  toEmail: string
  ownerId: string
  status?: "pending" | "accepted"
  acceptedBy?: string
  createdAt?: any
}

export async function createInvite(noteId: string, toEmail: string, ownerId: string) {
  const ref = doc(collection(db, "invites"))
  await setDoc(ref, { noteId, toEmail, ownerId, status: "pending", createdAt: serverTimestamp() }, { merge: true })
  return ref.id
}

export async function getInvite(inviteId: string): Promise<Invite | null> {
  const ref = doc(db, "invites", inviteId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  const data = snap.data() as any
  return {
    id: snap.id,
    noteId: data.noteId || "",
    toEmail: data.toEmail || "",
    ownerId: data.ownerId || "",
    status: data.status || "pending",
    acceptedBy: data.acceptedBy || "",
    createdAt: data.createdAt
  }
}

export async function acceptInvite(inviteId: string, uid: string) {
  const ref = doc(db, "invites", inviteId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const data = snap.data() as any
  const noteId = data.noteId as string
  await addAllowedUser(noteId, uid)
  await updateDoc(ref, { status: "accepted", acceptedBy: uid })
}
