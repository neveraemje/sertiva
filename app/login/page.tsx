import { redirect } from "next/navigation"

import { AuthShell } from "@/components/auth/auth-shell"
import { LoginForm } from "@/components/login-form"
import { getCurrentUser } from "@/lib/auth"

export const instant = false

export default async function LoginPage() {
  const user = await getCurrentUser()

  if (user) {
    redirect("/dashboard")
  }

  return (
    <AuthShell>
      <LoginForm />
    </AuthShell>
  )
}
