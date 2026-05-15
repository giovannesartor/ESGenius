"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/hooks/useCompany";
import { maccApi, type AbatementOption, type MaccCurve } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, Plus, Trash2, Loader2 } from "lucide-react";

const CATEGORIES = ["energy_efficiency", "renewables", "fleet", "supply_chain", "process", "ccs", "other"];

export default function MaccPage() {
  const { token } = useAuth();
  const { company } = useCompany();
  const [items, setItems] = useState<AbatementOption[]>([]);
  const [curve, setCurve] = useState<MaccCurve | null>(null);
  const [busy, setBusy] = useState(false);

  // form
  const [name, setName] = useState("");
  const [category, setCategory] = useState("energy_efficiency");
  const [scope, setScope] = useState(1);
  const [potential, setPotential] = useState(1000);
  const [cost, setCost] = useState(0);
  const [capex, setCapex] = useState(0);

  const load = useCallback(async () => {
    if (!token || !company?.id) return;
    const r = await maccApi.get(token, company.id);
    setItems(r.items);
    setCurve(r.curve);
  }, [token, company?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async () => {
    if (!token || !company?.id || !name) return;
    setBusy(true);
    try {
      await maccApi.create(token, company.id, {
        name,
        category,
        scope,
        abatement_potential_tco2e: potential,
        cost_per_tonne_usd: cost,
        capex_usd: capex,
        implementation_status: "planned",
      });
      setName("");
      await load();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!token || !company?.id) return;
    await maccApi.remove(token, company.id, id);
    await load();
  };

  // SVG bar chart of curve
  const max = curve ? Math.max(curve.total_abatement_tco2e, 1) : 1;
  const width = 800;
  const height = 240;
  const allCosts = curve?.bars.map((b) => b.cost_per_tonne_usd) ?? [];
  const minCost = Math.min(0, ...allCosts);
  const maxCost = Math.max(50, ...allCosts);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <TrendingDown className="size-7 text-emerald-500" /> Marginal Abatement Cost Curve
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Prioritize emission-reduction options by cost per tonne CO₂e.
        </p>
      </div>

      {curve && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader>
              <CardDescription>Total options</CardDescription>
              <CardTitle className="text-2xl">{curve.total_options}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Total abatement</CardDescription>
              <CardTitle className="text-2xl">{Math.round(curve.total_abatement_tco2e).toLocaleString()} tCO₂e</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Negative-cost potential</CardDescription>
              <CardTitle className="text-2xl text-emerald-600">
                {Math.round(curve.negative_cost_abatement_tco2e).toLocaleString()} tCO₂e
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Weighted avg cost</CardDescription>
              <CardTitle className="text-2xl">${curve.weighted_avg_cost_per_tonne_usd.toFixed(0)}/t</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {curve && curve.bars.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">MACC visualization</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
              {/* zero line */}
              <line
                x1={0}
                x2={width}
                y1={height - ((0 - minCost) / (maxCost - minCost)) * (height - 40) - 20}
                y2={height - ((0 - minCost) / (maxCost - minCost)) * (height - 40) - 20}
                stroke="currentColor"
                strokeOpacity={0.2}
              />
              {curve.bars.map((b) => {
                const x = (b.cumulative_start / max) * width;
                const w = ((b.cumulative_end - b.cumulative_start) / max) * width;
                const zeroY = height - ((0 - minCost) / (maxCost - minCost)) * (height - 40) - 20;
                const valY = height - ((b.cost_per_tonne_usd - minCost) / (maxCost - minCost)) * (height - 40) - 20;
                const y = Math.min(zeroY, valY);
                const h = Math.abs(valY - zeroY);
                const negative = b.cost_per_tonne_usd < 0;
                return (
                  <g key={b.id}>
                    <rect
                      x={x}
                      y={y}
                      width={Math.max(w - 1, 0.5)}
                      height={Math.max(h, 1)}
                      fill={negative ? "rgb(16,185,129)" : "rgb(239,68,68)"}
                      opacity={0.85}
                    >
                      <title>
                        {b.name}: {b.cost_per_tonne_usd.toFixed(0)} $/t · {Math.round(b.abatement_tco2e)} tCO₂e
                      </title>
                    </rect>
                  </g>
                );
              })}
            </svg>
            <p className="mt-2 text-xs text-muted-foreground">
              X = cumulative abatement (tCO₂e) · Y = $/tCO₂e · green = negative cost (savings)
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add abatement option</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-6">
          <div className="md:col-span-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="LED retrofit" />
          </div>
          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Scope</Label>
            <Select value={String(scope)} onValueChange={(v) => setScope(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Abatement (tCO₂e)</Label>
            <Input type="number" value={potential} onChange={(e) => setPotential(Number(e.target.value))} />
          </div>
          <div>
            <Label>$/tCO₂e</Label>
            <Input type="number" value={cost} onChange={(e) => setCost(Number(e.target.value))} />
          </div>
          <div>
            <Label>Capex (USD)</Label>
            <Input type="number" value={capex} onChange={(e) => setCapex(Number(e.target.value))} />
          </div>
          <div className="md:col-span-6">
            <Button onClick={submit} disabled={busy || !name}>
              {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Plus className="mr-2 size-4" />}
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Options</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Category</th>
                <th className="py-2 pr-3">Scope</th>
                <th className="py-2 pr-3 text-right">tCO₂e</th>
                <th className="py-2 pr-3 text-right">$/t</th>
                <th className="py-2 pr-3">Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr><td colSpan={7} className="py-6 text-center text-muted-foreground">No options.</td></tr>
              )}
              {items.map((o) => (
                <tr key={o.id} className="border-b">
                  <td className="py-2 pr-3 font-medium">{o.name}</td>
                  <td className="py-2 pr-3">{o.category}</td>
                  <td className="py-2 pr-3">{o.scope}</td>
                  <td className="py-2 pr-3 text-right">{o.abatement_potential_tco2e.toLocaleString()}</td>
                  <td className="py-2 pr-3 text-right">
                    <Badge variant={o.cost_per_tonne_usd < 0 ? "default" : "destructive"}>
                      ${o.cost_per_tonne_usd.toFixed(0)}
                    </Badge>
                  </td>
                  <td className="py-2 pr-3">{o.implementation_status}</td>
                  <td className="py-2 pr-3 text-right">
                    <Button size="sm" variant="ghost" onClick={() => remove(o.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
