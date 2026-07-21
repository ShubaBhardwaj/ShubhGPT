"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useChatContext } from "stream-chat-react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { backendUrl } from "@/lib/env";

import * as React from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  ChevronDownIcon,
  PlusIcon,
  MessageSquareIcon,
  MoreHorizontalIcon,
  ShareIcon,
  PinIcon,
  Trash2Icon,
} from "lucide-react";

export type RecentChat = {
  id: string;
  title: string;
  pinned: boolean;
};

export function NavRecentChats() {
  const { isMobile } = useSidebar();
  const { client } = useChatContext();
  const { getToken } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = React.useState(true);
  const [chats, setChats] = React.useState<RecentChat[]>([]);

  const loadChats = React.useCallback(async () => {
    if (!client?.userID) return;
    const channels = await client.queryChannels(
      { type: "messaging", members: { $in: [client.userID] } },
      { last_message_at: -1 },
      { limit: 25 },
    );
    setChats(
      channels.map((c) => ({
        id: c.id as string,
        title: ((c.data as any)?.name as string) || "New chat",
        pinned: Boolean((c.data as any)?.pinned),
      })),
    );
  }, [client]);

  // Refetch whenever the route changes — covers landing back on /dashboard
  // after creating a chat, and switching between chats.
  React.useEffect(() => {
    loadChats();
  }, [loadChats, pathname]);

  const handleTogglePin = async (chatId: string, nextPinned: boolean) => {
    if (!client) return;
    try {
      const channel = client.channel("messaging", chatId);
      await channel.updatePartial({ set: { pinned: nextPinned } as any });
      setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, pinned: nextPinned } : c)));
    } catch (err) {
      console.error("Failed to update pin state:", err);
      toast.error("Couldn't update pin — check channel permissions in Stream dashboard");
    }
  };

  const handleShare = (chatId: string) => {
    const url = `${window.location.origin}/dashboard/${chatId}`;
    navigator.clipboard.writeText(url);
    toast.success("Chat link copied to clipboard");
  };

  const handleDelete = async (chatId: string) => {
    if (!window.confirm("Delete this chat? This can't be undone.")) return;

    try {
      const token = await getToken();

      // Stop the AI agent first so it isn't left listening to a dead channel.
      await fetch(`${backendUrl}/stop-ai-agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel_id: chatId }),
      }).catch(() => {}); // best-effort — don't block deletion if this fails

      const res = await fetch(`${backendUrl}/stream/channel/${chatId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());

      setChats((prev) => prev.filter((c) => c.id !== chatId));
      toast.success("Chat deleted");

      if (pathname === `/dashboard/${chatId}`) {
        router.push("/dashboard");
      }
    } catch (err) {
      console.error("Failed to delete chat:", err);
      toast.error("Couldn't delete chat");
    }
  };

  const sorted = [...chats].sort((a, b) => Number(b.pinned) - Number(a.pinned));

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden p-0">
      {/* ── New Chat button — always visible, above the collapsible ── */}
      <div className="px-2 pb-1">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex w-full cursor-pointer items-center gap-2 rounded-md border border-dashed border-sidebar-border px-3 py-1.5 text-sm text-muted-foreground hover:border-sidebar-ring hover:bg-sidebar-accent hover:text-foreground transition-colors"
        >
          <PlusIcon className="size-3.5 shrink-0" />
          New Chat
        </button>
      </div>

      <Collapsible open={open} onOpenChange={setOpen}>
        {/* ── Section header ── */}
        <div className="flex items-center justify-between px-2 py-1">
          <SidebarGroupLabel className="m-0 p-0">Recent Chats</SidebarGroupLabel>
          <CollapsibleTrigger
            render={
              <button
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Toggle recent chats"
              />
            }
          >
            <ChevronDownIcon
              className={`size-3.5 transition-transform duration-200 ${open ? "" : "-rotate-90"}`}
            />
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent>
          <div className="max-h-52 overflow-y-auto px-2 pb-2">
            <SidebarMenu>
              {sorted.map((chat) => (
                <SidebarMenuItem key={chat.id}>
                  <SidebarMenuButton
                    render={<Link href={`/dashboard/${chat.id}`} />}
                    isActive={pathname === `/dashboard/${chat.id}`}
                    className="text-sm"
                  >
                    {chat.pinned ? (
                      <PinIcon className="size-3.5 shrink-0 text-muted-foreground" />
                    ) : (
                      <MessageSquareIcon className="size-3.5 shrink-0 text-muted-foreground" />
                    )}
                    <span className="truncate">{chat.title}</span>
                  </SidebarMenuButton>

                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={<SidebarMenuAction showOnHover className="aria-expanded:bg-muted" />}
                    >
                      <MoreHorizontalIcon />
                      <span className="sr-only">More</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-48"
                      side={isMobile ? "bottom" : "right"}
                      align={isMobile ? "end" : "start"}
                    >
                      <DropdownMenuItem onClick={() => handleShare(chat.id)}>
                        <ShareIcon className="text-muted-foreground" />
                        <span>Share Chat</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleTogglePin(chat.id, !chat.pinned)}>
                        <PinIcon className="text-muted-foreground" />
                        <span>{chat.pinned ? "Unpin Chat" : "Pin Chat"}</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDelete(chat.id)}
                      >
                        <Trash2Icon className="text-muted-foreground" />
                        <span>Delete Chat</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </SidebarGroup>
  );
}
