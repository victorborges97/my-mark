import { db } from "@/lib/firebase";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    where
} from "firebase/firestore";

export type Note = {
    id: string;
    ownerId: string;
    title: string;
    content: string;
    public?: boolean;
    publishId?: string;
    allowedUsers?: string[];
    updatedAt?: any;
    createdAt?: any;
};

export const notesCol = collection(db, "notes");

export async function createNote(ownerId: string, title?: string, content?: string, id?: string) {
    try {
        if (id) {
            const ref = doc(notesCol, id);
            await setDoc(ref, {
                ownerId,
                title: title ?? "Novo Markdown",
                content: content ?? "",
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            }, { merge: true });
            return id;
        } else {
            const ref = await addDoc(notesCol, {
                ownerId,
                title: title ?? "Novo Markdown",
                content: content ?? "",
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            return ref.id;
        }
    } catch (e) {
        console.error("Falha ao criar nota no Firestore", e);
        throw e;
    }
}

export async function getNote(id: string): Promise<Note | null> {
    const ref = doc(db, "notes", id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = snap.data() as any;
    return {
        id: snap.id,
        ownerId: data.ownerId || "",
        title: data.title || "",
        content: data.content || "",
        public: data.public === true,
        publishId: data.publishId || "",
        allowedUsers: Array.isArray(data.allowedUsers) ? data.allowedUsers : [],
        updatedAt: data.updatedAt,
        createdAt: data.createdAt,
    };
}

export function subscribeNotes(ownerId: string, cb: (notes: Note[]) => void) {
    const q = query(notesCol, where("ownerId", "==", ownerId), orderBy("updatedAt", "desc"));
    return onSnapshot(q, (snap) => {
        const list: Note[] = snap.docs.map((d) => ({
            id: d.id,
            ownerId: (d.data() as any).ownerId || "",
            title: (d.data() as any).title || "",
            content: (d.data() as any).content || "",
            public: (d.data() as any).public === true,
            publishId: (d.data() as any).publishId || "",
            allowedUsers: Array.isArray((d.data() as any).allowedUsers) ? (d.data() as any).allowedUsers : [],
            updatedAt: (d.data() as any).updatedAt,
            createdAt: (d.data() as any).createdAt,
        }));
        cb(list);
    });
}

export async function updateNote(id: string, data: Partial<Pick<Note, "title" | "content" | "ownerId">>) {
    const ref = doc(db, "notes", id);
    // Usa setDoc com merge para criar o documento se não existir
    const { setDoc } = await import("firebase/firestore");
    await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

export function subscribeNote(id: string, cb: (note: Note | null) => void) {
    const ref = doc(db, "notes", id);
    return onSnapshot(ref, (snap) => {
        if (!snap.exists()) {
            cb(null);
            return;
        }
        const data = snap.data() as any;
        cb({
            id: snap.id,
            ownerId: data.ownerId || "",
            title: data.title || "",
            content: data.content || "",
            public: data.public === true,
            publishId: data.publishId || "",
            allowedUsers: Array.isArray(data.allowedUsers) ? data.allowedUsers : [],
            updatedAt: data.updatedAt,
            createdAt: data.createdAt,
        });
    });
}

export async function deleteNote(id: string) {
    const ref = doc(db, "notes", id);
    await deleteDoc(ref);
}

export async function addAllowedUser(noteId: string, uid: string) {
    const { setDoc, arrayUnion } = await import("firebase/firestore");
    const ref = doc(db, "notes", noteId);
    await setDoc(ref, { allowedUsers: arrayUnion(uid), updatedAt: serverTimestamp() }, { merge: true });
}

export async function removeAllowedUser(noteId: string, uid: string) {
    const { setDoc, arrayRemove } = await import("firebase/firestore");
    const ref = doc(db, "notes", noteId);
    await setDoc(ref, { allowedUsers: arrayRemove(uid), updatedAt: serverTimestamp() }, { merge: true });
}

export async function createPublish(noteId: string, ownerId: string) {
    const { setDoc } = await import("firebase/firestore");
    const pubRef = doc(collection(db, "publishes"));
    await setDoc(pubRef, { noteId, ownerId, createdAt: serverTimestamp() });
    const noteRef = doc(db, "notes", noteId);
    await setDoc(noteRef, { public: true, publishId: pubRef.id, updatedAt: serverTimestamp() }, { merge: true });
    return pubRef.id;
}

export async function getPublish(publishId: string): Promise<{ noteId: string; ownerId: string } | null> {
    const ref = doc(db, "publishes", publishId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = snap.data() as any;
    return { noteId: data.noteId || "", ownerId: data.ownerId || "" };
}

export async function removePublish(noteId: string) {
    const ref = doc(db, "notes", noteId);
    await setDoc(ref, { public: false, publishId: null, updatedAt: serverTimestamp() }, { merge: true });
}
