"use client"

import { use } from "react"
import { ExistingChat } from "@/components/chat-interface"

export default function ChatChannelPage({ params }: { params: Promise<{ channelId: string }> }) {
  const { channelId } = use(params)
  return <ExistingChat channelId={channelId} />
}