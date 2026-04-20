import { getAuthenticatedGitHubAccessToken } from "@/lib/auth"

function getSinceDate(period: string): Date {
  const now = new Date()
  switch (period) {
    case "1h":
      return new Date(now.getTime() - 60 * 60 * 1000)
    case "8h":
      return new Date(now.getTime() - 8 * 60 * 60 * 1000)
    case "24h":
      return new Date(now.getTime() - 24 * 60 * 60 * 1000)
    case "1w":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    default:
      return new Date(now.getTime() - 24 * 60 * 60 * 1000)
  }
}

async function ghFetch(url: string, token?: string) {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
  }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(url, { headers })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`GitHub API ${res.status}: ${url} ${body}`)
  }
  return res.json()
}

interface GhCommit {
  sha: string
  parents: Array<{ sha: string }>
  commit: {
    author: { name?: string; email?: string; date?: string } | null
  }
  author: { login: string; avatar_url: string; html_url: string } | null
}

interface AuthorCount {
  author: string
  avatar: string | null
  url: string | null
  commits: number
}

const REPO_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\/[A-Za-z0-9._-]+$/

export async function GET(request: Request) {
  const { token } = await getAuthenticatedGitHubAccessToken()
  const authToken = token ?? undefined

  const { searchParams } = new URL(request.url)
  const repo = searchParams.get("repo") || ""
  const period = searchParams.get("period") || "24h"

  if (!REPO_RE.test(repo)) {
    return Response.json(
      { error: "Invalid repo. Use 'owner/name'." },
      { status: 400 }
    )
  }

  const since = getSinceDate(period)
  const sinceISO = since.toISOString()

  try {
    // Page through up to 3 pages of commits (300 max) in the window
    const all: GhCommit[] = []
    for (let page = 1; page <= 3; page++) {
      const batch: GhCommit[] = await ghFetch(
        `https://api.github.com/repos/${repo}/commits?since=${sinceISO}&per_page=100&page=${page}`,
        authToken
      )
      all.push(...batch)
      if (batch.length < 100) break
    }

    // Pure commits only (exclude merges, parents > 1)
    const pure = all.filter((c) => (c.parents?.length ?? 0) <= 1)

    const byAuthor = new Map<string, AuthorCount>()
    for (const c of pure) {
      const key = c.author?.login || c.commit.author?.name || "unknown"
      const existing = byAuthor.get(key)
      if (existing) {
        existing.commits += 1
      } else {
        byAuthor.set(key, {
          author: key,
          avatar: c.author?.avatar_url ?? null,
          url: c.author?.html_url ?? null,
          commits: 1,
        })
      }
    }

    const authors = Array.from(byAuthor.values()).sort(
      (a, b) => b.commits - a.commits
    )

    return Response.json({ repo, period, total: pure.length, authors })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    const status = /404/.test(message) ? 404 : 500
    return Response.json({ error: message }, { status })
  }
}
