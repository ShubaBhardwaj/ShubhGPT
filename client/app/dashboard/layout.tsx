"use client"

import { useUser } from "@clerk/nextjs"
import { ChatProvider } from "@/components/Providers/chat-provider"
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoaded } = useUser()

  if (!isLoaded || !user) {
    return (
      <div className="flex h-dvh items-center justify-center text-sm text-muted-foreground">
        Loading dashboard…
      </div>
    )
  }

  const streamUser = {
    id: user.id,
    name: user.fullName ?? user.firstName ?? "User",
    image: user.imageUrl,
  }

  return (
    <ChatProvider user={streamUser}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="flex flex-col overflow-hidden h-dvh">
          <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-vertical:h-4 data-vertical:self-auto"
            />
            <span className="text-sm font-medium text-muted-foreground">ShubhGPT</span>
          </header>
          <div className="flex min-h-0 flex-1 flex-col h-0">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ChatProvider>
  )
}
