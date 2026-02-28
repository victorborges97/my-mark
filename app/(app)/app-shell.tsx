"use client";

import { AppProvider } from "@/app/(app)/app-context";
import { NotesProvider } from "@/app/(app)/notes-context";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppProvider>
        <NotesProvider>
          <div className="flex h-screen w-screen box-border p-[6px] gap-[6px] overflow-hidden bg-sidebar text-sidebar-foreground">
            <AppSidebar />
            <div className="flex flex-1 min-h-0 flex-col bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-[20px] overflow-hidden">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 p-3 md:hidden">
                <SidebarTrigger />
                <div className="text-sm text-zinc-500">Docszin</div>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
            </div>
          </div>
        </NotesProvider>
      </AppProvider>
    </SidebarProvider>
  );
}
