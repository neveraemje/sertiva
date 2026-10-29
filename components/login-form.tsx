"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CircleAlertIcon, LoaderCircleIcon } from "lucide-react"

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

export function LoginForm(props: React.ComponentProps<typeof Card>) {
  const router = useRouter()
  const [loading, setLoading] = useState<LoadingState>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading("password")
    setError(null)

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get("email") ?? "").trim()
    const password = String(formData.get("password") ?? "")
    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError(signInError.message)
      setLoading(null)
      return
    }

    router.replace("/dashboard")
    router.refresh()
  }

  async function handleGoogleSignIn() {
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

  return (
    <Card className="gap-6 px-2 py-8 shadow-sm sm:py-10" {...props}>
      <CardHeader className="gap-1.5 text-center">
        <CardTitle className="text-xl">Welcome back</CardTitle>
        <CardDescription>
          Sign in to manage your certificate templates.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
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
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </Field>

            {error ? (
              <div className="flex items-start gap-2 rounded-lg bg-destructive/8 px-3 py-2.5 text-sm text-destructive" role="alert">
                <CircleAlertIcon className="mt-0.5 size-4 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}

            <Field className="gap-3">
              <Button type="submit" size="lg" disabled={loading !== null}>
                {loading === "password" ? <LoaderCircleIcon className="animate-spin" /> : null}
                Sign in
              </Button>
              <div className="flex items-center gap-3 text-xs text-muted-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
                or
              </div>
              <Button
                variant="outline"
                size="lg"
                type="button"
                disabled={loading !== null}
                onClick={handleGoogleSignIn}
              >
                {loading === "google" ? (
                  <LoaderCircleIcon className="animate-spin" />
                ) : (
                  <GoogleIcon className="size-4" />
                )}
                Continue with Google
              </Button>
              <FieldDescription className="mt-1 text-center">
                Don&apos;t have an account? <Link href="/signup">Create one</Link>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
