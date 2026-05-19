"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Brain, TrendingUp, Zap, Globe } from "lucide-react";
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
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/services/api";

const PIE_COLORS = ["hsl(var(--primary))", "#60a5fa", "#a78bfa", "#34d399", "#f87171"];

interface AILogItem {
  id: string;
  timestamp: string;
  user: string;
  type: string;
  status: string;
  model: string;
  tokens_total: number;
  latency_ms: number;
  cost_usd: number;
}

interface AIStats {
  success_rate: number;
  total_tokens: number;
  avg_latency_ms: number;
}

function aggregateByEndpoint(items: AILogItem[]) {
  const map: Record<string, { calls: number; total_latency: number; total_cost: number; success: number }> = {};
  for (const item of items) {
    if (!map[item.type]) map[item.type] = { calls: 0, total_latency: 0, total_cost: 0, success: 0 };
    map[item.type].calls++;
    map[item.type].total_latency += item.latency_ms || 0;
    map[item.type].total_cost += item.cost_usd || 0;
    if (item.status === "success") map[item.type].success++;
  }
  return Object.entries(map).map(([endpoint, v]) => ({
    endpoint,
    calls: v.calls,
    avg_latency_ms: Math.round(v.total_latency / v.calls),
    cost: parseFloat(v.total_cost.toFixed(4)),
    success_rate: parseFloat(((v.success / v.calls) * 100).toFixed(1)),
  }));
}

function aggregateByModel(items: AILogItem[]) {
  const map: Record<string, number> = {};
  for (const item of items) {
    if (!item.model) continue;
    map[item.model] = (map[item.model] || 0) + 1;
  }
  const total = Object.values(map).reduce((a, b) => a + b, 0);
  return Object.entries(map).map(([name, count]) => ({
    name,
    value: total > 0 ? Math.round((count / total) * 100) : 0,
  }));
}

function aggregateByMonth(items: AILogItem[]) {
  const map: Record<string, { calls: number; cost: number }> = {};
  for (const item of items) {
    const month = new Date(item.timestamp).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
    if (!map[month]) map[month] = { calls: 0, cost: 0 };
    map[month].calls++;
    map[month].cost += item.cost_usd || 0;
  }
  return Object.entries(map).map(([month, v]) => ({ month, calls: v.calls, cost: parseFloat(v.cost.toFixed(2)) }));
}

export default function AdminIntelligencePage() {
  const t = useTranslations("admin");
  const { token } = useAuth();
  const [items, setItems] = useState<AILogItem[]>([]);
  const [stats, setStats] = useState<AIStats>({ success_rate: 0, total_tokens: 0, avg_latency_ms: 0 });
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState("30d");

  useEffect(() => {
    if (!token) return;
    adminApi.listAILogs(token, { limit: 200 })
      .then((res) => {
        const r = res as { items?: AILogItem[]; stats?: AIStats };
        setItems(r.items ?? []);
        if (r.stats) setStats(r.stats);
      })
      .catch(() => { setItems([]); })
      .finally(() => setLoading(false));
  }, [token]);

  const endpointStats = aggregateByEndpoint(items);
  const modelDistribution = aggregateByModel(items);
  const monthlyData = aggregateByMonth(items);
  const totalCost = items.reduce((s, m) => s + (m.cost_usd || 0), 0);

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

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: t("intelligence.kpi.totalCalls"), value: items.length.toLocaleString(), icon: Zap, color: "text-primary" },
              { label: t("intelligence.kpi.totalCost"), value: `$${totalCost.toFixed(2)}`, icon: TrendingUp, color: "text-blue-500" },
              { label: t("intelligence.kpi.avgLatency"), value: `${Math.round(stats.avg_latency_ms)}ms`, icon: Brain, color: "text-purple-500" },
              { label: t("intelligence.kpi.modelsActive"), value: modelDistribution.length.toString(), icon: Globe, color: "text-green-500" },
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
                {monthlyData.length === 0 ? (
                  <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">{t("intelligence.noData")}</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="calls" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} name="API calls" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Model distribution */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t("intelligence.chart.modelDistribution")}</CardTitle>
              </CardHeader>
              <CardContent>
                {modelDistribution.length === 0 ? (
                  <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">{t("intelligence.noData")}</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={modelDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${value}%`}>
                        {modelDistribution.map((_, idx) => (
                          <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Per-endpoint stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("intelligence.endpoints.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              {endpointStats.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">{t("intelligence.noData")}</p>
              ) : (
                <div className="space-y-3">
                  {endpointStats.map((ep) => (
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
                        <p className="text-sm font-semibold">${ep.cost.toFixed(4)}</p>
                        <p className="text-xs text-muted-foreground">cost</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
    </div>
  );
}
