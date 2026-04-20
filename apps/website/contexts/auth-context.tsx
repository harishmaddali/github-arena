"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

interface AuthContextValue {
  isLoggedIn: boolean
  user: { name: string; email: string; avatar: string } | null
  login: () => void
  logout: () => void
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined)

const MOCK_USER = {
  name: "shadcn",
  email: "m@example.com",
  avatar: "/avatars/shadcn.jpg",
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem("mock-auth") === "true"
  })

  const router = useRouter()

  const login = React.useCallback(() => {
    localStorage.setItem("mock-auth", "true")
    setIsLoggedIn(true)
    router.push("/")
  }, [router])

  const logout = React.useCallback(() => {
    localStorage.removeItem("mock-auth")
    setIsLoggedIn(false)
    router.push("/login")
  }, [router])

  const value = React.useMemo(
    () => ({
      isLoggedIn,
      user: isLoggedIn ? MOCK_USER : null,
      login,
      logout,
    }),
    [isLoggedIn, login, logout]
  )

  return <AuthContext value={value}>{children}</AuthContext>
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
