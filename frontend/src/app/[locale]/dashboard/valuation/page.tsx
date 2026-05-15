"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/hooks/useCompany";
import { valuationApi, type ValuationResult } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, Loader2 } from "lucide-react";

function fmtUsd(v: number | null | undefined) {
  if (v == null) return "—";
  if (Math.abs(v) >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  return `$${v.toFixed(0)}`;
}

function fmtPct(v: number | null | undefined, digits = 2) {
  if (v == null) return "—";
  return `${(v * 100).toFixed(digits)}%`;
}

export default function ValuationPage() {
  const { token } = useAuth();
  const { company } = useCompany();
  const [wacc, setWacc] = useState(0.085);
  const [beta, setBeta] = useState(1.0);
  const [growth, setGrowth] = useState(0.025);
  const [fcf, setFcf] = useState(10_000_000);
  const [explicit, setExplicit] = useState<number | "">("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ValuationResult | null>(null);

  const compute = async () => {
    if (!token || !company?.id) return;
    setBusy(true);
    try {
      const r = await valuationApi.compute(token, company.id, {
        base_wacc: wacc,
        base_beta: beta,
        base_terminal_growth: growth,
        free_cash_flow_usd: fcf,
        explicit_score: typeof explicit === "number" ? explicit : undefined,
      });
      setResult(r);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Calculator className="size-7 text-violet-500" /> Valuation Impact
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          ESG-adjusted WACC, beta, terminal growth and enterprise value via two-stage DCF.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Inputs</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-5">
          <div>
            <Label>Base WACC</Label>
            <Input type="number" step="0.001" value={wacc} onChange={(e) => setWacc(Number(e.target.value))} />
          </div>
          <div>
            <Label>Base β</Label>
            <Input type="number" step="0.05" value={beta} onChange={(e) => setBeta(Number(e.target.value))} />
          </div>
          <div>
            <Label>Terminal growth</Label>
            <Input type="number" step="0.001" value={growth} onChange={(e) => setGrowth(Number(e.target.value))} />
          </div>
          <div>
            <Label>FCF (USD)</Label>
            <Input type="number" value={fcf} onChange={(e) => setFcf(Number(e.target.value))} />
          </div>
          <div>
            <Label>Explicit score (opt.)</Label>
            <Input
              type="number"
              value={explicit}
              onChange={(e) => setExplicit(e.target.value === "" ? "" : Number(e.target.value))}
            />
          </div>
          <div className="md:col-span-5">
            <Button onClick={compute} disabled={busy || !company?.id}>
              {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Compute
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Compare label="WACC" base={fmtPct(result.base_wacc)} adj={fmtPct(result.esg_adjusted_wacc)} />
            <Compare label="Beta" base={result.base_beta?.toFixed(2)} adj={result.esg_adjusted_beta?.toFixed(2)} />
            <Compare
              label="Terminal growth"
              base={fmtPct(result.base_terminal_growth)}
              adj={fmtPct(result.esg_adjusted_terminal_growth)}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardDescription>Enterprise value</CardDescription>
                <CardTitle className="text-2xl">
                  {fmtUsd(result.base_enterprise_value_usd)} → {fmtUsd(result.esg_adjusted_enterprise_value_usd)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Δ EV</CardDescription>
                <CardTitle
                  className={`text-3xl ${
                    result.delta_pct != null && result.delta_pct >= 0 ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {result.delta_pct != null
                    ? `${result.delta_pct >= 0 ? "+" : ""}${result.delta_pct.toFixed(2)}%`
                    : "—"}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function Compare({ label, base, adj }: { label: string; base?: string; adj?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">
          <span className="text-muted-foreground">{base ?? "—"}</span>
          <span className="mx-2">→</span>
          <span>{adj ?? "—"}</span>
        </CardTitle>
      </CardHeader>
    </Card>
  );
}
