"use client"

import { ReactNode, useCallback } from "react"
import { useAuth } from "@clerk/nextjs"
import { useTheme } from "next-themes"
import { User } from "stream-chat"
import { Chat, useCreateChatClient } from "stream-chat-react"

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY as string
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL as string

if (!apiKey) throw new Error("Missing NEXT_PUBLIC_STREAM_API_KEY")

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

    // your controller returns { success, streamToken }
    const { streamToken } = await res.json()
    return streamToken as string
  }, [getToken])

  const client = useCreateChatClient({
    apiKey,
    tokenOrProvider: tokenProvider,
    userData: user,
  })

  if (!client) return null // swap in a loading screen if you want one

  return (
    <Chat
      client={client}
      theme={resolvedTheme === "dark" ? "str-chat__theme-dark" : "str-chat__theme-light"}
    >
      {children}
    </Chat>
  )
}