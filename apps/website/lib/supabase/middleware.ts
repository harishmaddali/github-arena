import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import { getSupabaseEnv } from "@/lib/supabase/env"

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  })

  const { url, publishableKey } = getSupabaseEnv()

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        for (const cookie of cookiesToSet) {
          request.cookies.set(cookie.name, cookie.value)
        }

        response = NextResponse.next({
          request,
        })

        for (const cookie of cookiesToSet) {
          response.cookies.set(cookie.name, cookie.value, cookie.options)
        }
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { response, user }
}
