"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Brain, TrendingUp, AlertTriangle, Zap, BarChart3, Globe } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/services/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const MOCK_AI_USAGE = [
  { endpoint: "ESG Analysis", calls: 312, avg_latency_ms: 2400, cost: 24.5, success_rate: 98.1 },
  { endpoint: "Report Generation", calls: 189, avg_latency_ms: 5200, cost: 38.2, success_rate: 97.4 },
  { endpoint: "Climate Risk", calls: 145, avg_latency_ms: 1800, cost: 11.6, success_rate: 99.3 },
  { endpoint: "Knowledge Graph", calls: 98, avg_latency_ms: 3100, cost: 8.9, success_rate: 96.9 },
  { endpoint: "Greenwashing Check", calls: 76, avg_latency_ms: 1200, cost: 5.2, success_rate: 99.8 },
];

const MOCK_MODEL_DISTRIBUTION = [
  { name: "DeepSeek V3", value: 58 },
  { name: "GPT-4o", value: 28 },
  { name: "Claude 3.5", value: 14 },
];

const PIE_COLORS = ["hsl(var(--primary))", "#60a5fa", "#a78bfa"];

const MOCK_MONTHLY_CALLS = [
  { month: "Jan", calls: 420, cost: 32.1 },
  { month: "Fev", calls: 680, cost: 51.8 },
  { month: "Mar", calls: 910, cost: 69.4 },
  { month: "Abr", calls: 1240, cost: 94.6 },
  { month: "Mai", calls: 1580, cost: 120.3 },
  { month: "Jun", calls: 2100, cost: 160.2 },
];

const MOCK_SIGNALS = [
  { sector: "Agropecuária", score_avg: 52, gap: "Biodiversidade", opportunity: "Crédito de carbono", trend: "up" },
  { sector: "Construção Civil", score_avg: 44, gap: "Emissões Escopo 3", opportunity: "Materiais verdes", trend: "up" },
  { sector: "Financeiro", score_avg: 71, gap: "Governança AI", opportunity: "TCFD disclosure", trend: "up" },
  { sector: "Varejo", score_avg: 58, gap: "Cadeia de fornecimento", opportunity: "ESG vendor screening", trend: "neutral" },
];

export default function AdminIntelligencePage() {
  const t = useTranslations("admin");
  const { token } = useAuth();
  const [periodFilter, setPeriodFilter] = useState("30d");
  const [loading] = useState(false);

  const totalCalls = MOCK_AI_USAGE.reduce((s, m) => s + m.calls, 0);
  const totalCost = MOCK_AI_USAGE.reduce((s, m) => s + m.cost, 0);
  const avgLatency = Math.round(MOCK_AI_USAGE.reduce((s, m) => s + m.avg_latency_ms, 0) / MOCK_AI_USAGE.length);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("intelligence.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("intelligence.subtitle")}</p>
        </div>
        <Select value={periodFilter} onValueChange={setPeriodFilter}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="90d">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t("intelligence.kpi.totalCalls"), value: totalCalls.toLocaleString(), icon: Zap, color: "text-primary" },
          { label: t("intelligence.kpi.totalCost"), value: `$${totalCost.toFixed(2)}`, icon: TrendingUp, color: "text-blue-500" },
          { label: t("intelligence.kpi.avgLatency"), value: `${avgLatency}ms`, icon: Brain, color: "text-purple-500" },
          { label: t("intelligence.kpi.modelsActive"), value: MOCK_MODEL_DISTRIBUTION.length.toString(), icon: Globe, color: "text-green-500" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-xl font-bold mt-1">{value}</p>
                </div>
                <Icon className={`h-5 w-5 mt-1 ${color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Monthly AI calls chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("intelligence.chart.monthlyCalls")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={MOCK_MONTHLY_CALLS}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="calls" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} name="API calls" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Model distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("intelligence.chart.modelDistribution")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={MOCK_MODEL_DISTRIBUTION} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${value}%`}>
                  {MOCK_MODEL_DISTRIBUTION.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Per-endpoint stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("intelligence.endpoints.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {MOCK_AI_USAGE.map((ep) => (
              <div key={ep.endpoint} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{ep.endpoint}</p>
                  <div className="flex gap-3 mt-1 flex-wrap">
                    <span className="text-xs text-muted-foreground">{ep.calls} calls</span>
                    <span className="text-xs text-muted-foreground">{ep.avg_latency_ms}ms avg</span>
                    <span className="text-xs text-green-600 dark:text-green-400">{ep.success_rate}% success</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold">${ep.cost.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">cost</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ESG Market Signals */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">{t("intelligence.signals.title")}</CardTitle>
            <Badge variant="secondary" className="text-xs">Beta</Badge>
          </div>
          <p className="text-xs text-muted-foreground">{t("intelligence.signals.subtitle")}</p>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-3">
            {MOCK_SIGNALS.map((signal) => (
              <div key={signal.sector} className="p-3 border border-border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{signal.sector}</p>
                  <Badge className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    Score avg: {signal.score_avg}
                  </Badge>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-orange-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">{t("intelligence.signals.gap")}: {signal.gap}</p>
                </div>
                <div className="flex items-start gap-2">
                  <Zap className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">{t("intelligence.signals.opportunity")}: {signal.opportunity}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
