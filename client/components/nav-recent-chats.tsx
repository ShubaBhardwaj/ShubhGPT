"use client"

import * as React from "react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  ChevronDownIcon,
  PlusIcon,
  MessageSquareIcon,
  MoreHorizontalIcon,
  ShareIcon,
  PinIcon,
  Trash2Icon,
} from "lucide-react"

export type RecentChat = {
  id: string
  title: string
  url: string
}

export function NavRecentChats({ chats }: { chats: RecentChat[] }) {
  const { isMobile } = useSidebar()
  const [open, setOpen] = React.useState(true)

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

          {/* ── Scrollable chat list ── */}
          <div className="max-h-52 overflow-y-auto px-2 pb-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
            <SidebarMenu>
              {chats.map((chat) => (
                <SidebarMenuItem key={chat.id}>
                  <SidebarMenuButton render={<a href={chat.url} />} className="text-sm">
                    <MessageSquareIcon className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{chat.title}</span>
                  </SidebarMenuButton>

                  {/* Per-chat context menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <SidebarMenuAction
                          showOnHover
                          className="aria-expanded:bg-muted"
                        />
                      }
                    >
                      <MoreHorizontalIcon />
                      <span className="sr-only">More</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-48"
                      side={isMobile ? "bottom" : "right"}
                      align={isMobile ? "end" : "start"}
                    >
                      <DropdownMenuItem>
                        <ShareIcon className="text-muted-foreground" />
                        <span>Share Chat</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <PinIcon className="text-muted-foreground" />
                        <span>Pin Chat</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:text-destructive">
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
  )
}
