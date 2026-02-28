"use client";
import { auth } from "@/lib/firebase";
import { linkLocalOwner } from "@/lib/local-notes";
import { User, getRedirectResult, onAuthStateChanged, signOut } from "firebase/auth";
import { ReactNode, createContext, useContext, useEffect, useState } from "react";

type AuthContextValue = {
    user: User | null;
    loading: boolean;
    logout: () => Promise<void>;
    setUser: (u: User | null) => void;
};

const AuthContext = createContext<AuthContextValue>({
    user: null,
    loading: true,
    logout: async () => { },
    setUser: (u: User | null) => { },
});

export function useAuth() {
    return useContext(AuthContext);
}

export default function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsub: null | (() => void) = null;
        (async () => {
            try {
                const hasInit = typeof window !== "undefined" && !!localStorage.getItem("initRedirect");
                const res = hasInit ? await getRedirectResult(auth) : null;
                console.log({
                    hasInit: hasInit,
                    isAnonymous: res?.user?.isAnonymous,
                    email: res?.user?.email,
                })
                if (res?.user) {
                    setUser(res.user);
                    changeUser(res.user);
                }
            } finally {
                localStorage.removeItem("initRedirect");
            }

            unsub = onAuthStateChanged(auth, async (u) => {
                console.log({
                    hasInit: typeof window !== "undefined" && !!localStorage.getItem("initRedirect"),
                    isAnonymous: u?.isAnonymous,
                    email: u?.email,
                })

                if (!u) {
                    setLoading(false);
                    return;
                }

                setUser(u);
                changeUser(u);
                setLoading(false);
            });
        })();
        return () => {
            if (unsub) unsub();
        };
    }, []);

    const changeUser = (u: User) => {
        try {
            if (u.isAnonymous) {
                const prev = JSON.parse(localStorage.getItem("anonUser") || "{}");
                if (prev?.uid && prev.uid !== u.uid) {
                    linkLocalOwner(prev.uid, u.uid);
                }
                localStorage.setItem("anonUser", JSON.stringify({ uid: u.uid, lastSeen: Date.now() }));
            } else {
                localStorage.removeItem("anonUser")
                localStorage.setItem("lastAuthProvider", (u.providerData?.[0]?.providerId ?? "unknown"));
            }
        } catch { }
    }

    const logout = async () => {
        await signOut(auth);
        if (user && !user.isAnonymous) {
            localStorage.removeItem("anonUser")
            localStorage.removeItem("lastAuthProvider");
            localStorage.removeItem("notes");
        }
        setUser(null);
        setLoading(true);
    };

    return (
        <AuthContext.Provider value={{ user, loading, logout, setUser }}>
            {children}
        </AuthContext.Provider>
    );
}
