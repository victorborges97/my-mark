import { db } from "@/lib/firebase"
import { addAllowedUser, removeAllowedUser } from "@/lib/notes"
import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore"

export type Invite = {
  id: string
  noteId: string
  toEmail: string
  ownerId: string
  status?: "pending" | "accepted" | "revoked"
  acceptedBy?: string
  createdAt?: any
}

export async function createInvite(noteId: string, toEmail: string, ownerId: string) {
  const ref = doc(collection(db, "invites"))
  const email = (toEmail || "").trim().toLowerCase()
  await setDoc(ref, { noteId, toEmail: email, ownerId, status: "pending", createdAt: serverTimestamp() }, { merge: true })
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
  console.log("update note ", noteId, " to accepted ", uid)
  await addAllowedUser(noteId, uid)
  console.log("update invite ", inviteId, " to accepted ", uid)
  console.log({ status: "accepted", acceptedBy: uid })
  await updateDoc(ref, { status: "accepted", acceptedBy: uid })
}

export async function listInvitesForNote(noteId: string, ownerId: string): Promise<Invite[]> {
  const q = query(collection(db, "invites"), where("noteId", "==", noteId), where("ownerId", "==", ownerId))
  const snap = await getDocs(q)
  const list = snap.docs.map((d) => {
    const data = d.data() as any
    return {
      id: d.id,
      noteId: data.noteId || "",
      toEmail: data.toEmail || "",
      ownerId: data.ownerId || "",
      status: data.status || "pending",
      acceptedBy: data.acceptedBy || "",
      createdAt: data.createdAt
    }
  })
  // Ordena no cliente para evitar necessidade de índice composto
  return list.sort((a, b) => {
    const ta = (a.createdAt?.seconds ?? 0) * 1000 + (a.createdAt?.nanoseconds ?? 0) / 1e6
    const tb = (b.createdAt?.seconds ?? 0) * 1000 + (b.createdAt?.nanoseconds ?? 0) / 1e6
    return tb - ta
  })
}

export async function reInvite(inviteId: string, ownerId: string): Promise<string | null> {
  const ref = doc(db, "invites", inviteId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  const data = snap.data() as any
  const noteId = data.noteId as string
  const toEmail = data.toEmail as string
  const id = await createInvite(noteId, toEmail, ownerId)
  return id
}

export async function revokeInvite(inviteId: string) {
  const ref = doc(db, "invites", inviteId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const data = snap.data() as any
  const noteId = data.noteId as string
  const uid = data.acceptedBy as string | undefined
  if (uid) {
    await removeAllowedUser(noteId, uid)
  }
  await updateDoc(ref, { status: "revoked" })
}
