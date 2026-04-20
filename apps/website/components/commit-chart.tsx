"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { useSession } from "next-auth/react"

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
  ChartLegend,
  ChartLegendContent,
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

const chartConfig = {
  code: {
    label: "Code",
    color: "var(--chart-1)",
  },
  nonCode: {
    label: "Non-code",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

interface RepoCommitData {
  repo: string
  code: number
  nonCode: number
}

export function CommitChart() {
  const { data: session } = useSession()
  const [period, setPeriod] = React.useState("24h")
  const [data, setData] = React.useState<RepoCommitData[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!session) return

    setLoading(true)
    setError(null)

    fetch(`/api/commits?period=${period}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch commit data")
        return res.json()
      })
      .then((json) => {
        setData(json.repos)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [session, period])

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Commit Activity</CardTitle>
        <CardAction>
          <ToggleGroup
            type="single"
            value={period}
            onValueChange={(val) => val && setPeriod(val)}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[540px]/card:flex"
          >
            <ToggleGroupItem value="1h">1h</ToggleGroupItem>
            <ToggleGroupItem value="8h">8h</ToggleGroupItem>
            <ToggleGroupItem value="24h">24h</ToggleGroupItem>
            <ToggleGroupItem value="1w">1w</ToggleGroupItem>
          </ToggleGroup>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger
              className="flex w-20 @[540px]/card:hidden"
              size="sm"
              aria-label="Select time period"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="1h" className="rounded-lg">
                1h
              </SelectItem>
              <SelectItem value="8h" className="rounded-lg">
                8h
              </SelectItem>
              <SelectItem value="24h" className="rounded-lg">
                24h
              </SelectItem>
              <SelectItem value="1w" className="rounded-lg">
                1w
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {loading ? (
          <Skeleton className="h-[350px] w-full rounded-lg" />
        ) : error ? (
          <div className="flex h-[350px] items-center justify-center text-sm text-muted-foreground">
            {error}
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-[350px] items-center justify-center text-sm text-muted-foreground">
            No commits in this period
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[350px] w-full"
          >
            <BarChart data={data} barGap={2} barCategoryGap="20%">
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="repo"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                angle={data.length > 5 ? -35 : 0}
                textAnchor={data.length > 5 ? "end" : "middle"}
                height={data.length > 5 ? 80 : 40}
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
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="code"
                fill="var(--color-code)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="nonCode"
                fill="var(--color-nonCode)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
