"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useChatContext } from "stream-chat-react";

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
  url: string;
};

export function NavRecentChats() {
  const { isMobile } = useSidebar();
  const { client } = useChatContext();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = React.useState(true);
  const [chats, setChats] = React.useState<{ id: string; title: string }[]>([]);

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
      })),
    );
  }, [client]);

  // Refetch whenever the route changes — covers landing back on /dashboard
  // after creating a chat, and switching between chats.
  React.useEffect(() => {
    loadChats();
  }, [loadChats, pathname]);

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden p-0">
      {/* ── New Chat button — always visible, above the collapsible ── */}
      <div className="px-2 pb-1">
        <button className="flex w-full items-center gap-2 rounded-md border border-dashed border-sidebar-border px-3 py-1.5 text-sm text-muted-foreground hover:border-sidebar-ring hover:text-foreground transition-colors">
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
              {chats.map((chat) => (
                <SidebarMenuItem key={chat.id}>
                  <SidebarMenuButton
                    render={<Link href={`/dashboard/${chat.id}`} />}
                    isActive={pathname === `/dashboard/${chat.id}`}
                    className="text-sm"
                  >
                    <MessageSquareIcon className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{chat.title}</span>
                  </SidebarMenuButton>
                  {/* keep your existing per-chat DropdownMenu (Share/Pin/Delete) unchanged */}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </SidebarGroup>
  );
}
