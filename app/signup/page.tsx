import { redirect } from "next/navigation"

import { AuthShell } from "@/components/auth/auth-shell"
import { SignupForm } from "@/components/signup-form"
import { getCurrentUser } from "@/lib/auth"

export const instant = false

export default async function SignupPage() {
  const user = await getCurrentUser()

  if (user) {
    redirect("/dashboard")
  }

  return (
    <AuthShell>
      <SignupForm />
    </AuthShell>
  )
}
