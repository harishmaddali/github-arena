import { getAuthenticatedGitHubAccessToken } from "@/lib/auth"

const CODE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".py",
  ".java",
  ".go",
  ".rs",
  ".c",
  ".cpp",
  ".h",
  ".hpp",
  ".rb",
  ".php",
  ".swift",
  ".kt",
  ".scala",
  ".cs",
  ".vue",
  ".svelte",
  ".html",
  ".css",
  ".scss",
  ".sass",
  ".less",
  ".sql",
  ".sh",
  ".bash",
  ".zsh",
  ".ps1",
  ".r",
  ".m",
  ".mm",
  ".zig",
  ".nim",
  ".ex",
  ".exs",
  ".clj",
  ".lua",
  ".pl",
  ".hs",
  ".ml",
  ".fs",
  ".dart",
  ".sol",
  ".asm",
  ".s",
  ".elm",
  ".erl",
  ".hrl",
])

function isCodeFile(filename: string): boolean {
  const dotIdx = filename.lastIndexOf(".")
  if (dotIdx === -1) return false
  const ext = filename.substring(dotIdx).toLowerCase()
  return CODE_EXTENSIONS.has(ext)
}

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

async function ghFetch(url: string, token: string) {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
  })
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status}: ${url}`)
  }
  return res.json()
}

export async function GET(request: Request) {
  const { token } = await getAuthenticatedGitHubAccessToken()

  if (!token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const period = searchParams.get("period") || "24h"
  const since = getSinceDate(period)
  const sinceISO = since.toISOString()
  try {
    // Get authenticated user's login
    const user = await ghFetch("https://api.github.com/user", token)
    const username: string = user.login

    // Fetch recently-pushed repos
    const repos: Array<{ full_name: string; name: string; pushed_at: string }> =
      await ghFetch(
        "https://api.github.com/user/repos?sort=pushed&per_page=30&affiliation=owner,collaborator,organization_member",
        token
      )

    // Filter repos pushed after the since date
    const activeRepos = repos.filter(
      (r) => new Date(r.pushed_at) >= since
    )

    // For each active repo, fetch commits in the time window
    const repoResults = await Promise.allSettled(
      activeRepos.map(async (repo) => {
        let commits: Array<{
          sha: string
          parents: Array<{ sha: string }>
        }>
        try {
          commits = await ghFetch(
            `https://api.github.com/repos/${repo.full_name}/commits?author=${username}&since=${sinceISO}&per_page=100`,
            token
          )
        } catch {
          // Empty repos or permission issues — skip
          return null
        }

        // Filter out merge commits (2+ parents)
        const pureCommits = commits.filter((c) => c.parents.length <= 1)
        if (pureCommits.length === 0) return null

        // Fetch commit details to classify (cap at 50 per repo)
        const toClassify = pureCommits.slice(0, 50)
        const details = await Promise.allSettled(
          toClassify.map((c) =>
            ghFetch(
              `https://api.github.com/repos/${repo.full_name}/commits/${c.sha}`,
              token
            )
          )
        )

        let code = 0
        let nonCode = 0

        for (const result of details) {
          if (result.status !== "fulfilled") continue
          const files: Array<{ filename: string }> =
            result.value.files || []
          if (files.length === 0) {
            nonCode++
            continue
          }
          const hasCode = files.some((f) => isCodeFile(f.filename))
          if (hasCode) {
            code++
          } else {
            nonCode++
          }
        }

        if (code === 0 && nonCode === 0) return null

        return { repo: repo.name, code, nonCode }
      })
    )

    const results = repoResults
      .filter(
        (r): r is PromiseFulfilledResult<{
          repo: string
          code: number
          nonCode: number
        } | null> => r.status === "fulfilled"
      )
      .map((r) => r.value)
      .filter(
        (v): v is { repo: string; code: number; nonCode: number } => v !== null
      )
      .sort((a, b) => b.code + b.nonCode - (a.code + a.nonCode))

    return Response.json({ repos: results })
  } catch (error) {
    console.error("Error fetching commits:", error)
    return Response.json(
      { error: "Failed to fetch commit data" },
      { status: 500 }
    )
  }
}
