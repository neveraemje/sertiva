import Link from "next/link"
import { CircleAlertIcon } from "lucide-react"

import { AuthShell } from "@/components/auth/auth-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AuthCodeErrorPage() {
  return (
    <AuthShell>
      <Card className="gap-6 p-2 shadow-sm">
        <CardHeader className="items-center text-center">
          <span className="mb-2 flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <CircleAlertIcon className="size-5" />
          </span>
          <CardTitle className="text-xl">We couldn&apos;t sign you in</CardTitle>
          <CardDescription>
            The sign-in link may have expired or the authorization was cancelled.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" render={<Link href="/login" />}>
            Back to sign in
          </Button>
        </CardContent>
      </Card>
    </AuthShell>
  )
}
