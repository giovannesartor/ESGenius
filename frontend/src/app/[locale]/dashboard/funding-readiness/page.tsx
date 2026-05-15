"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/hooks/useCompany";
import { fundingReadinessApi, type FundingReadiness } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Banknote, CheckCircle2, AlertTriangle, XCircle, Loader2 } from "lucide-react";

const INSTRUMENTS = [
  { code: "SLL", label: "Sustainability-Linked Loan" },
  { code: "GREEN_BOND", label: "Green Bond" },
  { code: "IPO_ESG", label: "IPO" },
  { code: "M&A", label: "M&A / Sale" },
  { code: "PE", label: "PE / VC" },
];

function statusBadge(status: string) {
  if (status === "green") return <Badge className="bg-emerald-500 text-white">Ready</Badge>;
  if (status === "amber") return <Badge className="bg-amber-500 text-white">In progress</Badge>;
  return <Badge variant="destructive">Not ready</Badge>;
}

export default function FundingReadinessPage() {
  const { token } = useAuth();
  const { company } = useCompany();
  const [active, setActive] = useState("SLL");
  const [data, setData] = useState<Record<string, FundingReadiness | null>>({});
  const [loading, setLoading] = useState(false);

  const assess = async (instrument: string) => {
    if (!token || !company?.id) return;
    setLoading(true);
    try {
      const r = await fundingReadinessApi.assess(token, company.id, instrument);
      setData((d) => ({ ...d, [instrument]: r }));
    } finally {
      setLoading(false);
    }
  };

  const current = data[active];

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Banknote className="size-7 text-emerald-500" /> Funding Readiness Cockpit
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Self-assessment per instrument with explicit remediation plan and pricing benefit.
          </p>
        </div>
        <Button onClick={() => assess(active)} disabled={loading || !company?.id}>
          {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          Assess {INSTRUMENTS.find((i) => i.code === active)?.label}
        </Button>
      </div>

      <Tabs value={active} onValueChange={setActive}>
        <TabsList className="flex-wrap">
          {INSTRUMENTS.map((i) => (
            <TabsTrigger key={i.code} value={i.code}>
              {i.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {!current && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Click <strong>Assess</strong> to compute readiness for this instrument.
          </CardContent>
        </Card>
      )}

      {current && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardDescription>Overall readiness</CardDescription>
                <CardTitle className="flex items-center gap-3 text-4xl">
                  {current.overall_score.toFixed(0)}%
                  {statusBadge(current.status)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={current.overall_score} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Open gaps</CardDescription>
                <CardTitle className="text-4xl text-amber-600">{current.gaps.length}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Items below 60% completion require attention.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Estimated pricing benefit</CardDescription>
                <CardTitle className="text-4xl">
                  {current.estimated_pricing_benefit_bps != null
                    ? `${current.estimated_pricing_benefit_bps.toFixed(0)} bps`
                    : "—"}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Projected spread improvement after remediation.
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Checklist</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {current.checklist.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 rounded border p-3">
                    {item.completion_pct >= 80 ? (
                      <CheckCircle2 className="size-5 shrink-0 text-emerald-500" />
                    ) : item.completion_pct >= 50 ? (
                      <AlertTriangle className="size-5 shrink-0 text-amber-500" />
                    ) : (
                      <XCircle className="size-5 shrink-0 text-red-500" />
                    )}
                    <div className="flex-1">
                      <div className="text-sm font-medium">{item.label}</div>
                      <Progress value={item.completion_pct} className="mt-1 h-1.5" />
                    </div>
                    <div className="w-16 text-right text-xs text-muted-foreground">
                      {item.completion_pct.toFixed(0)}% · w{item.weight}
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {current.remediation_plan.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Remediation plan</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {current.remediation_plan.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-3 rounded border p-3 text-sm">
                      <span>{p.action}</span>
                      <span className="text-xs text-muted-foreground">
                        {p.effort_weeks}w · {p.owner_suggested}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
