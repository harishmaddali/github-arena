"use client"

import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import type { Session, User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"

import {
  getAvatarUrl,
  getDisplayName,
  getGitHubUsername,
} from "@/lib/user-profile"
import { createClient } from "@/lib/supabase/client"

type AuthStatus = "loading" | "authenticated" | "unauthenticated"

interface AuthContextValue {
  session: Session | null
  user: User | null
  status: AuthStatus
  githubUsername: string | null
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthSessionProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [session, setSession] = useState<Session | null>(null)
  const [status, setStatus] = useState<AuthStatus>("loading")
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    const loadSession = async () => {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession()

      startTransition(() => {
        setSession(currentSession)
        setStatus(currentSession ? "authenticated" : "unauthenticated")
      })
    }

    void loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      startTransition(() => {
        setSession(nextSession)
        setStatus(nextSession ? "authenticated" : "unauthenticated")
      })

      router.refresh()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      status,
      githubUsername: getGitHubUsername(session?.user ?? null),
      signOut: async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.replace("/login")
        router.refresh()
      },
    }),
    [router, session, status]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used within AuthSessionProvider")
  }

  return context
}

export function useAuthUserProfile() {
  const { user, githubUsername } = useAuth()

  return {
    name: getDisplayName(user),
    email: user?.email ?? githubUsername ?? "",
    avatar: getAvatarUrl(user),
  }
}
