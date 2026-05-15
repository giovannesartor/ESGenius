"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/hooks/useCompany";
import { emissionsApi } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Cloud, Calculator, Loader2 } from "lucide-react";

interface CalcResult {
  co2e_kg: number;
  co2e_tonnes: number;
  factor_used: number;
  factor_unit: string;
  factor_source: string;
  scope: number;
}

interface Summary {
  year: number;
  total_kg: number;
  total_tonnes: number;
  scope_1_kg: number;
  scope_2_kg: number;
  scope_3_kg: number;
  by_category: Record<string, number>;
}

const PRESETS = {
  1: [
    { category: "stationary_combustion", activity: "natural_gas", unit: "m3" },
    { category: "stationary_combustion", activity: "diesel", unit: "L" },
    { category: "mobile_combustion", activity: "gasoline", unit: "L" },
    { category: "mobile_combustion", activity: "ethanol", unit: "L" },
  ],
  2: [
    { category: "electricity", activity: "grid_electricity", unit: "kWh" },
    { category: "heat", activity: "purchased_steam", unit: "kWh" },
  ],
  3: [
    { category: "business_travel", activity: "flight_short_haul", unit: "km" },
    { category: "business_travel", activity: "flight_long_haul", unit: "km" },
    { category: "transportation", activity: "freight_truck", unit: "tkm" },
    { category: "waste", activity: "landfill", unit: "kg" },
    { category: "water", activity: "supply", unit: "m3" },
  ],
} as const;

export default function EmissionsPage() {
  const { token } = useAuth();
  const { company } = useCompany();
  const [scope, setScope] = useState<1 | 2 | 3>(1);
  const [presetIdx, setPresetIdx] = useState(0);
  const [quantity, setQuantity] = useState<number>(0);
  const [region, setRegion] = useState<string>("");
  const [result, setResult] = useState<CalcResult | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [recording, setRecording] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const year = new Date().getFullYear();

  const preset = PRESETS[scope][presetIdx];

  useEffect(() => {
    if (!token || !company?.id) return;
    emissionsApi.summary(token, company.id, year).then(setSummary).catch(() => setSummary(null));
  }, [token, company?.id, year]);

  const calculate = async () => {
    if (!token || quantity <= 0) return;
    setCalculating(true);
    try {
      const r = await emissionsApi.calculate(token, {
        scope,
        category: preset.category,
        activity: preset.activity,
        quantity,
        unit: preset.unit,
        region: region || undefined,
      });
      setResult(r as CalcResult);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setCalculating(false);
    }
  };

  const record = async () => {
    if (!token || !company?.id || !result) return;
    setRecording(true);
    try {
      await emissionsApi.record(token, company.id, year, {
        scope,
        category: preset.category,
        activity: preset.activity,
        quantity,
        unit: preset.unit,
        region: region || undefined,
      });
      const s = await emissionsApi.summary(token, company.id, year);
      setSummary(s);
      setResult(null);
      setQuantity(0);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setRecording(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Cloud className="h-6 w-6 text-emerald-500" /> Carbon Emissions
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Calculate and track Scope 1/2/3 emissions per GHG Protocol & IPCC AR6.
        </p>
      </div>

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <Card><CardContent className="p-4">
            <div className="text-[11px] uppercase text-muted-foreground">Total {year}</div>
            <div className="text-2xl font-bold">{summary.total_tonnes.toFixed(2)} tCO₂e</div>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <div className="text-[11px] uppercase text-muted-foreground">Scope 1</div>
            <div className="text-xl font-semibold">{(summary.scope_1_kg / 1000).toFixed(2)} t</div>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <div className="text-[11px] uppercase text-muted-foreground">Scope 2</div>
            <div className="text-xl font-semibold">{(summary.scope_2_kg / 1000).toFixed(2)} t</div>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <div className="text-[11px] uppercase text-muted-foreground">Scope 3</div>
            <div className="text-xl font-semibold">{(summary.scope_3_kg / 1000).toFixed(2)} t</div>
          </CardContent></Card>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2">
          <Calculator className="h-4 w-4" /> Calculator
        </CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <Label>Scope</Label>
              <Select value={String(scope)} onValueChange={(v) => { setScope(Number(v) as 1|2|3); setPresetIdx(0); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Scope 1 (direct)</SelectItem>
                  <SelectItem value="2">Scope 2 (energy)</SelectItem>
                  <SelectItem value="3">Scope 3 (value chain)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Activity</Label>
              <Select value={String(presetIdx)} onValueChange={(v) => setPresetIdx(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRESETS[scope].map((p, i) => (
                    <SelectItem key={i} value={String(i)}>
                      {p.category} · {p.activity} ({p.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Region</Label>
              <Select value={region || "auto"} onValueChange={(v) => setRegion(v === "auto" ? "" : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="BR">Brazil</SelectItem>
                  <SelectItem value="EU">Europe</SelectItem>
                  <SelectItem value="US">United States</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="md:col-span-2">
              <Label>Quantity ({preset.unit})</Label>
              <Input type="number" min={0} step="any" value={quantity || ""}
                onChange={(e) => setQuantity(Number(e.target.value))} />
            </div>
            <Button onClick={calculate} disabled={calculating || !quantity}>
              {calculating && <Loader2 className="h-3 w-3 animate-spin mr-2" />} Calculate
            </Button>
          </div>

          {result && (
            <Card className="bg-emerald-500/5 border-emerald-500/30">
              <CardContent className="p-4 space-y-2">
                <div className="text-2xl font-bold text-emerald-500">
                  {result.co2e_tonnes.toFixed(4)} tCO₂e
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({result.co2e_kg.toFixed(2)} kg)
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Factor: {result.factor_used} {result.factor_unit} · Source: {result.factor_source}
                </div>
                <Button onClick={record} disabled={recording} variant="default" size="sm">
                  {recording && <Loader2 className="h-3 w-3 animate-spin mr-2" />}
                  Record this emission
                </Button>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {summary && Object.keys(summary.by_category).length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Breakdown by category</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {Object.entries(summary.by_category)
                .sort(([, a], [, b]) => b - a)
                .map(([cat, kg]) => (
                  <div key={cat} className="flex justify-between text-sm border-b border-border/40 py-1">
                    <span className="font-medium">{cat}</span>
                    <span className="text-muted-foreground">{(kg / 1000).toFixed(3)} t</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
