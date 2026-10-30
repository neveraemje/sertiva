"use client"

import { FileTextIcon, SettingsIcon } from "lucide-react"

import { UserMenu } from "@/components/auth/user-menu"
import { useMessages } from "@/components/i18n/locale-provider"
import { SertivaLogo } from "@/components/sertiva-logo"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import type { CurrentUser } from "@/lib/auth"

export type DashboardSection = "certificates" | "settings"

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  section: DashboardSection
  onCertificates: () => void
  onSettings: () => void
  user: CurrentUser
}

const messages = {
  en: { tagline: "Certificate studio", certificates: "Certificates", settings: "Settings" },
  id: { tagline: "Studio sertifikat", certificates: "Sertifikat", settings: "Pengaturan" },
}

export function AppSidebar({ section, onCertificates, onSettings, user, ...props }: AppSidebarProps) {
  const t = useMessages(messages)

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
                <span className="truncate text-xs text-muted-foreground">{t.tagline}</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="px-3 py-2 group-data-[collapsible=icon]:px-2">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              <SidebarMenuItem>
                <SidebarMenuButton isActive={section === "certificates"} tooltip={t.certificates} onClick={onCertificates}>
                  <FileTextIcon />
                  <span>{t.certificates}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={section === "settings"} tooltip={t.settings} onClick={onSettings}>
                  <SettingsIcon />
                  <span>{t.settings}</span>
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
