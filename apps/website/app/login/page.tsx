"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { GithubLogo } from "@phosphor-icons/react"

export default function LoginPage() {
  const { isLoggedIn, isLoading, login } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && isLoggedIn) {
      router.replace("/")
    }
  }, [isLoading, isLoggedIn, router])

  if (isLoading || isLoggedIn) {
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
        <Button onClick={login} size="lg" className="w-full gap-2">
          <GithubLogo weight="fill" className="size-5" />
          Continue with Github
        </Button>
      </div>
    </div>
  )
}
