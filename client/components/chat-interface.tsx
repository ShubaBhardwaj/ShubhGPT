
"use client"

import * as React from "react"
import { useUser } from "@clerk/nextjs"
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
      {/* AI avatar */}
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

        {/* Ghost-style for AI, default for user — matches shadcn demo */}
        <Bubble
          variant={isUser ? "default" : "ghost"}
          align={isUser ? "end" : "start"}
        >
          <BubbleContent>{msg.content}</BubbleContent>
        </Bubble>

        {/* Action row for AI replies */}
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
              {copied && (
                <span className="ml-1 text-xs text-muted-foreground">Copied!</span>
              )}
            </div>
          </MessageFooter>
        )}
      </MessageContent>

      {/* User avatar */}
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

// ─── Main Chat Interface ──────────────────────────────────────────────────────

export function ChatInterface() {
  const { user } = useUser()
  const userName = user?.fullName ?? user?.firstName ?? "User"
  const userAvatar = user?.imageUrl ?? ""

  const [messages, setMessages] = React.useState<ChatMessage[]>([])
  const [input, setInput] = React.useState("")
  const [isStreaming, setIsStreaming] = React.useState(false)

  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea height
  React.useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = Math.min(el.scrollHeight, 160) + "px"
  }, [input])

  const sendMessage = () => {
    const trimmed = input.trim()
    if (!trimmed || isStreaming) return

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setIsStreaming(true)

    // ── Simulated streaming response — replace with real API ──
    const words = [
      "Sure!", "Here's", "what", "I", "think:", "This", "is", "a",
      "placeholder", "response", "from", "ShubhGPT.", "Connect", "your",
      "backend", "to", "stream", "real", "answers", "here.",
    ]

    const aiId = crypto.randomUUID()
    const aiMsg: ChatMessage = {
      id: aiId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, aiMsg])
    let i = 0

    const interval = setInterval(() => {
      if (i >= words.length) {
        clearInterval(interval)
        setIsStreaming(false)
        return
      }
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiId
            ? { ...m, content: m.content + (i === 0 ? "" : " ") + words[i] }
            : m
        )
      )
      i++
    }, 70)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">

      {/* ── Scrollable messages — constrained so it never pushes the input off screen ── */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <MessageScrollerProvider>
          <MessageScroller className="h-full">
            <MessageScrollerViewport className="px-4 py-6 md:px-8">
              <MessageScrollerContent className="mx-auto max-w-3xl">
                {messages.length === 0 ? (
                  <MessageScrollerItem>
                    <EmptyState name={userName} />
                  </MessageScrollerItem>
                ) : (
                  messages.map((msg, i) => (
                    <MessageScrollerItem
                      key={msg.id}
                      scrollAnchor={i === messages.length - 1}
                    >
                      <ChatMessageRow
                        msg={msg}
                        userAvatar={userAvatar}
                        userName={userName}
                      />
                    </MessageScrollerItem>
                  ))
                )}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton />
          </MessageScroller>
        </MessageScrollerProvider>
      </div>

      {/* ── Input bar — shrink-0 so it's always visible ── */}
      <div className="shrink-0 px-4 pb-4 pt-2 md:px-8">
        <div className="mx-auto max-w-3xl">
          <InputGroup className="rounded-2xl border border-border bg-background shadow-sm transition-shadow focus-within:shadow-md">
            {/* "+" attachment / command button */}
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

            {/* Textarea */}
            <InputGroupTextarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask ShubhGPT anything… (Shift+Enter for new line)"
              rows={1}
              className="min-h-[40px] max-h-[160px] py-2.5 text-sm"
              style={{ resize: "none" }}
            />

            {/* Send button */}
            <InputGroupAddon align="inline-end">
              <Button
                size="icon-sm"
                disabled={!input.trim() || isStreaming}
                onClick={sendMessage}
                className="rounded-xl"
                title="Send"
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
    </div>
  )
}
