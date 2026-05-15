"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/hooks/useCompany";
import { creditIntelligenceApi, type CreditAssessment } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Landmark, Loader2 } from "lucide-react";

interface BookImpact {
  book_size_usd: number;
  expected_loss_delta_usd: number;
  avg_pd_shift_pct: number;
  counterparties: number;
}

function fmtUsd(v: number) {
  if (Math.abs(v) >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  if (Math.abs(v) >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
}

export default function CreditIntelligencePage() {
  const { token } = useAuth();
  const { company } = useCompany();
  const [items, setItems] = useState<CreditAssessment[]>([]);
  const [impact, setImpact] = useState<BookImpact | null>(null);
  const [name, setName] = useState("");
  const [pd, setPd] = useState(0.02);
  const [lgd, setLgd] = useState(0.45);
  const [exposure, setExposure] = useState(1_000_000);
  const [explicit, setExplicit] = useState<number | "">("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!token || !company?.id) return;
    const r = await creditIntelligenceApi.list(token, company.id);
    setItems(r.items);
    setImpact(r.book_impact);
  }, [token, company?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async () => {
    if (!token || !company?.id || !name) return;
    setBusy(true);
    try {
      await creditIntelligenceApi.assess(token, company.id, {
        counterparty_name: name,
        base_pd: pd,
        base_lgd: lgd,
        exposure_usd: exposure,
        explicit_esg_score: typeof explicit === "number" ? explicit : undefined,
      });
      setName("");
      await load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Landmark className="size-7 text-indigo-500" /> Credit Intelligence
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          ESG-adjusted PD &amp; LGD per counterparty. Designed for bank credit teams.
        </p>
      </div>

      {impact && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader>
              <CardDescription>Book size</CardDescription>
              <CardTitle className="text-2xl">{fmtUsd(impact.book_size_usd)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Expected loss Δ</CardDescription>
              <CardTitle
                className={`text-2xl ${impact.expected_loss_delta_usd >= 0 ? "text-red-600" : "text-emerald-600"}`}
              >
                {impact.expected_loss_delta_usd >= 0 ? "+" : ""}
                {fmtUsd(impact.expected_loss_delta_usd)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Avg PD shift</CardDescription>
              <CardTitle className="text-2xl">
                {impact.avg_pd_shift_pct >= 0 ? "+" : ""}
                {impact.avg_pd_shift_pct.toFixed(2)}%
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Counterparties</CardDescription>
              <CardTitle className="text-2xl">{impact.counterparties}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assess counterparty</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-5">
          <div className="md:col-span-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Corp" />
          </div>
          <div>
            <Label>Base PD</Label>
            <Input type="number" step="0.001" value={pd} onChange={(e) => setPd(Number(e.target.value))} />
          </div>
          <div>
            <Label>Base LGD</Label>
            <Input type="number" step="0.01" value={lgd} onChange={(e) => setLgd(Number(e.target.value))} />
          </div>
          <div>
            <Label>Exposure (USD)</Label>
            <Input
              type="number"
              value={exposure}
              onChange={(e) => setExposure(Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Explicit ESG score (opt.)</Label>
            <Input
              type="number"
              value={explicit}
              onChange={(e) => setExplicit(e.target.value === "" ? "" : Number(e.target.value))}
            />
          </div>
          <div className="md:col-span-5">
            <Button onClick={submit} disabled={busy || !name}>
              {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Assess
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent assessments</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 pr-3">Counterparty</th>
                <th className="py-2 pr-3 text-right">Base PD</th>
                <th className="py-2 pr-3 text-right">Adj PD</th>
                <th className="py-2 pr-3 text-right">Δ bps</th>
                <th className="py-2 pr-3 text-right">Exposure</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-muted-foreground">
                    No assessments.
                  </td>
                </tr>
              )}
              {items.map((it) => (
                <tr key={it.id} className="border-b">
                  <td className="py-2 pr-3 font-medium">{it.counterparty_name}</td>
                  <td className="py-2 pr-3 text-right">{(it.base_pd * 100).toFixed(2)}%</td>
                  <td className="py-2 pr-3 text-right">{(it.adjusted_pd * 100).toFixed(2)}%</td>
                  <td className="py-2 pr-3 text-right">
                    <Badge variant={it.esg_adjustment_bps >= 0 ? "destructive" : "default"}>
                      {it.esg_adjustment_bps >= 0 ? "+" : ""}
                      {it.esg_adjustment_bps.toFixed(0)}
                    </Badge>
                  </td>
                  <td className="py-2 pr-3 text-right">{it.exposure_usd ? fmtUsd(it.exposure_usd) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
