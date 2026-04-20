"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { signIn, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { GithubLogo } from "@phosphor-icons/react"

export default function LoginPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/")
    }
  }, [status, router])

  if (status === "loading" || session) {
    return null
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
        <Button
          onClick={() => signIn("github", { callbackUrl: "/" })}
          size="lg"
          className="w-full gap-2"
        >
          <GithubLogo weight="fill" className="size-5" />
          Continue with Github
        </Button>
      </div>
    </div>
  )
}
