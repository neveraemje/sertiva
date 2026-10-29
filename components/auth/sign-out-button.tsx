"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LoaderCircleIcon, LogOutIcon } from "lucide-react"

import { SidebarMenuButton } from "@/components/ui/sidebar"
import { createClient } from "@/lib/supabase/client"

export function SignOutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSignOut() {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace("/login")
    router.refresh()
  }

  return (
    <SidebarMenuButton
      type="button"
      tooltip="Sign out"
      aria-label="Sign out"
      className="text-muted-foreground hover:text-foreground"
      disabled={loading}
      onClick={handleSignOut}
    >
      {loading ? <LoaderCircleIcon className="animate-spin" /> : <LogOutIcon />}
      <span>Sign out</span>
    </SidebarMenuButton>
  )
}
