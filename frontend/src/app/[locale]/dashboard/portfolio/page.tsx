"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/hooks/useCompany";
import {
  portfolioApi,
  type Portfolio,
  type PortfolioHolding,
  type PortfolioAggregate,
} from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, Plus, RefreshCw, Loader2 } from "lucide-react";

function fmtUsd(v: number | null | undefined) {
  if (v == null) return "—";
  if (Math.abs(v) >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  return `$${v.toLocaleString()}`;
}

export default function PortfolioPage() {
  const { token } = useAuth();
  const { company } = useCompany();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [aggregate, setAggregate] = useState<PortfolioAggregate | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [holdingName, setHoldingName] = useState("");
  const [holdingWeight, setHoldingWeight] = useState<number>(0);

  const loadPortfolios = useCallback(async () => {
    if (!token || !company?.id) return;
    const r = await portfolioApi.list(token, company.id);
    setPortfolios(r.items);
    if (r.items.length && !activeId) setActiveId(r.items[0].id);
  }, [token, company?.id, activeId]);

  const loadDetails = useCallback(async () => {
    if (!token || !company?.id || !activeId) return;
    setLoading(true);
    try {
      const [hs, ag] = await Promise.all([
        portfolioApi.listHoldings(token, company.id, activeId),
        portfolioApi.aggregate(token, company.id, activeId).catch(() => null),
      ]);
      setHoldings(hs.items);
      setAggregate(ag);
    } finally {
      setLoading(false);
    }
  }, [token, company?.id, activeId]);

  useEffect(() => {
    void loadPortfolios();
  }, [loadPortfolios]);
  useEffect(() => {
    void loadDetails();
  }, [loadDetails]);

  const createPortfolio = async () => {
    if (!token || !company?.id || !newName) return;
    setCreating(true);
    try {
      const p = await portfolioApi.create(token, company.id, { name: newName, portfolio_type: "equity" });
      setNewName("");
      setPortfolios((ps) => [...ps, p]);
      setActiveId(p.id);
    } finally {
      setCreating(false);
    }
  };

  const refresh = async () => {
    if (!token || !company?.id || !activeId) return;
    setLoading(true);
    try {
      await portfolioApi.refresh(token, company.id, activeId);
      await loadDetails();
    } finally {
      setLoading(false);
    }
  };

  const addHolding = async () => {
    if (!token || !company?.id || !activeId || !holdingName) return;
    await portfolioApi.addHolding(token, company.id, activeId, {
      company_name: holdingName,
      weight_pct: holdingWeight,
    });
    setHoldingName("");
    setHoldingWeight(0);
    await loadDetails();
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Briefcase className="size-7 text-blue-500" /> Portfolio Intelligence
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Buy-side view: aggregate ESG score, climate VaR, and contributors across holdings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {portfolios.length > 0 && (
            <Select value={activeId ?? undefined} onValueChange={setActiveId}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Select portfolio" />
              </SelectTrigger>
              <SelectContent>
                {portfolios.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button onClick={refresh} disabled={loading || !activeId}>
            {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <RefreshCw className="mr-2 size-4" />}
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">New portfolio</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <Label>Name</Label>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="ESG Equity Fund" />
          </div>
          <Button onClick={createPortfolio} disabled={creating || !newName}>
            <Plus className="mr-2 size-4" /> Create
          </Button>
        </CardContent>
      </Card>

      {aggregate && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader>
              <CardDescription>Weighted score</CardDescription>
              <CardTitle className="text-3xl">{aggregate.weighted_score.toFixed(1)}</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge>{aggregate.rating_band}</Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Weighted spread</CardDescription>
              <CardTitle className="text-3xl">
                {aggregate.weighted_spread_bps >= 0 ? "+" : ""}
                {aggregate.weighted_spread_bps.toFixed(0)} bps
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Climate VaR</CardDescription>
              <CardTitle className="text-3xl">{aggregate.weighted_climate_var_pct.toFixed(2)}%</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Coverage</CardDescription>
              <CardTitle className="text-3xl">{aggregate.coverage_pct.toFixed(0)}%</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {aggregate.holdings_count} holdings
            </CardContent>
          </Card>
        </div>
      )}

      {activeId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add holding</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <Label>Company name</Label>
              <Input value={holdingName} onChange={(e) => setHoldingName(e.target.value)} />
            </div>
            <div className="w-32">
              <Label>Weight %</Label>
              <Input
                type="number"
                step="0.1"
                value={holdingWeight}
                onChange={(e) => setHoldingWeight(Number(e.target.value))}
              />
            </div>
            <Button onClick={addHolding} disabled={!holdingName}>
              <Plus className="mr-2 size-4" /> Add
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Holdings</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 pr-3">Company</th>
                <th className="py-2 pr-3">Ticker</th>
                <th className="py-2 pr-3">Sector</th>
                <th className="py-2 pr-3 text-right">Weight</th>
                <th className="py-2 pr-3 text-right">MV</th>
                <th className="py-2 pr-3 text-right">ESG</th>
                <th className="py-2 pr-3 text-right">Climate VaR%</th>
              </tr>
            </thead>
            <tbody>
              {holdings.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-muted-foreground">
                    No holdings.
                  </td>
                </tr>
              )}
              {holdings.map((h) => (
                <tr key={h.id} className="border-b">
                  <td className="py-2 pr-3 font-medium">{h.company_name}</td>
                  <td className="py-2 pr-3">{h.ticker ?? "—"}</td>
                  <td className="py-2 pr-3">{h.sector ?? "—"}</td>
                  <td className="py-2 pr-3 text-right">{h.weight_pct.toFixed(2)}%</td>
                  <td className="py-2 pr-3 text-right">{fmtUsd(h.market_value_usd)}</td>
                  <td className="py-2 pr-3 text-right">{h.last_esg_score?.toFixed(1) ?? "—"}</td>
                  <td className="py-2 pr-3 text-right">{h.last_climate_var_pct?.toFixed(2) ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {aggregate && (aggregate.top_contributors.length > 0 || aggregate.bottom_contributors.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          <ContributorList title="Top contributors" items={aggregate.top_contributors} />
          <ContributorList title="Bottom contributors" items={aggregate.bottom_contributors} negative />
        </div>
      )}
    </div>
  );
}

function ContributorList({
  title,
  items,
  negative,
}: {
  title: string;
  items: PortfolioAggregate["top_contributors"];
  negative?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">
          {items.map((c, i) => (
            <li key={i} className="flex items-center justify-between gap-2">
              <span className="truncate">{c.company_name} {c.ticker ? `(${c.ticker})` : ""}</span>
              <Badge variant={negative ? "destructive" : "default"}>
                {c.esg_score.toFixed(1)} · {c.weight_pct.toFixed(1)}%
              </Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
