"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/hooks/useCompany";
import { climateRiskApi, type ClimateScenarioResult } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Thermometer, AlertTriangle, Loader2, Play } from "lucide-react";

const SCENARIOS = [
  { code: "NGFS_NZE2050", label: "NGFS · Net Zero 2050 (orderly)" },
  { code: "NGFS_DELAYED", label: "NGFS · Delayed transition (disorderly)" },
  { code: "NGFS_HOTHOUSE", label: "NGFS · Current Policies (hot-house)" },
  { code: "IEA_STEPS", label: "IEA · Stated Policies" },
  { code: "IEA_NZE", label: "IEA · Net Zero by 2050" },
];

function fmtUsd(v: number): string {
  if (Math.abs(v) >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  if (Math.abs(v) >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
}

export default function ClimateRiskPage() {
  const { token } = useAuth();
  const { company } = useCompany();
  const [horizon, setHorizon] = useState(5);
  const [results, setResults] = useState<ClimateScenarioResult[]>([]);
  const [loading, setLoading] = useState(false);

  const computeAll = async () => {
    if (!token || !company?.id) return;
    setLoading(true);
    try {
      const r = await climateRiskApi.computeAll(token, company.id, horizon);
      setResults(r.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void computeAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Thermometer className="size-7 text-orange-500" /> Climate Risk Engine
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            NGFS &amp; IEA scenarios — physical and transition value-at-risk per horizon.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(horizon)} onValueChange={(v) => setHorizon(Number(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 year</SelectItem>
              <SelectItem value="5">5 years</SelectItem>
              <SelectItem value="10">10 years</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={computeAll} disabled={loading || !company?.id}>
            {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Play className="mr-2 size-4" />}
            Run all
          </Button>
        </div>
      </div>

      {results.length === 0 && !loading && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No scenarios computed yet.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {results.map((r) => {
          const meta = SCENARIOS.find((s) => s.code === r.scenario);
          const danger = r.ebitda_at_risk_pct >= 25;
          return (
            <Card key={r.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardDescription>{meta?.label ?? r.scenario}</CardDescription>
                    <CardTitle className="text-base">{r.scenario.replace("_", " · ")}</CardTitle>
                  </div>
                  {danger && (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="size-3" /> High risk
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <Row label="Physical VaR" value={fmtUsd(r.physical_var)} />
                <Row label="Transition VaR" value={fmtUsd(r.transition_var)} />
                <Row label="Total VaR" value={fmtUsd(r.total_var)} bold />
                <Row
                  label="EBITDA at risk"
                  value={`${r.ebitda_at_risk_pct.toFixed(1)}%`}
                  highlight={danger ? "text-red-600" : undefined}
                />
                {r.carbon_price_assumed != null && (
                  <Row label="Carbon price" value={`$${r.carbon_price_assumed}/tCO₂e`} />
                )}
                <Row label="Horizon" value={`${r.horizon_years}y`} />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Row({ label, value, bold, highlight }: { label: string; value: string; bold?: boolean; highlight?: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className={`${bold ? "font-semibold" : ""} ${highlight ?? ""}`}>{value}</span>
    </div>
  );
}
