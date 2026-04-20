"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/session-provider"
import { createClient } from "@/lib/supabase/client"
import { GithubLogo } from "@phosphor-icons/react"

interface LoginPageClientProps {
  authError: string | null
  nextPath: string
}

export function LoginPageClient({
  authError,
  nextPath,
}: LoginPageClientProps) {
  const { session, status } = useAuth()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(nextPath)
    }
  }, [nextPath, router, status])

  if (status === "loading" || session) {
    return null
  }

  async function handleGitHubSignIn() {
    setSubmitting(true)

    const supabase = createClient()
    const redirectTo = new URL("/auth/callback", window.location.origin)
    redirectTo.searchParams.set("next", nextPath)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: redirectTo.toString(),
        scopes: "read:user user:email repo",
      },
    })

    if (error) {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 px-4">
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome to GitHub Arena
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to access your dashboard
          </p>
        </div>
        {authError ? (
          <p className="text-sm text-destructive">
            Sign-in failed. Check the Supabase callback settings and try again.
          </p>
        ) : null}
        <Button
          onClick={() => void handleGitHubSignIn()}
          size="lg"
          className="w-full gap-2"
          disabled={submitting}
        >
          <GithubLogo weight="fill" className="size-5" />
          Continue with GitHub
        </Button>
      </div>
    </div>
  )
}
