"use client"

import * as React from "react"
import { useUser, useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { v4 as uuidv4 } from "uuid"
import type { Channel as StreamChannel } from "stream-chat"
import {
  Channel,
  useChatContext,
  useChannelStateContext,
  useAIState,
} from "stream-chat-react"
import { backendUrl } from "@/lib/env"
import {
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
  MessageScrollerProvider,
} from "@/components/ui/message-scroller"
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageHeader,
  MessageFooter,
} from "@/components/ui/message"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import { Button } from "@/components/ui/button"
import {
  BotMessageSquareIcon,
  PlusIcon,
  ArrowUpIcon,
  RotateCcwIcon,
  CopyIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// ─── Types ───────────────────────────────────────────────────────────────────

type Role = "user" | "assistant"

interface ChatMessage {
  id: string
  role: Role
  content: string
  timestamp: Date
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function greetingByTime() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 17) return "Good afternoon"
  return "Good evening"
}

// ─── Welcome / Empty state ───────────────────────────────────────────────────

function EmptyState({ name }: { name: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <BotMessageSquareIcon className="size-6" />
      </div>
      <div>
        <p className="text-lg font-semibold">
          {greetingByTime()}, {name.split(" ")[0]}!
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          What are we working on today? Press send to start a new conversation.
        </p>
      </div>
    </div>
  )
}

// ─── Single message row ───────────────────────────────────────────────────────

function ChatMessageRow({
  msg,
  userAvatar,
  userName,
}: {
  msg: ChatMessage
  userAvatar: string
  userName: string
}) {
  const isUser = msg.role === "user"
  const [copied, setCopied] = React.useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Message align={isUser ? "end" : "start"} className="items-end">
      {!isUser && (
        <MessageAvatar>
          <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
            AI
          </div>
        </MessageAvatar>
      )}

      <MessageContent>
        <MessageHeader>
          {isUser ? userName : "ShubhGPT"} · {formatTime(msg.timestamp)}
        </MessageHeader>

        <Bubble variant={isUser ? "default" : "ghost"} align={isUser ? "end" : "start"}>
          <BubbleContent>{msg.content}</BubbleContent>
        </Bubble>

        {!isUser && (
          <MessageFooter>
            <div className="flex items-center gap-0.5">
              <button
                onClick={handleCopy}
                title={copied ? "Copied!" : "Copy"}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <CopyIcon className="size-3.5" />
              </button>
              <button
                title="Good response"
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <ThumbsUpIcon className="size-3.5" />
              </button>
              <button
                title="Bad response"
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <ThumbsDownIcon className="size-3.5" />
              </button>
              <button
                title="Regenerate"
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <RotateCcwIcon className="size-3.5" />
              </button>
              {copied && <span className="ml-1 text-xs text-muted-foreground">Copied!</span>}
            </div>
          </MessageFooter>
        )}
      </MessageContent>

      {isUser && (
        <MessageAvatar>
          <Avatar className="size-8">
            <AvatarImage src={userAvatar} alt={userName} />
            <AvatarFallback className="text-xs">{getInitials(userName)}</AvatarFallback>
          </Avatar>
        </MessageAvatar>
      )}
    </Message>
  )
}

// ─── Shared input bar ──────────────────────────────────────────────────────

function ChatComposer({
  value,
  onChange,
  onSend,
  onStop,
  disabled,
  isStreaming,
}: {
  value: string
  onChange: (v: string) => void
  onSend: () => void
  onStop?: () => void
  disabled: boolean
  isStreaming: boolean
}) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  React.useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = Math.min(el.scrollHeight, 160) + "px"
  }, [value])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      isStreaming ? onStop?.() : onSend()
    }
  }

  return (
    <div className="shrink-0 px-4 pb-4 pt-2 md:px-8">
      <div className="mx-auto max-w-3xl">
        <InputGroup className="rounded-2xl border border-border bg-background shadow-sm transition-shadow focus-within:shadow-md">
          <InputGroupAddon align="inline-start">
            <InputGroupButton
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-foreground"
              title="Attach file"
            >
              <PlusIcon className="size-4" />
            </InputGroupButton>
          </InputGroupAddon>

          <InputGroupTextarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask ShubhGPT anything… (Shift+Enter for new line)"
            rows={1}
            className="min-h-[40px] max-h-[160px] py-2.5 text-sm"
            style={{ resize: "none" }}
          />

          <InputGroupAddon align="inline-end">
            <Button
              size="icon-sm"
              disabled={disabled}
              onClick={isStreaming ? onStop : onSend}
              className="rounded-xl"
              title={isStreaming ? "Stop" : "Send"}
            >
              <ArrowUpIcon className="size-4" />
            </Button>
          </InputGroupAddon>
        </InputGroup>

        <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
          ShubhGPT can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  )
}

// ─── Active chat: messages + composer for a live, watched channel ──────────

function ActiveChat({ userName, userAvatar }: { userName: string; userAvatar: string }) {
  const { channel, messages: rawMessages } = useChannelStateContext()
  const messages = rawMessages ?? []
  const { aiState } = useAIState(channel)
  const [input, setInput] = React.useState("")

  const isStreaming =
    aiState === "AI_STATE_THINKING" ||
    aiState === "AI_STATE_GENERATING" ||
    aiState === "AI_STATE_EXTERNAL_SOURCES"

  const chatMessages: ChatMessage[] = messages.map((m) => ({
    id: m.id,
    role: m.user?.id?.startsWith("ai-bot-") ? "assistant" : "user",
    content: m.text ?? "",
    timestamp: new Date(m.created_at ?? Date.now()),
  }))

  const send = async () => {
    const trimmed = input.trim()
    if (!trimmed || isStreaming) return
    setInput("")
    await channel.sendMessage({ text: trimmed })
  }

  const stop = () => {
    const aiMessage = [...(messages ?? [])].reverse().find((m) => m.user?.id?.startsWith("ai-bot-"))
    if (aiMessage) {
      channel.sendEvent({
        type: "ai_indicator.stop",
        cid: channel.cid,
        message_id: aiMessage.id,
      } as any)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 min-h-0 overflow-hidden">
        <MessageScrollerProvider>
          <MessageScroller className="h-full">
            <MessageScrollerViewport className="px-4 py-6 md:px-8">
              <MessageScrollerContent className="mx-auto max-w-3xl">
                {chatMessages.map((msg, i) => (
                  <MessageScrollerItem key={msg.id} scrollAnchor={i === chatMessages.length - 1}>
                    <ChatMessageRow msg={msg} userAvatar={userAvatar} userName={userName} />
                  </MessageScrollerItem>
                ))}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton />
          </MessageScroller>
        </MessageScrollerProvider>
      </div>

      <ChatComposer
        value={input}
        onChange={setInput}
        onSend={send}
        onStop={stop}
        disabled={!isStreaming && !input.trim()}
        isStreaming={isStreaming}
      />
    </div>
  )
}

// ─── New chat: no channel yet — creates one, then navigates to it ──────────

export function NewChatView() {
  const router = useRouter()
  const { user } = useUser()
  const userName = user?.fullName ?? user?.firstName ?? "User"
  const { client } = useChatContext()

  const [input, setInput] = React.useState("")
  const [starting, setStarting] = React.useState(false)

  const startNewChat = async () => {
    const trimmed = input.trim()
    if (!trimmed || !user || !client || starting) return
    setStarting(true)

    try {
      const newChannel = client.channel("messaging", uuidv4(), {
        name: trimmed.substring(0, 50),
        members: [user.id],
      } as any)
      await newChannel.watch()

      const memberAdded = new Promise<void>((resolve) => {
        const sub = newChannel.on("member.added", (event) => {
          if (event.member?.user?.id && event.member.user.id !== user.id) {
            sub.unsubscribe()
            resolve()
          }
        })
      })

      const res = await fetch(`${backendUrl}/start-ai-agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel_id: newChannel.id, channel_type: "messaging" }),
      })
      if (!res.ok) throw new Error("AI agent failed to join the chat.")

      await memberAdded
      await newChannel.sendMessage({ text: trimmed })

      router.push(`/dashboard/${newChannel.id}`)
    } catch (err) {
      console.error("Error creating new chat:", err)
      setStarting(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 min-h-0 overflow-hidden flex">
        <EmptyState name={userName} />
      </div>
      <ChatComposer
        value={input}
        onChange={setInput}
        onSend={startNewChat}
        disabled={!input.trim() || starting}
        isStreaming={false}
      />
    </div>
  )
}

// ─── Existing chat: load a channel by ID from the URL, then render it ──────

export function ExistingChat({ channelId }: { channelId: string }) {
  const { client } = useChatContext()
  const { user } = useUser()
  const userName = user?.fullName ?? user?.firstName ?? "User"
  const userAvatar = user?.imageUrl ?? ""
  const [channel, setChannel] = React.useState<StreamChannel | null>(null)

  React.useEffect(() => {
    if (!client) return
    let cancelled = false
    const ch = client.channel("messaging", channelId)
    ch.watch().then(() => {
      if (!cancelled) setChannel(ch)
    })
    return () => {
      cancelled = true
    }
  }, [client, channelId])

  if (!channel) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading chat…
      </div>
    )
  }

  return (
    <Channel channel={channel}>
      <ActiveChat userName={userName} userAvatar={userAvatar} />
    </Channel>
  )
}