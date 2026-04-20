import "server-only"

import { createClient } from "@/lib/supabase/server"

export async function getAuthenticatedGitHubAccessToken() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return { user: null, token: null }
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()

  return {
    user,
    token: session?.provider_token ?? null,
  }
}
