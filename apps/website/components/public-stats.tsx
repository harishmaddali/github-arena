"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { PlusIcon, TrashIcon, ArrowClockwiseIcon, GithubLogoIcon } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

const STORAGE_KEY = "gha.watchedRepos"
const REPO_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\/[A-Za-z0-9._-]+$/

type Period = "1h" | "8h" | "24h" | "1w"

interface AuthorRow {
  author: string
  avatar: string | null
  url: string | null
  commits: number
}

interface RepoState {
  repo: string
  loading: boolean
  error: string | null
  authors: AuthorRow[]
  total: number
}

const chartConfig = {
  commits: {
    label: "Commits",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

function readWatched(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((s): s is string => typeof s === "string")
  } catch {
    return []
  }
}

function writeWatched(list: string[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export function PublicStats() {
  const [repos, setRepos] = React.useState<string[]>([])
  const [input, setInput] = React.useState("")
  const [inputError, setInputError] = React.useState<string | null>(null)
  const [period, setPeriod] = React.useState<Period>("24h")
  const [states, setStates] = React.useState<Record<string, RepoState>>({})
  const [hydrated, setHydrated] = React.useState(false)

  // Hydrate from localStorage on mount
  React.useEffect(() => {
    setRepos(readWatched())
    setHydrated(true)
  }, [])

  // Persist when repos change
  React.useEffect(() => {
    if (!hydrated) return
    writeWatched(repos)
  }, [repos, hydrated])

  const loadRepo = React.useCallback(
    async (repo: string, currentPeriod: Period) => {
      setStates((s) => ({
        ...s,
        [repo]: {
          repo,
          loading: true,
          error: null,
          authors: s[repo]?.authors ?? [],
          total: s[repo]?.total ?? 0,
        },
      }))
      try {
        const res = await fetch(
          `/api/public-commits?repo=${encodeURIComponent(repo)}&period=${currentPeriod}`
        )
        const json = await res.json()
        if (!res.ok) {
          throw new Error(json.error || "Failed to load")
        }
        setStates((s) => ({
          ...s,
          [repo]: {
            repo,
            loading: false,
            error: null,
            authors: json.authors ?? [],
            total: json.total ?? 0,
          },
        }))
      } catch (err) {
        setStates((s) => ({
          ...s,
          [repo]: {
            repo,
            loading: false,
            error: err instanceof Error ? err.message : "Failed to load",
            authors: [],
            total: 0,
          },
        }))
      }
    },
    []
  )

  // Fetch on repos/period change
  React.useEffect(() => {
    if (!hydrated) return
    for (const repo of repos) {
      loadRepo(repo, period)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repos, period, hydrated])

  function addRepo() {
    const trimmed = input.trim()
    if (!trimmed) return
    if (!REPO_RE.test(trimmed)) {
      setInputError("Use 'owner/repo' format")
      return
    }
    if (repos.includes(trimmed)) {
      setInputError("Already watching")
      return
    }
    setInputError(null)
    setInput("")
    setRepos((r) => [...r, trimmed])
  }

  function removeRepo(repo: string) {
    setRepos((r) => r.filter((x) => x !== repo))
    setStates((s) => {
      const next = { ...s }
      delete next[repo]
      return next
    })
  }

  function refreshAll() {
    for (const repo of repos) loadRepo(repo, period)
  }

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Watched Public Repos</CardTitle>
          <CardAction>
            <ToggleGroup
              type="single"
              value={period}
              onValueChange={(val) => val && setPeriod(val as Period)}
              variant="outline"
              className="hidden *:data-[slot=toggle-group-item]:px-4! @[540px]/card:flex"
            >
              <ToggleGroupItem value="1h">1h</ToggleGroupItem>
              <ToggleGroupItem value="8h">8h</ToggleGroupItem>
              <ToggleGroupItem value="24h">24h</ToggleGroupItem>
              <ToggleGroupItem value="1w">1w</ToggleGroupItem>
            </ToggleGroup>
            <Select
              value={period}
              onValueChange={(v) => setPeriod(v as Period)}
            >
              <SelectTrigger
                className="flex w-20 @[540px]/card:hidden"
                size="sm"
                aria-label="Select time period"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="1h">1h</SelectItem>
                <SelectItem value="8h">8h</SelectItem>
                <SelectItem value="24h">24h</SelectItem>
                <SelectItem value="1w">1w</SelectItem>
              </SelectContent>
            </Select>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-start gap-2">
            <div className="flex flex-1 flex-col gap-1 min-w-[220px]">
              <Input
                placeholder="owner/repo (e.g. vercel/next.js)"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                  if (inputError) setInputError(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addRepo()
                  }
                }}
                aria-invalid={!!inputError}
              />
              {inputError && (
                <span className="text-xs text-destructive">{inputError}</span>
              )}
            </div>
            <Button onClick={addRepo} size="sm">
              <PlusIcon /> Add
            </Button>
            <Button
              onClick={refreshAll}
              size="sm"
              variant="outline"
              disabled={repos.length === 0}
            >
              <ArrowClockwiseIcon /> Refresh
            </Button>
          </div>
          {repos.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {repos.map((r) => (
                <Badge
                  key={r}
                  variant="secondary"
                  className="gap-1.5 pr-1"
                >
                  <GithubLogoIcon className="size-3.5" />
                  {r}
                  <button
                    onClick={() => removeRepo(r)}
                    className="ml-1 rounded-sm p-0.5 hover:bg-background/60"
                    aria-label={`Remove ${r}`}
                  >
                    <TrashIcon className="size-3.5" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {repos.length === 0 ? (
        <Card>
          <CardContent className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
            Add a public repo above to start watching commit stats.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 @2xl:grid-cols-2">
          {repos.map((repo) => (
            <RepoChart
              key={repo}
              repo={repo}
              state={states[repo]}
              period={period}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function RepoChart({
  repo,
  state,
  period,
}: {
  repo: string
  state: RepoState | undefined
  period: Period
}) {
  const data = (state?.authors ?? []).map((a) => ({
    author: a.author,
    commits: a.commits,
  }))

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <GithubLogoIcon className="size-4" />
          {repo}
        </CardTitle>
        <CardAction>
          {state && !state.loading && !state.error && (
            <span className="text-xs text-muted-foreground">
              {state.total} commits · {period}
            </span>
          )}
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-2 sm:px-4">
        {!state || state.loading ? (
          <Skeleton className="h-[280px] w-full rounded-lg" />
        ) : state.error ? (
          <div className="flex h-[280px] items-center justify-center px-4 text-center text-sm text-destructive">
            {state.error}
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
            No commits in this period
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[280px] w-full"
          >
            <BarChart data={data} barCategoryGap="20%">
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="author"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                angle={data.length > 4 ? -35 : 0}
                textAnchor={data.length > 4 ? "end" : "middle"}
                height={data.length > 4 ? 70 : 30}
                interval={0}
                fontSize={12}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                width={32}
              />
              <ChartTooltip
                content={<ChartTooltipContent />}
                cursor={{ fill: "var(--muted)", opacity: 0.5 }}
              />
              <Bar
                dataKey="commits"
                fill="var(--color-commits)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
