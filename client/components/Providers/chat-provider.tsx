"use client"

import { ReactNode, useCallback } from "react"
import { useAuth } from "@clerk/nextjs"
import { useTheme } from "next-themes"
import { User } from "stream-chat"
import { Chat, useCreateChatClient } from "stream-chat-react"
import { backendUrl, streamApiKey } from "@/lib/env"
import { Loader2 } from "lucide-react"

interface ChatProviderProps {
  user: User
  children: ReactNode
}

export function ChatProvider({ user, children }: ChatProviderProps) {
  const { getToken } = useAuth()
  const { resolvedTheme } = useTheme()

  // Called by stream-chat-react on connect and on token refresh.
  const tokenProvider = useCallback(async () => {
    const clerkToken = await getToken()

    const res = await fetch(`${backendUrl}/stream/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${clerkToken}`,
      },
    })

    if (!res.ok) throw new Error(`Failed to fetch Stream token: ${await res.text()}`)

    const { streamToken } = await res.json()
    return streamToken as string
  }, [getToken])

  const client = useCreateChatClient({
    apiKey: streamApiKey,
    tokenOrProvider: tokenProvider,
    userData: user,
  })

  if (!client) {
    return (
      <div className="flex h-dvh w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="size-6 animate-spin text-primary" />
          <p className="text-sm font-medium">Connecting to Stream Chat…</p>
        </div>
      </div>
    )
  }

  return (
    <Chat
      client={client}
      theme={resolvedTheme === "dark" ? "str-chat__theme-dark" : "str-chat__theme-light"}
    >
      {children}
    </Chat>
  )
}