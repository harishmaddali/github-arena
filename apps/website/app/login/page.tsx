import { LoginPageClient } from "@/components/login-page-client"

interface LoginPageProps {
  searchParams: Promise<{
    error?: string
    next?: string
  }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams

  return (
    <LoginPageClient
      authError={params.error ?? null}
      nextPath={params.next ?? "/"}
    />
  )
}
