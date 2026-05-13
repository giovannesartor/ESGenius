"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Leaf,
  Users,
  Building2,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  Trash2,
  Loader2,
  FlaskConical,
  BarChart3,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/hooks/useCompany";
import { analyticsApi } from "@/services/api";

interface SimAction {
  id: string;
  pillar: string;
  indicator: string;
  delta_percent: number;
}

interface SimResult {
  current_score: number;
  simulated_score: number;
  delta: number;
  current_grade: string;
  simulated_grade: string;
  pillar_deltas: {
    E?: number;
    S?: number;
    G?: number;
  };
  recommendations?: string[];
}

const PILLAR_CONFIG = {
  E: { label: "Environmental", icon: Leaf, color: "text-brand-green", bg: "bg-brand-green/10" },
  S: { label: "Social", icon: Users, color: "text-brand-blue", bg: "bg-brand-blue/10" },
  G: { label: "Governance", icon: Building2, color: "text-brand-gold", bg: "bg-brand-gold/10" },
};

const COMMON_INDICATORS = {
  E: ["Greenhouse Gas Emissions", "Energy Consumption", "Water Usage", "Waste Generation", "Renewable Energy"],
  S: ["Employee Diversity", "Health & Safety Incidents", "Training Hours", "Community Investment", "Gender Pay Gap"],
  G: ["Board Independence", "ESG Policy Coverage", "Audit Quality", "Anti-corruption Programs", "Transparency Score"],
};

function getGradeColor(grade: string) {
  if (grade === "A+" || grade === "A") return "text-brand-green";
  if (grade === "B+" || grade === "B") return "text-brand-blue";
  if (grade === "C+" || grade === "C") return "text-brand-gold";
  return "text-destructive";
}

export default function SimulatePage() {
  const t = useTranslations();
  const { token } = useAuth();
  const { company } = useCompany();

  const [actions, setActions] = useState<SimAction[]>([
    { id: "1", pillar: "E", indicator: "Greenhouse Gas Emissions", delta_percent: -20 },
  ]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimResult | null>(null);
  const [error, setError] = useState("");

  const addAction = () => {
    setActions((prev) => [
      ...prev,
      { id: String(Date.now()), pillar: "E", indicator: "", delta_percent: 10 },
    ]);
  };

  const removeAction = (id: string) => {
    setActions((prev) => prev.filter((a) => a.id !== id));
  };

  const updateAction = (id: string, field: keyof SimAction, value: string | number) => {
    setActions((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        if (field === "pillar") {
          return { ...a, pillar: value as string, indicator: "" };
        }
        return { ...a, [field]: value };
      })
    );
  };

  const handleSimulate = async () => {
    if (!token || !company) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const payload = actions.map((a) => ({
        pillar: a.pillar,
        indicator: a.indicator,
        delta_percent: a.delta_percent,
      }));
      const res = await analyticsApi.simulate(token, company.id, payload, year) as SimResult;
      setResult(res);
    } catch {
      setError("Failed to run simulation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FlaskConical className="h-6 w-6 text-brand-blue" />
          What-If Simulation
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("dashboard.simulateSubtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Actions panel */}
        <div className="space-y-4">
          <Card className="border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{t("dashboard.simulationActions")}</CardTitle>
                <div className="flex gap-2">
                  <Select value={String(year)} onValueChange={(v) => setYear(parseInt(v))}>
                    <SelectTrigger className="w-24 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[0, 1, 2, 3].map((offset) => {
                        const y = new Date().getFullYear() - offset;
                        return <SelectItem key={y} value={String(y)}>{y}</SelectItem>;
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-4">
              {actions.map((action, idx) => {
                const cfg = PILLAR_CONFIG[action.pillar as keyof typeof PILLAR_CONFIG];
                const indicators = COMMON_INDICATORS[action.pillar as keyof typeof COMMON_INDICATORS] || [];
                const isNegative = action.delta_percent < 0;
                return (
                  <div key={action.id} className="border rounded-lg p-4 space-y-3 bg-muted/20">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground">{t("dashboard.actionLabel", { idx: idx + 1 })}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={() => removeAction(action.id)}
                        disabled={actions.length === 1}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">{t("dashboard.pillarLabel")}</Label>
                        <Select
                          value={action.pillar}
                          onValueChange={(v) => updateAction(action.id, "pillar", v)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(PILLAR_CONFIG).map(([k, v]) => (
                              <SelectItem key={k} value={k}>{v.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">{t("dashboard.indicatorLabel")}</Label>
                        <Select
                          value={action.indicator}
                          onValueChange={(v) => updateAction(action.id, "indicator", v)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            {indicators.map((ind) => (
                              <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">{t("dashboard.changeLabel")}</Label>
                        <Badge
                          variant="secondary"
                          className={isNegative ? "text-brand-green bg-brand-green/10" : "text-brand-gold bg-brand-gold/10"}
                        >
                          {action.delta_percent > 0 ? "+" : ""}{action.delta_percent}%
                        </Badge>
                      </div>
                      <Slider
                        value={[action.delta_percent]}
                        min={-80}
                        max={80}
                        step={5}
                        onValueChange={([v]) => updateAction(action.id, "delta_percent", v)}
                        className="w-full"
                      />
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>-80% (reduce)</span>
                        <span>+80% (increase)</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={addAction} className="flex-1">
                  <Plus className="mr-2 h-4 w-4" />
                  {t("dashboard.addAction")}
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={handleSimulate}
                  disabled={loading || actions.some((a) => !a.indicator) || !company}
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="mr-2 h-4 w-4" />
                  )}
                  {t("dashboard.runSimulation")}
                </Button>
              </div>
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2">
                  <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                  <p className="text-xs text-destructive">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Results panel */}
        <div className="space-y-4">
          {!result && !loading && (
            <Card className="border-dashed border-border/50">
              <CardContent className="py-16 flex flex-col items-center gap-3 text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  {t("dashboard.runSimulationHint")}
                </p>
              </CardContent>
            </Card>
          )}

          {loading && (
            <Card className="border-border/50">
              <CardContent className="py-16 flex flex-col items-center gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-brand-blue" />
                <p className="text-sm text-muted-foreground">{t("dashboard.runningSimulation")}</p>
              </CardContent>
            </Card>
          )}

          {result && !loading && (
            <>
              {/* Score comparison */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-base">{t("dashboard.scoreImpact")}</CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{t("dashboard.currentLabel")}</p>
                      <p className="text-3xl font-bold">{result.current_score.toFixed(1)}</p>
                      <p className={`text-sm font-semibold ${getGradeColor(result.current_grade)}`}>
                        {result.current_grade}
                      </p>
                    </div>
                    <div className="flex flex-col items-center justify-center">
                      {result.delta > 0 ? (
                        <TrendingUp className="h-8 w-8 text-brand-green" />
                      ) : result.delta < 0 ? (
                        <TrendingDown className="h-8 w-8 text-destructive" />
                      ) : (
                        <Minus className="h-8 w-8 text-muted-foreground" />
                      )}
                      <Badge
                        variant="secondary"
                        className={result.delta >= 0 ? "text-brand-green bg-brand-green/10 mt-1" : "text-destructive bg-destructive/10 mt-1"}
                      >
                        {result.delta >= 0 ? "+" : ""}{result.delta.toFixed(1)} pts
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{t("dashboard.projectedLabel")}</p>
                      <p className="text-3xl font-bold">{result.simulated_score.toFixed(1)}</p>
                      <p className={`text-sm font-semibold ${getGradeColor(result.simulated_grade)}`}>
                        {result.simulated_grade}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pillar deltas */}
              {result.pillar_deltas && (
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-base">{t("dashboard.pillarImpactBreakdown")}</CardTitle>
                  </CardHeader>
                  <CardContent className="px-6 pb-6 space-y-3">
                    {Object.entries(result.pillar_deltas).map(([pillar, delta]) => {
                      const cfg = PILLAR_CONFIG[pillar as keyof typeof PILLAR_CONFIG];
                      if (!cfg) return null;
                      return (
                        <div key={pillar} className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${cfg.bg}`}>
                            <cfg.icon className={`h-4 w-4 ${cfg.color}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-medium">{cfg.label}</p>
                              <Badge
                                variant="secondary"
                                className={(delta ?? 0) >= 0 ? "text-brand-green bg-brand-green/10" : "text-destructive bg-destructive/10"}
                              >
                                {(delta ?? 0) >= 0 ? "+" : ""}{(delta ?? 0).toFixed(1)} pts
                              </Badge>
                            </div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${(delta ?? 0) >= 0 ? "bg-brand-green" : "bg-destructive"}`}
                                style={{ width: `${Math.min(Math.abs((delta ?? 0) / 10) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {/* Recommendations */}
              {result.recommendations && result.recommendations.length > 0 && (
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-base">{t("dashboard.aiRecommendations")}</CardTitle>
                  </CardHeader>
                  <CardContent className="px-6 pb-6">
                    <ul className="space-y-2">
                      {result.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Zap className="h-4 w-4 text-brand-gold shrink-0 mt-0.5" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
