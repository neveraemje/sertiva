"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LoaderCircleIcon, LogOutIcon } from "lucide-react"

import { useMessages } from "@/components/i18n/locale-provider"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

const messages = {
  en: { signOut: "Sign out" },
  id: { signOut: "Keluar" },
}

export function SignOutButton() {
  const t = useMessages(messages)
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
    <Button type="button" variant="outline" disabled={loading} onClick={handleSignOut}>
      {loading ? <LoaderCircleIcon className="animate-spin" data-icon="inline-start" /> : <LogOutIcon data-icon="inline-start" />}
      {t.signOut}
    </Button>
  )
}
