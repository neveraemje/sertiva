"use client"

import { SignOutButton } from "@/components/auth/sign-out-button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar"
import type { CurrentUser } from "@/lib/auth"

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U"
}

export function UserMenu({ user }: { user: CurrentUser }) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="flex h-12 min-w-0 items-center gap-2 rounded-md px-2 text-sm group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0">
          <Avatar className="size-8 shrink-0 rounded-lg">
            {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.name} /> : null}
            <AvatarFallback className="rounded-lg bg-foreground text-background">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <span className="grid min-w-0 flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-medium">{user.name}</span>
            {user.email ? (
              <span className="truncate text-xs text-muted-foreground">{user.email}</span>
            ) : null}
          </span>
        </div>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SignOutButton />
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
