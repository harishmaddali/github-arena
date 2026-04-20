import { NextResponse, type NextRequest } from "next/server"

import { updateSession } from "@/lib/supabase/middleware"

const PROTECTED_PATHS = ["/", "/public-stats"]

function isProtectedPath(pathname: string) {
  return PROTECTED_PATHS.some((path) =>
    pathname === path || pathname.startsWith(`${path}/`)
  )
}

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request)
  const { pathname, search } = request.nextUrl

  if (pathname === "/login" && user) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  if (isProtectedPath(pathname) && !user) {
    const loginUrl = new URL("/login", request.url)
    const nextPath = `${pathname}${search}`

    if (nextPath !== "/") {
      loginUrl.searchParams.set("next", nextPath)
    }

    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
