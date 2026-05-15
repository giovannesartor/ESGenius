"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/hooks/useCompany";
import { financialScoreApi, type FinancialScore } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Coins, TrendingDown, TrendingUp, Award, RefreshCw, Loader2 } from "lucide-react";

function ratingColor(band: string): string {
  if (["AAA", "AA", "A"].includes(band)) return "bg-emerald-500";
  if (["BBB", "BB"].includes(band)) return "bg-amber-500";
  return "bg-red-500";
}

function bpsLabel(bps: number): string {
  return `${bps >= 0 ? "+" : ""}${bps.toFixed(0)} bps`;
}

export default function FinancialScorePage() {
  const { token } = useAuth();
  const { company } = useCompany();
  const [score, setScore] = useState<FinancialScore | null>(null);
  const [loading, setLoading] = useState(false);
  const [computing, setComputing] = useState(false);

  const load = useCallback(async () => {
    if (!token || !company?.id) return;
    setLoading(true);
    try {
      const r = await financialScoreApi.latest(token, company.id);
      if ("score" in r && typeof r.score === "number") setScore(r as FinancialScore);
      else setScore(null);
    } finally {
      setLoading(false);
    }
  }, [token, company?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const compute = async () => {
    if (!token || !company?.id) return;
    setComputing(true);
    try {
      const r = await financialScoreApi.compute(token, company.id);
      setScore(r);
    } finally {
      setComputing(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Coins className="size-7 text-amber-500" /> ESG Financial Score
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your sustainability performance, translated into the language of capital — basis points, rating bands, WACC.
          </p>
        </div>
        <Button onClick={compute} disabled={computing || !company?.id}>
          {computing ? <Loader2 className="mr-2 size-4 animate-spin" /> : <RefreshCw className="mr-2 size-4" />}
          {score ? "Recompute" : "Compute now"}
        </Button>
      </div>

      {loading && <div className="text-sm text-muted-foreground">Loading…</div>}

      {!loading && !score && (
        <Card>
          <CardContent className="py-12 text-center">
            <Coins className="mx-auto size-10 text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">No score computed yet. Click <strong>Compute now</strong>.</p>
          </CardContent>
        </Card>
      )}

      {score && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardDescription>Composite score</CardDescription>
                <CardTitle className="flex items-center gap-3 text-5xl">
                  {score.score.toFixed(1)}
                  <Badge className={`${ratingColor(score.rating_band)} text-white`}>{score.rating_band}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={score.score} />
                {score.sector_percentile != null && (
                  <p className="mt-3 text-sm text-muted-foreground">
                    <Award className="mr-1 inline size-4 text-amber-500" />
                    {score.sector_percentile}th percentile in {score.sector ?? "sector"}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>Spread translation</CardDescription>
                <CardTitle className="flex items-center gap-2 text-3xl">
                  {score.spread_bps < 0 ? (
                    <TrendingDown className="size-7 text-emerald-500" />
                  ) : (
                    <TrendingUp className="size-7 text-red-500" />
                  )}
                  {bpsLabel(score.spread_bps)}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {score.spread_bps < 0
                  ? "Pricing discount available on sustainability-linked debt."
                  : "Spread premium expected — gaps in disclosure or performance."}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>WACC adjustment</CardDescription>
                <CardTitle className="text-3xl">{bpsLabel(score.wacc_adjustment_bps)}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Estimated change to weighted average cost of capital.
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <ComponentCard label="Performance" value={score.components.performance} />
            <ComponentCard label="Disclosure" value={score.components.disclosure} />
            <ComponentCard label="Forward risk" value={score.components.forward_risk} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <DriverList title="Top positive drivers" drivers={score.drivers?.top_positive ?? []} positive />
            <DriverList title="Top negative drivers" drivers={score.drivers?.top_negative ?? []} positive={false} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Methodology</CardTitle>
              <CardDescription>Version {score.methodology_version ?? "v1"} — fully transparent</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <code className="block rounded bg-muted px-3 py-2 text-xs">
                score = 0.40·performance + 0.30·disclosure + 0.30·forward_risk
              </code>
              <code className="mt-2 block rounded bg-muted px-3 py-2 text-xs">
                spread_bps = -0.8 · (score - 50)
              </code>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function ComponentCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value.toFixed(1)}</CardTitle>
      </CardHeader>
      <CardContent>
        <Progress value={value} />
      </CardContent>
    </Card>
  );
}

function DriverList({
  title,
  drivers,
  positive,
}: {
  title: string;
  drivers: Array<Record<string, unknown>>;
  positive: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">
          {drivers.length === 0 && <li className="text-muted-foreground">No data.</li>}
          {drivers.map((d, i) => (
            <li key={i} className="flex items-center justify-between gap-2">
              <span className="truncate">{String(d.metric ?? "")}</span>
              <Badge variant={positive ? "default" : "destructive"}>{Number(d.score ?? 0).toFixed(1)}</Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
