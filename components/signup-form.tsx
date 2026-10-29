"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CircleAlertIcon, LoaderCircleIcon, MailCheckIcon } from "lucide-react"

import { GoogleIcon } from "@/components/auth/google-icon"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"

type LoadingState = "password" | "google" | null

export function SignupForm(props: React.ComponentProps<typeof Card>) {
  const router = useRouter()
  const [loading, setLoading] = useState<LoadingState>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const formData = new FormData(event.currentTarget)
    const fullName = String(formData.get("fullName") ?? "").trim()
    const email = String(formData.get("email") ?? "").trim()
    const password = String(formData.get("password") ?? "")
    const confirmation = String(formData.get("confirmPassword") ?? "")

    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }

    if (password !== confirmation) {
      setError("Passwords do not match.")
      return
    }

    setLoading("password")
    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        data: { full_name: fullName },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(null)
      return
    }

    if (data.session) {
      router.replace("/dashboard")
      router.refresh()
      return
    }

    setConfirmationEmail(email)
    setLoading(null)
  }

  async function handleGoogleSignUp() {
    setLoading("google")
    setError(null)

    const supabase = createClient()
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    })

    if (oauthError) {
      setError(oauthError.message)
      setLoading(null)
    }
  }

  if (confirmationEmail) {
    return (
      <Card className="gap-6 px-2 py-8 shadow-sm sm:py-10" {...props}>
        <CardHeader className="items-center gap-1.5 text-center">
          <span className="mb-2 flex size-11 items-center justify-center rounded-full bg-muted text-foreground">
            <MailCheckIcon className="size-5" />
          </span>
          <CardTitle className="text-xl">Check your inbox</CardTitle>
          <CardDescription>
            We sent a confirmation link to <span className="font-medium text-foreground">{confirmationEmail}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" variant="outline" render={<Link href="/login" />}>
            Back to sign in
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="gap-6 px-2 py-8 shadow-sm sm:py-10" {...props}>
      <CardHeader className="gap-1.5 text-center">
        <CardTitle className="text-xl">Create your account</CardTitle>
        <CardDescription>
          Start building and publishing certificates with Sertiva.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="full-name">Full name</FieldLabel>
              <Input
                id="full-name"
                name="fullName"
                type="text"
                placeholder="Alex Morgan"
                autoComplete="name"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@company.com"
                autoComplete="email"
                required
              />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  minLength={8}
                  autoComplete="new-password"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="confirm-password">Confirm</FieldLabel>
                <Input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  minLength={8}
                  autoComplete="new-password"
                  required
                />
              </Field>
            </div>
            <FieldDescription>Use at least 8 characters.</FieldDescription>

            {error ? (
              <div className="flex items-start gap-2 rounded-lg bg-destructive/8 px-3 py-2.5 text-sm text-destructive" role="alert">
                <CircleAlertIcon className="mt-0.5 size-4 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}

            <Field className="gap-3">
              <Button type="submit" size="lg" disabled={loading !== null}>
                {loading === "password" ? <LoaderCircleIcon className="animate-spin" /> : null}
                Create account
              </Button>
              <div className="flex items-center gap-3 text-xs text-muted-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
                or
              </div>
              <Button
                variant="outline"
                size="lg"
                type="button"
                disabled={loading !== null}
                onClick={handleGoogleSignUp}
              >
                {loading === "google" ? (
                  <LoaderCircleIcon className="animate-spin" />
                ) : (
                  <GoogleIcon className="size-4" />
                )}
                Continue with Google
              </Button>
              <FieldDescription className="mt-1 text-center">
                Already have an account? <Link href="/login">Sign in</Link>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
