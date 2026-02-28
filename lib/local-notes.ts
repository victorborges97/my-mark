export type LocalNote = {
    id: string
    ownerId: string
    title: string
    content: string
    updatedAt?: any
    createdAt?: any
}

const KEY = "notes"

import { db } from "@/lib/firebase"
import { collection, doc } from "firebase/firestore"

function read(): LocalNote[] {
    try {
        const raw = localStorage.getItem(KEY)
        if (!raw) return []
        const arr = JSON.parse(raw)
        if (Array.isArray(arr)) return arr
        return []
    } catch {
        return []
    }
}

function write(notes: LocalNote[]) {
    localStorage.setItem(KEY, JSON.stringify(notes))
}

function genFirestoreId() {
    const ref = doc(collection(db, "notes"))
    return ref.id
}

export function listLocalNotes(ownerId: string): LocalNote[] {
    const fixed = read().map((n) => {
        if (!("ownerId" in n) || !n.ownerId) {
            return { ...n, ownerId }
        }
        return n
    })
    write(fixed)
    return fixed
        .filter((n) => n.ownerId === ownerId)
        .sort((a, b) => {
            const ta = a.updatedAt ? Number(a.updatedAt) : 0
            const tb = b.updatedAt ? Number(b.updatedAt) : 0
            return tb - ta
        })
}

export function getLocalNote(id: string): LocalNote | null {
    return read().find((n) => n.id === id) || null
}

export function createLocalNote(ownerId: string, title = "Novo documento"): string {
    const now = Date.now()
    const note: LocalNote = { id: genFirestoreId(), ownerId, title, content: "", createdAt: now, updatedAt: now }
    const notes = read()
    notes.unshift(note)
    write(notes)
    return note.id
}

export function updateLocalNote(id: string, data: Partial<Pick<LocalNote, "title" | "content">>) {
    const notes = read()
    const idx = notes.findIndex((n) => n.id === id)
    if (idx >= 0) {
        notes[idx] = { ...notes[idx], ...data, updatedAt: Date.now() }
        write(notes)
    }
}

export function deleteLocalNote(id: string) {
    const notes = read().filter((n) => n.id !== id)
    write(notes)
}

export function linkLocalOwner(oldOwnerId: string, newOwnerId: string) {
    const notes = read().map((n) => {
        if ((n as any).ownerId === oldOwnerId || !("ownerId" in n)) {
            return { ...n, ownerId: newOwnerId }
        }
        return n
    })
    write(notes)
}
