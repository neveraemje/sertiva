"use client"

import { FilesIcon } from "lucide-react"

import { UserMenu } from "@/components/auth/user-menu"
import { SertivaLogo } from "@/components/sertiva-logo"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import type { CurrentUser } from "@/lib/auth"

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  onCertificates: () => void
  user: CurrentUser
}

export function AppSidebar({ onCertificates, user, ...props }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" className="[--sidebar:#fff]" {...props}>
      <SidebarHeader className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="hover:bg-transparent active:bg-transparent">
              <span className="flex size-8 shrink-0 items-center justify-center">
                <SertivaLogo className="h-6 w-auto" />
              </span>
              <span className="grid flex-1 text-left leading-tight">
                <span className="truncate text-lg font-semibold">Sertiva</span>
                <span className="truncate text-xs text-muted-foreground">Certificate studio</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive tooltip="Certificates" onClick={onCertificates}>
                  <FilesIcon />
                  <span>Certificates</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-2">
        <UserMenu user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
