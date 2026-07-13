"use client"

import * as React from "react"
import { useUser } from "@clerk/nextjs"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavRecentChats } from "@/components/nav-recent-chats"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { NotebookText, NotebookPen, Speech, BotIcon, BookOpenIcon, LifeBuoyIcon, SendIcon, FrameIcon, PieChartIcon, MapIcon, TerminalIcon } from "lucide-react"

const data = {
  navMain: [
    {
      title: "Personas",
      url: "#",
      icon: (
        <Speech />
      ),
      isActive: true,
      items: [
        {
          title: "Hitesh Choudary",
          url: "#",
        },
        {
          title: "Piyush Garg",
          url: "#",
        },
      ],
    },
    {
      title: "Models",
      url: "#",
      icon: (
        <BotIcon
        />
      ),
      items: [
        {
          title: "ChatGPT",
          url: "#",
        },
        {
          title: "Gemini",
          url: "#",
        },
        {
          title: "Claude",
          url: "#",
        },
      ],
    },
    {
      title: "NoteBooks",
      url: "#",
      icon: (
        <BookOpenIcon
        />
      ),
      items: [
        {
          title: "New NoteBook",
          url: "#",
          icon: (
            <NotebookPen />
          ),
        },
        {
          title: "My NoteBooks",
          url: "#",
          icon: (
            <NotebookText />
          ),
        }
      ],
    }
  ],
  navSecondary: [
    {
      title: "Support",
      url: "#",
      icon: (
        <LifeBuoyIcon
        />
      ),
    },
    {
      title: "Feedback",
      url: "#",
      icon: (
        <SendIcon
        />
      ),
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: (
        <FrameIcon
        />
      ),
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: (
        <PieChartIcon
        />
      ),
    },
    {
      name: "Travel",
      url: "#",
      icon: (
        <MapIcon
        />
      ),
    },
  ],
  recentChats: [
    { id: "1", title: "How to learn TypeScript fast", url: "#" },
    { id: "2", title: "Build a REST API with Express", url: "#" },
    { id: "3", title: "Next.js App Router explained", url: "#" },
    { id: "4", title: "Tailwind CSS tips and tricks", url: "#" },
    { id: "5", title: "MongoDB vs PostgreSQL", url: "#" },
    { id: "6", title: "Docker for beginners", url: "#" },
    { id: "7", title: "React Server Components deep dive", url: "#" },
    { id: "8", title: "JWT authentication explained", url: "#" },
  ],
}
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, isLoaded } = useUser()

  const clerkUser = {
    name: user?.fullName ?? user?.firstName ?? "User",
    email: user?.primaryEmailAddress?.emailAddress ?? "",
    avatar: user?.imageUrl ?? "",
  }

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<a href="#" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <TerminalIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">ShubhGPT</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
        <NavRecentChats chats={data.recentChats} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        {isLoaded && <NavUser user={clerkUser} />}
      </SidebarFooter>
    </Sidebar>
  )
}
