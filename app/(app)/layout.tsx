import { AppShell } from "@/app/(app)/app-shell";
import AuthGate from "@/components/AuthGate";
import AuthProvider from "@/components/AuthProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGate>
        <AppShell>{children}</AppShell>
      </AuthGate>
    </AuthProvider>
  )
}
